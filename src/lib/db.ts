import "server-only";
import { db } from "./prisma";
export { db } from "./prisma";
import type { Property } from "@/data";
export async function getProperties(): Promise<Property[]> {
  const rows = await db.property.findMany({ orderBy: { position: "asc" } });
  return rows.map((property) => ({
    ...property,
    summary: property.summary
      .replace(/\b(sample|illustrative)\s+/gi, "")
      .replace(/^An (?=[^aeiou])/i, "A "),
  }));
}
export async function getShortlist(userId: string): Promise<string[]> {
  const rows = await db.shortlist.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { propertyId: true },
  });
  return rows.map((row) => row.propertyId);
}
