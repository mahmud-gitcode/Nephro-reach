/* ==========================================================================
   What the member reads when a dialysis change is refused (Phase 7)
   --------------------------------------------------------------------------
   A dialysis center that manages an in-center prescription owns it and its
   schedule (D16): the server refuses the member's change with 403
   `dialysis.prescription_managed_by_facility`. That is not "not shared with
   you" (the member can still read it), so it gets its own sentence; every
   other failure uses the shared save-error copy.
   ========================================================================== */

import { isApiError } from "@/lib/api/client";
import { saveErrorText } from "@/features/profile/saveError";
import { dialysisText } from "./dialysisText";

export const MANAGED_BY_FACILITY = "dialysis.prescription_managed_by_facility";

export function dialysisSaveErrorText(
  error: unknown,
  lang: "en" | "es" = "en",
): string {
  if (isApiError(error, { status: 403, code: MANAGED_BY_FACILITY }))
    return dialysisText(lang, "errors.managedByFacility");
  return saveErrorText(error, lang);
}
