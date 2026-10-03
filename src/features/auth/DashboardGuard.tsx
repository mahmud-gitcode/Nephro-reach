"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { canAccessPath, homeForRole } from "@/features/auth/auth";
import { userCan } from "@/features/staff/staff";
import { redirectFor } from "@/components/layout/navigation";

export default function DashboardGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!canAccessPath(user.role, pathname)) {
      router.replace(homeForRole(user.role));
      return;
    }
    /* A staff role without this page goes to the first one it has. */
    const elsewhere = redirectFor(user.role, pathname, (p) => userCan(user, p));
    if (elsewhere) router.replace(elsewhere);
  }, [ready, user, pathname, router]);

  const elsewhere =
    ready && user
      ? redirectFor(user.role, pathname, (p) => userCan(user, p))
      : null;

  if (!ready || !user || !canAccessPath(user.role, pathname) || elsewhere) {
    return (
      /* The canvas's own ground, so the page that loads next does not
         flash a different grey. */
      <div
        data-canvas
        className="flex min-h-screen items-center justify-center bg-canvas text-body-sm text-fg-muted"
      >
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
