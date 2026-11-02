/* ==========================================================================
   Travel dialysis by email (client, 2026-10-07)
   --------------------------------------------------------------------------
   A member whose dialysis clinic is not on NephroReach can still send the
   request: their own email app opens with the request written out,
   addressed to their clinic. Nothing leaves the device until they press
   send there, and the External Sharing Notice comes first.
   ========================================================================== */

import { formatDays, timePreferenceLabel } from "./trip.rules";
import type { TripRequest } from "./trip.types";

/**
 * Is the member's home dialysis clinic on NephroReach? The server says so
 * (GET /patients/:id/home-dialysis-clinic -> onNephroReach, Phase 8): a
 * clinic picked from the directory is linked by its organization id, a
 * typed-in one is not. No name matching against a demo list (NEW-1).
 */
export function clinicOnNephroReach(
  clinic: { onNephroReach?: boolean } | null | undefined,
): boolean {
  return clinic?.onNephroReach === true;
}

export function travelRequestEmail(
  trip: TripRequest,
  memberName: string,
): { subject: string; body: string } {
  const d = trip.destination;
  const lines: Array<[string, string]> = [
    ["Patient", memberName],
    [
      "Destination",
      [d.street, d.city, [d.state, d.zip].filter(Boolean).join(" ")]
        .filter((part) => part.trim())
        .join(", "),
    ],
    ["Dates", `${trip.departDate} to ${trip.returnDate}`],
    ["Treatments needed", String(trip.treatmentsNeeded)],
    [
      "Preferred days",
      `${formatDays(trip.preferredDays, false)} · ${timePreferenceLabel(trip.preferredTime, false)}`,
    ],
    ["Phone", trip.contactPhone],
    [
      "Emergency contact",
      [
        trip.emergencyContact.name,
        trip.emergencyContact.relationship,
        trip.emergencyContact.phone,
      ]
        .filter(Boolean)
        .join(" · "),
    ],
    [
      "Insurance",
      [trip.insurance.plan, trip.insurance.memberId]
        .filter(Boolean)
        .join(" · "),
    ],
    ["Notes", trip.notes],
  ];
  return {
    subject: `Travel dialysis request: ${memberName}, ${trip.departDate} to ${trip.returnDate}`,
    body: [
      "Hello,",
      "",
      "I am travelling and need dialysis while I am away. Could you help arrange treatment at a center near my destination?",
      "",
      ...lines.filter(([, v]) => v.trim()).map(([k, v]) => `${k}: ${v}`),
      "",
      "Thank you.",
      "",
      "Sent from my NephroReach account.",
    ].join("\n"),
  };
}
