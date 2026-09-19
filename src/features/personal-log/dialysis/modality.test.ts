import { describe, expect, it } from "vitest";
import {
  DEFAULT_MODALITY_SETTINGS,
  hasTreatmentIntervals,
  isHemodialysis,
  isHomeModality,
  modalityLabel,
  normalizeSettings,
  recordsLocation,
} from "./modality";
import {
  clarityLabel,
  dailyUltrafiltrationMl,
  exchangeError,
  exchangesOn,
  isUrgentClarity,
  removeExchange,
  ultrafiltrationMl,
  upsertExchange,
  urgentExchangesOn,
  type PdExchange,
  type PdExchangeDraft,
} from "./pdExchange";

/* Before this, `treatmentType` was the literal string "Hemodialysis" with
 * no setter, so home hemodialysis and peritoneal dialysis were not merely
 * unselectable — they could not be represented at all. */

describe("what each modality means for the log", () => {
  it("treats both kinds of hemodialysis as hemodialysis", () => {
    expect(isHemodialysis("in-center-hd")).toBe(true);
    expect(isHemodialysis("home-hd")).toBe(true);
    expect(isHemodialysis("pd")).toBe(false);
  });

  it("knows which modalities happen at home", () => {
    expect(isHomeModality("home-hd")).toBe(true);
    expect(isHomeModality("pd")).toBe(true);
    expect(isHomeModality("in-center-hd")).toBe(false);
  });

  it("only records a center and a care team for in-center treatment", () => {
    // Printing "ABC Dialysis Center · Jane Smith, RN" against a session a
    // member ran in their own front room is a false record.
    expect(recordsLocation("in-center-hd")).toBe(true);
    expect(recordsLocation("home-hd")).toBe(false);
    expect(recordsLocation("pd")).toBe(false);
  });

  it("has no between-treatment intervals on PD", () => {
    // The schedule and the management tab are both built around gaps
    // between runs. PD exchanges happen every day, so there is no gap.
    expect(hasTreatmentIntervals("in-center-hd")).toBe(true);
    expect(hasTreatmentIntervals("home-hd")).toBe(true);
    expect(hasTreatmentIntervals("pd")).toBe(false);
  });

  it("names each modality in both languages", () => {
    expect(modalityLabel("pd", false)).toBe("Peritoneal dialysis");
    expect(modalityLabel("pd", true)).toBe("Diálisis peritoneal");
    expect(modalityLabel("home-hd", false)).toBe("Home hemodialysis");
  });
});

describe("reading stored settings back", () => {
  it("reads a device that predates the setting as in-center", () => {
    // Every record written before this field existed was implicitly an
    // in-center one, so that is what absent means.
    expect(normalizeSettings(null)).toEqual(DEFAULT_MODALITY_SETTINGS);
    expect(normalizeSettings(undefined).modality).toBe("in-center-hd");
    expect(normalizeSettings("nonsense").modality).toBe("in-center-hd");
  });

  it("refuses a modality it does not recognise", () => {
    expect(normalizeSettings({ modality: "transplant" }).modality).toBe(
      "in-center-hd",
    );
  });

  it("keeps a valid modality", () => {
    expect(normalizeSettings({ modality: "pd" }).modality).toBe("pd");
  });

  it("holds the exchange count to something a day could contain", () => {
    // Zero would read as "no dialysis at all".
    expect(normalizeSettings({ exchangesPerDay: 0 }).exchangesPerDay).toBe(4);
    expect(normalizeSettings({ exchangesPerDay: 99 }).exchangesPerDay).toBe(4);
    expect(normalizeSettings({ exchangesPerDay: 5 }).exchangesPerDay).toBe(5);
    expect(normalizeSettings({ exchangesPerDay: 4.4 }).exchangesPerDay).toBe(4);
  });
});

describe("one PD exchange", () => {
  const exchange = (patch: Partial<PdExchange> = {}): PdExchange => ({
    id: "x1",
    date: "2026-09-19",
    startTime: "08:00",
    dextrose: "2.5",
    fillMl: 2000,
    drainMl: 2300,
    dwellMinutes: 240,
    clarity: "clear",
    exitSiteOk: true,
    notes: "",
    savedAt: "2026-09-19T08:00:00.000Z",
    ...patch,
  });

  it("works ultrafiltration out rather than asking for it", () => {
    expect(ultrafiltrationMl({ fillMl: 2000, drainMl: 2300 })).toBe(300);
  });

  it("reports negative ultrafiltration instead of hiding it", () => {
    // Fluid retained rather than removed is exactly what a member and
    // their unit need to see, so it is never clamped to zero.
    expect(ultrafiltrationMl({ fillMl: 2000, drainMl: 1750 })).toBe(-250);
  });

  it("totals the day across every exchange", () => {
    const day = [
      exchange({ id: "a", fillMl: 2000, drainMl: 2300 }),
      exchange({ id: "b", fillMl: 2000, drainMl: 2200 }),
      exchange({ id: "c", date: "2026-09-20", fillMl: 2000, drainMl: 2500 }),
    ];
    expect(dailyUltrafiltrationMl(day, "2026-09-19")).toBe(500);
  });

  it("keeps exchanges in the order they were logged", () => {
    const day = [
      exchange({ id: "late", savedAt: "2026-09-19T20:00:00.000Z" }),
      exchange({ id: "early", savedAt: "2026-09-19T06:00:00.000Z" }),
    ];
    expect(exchangesOn(day, "2026-09-19").map((item) => item.id)).toEqual([
      "early",
      "late",
    ]);
  });

  it("edits in place rather than adding a second row", () => {
    const first = exchange();
    const edited = { ...first, drainMl: 2400 };
    const next = upsertExchange([first], edited);
    expect(next).toHaveLength(1);
    expect(next[0].drainMl).toBe(2400);
  });

  it("deletes one exchange", () => {
    expect(
      removeExchange([exchange(), exchange({ id: "x2" })], "x1"),
    ).toHaveLength(1);
  });
});

describe("what the drained fluid looked like", () => {
  it("treats cloudy and blood-stained effluent as urgent", () => {
    // Cloudy effluent is the classic first sign of peritonitis, and a PD
    // member is taught to call their unit the same day they see it.
    expect(isUrgentClarity("cloudy")).toBe(true);
    expect(isUrgentClarity("bloody")).toBe(true);
  });

  it("does not raise an alarm for clear fluid or fibrin", () => {
    expect(isUrgentClarity("clear")).toBe(false);
    expect(isUrgentClarity("fibrin")).toBe(false);
  });

  it("picks out the exchanges worth reporting on a day", () => {
    const day: PdExchange[] = [
      {
        id: "a",
        date: "2026-09-19",
        startTime: "08:00",
        dextrose: "2.5",
        fillMl: 2000,
        drainMl: 2300,
        dwellMinutes: 240,
        clarity: "clear",
        exitSiteOk: true,
        notes: "",
        savedAt: "2026-09-19T08:00:00.000Z",
      },
      {
        id: "b",
        date: "2026-09-19",
        startTime: "12:00",
        dextrose: "2.5",
        fillMl: 2000,
        drainMl: 2250,
        dwellMinutes: 240,
        clarity: "cloudy",
        exitSiteOk: true,
        notes: "",
        savedAt: "2026-09-19T12:00:00.000Z",
      },
    ];
    expect(urgentExchangesOn(day, "2026-09-19").map((x) => x.id)).toEqual([
      "b",
    ]);
  });

  it("names each appearance in both languages", () => {
    expect(clarityLabel("cloudy", false)).toBe("Cloudy");
    expect(clarityLabel("cloudy", true)).toBe("Turbio");
  });
});

describe("what an exchange must have to be saved", () => {
  const draft = (patch: Partial<PdExchangeDraft> = {}): PdExchangeDraft => ({
    date: "2026-09-19",
    startTime: "08:00",
    dextrose: "2.5",
    fillMl: 2000,
    drainMl: 2300,
    dwellMinutes: 240,
    clarity: "clear",
    exitSiteOk: true,
    notes: "",
    ...patch,
  });

  it("accepts a complete exchange", () => {
    expect(exchangeError(draft())).toBeNull();
  });

  it("needs a time, a fill and a dwell", () => {
    expect(exchangeError(draft({ startTime: "  " }))).toBe("missing-time");
    expect(exchangeError(draft({ fillMl: 0 }))).toBe("missing-fill");
    expect(exchangeError(draft({ dwellMinutes: 0 }))).toBe("missing-dwell");
  });

  it("accepts a zero drain, which is real and alarming", () => {
    // A bag that would not drain is one of the most important things a
    // member can record; refusing it would push them to invent a number.
    expect(exchangeError(draft({ drainMl: 0 }))).toBeNull();
    expect(exchangeError(draft({ drainMl: -1 }))).toBe("missing-drain");
  });
});
