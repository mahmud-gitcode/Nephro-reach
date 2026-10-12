import React from "react";
import DashboardGuard from "@/features/auth/DashboardGuard";
import DashboardShell from "@/components/layout/DashboardShell";
import { QueryProvider } from "@/lib/data/QueryProvider";
import { MemberTourGate } from "@/features/onboarding/MemberTour";

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
          <DashboardShell>
            {children}
            {/* The guided tour on a member's first visit (2026-10-12). */}
            <MemberTourGate />
          </DashboardShell>
        </DashboardGuard>
      </QueryProvider>
    </div>
  );
}
