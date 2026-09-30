"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import { PERMISSIONS, userCan, type Permission } from "./staff";

/**
 * Shows the page only to a staff role that has the permission; anyone else
 * is told why, not left on a blank screen. The menu hides the page too, so
 * this catches a typed or bookmarked address.
 */
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (userCan(user, permission)) return <>{children}</>;
  const what = PERMISSIONS.find((p) => p.id === permission)?.label ?? "this";
  return (
    <EmptyState
      icon={<ShieldAlert />}
      title="Not available for your role"
      description={`${user?.staffRole ?? "Your role"} accounts cannot ${what.toLowerCase()}. Ask your administrator if you need access.`}
    />
  );
}
