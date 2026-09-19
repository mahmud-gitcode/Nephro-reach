/* ==========================================================================
   Auto-flag phrases, by what they mean
   --------------------------------------------------------------------------
   Split out of moderation.ts because this is a list the client maintains
   and the code around it is not. Adding a phrase should mean editing one
   array, never touching a rule.

   These are SCREENING terms, not diagnoses. "Potassium is high" on its own
   does not establish an emergency, and "I went to the ER yesterday" is a
   member telling a story. The tiering and the past-tense guard in
   moderation.ts exist because a word list alone cannot tell the difference.

   Ordering inside each array does not matter. What matters is which array a
   phrase is in, because that decides the tier and therefore what the member
   is told.
   ========================================================================== */

/* ── Level 1 ────────────────────────────────────────────────────────────────
   A possible emergency happening now. The member is shown 911 guidance
   immediately, without waiting for a moderator.
   ──────────────────────────────────────────────────────────────────────── */

export const EMERGENCY_PHRASES: string[] = [
  // Emergency / medical crisis
  "chest pain",
  "chest pressure",
  "can't breathe",
  "cant breathe",
  "not breathing",
  "shortness of breath",
  "passed out",
  "fainted",
  "can't wake up",
  "cant wake up",
  "seizure",
  "stroke",
  "unresponsive",
  "severe pain",
  "911",
  "life-threatening",
  "life threatening",

  // Stroke signs — the ones a member is taught to act on
  "trouble speaking",
  "face drooping",
  "one-sided weakness",
  "one sided weakness",

  // Airway and allergy
  "severe allergic reaction",
  "throat closing",
  "blue lips",

  // Bleeding that is not stopping
  "coughing up blood",
  "vomiting blood",
  "bleeding won't stop",
  "bleeding wont stop",
  "access bleeding",
  "fistula bleeding",
  "graft bleeding",
  "catheter bleeding",

  // A catheter that has come out is an emergency, not a concern
  "catheter fell out",
  "catheter came out",
  "catheter pulled out",
];

/* Mental health and personal safety. Level 1, but answered in its own
   words — a member saying they want to die must not be met with a note
   about contacting their dialysis clinic during office hours. */
export const CRISIS_PHRASES: string[] = [
  "i want to die",
  "i don't want to live",
  "i dont want to live",
  "better off dead",
  "end my life",
  "suicide",
  "kill myself",
  "hurt myself",
  "overdose",
  "i can't take this anymore",
  "i cant take this anymore",

  // Someone else is the danger
  "hurt someone",
  "someone is hurting me",
  "i'm being threatened",
  "im being threatened",
  "i don't feel safe",
  "i dont feel safe",
  "abuse",
  "neglect",
  "domestic violence",
];

/* ── Level 2 ────────────────────────────────────────────────────────────────
   A real concern that belongs with the member's care team rather than with
   the board. Held for review, answered by pointing at that team.
   ──────────────────────────────────────────────────────────────────────── */

export const ACCESS_PHRASES: string[] = [
  // Access that has stopped working
  "no bruit",
  "no thrill",
  "no buzzing",
  "no vibration",
  "fistula stopped working",
  "access clotted",
  "access not working",

  // Signs of infection
  "access swollen",
  "access infected",
  "exit site infection",
  "pus",
  "redness",
  "warm to touch",
  "fever",
  "chills",

  /* Peritoneal dialysis. Both word orders, because the adjective-first
     phrasing on its own misses how members actually write it — "my drain
     bag is cloudy" is far commoner than "cloudy drain bag", and cloudy
     effluent is the first sign of peritonitis. */
  "cloudy pd fluid",
  "cloudy drain bag",
  "cloudy fluid",
  "cloudy effluent",
  "cloudy dialysate",
  "drain bag is cloudy",
  "drain bag was cloudy",
  "drain bag looks cloudy",
  "drain is cloudy",
  "drain was cloudy",
  "fluid is cloudy",
  "fluid was cloudy",
  "fluid looks cloudy",
  "fluid looked cloudy",
  "severe abdominal pain",
  "can't drain",
  "cant drain",
  "can't fill",
  "cant fill",

  // Equipment and missed treatment
  "machine alarm",
  "missed dialysis",
  "missed multiple treatments",
  "can't get dialysis",
  "cant get dialysis",
  "can't get a treatment",
  "cant get a treatment",
];

export const SYMPTOM_PHRASES: string[] = [
  "very dizzy",
  "low blood pressure",
  "cramping bad",
  "throwing up",
  "heart racing",
  "palpitations",
  "severe headache",
  "can't stay awake",
  "cant stay awake",
  "fluid overload",
  "potassium is high",
  "confused",
  "bleeding",
  "er",
  "emergency",
];

export const MEDICAL_ADVICE_PHRASES: string[] = [
  "what dose should i take",
  "should i stop my medicine",
  "should i skip dialysis",
  "can i miss treatment",
  "should i take extra",
  "change my dose",
  "diagnose me",
  "treat this",
  "prescribe",
  "medication reaction",

  // Advice one member must not give another
  "stop taking your medication",
  "you don't need dialysis",
  "you dont need dialysis",
  "double your dose",
  "miracle cure",
  "guaranteed cure",
];

/* ── Level 3 ────────────────────────────────────────────────────────────────
   How members treat each other, and attempts to take something from them.
   ──────────────────────────────────────────────────────────────────────── */

export const CONDUCT_PHRASES: string[] = [
  "idiot",
  "stupid",
  "shut up",
  "racist",
  "threat",
  "fight",
  "harass",

  /* Hostility aimed outward. The crisis list above reads for a member in
     trouble — "i want to die" — and none of it catches the same words
     pointed at someone else, which is how "Die already" once posted. */
  "die already",
  "just die",
  "go die",
  "drop dead",
  "kill yourself",
  "kys",
  "you should die",
  "hope you die",
  "wish you were dead",
  "you deserve to die",
  "hate you",
  "nobody cares",
  "no one cares",
  "waste of space",
  "loser",
  "pathetic",
  "moron",
  "retard",
  "freak",
  "get lost",
];

export const SCAM_PHRASES: string[] = [
  "scam",
  "cash app",
  "send money",
  "send me money",
  "buy pills",
  "sell medication",
];

/* Asking another member for what should never be posted on a board. The
   patterns in moderation.ts catch a number typed out; these catch the
   request for one. */
export const PRIVACY_PHRASES: string[] = [
  "social security number",
  "bank account",
  "credit card number",
  "send me your password",
  "send your medical records",
  "dm me your information",
];

/* ── Context guard ──────────────────────────────────────────────────────────
   Words that turn a symptom into a story. "I had chest pain last week at
   dialysis" is a member talking about their care, not one in danger now.

   This only ever SOFTENS a finding, and only from Level 1 to Level 2 — the
   post is still held and still answered. It never lets anything through,
   because the cost of being wrong in that direction is not one we get to
   pay on a member's behalf.
   ──────────────────────────────────────────────────────────────────────── */

export const PAST_CONTEXT_MARKERS: string[] = [
  "yesterday",
  "last week",
  "last month",
  "last year",
  "last time",
  "a while ago",
  "years ago",
  "months ago",
  "weeks ago",
  "days ago",
  "used to",
  "back then",
  "in the past",
  "when i started",
  "before i started",
  "i had",
  "i've had",
  "ive had",
  "i was",
  "was told",
];
