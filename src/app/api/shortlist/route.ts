import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/session";
import { db, getShortlist } from "@/lib/db";
import { apiError, assertSameOrigin, HttpError } from "@/lib/http";
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) throw new HttpError(401, "Please sign in again.");
    return NextResponse.json({ saved: await getShortlist(user.id) });
  } catch (error) {
    return apiError(error);
  }
}
export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await currentUser();
    if (!user) throw new HttpError(401, "Please sign in again.");
    const { propertyId, saved } = z
      .object({ propertyId: z.string().min(1).max(64), saved: z.boolean() })
      .parse(await request.json());
    const exists = await db.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });
    if (!exists) throw new HttpError(404, "Opportunity not found.");
    if (saved)
      await db.shortlist.upsert({
        where: { userId_propertyId: { userId: user.id, propertyId } },
        create: { userId: user.id, propertyId },
        update: {},
      });
    else
      await db.shortlist.deleteMany({ where: { userId: user.id, propertyId } });
    return NextResponse.json({ saved: await getShortlist(user.id) });
  } catch (error) {
    return apiError(error);
  }
}
