import "server-only";
import { db } from "./prisma";
export { db } from "./prisma";
import type { Property } from "@/data";
import { presentProperty } from "./property-presentation";
export async function getProperties(userId?: string): Promise<Property[]> {
  const rows = await db.property.findMany({
    where: { publication: "published" },
    orderBy: { position: "asc" },
  });
  const approvals = userId
    ? await db.investmentRequest.findMany({
        where: { userId, kind: "access", status: "approved" },
        select: { propertyId: true },
      })
    : [];
  const approved = new Set(approvals.map((r) => r.propertyId));
  return rows.map((row) => ({
    ...presentProperty(row),
    accessGranted: approved.has(row.id),
  }));
}
export async function getShortlist(userId: string): Promise<string[]> {
  const rows = await db.shortlist.findMany({
    where: { userId, property: { publication: "published" } },
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
