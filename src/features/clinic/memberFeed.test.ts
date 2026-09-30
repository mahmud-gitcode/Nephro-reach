import { describe, expect, it } from "vitest";
import { seedConversations } from "@/features/messaging/messaging.seed";
import type { Conversation } from "@/features/messaging/messaging.types";
import type { BetweenTreatmentCheckIn } from "@/features/personal-log/check-in/checkIn.types";
import type { BpReading } from "@/features/personal-log/blood-pressure/bloodPressure";
import type { Appointment } from "@/features/personal-log/appointments/appointments";
import type { WeightFluidEntry } from "@/features/personal-log/fluid/fluid.types";
import type { AccessRecord } from "@/features/vascular-access/vascularAccess.data";
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
  accessAlerts,
  bpAlerts,
  bpSymptomAlerts,
  missedAppointmentAlerts,
  missedDoseAlerts,
  parseRange,
  weightAlerts,
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
  bloodPressure: [],
  weights: [],
  appointments: [],
  access: null,
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

describe("dialysis treatment data", () => {
  it("never reaches the CCM inbox, even a check-in sent to the clinic", () => {
    // Client, 2026-09-30: CCM does not manage dialysis, so treatment data
    // must not alert the CCM dashboard.
    const notice = {
      checkInDate: "2026-09-28",
      raisedOn: "2026-09-28",
      raisedAt: "2026-09-28T18:00:00Z",
      deliverOn: "2026-09-29",
      reasons: ["missed-treatment" as const],
    };
    const inbox = memberInbox(
      {
        ...empty,
        notices: [notice],
        checkIns: [checkIn("2026-09-28", { missedTreatment: true })],
      },
      NOW,
      TODAY,
    );
    expect(inbox).toEqual([]);
  });
});

function reading(
  id: string,
  date: string,
  systolic: number,
  diastolic: number,
  change: Partial<BpReading> = {},
): BpReading {
  return {
    id,
    date,
    time: "08:00",
    systolic,
    diastolic,
    pulse: 70,
    position: "Sitting",
    symptoms: "None",
    medication: "Taken",
    notes: "",
    ...change,
  };
}

describe("blood pressure alerts", () => {
  it("raise every severe reading on its own", () => {
    const alerts = bpAlerts(
      [reading("a", "2026-09-29", 184, 96), reading("b", "2026-09-28", 86, 50)],
      MRN,
      TODAY,
    );
    expect(alerts.map((a) => a.text)).toEqual([
      "Very high reading 184/96 on Sep 29, 2026",
      "Low reading 86/50 on Sep 28, 2026",
    ]);
  });

  it("raise one item for two High readings in a week, not for one", () => {
    const one = [reading("a", "2026-09-29", 146, 88)];
    expect(bpAlerts(one, MRN, TODAY)).toEqual([]);
    const two = [...one, reading("b", "2026-09-26", 150, 92)];
    const [alert] = bpAlerts(two, MRN, TODAY);
    expect(alert.kind).toBe("Blood pressure");
    expect(alert.text).toBe(
      "2 high readings in 7 days (latest 146/88 on Sep 29, 2026)",
    );
  });

  it("ignore readings older than a week", () => {
    const old = [
      reading("a", "2026-09-20", 190, 100),
      reading("b", "2026-09-19", 150, 95),
      reading("c", "2026-09-18", 150, 95),
    ];
    expect(bpAlerts(old, MRN, TODAY)).toEqual([]);
  });
});

describe("symptoms reported with blood pressure", () => {
  it("raise a symptom or a missed BP medicine, not a quiet reading", () => {
    const alerts = bpSymptomAlerts(
      [
        reading("a", "2026-09-29", 150, 92, { symptoms: "Dizzy" }),
        reading("b", "2026-09-28", 128, 80, { medication: "Not taken" }),
        reading("c", "2026-09-27", 120, 78),
      ],
      MRN,
      TODAY,
    );
    expect(alerts.map((a) => a.text)).toEqual([
      "Dizzy with BP 150/92 (Sep 29, 2026)",
      "BP 128/80, BP medicine not taken (Sep 28, 2026)",
    ]);
  });
});

function weighed(
  id: string,
  date: string,
  weightKg: number,
  change: Partial<WeightFluidEntry> = {},
): WeightFluidEntry {
  return {
    id,
    date,
    weightKg,
    dateEn: date,
    dateEs: date,
    morning: String(weightKg),
    evening: "--",
    uo: "Moderate",
    intake: "0",
    goal: "Goal Met",
    swelling: "NO",
    sob: "NO",
    weakness: "NO",
    notes: "--",
    noteKey: null,
    ...change,
  };
}

describe("weight change", () => {
  it("raises 2 kg or more within a week, with the symptoms logged", () => {
    const [alert] = weightAlerts(
      [
        weighed("a", "2026-09-29", 74.6, { swelling: "YES" }),
        weighed("b", "2026-09-26", 72.4),
      ],
      MRN,
      TODAY,
    );
    expect(alert.kind).toBe("Weight change");
    expect(alert.text).toBe(
      "Weight up 2.2 kg (4.9 lb) since Sep 26, 2026: 74.6 kg on Sep 29, 2026, swelling",
    );
  });

  it("stays quiet under 2 kg, beyond a week, or without a dated weight", () => {
    expect(
      weightAlerts(
        [weighed("a", "2026-09-29", 73.5), weighed("b", "2026-09-26", 72.4)],
        MRN,
        TODAY,
      ),
    ).toEqual([]);
    expect(
      weightAlerts(
        [weighed("a", "2026-09-29", 76), weighed("b", "2026-09-15", 72)],
        MRN,
        TODAY,
      ),
    ).toEqual([]);
    expect(
      weightAlerts(
        [{ ...weighed("a", "2026-09-29", 76), date: undefined }],
        MRN,
        TODAY,
      ),
    ).toEqual([]);
  });
});

function appointment(
  id: string,
  date: string,
  attendance?: Appointment["attendance"],
): Appointment {
  return {
    id,
    date,
    start: "10:30",
    end: "",
    title: "Nephrology",
    doctor: "Dr. Carter",
    location: "",
    address: "",
    notes: "",
    ...(attendance ? { attendance } : {}),
  };
}

describe("missed appointments", () => {
  it("raise one the patient missed, or left unanswered for two days", () => {
    const alerts = missedAppointmentAlerts(
      [
        appointment("said", "2026-09-29", "missed"),
        appointment("silent", "2026-09-27"),
        appointment("recent", "2026-09-29"),
        appointment("went", "2026-09-20", "attended"),
        appointment("ahead", "2026-10-03"),
      ],
      MRN,
      TODAY,
    );
    expect(alerts.map((a) => a.text)).toEqual([
      "Nephrology with Dr. Carter on Sep 29, 2026: patient says they missed it",
      "Nephrology with Dr. Carter on Sep 27, 2026: not confirmed as attended",
    ]);
  });
});

describe("vascular access", () => {
  const record = {
    appointments: [
      {
        id: "soon",
        date: "2026-10-05",
        time: "09:00",
        title: "Fistulogram",
        place: "Metro Vascular Access Center",
        team: "access",
      },
      {
        id: "gone",
        date: "2026-09-25",
        time: "09:00",
        title: "Access Check",
        place: "Metro",
        team: "access",
      },
      {
        id: "done",
        date: "2026-09-20",
        time: "09:00",
        title: "Access Check",
        place: "Metro",
        team: "access",
        completed: { result: "Fine", performedBy: "Dr. Patel" },
      },
    ],
    concerns: [
      {
        id: "c1",
        reportedAt: "2026-09-29T10:00:00Z",
        kinds: ["Bleeding"],
        detail: "After dialysis",
        status: "Open",
      },
      {
        id: "c2",
        reportedAt: "2026-09-10T10:00:00Z",
        kinds: ["Pain"],
        detail: "",
        status: "Reviewed",
      },
    ],
  } as unknown as AccessRecord;

  it("raise upcoming visits, visits never marked done and open concerns", () => {
    const alerts = accessAlerts(record, MRN, TODAY);
    expect(alerts.map((a) => [a.kind, a.text])).toEqual([
      [
        "Access appointment",
        "Fistulogram on Oct 5, 2026 at 9:00 AM, Metro Vascular Access Center",
      ],
      [
        "Missed appointment",
        "Access: Access Check on Sep 25, 2026 was not marked as done",
      ],
      ["Access concern", "Reported bleeding: After dialysis"],
    ]);
  });

  it("raise nothing without a record", () => {
    expect(accessAlerts(null, MRN, TODAY)).toEqual([]);
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
