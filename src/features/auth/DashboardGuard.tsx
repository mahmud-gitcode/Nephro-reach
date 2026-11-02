"use client";

/* ==========================================================================
   The portal's door (Phase 2, ADR 0006 step 4)
   --------------------------------------------------------------------------
   Routes by the server's `GET /me/context` only. The proxy no longer makes
   any auth decision (INT-1), and no cookie or stored value the browser can
   edit decides who is signed in (INT-2). The server decides every
   permission; this hides what a role cannot use.

   Order:
   1. loading            → the skeleton;
   2. error              → an error state with retry (never the login page,
                           never stale data: a failed read is not signed out);
   3. signed out         → /login?next=…;
   4. email not verified → /verify-email;
   5. office or platform context with MFA still to set up → /setup/mfa;
   6. no context at all  → /setup/patient;
   7. only an organization with no portal → the no-portal state;
   8. canAccessPath / redirectFor, as before.
   ========================================================================== */

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import { canAccessPath, homeForRole } from "@/features/auth/auth";
import { isStaffChoice } from "@/features/auth/auth.mapping";
import { userCan } from "@/features/staff/staff";
import { redirectFor } from "@/components/layout/navigation";
import { useAuthText } from "./authText";

type Decision =
  | { kind: "wait" }
  | { kind: "error" }
  | { kind: "no-portal" }
  | { kind: "go"; to: string }
  | { kind: "show" };

function Holding() {
  return (
    /* The canvas's own ground, so the page that loads next does not flash a
       different grey. */
    <div
      data-canvas
      className="flex min-h-screen items-center justify-center bg-canvas text-body-sm text-fg-muted"
    >
      Loading...
    </div>
  );
}

export default function DashboardGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, user, context, choice, pickerNeeded, refreshContext } =
    useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const t = useAuthText();

  const decision: Decision = (() => {
    if (status === "loading") return { kind: "wait" };
    if (status === "error") return { kind: "error" };
    if (status === "signed-out" || !context || !choice)
      return {
        kind: "go",
        to: `/login?next=${encodeURIComponent(pathname)}`,
      };
    if (!context.user.isAccountVerified)
      return { kind: "go", to: "/verify-email" };
    if (isStaffChoice(choice) && context.user.mfaSetupRequired)
      return {
        kind: "go",
        to: `/setup/mfa?next=${encodeURIComponent(pathname)}`,
      };
    /* Several portals and this page names none of them (D5, Phase 3). */
    if (pickerNeeded)
      return {
        kind: "go",
        to: `/select-portal?next=${encodeURIComponent(pathname)}`,
      };
    if (choice.kind === "none") return { kind: "go", to: "/setup/patient" };
    if (choice.kind === "no-portal" || !user) return { kind: "no-portal" };
    if (!canAccessPath(user.role, pathname))
      return { kind: "go", to: homeForRole(user.role) };
    /* A staff role without this page goes to the first one it has. */
    const elsewhere = redirectFor(user.role, pathname, (p) => userCan(user, p));
    if (elsewhere) return { kind: "go", to: elsewhere };
    return { kind: "show" };
  })();

  const target = decision.kind === "go" ? decision.to : null;
  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  if (decision.kind === "error") {
    return (
      <div
        data-canvas
        className="flex min-h-screen items-center justify-center bg-canvas p-inset-lg"
      >
        <ErrorState
          title={t("guard.errorTitle")}
          message={t("guard.errorBody")}
          retryLabel={t("guard.retry")}
          onRetry={() => void refreshContext()}
        />
      </div>
    );
  }
  if (decision.kind === "no-portal") {
    return (
      <div
        data-canvas
        className="flex min-h-screen items-center justify-center bg-canvas p-inset-lg"
      >
        <EmptyState
          title={t("guard.noPortalTitle")}
          description={t("guard.noPortalBody")}
        />
      </div>
    );
  }
  if (decision.kind !== "show") return <Holding />;
  return <>{children}</>;
}
