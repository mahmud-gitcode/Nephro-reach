/* ==========================================================================
   The member's appointments
   --------------------------------------------------------------------------
   Stored (member-owned, lib/data/storage), so an appointment added today is
   still there tomorrow, and the "Next appointment" card is simply the
   soonest one ahead rather than a fixed date.

   Visits the access center books on the member's Vascular Access record
   are copied in too (client, 2026-10-05), marked with their source: they
   get the same reminders and "did you go?" question, follow the access
   center's changes, and are not deleted here.
   ========================================================================== */

export type Appointment = {
  id: string;
  /** yyyy-mm-dd */
  date: string;
  /** HH:MM, 24-hour */
  start: string;
  /** HH:MM, or "" when open-ended. */
  end: string;
  title: string;
  doctor: string;
  location: string;
  /** Street address, for directions. */
  address: string;
  notes: string;
  /** The member's answer once the day has passed. Unset until they say;
   *  the clinic's CCM dashboard hears about "missed" and about silence. */
  attendance?: Attendance;
  /** Set when the appointment came from another record, not the member. */
  source?: "vascular-access";
  /** How long before to be reminded (client, 2026-10-05). */
  reminder?: ReminderLead;
};

export const REMINDER_LEADS = [
  { value: "none", minutes: 0, en: "No reminder", es: "Sin recordatorio" },
  {
    value: "15m",
    minutes: 15,
    en: "15 minutes before",
    es: "15 minutos antes",
  },
  { value: "1h", minutes: 60, en: "1 hour before", es: "1 hora antes" },
  { value: "1d", minutes: 1440, en: "1 day before", es: "1 día antes" },
] as const;
export type ReminderLead = (typeof REMINDER_LEADS)[number]["value"];

function leadMinutes(lead: ReminderLead | undefined): number {
  return REMINDER_LEADS.find((l) => l.value === lead)?.minutes ?? 0;
}

/** The appointment's start as a local Date. */
export function startsAt(a: Pick<Appointment, "date" | "start">): Date {
  const [y, m, d] = a.date.split("-").map(Number);
  const [h, min] = (a.start || "09:00").split(":").map(Number);
  return new Date(y, m - 1, d, h, min);
}

/** Appointments whose reminder has come and that have not started. */
export function remindersDue(list: Appointment[], now: number): Appointment[] {
  return list
    .filter((a) => {
      const lead = leadMinutes(a.reminder);
      if (!lead) return false;
      const start = startsAt(a).getTime();
      return now >= start - lead * 60_000 && now < start;
    })
    .sort((a, b) => startsAt(a).getTime() - startsAt(b).getTime());
}

function icsStamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function icsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/([,;])/g, "\\$1")
    .replace(/\n/g, "\\n");
}

/**
 * A calendar file for one appointment, with its reminder as an alarm. The
 * phone's own calendar then reminds the member, app open or not.
 */
export function icsFor(a: Appointment, now: number): string {
  const start = startsAt(a);
  const end = a.end
    ? startsAt({ date: a.date, start: a.end })
    : new Date(start.getTime() + 60 * 60_000);
  const lead = leadMinutes(a.reminder);
  const where = [a.location, a.address].filter(Boolean).join(", ");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NephroReach//Appointments//EN",
    "BEGIN:VEVENT",
    `UID:${a.id}@nephroreach`,
    `DTSTAMP:${icsStamp(new Date(now))}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsText(a.title)}`,
    ...(where ? [`LOCATION:${icsText(where)}`] : []),
    ...(a.doctor ? [`DESCRIPTION:${icsText(`With ${a.doctor}`)}`] : []),
    ...(lead
      ? [
          "BEGIN:VALARM",
          "ACTION:DISPLAY",
          `DESCRIPTION:${icsText(a.title)}`,
          `TRIGGER:-PT${lead}M`,
          "END:VALARM",
        ]
      : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export type Attendance = "attended" | "missed";

export type AppointmentDraft = Omit<
  Appointment,
  "id" | "attendance" | "source"
>;

/**
 * Brings in appointments kept elsewhere: adds new ones, follows changes to
 * the date, time, title or place, and keeps the member's attendance answer.
 * Returns the same list when nothing changed, so a caller can skip a write.
 */
export function syncExternal(
  list: Appointment[],
  external: Appointment[],
): Appointment[] {
  let changed = false;
  const next = list.map((appointment) => {
    const fresh = external.find((e) => e.id === appointment.id);
    if (!fresh) return appointment;
    const same =
      fresh.date === appointment.date &&
      fresh.start === appointment.start &&
      fresh.title === appointment.title &&
      fresh.location === appointment.location &&
      fresh.doctor === appointment.doctor;
    if (same) return appointment;
    changed = true;
    return { ...fresh, attendance: appointment.attendance };
  });
  for (const fresh of external) {
    if (!list.some((a) => a.id === fresh.id)) {
      next.push(fresh);
      changed = true;
    }
  }
  return changed ? next : list;
}

export type AppointmentError = "title" | "doctor" | "date" | "start" | "end";

export function appointmentError(
  draft: AppointmentDraft,
): AppointmentError | null {
  if (!draft.title.trim()) return "title";
  if (!draft.doctor.trim()) return "doctor";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return "date";
  if (!/^\d{2}:\d{2}$/.test(draft.start)) return "start";
  if (draft.end && draft.end <= draft.start) return "end";
  return null;
}

const key = (a: Appointment) => `${a.date}${a.start}`;

/** Still to come (today included), soonest first. */
export function upcoming(list: Appointment[], today: string): Appointment[] {
  return list
    .filter((a) => a.date >= today)
    .sort((a, b) => key(a).localeCompare(key(b)));
}

/** Already happened, most recent first. */
export function past(list: Appointment[], today: string): Appointment[] {
  return list
    .filter((a) => a.date < today)
    .sort((a, b) => key(b).localeCompare(key(a)));
}

export function addAppointment(
  list: Appointment[],
  draft: AppointmentDraft,
  now: number,
): Appointment[] {
  return [
    ...list,
    {
      ...draft,
      id: `appt-${now}`,
      title: draft.title.trim(),
      doctor: draft.doctor.trim(),
      location: draft.location.trim(),
      address: draft.address.trim(),
      notes: draft.notes.trim(),
    },
  ];
}

/**
 * Changes an appointment the member added — a new time, a new day (client,
 * 2026-10-10). A visit moved to another day or time has not happened yet,
 * so any "did you go?" answer for the old slot is cleared.
 */
export function updateAppointment(
  list: Appointment[],
  id: string,
  draft: AppointmentDraft,
): Appointment[] {
  return list.map((a) => {
    if (a.id !== id || a.source) return a;
    const moved = a.date !== draft.date || a.start !== draft.start;
    const next: Appointment = {
      ...a,
      ...draft,
      title: draft.title.trim(),
      doctor: draft.doctor.trim(),
      location: draft.location.trim(),
      address: draft.address.trim(),
      notes: draft.notes.trim(),
    };
    if (moved) delete next.attendance;
    return next;
  });
}

/** The editable part of an appointment, to fill the form with. */
export function draftOf(a: Appointment): AppointmentDraft {
  return {
    date: a.date,
    start: a.start,
    end: a.end,
    title: a.title,
    doctor: a.doctor,
    location: a.location,
    address: a.address,
    notes: a.notes,
    reminder: a.reminder,
  };
}

export function setAttendance(
  list: Appointment[],
  id: string,
  attendance: Attendance,
): Appointment[] {
  return list.map((a) => (a.id === id ? { ...a, attendance } : a));
}

/** Past appointments from the last 30 days the member has not answered
 *  "did you go?" for, most recent first. */
export function awaitingAnswer(
  list: Appointment[],
  today: string,
): Appointment[] {
  const [y, m, d] = today.split("-").map(Number);
  const since = new Date(y, m - 1, d - 30);
  const sinceIso = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, "0")}-${String(since.getDate()).padStart(2, "0")}`;
  return past(list, today).filter((a) => !a.attendance && a.date >= sinceIso);
}

export function removeAppointment(
  list: Appointment[],
  id: string,
): Appointment[] {
  return list.filter((a) => a.id !== id);
}

/** "14:30" → "2:30 PM". */
export function clock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export function timeRange(a: Pick<Appointment, "start" | "end">): string {
  return a.end ? `${clock(a.start)} – ${clock(a.end)}` : clock(a.start);
}

export function directionsUrl(
  a: Pick<Appointment, "location" | "address">,
): string {
  const query = [a.location, a.address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** The demo patient's sample appointments, dated from today so they stay
 *  ahead whenever the demo is opened. */
export function seedAppointments(now: number): Appointment[] {
  const at = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const base = {
    title: "Nephrology",
    doctor: "Dr. Melissa Carter",
    location: "Riverside Dialysis Center",
    address: "123 Kidney Care Way, Columbia, SC 29201",
    notes: "",
  };
  return [
    { ...base, id: "seed-appt-1", date: at(3), start: "10:30", end: "11:15" },
    { ...base, id: "seed-appt-2", date: at(10), start: "10:30", end: "11:15" },
    {
      ...base,
      id: "seed-appt-3",
      date: at(17),
      start: "09:00",
      end: "09:45",
      title: "Dietitian Visit",
      doctor: "Rachel Adams, RD",
    },
    {
      ...base,
      id: "seed-appt-4",
      date: at(-14),
      start: "10:30",
      end: "11:15",
      attendance: "attended",
    },
  ];
}
