import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, assertSameOrigin, HttpError } from "@/lib/http";
const input = z
  .object({
    propertyId: z.string().min(1).max(64),
    kind: z.enum(["enquiry", "access"]),
    email: z.email().max(254),
    message: z.string().trim().max(5000).default(""),
    consent: z.boolean().default(false),
  })
  .refine((v) => (v.kind === "access" ? v.consent : v.message.length >= 10));
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await currentUser();
    if (!user) throw new HttpError(401, "Please sign in again.");
    const data = input.parse(await request.json());
    const exists = await db.property.findUnique({
      where: { id: data.propertyId },
      select: { id: true },
    });
    if (!exists) throw new HttpError(404, "Opportunity not found.");
    const result = await db.investmentRequest.create({
      data: { ...data, userId: user.id },
      select: { id: true },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
