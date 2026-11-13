/* ==========================================================================
   Office settings: API shapes and what the page shows (Phase 14)
   --------------------------------------------------------------------------
   What the office itself can change, from the API:
   - the profile: GET/PATCH /organizations/:org (address, phone, email,
     IANA time zone). The name is NephroReach's (only the platform changes
     it), so it is shown read-only;
   - the settings: GET/PATCH /organizations/:org/settings (notification
     toggles, office hours, on-call phone, landing page, items per page,
     date format, data-sharing choices).
   Each section saves only its own changed fields. Nothing is kept in the
   browser: the retired `nr:clinic-settings`, `nr:org-settings-<id>` and the
   `…-actions` keys are purged.
   ========================================================================== */

/* ---------------------------------------------------------------- the API */

export type ApiOfficeProfile = {
  id: string;
  name: string;
  type: string;
  status?: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  timeZone: string;
};

export type ApiOfficeSettings = {
  opensAt: string;
  closesAt: string;
  closedWeekdays: string[];
  onCallPhone: string | null;
  escalateAfterMinutes: number;
  notifications: Record<NotificationId, boolean>;
  shareUsageAnalytics: boolean;
  shareOutcomes: boolean;
  shareResearch: boolean;
  landingPage: string | null;
  itemsPerPage: number;
  dateFormat: string;
  updatedAt?: string;
};

export type ProfilePatch = {
  address?: string | null;
  phone?: string | null;
  email?: string;
  timeZone?: string;
};

export type SettingsPatch = Partial<
  Omit<ApiOfficeSettings, "notifications" | "updatedAt">
> & { notifications?: Partial<Record<NotificationId, boolean>> };

/* ------------------------------------------------------------- the screen */

export type OrganizationProfile = {
  name: string;
  address: string;
  phone: string;
  email: string;
  /** IANA id (America/New_York). */
  timeZone: string;
};

/** The labels the page always showed, with the IANA id each stands for. */
export const TIME_ZONES = [
  {
    label: "(GMT-10:00) Hawaii Time (HT)",
    labelEs: "(GMT-10:00) Hora de Hawái (HT)",
    iana: "Pacific/Honolulu",
  },
  {
    label: "(GMT-09:00) Alaska Time (AKT)",
    labelEs: "(GMT-09:00) Hora de Alaska (AKT)",
    iana: "America/Anchorage",
  },
  {
    label: "(GMT-08:00) Pacific Time (PT)",
    labelEs: "(GMT-08:00) Hora del Pacífico (PT)",
    iana: "America/Los_Angeles",
  },
  {
    label: "(GMT-07:00) Mountain Time (MT)",
    labelEs: "(GMT-07:00) Hora de la Montaña (MT)",
    iana: "America/Denver",
  },
  {
    label: "(GMT-06:00) Central Time (CT)",
    labelEs: "(GMT-06:00) Hora del Centro (CT)",
    iana: "America/Chicago",
  },
  {
    label: "(GMT-05:00) Eastern Time (ET)",
    labelEs: "(GMT-05:00) Hora del Este (ET)",
    iana: "America/New_York",
  },
] as const;

/** The label for an IANA id; an id the list does not know shows itself,
 *  never a wrong label. */
export function timeZoneLabel(iana: string, isEs = false): string {
  const zone = TIME_ZONES.find((item) => item.iana === iana);
  if (!zone) return iana;
  return isEs ? zone.labelEs : zone.label;
}

export const NOTIFICATIONS = [
  {
    id: "enrollments",
    label: "New member enrollments",
    labelEs: "Nuevas inscripciones de miembros",
  },
  {
    id: "checkIns",
    label: "Patient check-in alerts",
    labelEs: "Alertas de registros de pacientes",
  },
  {
    id: "liveClass",
    label: "Live class reminders",
    labelEs: "Recordatorios de clases en vivo",
  },
  {
    id: "billing",
    label: "Contract & billing updates",
    labelEs: "Novedades de contrato y facturación",
  },
  {
    id: "announcements",
    label: "Platform announcements",
    labelEs: "Anuncios de la plataforma",
  },
  {
    id: "support",
    label: "Support ticket responses",
    labelEs: "Respuestas a solicitudes de soporte",
  },
  {
    id: "weeklySummary",
    label: "Weekly summary email",
    labelEs: "Correo de resumen semanal",
  },
  {
    id: "sms",
    label: "SMS notifications",
    labelEs: "Notificaciones por SMS",
    optional: true,
  },
] as const;

export type NotificationId = (typeof NOTIFICATIONS)[number]["id"];

export const ITEMS_PER_PAGE = [10, 25, 50] as const;

export const DATE_FORMATS = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"] as const;

export type OfficePreferences = {
  /** A portal route, e.g. "/dashboard/clinic"; "" when none is set. */
  landingPage: string;
  itemsPerPage: number;
  dateFormat: string;
  /** "HH:MM", 24h. Messages outside these hours get the after-hours reply
   *  (server-side since Phase 11). */
  opensAt: string;
  closesAt: string;
  /** E.164 as the server keeps it, or "". */
  onCallPhone: string;
};

export type SharingState = {
  analytics: boolean;
  outcomes: boolean;
  research: boolean;
};

export type ClinicSettings = {
  profile: OrganizationProfile;
  notifications: Record<NotificationId, boolean>;
  office: OfficePreferences;
  sharing: SharingState;
};

export function toProfile(row: ApiOfficeProfile): OrganizationProfile {
  return {
    name: row.name,
    address: row.address ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    timeZone: row.timeZone,
  };
}

export function toSettings(
  profile: OrganizationProfile,
  row: ApiOfficeSettings,
): ClinicSettings {
  return {
    profile,
    notifications: row.notifications,
    office: {
      landingPage: row.landingPage ?? "",
      itemsPerPage: row.itemsPerPage,
      dateFormat: row.dateFormat,
      opensAt: row.opensAt,
      closesAt: row.closesAt,
      onCallPhone: row.onCallPhone ?? "",
    },
    sharing: {
      analytics: row.shareUsageAnalytics,
      outcomes: row.shareOutcomes,
      research: row.shareResearch,
    },
  };
}

/* ----------------------------------------------------------- the patches */

const blankToNull = (value: string) => (value.trim() ? value.trim() : null);

/** Only the profile fields that changed; "" clears a nullable field. */
export function profilePatch(
  saved: OrganizationProfile,
  next: OrganizationProfile,
): ProfilePatch {
  const patch: ProfilePatch = {};
  if (next.address.trim() !== saved.address.trim())
    patch.address = blankToNull(next.address);
  if (next.phone.trim() !== saved.phone.trim())
    patch.phone = blankToNull(next.phone);
  if (next.email.trim() !== saved.email.trim()) patch.email = next.email.trim();
  if (next.timeZone !== saved.timeZone) patch.timeZone = next.timeZone;
  return patch;
}

export const SHARING_FIELD: Record<
  keyof SharingState,
  "shareUsageAnalytics" | "shareOutcomes" | "shareResearch"
> = {
  analytics: "shareUsageAnalytics",
  outcomes: "shareOutcomes",
  research: "shareResearch",
};

/* ----------------------------------------------------------- validation */

const OFFICE_PHONE = /^[0-9+()\-.\s]{7,40}$/;
const E164 = /^\+[1-9]\d{1,14}$/;

export type ProfileErrors = Partial<Record<keyof OrganizationProfile, string>>;

/** What the server would refuse, said in words before sending. */
export function validateProfile(
  profile: OrganizationProfile,
  isEs = false,
): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!profile.email.trim())
    errors.email = isEs
      ? "Ingrese un correo electrónico."
      : "Enter an email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()))
    errors.email = isEs
      ? "Ingrese un correo electrónico como nombre@clinica.com."
      : "Enter an email address like name@clinic.com.";
  if (profile.phone.trim() && !OFFICE_PHONE.test(profile.phone.trim()))
    errors.phone = isEs
      ? "Ingrese un número de teléfono con dígitos, espacios, ( ) - + o ."
      : "Enter a phone number with digits, spaces, ( ) - + or .";
  if (profile.address.trim().length > 300)
    errors.address = isEs
      ? "La dirección debe tener menos de 300 caracteres."
      : "Keep the address under 300 characters.";
  return errors;
}

/**
 * A US phone as typed ("(702) 555-0122") in E.164 ("+17025550122"); a
 * number already starting with "+" keeps its digits. "" clears it (null).
 * Undefined when it cannot be a phone number.
 */
export function toE164(input: string): string | null | undefined {
  const text = input.trim();
  if (!text) return null;
  const digits = text.replace(/\D/g, "");
  let e164: string;
  if (text.startsWith("+")) e164 = `+${digits}`;
  else if (digits.length === 10) e164 = `+1${digits}`;
  else if (digits.length === 11 && digits.startsWith("1")) e164 = `+${digits}`;
  else return undefined;
  return E164.test(e164) ? e164 : undefined;
}

/** "+17025550122" -> "(702) 555-0122" for display; others as stored. */
export function displayPhone(e164: string): string {
  const us = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return us ? `(${us[1]}) ${us[2]}-${us[3]}` : e164;
}

/** "RD" for Riverside Dialysis Center — the stand-in logo. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}
