"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { useLanguageCode } from "@/context/LanguageContext";
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
  const isEs = useLanguageCode() === "ES";
  if (userCan(user, permission)) return <>{children}</>;
  const entry = PERMISSIONS.find((p) => p.id === permission);
  const what = entry?.label ?? "this";
  const whatEs = entry?.labelEs ?? "hacer esto";
  return (
    <EmptyState
      icon={<ShieldAlert />}
      title={isEs ? "No disponible para su rol" : "Not available for your role"}
      description={
        isEs
          ? `${user?.staffRole ? `Las cuentas con el rol ${user.staffRole} no pueden` : "Su rol no puede"} ${whatEs.toLowerCase()}. Pida acceso a su administrador si lo necesita.`
          : `${user?.staffRole ?? "Your role"} accounts cannot ${what.toLowerCase()}. Ask your administrator if you need access.`
      }
    />
  );
}
