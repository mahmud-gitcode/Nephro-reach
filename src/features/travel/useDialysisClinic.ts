"use client";

import { useHomeDialysisClinic } from "@/features/profile/useHomeDialysisClinic";
import { EMPTY_CLINIC } from "@/features/profile/homeDialysisClinic";

export { toTelHref } from "./clinic.repository";
export type { DialysisClinic } from "./clinic.types";

/**
 * The member's home dialysis clinic, from the API (Phase 4, MEMBER lane:
 * `@/features/profile/useHomeDialysisClinic`). This keeps the shape the
 * travel and Before-the-ER screens already read: `clinic` is undefined
 * while loading or after a failed read (the card shows its error state, a
 * number a member calls in an emergency must not quietly render blank),
 * and the empty clinic when none is saved. A save keeps the clinic's link
 * to its NephroReach center (`organizationId`) unless the member picks
 * another.
 */
export function useDialysisClinic() {
  const home = useHomeDialysisClinic();
  return {
    ...home,
    clinic:
      home.clinic === undefined ? undefined : (home.clinic ?? EMPTY_CLINIC),
  };
}
