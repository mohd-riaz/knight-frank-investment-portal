import "dotenv/config";
import { db } from "../src/lib/prisma";
import { seedAdmin } from "../prisma/seed-admin";
const email = process.env.ADMIN_EMAIL || "admin@example.com";
db.$transaction((tx) =>
  seedAdmin(tx, email, process.env.ADMIN_PASSWORD || "KnightFrankAdmin2026!"),
)
  .then(() =>
    console.log(
      `Admin seed ready: ${email}. Existing passwords preserved. Sign in at /admin/login.`,
    ),
  )
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
