/* ==========================================================================
   The account's own profile (Phase 4): `PATCH /me/profile`
   --------------------------------------------------------------------------
   Name, language and time zone. Email and phone are sign-in identifiers
   with their own confirm flows (FE-ID), so they are read from
   `GET /me/context` and never written here. No avatar upload (ADR 0006
   checklist 7).
   ========================================================================== */

import { api } from "@/lib/api/client";

export type ProfilePatch = {
  name?: string;
  language?: "EN" | "ES";
  timeZone?: string | null;
};

/** Only the fields that changed, trimmed the way the server trims them. */
export function profilePatch(
  current: { name: string | null; language: "EN" | "ES" },
  next: { name: string; language: "EN" | "ES" },
): ProfilePatch {
  const patch: ProfilePatch = {};
  const name = next.name.trim();
  if (name !== "" && name !== (current.name ?? "")) patch.name = name;
  if (next.language !== current.language) patch.language = next.language;
  return patch;
}

export async function updateProfile(patch: ProfilePatch): Promise<void> {
  await api<unknown>("/me/profile", { method: "PATCH", body: patch });
}
