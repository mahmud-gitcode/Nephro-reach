/* ==========================================================================
   Notification campaigns: API ⇄ template screen (Phase 14.7)
   --------------------------------------------------------------------------
   - Kinds are the backend's only: check-in and reminder (Q-EDU-4). The
     prototype's "Education" type is gone.
   - Timing is either a repeating schedule or one send time, never both:
       weekly  → "FREQ=WEEKLY;BYDAY=MO;BYHOUR=9"
       daily   → "FREQ=DAILY;BYHOUR=9"
       once    → sendAt, an ISO instant
     Schedule hours are wall-clock hours in America/New_York for every
     member (the server's rule), so the screen says "ET".
   - The message goes out by SMS, email and push: it must never hold PHI.
   ========================================================================== */

export type CampaignKind = "check-in" | "reminder";
export type CampaignChannel = "in_app" | "sms" | "push" | "email";
export type CampaignQuestion = "er-visit" | "wellbeing";

export const CAMPAIGN_KINDS: readonly CampaignKind[] = ["check-in", "reminder"];
export const KIND_LABEL: Record<CampaignKind, string> = {
  "check-in": "Check-in",
  reminder: "Reminder",
};
export const CHANNEL_LABEL: Record<CampaignChannel, string> = {
  in_app: "In-app",
  email: "Email",
  push: "Push",
  sms: "SMS",
};
export const QUESTION_LABEL: Record<CampaignQuestion, string> = {
  "er-visit": "ER visit this week (yes / no)",
  wellbeing: "How are you feeling (1–5)",
};

/** Spanish labels for the same keys (the admin screen picks by language). */
export const KIND_LABEL_ES: Record<CampaignKind, string> = {
  "check-in": "Seguimiento",
  reminder: "Recordatorio",
};
export const CHANNEL_LABEL_ES: Record<CampaignChannel, string> = {
  in_app: "En la aplicación",
  email: "Correo electrónico",
  push: "Push",
  sms: "SMS",
};
export const QUESTION_LABEL_ES: Record<CampaignQuestion, string> = {
  "er-visit": "Visita a urgencias esta semana (sí / no)",
  wellbeing: "¿Cómo se siente? (1–5)",
};

export const MESSAGE_MAX = 320;
export const TITLE_MAX = 120;

/** GET /platform/campaigns (CampaignResponseDto). */
export type ApiCampaign = {
  id: string;
  title: string;
  kind: CampaignKind;
  message: string;
  question?: CampaignQuestion | null;
  channels: CampaignChannel[];
  schedule?: string | null;
  sendAt?: string | null;
  audience?: {
    programs?: string[];
    organizationIds?: string[];
    modalities?: string[];
  } | null;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type CampaignAnalytics = {
  campaignId: string;
  totalDeliveries: number;
  deliveries: { channel: string; status: string; count: number }[];
  inAppDelivered: number;
  inAppRead: number;
  readRate: number;
  responseCount: number;
  responseRate: number;
  answers: { answer: string; count: number }[];
};

export const WEEKDAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export const WEEKDAY_LABEL: Record<Weekday, string> = {
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
  SU: "Sunday",
};
export const WEEKDAY_LABEL_ES: Record<Weekday, string> = {
  MO: "lunes",
  TU: "martes",
  WE: "miércoles",
  TH: "jueves",
  FR: "viernes",
  SA: "sábado",
  SU: "domingo",
};

export type Timing =
  | { mode: "weekly"; weekday: Weekday; hour: number }
  | { mode: "daily"; hour: number }
  | { mode: "once"; sendAt: string }
  | { mode: "none" };

const RULE =
  /^(?:FREQ=WEEKLY;BYDAY=(MO|TU|WE|TH|FR|SA|SU)|FREQ=DAILY);BYHOUR=(\d|1\d|2[0-3])$/;

/** The schedule the API takes for a repeating timing, else null. */
export function toSchedule(timing: Timing): string | null {
  if (timing.mode === "weekly")
    return `FREQ=WEEKLY;BYDAY=${timing.weekday};BYHOUR=${validHour(timing.hour)}`;
  if (timing.mode === "daily")
    return `FREQ=DAILY;BYHOUR=${validHour(timing.hour)}`;
  return null;
}

function validHour(hour: number): number {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23)
    throw new RangeError(`Bad hour: ${hour}`);
  return hour;
}

/** A campaign's timing from what the API stored. */
export function fromApiTiming(
  campaign: Pick<ApiCampaign, "schedule" | "sendAt">,
): Timing {
  if (campaign.schedule) {
    const match = RULE.exec(campaign.schedule);
    if (match) {
      const hour = Number(match[2]);
      return match[1]
        ? { mode: "weekly", weekday: match[1] as Weekday, hour }
        : { mode: "daily", hour };
    }
  }
  if (campaign.sendAt) return { mode: "once", sendAt: campaign.sendAt };
  return { mode: "none" };
}

/** "9:00 AM" from 9, "12:00 PM" from 12, "12:00 AM" from 0. */
export function hourLabel(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:00 ${hour < 12 ? "AM" : "PM"}`;
}

/** The card's schedule line. */
export function timingLabel(timing: Timing, isEs = false): string {
  switch (timing.mode) {
    case "weekly":
      return isEs
        ? `Cada ${WEEKDAY_LABEL_ES[timing.weekday]} a las ${hourLabel(timing.hour)} ET`
        : `Every ${WEEKDAY_LABEL[timing.weekday]} at ${hourLabel(timing.hour)} ET`;
    case "daily":
      return isEs
        ? `Todos los días a las ${hourLabel(timing.hour)} ET`
        : `Every day at ${hourLabel(timing.hour)} ET`;
    case "once": {
      const date = new Date(timing.sendAt);
      if (Number.isNaN(date.getTime())) return isEs ? "Una vez" : "Once";
      const when = date.toLocaleString(isEs ? "es-US" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      return isEs ? `Una vez, ${when}` : `Once, ${when}`;
    }
    default:
      return isEs ? "Sin programar" : "Not scheduled";
  }
}

export type CampaignDraft = {
  title: string;
  kind: CampaignKind;
  message: string;
  question: CampaignQuestion | null;
  channels: CampaignChannel[];
  timing: Timing;
};

/** Why a draft cannot be saved, or null. Mirrors the server's own rules so
 *  the admin hears it before a 400; the server still decides. */
export function draftError(
  draft: CampaignDraft,
  now = new Date(),
  isEs = false,
): string | null {
  if (!draft.title.trim())
    return isEs
      ? "Póngale un nombre a la plantilla."
      : "Give the template a name.";
  if (draft.title.trim().length > TITLE_MAX)
    return isEs
      ? `El nombre no puede pasar de ${TITLE_MAX} caracteres.`
      : `Keep the name to ${TITLE_MAX} characters.`;
  if (!CAMPAIGN_KINDS.includes(draft.kind))
    return isEs ? "Elija un tipo de mensaje." : "Choose a message type.";
  if (!draft.message.trim())
    return isEs ? "Escriba el mensaje." : "Write the message.";
  if (draft.message.trim().length > MESSAGE_MAX)
    return isEs
      ? `El mensaje no puede pasar de ${MESSAGE_MAX} caracteres.`
      : `Keep the message to ${MESSAGE_MAX} characters.`;
  if (draft.channels.length === 0)
    return isEs ? "Elija al menos un canal." : "Choose at least one channel.";
  if (draft.question && !draft.channels.includes("in_app"))
    return isEs
      ? "Una pregunta necesita el canal en la aplicación (los miembros la responden allí)."
      : "A question needs the in-app channel (members answer it there).";
  if (draft.timing.mode === "once") {
    const at = new Date(draft.timing.sendAt).getTime();
    if (Number.isNaN(at) || at <= now.getTime())
      return isEs
        ? "Elija una hora de envío en el futuro."
        : "Choose a send time in the future.";
  }
  return null;
}

/** The body of POST /platform/campaigns or PATCH …/:id. Exactly one of
 *  schedule and sendAt is set; the other is null (null clears it). */
export function toCampaignBody(draft: CampaignDraft) {
  return {
    title: draft.title.trim(),
    kind: draft.kind,
    message: draft.message.trim(),
    question: draft.question,
    channels: [...new Set(draft.channels)],
    schedule: toSchedule(draft.timing),
    sendAt: draft.timing.mode === "once" ? draft.timing.sendAt : null,
  };
}

/** A whole-percent label for a 0–1 rate, or "—" when nothing went out. */
export function rateLabel(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return "—";
  return `${Math.round(rate * 100)}%`;
}
