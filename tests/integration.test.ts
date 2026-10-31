import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "better-auth/crypto";

const origin = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
test("authenticated data, account isolation, request validation and session revocation", async () => {
  const email = `qa-${randomUUID()}@example.com`;
  const password = "Local-integration-test-2026!";
  const userId = randomUUID();
  const user = await db.user.create({
    data: {
      id: userId,
      email,
      name: "Integration test",
      accounts: {
        create: {
          accountId: userId,
          providerId: "credential",
          password: await hashPassword(password),
        },
      },
    },
  });
  let cookie = "";
  const call = (
    path: string,
    method = "GET",
    body?: unknown,
    session = cookie,
    requestOrigin = origin,
  ) =>
    fetch(origin + path, {
      method,
      redirect: "manual",
      headers: {
        Origin: requestOrigin,
        Cookie: session,
        "Content-Type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  try {
    assert.equal((await call("/api/shortlist")).status, 401);
    const protectedPage = await call("/overview");
    const protectedHtml = await protectedPage.text();
    // A streaming layout can send its redirect after the initial 200 headers.
    assert.ok(
      protectedPage.status === 307 ||
        (protectedPage.status === 200 &&
          protectedHtml.includes("NEXT_REDIRECT") &&
          protectedHtml.includes("/login")),
    );
    assert.ok(!protectedHtml.includes("Riverside Exchange"));
    const sharedComparison = await call("/compare?ids=p01,p02");
    const sharedComparisonHtml = await sharedComparison.text();
    let destination: URL;
    if (sharedComparison.status === 307) {
      destination = new URL(sharedComparison.headers.get("location")!, origin);
    } else {
      assert.equal(sharedComparison.status, 200);
      assert.ok(sharedComparisonHtml.includes("NEXT_REDIRECT"));
      const returnTo = sharedComparisonHtml.match(/returnTo=([^"<>;\\\s]+)/);
      assert.ok(returnTo);
      destination = new URL(`/login?returnTo=${returnTo[1]}`, origin);
    }
    assert.equal(destination.pathname, "/login");
    const comparisonDestination = new URL(
      destination.searchParams.get("returnTo")!,
      origin,
    );
    assert.equal(comparisonDestination.pathname, "/compare");
    assert.equal(comparisonDestination.searchParams.get("ids"), "p01,p02");
    assert.ok(!sharedComparisonHtml.includes("Riverside Exchange"));
    assert.equal(
      (
        await call("/api/auth/sign-in/email", "POST", {
          email,
          password: "incorrect",
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await call(
          "/api/auth/sign-in/email",
          "POST",
          { email, password },
          "",
          "https://untrusted.example",
        )
      ).status,
      403,
    );
    const login = await call("/api/auth/sign-in/email", "POST", {
      email,
      password,
    });
    assert.equal(login.status, 200);
    const setCookie = login.headers.get("set-cookie")!;
    assert.match(setCookie, /httponly/i);
    assert.match(setCookie, /samesite=lax/i);
    cookie = setCookie.split(";")[0];
    for (const route of [
      "/overview",
      "/opportunities",
      "/shortlist",
      "/compare",
      "/property/p01",
    ]) {
      assert.equal((await call(route)).status, 200, route);
    }
    assert.equal(
      (await call("/api/shortlist", "PUT", { propertyId: "p01", saved: true }))
        .status,
      200,
    );
    assert.equal(
      (await call("/api/shortlist", "PUT", { propertyId: "p01", saved: true }))
        .status,
      200,
    );
    assert.deepEqual((await (await call("/api/shortlist")).json()).saved, [
      "p01",
    ]);
    assert.equal(await db.shortlist.count({ where: { userId: user.id } }), 1);
    assert.equal(
      (
        await call("/api/shortlist", "PUT", {
          propertyId: "missing",
          saved: true,
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await call("/api/requests", "POST", {
          propertyId: "p01",
          kind: "enquiry",
          email,
          message: "short",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await call("/api/requests", "POST", {
          propertyId: "p03",
          kind: "access",
          email,
          consent: false,
        })
      ).status,
      400,
    );
    const request = await call("/api/requests", "POST", {
      propertyId: "p01",
      kind: "enquiry",
      email,
      message: "Please share further investment details.",
    });
    assert.equal(request.status, 201);
    const { id } = await request.json();
    assert.equal(
      (await db.investmentRequest.findUniqueOrThrow({ where: { id } })).userId,
      user.id,
    );
    assert.equal(
      (
        await call("/api/requests", "POST", {
          propertyId: "p03",
          kind: "access",
          email,
          consent: true,
        })
      ).status,
      201,
    );
    const otherEmail = `qa-${randomUUID()}@example.com`;
    const otherId = randomUUID();
    const other = await db.user.create({
      data: {
        id: otherId,
        email: otherEmail,
        name: "Second integration investor",
        accounts: {
          create: {
            accountId: otherId,
            providerId: "credential",
            password: await hashPassword(password),
          },
        },
      },
    });
    try {
      const otherLogin = await call(
        "/api/auth/sign-in/email",
        "POST",
        { email: otherEmail, password },
        "",
      );
      const otherCookie = otherLogin.headers.get("set-cookie")!.split(";")[0];
      assert.deepEqual(
        (
          await (
            await call("/api/shortlist", "GET", undefined, otherCookie)
          ).json()
        ).saved,
        [],
      );
    } finally {
      await db.user.delete({ where: { id: other.id } });
    }
    assert.equal(
      (await call("/api/shortlist", "PUT", { propertyId: "p01", saved: false }))
        .status,
      200,
    );
    assert.deepEqual((await (await call("/api/shortlist")).json()).saved, []);
    assert.equal((await call("/api/auth/sign-out", "POST", {})).status, 200);
    assert.equal((await call("/api/shortlist")).status, 401);
    assert.equal(await db.session.count({ where: { userId: user.id } }), 0);
  } finally {
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
