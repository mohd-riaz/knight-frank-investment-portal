import { hashPassword } from "better-auth/crypto";
import type { Prisma } from "../src/generated/prisma/client";

// Repeated seeds preserve established passwords and disabled accounts.
export async function seedAdmin(
  tx: Prisma.TransactionClient,
  email: string,
  password: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await tx.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing && !["owner", "admin"].includes(existing.role)) {
    throw new Error(
      "ADMIN_EMAIL belongs to a client. Choose a different admin email.",
    );
  }
  const user =
    existing ??
    (await tx.user.create({
      data: {
        email: normalizedEmail,
        name: "Portal owner",
        role: "owner",
        status: "active",
        company: "Knight Frank",
        emailVerified: true,
      },
    }));
  const credential = await tx.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });
  if (!credential) {
    await tx.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: await hashPassword(password),
      },
    });
    if (user.status === "invited") {
      await tx.user.update({
        where: { id: user.id },
        data: { status: "active", emailVerified: true },
      });
      await tx.invitation.deleteMany({ where: { userId: user.id } });
    }
  }
  return user.id;
}
