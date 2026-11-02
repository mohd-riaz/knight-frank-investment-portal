import "dotenv/config";
import { properties } from "../src/data";
import { db } from "../src/lib/prisma";

// Explicit opt-in for an existing demo database; the normal seed preserves admin choices.
async function main() {
  const ids = properties
    .filter((property) => property.confidential)
    .map((property) => property.id);
  const result = await db.property.updateMany({
    where: { id: { in: ids } },
    data: { confidential: true },
  });
  console.log(
    `Enabled confidentiality for ${result.count} selected demonstration opportunities. Other opportunities and access approvals were preserved.`,
  );
}

main()
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Demo setup failed.",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
