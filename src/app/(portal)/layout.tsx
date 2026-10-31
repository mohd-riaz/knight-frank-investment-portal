import { requireUser } from "@/lib/session";
import { getProperties, getShortlist } from "@/lib/db";
import Portal from "@/portal";
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const [properties, saved] = await Promise.all([
    getProperties(),
    getShortlist(user.id),
  ]);
  return (
    <Portal properties={properties} initialSaved={saved} user={user}>
      {children}
    </Portal>
  );
}
