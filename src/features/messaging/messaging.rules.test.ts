import { describe, expect, it } from "vitest";
import * as rules from "./messaging.rules";
import type { MessagingState } from "./messaging.types";

const NOW = Date.parse("2026-09-20T12:00:00.000Z");
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function profile(program: string, mrn: string) {
  return {
    dob: "05/14/1968",
    age: 58,
    mrn,
    phone: "(803) 555-2214",
    email: "test@email.com",
    program,
    enrolledOn: "Jan 15, 2026",
    status: "Active",
    careTeam: "Dr. Carter",
    notes: "",
  };
}

function stateWith(
  overrides: { unread?: number; flagged?: boolean; archived?: boolean } = {},
): MessagingState {
  const { unread = 0, flagged = false, archived = false } = overrides;
  return {
    conversations: [
      {
        id: "c1",
        memberName: "Mary S. Johnson",
        unread,
        flagged,
        archived,
        patient: profile("Crash Dialysis (5-Day)", "100111"),
        messages: [
          {
            id: "c1-m1",
            author: "member",
            body: "Hello",
            sentAt: new Date(NOW - HOUR).toISOString(),
          },
        ],
      },
      {
        id: "c2",
        memberName: "John D. Smith",
        unread: 0,
        flagged: false,
        archived: false,
        patient: profile("Journey to Dialysis (21-Day)", "100222"),
        messages: [
          {
            id: "c2-m1",
            author: "clinic",
            body: "Take it with food",
            sentAt: new Date(NOW - 3 * DAY).toISOString(),
            attachment: { name: "Handout.pdf", sizeLabel: "1.2 MB" },
          },
        ],
      },
    ],
  };
}

describe("appendMessage", () => {
  it("adds the message to the right thread and leaves the others alone", () => {
    const next = rules.appendMessage(
      stateWith(),
      "c1",
      "On my way",
      "clinic",
      NOW,
    );
    expect(next.conversations[0].messages).toHaveLength(2);
    expect(next.conversations[0].messages[1]).toMatchObject({
      author: "clinic",
      body: "On my way",
      sentAt: new Date(NOW).toISOString(),
    });
    expect(next.conversations[1].messages).toHaveLength(1);
  });

  it("refuses an empty body, so a stray Enter posts nothing", () => {
    const before = stateWith();
    expect(rules.appendMessage(before, "c1", "", "clinic", NOW)).toBe(before);
    expect(rules.appendMessage(before, "c1", "   \n ", "clinic", NOW)).toBe(
      before,
    );
  });

  it("trims the body rather than storing the whitespace around it", () => {
    const next = rules.appendMessage(
      stateWith(),
      "c1",
      "  hi  ",
      "clinic",
      NOW,
    );
    expect(next.conversations[0].messages[1].body).toBe("hi");
  });

  it("treats a clinic reply as having read the thread", () => {
    const next = rules.appendMessage(
      stateWith({ unread: 4 }),
      "c1",
      "Reply",
      "clinic",
      NOW,
    );
    expect(next.conversations[0].unread).toBe(0);
  });

  it("counts an incoming member message as unread", () => {
    const next = rules.appendMessage(
      stateWith({ unread: 1 }),
      "c1",
      "Another",
      "member",
      NOW,
    );
    expect(next.conversations[0].unread).toBe(2);
  });

  it("does not mutate the state it was given", () => {
    const before = stateWith();
    rules.appendMessage(before, "c1", "New", "clinic", NOW);
    expect(before.conversations[0].messages).toHaveLength(1);
  });

  it("ignores an id that is not in the state", () => {
    const next = rules.appendMessage(stateWith(), "nope", "Hi", "clinic", NOW);
    expect(next.conversations.flatMap((c) => c.messages)).toHaveLength(2);
  });
});

describe("markRead", () => {
  it("clears the unread count for that thread only", () => {
    const next = rules.markRead(stateWith({ unread: 3 }), "c1");
    expect(next.conversations[0].unread).toBe(0);
    expect(next.conversations[1].unread).toBe(0);
  });

  it("leaves an already-read thread untouched, object identity included", () => {
    const before = stateWith({ unread: 0 });
    const next = rules.markRead(before, "c1");
    expect(next.conversations[0]).toBe(before.conversations[0]);
  });
});

describe("sortByRecent", () => {
  it("puts the most recently active thread first", () => {
    const sorted = rules.sortByRecent(stateWith().conversations);
    expect(sorted.map((c) => c.id)).toEqual(["c1", "c2"]);
  });

  it("sorts a copy, never the array it was handed", () => {
    const list = stateWith().conversations;
    rules.sortByRecent(list);
    expect(list.map((c) => c.id)).toEqual(["c1", "c2"]);
  });
});

describe("searchConversations", () => {
  const list = stateWith().conversations;

  it("returns everything for an empty query", () => {
    expect(rules.searchConversations(list, "  ")).toHaveLength(2);
  });

  it("matches a member name regardless of case", () => {
    expect(rules.searchConversations(list, "mary")).toHaveLength(1);
  });

  it("matches a program", () => {
    expect(rules.searchConversations(list, "Crash")).toHaveLength(1);
  });

  it("matches words inside the messages, not just the header", () => {
    const found = rules.searchConversations(list, "with food");
    expect(found.map((c) => c.id)).toEqual(["c2"]);
  });

  it("returns nothing when nothing matches", () => {
    expect(rules.searchConversations(list, "zzz")).toEqual([]);
  });
});

describe("totalUnread", () => {
  it("adds up across threads", () => {
    expect(rules.totalUnread(stateWith({ unread: 3 }).conversations)).toBe(3);
  });

  it("is zero for an empty inbox", () => {
    expect(rules.totalUnread([])).toBe(0);
  });
});

describe("groupByDay", () => {
  it("keeps messages from one day in one group", () => {
    const messages = stateWith().conversations[0].messages;
    expect(rules.groupByDay(messages)).toHaveLength(1);
  });

  it("splits across days and keeps the original order", () => {
    const groups = rules.groupByDay([
      {
        id: "a",
        author: "member",
        body: "older",
        sentAt: new Date(NOW - 2 * DAY).toISOString(),
      },
      {
        id: "b",
        author: "clinic",
        body: "newer",
        sentAt: new Date(NOW).toISOString(),
      },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].messages[0].body).toBe("older");
  });

  it("handles an empty thread", () => {
    expect(rules.groupByDay([])).toEqual([]);
  });
});

describe("dayLabel", () => {
  it("calls today Today", () => {
    expect(rules.dayLabel(new Date(NOW - HOUR).toISOString(), NOW)).toBe(
      "Today",
    );
  });

  it("calls yesterday Yesterday", () => {
    expect(rules.dayLabel(new Date(NOW - DAY).toISOString(), NOW)).toBe(
      "Yesterday",
    );
  });

  it("gives an older message a real date", () => {
    const label = rules.dayLabel(new Date(NOW - 9 * DAY).toISOString(), NOW);
    expect(label).not.toBe("Today");
    expect(label).not.toBe("Yesterday");
  });
});

describe("relativeLabel", () => {
  it("reads Just now inside the first minute", () => {
    expect(rules.relativeLabel(new Date(NOW - 5_000).toISOString(), NOW)).toBe(
      "Just now",
    );
  });

  it("counts minutes, then hours, then days", () => {
    expect(
      rules.relativeLabel(new Date(NOW - 5 * MINUTE).toISOString(), NOW),
    ).toBe("5m");
    expect(
      rules.relativeLabel(new Date(NOW - 3 * HOUR).toISOString(), NOW),
    ).toBe("3h");
    expect(
      rules.relativeLabel(new Date(NOW - 2 * DAY).toISOString(), NOW),
    ).toBe("2d");
  });

  it("falls back to a date past a week", () => {
    const label = rules.relativeLabel(
      new Date(NOW - 20 * DAY).toISOString(),
      NOW,
    );
    expect(label).not.toMatch(/^\d+d$/);
  });
});

describe("initials", () => {
  it("takes the first and last word", () => {
    expect(rules.initials("Mary S. Johnson")).toBe("MJ");
  });

  it("handles a single name", () => {
    expect(rules.initials("Cher")).toBe("C");
  });

  it("does not choke on empty input", () => {
    expect(rules.initials("   ")).toBe("?");
  });
});

describe("the seed", () => {
  const seeded = rules.seedConversations(NOW);

  it("gives every conversation a unique id", () => {
    expect(new Set(seeded.map((c) => c.id)).size).toBe(seeded.length);
  });

  it("gives every message a unique id, which React keys on", () => {
    const ids = seeded.flatMap((c) => c.messages.map((m) => m.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps each thread in chronological order", () => {
    for (const conversation of seeded) {
      const sent = conversation.messages.map((m) => m.sentAt);
      expect([...sent].sort()).toEqual(sent);
    }
  });

  it("never dates a message in the future", () => {
    for (const conversation of seeded) {
      for (const message of conversation.messages) {
        expect(Date.parse(message.sentAt)).toBeLessThanOrEqual(NOW);
      }
    }
  });

  it("is stable: seeding twice at the same instant gives the same ids", () => {
    expect(rules.seedConversations(NOW)).toEqual(seeded);
  });
});

describe("applyFilter", () => {
  it("hides an archived thread from All", () => {
    const state = stateWith({ archived: true });
    expect(
      rules.applyFilter(state.conversations, "all").map((c) => c.id),
    ).toEqual(["c2"]);
  });

  it("shows only archived threads under Archived", () => {
    const state = stateWith({ archived: true });
    expect(
      rules.applyFilter(state.conversations, "archived").map((c) => c.id),
    ).toEqual(["c1"]);
  });

  it("never shows an archived thread under Unread, however unread it is", () => {
    const state = stateWith({ unread: 5, archived: true });
    expect(rules.applyFilter(state.conversations, "unread")).toEqual([]);
  });

  it("shows only flagged threads under Flagged", () => {
    const state = stateWith({ flagged: true });
    expect(
      rules.applyFilter(state.conversations, "flagged").map((c) => c.id),
    ).toEqual(["c1"]);
  });
});

describe("filterCounts", () => {
  it("counts threads, not messages", () => {
    const state = stateWith({ unread: 4 });
    expect(rules.filterCounts(state.conversations)).toEqual({
      all: 2,
      unread: 1,
      flagged: 0,
      archived: 0,
    });
  });

  it("moves a thread out of All and into Archived when it is archived", () => {
    const counts = rules.filterCounts(
      stateWith({ archived: true }).conversations,
    );
    expect(counts.all).toBe(1);
    expect(counts.archived).toBe(1);
  });
});

describe("toggleFlag", () => {
  it("raises and lowers the flag on one thread", () => {
    const once = rules.toggleFlag(stateWith(), "c1");
    expect(once.conversations[0].flagged).toBe(true);
    expect(once.conversations[1].flagged).toBe(false);
    expect(rules.toggleFlag(once, "c1").conversations[0].flagged).toBe(false);
  });
});

describe("setArchived", () => {
  it("archives and restores without touching the messages", () => {
    const archived = rules.setArchived(stateWith(), "c1", true);
    expect(archived.conversations[0].archived).toBe(true);
    expect(archived.conversations[0].messages).toHaveLength(1);
    expect(
      rules.setArchived(archived, "c1", false).conversations[0].archived,
    ).toBe(false);
  });
});

describe("markUnread", () => {
  it("puts a read thread back in the unread pile as one", () => {
    expect(rules.markUnread(stateWith(), "c1").conversations[0].unread).toBe(1);
  });

  it("leaves an already-unread thread at its own count", () => {
    expect(
      rules.markUnread(stateWith({ unread: 3 }), "c1").conversations[0].unread,
    ).toBe(3);
  });

  it("cannot make an empty thread unread", () => {
    const empty: MessagingState = {
      conversations: [
        {
          id: "c3",
          memberName: "Nobody",
          unread: 0,
          flagged: false,
          archived: false,
          patient: profile("CKD Education", "100333"),
          messages: [],
        },
      ],
    };
    expect(rules.markUnread(empty, "c3").conversations[0].unread).toBe(0);
  });
});

describe("hasAttachment", () => {
  it("is true only for a thread carrying a file", () => {
    const [mary, john] = stateWith().conversations;
    expect(rules.hasAttachment(mary)).toBe(false);
    expect(rules.hasAttachment(john)).toBe(true);
  });
});

describe("searchConversations, on the patient record", () => {
  it("finds a patient by MRN", () => {
    const found = rules.searchConversations(
      stateWith().conversations,
      "100222",
    );
    expect(found.map((c) => c.id)).toEqual(["c2"]);
  });

  it("finds a patient by programme", () => {
    const found = rules.searchConversations(stateWith().conversations, "Crash");
    expect(found.map((c) => c.id)).toEqual(["c1"]);
  });
});

describe("the seeded inbox", () => {
  const seeded = rules.seedConversations(NOW);

  it("holds the ten threads the client specified", () => {
    expect(seeded).toHaveLength(10);
  });

  it("has exactly three unread threads, matching the filter count", () => {
    expect(rules.filterCounts(seeded).unread).toBe(3);
  });

  it("gives every thread a complete patient record for the rail", () => {
    for (const conversation of seeded) {
      expect(conversation.patient.mrn).toMatch(/^\d+$/);
      expect(conversation.patient.program).not.toBe("");
      expect(conversation.patient.phone).not.toBe("");
    }
  });
});

describe("applyFilter, with the open thread pinned", () => {
  it("keeps a thread listed after opening it marks it read", () => {
    /* The clinic clicks an unread thread in the Unread folder. Marking it
       read must not pull the row out from under them. */
    const read = rules.markRead(stateWith({ unread: 2 }), "c1");
    expect(rules.applyFilter(read.conversations, "unread")).toEqual([]);
    expect(
      rules.applyFilter(read.conversations, "unread", "c1").map((c) => c.id),
    ).toEqual(["c1"]);
  });

  it("keeps an archived thread listed in All while it is open", () => {
    const state = stateWith({ archived: true });
    expect(
      rules.applyFilter(state.conversations, "all", "c1").map((c) => c.id),
    ).toEqual(["c1", "c2"]);
  });

  it("pins nothing when the id is null", () => {
    const read = rules.markRead(stateWith({ unread: 2 }), "c1");
    expect(rules.applyFilter(read.conversations, "unread", null)).toEqual([]);
  });

  it("does not leak the pin into the folder counts", () => {
    const read = rules.markRead(stateWith({ unread: 2 }), "c1");
    expect(rules.filterCounts(read.conversations).unread).toBe(0);
  });
});

describe("inboxTimeLabel", () => {
  it("gives the clock time for something that arrived today", () => {
    const iso = new Date(NOW - 2 * HOUR).toISOString();
    expect(rules.inboxTimeLabel(iso, NOW)).toBe(rules.timeLabel(iso));
  });

  it("says Yesterday rather than a time", () => {
    expect(rules.inboxTimeLabel(new Date(NOW - DAY).toISOString(), NOW)).toBe(
      "Yesterday",
    );
  });

  it("names the weekday inside the last week", () => {
    const label = rules.inboxTimeLabel(
      new Date(NOW - 3 * DAY).toISOString(),
      NOW,
    );
    expect(label).toMatch(/day$/);
  });

  it("falls back to a dated form past a week", () => {
    const label = rules.inboxTimeLabel(
      new Date(NOW - 20 * DAY).toISOString(),
      NOW,
    );
    expect(label).toMatch(/\d{4}/);
  });
});
