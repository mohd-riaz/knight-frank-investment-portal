import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db } from "../src/lib/prisma";
import { protectOwner, propertyInput } from "../src/lib/admin-validation";
const origin = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
test("last owner and self-deactivation protections", () => {
  const target = { id: "owner", role: "owner", status: "active" };
  assert.throws(() =>
    protectOwner("other", target, { role: "client", status: "active" }, 1),
  );
  assert.throws(() =>
    protectOwner("owner", target, { role: "owner", status: "deactivated" }, 2),
  );
  assert.doesNotThrow(() =>
    protectOwner("other", target, { role: "client", status: "active" }, 2),
  );
});
test("admin permissions, publishing, invitations, document approval and deactivation", async () => {
  const run = randomUUID();
  const ids: string[] = [];
  let propertyId = "";
  let invitedId = "";
  async function call(path: string, cookie = "", body?: unknown) {
    return fetch(origin + path, {
      method: body ? "POST" : "GET",
      redirect: "manual",
      headers: {
        Origin: origin,
        Cookie: cookie,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }
  async function account(role: string) {
    const id = randomUUID();
    ids.push(id);
    const email = `${role}-${run}@example.com`;
    const password = "Integration-password-2026!";
    await db.user.create({
      data: {
        id,
        name: role,
        email,
        role,
        accounts: {
          create: {
            accountId: id,
            providerId: "credential",
            password: await hashPassword(password),
          },
        },
      },
    });
    const response = await call("/api/auth/sign-in/email", "", {
      email,
      password,
    });
    assert.equal(response.status, 200, await response.clone().text());
    return {
      id,
      cookie: response.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; "),
    };
  }
  try {
    const catalog = await db.property.findMany();
    for (const property of catalog) {
      assert.ok(
        propertyInput.safeParse(property).success,
        `Editor must support existing opportunity ${property.id}: ${property.currency}, ${property.tenure}`,
      );
    }
    console.log(
      `Checked editor compatibility for ${catalog.length} catalog records.`,
    );
    const owner = await account("owner");
    const admin = await account("admin");
    const client = await account("client");
    assert.equal((await call("/api/admin/session")).status, 401);
    assert.equal((await call("/api/admin/session", client.cookie)).status, 403);
    assert.equal((await call("/api/admin/session", owner.cookie)).status, 200);
    assert.equal((await call("/api/admin/session", admin.cookie)).status, 200);
    const save = {
      action: "property",
      data: {
        name: "Admin test " + run,
        city: "London",
        country: "United Kingdom",
        region: "UK",
        asset: "Offices",
        currency: "GBP",
        price: 12,
        yield: 6,
        annualIncome: null,
        area: null,
        tenure: "Freehold",
        summary: "Integration test opportunity",
        highlights: [],
        confidential: true,
        publication: "draft",
      },
    };
    assert.equal((await call("/api/admin", "", save)).status, 401);
    assert.equal((await call("/api/admin", client.cookie, save)).status, 403);
    let response = await call("/api/admin", admin.cookie, save);
    assert.equal(response.status, 200, await response.clone().text());
    propertyId = (await response.json()).id;
    assert.equal(
      (await call(`/api/properties/${propertyId}/memorandum`, client.cookie))
        .status,
      404,
    );
    response = await call("/api/admin", admin.cookie, {
      ...save,
      data: { ...save.data, id: propertyId, publication: "published" },
    });
    assert.equal(response.status, 200);
    assert.equal(
      (await call(`/api/properties/${propertyId}/memorandum`, client.cookie))
        .status,
      403,
    );
    response = await call("/api/requests", client.cookie, {
      propertyId,
      kind: "access",
      consent: true,
    });
    assert.equal(response.status, 201);
    const requestId = (await response.json()).id;
    assert.equal(
      (
        await call("/api/admin", admin.cookie, {
          action: "request",
          data: { id: requestId, status: "approved" },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await call("/api/admin", admin.cookie, {
          action: "request",
          data: { id: requestId, status: "approved", ndaReviewed: true },
        })
      ).status,
      200,
    );
    assert.equal(
      (await call(`/api/properties/${propertyId}/memorandum`, client.cookie))
        .status,
      200,
    );
    const upload = new FormData();
    upload.set("propertyId", propertyId);
    upload.set("kind", "im");
    upload.set(
      "file",
      new Blob(["%PDF-1.4\nAdmin test PDF"], { type: "application/pdf" }),
      "test.pdf",
    );
    response = await fetch(origin + "/api/admin/materials", {
      method: "POST",
      headers: { Origin: origin, Cookie: admin.cookie },
      body: upload,
    });
    assert.equal(response.status, 200, await response.clone().text());
    assert.match(
      await (
        await call(`/api/properties/${propertyId}/memorandum`, client.cookie)
      ).text(),
      /Admin test PDF/,
    );
    const invite = {
      action: "invite",
      data: {
        name: "Invited investor",
        email: `invited-${run}@example.com`,
        company: "Test company",
        role: "client",
      },
    };
    assert.equal((await call("/api/admin", admin.cookie, invite)).status, 403);
    response = await call("/api/admin", owner.cookie, invite);
    assert.equal(response.status, 200, await response.clone().text());
    const link = (await response.json()).link;
    invitedId = (
      await db.user.findUniqueOrThrow({ where: { email: invite.data.email } })
    ).id;
    const acceptance = {
      token: new URL(link).searchParams.get("token"),
      password: "Invited-password-2026!",
    };
    assert.equal((await call("/api/invite", "", acceptance)).status, 200);
    assert.equal((await call("/api/invite", "", acceptance)).status, 400);
    response = await call("/api/admin", owner.cookie, {
      action: "user",
      data: { id: client.id, role: "client", status: "deactivated" },
    });
    assert.equal(response.status, 200);
    assert.equal((await call("/api/shortlist", client.cookie)).status, 401);
    assert.equal(await db.session.count({ where: { userId: client.id } }), 0);
    for (const currency of ["CAD", "ZAR"]) {
      const data = {
        ...save.data,
        id: propertyId,
        currency,
        tenure: "Not stated",
        publication: "published",
      };
      const saved = await call("/api/admin", admin.cookie, {
        action: "property",
        data,
      });
      assert.equal(saved.status, 200, await saved.clone().text());
      const stored = await db.property.findUniqueOrThrow({
        where: { id: propertyId },
      });
      assert.equal(stored.currency, currency);
      assert.equal(stored.tenure, "Not stated");
    }
    await call("/api/admin", admin.cookie, {
      action: "publication",
      data: { id: propertyId, publication: "archived" },
    });
    assert.equal(
      (await call(`/api/properties/${propertyId}/memorandum`, owner.cookie))
        .status,
      404,
    );
  } finally {
    await db.investmentRequest.deleteMany({ where: { userId: { in: ids } } });
    if (propertyId) await db.property.delete({ where: { id: propertyId } });
    await db.user.deleteMany({
      where: { id: { in: [...ids, invitedId].filter(Boolean) } },
    });
    await db.$disconnect();
  }
});
