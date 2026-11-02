import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { apiError, assertSameOrigin, HttpError } from "@/lib/http";
import {
  inviteInput,
  propertyInput,
  protectOwner,
} from "@/lib/admin-validation";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireAdmin();
    if (Number(request.headers.get("content-length") || 0) > 100000)
      throw new HttpError(413, "Request too large.");
    const raw = await request.text();
    if (raw.length > 100000) throw new HttpError(413, "Request too large.");
    const body = JSON.parse(raw);
    if (body.action === "property") {
      const { id, ...data } = propertyInput.parse(body.data);
      const property = id
        ? await db.property.update({ where: { id }, data })
        : await db.property.create({
            data: {
              ...data,
              id: crypto.randomUUID(),
              position: Date.now() % 2147483647,
              image: "office",
              label: "",
            },
          });
      return NextResponse.json({ id: property.id });
    }
    if (body.action === "publication") {
      const data = z
        .object({ id: z.string(), publication: z.enum(["draft", "archived"]) })
        .parse(body.data);
      await db.property.update({
        where: { id: data.id },
        data: { publication: data.publication },
      });
      return NextResponse.json({ ok: true });
    }
    if (body.action === "request") {
      const data = z
        .object({
          id: z.uuid(),
          status: z.enum(["reviewed", "approved", "declined", "pending"]),
          ndaReviewed: z.boolean().optional(),
        })
        .parse(body.data);
      const entry = await db.investmentRequest.findUniqueOrThrow({
        where: { id: data.id },
      });
      if (
        data.status === "approved" &&
        (entry.kind !== "access" || !data.ndaReviewed)
      )
        throw new HttpError(
          400,
          "Review the confidentiality requirement before granting access.",
        );
      await db.investmentRequest.updateMany({
        where:
          entry.kind === "access"
            ? {
                userId: entry.userId,
                propertyId: entry.propertyId,
                kind: "access",
              }
            : { id: data.id },
        data: { status: data.status },
      });
      return NextResponse.json({ ok: true });
    }
    await requireAdmin(true);
    if (body.action === "invite" || body.action === "resend") {
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      await db.$transaction(async (tx) => {
        let user;
        if (body.action === "invite") {
          const data = inviteInput.parse(body.data);
          if (await tx.user.findUnique({ where: { email: data.email } }))
            throw new HttpError(
              409,
              "An account with this email already exists.",
            );
          user = await tx.user.create({ data: { ...data, status: "invited" } });
        } else {
          user = await tx.user.findUniqueOrThrow({
            where: { id: z.uuid().parse(body.data.id) },
          });
          if (user.status !== "invited")
            throw new HttpError(
              400,
              "Only pending invitations can be reissued.",
            );
        }
        await tx.invitation.deleteMany({ where: { userId: user.id } });
        await tx.invitation.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 7 * 86400000),
          },
        });
      });
      return NextResponse.json({
        link: `${new URL(process.env.BETTER_AUTH_URL || request.url).origin}/invite?token=${token}`,
      });
    }
    if (body.action === "user") {
      const data = z
        .object({
          id: z.uuid(),
          role: z.enum(["owner", "admin", "client"]),
          status: z.enum(["active", "deactivated"]),
        })
        .parse(body.data);
      await db.$transaction(async (tx) => {
        // Serialize owner changes so concurrent requests cannot remove every owner.
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(741982)::text`;
        const target = await tx.user.findUniqueOrThrow({
          where: { id: data.id },
        });
        if (target.status === "invited")
          throw new HttpError(
            400,
            "The user must accept their invitation first.",
          );
        try {
          protectOwner(
            actor.id,
            target,
            data,
            await tx.user.count({ where: { role: "owner", status: "active" } }),
          );
        } catch (e) {
          throw new HttpError(400, (e as Error).message);
        }
        await tx.user.update({
          where: { id: data.id },
          data: { role: data.role, status: data.status },
        });
        await tx.session.deleteMany({ where: { userId: data.id } });
      });
      return NextResponse.json({ ok: true });
    }
    throw new HttpError(400, "Unknown action.");
  } catch (error) {
    return apiError(error);
  }
}
