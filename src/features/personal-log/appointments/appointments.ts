/* ==========================================================================
   The member's appointments
   --------------------------------------------------------------------------
   Stored (member-owned, lib/data/storage), so an appointment added today is
   still there tomorrow, and the "Next appointment" card is simply the
   soonest one ahead rather than a fixed date.
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
};

export type AppointmentDraft = Omit<Appointment, "id">;

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
    { ...base, id: "seed-appt-4", date: at(-14), start: "10:30", end: "11:15" },
  ];
}
