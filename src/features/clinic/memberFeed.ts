/* ==========================================================================
   Member feed — what a patient's own app sends to the clinic
   --------------------------------------------------------------------------
   The clinic's CCM Inbox and Patient Check-Ins used to be demo lists typed
   into the code. This file derives them from what the member actually
   records instead:

     Patient message    their latest message to the care team, while it
                        waits for a reply
     Lab alert          a lab value they entered that is outside the range
     Side effect        a medication side effect they logged
     Missed doses       two or more doses marked missed in a week
     Check-in alert     a check-in day they chose to send to the clinic
     Check-ins          their between-treatment check-ins, At Risk when the
                        day earns a notice, Missed after a week of silence

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
import type { Conversation } from "@/features/messaging/messaging.types";
import { shouldSuggestNotice } from "@/features/personal-log/check-in/clinicNotice.rules";
import type {
  ClinicNotice,
  ClinicNoticeReason,
} from "@/features/personal-log/check-in/clinicNotice.types";
import type { BetweenTreatmentCheckIn } from "@/features/personal-log/check-in/checkIn.types";
import type { CheckInRow } from "./checkIns.data";

/** The patient whose app feeds the clinic in the demo. MRN and program as
 *  in the messaging seed's chart for the same person. */
export const LINKED_MEMBER = {
  name: DEMO_MEMBER,
  mrn: "100245",
  program: "CKD Education",
} as const;

export type FeedKind =
  | "Patient message"
  | "Lab alert"
  | "Side effect"
  | "Missed doses"
  | "Check-in alert";

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

/* --------------------------------------------------------------- check-ins */

const REASON_LABEL: Record<ClinicNoticeReason, string> = {
  "missed-treatment": "missed a treatment",
  "severe-symptoms": "severe symptoms",
  "rough-day": "a rough day",
  "member-requested": "asked the clinic to look",
};

/** A check-in day the member sent to the clinic, once it has been sent. */
export function noticeAlerts(
  notices: ClinicNotice[],
  mrn: string,
  today: string,
): FeedItem[] {
  return notices
    .filter((n) => n.deliverOn <= today)
    .map((n) => ({
      id: `feed:notice:${n.checkInDate}`,
      mrn,
      receivedAt: n.raisedAt,
      kind: "Check-in alert" as const,
      text: `Check-in for ${shortDate(n.checkInDate)}: ${n.reasons.map((r) => REASON_LABEL[r]).join(", ")}`,
    }));
}

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
    ...noticeAlerts(data.notices, mrn, today),
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
