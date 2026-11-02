import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { adminData } from "@/lib/admin";
import { Admin } from "@/components/admin/admin";
export const metadata = { title: "Administration" };
export default async function AdminPage() {
  const user = await currentUser();
  if (!user || !["owner", "admin"].includes(user.role || ""))
    redirect("/admin/login");
  return <Admin data={await adminData()} />;
}
