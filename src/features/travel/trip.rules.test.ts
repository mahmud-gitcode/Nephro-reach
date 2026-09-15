import { describe, expect, it } from "vitest";
import {
  TRIP_STATUSES,
  addTrip,
  canSubmit,
  emptyTrip,
  formatTripDates,
  isConfirmed,
  isOpen,
  removeTrip,
  sortTrips,
  statusIndex,
  statusLabel,
  tripError,
  tripLengthDays,
  updateTripStatus,
  TRAVEL_DOCUMENTS,
  addConfirmedTreatment,
  canConfirm,
  confirmationError,
  daysUntilDeparture,
  documentsProgress,
  emptyPlacement,
  formatDays,
  isPastTrip,
  pastTrips,
  placementShortfall,
  removeConfirmedTreatment,
  setFacilityNote,
  setPlacement,
  sortDays,
  toggleDay,
  toggleDocument,
  upcomingTrips,
  normaliseTrip,
  normaliseTrips,
  isEditable,
  needsChasing,
  progressPercent,
  tripPhase,
} from "./trip.rules";
import type { TripRequest } from "./trip.types";

/* A travel request is a promise a member makes plans around. The two ways
 * this can hurt someone are telling them a trip is booked when it is not,
 * and sending a coordinator dates that cannot be read. */

const NOW = new Date(2026, 8, 15, 10, 0, 0);

function trip(patch: Partial<TripRequest> = {}): TripRequest {
  return {
    ...emptyTrip(NOW),
    destination: "Tampa, FL",
    departDate: "2026-10-03",
    returnDate: "2026-10-12",
    treatmentsNeeded: 4,
    contactPhone: "555-0100",
    ...patch,
  };
}

describe("the status ladder", () => {
  it("runs in the order the architecture guide names", () => {
    expect(TRIP_STATUSES.map((entry) => entry.value)).toEqual([
      "submitted",
      "facility-reviewing",
      "records-sent",
      "placement-pending",
      "confirmed",
      "closed",
    ]);
  });

  it("knows how far along a request is", () => {
    expect(statusIndex("submitted")).toBe(0);
    expect(statusIndex("confirmed")).toBe(4);
  });

  it("calls only a confirmed trip booked", () => {
    // Every earlier status is still someone else working on it. Treating
    // "records sent" as booked would send a member to the airport.
    expect(isConfirmed(trip({ status: "records-sent" }))).toBe(false);
    expect(isConfirmed(trip({ status: "placement-pending" }))).toBe(false);
    expect(isConfirmed(trip({ status: "confirmed" }))).toBe(true);
  });

  it("counts everything but a closed trip as open", () => {
    expect(isOpen(trip({ status: "confirmed" }))).toBe(true);
    expect(isOpen(trip({ status: "closed" }))).toBe(false);
  });

  it("stamps the update time when the facility moves it along", () => {
    const later = new Date(2026, 8, 16, 9, 0, 0);
    const [moved] = updateTripStatus(
      [trip({ id: "t1" })],
      "t1",
      "records-sent",
      later,
    );
    expect(moved.status).toBe("records-sent");
    expect(moved.updatedAt).toBe(later.toISOString());
  });

  it("translates the status the member sees", () => {
    expect(statusLabel("placement-pending", false)).toBe("Placement Pending");
    expect(statusLabel("placement-pending", true)).toBe("Ubicación Pendiente");
  });
});

describe("what the form will not send", () => {
  it("needs somewhere to go", () => {
    expect(tripError(trip({ destination: "   " }))).toBe("destination");
  });

  it("refuses a return before the departure", () => {
    // A coordinator receiving this has to phone to ask what was meant, and
    // that is a day lost on something the form can catch.
    expect(
      tripError(trip({ departDate: "2026-10-12", returnDate: "2026-10-03" })),
    ).toBe("order");
  });

  it("needs at least one treatment and a contact number", () => {
    expect(tripError(trip({ treatmentsNeeded: 0 }))).toBe("treatments");
    expect(tripError(trip({ contactPhone: "" }))).toBe("phone");
  });

  it("accepts a complete request", () => {
    expect(tripError(trip())).toBeNull();
    expect(canSubmit(trip())).toBe(true);
  });

  it("allows a single-day trip", () => {
    const sameDay = trip({
      departDate: "2026-10-03",
      returnDate: "2026-10-03",
    });
    expect(canSubmit(sameDay)).toBe(true);
    expect(tripLengthDays(sameDay)).toBe(1);
  });

  it("starts a new request as submitted, not confirmed", () => {
    expect(emptyTrip(NOW).status).toBe("submitted");
  });
});

describe("the list", () => {
  it("puts the newest request first", () => {
    const older = trip({ id: "a", submittedAt: "2026-09-01T10:00:00.000Z" });
    const newer = trip({ id: "b", submittedAt: "2026-09-10T10:00:00.000Z" });
    expect(sortTrips([older, newer]).map((t) => t.id)).toEqual(["b", "a"]);
    expect(addTrip([older], newer).map((t) => t.id)).toEqual(["b", "a"]);
  });

  it("removes a cancelled request by id", () => {
    expect(
      removeTrip([trip({ id: "a" }), trip({ id: "b" })], "a"),
    ).toHaveLength(1);
  });
});

describe("dates a member reads", () => {
  it("counts both ends of the trip", () => {
    expect(tripLengthDays(trip())).toBe(10);
  });

  it("shows the year once, on the end date", () => {
    const shown = formatTripDates(trip(), false);
    expect(shown).toContain("Oct 3");
    expect(shown).toContain("2026");
  });
});

describe("upcoming and past", () => {
  const TODAY = "2026-10-08";

  it("keeps a trip upcoming until the member is home", () => {
    const current = trip({
      departDate: "2026-10-03",
      returnDate: "2026-10-12",
    });
    expect(isPastTrip(current, TODAY)).toBe(false);
  });

  it("drops a finished trip out of upcoming even if nobody closed it", () => {
    // Otherwise a trip nobody remembered to close sits at the top of the
    // member's screen for months.
    const over = trip({ departDate: "2026-09-01", returnDate: "2026-09-10" });
    expect(over.status).toBe("submitted");
    expect(isPastTrip(over, TODAY)).toBe(true);
  });

  it("treats a closed trip as past whatever the dates say", () => {
    const closed = trip({ status: "closed", returnDate: "2026-12-01" });
    expect(isPastTrip(closed, TODAY)).toBe(true);
  });

  it("splits a mixed list", () => {
    const list = [
      trip({ id: "a", departDate: "2026-11-01", returnDate: "2026-11-08" }),
      trip({ id: "b", departDate: "2026-08-01", returnDate: "2026-08-08" }),
    ];
    expect(upcomingTrips(list, TODAY).map((t) => t.id)).toEqual(["a"]);
    expect(pastTrips(list, TODAY).map((t) => t.id)).toEqual(["b"]);
  });

  it("counts down to departure", () => {
    expect(daysUntilDeparture(trip({ departDate: "2026-10-11" }), TODAY)).toBe(
      3,
    );
    expect(daysUntilDeparture(trip({ departDate: "2026-10-08" }), TODAY)).toBe(
      0,
    );
  });
});

describe("preferences and paperwork", () => {
  it("shows preferred days in week order however they were tapped", () => {
    let days = toggleDay([], "fri");
    days = toggleDay(days, "mon");
    days = toggleDay(days, "wed");
    expect(sortDays(days)).toEqual(["mon", "wed", "fri"]);
    expect(formatDays(days, false)).toBe("Mon · Wed · Fri");
  });

  it("says no preference rather than leaving it blank", () => {
    expect(formatDays([], false)).toBe("No preference");
    expect(formatDays([], true)).toBe("Sin preferencia");
  });

  it("ticks a document on and back off", () => {
    expect(toggleDocument([], "recent-labs")).toEqual(["recent-labs"]);
    expect(toggleDocument(["recent-labs"], "recent-labs")).toEqual([]);
  });

  it("counts the checklist against every document, not just the ticked ones", () => {
    const ready = documentsProgress(
      trip({ documentsReady: ["recent-labs", "insurance"] }),
    );
    expect(ready.ready).toBe(2);
    expect(ready.total).toBe(TRAVEL_DOCUMENTS.length);
    expect(ready.complete).toBe(false);

    const all = documentsProgress(
      trip({ documentsReady: TRAVEL_DOCUMENTS.map((d) => d.key) }),
    );
    expect(all.complete).toBe(true);
  });
});

describe("the placement the facility fills in", () => {
  it("will not call a trip confirmed without a facility and times", () => {
    // A patient reading "Confirmed" stops chasing it, so this is the one
    // guard worth having on the facility side.
    expect(confirmationError(trip())).toBe("no-placement");

    const named = trip({
      placement: { ...emptyPlacement(), facilityName: "Bayview Dialysis" },
    });
    expect(confirmationError(named)).toBe("no-treatments");

    const booked = trip({
      placement: addConfirmedTreatment(
        { ...emptyPlacement(), facilityName: "Bayview Dialysis" },
        "2026-10-05",
        "07:00",
      ),
    });
    expect(canConfirm(booked)).toBe(true);
  });

  it("keeps booked treatments in date and time order", () => {
    let placement = addConfirmedTreatment(
      emptyPlacement(),
      "2026-10-07",
      "12:00",
    );
    placement = addConfirmedTreatment(placement, "2026-10-05", "07:00");
    placement = addConfirmedTreatment(placement, "2026-10-05", "06:00");

    expect(placement.treatments.map((t) => `${t.date} ${t.time}`)).toEqual([
      "2026-10-05 06:00",
      "2026-10-05 07:00",
      "2026-10-07 12:00",
    ]);
  });

  it("removes one without disturbing the rest", () => {
    let placement = addConfirmedTreatment(
      emptyPlacement(),
      "2026-10-05",
      "07:00",
    );
    placement = addConfirmedTreatment(placement, "2026-10-07", "07:00");
    const id = placement.treatments[0].id;
    expect(removeConfirmedTreatment(placement, id).treatments).toHaveLength(1);
  });

  it("reports how many treatments are still to arrange", () => {
    const partial = trip({
      treatmentsNeeded: 4,
      placement: addConfirmedTreatment(
        { ...emptyPlacement(), facilityName: "Bayview" },
        "2026-10-05",
        "07:00",
      ),
    });
    expect(placementShortfall(partial)).toBe(3);
    expect(placementShortfall(trip({ treatmentsNeeded: 1 }))).toBe(1);
  });

  it("stamps the update time when the facility saves a placement", () => {
    const later = new Date(2026, 9, 1, 9, 0, 0);
    const [saved] = setPlacement(
      [trip({ id: "t1" })],
      "t1",
      { ...emptyPlacement(), facilityName: "Bayview" },
      later,
    );
    expect(saved.placement?.facilityName).toBe("Bayview");
    expect(saved.updatedAt).toBe(later.toISOString());
  });

  it("records a note to the patient without touching anything else", () => {
    const [noted] = setFacilityNote(
      [trip({ id: "t1" })],
      "t1",
      "Bayview can take you Tue and Thu.",
    );
    expect(noted.facilityNote).toBe("Bayview can take you Tue and Thu.");
    expect(noted.status).toBe("submitted");
  });
});

describe("trips written by an older version of the app", () => {
  /* Exactly what was in storage before preferences, contacts and the document
   * checklist existed. Reading `preferredDays.length` off this threw and took
   * the whole Dialysis Management page with it. */
  const legacy = {
    id: "legacy-1",
    destination: "Tampa, FL",
    departDate: "2026-10-03",
    returnDate: "2026-10-12",
    treatmentsNeeded: 4,
    contactPhone: "555-0100",
    notes: "",
    status: "submitted" as const,
    submittedAt: "2026-09-15T10:00:00.000Z",
    updatedAt: "2026-09-15T10:00:00.000Z",
    facilityNote: "",
  };

  it("fills the fields the screens now read", () => {
    const fixed = normaliseTrip(legacy);
    expect(fixed.preferredDays).toEqual([]);
    expect(fixed.preferredTime).toBe("any");
    expect(fixed.documentsReady).toEqual([]);
    expect(fixed.emergencyContact).toEqual({
      name: "",
      phone: "",
      relationship: "",
    });
    expect(fixed.insurance).toEqual({ plan: "", memberId: "" });
  });

  it("survives the call that used to crash", () => {
    expect(() =>
      formatDays(normaliseTrip(legacy).preferredDays, false),
    ).not.toThrow();
    expect(formatDays(normaliseTrip(legacy).preferredDays, false)).toBe(
      "No preference",
    );
    expect(documentsProgress(normaliseTrip(legacy)).ready).toBe(0);
  });

  it("keeps everything the old record did have", () => {
    const fixed = normaliseTrip(legacy);
    expect(fixed.id).toBe("legacy-1");
    expect(fixed.destination).toBe("Tampa, FL");
    expect(fixed.treatmentsNeeded).toBe(4);
    expect(fixed.submittedAt).toBe("2026-09-15T10:00:00.000Z");
  });

  it("does not let an explicit undefined overwrite a default", () => {
    // Spreading alone would do exactly that, which is why the fields are
    // listed again after the spread.
    const withUndefined = { ...legacy, preferredDays: undefined };
    expect(normaliseTrip(withUndefined).preferredDays).toEqual([]);
  });

  it("normalises a whole list", () => {
    expect(normaliseTrips([legacy, legacy])).toHaveLength(2);
    expect(normaliseTrips([])).toEqual([]);
  });
});

describe("where a trip is in its life", () => {
  const away = trip({ departDate: "2026-10-03", returnDate: "2026-10-12" });

  it("is planned before they go, away while they are, home after", () => {
    expect(tripPhase(away, "2026-10-01")).toBe("planned");
    expect(tripPhase(away, "2026-10-03")).toBe("away");
    expect(tripPhase(away, "2026-10-12")).toBe("away");
    expect(tripPhase(away, "2026-10-13")).toBe("home");
  });

  it("treats a closed trip as home whatever the dates say", () => {
    expect(tripPhase(trip({ status: "closed" }), "2026-10-05")).toBe("home");
  });

  it("is a different thing from the status", () => {
    // The case worth showing loudly: the member is already away and nobody
    // has confirmed a chair.
    const stranded = trip({
      status: "placement-pending",
      departDate: "2026-10-03",
      returnDate: "2026-10-12",
    });
    expect(tripPhase(stranded, "2026-10-05")).toBe("away");
    expect(canConfirm(stranded)).toBe(false);
  });
});

describe("what a member may still change", () => {
  it("can edit until the facility confirms", () => {
    expect(isEditable(trip({ status: "submitted" }), "2026-10-01")).toBe(true);
    expect(
      isEditable(trip({ status: "placement-pending" }), "2026-10-01"),
    ).toBe(true);
  });

  it("cannot edit once it is confirmed", () => {
    // Editing after confirmation would desync what the member thinks is
    // booked from what the receiving unit holds.
    expect(isEditable(trip({ status: "confirmed" }), "2026-10-01")).toBe(false);
  });

  it("cannot edit once they have gone", () => {
    expect(
      isEditable(
        trip({ departDate: "2026-10-03", returnDate: "2026-10-12" }),
        "2026-10-05",
      ),
    ).toBe(false);
  });
});

describe("when to chase the clinic", () => {
  it("speaks up inside two weeks with nothing confirmed", () => {
    const soon = trip({ departDate: "2026-10-10", returnDate: "2026-10-18" });
    expect(needsChasing(soon, "2026-10-01")).toBe(true);
  });

  it("stays quiet with plenty of time", () => {
    const later = trip({ departDate: "2026-11-20", returnDate: "2026-11-28" });
    expect(needsChasing(later, "2026-10-01")).toBe(false);
  });

  it("stays quiet once it is confirmed", () => {
    const done = trip({
      status: "confirmed",
      departDate: "2026-10-10",
      returnDate: "2026-10-18",
    });
    expect(needsChasing(done, "2026-10-01")).toBe(false);
  });

  it("stays quiet once they have already gone", () => {
    // Nothing useful left to chase at that point, and the card says
    // "Away now" instead.
    const gone = trip({ departDate: "2026-10-03", returnDate: "2026-10-12" });
    expect(needsChasing(gone, "2026-10-05")).toBe(false);
  });
});

describe("the progress strip", () => {
  it("runs from nothing to full across the ladder", () => {
    expect(progressPercent(trip({ status: "submitted" }))).toBe(0);
    expect(progressPercent(trip({ status: "confirmed" }))).toBe(80);
    expect(progressPercent(trip({ status: "closed" }))).toBe(100);
  });
});
