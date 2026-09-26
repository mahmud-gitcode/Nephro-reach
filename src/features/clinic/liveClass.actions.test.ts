import { describe, expect, it } from "vitest";
import {
  SETTING_FIELDS,
  addClass,
  addDays,
  classError,
  classesOnDay,
  defaultSettingValues,
  defaultSettings,
  duplicateClass,
  emptyClassDraft,
  isFull,
  normaliseLiveClassActions,
  recordingLinkError,
  removeClass,
  seatsLeft,
  seedClasses,
  setClassStatus,
  settingSummary,
  sortClasses,
  toDraft,
  updateClass,
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

describe("editing the schedule", () => {
  const schedule = seedClasses();

  it("adds a class with nobody registered", () => {
    const next = addClass(schedule, {
      ...emptyClassDraft("2026-11-07"),
      topic: "Transplant Basics",
    });
    expect(next.at(-1)).toMatchObject({
      registered: 0,
      topic: "Transplant Basics",
    });
  });

  it("trims what it stores", () => {
    const [added] = addClass([], {
      ...emptyClassDraft("2026-11-07"),
      topic: "  Transplant Basics  ",
      educator: "  A Nurse  ",
    });
    expect(added.topic).toBe("Transplant Basics");
    expect(added.educator).toBe("A Nurse");
  });

  it("never trims a registration count to fit a smaller capacity", () => {
    // How many people signed up is a fact. Shrinking it to match a typo in
    // the capacity box would quietly lose real registrations.
    const booked = [klass({ id: "a", registered: 45, capacity: 50 })];
    const next = updateClass(booked, "a", {
      ...toDraft(booked[0]),
      capacity: 20,
    });

    expect(next[0].capacity).toBe(20);
    expect(next[0].registered).toBe(45);
  });

  it("changes only the class named", () => {
    const two = [klass({ id: "a" }), klass({ id: "b", date: "2026-09-19" })];
    const next = setClassStatus(two, "b", "Cancelled");

    expect(next[0].status).toBe("Open");
    expect(next[1].status).toBe("Cancelled");
  });

  it("copies a class to the same slot a week later, with nobody on it", () => {
    // Registrations belong to the session people signed up for, and the
    // copy opens closed so nobody joins a half-built class.
    const source = [klass({ id: "a", date: "2026-09-12", registered: 45 })];
    const next = duplicateClass(source, "a");

    expect(next).toHaveLength(2);
    expect(next[1]).toMatchObject({
      date: "2026-09-19",
      time: "18:00",
      registered: 0,
      status: "Not Yet Open",
    });
    expect(next[1].id).not.toBe("a");
  });

  it("does nothing when asked to copy a class that is not there", () => {
    expect(duplicateClass([klass({ id: "a" })], "ghost")).toHaveLength(1);
  });

  it("counts days across a month boundary", () => {
    expect(addDays("2026-09-26", 7)).toBe("2026-10-03");
    expect(addDays("2026-12-28", 7)).toBe("2027-01-04");
  });

  it("removes only the class asked for", () => {
    const next = removeClass([klass({ id: "a" }), klass({ id: "b" })], "a");
    expect(next.map((item) => item.id)).toEqual(["b"]);
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

describe("reading the stored record back", () => {
  it("starts from the seeded schedule when nothing is stored", () => {
    expect(normaliseLiveClassActions(null).classes).toHaveLength(
      seedClasses().length,
    );
  });

  it("keeps a schedule somebody emptied rather than re-seeding it", () => {
    expect(normaliseLiveClassActions({ classes: [] }).classes).toEqual([]);
  });

  it("drops a class with no id or date and repairs a bad status", () => {
    const read = normaliseLiveClassActions({
      classes: [
        { date: "2026-09-12" },
        { id: "a" },
        { id: "b", date: "2026-09-12", status: "Maybe", capacity: -3 },
      ],
    });

    expect(read.classes).toHaveLength(1);
    expect(read.classes[0]).toMatchObject({
      status: "Not Yet Open",
      capacity: 50,
    });
  });

  it("drops a stored recording link that is not http", () => {
    // It comes straight back out as an href, so it is filtered on the way
    // in as well as on the way in from the form.
    const read = normaliseLiveClassActions({
      recordings: {
        Good: "https://zoom.us/rec/1",
        Bad: "javascript:alert(1)",
        Wrong: 7,
      },
    });

    expect(read.recordings).toEqual({ Good: "https://zoom.us/rec/1" });
  });

  it("refuses a select value that is not one of the options", () => {
    const read = normaliseLiveClassActions({
      settings: { reminders: { email: true, lead: "whenever" } },
    });

    expect(read.settings.reminders.email).toBe(true);
    expect(read.settings.reminders.lead).toBe("1 day before");
  });
});
