/* ==========================================================================
   Office profile and settings: one function per server operation
   (Phase 14; ADR 0007 §1)
   --------------------------------------------------------------------------
   settings 1 reads, settings 2 writes. Every PATCH carries only the
   changed fields of one section; the organization is in the path and in
   X-Organization-Id. No browser storage.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { officePath } from "./office.scope";
import type {
  ApiOfficeProfile,
  ApiOfficeSettings,
  ProfilePatch,
  SettingsPatch,
} from "./settings.data";

export function getProfile(organizationId: string) {
  return api<ApiOfficeProfile>(officePath(organizationId, ""), {
    organizationId,
  });
}

export function updateProfile(organizationId: string, patch: ProfilePatch) {
  return api<ApiOfficeProfile>(officePath(organizationId, ""), {
    method: "PATCH",
    organizationId,
    body: patch,
  });
}

export function getSettings(organizationId: string) {
  return api<ApiOfficeSettings>(officePath(organizationId, "/settings"), {
    organizationId,
  });
}

export function updateSettings(organizationId: string, patch: SettingsPatch) {
  return api<ApiOfficeSettings>(officePath(organizationId, "/settings"), {
    method: "PATCH",
    organizationId,
    body: patch,
  });
}
