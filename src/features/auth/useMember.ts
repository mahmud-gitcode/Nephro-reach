"use client";

import { useOptionalAuth } from "./AuthContext";
import { useCaregiverView } from "@/features/caregivers/useCaregivers";

export type ActingMember = {
  /** The patient record the member screens read (the server's id). */
  patientId: string | null;
  /** The member's own email. Empty for a caregiver: the server does not
   *  give a caregiver the patient's email, and no screen may key on it. */
  email: string;
  name: string;
  /** True when a caregiver is signed in, acting for this patient. */
  byCaregiver: boolean;
};

/**
 * The patient whose records the member screens show and change: the
 * signed-in member, or — for a caregiver — the patient they switched to
 * (2026-10-14). Null for every other role, and for a caregiver who has not
 * picked a patient yet. A caregiver's patient is the portal context
 * (Phase 3), never anything stored in this browser.
 */
export function useMember(): ActingMember | null {
  const user = useOptionalAuth()?.user;
  const { grant } = useCaregiverView();
  if (user?.role === "user") {
    return {
      patientId: user.patientId ?? null,
      email: user.email,
      name: user.name,
      byCaregiver: false,
    };
  }
  if (user?.role === "caregiver" && grant) {
    return {
      patientId: grant.patientId,
      email: "",
      name: grant.patientName,
      byCaregiver: true,
    };
  }
  return null;
}

/** Member screens: the signed-in member, or the patient a caregiver acts for. */
export const isMemberRole = (role: string | undefined) =>
  role === "user" || role === "caregiver";
