import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { properties, sourceProperties } from "../src/data";
import { hashPassword } from "better-auth/crypto";
import { seedAdmin } from "./seed-admin";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
async function main() {
  const passwordHash = await hashPassword(
    process.env.DEMO_PASSWORD || "KnightFrank2026!",
  );
  await prisma.$transaction(
    async (tx) => {
      await seedAdmin(
        tx,
        process.env.ADMIN_EMAIL || "admin@example.com",
        process.env.ADMIN_PASSWORD || "KnightFrankAdmin2026!",
      );
      for (const [position, property] of properties.entries()) {
        await tx.property.upsert({
          where: { id: property.id },
          create: { ...property, position },
          update: { ...property, position },
        });
      }
      const email = (
        process.env.DEMO_EMAIL || "investor@example.com"
      ).toLowerCase();
      const user = await tx.user.upsert({
        where: { email },
        create: { email, name: "Investor", emailVerified: true },
        update: {},
      });
      const existing = await tx.account.findFirst({
        where: { userId: user.id, providerId: "credential" },
      });
      if (!existing)
        await tx.account.create({
          data: {
            userId: user.id,
            accountId: user.id,
            providerId: "credential",
            password: passwordHash,
          },
        });
    },
    { timeout: 60_000 },
  );
  console.log(
    `Seeded ${sourceProperties.length} source properties and ${properties.length - sourceProperties.length} regional demo copies (${properties.length} total), plus the demo investor and admin. Existing passwords and unrelated records preserved.`,
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
