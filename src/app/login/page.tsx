import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { Login } from "@/components/portal/parts";
import { portalReturnTo } from "@/lib/return-to";
export const metadata = { title: "Sign in" };
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const returnTo = portalReturnTo((await searchParams).returnTo);
  if (await currentUser()) redirect(returnTo);
  return <Login returnTo={returnTo} />;
}
