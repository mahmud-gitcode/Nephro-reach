import { describe, expect, it } from "vitest";
import {
  pastClasses,
  SETTING_FIELDS,
  addDays,
  classError,
  classesOnDay,
  defaultSettingValues,
  defaultSettings,
  duplicateDraft,
  emptyClassDraft,
  isFull,
  recordingLinkError,
  seatsLeft,
  settingSummary,
  sortClasses,
  toDraft,
  upcomingFrom,
  type ManagedClass,
} from "./liveClass.actions";

const TODAY = "2026-09-11";

function klass(patch: Partial<ManagedClass> & { id: string }): ManagedClass {
  return {
    date: "2026-09-12",
    time: "18:00",
    topic: "Renal Diet Basics",
    educator: "Renal Dietitian",
    program: "All Programs",
    registered: 10,
    capacity: 50,
    status: "Open",
    ...patch,
  };
}

describe("what a class has to say before it can be saved", () => {
  const draft = { ...emptyClassDraft("2026-10-01"), topic: "Fluid Management" };

  it("needs a date, a time and a topic", () => {
    expect(classError({ ...draft, date: "" }, [])).toBe("Pick a date.");
    expect(classError({ ...draft, time: "" }, [])).toBe("Pick a time.");
    expect(classError({ ...draft, topic: "Q" }, [])).toBe(
      "Give the class a topic.",
    );
    expect(classError(draft, [])).toBeNull();
  });

  it("refuses a capacity nobody could register for", () => {
    expect(classError({ ...draft, capacity: 0 }, [])).toBe(
      "Capacity must be at least 1.",
    );
  });

  it("refuses two classes in the same slot", () => {
    const booked = [klass({ id: "a", date: "2026-10-01", time: "18:00" })];
    expect(classError(draft, booked)).toBe(
      "Another class is already booked for that day and time.",
    );
  });

  it("does not report a class as clashing with itself", () => {
    // Editing a class's topic must not trip the clash check on its own row.
    const booked = [klass({ id: "a", date: "2026-10-01", time: "18:00" })];
    expect(classError(draft, booked, "a")).toBeNull();
  });

  it("lets a new class take a cancelled class's slot", () => {
    // The slot is free again; the cancelled row is only kept as a record.
    const booked = [
      klass({
        id: "a",
        date: "2026-10-01",
        time: "18:00",
        status: "Cancelled",
      }),
    ];
    expect(classError(draft, booked)).toBeNull();
  });
});

describe("the schedule", () => {
  const schedule = [
    klass({ id: "later", date: "2026-10-03" }),
    klass({ id: "evening", date: "2026-09-12", time: "19:00" }),
    klass({ id: "morning", date: "2026-09-12", time: "09:00" }),
    klass({ id: "past", date: "2026-08-01" }),
    klass({ id: "off", date: "2026-09-26", status: "Cancelled" }),
  ];

  it("sorts by day, then by time within the day", () => {
    expect(sortClasses(schedule).map((item) => item.id)).toEqual([
      "past",
      "morning",
      "evening",
      "off",
      "later",
    ]);
  });

  it("shows only what is still to come and still happening", () => {
    const upcoming = upcomingFrom(schedule, TODAY).map((item) => item.id);
    expect(upcoming).toEqual(["morning", "evening", "later"]);
    expect(upcoming).not.toContain("past");
    expect(upcoming).not.toContain("off");
  });

  it("keeps a cancelled class on the calendar", () => {
    // Somebody looking up the 26th needs to see it was called off, not an
    // empty day.
    const onDay = classesOnDay(schedule, 2026, 8, 26);
    expect(onDay.map((item) => item.id)).toEqual(["off"]);
  });

  it("finds both classes on a doubled-up day", () => {
    expect(classesOnDay(schedule, 2026, 8, 12)).toHaveLength(2);
  });

  it("counts places left and knows when there are none", () => {
    expect(seatsLeft(klass({ id: "a", registered: 45, capacity: 50 }))).toBe(5);
    expect(isFull(klass({ id: "a", registered: 50, capacity: 50 }))).toBe(true);
    // Over-booked is still full, never a negative number of places.
    expect(seatsLeft(klass({ id: "a", registered: 60, capacity: 50 }))).toBe(0);
  });
});

describe("copying a class", () => {
  it("copies to the same slot a week later, closed for registration", () => {
    const source = klass({
      id: "a",
      date: "2026-09-26",
      joinUrl: "https://zoom.us/j/1",
    });
    const draft = duplicateDraft(source);
    expect(draft).toMatchObject({
      date: "2026-10-03",
      time: "18:00",
      topic: source.topic,
      status: "Not Yet Open",
      joinUrl: "https://zoom.us/j/1",
    });
    expect(draft).not.toHaveProperty("registered");
  });

  it("counts days across a month boundary", () => {
    expect(addDays("2026-09-28", 7)).toBe("2026-10-05");
  });
});

describe("recording links", () => {
  it("accepts an empty box", () => {
    // Clearing the field is how a link is removed, not an error.
    expect(recordingLinkError("")).toBeNull();
    expect(recordingLinkError("   ")).toBeNull();
  });

  it("accepts a real recording link", () => {
    expect(recordingLinkError("https://zoom.us/rec/share/abc")).toBeNull();
    expect(recordingLinkError("http://intranet.local/class")).toBeNull();
  });

  it("refuses anything that is not a link", () => {
    expect(recordingLinkError("zoom.us/rec")).toBe(
      "Enter a full link, starting with https://",
    );
  });

  it("refuses a javascript: URL", () => {
    // The page turns this into an href it will open; a script URL here is
    // one the clinic never meant to run.
    expect(recordingLinkError("javascript:alert(1)")).toBe(
      "Only https:// links can be saved.",
    );
    expect(recordingLinkError("data:text/html,<script>")).toBe(
      "Only https:// links can be saved.",
    );
  });
});

describe("the six settings panels", () => {
  it("starts every switch off and every box empty", () => {
    const values = defaultSettingValues("reminders");
    expect(values).toEqual({ email: false, sms: false, lead: "1 day before" });
  });

  it("never defaults a class capacity to zero", () => {
    // A default of zero would schedule a class nobody could register for.
    expect(defaultSettingValues("limits").capacity).toBe(50);
  });

  it("gives every panel a value for every one of its fields", () => {
    const all = defaultSettings();
    for (const [id, fields] of Object.entries(SETTING_FIELDS)) {
      for (const field of fields) {
        expect(all[id as keyof typeof all]).toHaveProperty(field.key);
      }
    }
  });

  it("summarises what is switched on, and says nothing when nothing is", () => {
    expect(settingSummary("reminders", defaultSettingValues("reminders"))).toBe(
      null,
    );
    expect(
      settingSummary("reminders", {
        email: true,
        sms: true,
        lead: "1 day before",
      }),
    ).toBe("Email reminder, SMS reminder");
  });
});

describe("the meeting link members join by", () => {
  const draft = { ...emptyClassDraft("2026-10-20"), topic: "Fluid Basics" };

  it("is optional, but must be a real web link when given", () => {
    expect(classError(draft, [])).toBeNull();
    expect(
      classError({ ...draft, joinUrl: "javascript:alert(1)" }, []),
    ).toMatch(/Meeting link/);
    expect(
      classError({ ...draft, joinUrl: "https://zoom.us/j/123" }, []),
    ).toBeNull();
  });

  it("comes back into the edit form", () => {
    expect(
      toDraft(klass({ id: "a", joinUrl: "https://zoom.us/j/123" })).joinUrl,
    ).toBe("https://zoom.us/j/123");
  });
});

describe("pastClasses", () => {
  const base = {
    time: "6:00 PM",
    educator: "NephroReach",
    program: "Live",
    registered: 40,
    capacity: 100,
  };
  const classes = [
    {
      ...base,
      id: "a",
      date: "2026-10-01",
      topic: "Potassium Basics",
      status: "Open",
    },
    {
      ...base,
      id: "b",
      date: "2026-10-02",
      topic: "Called Off",
      status: "Cancelled",
    },
    {
      ...base,
      id: "c",
      date: "2026-10-20",
      topic: "Still To Come",
      status: "Open",
    },
  ] as Parameters<typeof pastClasses>[0];

  it("lists the held classes by id, so their recordings can be published", () => {
    const past = pastClasses(classes, "2026-10-08");
    expect(past.map((c) => c.id)).toEqual(["a"]);
    /* An office reads no attendance: none is invented. */
    expect(past[0]).toMatchObject({
      title: "Potassium Basics",
      attended: null,
      rating: 0,
    });
  });

  it("shows no sample history when nothing has been held", () => {
    expect(pastClasses()).toEqual([]);
  });
});
