import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { verifyPassword } from "better-auth/crypto";
import { db } from "../src/lib/prisma";
import { seedAdmin } from "../prisma/seed-admin";

test("admin seed creates an owner, preserves passwords and disabled status, converts pending invitations and rejects client collisions", async () => {
  const email = `seed-${randomUUID()}@example.com`;
  const seed = (password: string) =>
    db.$transaction((tx) => seedAdmin(tx, email, password));
  try {
    const id = await seed("First-admin-password!");
    let user = await db.user.findUniqueOrThrow({
      where: { id },
      include: { accounts: true },
    });
    assert.equal(user.role, "owner");
    assert.equal(user.status, "active");
    assert.ok(
      await verifyPassword({
        hash: user.accounts[0].password!,
        password: "First-admin-password!",
      }),
    );
    await db.user.update({ where: { id }, data: { status: "deactivated" } });
    await seed("Different-password!");
    user = await db.user.findUniqueOrThrow({
      where: { id },
      include: { accounts: true },
    });
    assert.equal(user.status, "deactivated");
    assert.equal(user.accounts.length, 1);
    assert.ok(
      await verifyPassword({
        hash: user.accounts[0].password!,
        password: "First-admin-password!",
      }),
    );
    await db.account.deleteMany({ where: { userId: id } });
    await db.user.update({
      where: { id },
      data: {
        status: "invited",
        invitations: {
          create: {
            tokenHash: randomUUID(),
            expiresAt: new Date(Date.now() + 60000),
          },
        },
      },
    });
    await seed("Activation-password!");
    assert.equal(
      (await db.user.findUniqueOrThrow({ where: { id } })).status,
      "active",
    );
    assert.equal(await db.invitation.count({ where: { userId: id } }), 0);
    await db.user.update({ where: { id }, data: { role: "client" } });
    await assert.rejects(seed("Another-password!"), /belongs to a client/);
  } finally {
    await db.user.deleteMany({ where: { email } });
    await db.$disconnect();
  }
});
