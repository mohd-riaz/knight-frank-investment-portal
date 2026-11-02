import { createHash } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { apiError, assertSameOrigin, HttpError } from "@/lib/http";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const raw = await request.text();
    if (raw.length > 2000) throw new HttpError(413, "Request too large.");
    const data = z
      .object({
        token: z.string().regex(/^[a-f0-9]{64}$/),
        password: z.string().min(12).max(128),
      })
      .parse(JSON.parse(raw));
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const invitation = await db.invitation.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (
      !invitation ||
      invitation.expiresAt < new Date() ||
      invitation.user.status !== "invited"
    )
      throw new HttpError(
        400,
        "This invitation has expired or has already been used.",
      );
    const password = await hashPassword(data.password);
    await db.$transaction(async (tx) => {
      const used = await tx.invitation.deleteMany({
        where: { id: invitation.id, expiresAt: { gt: new Date() } },
      });
      if (used.count !== 1)
        throw new HttpError(400, "This invitation has already been used.");
      const activated = await tx.user.updateMany({
        where: { id: invitation.userId, status: "invited" },
        data: { status: "active", emailVerified: true },
      });
      if (activated.count !== 1)
        throw new HttpError(400, "This invitation is no longer active.");
      await tx.account.create({
        data: {
          userId: invitation.userId,
          accountId: invitation.userId,
          providerId: "credential",
          password,
        },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
