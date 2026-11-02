import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { portalReturnTo } from "./return-to";
import { db } from "./prisma";
export type Investor = {
  id: string;
  email: string;
  name: string;
  role?: string;
};
export async function currentUser(): Promise<Investor | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const account = await db.user.findUnique({ where: { id: session.user.id } });
  if (!account || account.status !== "active") return null;
  const { id, email, name } = session.user;
  return {
    id,
    email,
    name: name === "Demo investor" ? "Investor" : name,
    role: account.role,
  };
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) {
    const returnTo = portalReturnTo(
      (await headers()).get("x-portal-return-to"),
    );
    redirect(
      returnTo === "/overview"
        ? "/login"
        : `/login?returnTo=${encodeURIComponent(returnTo)}`,
    );
  }
  return user;
}
