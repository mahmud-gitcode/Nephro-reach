import React from "react";
import DashboardGuard from "@/features/auth/DashboardGuard";
import DashboardShell from "@/components/layout/DashboardShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardGuard>
      <DashboardShell>{children}</DashboardShell>
    </DashboardGuard>
  );
}
