"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { canAccessPath, homeForRole } from "@/features/auth/auth";

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
    }
  }, [ready, user, pathname, router]);

  if (!ready || !user || !canAccessPath(user.role, pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-body-sm text-fg-muted">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
