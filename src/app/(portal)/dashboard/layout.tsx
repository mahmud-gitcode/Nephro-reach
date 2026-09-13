import React from "react";
import DashboardGuard from "@/components/dashboard/DashboardGuard";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardGuard>
      <DashboardShell>{children}</DashboardShell>
    </DashboardGuard>
  );
}
