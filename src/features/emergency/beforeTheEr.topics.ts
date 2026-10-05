/* ==========================================================================
   Before the ER — the approved topic library
   --------------------------------------------------------------------------
   The client's overriding rule (2026-10-05):

     Before the ER is a retrieval-only educational feature. User searches
     retrieve predetermined, clinically reviewed educational content. The
     system must not analyze symptoms, interpret patient-entered health
     information, calculate severity, assign risk, recommend a level of
     care, determine whether the patient should contact a particular
     provider, or determine whether the patient should seek emergency care.

   So everything here is fixed text. Search only matches words against this
   list and returns whole topics; it never composes an answer, never ranks
   by how serious something sounds, and the emergency information is kept
   apart from results entirely. No search is stored.

   Every topic has the same three parts: education, "Questions you may
   want to discuss with your dialysis team", and the same Contact My
   Dialysis Clinic button. Wording stays neutral: "can be important
   information for your dialysis care team", never "may mean" or "call
   now".

   `reviewed` marks text the client supplied. The others are drafts built
   only from the client's own topic descriptions, shown with a "pending
   clinical review" note until the client's reviewer approves them.
   ========================================================================== */

export type BeforeTheErTopic = {
  slug: string;
  titleEn: string;
  titleEs: string;
  /** One line for the topic list. */
  summaryEn: string;
  /** The education text. */
  educationEn: string[];
  /** "Questions you may want to discuss with your dialysis team". */
  questionsEn: string[];
  /** Extra words a member might search with (not shown). */
  keywords: string[];
  /** The client's own, clinically reviewed text. */
  reviewed: boolean;
};

export const BEFORE_THE_ER_SUBTITLE = {
  en: "Know when to communicate with your dialysis care team.",
  es: "Sepa cuándo comunicarse con su equipo de atención de diálisis.",
};

export const BEFORE_THE_ER_INTRO = {
  en: "Before the ER provides general education about common concerns that people receiving dialysis may need to discuss with their dialysis care team. This resource does not diagnose symptoms, determine how serious a condition is, recommend treatment, or determine whether you should go to the emergency room.",
  es: "Antes de Urgencias ofrece educación general sobre inquietudes comunes que las personas en diálisis pueden necesitar hablar con su equipo de atención de diálisis. Este recurso no diagnostica síntomas, no determina qué tan grave es una afección, no recomienda tratamientos ni determina si usted debe ir a la sala de emergencias.",
};

/** The client's emergency text, word for word. Shown apart from search
 *  results, and in the top bar's emergency popup. */
export const EMERGENCY_INFORMATION = {
  titleEn: "Emergency Information",
  titleEs: "Información de Emergencia",
  en: [
    "NephroReach does not evaluate symptoms or determine whether a medical condition is an emergency. If you believe you are experiencing a medical emergency, call 911 or seek emergency medical care. Do not use NephroReach messaging for emergency assistance.",
    "NKF recognizes that certain problems in dialysis patients can require immediate assistance, including chest pain, breathing difficulty, fainting/severe weakness, uncontrolled bleeding and serious access concerns.",
  ],
  es: [
    "NephroReach no evalúa síntomas ni determina si una afección médica es una emergencia. Si cree que está teniendo una emergencia médica, llame al 911 o busque atención médica de emergencia. No use los mensajes de NephroReach para pedir ayuda en una emergencia.",
    "La NKF reconoce que ciertos problemas en pacientes en diálisis pueden requerir asistencia inmediata, como dolor de pecho, dificultad para respirar, desmayos/debilidad intensa, sangrado que no se detiene y problemas graves con el acceso.",
  ],
};

export const BEFORE_THE_ER_TOPICS: BeforeTheErTopic[] = [
  {
    slug: "dialysis-access",
    titleEn: "Dialysis Access",
    titleEs: "Acceso de Diálisis",
    summaryEn:
      "Redness, warmth, swelling, drainage, pain, bleeding, changes in the usual thrill or buzz, and catheter dressing concerns.",
    educationEn: [
      "Your dialysis access is how your treatment connects to your body. The National Kidney Foundation (NKF) advises people on dialysis to report changes in their access to their dialysis team.",
    ],
    questionsEn: [
      "Changes you've noticed in how your access looks or feels",
      "Redness, warmth, swelling, drainage or pain at your access",
      "Bleeding from your access site",
      "Changes in the usual thrill or buzz",
      "Questions about your catheter dressing",
    ],
    keywords: [
      "access",
      "fistula",
      "graft",
      "catheter",
      "port",
      "arm",
      "redness",
      "red",
      "warm",
      "warmth",
      "swelling",
      "swollen",
      "drainage",
      "pus",
      "pain",
      "sore",
      "bleeding",
      "blood",
      "thrill",
      "buzz",
      "bruit",
      "dressing",
      "needle",
    ],
    reviewed: false,
  },
  {
    slug: "after-dialysis-concerns",
    titleEn: "After-Dialysis Concerns",
    titleEs: "Inquietudes Después de la Diálisis",
    summaryEn:
      "Dizziness, cramping, nausea or vomiting, weakness, headache, or feeling different after treatment.",
    educationEn: [
      "Some people notice changes in how they feel after a dialysis treatment. The National Kidney Foundation (NKF) encourages people on dialysis to tell their care team about symptoms during, after, or between treatments.",
    ],
    questionsEn: [
      "How you have felt after your recent treatments",
      "Dizziness, cramping, nausea, vomiting, weakness or headache after treatment",
      "When these changes started",
      "Anything that was different about your recent treatments",
    ],
    keywords: [
      "after",
      "dizzy",
      "dizziness",
      "lightheaded",
      "cramp",
      "cramps",
      "cramping",
      "nausea",
      "nauseous",
      "vomit",
      "vomiting",
      "weak",
      "weakness",
      "tired",
      "headache",
      "feel",
      "feeling",
      "different",
    ],
    reviewed: false,
  },
  {
    slug: "missed-or-shortened-dialysis",
    titleEn: "Missed or Shortened Dialysis",
    titleEs: "Diálisis Perdida o Acortada",
    summaryEn:
      "Why completing prescribed treatments matters, and contacting the dialysis facility when a treatment cannot be completed.",
    educationEn: [
      "Your dialysis treatments are prescribed for a set length of time and schedule. When a treatment cannot be completed as prescribed, your dialysis facility is the place to let know.",
    ],
    questionsEn: [
      "Treatments you missed or ended early",
      "Why a treatment could not be completed",
      "How to reschedule a treatment",
      "Questions about your treatment schedule",
    ],
    keywords: [
      "missed",
      "miss",
      "skip",
      "skipped",
      "shortened",
      "short",
      "early",
      "late",
      "cancel",
      "cancelled",
      "reschedule",
      "schedule",
      "transportation",
      "ride",
    ],
    reviewed: false,
  },
  {
    slug: "weight-fluid-swelling",
    titleEn: "Fluid & Swelling",
    titleEs: "Líquidos e Hinchazón",
    summaryEn:
      "Fluid, weight changes and swelling, and why these are important topics to discuss with your dialysis team.",
    /* The client's own text (2026-10-05), word for word. */
    educationEn: [
      "Changes in swelling or weight can be important information for your dialysis care team. Your dialysis team uses information about your weight, fluid status and dialysis treatments when managing your dialysis care.",
    ],
    questionsEn: [
      "Changes you've noticed since your last treatment",
      "Changes in your weight",
      "Changes in swelling",
      "Whether you completed your last dialysis treatment",
      "Questions about your prescribed fluid plan",
    ],
    keywords: [
      "fluid",
      "water",
      "weight",
      "gain",
      "swelling",
      "swollen",
      "swell",
      "feet",
      "foot",
      "ankles",
      "ankle",
      "legs",
      "leg",
      "puffy",
      "edema",
      "thirst",
      "thirsty",
      "dry",
    ],
    reviewed: true,
  },
  {
    slug: "blood-pressure",
    titleEn: "Blood Pressure Concerns",
    titleEs: "Inquietudes sobre la Presión Arterial",
    summaryEn:
      "Discussing changes in blood pressure or heart rate with your care team, particularly for home dialysis.",
    educationEn: [
      "Blood pressure and heart rate are part of the information your dialysis care team reviews. People on home dialysis may be asked to record these readings.",
    ],
    questionsEn: [
      "Changes in your blood pressure readings",
      "Changes in your heart rate",
      "How and when to take readings at home",
      "Questions about your blood pressure medicines",
    ],
    keywords: [
      "blood",
      "pressure",
      "bp",
      "hypertension",
      "high",
      "low",
      "heart",
      "rate",
      "pulse",
      "reading",
      "readings",
    ],
    reviewed: false,
  },
  {
    slug: "fever-chills-infection",
    titleEn: "Fever, Chills & Infection Concerns",
    titleEs: "Fiebre, Escalofríos e Infección",
    summaryEn:
      "General education about infection, and the importance of communicating illness or access changes.",
    educationEn: [
      "Infection is one of the topics your dialysis care team talks about with patients. Letting your team know about illness or changes at your access keeps them informed.",
    ],
    questionsEn: [
      "Fever or chills you have noticed",
      "Other signs of illness",
      "Changes at your access or catheter site",
      "Questions about preventing infection",
    ],
    keywords: [
      "fever",
      "temperature",
      "chills",
      "chill",
      "shaking",
      "infection",
      "infected",
      "sick",
      "ill",
      "illness",
      "flu",
      "cold",
    ],
    reviewed: false,
  },
  {
    slug: "medication-changes",
    titleEn: "Medication Changes",
    titleEs: "Cambios de Medicamentos",
    summaryEn:
      "New prescriptions, over-the-counter medicines, supplements, medication questions or medication changes.",
    educationEn: [
      "New prescriptions, over-the-counter medicines, supplements, and changes to your medicines are all things to discuss with your dialysis team.",
    ],
    questionsEn: [
      "New prescriptions from any doctor",
      "Over-the-counter medicines or supplements you have started",
      "Medicines you have stopped or changed",
      "Questions about your medicines",
    ],
    keywords: [
      "medication",
      "medications",
      "medicine",
      "medicines",
      "meds",
      "pill",
      "pills",
      "prescription",
      "drug",
      "otc",
      "supplement",
      "supplements",
      "vitamin",
      "binder",
      "dose",
    ],
    reviewed: false,
  },
  {
    slug: "recent-er-visit-or-hospitalization",
    titleEn: "Recent ER Visit or Hospitalization",
    titleEs: "Visita Reciente a Urgencias u Hospitalización",
    summaryEn:
      "Telling your dialysis team about a recent hospital stay, ER visit or significant change in your health.",
    educationEn: [
      "It is helpful for your dialysis team to know about recent emergency room visits, hospital stays, and significant changes in your health.",
    ],
    questionsEn: [
      "Dates of recent ER visits or hospital stays",
      "New diagnoses, tests or procedures",
      "New or changed medicines after your visit",
      "Instructions you were given when you left",
    ],
    keywords: [
      "er",
      "emergency",
      "room",
      "hospital",
      "hospitalized",
      "hospitalization",
      "admitted",
      "discharge",
      "discharged",
      "urgent",
      "visit",
    ],
    reviewed: false,
  },
  {
    slug: "treatment-concerns",
    titleEn: "Treatment Concerns",
    titleEs: "Inquietudes sobre el Tratamiento",
    summaryEn:
      "Questions about treatment time, dry weight, fluid removal, your dialysis schedule, or how you feel during or after treatment.",
    educationEn: [
      "Your dialysis team is the place for questions about your treatment time, dry weight, fluid removal, schedule, and how you feel during and after treatment.",
    ],
    questionsEn: [
      "Your treatment time and schedule",
      "Your dry weight",
      "Fluid removal during treatment",
      "How you feel during and after treatment",
    ],
    keywords: [
      "treatment",
      "treatments",
      "time",
      "dry",
      "weight",
      "removal",
      "removed",
      "uf",
      "schedule",
      "chair",
      "session",
      "during",
    ],
    reviewed: false,
  },
  {
    slug: "home-dialysis-concerns",
    titleEn: "Home Dialysis Concerns",
    titleEs: "Inquietudes de Diálisis en Casa",
    summaryEn:
      "Machine or supply problems, treatment problems, access concerns, missed treatments, or other issues your home dialysis team should know about.",
    educationEn: [
      "If you do dialysis at home, your home dialysis team is there for questions about your machine, supplies, treatments and access.",
    ],
    questionsEn: [
      "Machine alarms or problems",
      "Supply problems or shortages",
      "Treatments that were missed or could not be completed",
      "Concerns about your access",
      "Anything else your home team should know",
    ],
    keywords: [
      "home",
      "hhd",
      "pd",
      "peritoneal",
      "machine",
      "alarm",
      "alarms",
      "supplies",
      "supply",
      "cycler",
      "nxstage",
      "delivery",
    ],
    reviewed: false,
  },
];

export function topicBySlug(slug: string): BeforeTheErTopic | undefined {
  return BEFORE_THE_ER_TOPICS.find((topic) => topic.slug === slug);
}

const STOP = new Set([
  "a",
  "an",
  "and",
  "the",
  "my",
  "i",
  "is",
  "of",
  "to",
  "in",
  "on",
  "it",
  "have",
  "has",
  "am",
  "me",
  "with",
  "what",
  "why",
  "how",
  "do",
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !STOP.has(word));
}

/**
 * Retrieval only: the topics whose words share the most with the query, in
 * the library's own order when tied. It returns whole topics and nothing
 * else — no answer is composed, and a query that matches nothing returns
 * nothing. An empty query returns the whole library.
 */
export function searchTopics(query: string): BeforeTheErTopic[] {
  const terms = words(query);
  if (terms.length === 0) return BEFORE_THE_ER_TOPICS;
  return BEFORE_THE_ER_TOPICS.map((topic, order) => {
    const haystack = new Set([
      ...words(topic.titleEn),
      ...words(topic.summaryEn),
      ...topic.keywords,
    ]);
    const hits = terms.filter(
      (term) =>
        haystack.has(term) ||
        /* "swollen" finds "swelling"; "cramps" finds "cramping". */
        [...haystack].some(
          (word) =>
            term.length >= 4 &&
            word.length >= 4 &&
            (word.startsWith(term.slice(0, 4)) ||
              term.startsWith(word.slice(0, 4))),
        ),
    ).length;
    return { topic, hits, order };
  })
    .filter((row) => row.hits > 0)
    .sort((a, b) => b.hits - a.hits || a.order - b.order)
    .map((row) => row.topic);
}
