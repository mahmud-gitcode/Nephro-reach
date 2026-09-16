import { todayIso } from "./trip.rules";
import type { TripRequest } from "./trip.types";
import type {
  TravelReflection,
  TravelTreatment,
} from "./travelTreatment.types";

/* ==========================================================================
   Travel dialysis — example data
   --------------------------------------------------------------------------
   Frontend-phase placeholder content. The travel screens open on it,
   because eight panels that each need a trip to describe show nothing
   useful without one.

   Ids carry `SAMPLE_PREFIX` so this content stays identifiable next to
   anything a reviewer types in by hand. Dates are generated relative to
   today rather than written down, so the trip still reads as upcoming
   whenever the page is opened.

   This file goes when the API lands.
   ========================================================================== */

/** Any trip or treatment whose id starts with this is example content. */
export const SAMPLE_PREFIX = "trip-sample-";

export const isSample = (id: string) => id.startsWith(SAMPLE_PREFIX);

/** `yyyy-mm-dd`, `offset` days from today. */
function dayFrom(offset: number, now = new Date()): string {
  const cursor = new Date(now);
  cursor.setDate(cursor.getDate() + offset);
  return todayIso(cursor);
}

/** A full ISO timestamp, `offset` days from now at a given hour. */
function timeFrom(offset: number, hour: number, minute = 0, now = new Date()) {
  const cursor = new Date(now);
  cursor.setDate(cursor.getDate() + offset);
  cursor.setHours(hour, minute, 0, 0);
  return cursor.toISOString();
}

/**
 * One confirmed trip, far enough out to still be upcoming.
 *
 * Confirmed on purpose: an unconfirmed request shows empty panels, which is
 * the correct behaviour but a poor demonstration of what the screen does.
 */
export function sampleTrip(now = new Date()): TripRequest {
  return {
    id: `${SAMPLE_PREFIX}orlando`,

    destination: {
      street: "820 Sunbridge Parkway, Apt 4B",
      city: "Orlando",
      state: "FL",
      zip: "32801",
    },
    departDate: dayFrom(12, now),
    returnDate: dayFrom(19, now),
    treatmentsNeeded: 3,
    preferredDays: ["tue", "thu", "sat"],
    preferredTime: "morning",
    contactPhone: "(555) 010-4477",
    emergencyContact: {
      name: "Denise Park",
      phone: "(555) 010-9920",
      relationship: "Daughter",
    },
    insurance: { plan: "Medicare Part B", memberId: "1EG4-TE5-MK72" },
    documentsReady: ["treatment-orders", "recent-labs", "insurance"],
    prepDone: ["transportation"],
    documentFiles: [],
    notes:
      "Left-arm fistula. I need a chair before 11am — the family is driving me each day.",

    status: "confirmed",
    submittedAt: timeFrom(-4, 10, 24, now),
    updatedAt: timeFrom(-2, 9, 40, now),
    statusHistory: [
      { status: "submitted", at: timeFrom(-4, 10, 24, now) },
      { status: "facility-reviewing", at: timeFrom(-4, 14, 15, now) },
      { status: "records-sent", at: timeFrom(-3, 11, 5, now) },
      { status: "confirmed", at: timeFrom(-2, 9, 40, now) },
    ],
    facilityNote:
      "All set — bring your medication list. Your orders have been sent by your home facility.",
    placement: {
      facilityName: "Fresenius Kidney Care — Orlando East",
      address: "1234 Health Way, Orlando, FL 32801",
      phone: "(407) 555-1234",
      treatments: [
        { id: `${SAMPLE_PREFIX}t1`, date: dayFrom(13, now), time: "10:00" },
        { id: `${SAMPLE_PREFIX}t2`, date: dayFrom(15, now), time: "10:00" },
        { id: `${SAMPLE_PREFIX}t3`, date: dayFrom(17, now), time: "10:00" },
      ],
    },
  };
}

/** Two finished trips, so the history panel has something to show. */
export function samplePastTrips(now = new Date()): TripRequest[] {
  const base = sampleTrip(now);

  const past = (
    key: string,
    destination: { city: string; state: string },
    from: number,
    to: number,
  ): TripRequest => ({
    ...base,
    id: `${SAMPLE_PREFIX}${key}`,
    destination: {
      ...base.destination,
      city: destination.city,
      state: destination.state,
    },
    departDate: dayFrom(from, now),
    returnDate: dayFrom(to, now),
    status: "closed",
    submittedAt: timeFrom(from - 10, 9, 0, now),
    updatedAt: timeFrom(to, 17, 0, now),
    statusHistory: [
      { status: "submitted", at: timeFrom(from - 10, 9, 0, now) },
      { status: "confirmed", at: timeFrom(from - 6, 15, 30, now) },
      { status: "closed", at: timeFrom(to, 17, 0, now) },
    ],
    facilityNote: "",
    placement: { ...base.placement!, treatments: [] },
  });

  return [
    past("atlanta", { city: "Atlanta", state: "GA" }, -180, -175),
    past("miami", { city: "Miami", state: "FL" }, -250, -245),
    past("charleston", { city: "Charleston", state: "SC" }, -320, -315),
  ];
}

/**
 * The treatment log for the upcoming trip.
 *
 * Dated in the past even though the trip itself is ahead, because a log can
 * only hold days that have happened — `canSaveTreatment` refuses a future
 * date, and example data that the app's own rules would reject teaches the
 * wrong thing about the screen.
 */
export function sampleTreatments(now = new Date()): TravelTreatment[] {
  const tripId = `${SAMPLE_PREFIX}orlando`;

  const run = (
    key: string,
    offset: number,
    pre: string,
    post: string,
    bp: string,
    fluid: string,
    completed: boolean,
    notes: string,
  ): TravelTreatment => ({
    id: `${SAMPLE_PREFIX}${key}`,
    tripId,
    date: dayFrom(offset, now),
    facilityName: "Fresenius Kidney Care — Orlando East",
    preWeight: pre,
    postWeight: post,
    bloodPressure: bp,
    treatmentTime: "3.5 hrs",
    fluidRemoved: fluid,
    completed,
    notes,
    savedAt: timeFrom(offset, 16, 0, now),
  });

  return [
    run("tx1", -5, "97.5", "95.1", "142/78", "2.4", true, "No issues."),
    run("tx2", -3, "96.8", "94.6", "138/76", "2.2", true, "Tolerated well."),
    /* One short run on purpose: it is the row a care team reads first, and
       a log where everything went fine never shows that state. */
    run(
      "tx3",
      -1,
      "97.2",
      "95.8",
      "150/84",
      "1.4",
      false,
      "Cramped badly at 2 hours, came off early. Nurse said to mention it at home.",
    ),
  ];
}

/** The member's own write-up of the example trip. */
export function sampleReflections(now = new Date()): TravelReflection[] {
  return [
    {
      tripId: `${SAMPLE_PREFIX}orlando`,
      body: "Travelling went better than I expected. The unit was busy but the staff knew I was coming, and the chair was ready both mornings. The third run was rough — worth telling my own team about.",
      updatedAt: now.toISOString(),
    },
  ];
}
