import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { Login } from "@/components/portal/parts";

export const metadata = { title: "Admin sign in" };
export default async function AdminLoginPage() {
  const user = await currentUser();
  if (user && ["owner", "admin"].includes(user.role || "")) redirect("/admin");
  return (
    <Login
      adminMode
      returnTo="/admin"
      initialError={
        user
          ? "You’re signed in with a client account. Use a Knight Frank admin account below, or return to the investor portal."
          : undefined
      }
    />
  );
}
