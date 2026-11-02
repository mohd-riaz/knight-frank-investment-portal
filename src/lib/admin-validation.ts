import { z } from "zod";
import { regions, assetClasses } from "@/data";
import { adminCurrencies, adminTenures } from "./admin-property-options";
const metric = z.number().finite().nonnegative().nullable();
export const propertyInput = z
  .object({
    id: z.string().max(100).optional(),
    name: z.string().trim().min(1).max(200),
    city: z.string().trim().max(100),
    country: z.string().trim().max(100),
    region: z.enum(regions as [string, ...string[]]),
    asset: z.enum(assetClasses.slice(1) as [string, ...string[]]),
    currency: z.enum(adminCurrencies),
    price: metric,
    yield: metric.refine((v) => v === null || v <= 100),
    annualIncome: metric,
    area: metric.refine((v) => v === null || Number.isInteger(v)),
    tenure: z.enum(adminTenures),
    summary: z.string().max(5000),
    highlights: z.array(z.string().max(1000)).max(30),
    confidential: z.boolean(),
    publication: z.enum(["draft", "published", "archived"]),
  })
  .refine(
    (p) =>
      p.publication !== "published" || !!(p.city && p.country && p.summary),
    { message: "Published opportunities need a location and summary." },
  );
export const inviteInput = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email().transform((v) => v.toLowerCase()),
  company: z.string().trim().max(200),
  role: z.enum(["owner", "admin", "client"]),
});
export function protectOwner(
  actorId: string,
  target: { id: string; role: string; status: string },
  next: { role: string; status: string },
  owners: number,
) {
  if (target.id === actorId && next.status !== "active")
    throw new Error("You cannot deactivate your own account.");
  if (
    target.role === "owner" &&
    target.status === "active" &&
    (next.role !== "owner" || next.status !== "active") &&
    owners <= 1
  )
    throw new Error("Keep at least one active owner.");
}
