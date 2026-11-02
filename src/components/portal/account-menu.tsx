"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronsUpDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AccountMenu({
  user,
  subtitle = "Private client",
  onSignOut,
  showInvestorPortal = false,
}: {
  user: { name: string; email: string };
  subtitle?: string;
  onSignOut: () => void | Promise<void>;
  showInvestorPortal?: boolean;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <div className="sidebar-account">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="sidebar-account-button"
                aria-label="Open account menu"
              >
                <Avatar className="avatar">
                  <AvatarFallback>
                    {user.name
                      .split(" ")
                      .filter(Boolean)
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="od-field od-fill sidebar-account-copy">
                  <strong>{user.name}</strong>
                  <span>{subtitle}</span>
                </div>
                <ChevronsUpDown className="sidebar-account-chevron" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={isMobile ? "top" : "right"}
              align="end"
              sideOffset={8}
              className="min-w-56"
            >
              <DropdownMenuLabel>
                <div>{user.name}</div>
                <div className="text-xs font-normal text-muted-foreground">
                  {user.email}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {showInvestorPortal && (
                <DropdownMenuItem asChild onSelect={() => setOpenMobile(false)}>
                  <Link href="/overview">
                    <ArrowUpRight className="mr-2 size-4" />
                    Investor portal
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => void onSignOut()}>
                <LogOut className="mr-2 size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}
