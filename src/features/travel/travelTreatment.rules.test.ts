import { describe, expect, it } from "vitest";
import { emptyTrip } from "./trip.rules";
import type { TripRequest } from "./trip.types";
import {
  canSaveTreatment,
  clipReflection,
  emptyTreatment,
  reflectionRemaining,
  removeTreatment,
  removeTreatmentsForTrip,
  sortTreatments,
  treatmentError,
  treatmentProgress,
  treatmentsForTrip,
  upsertTreatment,
} from "./travelTreatment.rules";
import type { TravelTreatment } from "./travelTreatment.types";
import { REFLECTION_MAX } from "./travelTreatment.types";

/* Two things can go wrong on this log and both mislead the team back home:
 * a run that was cut short reading as a full one, and a treatment filed
 * under the wrong trip so it never reaches the right history. */

const NOW = new Date(2026, 5, 20, 9, 0, 0); // Sat 20 Jun 2026, local

function treatment(patch: Partial<TravelTreatment> = {}): TravelTreatment {
  return { ...emptyTreatment("trip-1", "Fresenius Orlando", NOW), ...patch };
}

describe("logging a treatment", () => {
  it("carries the facility over so it is not retyped every run", () => {
    expect(
      emptyTreatment("trip-1", "Fresenius Orlando", NOW).facilityName,
    ).toBe("Fresenius Orlando");
  });

  it("assumes a treatment finished, because most do", () => {
    expect(emptyTreatment("trip-1", "", NOW).completed).toBe(true);
  });

  it("refuses a day that has not happened yet", () => {
    expect(treatmentError(treatment({ date: "2026-06-21" }), NOW)).toBe(
      "future-date",
    );
    expect(canSaveTreatment(treatment({ date: "2026-06-21" }), NOW)).toBe(
      false,
    );
  });

  it("accepts today and any earlier day", () => {
    expect(canSaveTreatment(treatment({ date: "2026-06-20" }), NOW)).toBe(true);
    expect(canSaveTreatment(treatment({ date: "2026-06-16" }), NOW)).toBe(true);
  });

  it("does not require any of the clinical numbers", () => {
    // A member copying a machine in a strange unit must never be blocked.
    const bare = treatment({
      preWeight: undefined,
      postWeight: undefined,
      bloodPressure: undefined,
      fluidRemoved: undefined,
    });
    expect(canSaveTreatment(bare, NOW)).toBe(true);
  });
});

describe("the log", () => {
  const a = treatment({ id: "a", date: "2026-06-16" });
  const b = treatment({ id: "b", date: "2026-06-18" });
  const other = treatment({ id: "c", date: "2026-06-17", tripId: "trip-2" });

  it("reads newest first", () => {
    expect(sortTreatments([a, b]).map((t) => t.id)).toEqual(["b", "a"]);
  });

  it("keeps each trip's treatments to that trip", () => {
    expect(treatmentsForTrip([a, b, other], "trip-1").map((t) => t.id)).toEqual(
      ["b", "a"],
    );
  });

  it("edits a row rather than stacking a second one", () => {
    const next = upsertTreatment([a, b], { ...a, fluidRemoved: "2.4" });
    expect(next).toHaveLength(2);
    expect(next.find((t) => t.id === "a")?.fluidRemoved).toBe("2.4");
  });

  it("drops one row", () => {
    expect(removeTreatment([a, b], "a").map((t) => t.id)).toEqual(["b"]);
  });

  it("takes the whole log when its trip is deleted, and leaves others alone", () => {
    expect(
      removeTreatmentsForTrip([a, b, other], "trip-1").map((t) => t.id),
    ).toEqual(["c"]);
  });
});

describe("progress against the trip", () => {
  const trip: TripRequest = {
    ...emptyTrip(NOW),
    id: "trip-1",
    treatmentsNeeded: 3,
  };

  it("counts a short run separately from a finished one", () => {
    const progress = treatmentProgress(
      [
        treatment({ id: "a", completed: true }),
        treatment({ id: "b", completed: true }),
        treatment({ id: "c", completed: false }),
      ],
      trip,
    );
    expect(progress.logged).toBe(3);
    expect(progress.completed).toBe(2);
    expect(progress.incomplete).toBe(1);
  });

  it("expects what the member asked for until the facility books", () => {
    expect(treatmentProgress([], trip).expected).toBe(3);
  });

  it("expects what the facility actually booked once it has", () => {
    const booked: TripRequest = {
      ...trip,
      placement: {
        facilityName: "Fresenius Orlando",
        address: "",
        phone: "",
        treatments: [
          { id: "t1", date: "2026-06-16", time: "10:00" },
          { id: "t2", date: "2026-06-18", time: "10:00" },
        ],
      },
    };
    expect(treatmentProgress([], booked).expected).toBe(2);
  });

  it("ignores another trip's treatments", () => {
    expect(
      treatmentProgress([treatment({ id: "c", tripId: "trip-2" })], trip)
        .logged,
    ).toBe(0);
  });
});

describe("reflections", () => {
  it("clips rather than rejects, so nothing written is lost", () => {
    const long = "x".repeat(REFLECTION_MAX + 50);
    expect(clipReflection(long)).toHaveLength(REFLECTION_MAX);
  });

  it("counts down to the cap", () => {
    expect(reflectionRemaining("")).toBe(REFLECTION_MAX);
    expect(reflectionRemaining("hello")).toBe(REFLECTION_MAX - 5);
  });
});
