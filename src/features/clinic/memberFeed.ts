/* ==========================================================================
   Member feed — what a patient's own app sends to the clinic
   --------------------------------------------------------------------------
   The clinic's CCM Inbox and Patient Check-Ins used to be demo lists typed
   into the code. This file derives them from what the member actually
   records instead:

     Patient message     their latest message to the care team, while it
                         waits for a reply
     Lab alert           a lab value they entered that is outside the range
     Side effect         a medication side effect they logged
     Missed doses        two or more doses marked missed in a week
     Blood pressure      one reading of 180/110 or more (or a top number
                         under 90), or two High readings in 7 days
     BP symptoms         a symptom logged with a reading, or the BP
                         medicine not taken
     Weight change       2 kg (about 5 lb) up or down within 7 days
     Access appointment  a vascular access visit booked in the next 14 days
     Access concern      a problem with the access the patient reported
     Missed appointment  one they said they missed, one left unanswered for
                         2 days, or an access visit that never happened
     Check-ins           their between-treatment check-ins, At Risk when the
                         day earns a notice, Missed after a week of silence

   The client's rule (2026-09-30): CCM does not manage dialysis, so nothing
   from the dialysis treatment itself raises a CCM alert — not the
   between-treatment check-in notices, not home-treatment vitals. Check-ins
   still show on the Check-Ins tab; they just never reach the inbox.

   Pure functions over the member's data, so the rules are tested once and
   survive the backend: today the data comes from this browser's storage
   (see useMemberFeed); with a server it comes from the patient's record,
   and nothing here changes.

   Frontend-only has no account linking a login to a chart, so one member
   is linked: the demo member the messaging seed signs in as. With a server
   this becomes every patient the clinic is allowed to see.
   ========================================================================== */

import { LAB_CATEGORIES } from "@/features/labs/labs.panels.seed";
import type { CustomLabResult } from "@/features/labs/labs.types";
import { SIDE_EFFECT_OPTIONS } from "@/features/medications/medicationLog.options";
import type {
  DoseRecord,
  SideEffectRecord,
} from "@/features/medications/medicationLog.types";
import { DEMO_MEMBER } from "@/features/messaging/messaging.seed";
import { DEMO_MEMBER_MRN } from "@/lib/data/demoIdentity";
import type { Conversation } from "@/features/messaging/messaging.types";
import { shouldSuggestNotice } from "@/features/personal-log/check-in/clinicNotice.rules";
import type { ClinicNotice } from "@/features/personal-log/check-in/clinicNotice.types";
import {
  statusOf,
  type BpReading,
} from "@/features/personal-log/blood-pressure/bloodPressure";
import type { Appointment } from "@/features/personal-log/appointments/appointments";
import type { WeightFluidEntry } from "@/features/personal-log/fluid/fluid.types";
import type { AccessRecord } from "@/features/vascular-access/vascularAccess.data";
import type { BetweenTreatmentCheckIn } from "@/features/personal-log/check-in/checkIn.types";
import type { CheckInRow } from "./checkIns.data";

/** The patient whose app feeds the clinic in the demo. MRN and program as
 *  in the messaging seed's chart for the same person. */
export const LINKED_MEMBER = {
  name: DEMO_MEMBER,
  mrn: DEMO_MEMBER_MRN,
  program: "CKD Education",
} as const;

export type FeedKind =
  | "Patient message"
  | "Lab alert"
  | "Side effect"
  | "Missed doses"
  | "Blood pressure"
  | "BP symptoms"
  | "Weight change"
  | "Access appointment"
  | "Access concern"
  | "Missed appointment";

export type FeedItem = {
  /** Stable, and specific to what raised it: a new message or a new lab
   *  draw is a new id, so resolving one never hides the next. */
  id: string;
  mrn: string;
  /** ISO 8601 */
  receivedAt: string;
  kind: FeedKind;
  text: string;
};

export type MemberData = {
  conversations: Conversation[];
  labResult: CustomLabResult | null;
  sideEffects: SideEffectRecord[];
  doses: DoseRecord[];
  notices: ClinicNotice[];
  checkIns: BetweenTreatmentCheckIn[];
  bloodPressure: BpReading[];
  weights: WeightFluidEntry[];
  appointments: Appointment[];
  /** The member's vascular access record, when they have one. */
  access: AccessRecord | null;
};

/* ------------------------------------------------------------------ dates */

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isoDay(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `yyyy-mm-dd` `days` before `today`. */
export function daysBefore(today: string, days: number): string {
  const [y, m, d] = today.split("-").map(Number);
  return isoDay(new Date(y, m - 1, d - days));
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2026-09-12" → "Sep 12, 2026", the clinic check-in tables' form. */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** Noon on a day, as ISO: a timestamp for things that only have a date. */
function middayIso(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toISOString();
}

/* ------------------------------------------------------------------- labs */

/** "7 – 20 mg/dL" → {low: 7, high: 20}; "> 90 …" → {low: 90}. */
export function parseRange(
  ref: string,
): { low?: number; high?: number } | null {
  const between = ref.match(/(-?\d+(?:\.\d+)?)\s*[–-]\s*(-?\d+(?:\.\d+)?)/);
  if (between) return { low: Number(between[1]), high: Number(between[2]) };
  const above = ref.match(/>\s*=?\s*(-?\d+(?:\.\d+)?)/);
  if (above) return { low: Number(above[1]) };
  const below = ref.match(/<\s*=?\s*(-?\d+(?:\.\d+)?)/);
  if (below) return { high: Number(below[1]) };
  return null;
}

/** One alert for a draw with anything out of range, listing each test. */
export function labAlerts(
  result: CustomLabResult | null,
  mrn: string,
  now: number,
): FeedItem[] {
  const values = result?.values;
  if (!values) return [];
  const flagged: string[] = [];
  for (const category of LAB_CATEGORIES) {
    for (const test of category.tests) {
      const raw = values[test.name];
      if (!raw) continue;
      const value = parseFloat(raw);
      const range = parseRange(test.refRange);
      if (Number.isNaN(value) || !range) continue;
      if (range.low !== undefined && value < range.low)
        flagged.push(`${test.name} ${raw} (low)`);
      else if (range.high !== undefined && value > range.high)
        flagged.push(`${test.name} ${raw} (high)`);
    }
  }
  if (flagged.length === 0) return [];
  const day = result?.date;
  return [
    {
      id: `feed:lab:${day ?? "latest"}:${flagged.join("|")}`,
      mrn,
      receivedAt: day ? middayIso(day) : new Date(now).toISOString(),
      kind: "Lab alert",
      text: `Patient-entered: ${flagged.join(", ")}`,
    },
  ];
}

/* --------------------------------------------------------------- messages */

function clip(text: string, max = 140) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** A thread with the facility whose last word is the member's. */
export function messageAlerts(
  conversations: Conversation[],
  member: string,
  mrn: string,
): FeedItem[] {
  return conversations
    .filter(
      (c) =>
        c.memberName === member && c.contact.kind === "facility" && !c.archived,
    )
    .flatMap((c) => {
      const last = c.messages[c.messages.length - 1];
      if (!last || last.author !== "member") return [];
      return [
        {
          id: `feed:msg:${last.id}`,
          mrn,
          receivedAt: last.sentAt,
          kind: "Patient message" as const,
          text: clip(last.body || "Sent an attachment"),
        },
      ];
    });
}

/* ------------------------------------------------------------ medications */

const SIDE_EFFECT_LABEL = new Map(
  SIDE_EFFECT_OPTIONS.map((option) => [option.value, option.labelEn]),
);

/** Side effects logged in the last two weeks, one item each. */
export function sideEffectAlerts(
  records: SideEffectRecord[],
  mrn: string,
  today: string,
): FeedItem[] {
  const since = daysBefore(today, 14);
  return records
    .filter((r) => r.effect !== "none" && r.date >= since && r.date <= today)
    .map((r) => ({
      id: `feed:side:${r.date}:${r.medication}:${r.time}:${r.effect}`,
      mrn,
      receivedAt: r.savedAt,
      kind: "Side effect" as const,
      text: `${SIDE_EFFECT_LABEL.get(r.effect) ?? r.effect} after ${r.medication} (${shortDate(r.date)})`,
    }));
}

/** Two or more doses marked missed in the last seven days: one item. */
export function missedDoseAlerts(
  doses: DoseRecord[],
  mrn: string,
  today: string,
): FeedItem[] {
  const since = daysBefore(today, 6);
  const missed = doses
    .filter((d) => d.status === "missed" && d.date >= since && d.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (missed.length < 2) return [];
  const medications = [...new Set(missed.map((d) => d.medication))];
  return [
    {
      id: `feed:doses:${missed[0].date}:${missed.length}`,
      mrn,
      receivedAt: middayIso(missed[0].date),
      kind: "Missed doses",
      text: `${missed.length} doses missed in the last 7 days (${medications.join(", ")})`,
    },
  ];
}

/* ---------------------------------------------------------- blood pressure */

function bp(r: Pick<BpReading, "systolic" | "diastolic">) {
  return `${r.systolic}/${r.diastolic}`;
}

/** At a reading, as ISO: its day and time. */
function readingIso(r: Pick<BpReading, "date" | "time">) {
  const [y, m, d] = r.date.split("-").map(Number);
  const [h, min] = r.time.split(":").map(Number);
  return new Date(y, m - 1, d, h || 0, min || 0).toISOString();
}

/** 180/110 or more, or a top number under 90: acted on at once. */
export function isSevereBp(r: Pick<BpReading, "systolic" | "diastolic">) {
  return r.systolic >= 180 || r.diastolic >= 110 || r.systolic < 90;
}

/**
 * Blood pressure worth a call: every severe reading on its own, and two or
 * more other High readings (140/90 and up) in the last seven days as one
 * item. The common home-monitoring thresholds; the practice can tune them.
 */
export function bpAlerts(
  readings: BpReading[],
  mrn: string,
  today: string,
): FeedItem[] {
  const since = daysBefore(today, 6);
  const recent = readings
    .filter((r) => r.date >= since && r.date <= today)
    .sort((a, b) => readingIso(b).localeCompare(readingIso(a)));

  const severe: FeedItem[] = recent.filter(isSevereBp).map((r) => ({
    id: `feed:bp:severe:${r.id}`,
    mrn,
    receivedAt: readingIso(r),
    kind: "Blood pressure",
    text: `${r.systolic < 90 ? "Low" : "Very high"} reading ${bp(r)} on ${shortDate(r.date)}`,
  }));

  const high = recent.filter((r) => !isSevereBp(r) && statusOf(r) === "High");
  const repeated: FeedItem[] =
    high.length >= 2
      ? [
          {
            id: `feed:bp:high:${high[0].id}:${high.length}`,
            mrn,
            receivedAt: readingIso(high[0]),
            kind: "Blood pressure",
            text: `${high.length} high readings in 7 days (latest ${bp(high[0])} on ${shortDate(high[0].date)})`,
          },
        ]
      : [];

  return [...severe, ...repeated];
}

/** A reading logged with a symptom, or with the BP medicine not taken, in
 *  the last two weeks. */
export function bpSymptomAlerts(
  readings: BpReading[],
  mrn: string,
  today: string,
): FeedItem[] {
  const since = daysBefore(today, 13);
  return readings
    .filter((r) => r.date >= since && r.date <= today)
    .flatMap((r) => {
      const symptom =
        r.symptoms.trim() && r.symptoms.trim() !== "None"
          ? r.symptoms.trim()
          : "";
      const medicine = r.medication === "Not taken";
      if (!symptom && !medicine) return [];
      const parts = [
        symptom ? `${symptom} with BP ${bp(r)}` : `BP ${bp(r)}`,
        medicine ? "BP medicine not taken" : "",
      ].filter(Boolean);
      return [
        {
          id: `feed:bp-symptom:${r.id}`,
          mrn,
          receivedAt: readingIso(r),
          kind: "BP symptoms" as const,
          text: `${parts.join(", ")} (${shortDate(r.date)})`,
        },
      ];
    });
}

/* ------------------------------------------------------------------ weight */

const KG_TO_LB = 2.20462;

/**
 * A change of 2 kg (about 5 lb) or more within seven days of the latest
 * weight: the usual home-monitoring threshold for fluid gain or loss. The
 * latest weight is compared with each earlier one in that week, and the
 * biggest swing wins. Symptoms logged with the latest weight ride along.
 */
export function weightAlerts(
  entries: WeightFluidEntry[],
  mrn: string,
  today: string,
): FeedItem[] {
  const weighed = entries
    .filter(
      (e): e is WeightFluidEntry & { date: string; weightKg: number } =>
        typeof e.date === "string" &&
        typeof e.weightKg === "number" &&
        e.date <= today,
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const latest = weighed[0];
  if (!latest || latest.date < daysBefore(today, 13)) return [];

  const windowStart = daysBefore(latest.date, 7);
  const earlier = weighed.filter(
    (e) => e !== latest && e.date >= windowStart && e.date <= latest.date,
  );
  let swing: (typeof earlier)[number] | null = null;
  for (const e of earlier) {
    if (
      !swing ||
      Math.abs(latest.weightKg - e.weightKg) >
        Math.abs(latest.weightKg - swing.weightKg)
    )
      swing = e;
  }
  if (!swing) return [];
  const change = latest.weightKg - swing.weightKg;
  if (Math.abs(change) < 2) return [];

  const symptoms = [
    latest.swelling === "YES" ? "swelling" : "",
    latest.sob === "YES" ? "short of breath" : "",
    latest.rapidGain === "YES" ? "rapid gain" : "",
    latest.dizziness === "YES" ? "dizzy" : "",
  ].filter(Boolean);
  const kg = Math.abs(change).toFixed(1);
  const lb = (Math.abs(change) * KG_TO_LB).toFixed(1);
  return [
    {
      id: `feed:weight:${latest.id}:${swing.id}`,
      mrn,
      receivedAt: middayIso(latest.date),
      kind: "Weight change",
      text:
        `Weight ${change > 0 ? "up" : "down"} ${kg} kg (${lb} lb) since ${shortDate(swing.date)}: ` +
        `${latest.weightKg} kg on ${shortDate(latest.date)}` +
        (symptoms.length > 0 ? `, ${symptoms.join(", ")}` : ""),
    },
  ];
}

/* ------------------------------------------------------------- appointments */

/** "14:30" → "2:30 PM". */
function clock(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  return `${h % 12 || 12}:${String(m ?? 0).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/**
 * Appointments the member kept in their own list that went wrong: one they
 * said they missed, or one two days gone with no answer to "did you go?".
 * Only the last 30 days — an old unanswered visit is history, not an alert.
 */
export function missedAppointmentAlerts(
  appointments: Appointment[],
  mrn: string,
  today: string,
): FeedItem[] {
  const since = daysBefore(today, 30);
  const silentBefore = daysBefore(today, 1);
  return appointments
    .filter((a) => a.date >= since && a.date < today)
    .flatMap((a) => {
      if (a.attendance === "attended") return [];
      const said = a.attendance === "missed";
      if (!said && a.date >= silentBefore) return [];
      return [
        {
          id: `feed:appt:${a.id}:${a.attendance ?? "silent"}`,
          mrn,
          receivedAt: middayIso(a.date),
          kind: "Missed appointment" as const,
          text: `${a.title} with ${a.doctor} on ${shortDate(a.date)}: ${
            said ? "patient says they missed it" : "not confirmed as attended"
          }`,
        },
      ];
    });
}

/**
 * The vascular access record: visits booked in the next two weeks (so
 * the care team can help the patient get there), visits whose day passed
 * without being marked done, and concerns the patient reported that
 * nobody has reviewed yet.
 */
export function accessAlerts(
  record: AccessRecord | null,
  mrn: string,
  today: string,
): FeedItem[] {
  if (!record) return [];
  const ahead = daysBefore(today, -14);
  const since = daysBefore(today, 30);

  const upcoming: FeedItem[] = record.appointments
    .filter((a) => !a.completed && a.date >= today && a.date <= ahead)
    .map((a) => ({
      id: `feed:access-appt:${a.id}:${a.date}`,
      mrn,
      /* The day it came within two weeks: when it became worth a look. */
      receivedAt: middayIso(daysBefore(a.date, 14)),
      kind: "Access appointment",
      text: `${a.title} on ${shortDate(a.date)} at ${clock(a.time)}, ${a.place}`,
    }));

  const missed: FeedItem[] = record.appointments
    .filter((a) => !a.completed && a.date < today && a.date >= since)
    .map((a) => ({
      id: `feed:access-missed:${a.id}:${a.date}`,
      mrn,
      receivedAt: middayIso(a.date),
      kind: "Missed appointment",
      text: `Access: ${a.title} on ${shortDate(a.date)} was not marked as done`,
    }));

  const concerns: FeedItem[] = record.concerns
    .filter((c) => c.status === "Open")
    .map((c) => ({
      id: `feed:access-concern:${c.id}`,
      mrn,
      receivedAt: c.reportedAt,
      kind: "Access concern",
      text: clip(
        `Reported ${c.kinds.join(", ").toLowerCase() || "a problem"}${c.detail ? `: ${c.detail}` : ""}`,
      ),
    }));

  return [...upcoming, ...missed, ...concerns];
}

/* --------------------------------------------------------------- check-ins */

/** Everything the member's app raises for the clinic, newest first. */
export function memberInbox(
  data: MemberData,
  now: number,
  today: string,
): FeedItem[] {
  const { mrn, name } = LINKED_MEMBER;
  return [
    ...messageAlerts(data.conversations, name, mrn),
    ...labAlerts(data.labResult, mrn, now),
    ...sideEffectAlerts(data.sideEffects, mrn, today),
    ...missedDoseAlerts(data.doses, mrn, today),
    ...bpAlerts(data.bloodPressure, mrn, today),
    ...bpSymptomAlerts(data.bloodPressure, mrn, today),
    ...weightAlerts(data.weights, mrn, today),
    ...missedAppointmentAlerts(data.appointments, mrn, today),
    ...accessAlerts(data.access, mrn, today),
  ].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

/** What the day said, in a line for the clinic's table. */
function checkInNote(entry: BetweenTreatmentCheckIn): string {
  const parts: string[] = [];
  if (entry.missedTreatment) parts.push("Missed a treatment.");
  if (entry.symptoms.length > 0)
    parts.push(`${entry.symptoms.join(", ")} (${entry.severity}).`);
  if (entry.notes.trim()) parts.push(entry.notes.trim());
  if (parts.length === 0)
    parts.push(
      entry.feeling === "good"
        ? "Feeling good. No concerns."
        : "No symptoms reported.",
    );
  return clip(parts.join(" "), 160);
}

/**
 * The member's check-ins from the last two weeks as clinic rows, newest
 * first. A day they sent to the clinic, or one that would earn a notice
 * (missed treatment, severe symptoms, a rough day), is At Risk. With no
 * check-in for seven days, a Missed row leads the list.
 */
export function memberCheckInRows(
  data: Pick<MemberData, "checkIns" | "notices">,
  program: string,
  today: string,
): CheckInRow[] {
  const name = LINKED_MEMBER.name;
  const since = daysBefore(today, 13);
  const sent = new Set(data.notices.map((n) => n.checkInDate));
  const recent = data.checkIns
    .filter((c) => c.date >= since && c.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date));

  const rows: CheckInRow[] = recent.map((entry) => ({
    name,
    program,
    date: shortDate(entry.date),
    status:
      sent.has(entry.date) || shouldSuggestNotice(entry)
        ? "At Risk"
        : "Completed",
    notes: checkInNote(entry),
  }));

  const latest = data.checkIns
    .map((c) => c.date)
    .filter((d) => d <= today)
    .sort()
    .pop();
  if (!latest || latest < daysBefore(today, 6)) {
    rows.unshift({
      name,
      program,
      date: shortDate(today),
      status: "Missed",
      notes: latest
        ? `No check-in since ${shortDate(latest)}.`
        : "No check-ins submitted yet.",
    });
  }
  return rows;
}
