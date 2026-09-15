import React from "react";
import DashboardGuard from "@/features/auth/DashboardGuard";
import DashboardShell from "@/components/layout/DashboardShell";
import { QueryProvider } from "@/lib/data/QueryProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <DashboardGuard>
        <DashboardShell>{children}</DashboardShell>
      </DashboardGuard>
    </QueryProvider>
  );
}
