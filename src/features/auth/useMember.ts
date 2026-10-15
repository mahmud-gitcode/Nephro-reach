"use client";

import { useOptionalAuth } from "./AuthContext";
import { useCaregiverView } from "@/features/caregivers/useCaregivers";

export type ActingMember = {
  email: string;
  name: string;
  /** True when a caregiver is signed in, acting for this patient. */
  byCaregiver: boolean;
};

/**
 * The patient whose records the member screens show and change: the
 * signed-in member, or — for a caregiver — the patient they switched to
 * (2026-10-14). Null for every other role, and for a caregiver who has not
 * picked a patient yet.
 */
export function useMember(): ActingMember | null {
  const user = useOptionalAuth()?.user;
  const { grant } = useCaregiverView();
  if (user?.role === "user") {
    return { email: user.email, name: user.name, byCaregiver: false };
  }
  if (user?.role === "caregiver" && grant) {
    return {
      email: grant.patientEmail,
      name: grant.patientName,
      byCaregiver: true,
    };
  }
  return null;
}

/** Member screens: the signed-in member, or the patient a caregiver acts for. */
export const isMemberRole = (role: string | undefined) =>
  role === "user" || role === "caregiver";
