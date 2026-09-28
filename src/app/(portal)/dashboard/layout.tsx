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
    // Sets the portal in Roboto; see globals.css.
    // `contents` keeps the wrapper out of the layout.
    <div data-typeface="portal" className="contents">
      <QueryProvider>
        <DashboardGuard>
          <DashboardShell>{children}</DashboardShell>
        </DashboardGuard>
      </QueryProvider>
    </div>
  );
}
