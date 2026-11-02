import "dotenv/config";
import { randomBytes, createHash } from "node:crypto";
import { db } from "../src/lib/prisma";
async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Account ${email} already exists; no changes made.`);
    return;
  }
  const token = randomBytes(32).toString("hex");
  await db.user.create({
    data: {
      name: "Portal owner",
      email,
      role: "owner",
      status: "invited",
      company: "Knight Frank",
      invitations: {
        create: {
          tokenHash: createHash("sha256").update(token).digest("hex"),
          expiresAt: new Date(Date.now() + 7 * 86400000),
        },
      },
    },
  });
  console.log(
    `Owner invitation for ${email}:\n${process.env.BETTER_AUTH_URL || "http://127.0.0.1:3000"}/invite?token=${token}`,
  );
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
