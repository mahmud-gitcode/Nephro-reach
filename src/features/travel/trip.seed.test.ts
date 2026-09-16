import { describe, expect, it } from "vitest";
import {
  SAMPLE_PREFIX,
  isSample,
  samplePastTrips,
  sampleTreatments,
  sampleTrip,
} from "./trip.seed";
import {
  canSubmit,
  isPastTrip,
  todayIso,
  tripMilestones,
  upcomingTrips,
} from "./trip.rules";
import { canSaveTreatment } from "./travelTreatment.rules";

/* Example data has one job beyond looking right: it must be something the
 * app's own rules would have accepted. A demo the validators would reject
 * teaches the wrong thing about the screen, and it hides real bugs. */

const NOW = new Date(2026, 8, 16, 9, 0, 0); // Wed 16 Sep 2026, local

describe("example trips", () => {
  it("marks everything it creates so removal cannot touch a real trip", () => {
    const ids = [
      sampleTrip(NOW).id,
      ...samplePastTrips(NOW).map((trip) => trip.id),
      ...sampleTreatments(NOW).map((row) => row.id),
    ];
    expect(ids.every(isSample)).toBe(true);
    expect(ids.every((id) => id.startsWith(SAMPLE_PREFIX))).toBe(true);
  });

  it("would pass the same validation a member's own request does", () => {
    expect(canSubmit(sampleTrip(NOW))).toBe(true);
  });

  it("is still upcoming, whenever it is switched on", () => {
    const trip = sampleTrip(NOW);
    expect(isPastTrip(trip, todayIso(NOW))).toBe(false);
    expect(upcomingTrips([trip], todayIso(NOW))).toHaveLength(1);
  });

  it("puts the past trips in the past", () => {
    for (const trip of samplePastTrips(NOW)) {
      expect(isPastTrip(trip, todayIso(NOW))).toBe(true);
    }
  });

  it("shows a fully worked timeline rather than a bare first step", () => {
    // An unconfirmed request renders empty panels — correct, but a poor
    // demonstration of what the screen actually does.
    const milestones = tripMilestones(sampleTrip(NOW));
    expect(milestones.map((m) => m.state)).toEqual([
      "done",
      "done",
      "current",
      "todo",
    ]);
    expect(milestones[0].at).toBeDefined();
    expect(milestones[1].at).toBeDefined();
    expect(milestones[2].at).toBeDefined();
  });

  it("books as many chairs as the request asked for", () => {
    const trip = sampleTrip(NOW);
    expect(trip.placement?.treatments).toHaveLength(trip.treatmentsNeeded);
  });

  it("leaves the checklist part-done so both states are visible", () => {
    const trip = sampleTrip(NOW);
    expect(trip.documentsReady.length).toBeGreaterThan(0);
    expect(trip.prepDone.length).toBeGreaterThan(0);
    // Not everything: a checklist showing 8 of 8 demonstrates nothing.
    expect(trip.documentsReady).not.toContain("emergency-contact");
  });
});

describe("example treatments", () => {
  it("only holds days that have already happened", () => {
    // canSaveTreatment refuses a future date, so example rows the app would
    // reject would be teaching the wrong thing.
    for (const row of sampleTreatments(NOW)) {
      expect(canSaveTreatment(row, NOW)).toBe(true);
    }
  });

  it("belongs to the example trip", () => {
    const tripId = sampleTrip(NOW).id;
    for (const row of sampleTreatments(NOW)) {
      expect(row.tripId).toBe(tripId);
    }
  });

  it("includes one run that was cut short", () => {
    // The row a care team reads first. A log where everything went fine
    // never shows that state.
    const rows = sampleTreatments(NOW);
    expect(rows.filter((row) => !row.completed)).toHaveLength(1);
    expect(rows.filter((row) => row.completed).length).toBeGreaterThan(0);
  });

  it("carries the numbers a nurse would ask for", () => {
    for (const row of sampleTreatments(NOW)) {
      expect(row.preWeight).toBeTruthy();
      expect(row.postWeight).toBeTruthy();
      expect(row.bloodPressure).toBeTruthy();
      expect(row.fluidRemoved).toBeTruthy();
    }
  });
});
