import type {
  TimePreference,
  TimeChangeRequest,
  TravelDocumentKey,
  TravelPrepKey,
  TripPlacement,
  TripRequest,
  TripStatus,
  Weekday,
} from "./trip.types";

/* ==========================================================================
   Travel dialysis — pure rules
   ========================================================================== */

/** The ladder, in order. Index is how far along a request is. */
export const TRIP_STATUSES: {
  value: TripStatus;
  labelEn: string;
  labelEs: string;
  /** What it means for the member, in their words. */
  detailEn: string;
  detailEs: string;
}[] = [
  {
    value: "submitted",
    labelEn: "Submitted",
    labelEs: "Enviada",
    detailEn: "Your clinic has your request.",
    detailEs: "Tu clínica tiene tu solicitud.",
  },
  {
    value: "facility-reviewing",
    labelEn: "Facility Reviewing",
    labelEs: "En Revisión",
    detailEn: "Your clinic is looking at the dates.",
    detailEs: "Tu clínica está revisando las fechas.",
  },
  {
    value: "records-sent",
    labelEn: "Records Sent",
    labelEs: "Registros Enviados",
    detailEn: "Your records have gone to the centre where you are going.",
    detailEs: "Tus registros se enviaron al centro de destino.",
  },
  {
    value: "placement-pending",
    labelEn: "Placement Pending",
    labelEs: "Ubicación Pendiente",
    detailEn: "Waiting on a chair to be confirmed at the other end.",
    detailEs: "Esperando que confirmen un lugar allá.",
  },
  {
    value: "confirmed",
    labelEn: "Confirmed",
    labelEs: "Confirmada",
    detailEn: "Your treatments while away are booked.",
    detailEs: "Tus tratamientos durante el viaje están reservados.",
  },
  {
    value: "closed",
    labelEn: "Completed",
    labelEs: "Completada",
    detailEn: "This trip is done.",
    detailEs: "Este viaje ya terminó.",
  },
];

export function statusIndex(status: TripStatus): number {
  return TRIP_STATUSES.findIndex((entry) => entry.value === status);
}

export function statusLabel(status: TripStatus, isEs: boolean): string {
  const match = TRIP_STATUSES.find((entry) => entry.value === status);
  if (!match) return status;
  return isEs ? match.labelEs : match.labelEn;
}

export function statusDetail(status: TripStatus, isEs: boolean): string {
  const match = TRIP_STATUSES.find((entry) => entry.value === status);
  if (!match) return "";
  return isEs ? match.detailEs : match.detailEn;
}

/** Only a confirmed trip is booked. Everything earlier is still in progress. */
export function isConfirmed(trip: TripRequest): boolean {
  return trip.status === "confirmed";
}

export function isOpen(trip: TripRequest): boolean {
  return trip.status !== "closed";
}

export function todayIso(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function emptyTrip(now = new Date()): TripRequest {
  return {
    id: `trip-${Date.now().toString(36)}`,
    destination: "",
    departDate: todayIso(now),
    returnDate: todayIso(now),
    treatmentsNeeded: 3,
    preferredDays: [],
    preferredTime: "any",
    contactPhone: "",
    emergencyContact: { name: "", phone: "", relationship: "" },
    insurance: { plan: "", memberId: "" },
    documentsReady: [],
    prepDone: [],
    notes: "",
    status: "submitted",
    submittedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    facilityNote: "",
    statusHistory: [{ status: "submitted", at: now.toISOString() }],
  };
}

/**
 * What stops a request being sent.
 *
 * Deliberately strict about dates: a coordinator who receives a trip ending
 * before it starts has to phone the member to ask what they meant, and that
 * is a day lost on something the form could have caught.
 */
export function tripError(trip: TripRequest): string | null {
  if (trip.destination.trim().length === 0) return "destination";
  if (!trip.departDate || !trip.returnDate) return "dates";
  if (trip.returnDate < trip.departDate) return "order";
  if (trip.treatmentsNeeded < 1) return "treatments";
  if (trip.contactPhone.trim().length === 0) return "phone";
  return null;
}

export function canSubmit(trip: TripRequest): boolean {
  return tripError(trip) === null;
}

/** Newest request first. */
export function sortTrips(trips: TripRequest[]): TripRequest[] {
  return [...trips].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function addTrip(
  trips: TripRequest[],
  trip: TripRequest,
): TripRequest[] {
  return sortTrips([trip, ...trips]);
}

export function removeTrip(trips: TripRequest[], id: string): TripRequest[] {
  return trips.filter((trip) => trip.id !== id);
}

/** Facility-side update. Kept here so the status ladder has one owner. */
export function updateTripStatus(
  trips: TripRequest[],
  id: string,
  status: TripStatus,
  now = new Date(),
): TripRequest[] {
  const at = now.toISOString();
  return trips.map((trip) => {
    if (trip.id !== id) return trip;

    /* Re-saving the same status is not a new event: a coordinator opening
       and closing a request would otherwise stamp it again and again. */
    const alreadyThere = trip.statusHistory.some(
      (event) => event.status === status,
    );

    return {
      ...trip,
      status,
      updatedAt: at,
      statusHistory: alreadyThere
        ? trip.statusHistory
        : [...trip.statusHistory, { status, at }],
    };
  });
}

/** "Jun 3 – Jun 12, 2026" from two ISO dates. */
export function formatTripDates(trip: TripRequest, isEs: boolean): string {
  const locale = isEs ? "es-ES" : "en-US";
  const parse = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, (month ?? 1) - 1, day ?? 1);
  };

  const depart = parse(trip.departDate);
  const back = parse(trip.returnDate);
  if (Number.isNaN(depart.getTime()) || Number.isNaN(back.getTime())) {
    return `${trip.departDate} – ${trip.returnDate}`;
  }

  const short: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${depart.toLocaleDateString(locale, short)} – ${back.toLocaleDateString(
    locale,
    { ...short, year: "numeric" },
  )}`;
}

/** Whole days away, counting both ends. */
export function tripLengthDays(trip: TripRequest): number {
  const parse = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, (month ?? 1) - 1, day ?? 1).getTime();
  };
  const days =
    Math.round((parse(trip.returnDate) - parse(trip.departDate)) / 86400000) +
    1;
  return Math.max(1, days);
}

/* ==========================================================================
   Preferences, documents and contacts
   ========================================================================== */

export const WEEKDAYS: { value: Weekday; labelEn: string; labelEs: string }[] =
  [
    { value: "mon", labelEn: "Mon", labelEs: "Lun" },
    { value: "tue", labelEn: "Tue", labelEs: "Mar" },
    { value: "wed", labelEn: "Wed", labelEs: "Mié" },
    { value: "thu", labelEn: "Thu", labelEs: "Jue" },
    { value: "fri", labelEn: "Fri", labelEs: "Vie" },
    { value: "sat", labelEn: "Sat", labelEs: "Sáb" },
    { value: "sun", labelEn: "Sun", labelEs: "Dom" },
  ];

export const TIME_PREFERENCES: {
  value: TimePreference;
  labelEn: string;
  labelEs: string;
}[] = [
  { value: "any", labelEn: "Any time", labelEs: "Cualquier hora" },
  { value: "morning", labelEn: "Morning", labelEs: "Mañana" },
  { value: "midday", labelEn: "Midday", labelEs: "Mediodía" },
  { value: "afternoon", labelEn: "Afternoon", labelEs: "Tarde" },
  { value: "evening", labelEn: "Evening", labelEs: "Noche" },
];

/** What a receiving unit asks for, in the order it is usually asked for. */
export const TRAVEL_DOCUMENTS: {
  key: TravelDocumentKey;
  labelEn: string;
  labelEs: string;
  hintEn: string;
  hintEs: string;
}[] = [
  {
    key: "treatment-orders",
    labelEn: "Dialysis treatment orders",
    labelEs: "Órdenes de tratamiento",
    hintEn: "Your current prescription. Your unit usually sends this for you.",
    hintEs: "Tu prescripción actual. Tu unidad suele enviarla por ti.",
  },
  {
    key: "recent-labs",
    labelEn: "Recent lab results",
    labelEs: "Resultados de laboratorio recientes",
    hintEn: "Usually the last month's panel.",
    hintEs: "Normalmente el panel del último mes.",
  },
  {
    key: "medication-list",
    labelEn: "Medication list",
    labelEs: "Lista de medicamentos",
    hintEn: "Names and doses. Take a copy in your hand luggage.",
    hintEs: "Nombres y dosis. Lleva una copia en el equipaje de mano.",
  },
  {
    key: "insurance",
    labelEn: "Insurance information",
    labelEs: "Información del seguro",
    hintEn: "Plan and member number.",
    hintEs: "Plan y número de miembro.",
  },
  {
    key: "emergency-contact",
    labelEn: "Emergency contact",
    labelEs: "Contacto de emergencia",
    hintEn: "Someone the receiving unit can reach.",
    hintEs: "Alguien a quien la unidad pueda llamar.",
  },
  {
    key: "other",
    labelEn: "Anything else your unit asked for",
    labelEs: "Cualquier otra cosa que pidió tu unidad",
    hintEn: "Photo ID, referral letter, travel insurance.",
    hintEs: "Identificación, carta de referencia, seguro de viaje.",
  },
];

export function toggleDocument(
  ready: TravelDocumentKey[],
  key: TravelDocumentKey,
): TravelDocumentKey[] {
  return ready.includes(key)
    ? ready.filter((entry) => entry !== key)
    : [...ready, key];
}

export const TRAVEL_PREP: {
  key: TravelPrepKey;
  labelEn: string;
  labelEs: string;
  hintEn: string;
  hintEs: string;
}[] = [
  {
    key: "transportation",
    labelEn: "Transportation arranged",
    labelEs: "Transporte organizado",
    hintEn: "How you will get to the unit at the other end, each day.",
    hintEs: "Cómo llegarás a la unidad allá, cada día.",
  },
  {
    key: "personal-items",
    labelEn: "Personal items packed",
    labelEs: "Artículos personales empacados",
    hintEn: "ID, insurance card, medications, supplies.",
    hintEs: "Identificación, tarjeta del seguro, medicamentos, suministros.",
  },
];

export function togglePrep(
  done: TravelPrepKey[],
  key: TravelPrepKey,
): TravelPrepKey[] {
  return done.includes(key)
    ? done.filter((entry) => entry !== key)
    : [...done, key];
}

export function toggleDay(days: Weekday[], day: Weekday): Weekday[] {
  return days.includes(day)
    ? days.filter((entry) => entry !== day)
    : [...days, day];
}

/** Days in week order however they were tapped. */
export function sortDays(days: Weekday[]): Weekday[] {
  return WEEKDAYS.filter((entry) => days.includes(entry.value)).map(
    (entry) => entry.value,
  );
}

export function formatDays(days: Weekday[], isEs: boolean): string {
  if (days.length === 0) return isEs ? "Sin preferencia" : "No preference";
  return sortDays(days)
    .map((day) => {
      const match = WEEKDAYS.find((entry) => entry.value === day);
      return isEs ? match?.labelEs : match?.labelEn;
    })
    .join(" · ");
}

export function timePreferenceLabel(
  value: TimePreference,
  isEs: boolean,
): string {
  const match = TIME_PREFERENCES.find((entry) => entry.value === value);
  if (!match) return value;
  return isEs ? match.labelEs : match.labelEn;
}

/** How much of the paperwork is ready, for the progress line on the card. */
export function documentsProgress(trip: TripRequest): {
  ready: number;
  total: number;
  complete: boolean;
} {
  const total = TRAVEL_DOCUMENTS.length;
  const ready = trip.documentsReady.length;
  return { ready, total, complete: ready === total };
}

/* ==========================================================================
   The status timeline
   --------------------------------------------------------------------------
   The ladder has six rungs because a coordinator needs that much detail:
   "records sent" and "placement pending" are different problems with
   different people to chase.

   A member does not have those people to chase. To them there are four
   moments — they asked, somebody is working on it, it is booked, it is
   over — and showing six makes the middle of the trip look like four
   separate things going wrong instead of one thing taking a while.

   So the timeline folds the three middle rungs into one. Nothing is hidden:
   the detail line under "In Progress" still names the rung it is actually
   on.
   ========================================================================== */

export type MilestoneState = "done" | "current" | "todo";

export interface TripMilestone {
  id: "submitted" | "in-progress" | "confirmation" | "completed";
  labelEn: string;
  labelEs: string;
  detailEn: string;
  detailEs: string;
  state: MilestoneState;
  /** When it happened, if we know. Absent rather than guessed. */
  at?: string;
}

/** Which ladder rungs roll up into which milestone. */
const MILESTONE_RUNGS: Record<TripMilestone["id"], TripStatus[]> = {
  submitted: ["submitted"],
  "in-progress": ["facility-reviewing", "records-sent", "placement-pending"],
  confirmation: ["confirmed"],
  completed: ["closed"],
};

const MILESTONE_COPY: Omit<TripMilestone, "state" | "at">[] = [
  {
    id: "submitted",
    labelEn: "Request Submitted",
    labelEs: "Solicitud Enviada",
    detailEn: "Your travel request has been sent to your dialysis facility.",
    detailEs: "Tu solicitud de viaje se envió a tu centro de diálisis.",
  },
  {
    id: "in-progress",
    labelEn: "In Progress",
    labelEs: "En Proceso",
    detailEn: "Your facility is coordinating your travel treatment.",
    detailEs: "Tu centro está coordinando tu tratamiento de viaje.",
  },
  {
    id: "confirmation",
    labelEn: "Confirmation Sent",
    labelEs: "Confirmación Enviada",
    detailEn: "Your treatment details are confirmed.",
    detailEs: "Los detalles de tu tratamiento están confirmados.",
  },
  {
    id: "completed",
    labelEn: "Completed",
    labelEs: "Completado",
    detailEn: "Your travel has been completed.",
    detailEs: "Tu viaje se ha completado.",
  },
];

export function tripMilestones(trip: TripRequest): TripMilestone[] {
  const reached = statusIndex(trip.status);

  return MILESTONE_COPY.map((copy) => {
    const rungs = MILESTONE_RUNGS[copy.id];
    const positions = rungs.map(statusIndex);
    const first = Math.min(...positions);
    const last = Math.max(...positions);

    const state: MilestoneState =
      reached > last ? "done" : reached >= first ? "current" : "todo";

    /* The earliest event belonging to this milestone. For "In Progress"
       that is when the facility first picked it up, which is the date a
       member means when they ask how long it has been sitting. */
    const at = trip.statusHistory
      .filter((event) => rungs.includes(event.status))
      .map((event) => event.at)
      .sort()[0];

    return { ...copy, state, ...(at ? { at } : {}) };
  });
}

/** "Sep 12, 2026 · 10:24 AM" — a timeline needs the time, not just the day. */
export function formatEventTime(iso: string, isEs: boolean): string {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "";

  return when.toLocaleString(isEs ? "es-ES" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ==========================================================================
   The travel checklist
   --------------------------------------------------------------------------
   One list of everything that has to be true before a member gets on a
   plane, drawn from the three places that already know the answer rather
   than from a fourth copy of it.
   ========================================================================== */

export type ChecklistItemKind = "facility" | "document" | "prep";

export interface ChecklistItem {
  id: string;
  kind: ChecklistItemKind;
  labelEn: string;
  labelEs: string;
  /** What this actually is, and who usually does it. */
  hintEn?: string;
  hintEs?: string;
  done: boolean;
  /**
   * Whether the member can tick it themselves.
   *
   * The facility row cannot be: a chair at the other end is arranged by the
   * coordinating unit, and a checkbox that let a member mark their own
   * placement done would be the app lying to them about having a bed.
   */
  memberControlled: boolean;
}

/**
 * The paperwork rows, in checklist wording.
 *
 * Every document key is here, including `other`. An earlier version listed
 * five of the six and left a second panel to tick the rest — which read the
 * same `documentsReady` array, so five rows existed twice on one screen with
 * different wording and ticking either moved both.
 *
 * Hints are not repeated here: they are read from `TRAVEL_DOCUMENTS` by key,
 * so what a document is gets described in exactly one place.
 */
const CHECKLIST_DOCUMENTS: {
  key: TravelDocumentKey;
  labelEn: string;
  labelEs: string;
}[] = [
  {
    key: "treatment-orders",
    labelEn: "Dialysis orders/records sent",
    labelEs: "Órdenes y expediente enviados",
  },
  {
    key: "recent-labs",
    labelEn: "Recent labs sent (Hep B, PPD/TB, HIV)",
    labelEs: "Laboratorios recientes enviados (Hep B, PPD/TB, VIH)",
  },
  {
    key: "medication-list",
    labelEn: "Medication list packed",
    labelEs: "Lista de medicamentos empacada",
  },
  {
    key: "insurance",
    labelEn: "Insurance/authorization confirmed",
    labelEs: "Seguro y autorización confirmados",
  },
  {
    key: "emergency-contact",
    labelEn: "Emergency contact saved",
    labelEs: "Contacto de emergencia guardado",
  },
  {
    key: "other",
    labelEn: "Anything else your unit asked for",
    labelEs: "Cualquier otra cosa que pidió tu unidad",
  },
];

const documentHint = (key: TravelDocumentKey) =>
  TRAVEL_DOCUMENTS.find((entry) => entry.key === key);

export function travelChecklist(trip: TripRequest): ChecklistItem[] {
  return [
    {
      id: "facility",
      kind: "facility",
      labelEn: "Temporary dialysis facility arranged",
      labelEs: "Centro de diálisis temporal organizado",
      /* Read straight off the placement: this is done when the facility has
         actually booked a chair, and at no earlier moment. */
      done: Boolean(trip.placement?.treatments.length),
      memberControlled: false,
    },
    ...CHECKLIST_DOCUMENTS.map((entry) => ({
      id: entry.key,
      kind: "document" as const,
      labelEn: entry.labelEn,
      labelEs: entry.labelEs,
      hintEn: documentHint(entry.key)?.hintEn,
      hintEs: documentHint(entry.key)?.hintEs,
      done: trip.documentsReady.includes(entry.key),
      memberControlled: true,
    })),
    ...TRAVEL_PREP.map((entry) => ({
      id: entry.key,
      kind: "prep" as const,
      labelEn: entry.labelEn,
      labelEs: entry.labelEs,
      hintEn: entry.hintEn,
      hintEs: entry.hintEs,
      done: trip.prepDone.includes(entry.key),
      memberControlled: true,
    })),
  ];
}

export function checklistProgress(trip: TripRequest): {
  done: number;
  total: number;
  complete: boolean;
} {
  const items = travelChecklist(trip);
  const done = items.filter((item) => item.done).length;
  return { done, total: items.length, complete: done === items.length };
}

/* ==========================================================================
   Upcoming and past
   --------------------------------------------------------------------------
   A trip is past once the member is home, or once the facility closes it.
   Splitting on the return date rather than the status means a trip that
   nobody closed still drops out of "upcoming" when it is over, instead of
   sitting at the top of the screen for months.
   ========================================================================== */

export function isPastTrip(trip: TripRequest, today = todayIso()): boolean {
  return trip.status === "closed" || trip.returnDate < today;
}

export function upcomingTrips(
  trips: TripRequest[],
  today = todayIso(),
): TripRequest[] {
  return sortTrips(trips.filter((trip) => !isPastTrip(trip, today)));
}

export function pastTrips(
  trips: TripRequest[],
  today = todayIso(),
): TripRequest[] {
  return sortTrips(trips.filter((trip) => isPastTrip(trip, today)));
}

/** Days until departure. Negative once they have gone. */
export function daysUntilDeparture(
  trip: TripRequest,
  today = todayIso(),
): number {
  const parse = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, (month ?? 1) - 1, day ?? 1).getTime();
  };
  return Math.round((parse(trip.departDate) - parse(today)) / 86400000);
}

/* ==========================================================================
   The facility side
   --------------------------------------------------------------------------
   Everything below writes what the receiving unit has arranged. None of it
   is reachable from a member screen.
   ========================================================================== */

export function emptyPlacement(): TripPlacement {
  return { facilityName: "", address: "", phone: "", treatments: [] };
}

export function setPlacement(
  trips: TripRequest[],
  id: string,
  placement: TripPlacement,
  now = new Date(),
): TripRequest[] {
  return trips.map((trip) =>
    trip.id === id
      ? { ...trip, placement, updatedAt: now.toISOString() }
      : trip,
  );
}

export function setFacilityNote(
  trips: TripRequest[],
  id: string,
  facilityNote: string,
  now = new Date(),
): TripRequest[] {
  return trips.map((trip) =>
    trip.id === id
      ? { ...trip, facilityNote, updatedAt: now.toISOString() }
      : trip,
  );
}

export function addConfirmedTreatment(
  placement: TripPlacement,
  date: string,
  time: string,
): TripPlacement {
  return {
    ...placement,
    treatments: [
      ...placement.treatments,
      /* A random suffix as well as the clock: two treatments added in the
         same millisecond would otherwise share an id, and removing one
         would silently remove both. */
      {
        id: `ct-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        date,
        time,
      },
    ].sort(
      (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
    ),
  };
}

export function removeConfirmedTreatment(
  placement: TripPlacement,
  id: string,
): TripPlacement {
  return {
    ...placement,
    treatments: placement.treatments.filter((entry) => entry.id !== id),
  };
}

/**
 * What stops a facility marking a trip confirmed.
 *
 * A confirmation with no unit name and no times is not a confirmation, and a
 * member reading "Confirmed" would stop chasing it.
 */
export function confirmationError(trip: TripRequest): string | null {
  if (!trip.placement) return "no-placement";
  if (trip.placement.facilityName.trim().length === 0) return "no-facility";
  if (trip.placement.treatments.length === 0) return "no-treatments";
  return null;
}

export function canConfirm(trip: TripRequest): boolean {
  return confirmationError(trip) === null;
}

/** Treatments booked against treatments asked for. */
export function placementShortfall(trip: TripRequest): number {
  return Math.max(
    0,
    trip.treatmentsNeeded - (trip.placement?.treatments.length ?? 0),
  );
}

/* ==========================================================================
   Reading older records
   --------------------------------------------------------------------------
   Storage holds whatever shape the app wrote last time, and a trip saved
   before preferences, contacts and the document checklist existed has none of
   those fields. Reading `preferredDays.length` off one of those throws, and
   the whole screen goes with it.

   So every trip is normalised on the way out of storage rather than guarded
   at each of the dozen places that read it. New optional fields get their
   empty value; nothing that was already there is touched.
   ========================================================================== */

export function normaliseTrip(trip: Partial<TripRequest>): TripRequest {
  const blank = emptyTrip();

  return {
    ...blank,
    ...trip,
    /* Spreading is not enough for these: an older record carries the key as
       `undefined`, which overwrites the default rather than falling back to
       it. */
    preferredDays: trip.preferredDays ?? [],
    preferredTime: trip.preferredTime ?? "any",
    documentsReady: trip.documentsReady ?? [],
    prepDone: trip.prepDone ?? [],
    emergencyContact: trip.emergencyContact ?? {
      name: "",
      phone: "",
      relationship: "",
    },
    insurance: trip.insurance ?? { plan: "", memberId: "" },
    facilityNote: trip.facilityNote ?? "",
    /* An older record has no history. Seed it from the two timestamps it
       does have rather than leaving the timeline blank: `submittedAt` is
       exactly when the first rung happened, and `updatedAt` is when the rung
       it is on now happened. The rungs in between are genuinely unknown, and
       the timeline shows them without a date rather than inventing one. */
    statusHistory:
      trip.statusHistory ??
      (trip.submittedAt
        ? [
            { status: "submitted" as const, at: trip.submittedAt },
            ...(trip.status && trip.status !== "submitted" && trip.updatedAt
              ? [{ status: trip.status, at: trip.updatedAt }]
              : []),
          ]
        : []),
    /* An older record may carry the flattened placement fields this replaced. */
    placement: trip.placement
      ? {
          facilityName: trip.placement.facilityName ?? "",
          address: trip.placement.address ?? "",
          phone: trip.placement.phone ?? "",
          treatments: trip.placement.treatments ?? [],
        }
      : undefined,
    id: trip.id ?? blank.id,
  };
}

export function normaliseTrips(trips: Partial<TripRequest>[]): TripRequest[] {
  return trips.map(normaliseTrip);
}

/* ==========================================================================
   Where a trip is in its life
   --------------------------------------------------------------------------
   Three phases, and they are not the same as the status. The status is what
   the facility has done; the phase is where the member physically is. A trip
   can be "Placement Pending" while the member is already away, and that is
   exactly the case worth showing loudly.
   ========================================================================== */

export type TripPhase = "planned" | "away" | "home";

export function tripPhase(trip: TripRequest, today = todayIso()): TripPhase {
  if (trip.status === "closed" || today > trip.returnDate) return "home";
  if (today >= trip.departDate) return "away";
  return "planned";
}

/* ==========================================================================
   Asking to move the booked times
   --------------------------------------------------------------------------
   `isEditable` closes the form the moment a placement is confirmed, and that
   is right: the chair is held by a unit that has never heard of this app.
   But "you cannot change this" is not the same as "you must live with it",
   and the gap between those two was a phone call the member had to work out
   for themselves.

   A time-change request is the same shape as the original request — the
   member asks, the facility answers — so it goes back down the same channel
   rather than becoming a second kind of thing.
   ========================================================================== */

/**
 * Whether asking makes sense yet.
 *
 * Only once there is something booked to move. Before that the request
 * itself is still editable, and two ways to change the same unconfirmed
 * times would be one too many.
 */
export function canRequestTimeChange(trip: TripRequest): boolean {
  return (
    Boolean(trip.placement?.treatments.length) &&
    tripPhase(trip) !== "home" &&
    trip.status !== "closed"
  );
}

/** Raised and not yet answered. */
export function hasOpenTimeChange(trip: TripRequest): boolean {
  return Boolean(trip.timeChange && !trip.timeChange.resolvedAt);
}

export function emptyTimeChange(
  trip: TripRequest,
  now = new Date(),
): TimeChangeRequest {
  return {
    requestedAt: now.toISOString(),
    /* Seeded from what they asked for last time rather than blank: most
       people want the same thing they wanted before, said again. */
    preferredTime: trip.preferredTime,
    preferredDays: trip.preferredDays,
    note: "",
  };
}

/**
 * A note is required.
 *
 * A coordinator receiving "please move my times" with no reason has to ring
 * the member to find out what they actually need, which is the phone call
 * this whole feature exists to save.
 */
export function timeChangeError(request: TimeChangeRequest): string | null {
  if (!request.note.trim()) return "note-required";
  return null;
}

export function canSubmitTimeChange(request: TimeChangeRequest): boolean {
  return timeChangeError(request) === null;
}

export function requestTimeChange(
  trips: TripRequest[],
  id: string,
  request: TimeChangeRequest,
  now = new Date(),
): TripRequest[] {
  return trips.map((trip) =>
    trip.id === id
      ? {
          ...trip,
          timeChange: { ...request, resolvedAt: undefined },
          updatedAt: now.toISOString(),
        }
      : trip,
  );
}

/** The member changing their mind before the facility has acted. */
export function withdrawTimeChange(
  trips: TripRequest[],
  id: string,
  now = new Date(),
): TripRequest[] {
  return trips.map((trip) => {
    /* A request the facility has already answered stays on the record: it
       explains why the booked times are what they are. */
    if (trip.id !== id || !hasOpenTimeChange(trip)) return trip;
    return { ...trip, timeChange: undefined, updatedAt: now.toISOString() };
  });
}

/** Facility side: answering it, whether or not the times actually moved. */
export function resolveTimeChange(
  trips: TripRequest[],
  id: string,
  facilityReply: string,
  now = new Date(),
): TripRequest[] {
  return trips.map((trip) =>
    trip.id === id && trip.timeChange
      ? {
          ...trip,
          timeChange: {
            ...trip.timeChange,
            resolvedAt: now.toISOString(),
            facilityReply,
          },
          updatedAt: now.toISOString(),
        }
      : trip,
  );
}

/* ==========================================================================
   Filtering the trip list
   --------------------------------------------------------------------------
   The same three phases the cards already use, turned into tabs.

   `all` exists because the other three can each be empty, and a tab strip
   where every tab shows "nothing here" gives a member no way to tell an
   empty filter from an empty log.
   ========================================================================== */

export type TripFilter = "all" | "in-progress" | "previous";

/**
 * Which trips each filter shows.
 *
 * Three, not the four phases the cards use. "Planned" and "away" are one
 * thing to a member choosing from a list — a trip still going on — and
 * splitting them made them pick between two words for the same answer.
 */
export function filterTrips(
  trips: TripRequest[],
  filter: TripFilter,
  today = todayIso(),
): TripRequest[] {
  const sorted = sortTrips(trips);
  if (filter === "all") return sorted;

  return sorted.filter((trip) => {
    const finished = tripPhase(trip, today) === "home";
    return filter === "previous" ? finished : !finished;
  });
}

/** How many sit behind each option, so the count can sit on the label. */
export function tripFilterCounts(
  trips: TripRequest[],
  today = todayIso(),
): Record<TripFilter, number> {
  return {
    all: trips.length,
    "in-progress": filterTrips(trips, "in-progress", today).length,
    previous: filterTrips(trips, "previous", today).length,
  };
}

/**
 * Which option to open on.
 *
 * A live trip is what somebody came here for. Falling back to "all" rather
 * than an empty "in progress" matters: a member with three finished trips
 * would otherwise open on a blank list and read it as data loss.
 */
export function defaultTripFilter(
  trips: TripRequest[],
  today = todayIso(),
): TripFilter {
  return tripFilterCounts(trips, today)["in-progress"] > 0
    ? "in-progress"
    : "all";
}

/**
 * A member can change a request until the facility has confirmed it.
 *
 * After that, editing would quietly desync what they think is booked from
 * what the receiving unit actually holds — so the answer becomes a phone
 * call, not a form.
 */
export function isEditable(trip: TripRequest, today = todayIso()): boolean {
  return trip.status !== "confirmed" && tripPhase(trip, today) === "planned";
}

/**
 * Units generally want four weeks. Under two is the point at which a member
 * should be chasing rather than waiting, so that is when this speaks up.
 */
export const LEAD_TIME_DAYS = 14;

export function needsChasing(trip: TripRequest, today = todayIso()): boolean {
  if (trip.status === "confirmed" || trip.status === "closed") return false;
  const days = daysUntilDeparture(trip, today);
  return days >= 0 && days < LEAD_TIME_DAYS;
}

/** How far along the status ladder, 0-100, for the progress strip. */
export function progressPercent(trip: TripRequest): number {
  const index = statusIndex(trip.status);
  if (index < 0) return 0;
  return Math.round((index / (TRIP_STATUSES.length - 1)) * 100);
}

/** "Mon, Oct 5" — one confirmed treatment, as a member reads it. */
export function formatDateLabel(iso: string, isEs: boolean): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(isEs ? "es-ES" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
