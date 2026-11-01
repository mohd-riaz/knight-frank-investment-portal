import "server-only";
import { db } from "./prisma";
export { db } from "./prisma";
import type { Property } from "@/data";
import { presentProperty } from "./property-presentation";
export async function getProperties(): Promise<Property[]> {
  const rows = await db.property.findMany({ orderBy: { position: "asc" } });
  return rows.map(presentProperty);
}
export async function getShortlist(userId: string): Promise<string[]> {
  const rows = await db.shortlist.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { propertyId: true },
  });
  return rows.map((row) => row.propertyId);
}
export async function getPendingAccess(userId: string): Promise<string[]> {
  const rows = await db.investmentRequest.findMany({
    where: { userId, kind: "access", status: "pending" },
    distinct: ["propertyId"],
    select: { propertyId: true },
  });
  return rows.map((row) => row.propertyId);
}
