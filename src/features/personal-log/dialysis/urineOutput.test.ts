import { describe, expect, it } from "vitest";
import {
  emptyUrineDraft,
  entriesOn,
  entryError,
  normaliseEntries,
  parseMl,
  recordedDates,
  removeEntry,
  totalOn,
  upsertEntry,
  type UrineEntry,
} from "./urineOutput";

const TODAY = "2026-09-11";

function entry(patch: Partial<UrineEntry> & { id: string }): UrineEntry {
  return { date: TODAY, time: "08:00", amountMl: "200", ...patch };
}

describe("what an entry has to say", () => {
  it("needs a date and an amount", () => {
    expect(entryError(emptyUrineDraft(TODAY, "08:00"), false)).toBe(
      "Enter an amount.",
    );
    expect(
      entryError({ date: "", time: "08:00", amountMl: "200" }, false),
    ).toBe("Pick a date.");
  });

  it("accepts an amount written the way members write it", () => {
    for (const amount of ["200", "200ml", "abt 200", "200 mL"]) {
      expect(
        entryError({ date: TODAY, time: "08:00", amountMl: amount }, false),
      ).toBeNull();
    }
  });

  it("accepts a genuine zero", () => {
    // "I passed nothing this morning" is a reading worth having, and the
    // most clinically interesting one on this card.
    expect(parseMl("0")).toBe(0);
    expect(
      entryError({ date: TODAY, time: "08:00", amountMl: "0" }, false),
    ).toBeNull();
  });

  it("refuses an amount with no number in it", () => {
    expect(parseMl("")).toBeNull();
    expect(parseMl("some")).toBeNull();
  });
});

describe("a day's total", () => {
  const entries = [
    entry({ id: "c", time: "20:00", amountMl: "50" }),
    entry({ id: "a", time: "08:00", amountMl: "200" }),
    entry({ id: "b", time: "13:00", amountMl: "150ml" }),
    entry({ id: "other-day", date: "2026-09-10", amountMl: "999" }),
  ];

  it("adds up only the day asked for", () => {
    expect(totalOn(entries, TODAY)).toBe(400);
  });

  it("shows the day earliest first", () => {
    expect(entriesOn(entries, TODAY).map((item) => item.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("skips an entry it cannot read rather than counting it as zero", () => {
    // A total that quietly swallows a passing reads as a real fall in
    // output, which is exactly the thing this card exists to catch.
    const withJunk = [...entries, entry({ id: "junk", amountMl: "lots" })];
    expect(totalOn(withJunk, TODAY)).toBe(400);
  });

  it("is zero for a day with nothing recorded", () => {
    expect(totalOn(entries, "2026-01-01")).toBe(0);
  });

  it("lists the days that have anything, newest first", () => {
    expect(recordedDates(entries)).toEqual(["2026-09-11", "2026-09-10"]);
  });
});

describe("editing the list", () => {
  it("replaces an entry rather than adding a copy", () => {
    const next = upsertEntry(
      [entry({ id: "a" })],
      entry({ id: "a", amountMl: "250" }),
    );
    expect(next).toHaveLength(1);
    expect(next[0].amountMl).toBe("250");
  });

  it("removes only the entry asked for", () => {
    const next = removeEntry([entry({ id: "a" }), entry({ id: "b" })], "a");
    expect(next.map((item) => item.id)).toEqual(["b"]);
  });

  it("drops stored rows it cannot show", () => {
    expect(normaliseEntries(null)).toEqual([]);
    expect(normaliseEntries([{ amountMl: "200" }, { id: "x" }])).toEqual([]);
  });

  it("keeps a row that has an id and a date", () => {
    const [read] = normaliseEntries([{ id: "a", date: TODAY }]);
    expect(read).toEqual({ id: "a", date: TODAY, time: "", amountMl: "" });
  });
});
