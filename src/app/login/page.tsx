import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { Login } from "@/components/portal/parts";
export const metadata = { title: "Sign in" };
export default async function LoginPage() {
  if (await currentUser()) redirect("/overview");
  return <Login />;
}
