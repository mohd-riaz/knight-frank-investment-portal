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
  const confidentialId = `im-test-${randomUUID()}`;
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
    const source = await db.property.findUniqueOrThrow({
      where: { id: "oct24-7-old-park-lane" },
    });
    await db.property.create({
      data: {
        ...source,
        id: confidentialId,
        name: "Confidential IM integration fixture",
        confidential: true,
      },
    });
    assert.equal((await call("/api/shortlist")).status, 401);
    assert.equal(
      (await call("/api/properties/oct24-7-old-park-lane/memorandum")).status,
      401,
    );
    const protectedPage = await call("/overview");
    const protectedHtml = await protectedPage.text();
    // A streaming layout can send its redirect after the initial 200 headers.
    assert.ok(
      protectedPage.status === 307 ||
        (protectedPage.status === 200 &&
          protectedHtml.includes("NEXT_REDIRECT") &&
          protectedHtml.includes("/login")),
    );
    assert.ok(!protectedHtml.includes("7 Old Park Lane"));
    const sharedComparison = await call(
      "/compare?ids=oct24-7-old-park-lane,oct24-88-jermyn-street",
    );
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
    assert.equal(
      comparisonDestination.searchParams.get("ids"),
      "oct24-7-old-park-lane,oct24-88-jermyn-street",
    );
    assert.ok(!sharedComparisonHtml.includes("7 Old Park Lane"));
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
      "/property/oct24-7-old-park-lane",
    ]) {
      assert.equal((await call(route)).status, 200, route);
    }
    assert.equal(
      (
        await call("/api/shortlist", "PUT", {
          propertyId: "oct24-7-old-park-lane",
          saved: true,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await call("/api/shortlist", "PUT", {
          propertyId: "oct24-7-old-park-lane",
          saved: true,
        })
      ).status,
      200,
    );
    assert.deepEqual((await (await call("/api/shortlist")).json()).saved, [
      "oct24-7-old-park-lane",
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
          propertyId: "oct24-7-old-park-lane",
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
          propertyId: "oct24-14-cavendish-square",
          kind: "access",
          email,
          consent: false,
        })
      ).status,
      400,
    );
    const request = await call("/api/requests", "POST", {
      propertyId: "oct24-7-old-park-lane",
      kind: "enquiry",
      message: "Please share further investment details.",
    });
    assert.equal(request.status, 201);
    const { id } = await request.json();
    assert.equal(
      (await db.investmentRequest.findUniqueOrThrow({ where: { id } })).userId,
      user.id,
    );
    assert.equal(
      (await db.investmentRequest.findUniqueOrThrow({ where: { id } })).email,
      email,
    );
    const alternateEmail = "investment-team@example.com";
    const alternateRequest = await call("/api/requests", "POST", {
      propertyId: "oct24-7-old-park-lane",
      kind: "enquiry",
      email: alternateEmail,
      message: "Please contact our investment team about this opportunity.",
    });
    assert.equal(alternateRequest.status, 201);
    const alternateResult = await alternateRequest.json();
    assert.equal(
      (
        await db.investmentRequest.findUniqueOrThrow({
          where: { id: alternateResult.id },
        })
      ).email,
      alternateEmail,
    );
    for (const invalidEmail of ["", "invalid-email"]) {
      assert.equal(
        (
          await call("/api/requests", "POST", {
            propertyId: "oct24-7-old-park-lane",
            kind: "enquiry",
            email: invalidEmail,
            message: "Please share further investment details.",
          })
        ).status,
        400,
      );
    }
    const download = await call(
      "/api/properties/oct24-7-old-park-lane/memorandum",
    );
    assert.equal(download.status, 200);
    assert.equal(download.headers.get("content-type"), "application/pdf");
    assert.match(
      download.headers.get("content-disposition")!,
      /^attachment;.*\.pdf/,
    );
    assert.equal(download.headers.get("cache-control"), "private, no-store");
    const pdf = Buffer.from(await download.arrayBuffer());
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
    assert.ok(pdf.length > 1000);
    assert.equal(
      (await call("/api/properties/missing/memorandum")).status,
      404,
    );
    const confidentialDownload = `/api/properties/${confidentialId}/memorandum`;
    assert.equal((await call(confidentialDownload)).status, 403);
    assert.equal(
      (
        await call("/api/requests", "POST", {
          propertyId: "oct24-7-old-park-lane",
          kind: "access",
          email,
          consent: true,
        })
      ).status,
      400,
    );
    const accessRequest = {
      propertyId: confidentialId,
      kind: "access",
      consent: true,
    };
    const accessResponse = await call("/api/requests", "POST", accessRequest);
    assert.equal(accessResponse.status, 201);
    const accessResult = await accessResponse.json();
    assert.equal(
      (
        await db.investmentRequest.findUniqueOrThrow({
          where: { id: accessResult.id },
        })
      ).email,
      email,
    );
    const repeated = await call("/api/requests", "POST", accessRequest);
    assert.equal(repeated.status, 200);
    assert.equal((await repeated.json()).id, accessResult.id);
    assert.equal(
      await db.investmentRequest.count({
        where: { userId, propertyId: confidentialId, kind: "access" },
      }),
      1,
    );
    assert.equal((await call(confidentialDownload)).status, 403);
    assert.ok(
      (await (await call(`/property/${confidentialId}`)).text()).includes(
        "Access request pending",
      ),
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
      const otherDetail = await call(
        `/property/${confidentialId}`,
        "GET",
        undefined,
        otherCookie,
      );
      assert.ok(!(await otherDetail.text()).includes("Access request pending"));
      assert.equal(
        (await call(confidentialDownload, "GET", undefined, otherCookie))
          .status,
        403,
      );
    } finally {
      await db.user.delete({ where: { id: other.id } });
    }
    assert.equal(
      (
        await call("/api/shortlist", "PUT", {
          propertyId: "oct24-7-old-park-lane",
          saved: false,
        })
      ).status,
      200,
    );
    assert.deepEqual((await (await call("/api/shortlist")).json()).saved, []);
    assert.equal((await call("/api/auth/sign-out", "POST", {})).status, 200);
    assert.equal((await call("/api/shortlist")).status, 401);
    assert.equal(
      (await call("/api/properties/oct24-7-old-park-lane/memorandum")).status,
      401,
    );
    assert.equal(await db.session.count({ where: { userId: user.id } }), 0);
  } finally {
    await db.user.delete({ where: { id: user.id } });
    await db.property.deleteMany({ where: { id: confidentialId } });
    await db.$disconnect();
  }
});
