import type {
  TimePreference,
  TravelDocumentKey,
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
    notes: "",
    status: "submitted",
    submittedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    facilityNote: "",
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
  return trips.map((trip) =>
    trip.id === id ? { ...trip, status, updatedAt: now.toISOString() } : trip,
  );
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
    emergencyContact: trip.emergencyContact ?? {
      name: "",
      phone: "",
      relationship: "",
    },
    insurance: trip.insurance ?? { plan: "", memberId: "" },
    facilityNote: trip.facilityNote ?? "",
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
