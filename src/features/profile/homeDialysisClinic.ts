/* ==========================================================================
   The member's home dialysis clinic <-> the API (Phase 4)
   --------------------------------------------------------------------------
   `GET/PUT/DELETE /patients/:id/home-dialysis-clinic`. Either linked to a
   dialysis center on NephroReach (by `organizationId`; the server copies
   its name and sets `onNephroReach`) or typed in by the member. `null`
   from the server means "not set".
   ========================================================================== */

import type { DialysisClinic } from "@/features/travel/clinic.types";

export type ApiHomeDialysisClinic = {
  patientId: string;
  organizationId: string | null;
  onNephroReach: boolean;
  name: string;
  phone: string;
  address: string;
  email: string | null;
  updatedAt: string;
};

export type HomeDialysisClinic = DialysisClinic & {
  organizationId: string | null;
  onNephroReach: boolean;
};

export type HomeDialysisClinicBody =
  | { organizationId: string; phone?: string; address?: string }
  | { name: string; phone?: string; address?: string; email?: string };

export const EMPTY_CLINIC: HomeDialysisClinic = {
  name: "",
  phone: "",
  address: "",
  email: "",
  organizationId: null,
  onNephroReach: false,
};

export function fromApiClinic(
  raw: ApiHomeDialysisClinic | null,
): HomeDialysisClinic | null {
  if (!raw) return null;
  return {
    name: raw.name ?? "",
    phone: raw.phone ?? "",
    address: raw.address ?? "",
    email: raw.email ?? "",
    organizationId: raw.organizationId ?? null,
    onNephroReach: raw.onNephroReach === true,
  };
}

/** What saving this clinic sends: a PUT, or a DELETE when the member
 *  cleared it (no linked center and no name). */
export function clinicWrite(
  input: DialysisClinic & { organizationId?: string | null },
): { kind: "put"; body: HomeDialysisClinicBody } | { kind: "delete" } {
  const phone = input.phone.trim();
  const address = input.address.trim();
  const optional = {
    ...(phone ? { phone } : {}),
    ...(address ? { address } : {}),
  };
  if (input.organizationId)
    return {
      kind: "put",
      body: { organizationId: input.organizationId, ...optional },
    };
  const name = input.name.trim();
  if (!name) return { kind: "delete" };
  const email = (input.email ?? "").trim();
  return {
    kind: "put",
    body: { name, ...optional, ...(email ? { email } : {}) },
  };
}
