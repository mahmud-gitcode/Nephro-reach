import { describe, expect, it } from "vitest";
import {
  emptyVisitDraft,
  nextVisit,
  normaliseVisits,
  providerLabel,
  removeVisit,
  sortVisits,
  upsertVisit,
  visitError,
  type HomeVisit,
} from "./homeVisits";

const TODAY = "2026-09-11";

function visit(patch: Partial<HomeVisit> & { id: string }): HomeVisit {
  return {
    date: TODAY,
    time: "10:00",
    provider: "rn",
    purpose: "",
    status: "scheduled",
    remind: true,
    notes: "",
    ...patch,
  };
}

describe("what a visit has to say before it can be saved", () => {
  it("accepts a date with no time yet", () => {
    // "Someone will call round on Tuesday" is a real thing to be told, and
    // making the member invent an hour would put a wrong time in the diary.
    const draft = { ...emptyVisitDraft(TODAY), time: "" };
    expect(visitError(draft, false)).toBeNull();
  });

  it("refuses a visit with no date", () => {
    expect(visitError({ ...emptyVisitDraft(TODAY), date: "" }, false)).toBe(
      "Pick a date.",
    );
  });

  it("says why in Spanish when the member reads Spanish", () => {
    expect(visitError({ ...emptyVisitDraft(TODAY), date: "" }, true)).toBe(
      "Elige una fecha.",
    );
  });
});

describe("the order visits are shown in", () => {
  const visits = [
    visit({ id: "past", date: "2026-09-04" }),
    visit({ id: "soon", date: "2026-09-18" }),
    visit({ id: "later", date: "2026-10-16" }),
    visit({ id: "today-late", date: TODAY, time: "16:00" }),
  ];

  it("puts what is still ahead first, soonest first", () => {
    // The question a member opens this to answer is "when is the nurse
    // next coming", so the answer has to be the first row.
    const order = sortVisits(visits, TODAY).map((entry) => entry.id);
    expect(order.slice(0, 3)).toEqual(["today-late", "soon", "later"]);
  });

  it("puts the past last, most recent first", () => {
    const order = sortVisits(visits, TODAY).map((entry) => entry.id);
    expect(order[order.length - 1]).toBe("past");
  });

  it("counts today as still ahead, not as past", () => {
    // A visit at four this afternoon is not history at nine this morning.
    expect(nextVisit(visits, TODAY)?.id).toBe("today-late");
  });

  it("does not offer a completed visit as the next one", () => {
    const done = [
      visit({ id: "done", date: "2026-09-18", status: "completed" }),
    ];
    expect(nextVisit(done, TODAY)).toBeNull();
  });

  it("has no next visit when nothing is booked", () => {
    expect(nextVisit([], TODAY)).toBeNull();
  });
});

describe("editing the list", () => {
  it("replaces a visit rather than adding a second copy", () => {
    const start = [visit({ id: "a" })];
    const next = upsertVisit(start, visit({ id: "a", purpose: "Water check" }));

    expect(next).toHaveLength(1);
    expect(next[0].purpose).toBe("Water check");
  });

  it("appends a visit it has not seen", () => {
    expect(upsertVisit([visit({ id: "a" })], visit({ id: "b" }))).toHaveLength(
      2,
    );
  });

  it("removes only the visit asked for", () => {
    const next = removeVisit([visit({ id: "a" }), visit({ id: "b" })], "a");
    expect(next.map((entry) => entry.id)).toEqual(["b"]);
  });
});

describe("reading stored visits back", () => {
  it("returns nothing for anything that is not a list", () => {
    expect(normaliseVisits(null)).toEqual([]);
    expect(normaliseVisits({ visits: [] })).toEqual([]);
  });

  it("drops a row with no id or no date", () => {
    // Those two are what the list is keyed and ordered by; a row without
    // them cannot be shown or edited.
    expect(normaliseVisits([{ date: TODAY }, { id: "x" }])).toEqual([]);
  });

  it("repairs a row written by an older version", () => {
    const [entry] = normaliseVisits([{ id: "a", date: TODAY }]);

    expect(entry.provider).toBe("rn");
    expect(entry.status).toBe("scheduled");
    // Reminders default on: a member who never chose is better nudged than
    // silently not.
    expect(entry.remind).toBe(true);
  });

  it("refuses a provider or status it does not recognise", () => {
    const [entry] = normaliseVisits([
      { id: "a", date: TODAY, provider: "wizard", status: "maybe" },
    ]);

    expect(entry.provider).toBe("rn");
    expect(entry.status).toBe("scheduled");
  });

  it("names each provider in both languages", () => {
    expect(providerLabel("biomed", false)).toBe("Biomed");
    expect(providerLabel("pd-nurse", true)).toBe("Enfermera de DP");
  });
});
