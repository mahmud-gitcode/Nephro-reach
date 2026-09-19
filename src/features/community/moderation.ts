import {
  ACCESS_PHRASES,
  CONDUCT_PHRASES,
  CRISIS_PHRASES,
  EMERGENCY_PHRASES,
  MEDICAL_ADVICE_PHRASES,
  PAST_CONTEXT_MARKERS,
  PRIVACY_PHRASES,
  SCAM_PHRASES,
  SYMPTOM_PHRASES,
} from "./moderation.phrases";

/* ==========================================================================
   Auto-flagging a post — three tiers
   --------------------------------------------------------------------------
   A peer-support board for dialysis and advanced CKD members. This decides
   whether something they wrote is published, and what they are told if it
   is not.

   It used to answer every flag with one message about contacting your
   dialysis team. That is the right thing to say to someone asking about
   their dose and the wrong thing to say to someone describing chest pain
   or saying they want to die, so a finding now carries a level and the
   level chooses the words.

     1  emergency / crisis   possibly happening now. 911 guidance shown
                             immediately, without waiting for a moderator,
                             and queued ahead of everything else.
     2  concern              belongs with the member's care team: access,
                             symptoms, questions about medication.
     3  community            how members treat each other, scams, and
                             personal information that should not be on a
                             board at all.

   Nothing flagged is published. Nothing flagged is refused outright
   either: a member reaching out is held for a person to read, not bounced.
   Those are different, and the difference matters most for exactly the
   messages this file exists to catch.

   Two things this file does NOT do, deliberately:

     It does not notify anybody. No clinic, no nephrologist, no emergency
     service. Every message it produces says so, because a member who
     believes their post reached their care team may wait instead of
     calling. Routing to a facility needs its own workflow, permissions,
     and a receiving team that has agreed to watch the channel.

     It does not claim a moderator is reading. Monitoring hours belong to
     whoever staffs the queue; see MODERATION_HOURS below.
   ========================================================================== */

export type FlagLevel = 1 | 2 | 3;

export type FlagCategory =
  /* Level 1 */
  | "emergency"
  | "crisis"
  /* Level 2 */
  | "access"
  | "symptom"
  | "medical-advice"
  /* Level 3 */
  | "conduct"
  | "scam"
  | "privacy";

/* Checked in order, most serious first. The first list a phrase appears in
   is the one that decides its category, so a text tripping both the crisis
   list and the conduct list is treated as a member in trouble rather than
   as a member misbehaving. */
const CATEGORY_ORDER: { category: FlagCategory; phrases: string[] }[] = [
  { category: "emergency", phrases: EMERGENCY_PHRASES },
  { category: "crisis", phrases: CRISIS_PHRASES },
  { category: "access", phrases: ACCESS_PHRASES },
  { category: "medical-advice", phrases: MEDICAL_ADVICE_PHRASES },
  { category: "symptom", phrases: SYMPTOM_PHRASES },
  { category: "privacy", phrases: PRIVACY_PHRASES },
  { category: "scam", phrases: SCAM_PHRASES },
  { category: "conduct", phrases: CONDUCT_PHRASES },
];

const LEVEL_OF: Record<FlagCategory, FlagLevel> = {
  emergency: 1,
  crisis: 1,
  access: 2,
  symptom: 2,
  "medical-advice": 2,
  conduct: 3,
  scam: 3,
  privacy: 3,
};

/** Every phrase that holds a post back, whichever list it came from. */
export const ALL_FLAG_PHRASES: string[] = CATEGORY_ORDER.flatMap(
  (entry) => entry.phrases,
);

/* ==========================================================================
   Personal information typed out in full
   --------------------------------------------------------------------------
   A phrase list catches someone ASKING for a card number. These catch a
   member pasting their own, which is the commoner and more damaging case
   on a patient board.
   ========================================================================== */

const PRIVACY_PATTERNS: { name: string; pattern: RegExp }[] = [
  /* 123-45-6789, and the spaced and bare forms. */
  { name: "ssn", pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/ },
  /* 13-16 digits in groups, which is a card and almost nothing else. */
  {
    name: "card",
    pattern: /\b(?:\d[ -]?){13,16}\b/,
  },
  /* A US phone number written any of the usual ways. */
  {
    name: "phone",
    pattern: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  },
  { name: "email", pattern: /\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b/ },
];

/**
 * Whether the text appears to contain personal contact or identity details.
 *
 * Reported separately from the tiers because it is advice, not a verdict:
 * the composer offers the member a chance to take it out before posting
 * rather than telling them they have done something wrong.
 */
export function detectsPersonalInfo(text: string): boolean {
  if (!text.trim()) return false;
  /* "911" is three digits and nothing else; it must never read as a phone
     number, and it is already caught as an emergency phrase. */
  const withoutEmergency = text.replace(/\b911\b/g, " ");
  return PRIVACY_PATTERNS.some((entry) => entry.pattern.test(withoutEmergency));
}

/* ==========================================================================
   Finding what is in a piece of text
   ========================================================================== */

export interface FlagDetail {
  category: FlagCategory;
  level: FlagLevel;
  /** The phrase that fired, so a moderator can audit and tune the list. */
  phrase: string;
  /**
   * True when the surrounding words place this in the past, e.g. "I had
   * chest pain last week". A level 1 finding is softened to level 2; the
   * post is still held and still answered.
   */
  softenedByContext: boolean;
}

export function flagDetail(text: string): FlagDetail | null {
  if (!text || !text.trim()) return null;

  for (const { category, phrases } of CATEGORY_ORDER) {
    const phrase = firstMatch(text, phrases);
    if (!phrase) continue;

    const baseLevel = LEVEL_OF[category];
    const past = baseLevel === 1 && hasPastContext(text);

    return {
      category,
      /* Only ever softened, never sharpened, and never past level 2 — a
         story about a past emergency is still worth a person reading. */
      level: past ? 2 : baseLevel,
      phrase,
      softenedByContext: past,
    };
  }

  return null;
}

export function flagLevel(text: string): FlagLevel | null {
  return flagDetail(text)?.level ?? null;
}

export function flagCategory(text: string): FlagCategory | null {
  return flagDetail(text)?.category ?? null;
}

/** Whether anything at all holds this text back. */
export function checkFlaggedMedicalContent(text: string): boolean {
  return flagDetail(text) !== null;
}

/**
 * How a piece of text may reach the board.
 *
 * `review` for anything flagged, at every level. A member describing chest
 * pain is answered with 911 guidance on the spot AND held for a person —
 * refusing the post would take away the only thing they did, which was
 * ask for help.
 */
export type PublishRoute = "allow" | "review" | "block";

export function routeForCommunity(text: string): PublishRoute {
  if (!text.trim()) return "block";
  return flagDetail(text) ? "review" : "allow";
}

/** Whether this text may be published straight to the board. */
export function canPublishToCommunity(text: string): boolean {
  return routeForCommunity(text) === "allow";
}

/* ==========================================================================
   What the member is told
   --------------------------------------------------------------------------
   Four messages, not one. Each says plainly that nothing was sent on the
   member's behalf, because the alternative is a member waiting for a call
   that is never going to come.
   ========================================================================== */

export interface AutoReply {
  title: { en: string; es: string };
  body: { en: string; es: string };
  /** Emergency wording earns the loudest surface the page has. */
  tone: "danger" | "warning";
  /** True when the reply should offer a way to dial emergency services. */
  offersEmergencyCall: boolean;
}

const EMERGENCY_REPLY: AutoReply = {
  title: {
    en: "This may be an emergency — call 911 now",
    es: "Esto puede ser una emergencia: llama al 911 ahora",
  },
  body: {
    en: "Your message may describe a medical emergency. If you are having chest pain, severe difficulty breathing, bleeding that will not stop, or any other immediate danger, call 911 now. NephroReach is not an emergency service. Your message has not been sent to emergency services or to your dialysis team.",
    es: "Tu mensaje puede describir una emergencia médica. Si tienes dolor de pecho, dificultad grave para respirar, sangrado que no se detiene o cualquier otro peligro inmediato, llama al 911 ahora. NephroReach no es un servicio de emergencia. Tu mensaje no se ha enviado al 911 ni a tu equipo de diálisis.",
  },
  tone: "danger",
  offersEmergencyCall: true,
};

const CRISIS_REPLY: AutoReply = {
  title: {
    en: "Help is available right now",
    es: "Hay ayuda disponible ahora mismo",
  },
  body: {
    en: "It sounds like you may be going through something very hard. You can reach the Suicide & Crisis Lifeline any time by calling or texting 988, or call 911 if you are in immediate danger. NephroReach is not a crisis service and nobody has been contacted for you. Please reach out to one of those numbers, or to someone you trust.",
    es: "Parece que estás pasando por algo muy difícil. Puedes comunicarte con la Línea de Crisis y Suicidio llamando o enviando un mensaje al 988 en cualquier momento, o llama al 911 si estás en peligro inmediato. NephroReach no es un servicio de crisis y no se ha contactado a nadie por ti. Por favor llama a uno de esos números, o habla con alguien de confianza.",
  },
  tone: "danger",
  offersEmergencyCall: true,
};

const CONCERN_REPLY: AutoReply = {
  title: {
    en: "This belongs with your care team",
    es: "Esto es para tu equipo de atención",
  },
  body: {
    en: "Your message includes symptoms or concerns that may need urgent medical attention. NephroReach provides education only and does not diagnose, treat, or replace your dialysis team. Please contact your dialysis clinic, nephrologist, or call 911 if this may be an emergency. This page does not contact them for you.",
    es: "Tu mensaje incluye síntomas o inquietudes que pueden necesitar atención médica urgente. NephroReach solo brinda educación y no diagnostica, trata ni reemplaza a tu equipo de diálisis. Comunícate con tu clínica de diálisis, tu nefrólogo o llama al 911 si esto puede ser una emergencia. Esta página no los contacta por ti.",
  },
  tone: "warning",
  offersEmergencyCall: false,
};

const COMMUNITY_REPLY: AutoReply = {
  title: {
    en: "A moderator will read this before it posts",
    es: "Un moderador lo leerá antes de publicarse",
  },
  body: {
    en: "This community is a support space for people on dialysis. Your message has been held for a moderator to read, and only you can see it until they approve it. Please do not post anyone's personal details, ask other members for money, or aim language at another member.",
    es: "Esta comunidad es un espacio de apoyo para personas en diálisis. Tu mensaje se retuvo para que lo lea un moderador, y solo tú lo verás hasta que lo apruebe. Por favor no publiques datos personales de nadie, no pidas dinero a otros miembros y no dirijas tu lenguaje contra otra persona.",
  },
  tone: "warning",
  offersEmergencyCall: false,
};

const REPLY_BY_CATEGORY: Record<FlagCategory, AutoReply> = {
  emergency: EMERGENCY_REPLY,
  crisis: CRISIS_REPLY,
  access: CONCERN_REPLY,
  symptom: CONCERN_REPLY,
  "medical-advice": CONCERN_REPLY,
  conduct: COMMUNITY_REPLY,
  scam: COMMUNITY_REPLY,
  privacy: COMMUNITY_REPLY,
};

/**
 * The message for a finding.
 *
 * A softened level 1 keeps its category's wording but drops to the calmer
 * care-team reply: telling someone "call 911 now" about the chest pain
 * they had last month is the kind of false alarm that teaches members to
 * ignore the real one.
 */
export function autoReplyFor(detail: FlagDetail): AutoReply {
  if (detail.softenedByContext) return CONCERN_REPLY;
  return REPLY_BY_CATEGORY[detail.category];
}

export function autoReplyForText(text: string): AutoReply | null {
  const detail = flagDetail(text);
  return detail ? autoReplyFor(detail) : null;
}

/* ==========================================================================
   What this board promises about being watched
   --------------------------------------------------------------------------
   One string, in one place, so the disclaimer and the admin queue cannot
   drift into promising different things. Change it when the staffing
   changes — and never to something nobody is actually doing.
   ========================================================================== */

export const MODERATION_HOURS = {
  en: "Moderators review held messages on weekdays. Nobody watches this community around the clock, and nothing you post here reaches your care team or emergency services.",
  es: "Los moderadores revisan los mensajes retenidos en días hábiles. Nadie vigila esta comunidad las 24 horas, y nada de lo que publiques aquí llega a tu equipo de atención ni al 911.",
};

/* ==========================================================================
   Matching
   ========================================================================== */

function hasPastContext(text: string): boolean {
  return firstMatch(text, PAST_CONTEXT_MARKERS) !== null;
}

/**
 * Word-boundary matching, not substring: "cash app" flags and "cashew"
 * does not. Phrases are matched case-insensitively and against punctuation,
 * so "(scam)" and "...send money!" are both caught.
 */
function firstMatch(text: string, phrases: string[]): string | null {
  if (!text || !text.trim()) return null;
  const lower = text.toLowerCase();
  return (
    phrases.find((phrase) => {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?:^|\\b|\\W)${escaped}(?:$|\\b|\\W)`, "i");
      return regex.test(lower);
    }) ?? null
  );
}

/* Kept for the callers that only ask "is there anything at all?" */
export { ALL_FLAG_PHRASES as AUTO_FLAG_PHRASES };
