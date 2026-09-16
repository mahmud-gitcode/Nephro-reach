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
  TRAVEL_PREP,
  addConfirmedTreatment,
  canRequestTimeChange,
  canSubmitTimeChange,
  checklistProgress,
  defaultTripFilter,
  emptyTimeChange,
  hasOpenTimeChange,
  requestTimeChange,
  resolveTimeChange,
  timeChangeError,
  withdrawTimeChange,
  filterTrips,
  formatEventTime,
  tripFilterCounts,
  travelChecklist,
  togglePrep,
  tripMilestones,
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
import type {
  TravelDocumentKey,
  TravelPrepKey,
  TripRequest,
} from "./trip.types";

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

describe("the travel checklist", () => {
  const base = emptyTrip();

  it("lists the eight things that have to be true before a flight", () => {
    expect(travelChecklist(base)).toHaveLength(8);
    expect(checklistProgress(base)).toMatchObject({ done: 0, total: 8 });
  });

  it("will not let a member tick their own placement", () => {
    // A checkbox here would tell someone they have a bed nobody booked.
    const facility = travelChecklist(base).find(
      (item) => item.id === "facility",
    );
    expect(facility?.memberControlled).toBe(false);
  });

  it("ticks the facility row only once a chair is actually booked", () => {
    const empty = { ...base, placement: emptyPlacement() };
    expect(
      travelChecklist(empty).find((item) => item.id === "facility")?.done,
    ).toBe(false);

    const booked = {
      ...base,
      placement: {
        ...emptyPlacement(),
        treatments: [{ id: "t1", date: "2026-06-16", time: "10:00" }],
      },
    };
    expect(
      travelChecklist(booked).find((item) => item.id === "facility")?.done,
    ).toBe(true);
  });

  it("reads documents from the request rather than a second copy", () => {
    const trip = { ...base, documentsReady: ["recent-labs" as const] };
    expect(checklistProgress(trip).done).toBe(1);
    expect(
      travelChecklist(trip).find((item) => item.id === "recent-labs")?.done,
    ).toBe(true);
  });

  it("keeps transportation and packing out of the document list", () => {
    // Those are things a member does, not records a unit needs sent.
    expect(TRAVEL_DOCUMENTS.map((entry) => entry.key)).not.toContain(
      "transportation",
    );
    expect(TRAVEL_PREP.map((entry) => entry.key)).toEqual([
      "transportation",
      "personal-items",
    ]);
  });

  it("counts prep steps toward the total", () => {
    const trip = { ...base, prepDone: ["transportation" as const] };
    expect(checklistProgress(trip).done).toBe(1);
  });

  it("is complete only when every row is", () => {
    const trip = {
      ...base,
      placement: {
        ...emptyPlacement(),
        treatments: [{ id: "t1", date: "2026-06-16", time: "10:00" }],
      },
      documentsReady: [
        "treatment-orders",
        "recent-labs",
        "medication-list",
        "insurance",
        "emergency-contact",
      ] satisfies TravelDocumentKey[],
      prepDone: ["transportation", "personal-items"] satisfies TravelPrepKey[],
    };
    expect(checklistProgress(trip).complete).toBe(true);
  });

  it("toggles a prep flag on and back off", () => {
    expect(togglePrep([], "transportation")).toEqual(["transportation"]);
    expect(togglePrep(["transportation"], "transportation")).toEqual([]);
  });

  it("gives an older stored trip an empty prep list rather than undefined", () => {
    expect(normaliseTrip({ destination: "Miami" }).prepDone).toEqual([]);
  });
});

describe("the status timeline", () => {
  const AT = new Date(2026, 8, 12, 10, 24, 0);

  const state = (trip: TripRequest) =>
    tripMilestones(trip).map((m) => `${m.id}:${m.state}`);

  it("folds six coordinator rungs into four member milestones", () => {
    expect(tripMilestones(emptyTrip(AT)).map((m) => m.id)).toEqual([
      "submitted",
      "in-progress",
      "confirmation",
      "completed",
    ]);
  });

  it("marks a fresh request as on its first milestone", () => {
    expect(state(emptyTrip(AT))).toEqual([
      "submitted:current",
      "in-progress:todo",
      "confirmation:todo",
      "completed:todo",
    ]);
  });

  it("shows one In Progress for every middle rung, not three steps", () => {
    for (const status of [
      "facility-reviewing",
      "records-sent",
      "placement-pending",
    ] as const) {
      expect(state({ ...emptyTrip(AT), status })).toEqual([
        "submitted:done",
        "in-progress:current",
        "confirmation:todo",
        "completed:todo",
      ]);
    }
  });

  it("moves to confirmation once a chair is booked", () => {
    expect(state({ ...emptyTrip(AT), status: "confirmed" })).toEqual([
      "submitted:done",
      "in-progress:done",
      "confirmation:current",
      "completed:todo",
    ]);
  });

  it("completes only when the trip is closed", () => {
    expect(state({ ...emptyTrip(AT), status: "closed" })).toEqual([
      "submitted:done",
      "in-progress:done",
      "confirmation:done",
      "completed:current",
    ]);
  });

  it("dates a milestone from when it was actually reached", () => {
    const later = new Date(2026, 8, 14, 9, 40, 0);
    const [trip] = updateTripStatus(
      [emptyTrip(AT)],
      emptyTrip(AT).id,
      "records-sent",
      later,
    );
    const milestones = tripMilestones({ ...trip, id: trip.id });

    expect(milestones[0].at).toBe(AT.toISOString());
    expect(milestones[1].at).toBe(later.toISOString());
  });

  it("leaves a milestone undated rather than guessing one", () => {
    // Nothing recorded "confirmed", so the row shows no date at all.
    expect(tripMilestones(emptyTrip(AT))[2].at).toBeUndefined();
  });

  it("does not stamp the same rung twice when a coordinator re-saves", () => {
    const trip = emptyTrip(AT);
    const once = updateTripStatus([trip], trip.id, "confirmed", AT);
    const twice = updateTripStatus(once, trip.id, "confirmed", new Date());

    expect(
      twice[0].statusHistory.filter((e) => e.status === "confirmed"),
    ).toHaveLength(1);
  });

  it("gives an older stored trip a timeline from the dates it does have", () => {
    const older = normaliseTrip({
      id: "old",
      status: "confirmed",
      submittedAt: "2026-09-01T09:00:00.000Z",
      updatedAt: "2026-09-05T14:00:00.000Z",
    });

    expect(older.statusHistory).toEqual([
      { status: "submitted", at: "2026-09-01T09:00:00.000Z" },
      { status: "confirmed", at: "2026-09-05T14:00:00.000Z" },
    ]);
    // The rung in between is genuinely unknown, so it carries no date.
    expect(tripMilestones(older)[1].at).toBeUndefined();
  });

  it("formats an event with the time of day, not just the date", () => {
    const shown = formatEventTime(AT.toISOString(), false);
    expect(shown).toMatch(/Sep/);
    expect(shown).toMatch(/10:24/);
  });

  it("survives a timestamp it cannot read", () => {
    expect(formatEventTime("not-a-date", false)).toBe("");
  });
});

describe("filtering the trip list", () => {
  const TODAY = "2026-09-16";

  const trip = (id: string, depart: string, ret: string, patch = {}) => ({
    ...emptyTrip(),
    id,
    destination: id,
    departDate: depart,
    returnDate: ret,
    ...patch,
  });

  const planned = trip("planned", "2026-09-28", "2026-10-04");
  const away = trip("away", "2026-09-14", "2026-09-20");
  const home = trip("home", "2026-08-01", "2026-08-07");
  const closed = trip("closed", "2026-09-28", "2026-10-04", {
    status: "closed" as const,
  });

  const all = [planned, away, home, closed];

  it("treats a planned trip and one under way as the same thing", () => {
    // To somebody choosing from a list they are both "still going on".
    expect(
      filterTrips(all, "in-progress", TODAY)
        .map((t) => t.id)
        .sort(),
    ).toEqual(["away", "planned"]);
  });

  it("puts finished trips under previous", () => {
    expect(
      filterTrips(all, "previous", TODAY)
        .map((t) => t.id)
        .sort(),
    ).toEqual(["closed", "home"]);
  });

  it("counts a cancelled-but-future trip as previous, not in progress", () => {
    // Status beats the calendar: a closed trip is not one to pack for.
    expect(filterTrips([closed], "in-progress", TODAY)).toEqual([]);
  });

  it("shows everything under All", () => {
    expect(filterTrips(all, "all", TODAY)).toHaveLength(4);
  });

  it("counts each option so an empty one reads as empty, not broken", () => {
    expect(tripFilterCounts(all, TODAY)).toEqual({
      all: 4,
      "in-progress": 2,
      previous: 2,
    });
  });

  it("opens on a live trip when there is one", () => {
    expect(defaultTripFilter(all, TODAY)).toBe("in-progress");
  });

  it("falls back to All rather than an empty list", () => {
    // Three finished trips behind an empty "in progress" reads as data loss.
    expect(defaultTripFilter([home, closed], TODAY)).toBe("all");
    expect(defaultTripFilter([], TODAY)).toBe("all");
  });
});

describe("asking to move the booked times", () => {
  const NOW = new Date(2026, 8, 16, 9, 0, 0);

  const booked = (patch = {}): TripRequest => ({
    ...emptyTrip(NOW),
    id: "trip-1",
    departDate: "2026-09-28",
    returnDate: "2026-10-04",
    status: "confirmed" as const,
    placement: {
      facilityName: "Fresenius Orlando",
      address: "",
      phone: "",
      treatments: [{ id: "t1", date: "2026-09-29", time: "10:00" }],
    },
    ...patch,
  });

  it("is only offered once there is something booked to move", () => {
    // Before that the request itself is still editable, and two ways to
    // change the same unconfirmed times is one too many.
    expect(canRequestTimeChange(emptyTrip(NOW))).toBe(false);
    expect(canRequestTimeChange(booked())).toBe(true);
  });

  it("is not offered on a trip that is over", () => {
    expect(canRequestTimeChange(booked({ status: "closed" as const }))).toBe(
      false,
    );
    expect(
      canRequestTimeChange(
        booked({ departDate: "2026-08-01", returnDate: "2026-08-07" }),
      ),
    ).toBe(false);
  });

  it("opens seeded from what they asked for last time", () => {
    const trip = booked({
      preferredTime: "morning" as const,
      preferredDays: ["tue" as const],
    });
    const draft = emptyTimeChange(trip, NOW);
    expect(draft.preferredTime).toBe("morning");
    expect(draft.preferredDays).toEqual(["tue"]);
  });

  it("will not send without a reason", () => {
    // A coordinator with no reason has to ring the member to find out what
    // they need, which is the call this feature exists to save.
    const draft = emptyTimeChange(booked(), NOW);
    expect(timeChangeError(draft)).toBe("note-required");
    expect(canSubmitTimeChange(draft)).toBe(false);
    expect(canSubmitTimeChange({ ...draft, note: "Flight at 2pm" })).toBe(true);
  });

  it("will not accept whitespace as a reason", () => {
    const draft = { ...emptyTimeChange(booked(), NOW), note: "   " };
    expect(canSubmitTimeChange(draft)).toBe(false);
  });

  it("records the ask as open", () => {
    const draft = { ...emptyTimeChange(booked(), NOW), note: "Flight at 2pm" };
    const [trip] = requestTimeChange([booked()], "trip-1", draft, NOW);

    expect(hasOpenTimeChange(trip)).toBe(true);
    expect(trip.timeChange?.note).toBe("Flight at 2pm");
    expect(trip.timeChange?.resolvedAt).toBeUndefined();
  });

  it("does not touch the booked times", () => {
    // Nothing moves until the receiving unit says so.
    const draft = { ...emptyTimeChange(booked(), NOW), note: "Earlier please" };
    const [trip] = requestTimeChange([booked()], "trip-1", draft, NOW);
    expect(trip.placement?.treatments).toEqual(booked().placement?.treatments);
    expect(trip.status).toBe("confirmed");
  });

  it("lets a member take back one nobody has answered", () => {
    const draft = { ...emptyTimeChange(booked(), NOW), note: "Earlier please" };
    const raised = requestTimeChange([booked()], "trip-1", draft, NOW);
    const [trip] = withdrawTimeChange(raised, "trip-1", NOW);
    expect(trip.timeChange).toBeUndefined();
  });

  it("keeps an answered one on the record", () => {
    // It explains why the booked times are what they are.
    const draft = { ...emptyTimeChange(booked(), NOW), note: "Earlier please" };
    const raised = requestTimeChange([booked()], "trip-1", draft, NOW);
    const answered = resolveTimeChange(raised, "trip-1", "Moved to 08:00", NOW);
    const [trip] = withdrawTimeChange(answered, "trip-1", NOW);

    expect(trip.timeChange?.resolvedAt).toBeDefined();
    expect(trip.timeChange?.facilityReply).toBe("Moved to 08:00");
  });

  it("closes the ask once the facility answers", () => {
    const draft = { ...emptyTimeChange(booked(), NOW), note: "Earlier please" };
    const raised = requestTimeChange([booked()], "trip-1", draft, NOW);
    const [trip] = resolveTimeChange(raised, "trip-1", "Sorry, no room", NOW);

    expect(hasOpenTimeChange(trip)).toBe(false);
    expect(trip.timeChange?.facilityReply).toBe("Sorry, no room");
  });

  it("leaves other trips alone", () => {
    const other = { ...booked(), id: "trip-2" };
    const draft = { ...emptyTimeChange(booked(), NOW), note: "Earlier please" };
    const next = requestTimeChange([booked(), other], "trip-1", draft, NOW);
    expect(next[1].timeChange).toBeUndefined();
  });
});
