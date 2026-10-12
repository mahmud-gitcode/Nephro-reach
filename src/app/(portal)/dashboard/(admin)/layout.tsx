"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { sidebarItems, supportItems } from "@/components/layout/navigation";
import { RequirePermission } from "@/features/staff/RequirePermission";

/* An admin page opened by a NephroReach team member whose role does not
   include it (client, 2026-10-12): the menu hides it, and a typed or
   bookmarked address is told why here. The admin's own login sees all. */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const item = [...sidebarItems, ...supportItems].find(
    (entry) =>
      entry.roles.includes("admin") &&
      entry.href !== "/dashboard" &&
      (pathname === entry.href || pathname.startsWith(`${entry.href}/`)),
  );
  if (!item?.permission) return <>{children}</>;
  return (
    <RequirePermission permission={item.permission}>
      {children}
    </RequirePermission>
  );
}
