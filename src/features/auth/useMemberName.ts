"use client";

import { DEMO_MEMBER_NAME } from "@/lib/data/demoIdentity";
import { useMember } from "./useMember";

/**
 * The member whose records a member screen shows: the signed-in member.
 * Records are matched by name until there are member ids (with a server,
 * by id); the demo patient's name is the fallback before sign-in resolves.
 * For a caregiver, the patient they act for (2026-10-14).
 */
export function useMemberName(): string {
  return useMember()?.name ?? DEMO_MEMBER_NAME;
}
