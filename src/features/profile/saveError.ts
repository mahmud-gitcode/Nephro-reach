/* ==========================================================================
   What a member reads when a save fails (Phases 4-5)
   --------------------------------------------------------------------------
   A form stays open on a failed save and says why. A 403 is "not shared
   with you"; a 4xx with the server's own sentence (a validation message, a
   duplicate, "a check-in already exists for this day") shows that
   sentence; anything else (offline, 5xx) is a plain "try again".
   ========================================================================== */

import { isApiError } from "@/lib/api/client";
import { errorMessageFor, isNotShared } from "@/lib/data/asyncState";

const GENERIC = {
  en: "That didn't save. Check your connection and try again.",
  es: "No se pudo guardar. Revise su conexión e inténtelo de nuevo.",
} as const;

export function saveErrorText(
  error: unknown,
  lang: "en" | "es" = "en",
): string {
  if (isNotShared(error)) return String(errorMessageFor(error, "", lang));
  if (
    isApiError(error) &&
    error.status >= 400 &&
    error.status < 500 &&
    error.messages.length > 0
  )
    return error.messages.join(" ");
  return GENERIC[lang];
}
