import { requireUser } from "@/lib/session";
import { getPendingAccess, getProperties, getShortlist } from "@/lib/db";
import Portal from "@/portal";
import { cookies } from "next/headers";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { CSSProperties } from "react";
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";
  const [properties, saved, pendingAccess] = await Promise.all([
    getProperties(),
    getShortlist(user.id),
    getPendingAccess(user.id),
  ]);
  return (
    <SidebarProvider
      defaultOpen={sidebarOpen}
      mobileBreakpoint={1024}
      className="app-shell"
      style={
        {
          "--sidebar-width": "var(--sidebar)",
          "--sidebar-width-icon": "72px",
        } as CSSProperties
      }
    >
      <Portal
        properties={properties}
        initialSaved={saved}
        initialPendingAccess={pendingAccess}
        user={user}
      >
        {children}
      </Portal>
    </SidebarProvider>
  );
}
