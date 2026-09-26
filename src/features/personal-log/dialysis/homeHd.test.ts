import { describe, expect, it } from "vitest";
import {
  DEFAULT_SYSTEM,
  addDays,
  bpFlag,
  dueState,
  emptyVitals,
  fluidRemovedL,
  needsAttention,
  normaliseSystem,
  normaliseVitals,
  parseWeight,
  systemChecks,
} from "./homeHd";

const TODAY = "2026-09-11";

describe("when maintenance is due", () => {
  it("counts days across a month boundary", () => {
    expect(addDays("2026-09-11", 30)).toBe("2026-10-11");
    expect(addDays("2026-12-20", 30)).toBe("2027-01-19");
  });

  it("has nothing to count from when the date was never recorded", () => {
    expect(addDays("", 30)).toBe("");
    expect(addDays("not-a-date", 30)).toBe("");
  });

  it("treats an unrecorded date as unknown, never as fine", () => {
    // A green tick over a blank field is the kind of reassurance that gets
    // somebody hurt: never disinfecting is not the same as being up to date.
    expect(dueState("", TODAY)).toBe("unknown");
  });

  it("separates overdue, due soon and fine", () => {
    expect(dueState("2026-09-10", TODAY)).toBe("overdue");
    expect(dueState("2026-09-13", TODAY)).toBe("due-soon");
    expect(dueState("2026-09-30", TODAY)).toBe("ok");
  });

  it("counts today itself as due soon rather than overdue", () => {
    expect(dueState(TODAY, TODAY)).toBe("due-soon");
  });

  it("derives both dated jobs from the dates the member entered", () => {
    const checks = systemChecks(
      {
        ...DEFAULT_SYSTEM,
        lastDisinfection: "2026-09-10",
        disinfectionIntervalDays: 7,
        lastFilterChange: "2026-08-05",
        filterIntervalDays: 30,
      },
      TODAY,
    );

    expect(checks[0]).toMatchObject({
      id: "disinfection",
      dueIso: "2026-09-17",
      state: "ok",
    });
    // 5 August plus thirty days was the 4th — a week ago.
    expect(checks[1]).toMatchObject({ id: "filter", state: "overdue" });
  });

  it("speaks up for an overdue job and for one never recorded", () => {
    expect(needsAttention(DEFAULT_SYSTEM, TODAY)).toBe(true);
    expect(
      needsAttention(
        {
          ...DEFAULT_SYSTEM,
          lastDisinfection: "2026-09-10",
          lastFilterChange: "2026-09-09",
        },
        TODAY,
      ),
    ).toBe(false);
  });
});

describe("weights, and the fluid between them", () => {
  it("reads a weight typed the way members type it", () => {
    // A field that silently refuses "74,8" or "74.8 kg" loses the reading
    // rather than recording it.
    expect(parseWeight("74.8")).toBe(74.8);
    expect(parseWeight("74,8")).toBe(74.8);
    expect(parseWeight("74.8 kg")).toBe(74.8);
  });

  it("refuses a weight with no number in it", () => {
    expect(parseWeight("")).toBeNull();
    expect(parseWeight("kg")).toBeNull();
    expect(parseWeight("0")).toBeNull();
  });

  it("takes the difference as litres off", () => {
    const vitals = {
      ...emptyVitals(TODAY),
      preWeightKg: "74.8",
      postWeightKg: "72.4",
    };
    expect(fluidRemovedL(vitals)).toBe(2.4);
  });

  it("says nothing until both weights are in", () => {
    const vitals = { ...emptyVitals(TODAY), preWeightKg: "74.8" };
    expect(fluidRemovedL(vitals)).toBeNull();
  });

  it("refuses to report a gain as negative fluid removed", () => {
    // Coming off heavier than you went on is a mistyped figure, not a
    // negative ultrafiltration, and reporting it as one is worse than
    // reporting nothing.
    const vitals = {
      ...emptyVitals(TODAY),
      preWeightKg: "72.4",
      postWeightKg: "74.8",
    };
    expect(fluidRemovedL(vitals)).toBeNull();
  });
});

describe("reading a blood pressure", () => {
  it("flags low as well as high", () => {
    // Pressure dropping during a run is the common emergency at home, so
    // low cannot be folded into "not high".
    expect(bpFlag("85/55")).toBe("low");
    expect(bpFlag("118/76")).toBe("normal");
    expect(bpFlag("150/95")).toBe("high");
  });

  it("reads the separators members actually type", () => {
    expect(bpFlag("118 / 76")).toBe("normal");
    expect(bpFlag("118-76")).toBe("normal");
  });

  it("says nothing rather than guessing at an unreadable entry", () => {
    expect(bpFlag("")).toBe("unknown");
    expect(bpFlag("high")).toBe("unknown");
  });
});

describe("reading stored records back", () => {
  it("returns the default system for anything unusable", () => {
    expect(normaliseSystem(null)).toEqual(DEFAULT_SYSTEM);
    expect(normaliseSystem("nonsense")).toEqual(DEFAULT_SYSTEM);
  });

  it("refuses a machine or an interval it cannot use", () => {
    const system = normaliseSystem({
      machine: "teleporter",
      filterIntervalDays: 0,
      disinfectionIntervalDays: -3,
    });

    expect(system.machine).toBe(DEFAULT_SYSTEM.machine);
    // A zero-day interval would report the filter overdue forever.
    expect(system.filterIntervalDays).toBe(DEFAULT_SYSTEM.filterIntervalDays);
    expect(system.disinfectionIntervalDays).toBe(
      DEFAULT_SYSTEM.disinfectionIntervalDays,
    );
  });

  it("keeps a stored system it can read", () => {
    const system = normaliseSystem({
      machine: "fresenius",
      serial: "NX123456",
      lastDisinfection: "2026-09-10",
      filterIntervalDays: 14,
    });

    expect(system.machine).toBe("fresenius");
    expect(system.serial).toBe("NX123456");
    expect(system.filterIntervalDays).toBe(14);
  });

  it("repairs a half-written set of vitals rather than dropping it", () => {
    const vitals = normaliseVitals(
      { preWeightKg: "74.8", feeling: "elated" },
      TODAY,
    );

    expect(vitals.preWeightKg).toBe("74.8");
    expect(vitals.postWeightKg).toBe("");
    expect(vitals.feeling).toBe("good");
    expect(vitals.date).toBe(TODAY);
  });
});
