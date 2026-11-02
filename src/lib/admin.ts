import "server-only";
import { currentUser } from "./session";
import { HttpError } from "./http";
import { db } from "./prisma";
export async function requireAdmin(owner = false) {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Please sign in again.");
  if (
    !["owner", "admin"].includes(user.role || "") ||
    (owner && user.role !== "owner")
  )
    throw new HttpError(
      403,
      "You do not have permission to perform this action.",
    );
  return user;
}
export async function adminData() {
  const actor = await requireAdmin();
  const [properties, requests, users] = await Promise.all([
    db.property.findMany({
      orderBy: { position: "asc" },
      include: {
        materials: {
          select: { id: true, name: true, kind: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    db.investmentRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, company: true } },
        property: { select: { name: true } },
      },
    }),
    actor.role === "owner"
      ? db.user.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            role: true,
            status: true,
            createdAt: true,
            sessions: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { createdAt: true },
            },
          },
        })
      : [],
  ]);
  return { actor, properties, requests, users };
}
