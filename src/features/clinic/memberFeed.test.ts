import { describe, expect, it } from "vitest";
import { seedConversations } from "@/features/messaging/messaging.seed";
import type { Conversation } from "@/features/messaging/messaging.types";
import type { BetweenTreatmentCheckIn } from "@/features/personal-log/check-in/checkIn.types";
import {
  CCM_PATIENTS,
  openInbox,
  resolveInbox,
  withFeed,
  type CcmState,
} from "./ccm.data";
import {
  LINKED_MEMBER,
  labAlerts,
  memberCheckInRows,
  memberInbox,
  messageAlerts,
  missedDoseAlerts,
  noticeAlerts,
  parseRange,
  sideEffectAlerts,
  type MemberData,
} from "./memberFeed";

const TODAY = "2026-09-30";
const NOW = new Date(2026, 8, 30, 10).getTime();
const MRN = LINKED_MEMBER.mrn;

const empty: MemberData = {
  conversations: [],
  labResult: null,
  sideEffects: [],
  doses: [],
  notices: [],
  checkIns: [],
};

function checkIn(
  date: string,
  change: Partial<BetweenTreatmentCheckIn> = {},
): BetweenTreatmentCheckIn {
  return {
    date,
    treatmentDay: false,
    feeling: "good",
    symptoms: [],
    severity: "mild",
    missedTreatment: false,
    notes: "",
    savedAt: `${date}T09:00:00.000Z`,
    ...change,
  };
}

describe("the linked member", () => {
  it("is on the CCM roster, and is the member the messaging seed signs in as", () => {
    expect(CCM_PATIENTS.some((p) => p.mrn === MRN)).toBe(true);
    const thread = seedConversations(NOW).find(
      (c) => c.memberName === LINKED_MEMBER.name && c.patient,
    );
    expect(thread?.patient?.mrn).toBe(MRN);
  });
});

describe("lab alerts", () => {
  it("reads the reference ranges", () => {
    expect(parseRange("7 – 20 mg/dL")).toEqual({ low: 7, high: 20 });
    expect(parseRange("> 90 mL/min/1.73m²")).toEqual({ low: 90 });
    expect(parseRange("< 5 %")).toEqual({ high: 5 });
    expect(parseRange("see report")).toBeNull();
  });

  it("raises one alert listing each value out of range", () => {
    const [alert] = labAlerts(
      { date: "2026-09-28", values: { Potassium: "5.9", Sodium: "140" } },
      MRN,
      NOW,
    );
    expect(alert.kind).toBe("Lab alert");
    expect(alert.text).toContain("Potassium 5.9 (high)");
    expect(alert.text).not.toContain("Sodium");
  });

  it("raises nothing when everything is in range, or nothing was entered", () => {
    expect(labAlerts({ values: { Sodium: "140" } }, MRN, NOW)).toEqual([]);
    expect(labAlerts(null, MRN, NOW)).toEqual([]);
  });
});

describe("message alerts", () => {
  const thread = (last: "member" | "clinic"): Conversation => ({
    id: "t",
    memberName: LINKED_MEMBER.name,
    contact: { name: "Riverside", role: "Care team", kind: "facility" },
    category: "care-team",
    unread: 0,
    flagged: false,
    archived: false,
    messages: [
      {
        id: "t-m1",
        author: "member",
        body: "First",
        sentAt: "2026-09-29T08:00:00Z",
      },
      {
        id: "t-m2",
        author: last,
        body: "Latest",
        sentAt: "2026-09-29T09:00:00Z",
      },
    ],
  });

  it("raises the member's last message while it waits for a reply", () => {
    const [alert] = messageAlerts([thread("member")], LINKED_MEMBER.name, MRN);
    expect(alert).toMatchObject({ id: "feed:msg:t-m2", text: "Latest" });
  });

  it("clears once the clinic has answered", () => {
    expect(messageAlerts([thread("clinic")], LINKED_MEMBER.name, MRN)).toEqual(
      [],
    );
  });
});

describe("medication alerts", () => {
  it("lists recent side effects, not 'none' or old ones", () => {
    const alerts = sideEffectAlerts(
      [
        {
          date: "2026-09-29",
          time: "08:00",
          medication: "Lisinopril",
          effect: "dizziness",
          savedAt: "2026-09-29T08:05:00Z",
        },
        {
          date: "2026-09-29",
          time: "20:00",
          medication: "Lisinopril",
          effect: "none",
          savedAt: "2026-09-29T20:05:00Z",
        },
        {
          date: "2026-08-01",
          time: "08:00",
          medication: "Lisinopril",
          effect: "nausea",
          savedAt: "2026-08-01T08:05:00Z",
        },
      ],
      MRN,
      TODAY,
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0].text).toBe("Dizziness after Lisinopril (Sep 29, 2026)");
  });

  it("raises missed doses at two in a week", () => {
    const dose = (date: string) => ({
      date,
      time: "08:00",
      medication: "Sevelamer",
      status: "missed" as const,
    });
    expect(missedDoseAlerts([dose("2026-09-29")], MRN, TODAY)).toEqual([]);
    const [alert] = missedDoseAlerts(
      [dose("2026-09-29"), dose("2026-09-27")],
      MRN,
      TODAY,
    );
    expect(alert.text).toBe("2 doses missed in the last 7 days (Sevelamer)");
  });
});

describe("check-in notices", () => {
  it("reach the inbox once delivered, not while held for a closed day", () => {
    const notice = {
      checkInDate: "2026-09-28",
      raisedOn: "2026-09-28",
      raisedAt: "2026-09-28T18:00:00Z",
      deliverOn: "2026-09-29",
      reasons: ["missed-treatment" as const],
    };
    expect(noticeAlerts([notice], MRN, "2026-09-28")).toEqual([]);
    const [alert] = noticeAlerts([notice], MRN, TODAY);
    expect(alert.text).toBe("Check-in for Sep 28, 2026: missed a treatment");
  });
});

describe("check-in rows", () => {
  it("marks a day that earns a notice as At Risk, a quiet one Completed", () => {
    const rows = memberCheckInRows(
      {
        checkIns: [
          checkIn("2026-09-29", { missedTreatment: true }),
          checkIn("2026-09-28"),
        ],
        notices: [],
      },
      "CKD Education",
      TODAY,
    );
    expect(rows.map((r) => r.status)).toEqual(["At Risk", "Completed"]);
    expect(rows[0]).toMatchObject({
      name: LINKED_MEMBER.name,
      date: "Sep 29, 2026",
      notes: "Missed a treatment.",
    });
  });

  it("leads with a Missed row after a week without a check-in", () => {
    const rows = memberCheckInRows(
      { checkIns: [checkIn("2026-09-20")], notices: [] },
      "CKD Education",
      TODAY,
    );
    expect(rows[0]).toMatchObject({
      status: "Missed",
      notes: "No check-in since Sep 20, 2026.",
    });
  });
});

describe("in the CCM inbox", () => {
  it("counts like any item, and stays resolved once resolved", () => {
    const state: CcmState = { activities: [], requirements: {}, inbox: [] };
    const feed = memberInbox(
      { ...empty, labResult: { values: { Potassium: "6.1" } } },
      NOW,
      TODAY,
    );
    expect(openInbox(withFeed(state, feed), MRN)).toHaveLength(1);

    const resolved = resolveInbox(state, feed[0].id);
    expect(resolved.resolvedFeed).toEqual([feed[0].id]);
    expect(openInbox(withFeed(resolved, feed), MRN)).toHaveLength(0);
  });
});
