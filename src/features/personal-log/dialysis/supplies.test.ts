import { describe, expect, it } from "vitest";
import {
  monthKeyOf,
  neededFor,
  normaliseMonth,
  summarise,
  supplyGroupsFor,
  supplyItemsFor,
  supplyStatus,
  type SupplyCount,
} from "./supplies";

const item = { id: "gauze", labelEn: "Gauze", labelEs: "Gasas", needed: 60 };

describe("who gets a supply checklist at all", () => {
  it("gives one to both home modalities and none to in-center", () => {
    // The unit holds an in-center member's stock. Showing them an empty
    // cupboard to count would be inventing a chore they do not have.
    expect(supplyGroupsFor("home-hd").length).toBeGreaterThan(0);
    expect(supplyGroupsFor("pd").length).toBeGreaterThan(0);
    expect(supplyGroupsFor("in-center-hd")).toEqual([]);
  });

  it("does not share one list between the two home modalities", () => {
    // A PD member has never held a dialyzer and a home haemo member has no
    // Dianeal, so a shared catalogue would ask both the wrong questions.
    const homeIds = supplyItemsFor("home-hd").map((entry) => entry.id);
    const pdIds = supplyItemsFor("pd").map((entry) => entry.id);

    expect(homeIds).toContain("dialyzer");
    expect(pdIds).toContain("dianeal-15");
    expect(pdIds).not.toContain("dialyzer");
    expect(homeIds).not.toContain("dianeal-15");
  });

  it("keeps every item id unique within a modality", () => {
    // Ids key the saved counts; a duplicate would have two rows quietly
    // editing one number.
    for (const modality of ["home-hd", "pd"] as const) {
      const ids = supplyItemsFor(modality).map((entry) => entry.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("where an item stands", () => {
  it("separates none left from fewer than planned", () => {
    // None left is a phone call today; short is an order this week. One
    // shared warning is how somebody runs out on a Sunday.
    expect(supplyStatus(item, { have: 0, checked: true })).toBe("missing");
    expect(supplyStatus(item, { have: 45, checked: true })).toBe("low");
    expect(supplyStatus(item, { have: 60, checked: true })).toBe("ok");
  });

  it("counts more than planned as fine, not as an error", () => {
    expect(supplyStatus(item, { have: 200, checked: false })).toBe("ok");
  });

  it("reads an untouched item as missing rather than fine", () => {
    // A month nobody has counted is not a stocked month.
    expect(supplyStatus(item, undefined)).toBe("missing");
  });

  it("measures against the member's own figure when they set one", () => {
    // Prescriptions differ. Somebody told to keep 30 is not low at 30
    // just because the default says 60.
    const count: SupplyCount = { have: 30, needed: 30, checked: true };
    expect(neededFor(item, count)).toBe(30);
    expect(supplyStatus(item, count)).toBe("ok");
  });

  it("falls back to the default when their figure is unusable", () => {
    expect(neededFor(item, { have: 0, needed: -5, checked: false })).toBe(60);
    expect(neededFor(item, { have: 0, checked: false })).toBe(60);
  });

  it("treats an item they need none of as fine at zero", () => {
    const optional = { ...item, needed: 0 };
    expect(supplyStatus(optional, { have: 0, checked: true })).toBe("ok");
  });
});

describe("the month in one line", () => {
  it("counts low and missing apart, and ticks separately from stock", () => {
    // Ticking says "I looked", not "I have enough". A member can have
    // counted every line and still be short of two.
    const summary = summarise("pd", {
      "dianeal-15": { have: 30, checked: true },
      "dianeal-25": { have: 20, checked: true },
      icodextrin: { have: 0, checked: true },
    });

    expect(summary.checked).toBe(3);
    expect(summary.low).toBe(1);
    expect(summary.missing).toBeGreaterThanOrEqual(1);
    expect(summary.stocked).toBe(false);
    expect(summary.total).toBe(supplyItemsFor("pd").length);
  });

  it("calls a month stocked only when nothing is low or missing", () => {
    const counts = Object.fromEntries(
      supplyItemsFor("home-hd").map((entry) => [
        entry.id,
        { have: entry.needed, checked: true },
      ]),
    );

    expect(summarise("home-hd", counts).stocked).toBe(true);
  });

  it("summarises an in-center member as nothing rather than as empty", () => {
    const summary = summarise("in-center-hd", {});
    expect(summary.total).toBe(0);
    expect(summary.missing).toBe(0);
    expect(summary.stocked).toBe(true);
  });
});

describe("reading a stored month back", () => {
  it("keys a month as yyyy-mm, padded", () => {
    expect(monthKeyOf(new Date(2026, 8, 11))).toBe("2026-09");
    expect(monthKeyOf(new Date(2026, 11, 1))).toBe("2026-12");
  });

  it("returns an empty month for anything it cannot read", () => {
    // A corrupt entry must not take the checklist down with it.
    expect(normaliseMonth(null, "2026-09").counts).toEqual({});
    expect(normaliseMonth("not an object", "2026-09").monthKey).toBe("2026-09");
  });

  it("drops counts that are not counts and keeps the ones that are", () => {
    const month = normaliseMonth(
      {
        monthKey: "2026-09",
        counts: {
          gauze: { have: 45, needed: 60, checked: true },
          broken: "nonsense",
          partial: { checked: true },
        },
        notes: "order gauze",
      },
      "2026-09",
    );

    expect(month.counts.gauze).toEqual({ have: 45, needed: 60, checked: true });
    expect(month.counts.broken).toBeUndefined();
    // A half-written entry is repaired rather than discarded: the tick the
    // member made is real even if the number never got typed.
    expect(month.counts.partial).toEqual({
      have: 0,
      needed: undefined,
      checked: true,
    });
    expect(month.notes).toBe("order gauze");
  });
});
