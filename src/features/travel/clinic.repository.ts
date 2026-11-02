/* The member's home dialysis clinic moved to the API in Phase 4
   (`@/features/profile/useHomeDialysisClinic`, `/patients/:id/
   home-dialysis-clinic`); its browser copy (`nr:dialysis-clinic`) and the
   demo clinic are gone. Only the tel: helper is left here. */

/** Strips formatting so the number works in a tel: link. */
export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
