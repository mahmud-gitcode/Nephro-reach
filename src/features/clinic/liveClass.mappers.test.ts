import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "./liveClass.actions";
import {
  fromApiLiveClass,
  fromStartsAt,
  programFromApi,
  programToApi,
  settingsFromApi,
  settingToApi,
  statusFromApi,
  statusToApi,
  toLiveClassBody,
  toStartsAt,
} from "./liveClass.mappers";

/* Live classes, Phase 13. The test runner's zone is the machine's; the DST
   cases below hold in any zone because both ways use the browser's Date. */

afterEach(() => vi.useRealTimers());

describe("a class time", () => {
  it("round-trips a day and 24-hour time through the instant", () => {
    const iso = toStartsAt("2026-11-12", "18:00");
    expect(iso).not.toBeNull();
    expect(fromStartsAt(iso as string)).toEqual({
      date: "2026-11-12",
      time: "18:00",
    });
  });

  it("keeps the wall-clock time on both sides of a daylight-saving change", () => {
    for (const date of [
      "2026-03-07",
      "2026-03-09",
      "2026-10-31",
      "2026-11-02",
    ]) {
      const iso = toStartsAt(date, "18:30") as string;
      expect(fromStartsAt(iso)).toEqual({ date, time: "18:30" });
    }
  });

  it("refuses a day or time the form should never have sent", () => {
    expect(toStartsAt("2026-02-30", "18:00")).toBeNull();
    expect(toStartsAt("2026-02-10", "6:00 PM")).toBeNull();
    expect(toStartsAt("", "18:00")).toBeNull();
    expect(() =>
      toLiveClassBody(
        {
          date: "",
          time: "18:00",
          topic: "Fluids",
          educator: "",
          program: "All Programs",
          capacity: 50,
          status: "Open",
          joinUrl: "",
        },
        "create",
      ),
    ).toThrow();
  });
});

describe("enums both ways", () => {
  it("maps every status", () => {
    for (const status of ["open", "not-yet-open", "cancelled"])
      expect(statusToApi(statusFromApi(status))).toBe(status);
  });

  it("maps the program labels to the server's slugs and back", () => {
    for (const label of [
      "Journey to Dialysis",
      "Crash Dialysis",
      "All Programs",
    ])
      expect(programFromApi(programToApi(label))).toBe(label);
    /* A published course slug the page has no label for shows as itself. */
    expect(programFromApi("kidney-failure-crash-3-day")).toBe(
      "kidney-failure-crash-3-day",
    );
  });
});

describe("rows and bodies", () => {
  it("reads a public schedule row without inventing attendance or a link", () => {
    const row = fromApiLiveClass({
      id: "lc-1",
      startsAt: toStartsAt("2026-11-12", "18:00") as string,
      topic: "Ask Us Anything",
      educator: null,
      program: "all",
      capacity: 50,
      status: "open",
      registeredCount: 3,
      seatsLeft: 47,
      recordingUrl: null,
    });
    expect(row).toMatchObject({
      id: "lc-1",
      date: "2026-11-12",
      time: "18:00",
      program: "All Programs",
      registered: 3,
      status: "Open",
      attended: null,
      averageRating: null,
    });
    expect(row.joinUrl).toBeUndefined();
  });

  it("sends a meeting link only when given, and clears it on edit", () => {
    const draft = {
      date: "2026-11-12",
      time: "18:00",
      topic: "  Fluids  ",
      educator: "",
      program: "Journey to Dialysis",
      capacity: 40,
      status: "Not Yet Open" as const,
      joinUrl: "",
    };
    const created = toLiveClassBody(draft, "create");
    expect(created).toMatchObject({
      topic: "Fluids",
      program: "journey-21-day",
      capacity: 40,
      status: "not-yet-open",
    });
    expect(created).not.toHaveProperty("joinUrl");
    expect(created).not.toHaveProperty("educator");
    expect(toLiveClassBody(draft, "update").joinUrl).toBeNull();
  });
});

describe("the six settings cards", () => {
  it("keeps the server's field names and maps the reminder lead both ways", () => {
    const read = settingsFromApi(
      [
        {
          key: "reminders",
          values: { email: true, sms: false, lead: "2-hours" },
          updatedAt: null,
        },
      ],
      defaultSettings(),
    );
    expect(read.reminders).toMatchObject({
      email: true,
      lead: "2 hours before",
    });
    expect(settingToApi("reminders", read.reminders)).toEqual({
      reminders: { email: true, sms: false, lead: "2-hours" },
    });
    /* One card per PUT. */
    expect(Object.keys(settingToApi("limits", read.limits))).toEqual([
      "limits",
    ]);
    for (const id of Object.keys(defaultSettings()))
      expect(settingsFromApi([], defaultSettings())).toHaveProperty(id);
  });
});
