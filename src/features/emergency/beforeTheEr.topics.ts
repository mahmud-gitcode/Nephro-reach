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

   Every topic now carries the client's own text (2026-10-10), so all are
   `reviewed`; the flag stays for any topic added before its text is.
   ========================================================================== */

export type BeforeTheErPoint = { term: string; text: string };

export type BeforeTheErTopic = {
  slug: string;
  titleEn: string;
  titleEs: string;
  /** One line for the topic list. */
  summaryEn: string;
  /** The opening paragraphs. */
  educationEn: string[];
  /** The heading over the points, e.g. "Understanding your access". */
  pointsTitleEn: string;
  /** Term and explanation, e.g. "Thrill or buzz" — "A fistula or graft…". */
  pointsEn: BeforeTheErPoint[];
  /** "Things to discuss with your dialysis team". Empty when the topic
   *  splits them into groups instead. */
  questionsEn: string[];
  /** Separate lists, e.g. home hemodialysis and PD. */
  questionGroupsEn?: { title: string; items: string[] }[];
  /** A short box of its own, e.g. "Missed a treatment?". */
  noteEn?: { title: string; paragraphs: string[] };
  /** "Important safety information". */
  safetyEn: string[];
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

/** The client's text for every topic (2026-10-10), lightly condensed
 *  where it repeated itself: the closing "call 911 / do not wait for a
 *  portal response / messaging is not monitored" lines are said once, in
 *  the Emergency Information card and under Contact My Dialysis Clinic,
 *  rather than at the foot of every topic. */
export const BEFORE_THE_ER_TOPICS: BeforeTheErTopic[] = [
  {
    slug: "dialysis-access",
    titleEn: "Dialysis Access",
    titleEs: "Acceso de Diálisis",
    summaryEn:
      "How your access normally looks and feels, the thrill or buzz, signs of infection, catheter care and bleeding.",
    educationEn: [
      "Your dialysis access allows your blood to be cleaned during hemodialysis treatment. Common types include an arteriovenous (AV) fistula, AV graft, and dialysis catheter.",
      "Knowing what is normal for your access and recognizing changes can help you communicate concerns to your dialysis care team.",
    ],
    pointsTitleEn: "Understanding your access",
    pointsEn: [
      {
        term: "Appearance",
        text: "Be familiar with how your access normally looks and feels.",
      },
      {
        term: "Thrill or buzz",
        text: "A fistula or graft often has a vibration you can feel, called a thrill. Report changes or loss of this sensation promptly.",
      },
      {
        term: "Signs of possible infection",
        text: "Redness, warmth, swelling, pain, drainage, or fever should be reported promptly.",
      },
      {
        term: "Catheter care",
        text: "Ask your dialysis team about keeping your dressing clean, dry, and secure.",
      },
      {
        term: "Bleeding",
        text: "Ask your dialysis team how to manage minor bleeding after treatment and what to do in an emergency.",
      },
    ],
    questionsEn: [],
    noteEn: {
      title: "When to seek help",
      paragraphs: [
        "Contact your dialysis team promptly about new access concerns. Do not wait for a portal message response if a problem requires immediate attention.",
      ],
    },
    safetyEn: [
      "Heavy bleeding that does not stop, especially from a fistula or graft, is a medical emergency. Apply firm, direct pressure to the bleeding site and call 911.",
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
      "av",
      "vibration",
      "infection",
      "fever",
    ],
    reviewed: true,
  },
  {
    slug: "after-dialysis-concerns",
    titleEn: "After-Dialysis Concerns",
    titleEs: "Inquietudes Después de la Diálisis",
    summaryEn:
      "Fatigue, cramps, dizziness, nausea, headaches or weakness after treatment.",
    educationEn: [
      "It is not unusual to feel different after a dialysis treatment. Some people experience fatigue or other symptoms that may affect how they feel for the rest of the day.",
      "Understanding these experiences and communicating changes to your dialysis team is an important part of your care.",
    ],
    pointsTitleEn: "Common experiences after dialysis",
    pointsEn: [
      {
        term: "Fatigue",
        text: "Feeling tired or having less energy following treatment.",
      },
      {
        term: "Muscle cramps",
        text: "Cramping or discomfort during or after dialysis.",
      },
      {
        term: "Dizziness",
        text: "Feeling lightheaded or unsteady after treatment.",
      },
      {
        term: "Nausea",
        text: "Feeling sick to your stomach or experiencing vomiting.",
      },
      { term: "Headaches", text: "Head discomfort during or after dialysis." },
      {
        term: "Weakness",
        text: "Feeling less energetic or physically weak following treatment.",
      },
    ],
    questionsEn: [
      "How you typically feel after dialysis.",
      "New, recurring, or worsening symptoms.",
      "When symptoms begin and how long they last.",
      "Changes you have noticed between treatments.",
      "Any questions about your recovery after dialysis.",
    ],
    noteEn: {
      title: "Staying informed",
      paragraphs: [
        "Your dialysis team can help explain what may be contributing to symptoms and discuss your individual treatment needs.",
      ],
    },
    safetyEn: [
      "Severe symptoms such as chest pain, severe difficulty breathing, fainting with failure to recover promptly, or signs of stroke require emergency medical attention. Call 911.",
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
      "fatigue",
      "energy",
      "headaches",
    ],
    reviewed: true,
  },
  {
    slug: "missed-or-shortened-dialysis",
    titleEn: "Missed or Shortened Dialysis",
    titleEs: "Diálisis Perdida o Acortada",
    summaryEn:
      "Why completing treatment matters, and what to discuss after a missed or shortened session.",
    educationEn: [
      "Dialysis treatments are scheduled for a specific amount of time to help remove waste products and extra fluid from your body.",
      "Missing treatments or leaving early may affect how well dialysis removes waste and fluid, even when you feel fine.",
    ],
    pointsTitleEn: "Why completing dialysis matters",
    pointsEn: [
      {
        term: "Fluid buildup",
        text: "Missing dialysis may allow extra fluid to accumulate, potentially causing swelling, high blood pressure, or breathing difficulties.",
      },
      {
        term: "Potassium levels",
        text: "Dialysis helps remove excess potassium. High potassium can cause dangerous heart rhythm problems, sometimes without warning symptoms.",
      },
      {
        term: "Waste buildup",
        text: "Inadequate dialysis can allow waste products to accumulate, contributing to nausea, fatigue, or other health problems.",
      },
      {
        term: "Treatment effectiveness",
        text: "Completing your prescribed dialysis time helps you receive the treatment your healthcare team has planned.",
      },
    ],
    questionsEn: [
      "Treatments you have missed or ended early.",
      "Reasons you were unable to complete a treatment.",
      "Transportation, scheduling, or other challenges that affect attendance.",
      "How to arrange a missed or rescheduled treatment.",
      "Questions or concerns about your prescribed treatment schedule.",
    ],
    noteEn: {
      title: "Missed a treatment?",
      paragraphs: [
        "Contact your dialysis facility as soon as possible for guidance about rescheduling or next steps. Do not independently change your dialysis schedule or attempt to make up missed treatments without instructions from your care team.",
      ],
    },
    safetyEn: [
      "Missing dialysis can sometimes lead to serious complications, even without obvious symptoms. Chest pain, severe difficulty breathing, fainting, or other signs of a medical emergency require immediate emergency assistance. Call 911.",
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
      "potassium",
      "left",
    ],
    reviewed: true,
  },
  {
    slug: "weight-fluid-swelling",
    titleEn: "Fluid & Swelling",
    titleEs: "Líquidos e Hinchazón",
    summaryEn:
      "Weight changes, swelling, breathing changes, blood pressure and your dry weight.",
    educationEn: [
      "When your kidneys cannot remove enough fluid, extra fluid may build up in your body. Dialysis helps remove extra fluid, but changes in your weight and swelling can still occur between treatments.",
      "Understanding fluid balance can help you recognize changes and communicate important information to your dialysis care team.",
    ],
    pointsTitleEn: "Understanding fluid buildup",
    pointsEn: [
      {
        term: "Weight changes",
        text: "Rapid weight gain between treatments may be related to fluid buildup.",
      },
      {
        term: "Swelling",
        text: "Extra fluid may cause swelling in the feet, ankles, legs, hands, or around the eyes.",
      },
      {
        term: "Breathing changes",
        text: "Fluid buildup can sometimes affect breathing, particularly when lying down.",
      },
      {
        term: "Blood pressure",
        text: "Extra fluid may contribute to increased blood pressure.",
      },
      {
        term: "Dry weight",
        text: "Your dialysis team may use an estimated dry weight to help guide fluid removal during treatment.",
      },
    ],
    questionsEn: [
      "Changes in your weight since your last treatment.",
      "New or increasing swelling.",
      "Changes in your breathing or ability to lie flat.",
      "Your prescribed fluid allowance.",
      "Questions about your estimated dry weight.",
      "Difficulty managing thirst or following your fluid plan.",
    ],
    noteEn: {
      title: "Understanding your fluid plan",
      paragraphs: [
        "Your dialysis team determines your individual fluid recommendations based on your medical needs. Fluid allowances and dry weight goals may differ from person to person.",
        "Do not independently change your prescribed fluid allowance, dialysis schedule, or fluid removal goals.",
      ],
    },
    safetyEn: [
      "New or worsening swelling or breathing changes should be discussed promptly with your healthcare team. Severe difficulty breathing, chest pain, or other signs of a medical emergency require immediate assistance. Call 911.",
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
      "eyes",
    ],
    reviewed: true,
  },
  {
    slug: "blood-pressure",
    titleEn: "Blood Pressure Concerns",
    titleEs: "Inquietudes de Presión Arterial",
    summaryEn:
      "High and low blood pressure, heart rate, and changes around dialysis.",
    educationEn: [
      "Blood pressure measures the force of blood pushing against the walls of your blood vessels. Your blood pressure may change before, during, or after dialysis treatment.",
      "Monitoring your blood pressure and understanding your readings can help you communicate important information to your dialysis care team.",
    ],
    pointsTitleEn: "Understanding blood pressure",
    pointsEn: [
      {
        term: "High blood pressure",
        text: "May be associated with extra fluid in the body, certain medications, or other health conditions.",
      },
      {
        term: "Low blood pressure",
        text: "Can sometimes occur during or after dialysis and may be accompanied by dizziness, weakness, nausea, or lightheadedness.",
      },
      {
        term: "Heart rate",
        text: "Your pulse measures how many times your heart beats per minute. Your care team may review it along with blood pressure readings.",
      },
      {
        term: "Changes between treatments",
        text: "Blood pressure can vary throughout the day and between dialysis sessions.",
      },
    ],
    questionsEn: [
      "Changes in your usual blood pressure readings.",
      "Dizziness, weakness, headaches, or other concerns associated with blood pressure changes.",
      "When and how often to check your blood pressure at home.",
      "Questions about your prescribed blood pressure medications.",
      "Blood pressure changes during or after dialysis.",
      "How to properly record and share your readings.",
    ],
    noteEn: {
      title: "Understanding your blood pressure plan",
      paragraphs: [
        "Your healthcare team determines your individual blood pressure goals and medication plan.",
        "Do not stop, skip, or adjust prescribed blood pressure medications without instructions from your healthcare team.",
      ],
    },
    safetyEn: [
      "Very high or low blood pressure can sometimes be associated with serious health problems. Chest pain, severe difficulty breathing, fainting with failure to recover promptly, or signs of stroke require emergency medical assistance. Call 911.",
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
    reviewed: true,
  },
  {
    slug: "fever-chills-infection",
    titleEn: "Fever, Chills & Infection Concerns",
    titleEs: "Fiebre, Escalofríos e Infección",
    summaryEn:
      "Fever, chills, redness, swelling, drainage or feeling unusually unwell.",
    educationEn: [
      "People receiving dialysis may have an increased risk of infections, especially when using a dialysis catheter. Infections can occur at the dialysis access site or elsewhere in the body.",
      "Understanding possible signs of infection and knowing how to communicate concerns to your healthcare team are important parts of dialysis care.",
    ],
    pointsTitleEn: "Understanding possible signs of infection",
    pointsEn: [
      {
        term: "Fever",
        text: "An elevated body temperature may be a sign of infection.",
      },
      {
        term: "Chills or shaking",
        text: "Feeling unusually cold, shivering, or experiencing shaking chills can occur with infections.",
      },
      {
        term: "Redness or warmth",
        text: "Redness or increased warmth around a dialysis access site may indicate irritation or infection.",
      },
      {
        term: "Swelling or tenderness",
        text: "New swelling, discomfort, or pain around an access site should be brought to your care team's attention.",
      },
      {
        term: "Drainage",
        text: "Fluid or pus coming from a catheter exit site or access wound may be a sign of infection.",
      },
      {
        term: "Feeling unusually unwell",
        text: "Sudden weakness, unusual fatigue, or feeling significantly different from normal can sometimes accompany infection.",
      },
    ],
    questionsEn: [
      "Fever, chills, or shaking episodes.",
      "Changes in the appearance of your fistula, graft, or catheter site.",
      "Redness, drainage, swelling, or discomfort around your access.",
      "When you first noticed the changes.",
      "Questions about catheter dressing care and infection prevention.",
      "Any recent illness or hospitalization.",
    ],
    noteEn: {
      title: "Protecting your dialysis access",
      paragraphs: [
        "Your dialysis team can provide instructions about access hygiene, catheter dressing care, and infection prevention.",
        "Follow the care instructions provided by your dialysis facility. Do not remove or change a dialysis catheter dressing unless you have been trained and instructed to do so by your healthcare team.",
      ],
    },
    safetyEn: [
      "Fever, shaking chills, or signs of infection in a dialysis patient require prompt medical attention. Contact your dialysis team or healthcare provider immediately rather than waiting for a portal message response.",
      "Severe symptoms such as confusion, severe difficulty breathing, fainting, or signs of shock may indicate a medical emergency. Call 911.",
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
      "shivering",
      "unwell",
    ],
    reviewed: true,
  },
  {
    slug: "medication-changes",
    titleEn: "Medication Changes",
    titleEs: "Cambios de Medicamentos",
    summaryEn:
      "New prescriptions, over-the-counter medicines, supplements, and stopped or changed medications.",
    educationEn: [
      "Medications are an important part of managing your health while receiving dialysis. Some medications may need special consideration because kidney failure can affect how medicines are processed and removed from the body.",
      "Keeping your dialysis care team informed about medication changes helps them maintain an accurate understanding of your treatment.",
    ],
    pointsTitleEn: "Understanding medication changes",
    pointsEn: [
      {
        term: "New prescriptions",
        text: "Medications prescribed by another healthcare provider, including those started during a hospital visit.",
      },
      {
        term: "Over-the-counter medicines",
        text: "Products purchased without a prescription, including pain relievers, cold medicines, and antacids.",
      },
      {
        term: "Vitamins and supplements",
        text: "Herbal products, vitamins, and nutritional supplements may contain ingredients that require special consideration for dialysis patients.",
      },
      {
        term: "Stopped or changed medications",
        text: "Medications that have been discontinued or whose dose or schedule has changed.",
      },
      {
        term: "Medication concerns",
        text: "Side effects, difficulty obtaining medications, missed doses, or questions about how medicines are taken.",
      },
    ],
    questionsEn: [
      "New prescriptions from any healthcare provider.",
      "Medications started, stopped, or changed after hospitalization.",
      "Over-the-counter medicines, vitamins, or supplements you use or are considering.",
      "Questions about medication timing on dialysis days.",
      "Possible side effects or concerns about your medicines.",
      "Difficulty affording, obtaining, or taking prescribed medications.",
    ],
    noteEn: {
      title: "Keeping your medication information current",
      paragraphs: [
        "Maintain an updated list of your medications, including the name, dose, and how often you take each one.",
        "Share medication changes with your dialysis team and other healthcare providers. Your care team can review your medications and provide instructions specific to your medical needs.",
        "Do not start, stop, or change prescribed medications without guidance from an appropriate healthcare professional.",
      ],
    },
    safetyEn: [
      "Some medications can cause serious allergic reactions or other complications. Severe difficulty breathing, swelling of the tongue or throat, or loss of consciousness requires emergency assistance. Call 911.",
      "For urgent medication concerns, contact your healthcare provider or pharmacist directly rather than waiting for a portal message.",
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
      "vitamins",
      "pharmacist",
      "allergic",
    ],
    reviewed: true,
  },
  {
    slug: "recent-er-visit-or-hospitalization",
    titleEn: "Recent ER Visit or Hospitalization",
    titleEs: "Visita Reciente a Urgencias u Hospitalización",
    summaryEn:
      "What to share with your dialysis team after an ER visit or hospital stay.",
    educationEn: [
      "An emergency room visit or hospital stay may result in changes to your medications, dialysis schedule, or overall care plan.",
      "Keeping your dialysis team informed about recent hospital visits can help your healthcare providers communicate and coordinate your care.",
    ],
    pointsTitleEn: "Important information to share with your dialysis team",
    pointsEn: [
      {
        term: "Hospital visit details",
        text: "The name of the hospital, dates of your visit, and reason you received care.",
      },
      {
        term: "New diagnoses or procedures",
        text: "Any new health conditions, surgeries, tests, or procedures discussed during your visit.",
      },
      {
        term: "Medication changes",
        text: "Medicines that were started, stopped, or adjusted during your hospital stay.",
      },
      {
        term: "Dialysis treatments",
        text: "Any dialysis treatments received, missed, or changed while you were hospitalized.",
      },
      {
        term: "Discharge instructions",
        text: "Information provided when you left the hospital, including any changes to your care.",
      },
      {
        term: "Follow-up appointments",
        text: "Upcoming visits with specialists, your primary care provider, or other healthcare professionals.",
      },
    ],
    questionsEn: [
      "Changes to your dialysis schedule following hospitalization.",
      "New or discontinued medications.",
      "Any changes involving your dialysis access.",
      "Questions about your discharge instructions.",
      "Follow-up appointments or additional care coordination needs.",
    ],
    noteEn: {
      title: "Understanding your discharge information",
      paragraphs: [
        "When leaving the hospital, patients may receive a discharge summary or instructions explaining their care and recommended follow-up. Keeping a copy of these documents can help you communicate important information to your dialysis team.",
        "If you have recently been discharged, contact your dialysis facility directly to confirm your next scheduled treatment and communicate any relevant changes. Do not assume that the hospital has already shared all discharge information with your dialysis facility.",
      ],
    },
    safetyEn: [
      "If you experience a new medical emergency after leaving the hospital, call 911.",
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
      "summary",
    ],
    reviewed: true,
  },
  {
    slug: "treatment-concerns",
    titleEn: "Treatment Concerns",
    titleEs: "Inquietudes Sobre el Tratamiento",
    summaryEn:
      "Treatment time, schedule, dry weight, fluid removal and how treatment feels.",
    educationEn: [
      "Your dialysis treatment is designed around your individual healthcare needs. Your dialysis team determines your treatment schedule, prescribed treatment time, fluid removal goals, and other aspects of your care.",
      "Understanding your treatment plan can help you ask questions and communicate concerns with your dialysis team.",
    ],
    pointsTitleEn: "Understanding your dialysis treatment",
    pointsEn: [
      {
        term: "Treatment time",
        text: "The prescribed length of your dialysis session helps determine how much dialysis you receive.",
      },
      {
        term: "Treatment schedule",
        text: "Dialysis treatments follow a schedule established by your healthcare team. Missing or shortening treatments may affect how well dialysis removes waste and extra fluid.",
      },
      {
        term: "Estimated dry weight",
        text: "The weight your dialysis team uses as a guide when evaluating fluid balance and treatment goals.",
      },
      {
        term: "Fluid removal",
        text: "During hemodialysis, extra fluid is removed from your blood. Your healthcare team determines how much fluid should be removed based on your individual needs.",
      },
      {
        term: "Treatment experiences",
        text: "Some patients experience fatigue, cramping, dizziness, nausea, or other symptoms during or after treatment.",
      },
      {
        term: "Dialysis access",
        text: "Your fistula, graft, or catheter allows blood to travel through the dialysis circuit during hemodialysis.",
      },
    ],
    questionsEn: [
      "Questions about your prescribed treatment time or schedule.",
      "Concerns about your estimated dry weight.",
      "Questions about fluid removal during dialysis.",
      "Symptoms or discomfort during or after treatment.",
      "Difficulties completing your full treatment.",
      "Questions about your dialysis access.",
      "Transportation or scheduling challenges that interfere with treatment.",
    ],
    noteEn: {
      title: "Understanding your treatment plan",
      paragraphs: [
        "Your dialysis prescription is individualized and may change based on your healthcare needs.",
        "Only your authorized healthcare team should determine or approve changes to your dialysis prescription, treatment time, fluid removal goals, or schedule.",
      ],
    },
    safetyEn: [
      "New or worsening symptoms during or after dialysis should be brought to your healthcare team's attention promptly.",
      "Severe difficulty breathing, chest pain, loss of consciousness, or other signs of a medical emergency require immediate assistance. Call 911.",
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
      "prescription",
    ],
    reviewed: true,
  },
  {
    slug: "home-dialysis-concerns",
    titleEn: "Home Dialysis Concerns",
    titleEs: "Inquietudes de Diálisis en Casa",
    summaryEn:
      "Equipment, supplies, missed treatments and access for home hemodialysis (HHD) and peritoneal dialysis (PD).",
    educationEn: [
      "Home dialysis allows patients to receive treatment at home through home hemodialysis (HHD) or peritoneal dialysis (PD). Each treatment requires specific equipment, supplies, training, and safety precautions.",
    ],
    pointsTitleEn: "Understanding home dialysis concerns",
    pointsEn: [
      {
        term: "Equipment",
        text: "Machine alarms or equipment problems should be addressed according to your home dialysis training.",
      },
      {
        term: "Supplies",
        text: "Missing, damaged, or delayed supplies may interrupt treatment.",
      },
      {
        term: "Missed treatments",
        text: "Equipment issues, illness, or other challenges may prevent treatments from being completed.",
      },
      {
        term: "Dialysis access",
        text: "HHD uses a fistula, graft, or vascular catheter. PD uses a catheter in the abdomen.",
      },
      {
        term: "Treatment changes",
        text: "Report changes in how you feel during or after dialysis to your care team.",
      },
    ],
    questionsEn: [],
    questionGroupsEn: [
      {
        title:
          "Home hemodialysis (HHD): topics to discuss with your home dialysis team",
        items: [
          "Machine alarms or equipment concerns.",
          "Fistula, graft, or catheter problems.",
          "Treatment time and fluid removal questions.",
          "Missed or incomplete treatments.",
          "Water treatment systems, equipment, or supply concerns.",
        ],
      },
      {
        title: "Peritoneal dialysis (PD): topics to discuss with your PD team",
        items: [
          "Cycler alarms or equipment problems.",
          "Cloudy dialysis drainage.",
          "Abdominal pain or discomfort.",
          "Redness, drainage, or tenderness around the catheter.",
          "Supply or connection problems.",
          "Missed or interrupted exchanges.",
        ],
      },
    ],
    noteEn: {
      title: "Staying connected with your care team",
      paragraphs: [
        "Your home dialysis team provides treatment instructions, equipment guidance, and emergency procedures. NephroReach supports education and communication but does not replace your dialysis team's instructions.",
      ],
    },
    safetyEn: [
      "Follow your home dialysis training for equipment problems, access concerns, or interrupted treatments. Contact your dialysis team directly for time-sensitive concerns.",
      "Cloudy PD drainage, abdominal pain, fever, or chills may indicate a serious infection. Contact your PD team or healthcare provider immediately.",
      "Call 911 for severe bleeding, chest pain, severe difficulty breathing, loss of consciousness, or other medical emergencies.",
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
      "cloudy",
      "exchange",
      "exchanges",
      "abdominal",
      "water",
    ],
    reviewed: true,
  },
  {
    slug: "access-dressing-concerns",
    titleEn: "Dialysis Access Dressing Concerns",
    titleEs: "Inquietudes con el Apósito del Acceso",
    summaryEn:
      "A catheter dressing that is loose, falls off, gets wet or dirty, or irritates the skin.",
    educationEn: [
      "Dialysis access dressings help protect catheter sites and reduce the risk of infection. Dressings should remain clean, dry, and secure. A loose, wet, damaged, or missing dressing may expose the access site to bacteria.",
    ],
    pointsTitleEn: "Understanding dressing concerns",
    pointsEn: [
      {
        term: "Loose dressing",
        text: "A dressing that begins peeling away may no longer protect the catheter site properly.",
      },
      {
        term: "Dressing falls off",
        text: "An exposed catheter site may increase the risk of infection.",
      },
      {
        term: "Wet or dirty dressing",
        text: "Moisture or contamination can affect the dressing's protective barrier.",
      },
      {
        term: "Skin irritation",
        text: "Redness, itching, or discomfort around the dressing may occur.",
      },
      {
        term: "Drainage or bleeding",
        text: "Blood, fluid, or unusual drainage around the catheter site should be reported.",
      },
    ],
    questionsEn: [
      "Dressings that become loose or fall off.",
      "Wet, dirty, or damaged dressings.",
      "Redness, swelling, pain, or drainage around the catheter.",
      "Difficulty keeping dressings secure.",
      "Questions about dressing changes and catheter care.",
    ],
    noteEn: {
      title: "What if your dressing falls off?",
      paragraphs: [
        "A missing or damaged catheter dressing should be addressed promptly. Follow the catheter care instructions provided by your dialysis team. Contact your dialysis facility directly for guidance about replacing or securing the dressing.",
        "Avoid touching the exposed catheter site, and do not attempt to change the dressing unless your dialysis team has trained and authorized you to do so.",
      ],
    },
    safetyEn: [
      "A missing dressing may increase the risk of infection. Contact your dialysis team promptly if your catheter dressing falls off, becomes wet, or no longer covers the site.",
      "Fever, chills, redness, swelling, pain, or drainage may indicate infection and require prompt medical attention.",
      "Call 911 for severe bleeding, severe difficulty breathing, loss of consciousness, or other medical emergencies.",
    ],
    keywords: [
      "dressing",
      "bandage",
      "tape",
      "loose",
      "fell",
      "falls",
      "off",
      "wet",
      "dirty",
      "itching",
      "exposed",
      "catheter",
    ],
    reviewed: true,
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
