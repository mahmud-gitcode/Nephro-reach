"use client";

import { DEMO_MEMBER_NAME } from "@/lib/data/demoIdentity";
import { useAuth } from "./AuthContext";

/**
 * The member whose records a member screen shows: the signed-in member.
 * Records are matched by name until there are member ids (with a server,
 * by id); the demo patient's name is the fallback before sign-in resolves.
 */
export function useMemberName(): string {
  const { user } = useAuth();
  return user?.role === "user" ? user.name : DEMO_MEMBER_NAME;
}
