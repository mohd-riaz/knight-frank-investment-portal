import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, assertSameOrigin, HttpError } from "@/lib/http";
const input = z
  .object({
    propertyId: z.string().min(1).max(64),
    kind: z.enum(["enquiry", "access"]),
    email: z.email().max(254).optional(),
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
      where: { id: data.propertyId, publication:'published' },
      select: { id: true, confidential: true },
    });
    if (!exists) throw new HttpError(404, "Opportunity not found.");
    if (data.kind === "access") {
      if (!exists.confidential)
        throw new HttpError(
          400,
          "This memorandum is available to download directly.",
        );
      const pending = await db.investmentRequest.findFirst({
        where: {
          userId: user.id,
          propertyId: data.propertyId,
          kind: "access",
          status: "pending",
        },
        select: { id: true },
      });
      if (pending) return NextResponse.json(pending);
    }
    const result = await db.investmentRequest.create({
      data: { ...data, email: data.email ?? user.email, userId: user.id },
      select: { id: true },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
