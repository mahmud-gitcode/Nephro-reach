import { describe, expect, it } from "vitest";
import * as rules from "./messaging.rules";
import type { CareTeamContact, MessagingState } from "./messaging.types";

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

const FACILITY: CareTeamContact = {
  name: "Riverside Dialysis Center",
  role: "Your Dialysis Care Team",
  kind: "facility",
};

function stateWith(
  overrides: { unread?: number; flagged?: boolean; archived?: boolean } = {},
): MessagingState {
  const { unread = 0, flagged = false, archived = false } = overrides;
  return {
    conversations: [
      {
        id: "c1",
        memberName: "Mary S. Johnson",
        contact: FACILITY,
        category: "care-team",
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
        contact: FACILITY,
        category: "care-team",
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

describe("applyFilter, with the open thread pinned", () => {
  const read = () => {
    const state = stateWith({ unread: 0 });
    return state.conversations;
  };

  it("keeps a thread listed after opening it marks it read", () => {
    /* The clinic clicks an unread thread in the Unread folder. Marking it
       read must not pull the row out from under them. */
    expect(rules.applyFilter(read(), "unread")).toEqual([]);
    expect(rules.applyFilter(read(), "unread", "c1").map((c) => c.id)).toEqual([
      "c1",
    ]);
  });

  it("keeps an archived thread listed in All while it is open", () => {
    const state = stateWith({ archived: true });
    expect(
      rules.applyFilter(state.conversations, "all", "c1").map((c) => c.id),
    ).toEqual(["c1", "c2"]);
  });

  it("pins nothing when the id is null", () => {
    expect(rules.applyFilter(read(), "unread", null)).toEqual([]);
  });

  it("does not leak the pin into the folder counts", () => {
    expect(rules.filterCounts(read()).unread).toBe(0);
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

/* ==========================================================================
   The member's end (Phase 11: rows from the server, by id)
   ========================================================================== */

const OFFICE_A: CareTeamContact = {
  name: "Synthetic Dialysis Center A",
  role: "Your Dialysis Care Team",
  kind: "facility",
};
const OFFICE_B: CareTeamContact = {
  name: "Synthetic Nephrology Office B",
  role: "Your Nephrology Office",
  kind: "facility",
};

function memberRow(
  id: string,
  contact: CareTeamContact,
  category: "care-team" | "appointments",
  archived = false,
  last: { author: "member" | "clinic"; body: string; at: number } | null = null,
) {
  return {
    id,
    memberName: "",
    contact,
    category,
    unread: 0,
    flagged: false,
    archived,
    messages: [],
    last: last
      ? {
          id: `${id}-last`,
          author: last.author,
          body: last.body,
          sentAt: new Date(last.at).toISOString(),
        }
      : null,
  };
}

const memberInbox = [
  memberRow("m1", OFFICE_A, "care-team"),
  memberRow("m2", OFFICE_A, "appointments"),
  memberRow("m3", OFFICE_B, "care-team", true),
];

describe("applyMemberFilter", () => {
  it("shows everything but the archived under All", () => {
    const all = rules.applyMemberFilter(memberInbox, "all");
    expect(all.map((c) => c.id)).toEqual(["m1", "m2"]);
  });

  it("filters by subject, not by state", () => {
    expect(
      rules.applyMemberFilter(memberInbox, "appointments").map((c) => c.id),
    ).toEqual(["m2"]);
  });

  it("shows only the archived under Archived", () => {
    expect(
      rules.applyMemberFilter(memberInbox, "archived").map((c) => c.id),
    ).toEqual(["m3"]);
  });

  it("keeps the open thread listed when it stops matching", () => {
    const shown = rules.applyMemberFilter(memberInbox, "appointments", "m1");
    expect(shown.map((c) => c.id)).toContain("m1");
  });

  it("counts the folder, not the view", () => {
    const counts = rules.memberFilterCounts(memberInbox);
    expect(counts.all).toBe(2);
    expect(counts.all + counts.archived).toBe(memberInbox.length);
  });
});

describe("searchConversations, from the member's end", () => {
  it("finds a thread by the office it is with", () => {
    const hits = rules.searchConversations(memberInbox, "nephrology office b");
    expect(hits.map((c) => c.id)).toEqual(["m3"]);
  });

  it("finds a thread by what the office is", () => {
    const hits = rules.searchConversations(memberInbox, "dialysis care team");
    expect(hits.map((c) => c.id)).toEqual(["m1", "m2"]);
  });

  it("does not crash on a thread with no chart behind it", () => {
    expect(() =>
      rules.searchConversations(memberInbox, "100245"),
    ).not.toThrow();
  });
});

describe("open questions for Reports", () => {
  const officeInbox = [
    {
      ...memberRow("q1", OFFICE_A, "care-team", false, {
        author: "member",
        body: "Is swelling normal?",
        at: NOW - 2 * HOUR,
      }),
      memberName: "Test Patient One",
    },
    {
      ...memberRow("q2", OFFICE_A, "care-team", false, {
        author: "member",
        body: "Older question",
        at: NOW - 5 * HOUR,
      }),
      memberName: "Test Patient Two",
    },
    {
      ...memberRow("q3", OFFICE_A, "care-team", false, {
        author: "clinic",
        body: "We will call you.",
        at: NOW - HOUR,
      }),
      memberName: "Test Patient Three",
    },
    {
      ...memberRow("q4", OFFICE_A, "care-team", true, {
        author: "member",
        body: "Archived",
        at: NOW - HOUR,
      }),
      memberName: "Test Patient Four",
    },
  ];

  it("lists threads whose last word is the patient's, oldest first", () => {
    const open = rules.openQuestions(officeInbox);
    expect(open.map((q) => q.conversationId)).toEqual(["q2", "q1"]);
    expect(open[0].body).toBe("Older question");
  });

  it("drops a question once the office replies", () => {
    expect(
      rules.openQuestions(officeInbox).some((q) => q.conversationId === "q3"),
    ).toBe(false);
  });
});

/* The client (2026-10-06): patients do not message physicians directly. The
   pattern once held invisible backspace bytes where \b was meant, so it
   matched nobody and every physician thread stayed open to the member. */

describe("the list's last message (Phase 11)", () => {
  it("stands in for the thread until its messages are loaded", () => {
    const row = {
      ...stateWith().conversations[0],
      messages: [],
      last: {
        id: "x",
        author: "clinic" as const,
        body: "From the list",
        sentAt: new Date(NOW).toISOString(),
        attachment: { name: "a.pdf", sizeLabel: "1 KB", id: "f1" },
      },
    };
    expect(rules.lastMessage(row)?.body).toBe("From the list");
    expect(rules.hasAttachment(row)).toBe(true);
    expect(rules.searchConversations([row], "from the list")).toHaveLength(1);
  });
});
