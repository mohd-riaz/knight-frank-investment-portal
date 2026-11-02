import { z } from "zod";
import { assetClasses, regions, type Filters, type Property } from "../data";
import type { Prisma } from "../generated/prisma/client";

const amount = z.string().regex(/^(?:\d{1,9}(?:\.\d{1,6})?)?$/);
export const assistantFilters = z
  .object({
    region: z.array(z.enum(regions as [string, ...string[]])).max(8),
    country: z.array(z.string().trim().min(1).max(80)).max(10),
    asset: z
      .array(z.enum(assetClasses.slice(1) as [string, ...string[]]))
      .max(8),
    query: z.string().trim().max(160),
    min: amount,
    max: amount,
    currency: z.string().regex(/^(?:All currencies|[A-Z]{3})$/),
    yield: amount,
    tenure: z.enum(["Any tenure", "Freehold", "Leasehold"]),
  })
  .strict();
export const planSchema = z
  .object({
    action: z.enum(["search", "clarify", "details"]),
    clarification: z.string().max(600),
    filters: assistantFilters,
    sort: z.enum(["catalogue", "yield_desc", "price_asc", "price_desc"]),
    compare: z.boolean(),
    limit: z.number().int().min(1).max(10),
    ids: z.array(z.string().min(1).max(120)).max(3),
  })
  .strict();
export type SearchPlan = z.infer<typeof planSchema>;
export const chatInput = z
  .object({
    message: z.string().trim().min(1).max(2000),
    history: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            content: z.string().max(3000),
          })
          .strict(),
      )
      .max(10)
      .default([]),
    previous: planSchema.nullable().default(null),
    previousIds: z.array(z.string().max(120)).max(10).default([]),
  })
  .strict();
export type AssistantReply = {
  text: string;
  plan: SearchPlan | null;
  result?: {
    filters: Filters;
    criteria: string[];
    results: Property[];
    compare: boolean;
    total: number;
  };
};

export function validatePlan(plan: SearchPlan) {
  const f = plan.filters;
  if (plan.action === "clarify") return;
  if ((f.min || f.max) && f.currency === "All currencies")
    throw new Error(
      "Please specify a currency for your budget, such as GBP or AED.",
    );
  if (f.min && f.max && Number(f.min) > Number(f.max))
    throw new Error("The minimum price must be lower than the maximum price.");
  if (Number(f.yield) > 100)
    throw new Error("Please specify a yield between 0 and 100%.");
  if (plan.action === "details" && !plan.ids.length)
    throw new Error("Which opportunity would you like to explore?");
}

export function searchWhere(plan: SearchPlan): Prisma.PropertyWhereInput {
  const f = plan.filters;
  const visible: Prisma.PropertyWhereInput = {
    publication: "published",
    confidential: false,
    NOT: { label: { contains: "sold", mode: "insensitive" } },
  };
  if (plan.action === "details") return { ...visible, id: { in: plan.ids } };
  return {
    ...visible,
    ...(f.region.length ? { region: { in: f.region } } : {}),
    ...(f.country.length
      ? {
          AND: [
            {
              OR: f.country.map((country) => ({
                country: { equals: country, mode: "insensitive" as const },
              })),
            },
          ],
        }
      : {}),
    ...(f.asset.length ? { asset: { in: f.asset } } : {}),
    ...(f.currency !== "All currencies" ? { currency: f.currency } : {}),
    ...(f.min || f.max
      ? {
          price: {
            ...(f.min ? { gte: Number(f.min) } : {}),
            ...(f.max ? { lte: Number(f.max) } : {}),
          },
        }
      : {}),
    ...(f.yield ? { yield: { gte: Number(f.yield) } } : {}),
    ...(f.tenure !== "Any tenure" ? { tenure: f.tenure } : {}),
    ...(f.query
      ? {
          OR: ["name", "city", "country", "asset"].map((field) => ({
            [field]: { contains: f.query, mode: "insensitive" },
          })),
        }
      : {}),
  };
}
export function searchOrder(
  plan: SearchPlan,
): Prisma.PropertyOrderByWithRelationInput[] {
  const primary: Prisma.PropertyOrderByWithRelationInput =
    plan.sort === "yield_desc"
      ? { yield: { sort: "desc", nulls: "last" } }
      : plan.sort === "price_asc"
        ? { price: { sort: "asc", nulls: "last" } }
        : plan.sort === "price_desc"
          ? { price: { sort: "desc", nulls: "last" } }
          : { position: "asc" };
  return [primary, { id: "asc" }];
}
export function criteriaFor(f: Filters): string[] {
  return [
    ...f.region,
    ...f.country,
    ...f.asset,
    ...(f.query ? [f.query] : []),
    ...(f.currency !== "All currencies" ? [f.currency] : []),
    ...(f.min ? [`Price ≥ ${f.min}m`] : []),
    ...(f.max ? [`Price ≤ ${f.max}m`] : []),
    ...(f.yield ? [`Yield ≥ ${f.yield}%`] : []),
    ...(f.tenure !== "Any tenure" ? [f.tenure] : []),
  ];
}
