import type { TableTalkCategory, TableTalkEpisode } from "./tableTalk.types";

/* ==========================================================================
   Dialysis Table Talk — the starting shelf
   --------------------------------------------------------------------------
   The categories are the fifteen from the brief, seeded once so the admin
   opens a working screen rather than an empty one. They are ordinary records
   from that moment on: renameable, reorderable, archivable, and joinable by
   new ones without a developer.

   The episodes below are EXAMPLES, so the page can be seen and shown before
   any real recording exists. Every id starts `ep-sample-`, which is what the
   admin screen uses to offer to clear them in one go. Replace or archive them
   before launch.

   Their video paths point at files that are not in the repo, so the player
   opens on the poster frame and plays nothing. That is deliberate: the
   alternative is shipping a fake recording that looks like real medical
   guidance.
   ========================================================================== */

/** Any episode whose id starts with this is example content, not real. */
export const SAMPLE_PREFIX = "ep-sample-";

export const SEED_CATEGORIES: TableTalkCategory[] = [
  ["Life on Dialysis", "La Vida en Diálisis"],
  ["Understanding Labs", "Entender los Laboratorios"],
  ["Nutrition & Diet", "Nutrición y Dieta"],
  ["Dialysis Access Care", "Cuidado del Acceso"],
  ["Treatment Complications", "Complicaciones del Tratamiento"],
  ["Home Hemodialysis", "Hemodiálisis en Casa"],
  ["Peritoneal Dialysis", "Diálisis Peritoneal"],
  ["Travel & Transient Dialysis", "Viajes y Diálisis Temporal"],
  ["Mental Health & Wellness", "Salud Mental y Bienestar"],
  ["Caregiver Support", "Apoyo al Cuidador"],
  ["Transplant Talk", "Hablemos de Trasplante"],
  ["Medication Education", "Educación sobre Medicamentos"],
  ["Ask the Expert", "Pregunta al Experto"],
  ["Before The ER", "Antes de Urgencias"],
  ["Life Beyond the Chair", "La Vida Más Allá del Sillón"],
].map(([labelEn, labelEs], order) => ({
  id: `cat-${order + 1}`,
  labelEn,
  labelEs,
  order,
  archived: false,
}));

/* One image across every example. They are placeholders, and eight
   different stock photos would imply eight real recordings.

   It is the Table Talk still rather than the Classroom's, so an admin
   opening the editor sees the shape of a real episode card — 16:9, the host
   and guest at a table — instead of a lesson slide borrowed from another
   feature. */
const THUMBNAIL = "/images/table-talk/episode-thumbnail.jpg";

const cat = (labelEn: string) =>
  SEED_CATEGORIES.find((entry) => entry.labelEn === labelEn)?.id ?? "";

/* A short, real WebVTT file on the featured episode, so the CC badge, the
   caption track and the browser's own subtitle menu all have something to
   show rather than being described in a comment. */
const TRAVEL_CAPTIONS_EN = `WEBVTT

00:00:01.000 --> 00:00:06.000
Most people wait too long to ask. Four to six weeks is comfortable.

00:00:06.000 --> 00:00:12.500
Two weeks is possible. Two days, and you are relying on luck.

00:00:12.500 --> 00:00:19.000
Your unit sends your records ahead. You do not carry them yourself.

00:00:19.000 --> 00:00:25.000
What you do carry is your medication list, and your access details.
`;

const TRAVEL_CAPTIONS_ES = `WEBVTT

00:00:01.000 --> 00:00:06.000
Casi todos esperan demasiado para preguntar. De cuatro a seis semanas es cómodo.

00:00:06.000 --> 00:00:12.500
Dos semanas se puede. Dos días, y dependes de la suerte.

00:00:12.500 --> 00:00:19.000
Tu unidad envía tus registros. No los llevas tú.

00:00:19.000 --> 00:00:25.000
Lo que sí llevas es tu lista de medicamentos y los datos de tu acceso.
`;

const TRAVEL_TRANSCRIPT_EN = `Most people wait too long to ask. Four to six weeks before you travel is comfortable for everyone. Two weeks is possible. Two days, and you are relying on luck and on somebody having a cancellation.

Your own unit sends your records ahead — your prescription, your recent labs, your access details. You do not carry those yourself and you should not be asked to.

What you do carry is a written medication list, the name and number of your home unit, and something that says what kind of access you have. Put it in your hand luggage, not your case.

If the receiving centre changes your chair time, they will tell your home unit, and your home unit tells you. Nothing about your prescription changes because you are on holiday.`;

export const SEED_EPISODES: TableTalkEpisode[] = [
  {
    id: `${SAMPLE_PREFIX}1`,
    slug: "getting-ready-for-travel-dialysis",
    titleEn: "Getting Ready for Travel Dialysis",
    titleEs: "Prepararse para la Diálisis en Viaje",
    descriptionEn:
      "Tips for a safe and smooth trip: how far ahead to ask, what your unit sends for you, and the one page worth keeping in your hand luggage.",
    descriptionEs:
      "Consejos para un viaje seguro: con cuánta anticipación pedirlo, qué envía tu unidad y la hoja que conviene llevar en el equipaje de mano.",
    speakers: [
      { id: "sp-1", name: "Dr. Amara Osei", role: "Nephrologist" },
      { id: "sp-2", name: "Denise Park", role: "Host, NephroReach" },
    ],
    categoryIds: [cat("Travel & Transient Dialysis"), cat("Ask the Expert")],
    audience: "both",
    thumbnail: THUMBNAIL,
    videoSrc: "/videos/table-talk-travel-dialysis.mp4",
    durationSeconds: 1104,
    captions: { en: TRAVEL_CAPTIONS_EN, es: TRAVEL_CAPTIONS_ES },
    transcriptEn: TRAVEL_TRANSCRIPT_EN,
    isShort: false,
    isLiveEvent: false,
    featured: true,
    status: "published",
    publishedAt: "2026-09-10",
    order: 0,
  },
  {
    id: `${SAMPLE_PREFIX}2`,
    slug: "the-day-after-treatment",
    titleEn: "The Day After Treatment",
    titleEs: "El Día Después del Tratamiento",
    descriptionEn:
      "Why recovery takes as long as it does, and how three members plan their week around it.",
    descriptionEs:
      "Por qué la recuperación tarda lo que tarda y cómo tres miembros organizan su semana.",
    speakers: [
      { id: "sp-3", name: "Ray Mitchell", role: "Patient Advocate" },
      { id: "sp-4", name: "Denise Park", role: "Host, NephroReach" },
    ],
    categoryIds: [cat("Life Beyond the Chair"), cat("Life on Dialysis")],
    audience: "patients",
    thumbnail: THUMBNAIL,
    videoSrc: "/videos/table-talk-day-after.mp4",
    durationSeconds: 892,
    captions: {
      en: "WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nThe first six hours are the ones to plan around.\n",
    },
    isShort: false,
    isLiveEvent: false,
    featured: false,
    status: "published",
    publishedAt: "2026-09-03",
    order: 1,
  },
  {
    id: `${SAMPLE_PREFIX}3`,
    slug: "what-your-phosphorus-number-means",
    titleEn: "What Your Phosphorus Number Means",
    titleEs: "Qué Significa Tu Nivel de Fósforo",
    descriptionEn:
      "Two minutes on the number members ask about most, and why binders have to go with the food.",
    descriptionEs:
      "Dos minutos sobre el número que más preguntan y por qué los quelantes van con la comida.",
    speakers: [
      { id: "sp-5", name: "Marta Reyes, RD", role: "Renal Dietitian" },
    ],
    categoryIds: [cat("Understanding Labs"), cat("Nutrition & Diet")],
    audience: "both",
    thumbnail: THUMBNAIL,
    videoSrc: "/videos/table-talk-phosphorus.mp4",
    durationSeconds: 138,
    captions: {
      en: "WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nPhosphorus binders work in the stomach, not the blood.\n",
    },
    isShort: true,
    isLiveEvent: false,
    featured: false,
    status: "published",
    publishedAt: "2026-08-27",
    order: 2,
  },
  {
    id: `${SAMPLE_PREFIX}4`,
    slug: "caring-for-someone-on-dialysis",
    titleEn: "Caring for Someone on Dialysis",
    titleEs: "Cuidar a Alguien en Diálisis",
    descriptionEn:
      "A live conversation for the family members who drive, cook, and keep track of everything.",
    descriptionEs:
      "Una conversación en vivo para los familiares que conducen, cocinan y llevan la cuenta de todo.",
    speakers: [
      { id: "sp-6", name: "Joyce Adebayo, LCSW", role: "Renal Social Worker" },
    ],
    categoryIds: [cat("Caregiver Support"), cat("Mental Health & Wellness")],
    audience: "caregivers",
    thumbnail: THUMBNAIL,
    videoSrc: "/videos/table-talk-caregivers.mp4",
    durationSeconds: 2410,
    captions: {},
    isShort: false,
    isLiveEvent: true,
    featured: false,
    status: "published",
    publishedAt: "2026-08-20",
    order: 3,
  },
  {
    id: `${SAMPLE_PREFIX}5`,
    slug: "protecting-your-access",
    titleEn: "Protecting Your Access",
    titleEs: "Cómo Proteger Tu Acceso",
    descriptionEn:
      "The daily thrill check, the sleeve rule, and the three things that should never touch that arm.",
    descriptionEs:
      "La revisión diaria del frémito, la regla de la manga y las tres cosas que nunca deben tocar ese brazo.",
    speakers: [
      { id: "sp-7", name: "Nurse Elena Vargas", role: "Access Coordinator" },
    ],
    categoryIds: [cat("Dialysis Access Care"), cat("Before The ER")],
    audience: "both",
    thumbnail: THUMBNAIL,
    videoSrc: "/videos/table-talk-access.mp4",
    durationSeconds: 164,
    captions: {
      es: "WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nRevisa el frémito cada mañana.\n",
    },
    isShort: true,
    isLiveEvent: false,
    featured: false,
    status: "published",
    publishedAt: "2026-08-13",
    order: 4,
  },
  {
    id: `${SAMPLE_PREFIX}6`,
    slug: "starting-home-hemodialysis",
    titleEn: "Starting Home Hemodialysis",
    titleEs: "Empezar la Hemodiálisis en Casa",
    descriptionEn:
      "What the training period is really like, from someone eighteen months in.",
    descriptionEs:
      "Cómo es de verdad el periodo de entrenamiento, contado por alguien con dieciocho meses de experiencia.",
    speakers: [{ id: "sp-8", name: "Tomas Lindgren", role: "Home HD Patient" }],
    categoryIds: [cat("Home Hemodialysis"), cat("Life on Dialysis")],
    audience: "patients",
    thumbnail: THUMBNAIL,
    videoSrc: "/videos/table-talk-home-hd.mp4",
    durationSeconds: 1536,
    captions: {},
    isShort: false,
    isLiveEvent: false,
    featured: false,
    status: "published",
    publishedAt: "2026-08-06",
    order: 5,
  },
  {
    id: `${SAMPLE_PREFIX}7`,
    slug: "the-transplant-list-explained",
    titleEn: "The Transplant List, Explained",
    titleEs: "La Lista de Trasplante, Explicada",
    descriptionEn:
      "How referral, work-up and waiting actually work — and what you can do while you wait.",
    descriptionEs:
      "Cómo funcionan la derivación, la evaluación y la espera, y qué puedes hacer mientras tanto.",
    speakers: [
      { id: "sp-9", name: "Dr. Amara Osei", role: "Nephrologist" },
      { id: "sp-10", name: "Priya Raman", role: "Transplant Coordinator" },
    ],
    categoryIds: [cat("Transplant Talk"), cat("Ask the Expert")],
    audience: "both",
    thumbnail: THUMBNAIL,
    videoSrc: "/videos/table-talk-transplant.mp4",
    durationSeconds: 1822,
    captions: {
      en: "WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nReferral and listing are two different steps.\n",
    },
    isShort: false,
    isLiveEvent: false,
    featured: false,
    status: "published",
    publishedAt: "2026-07-30",
    order: 6,
  },
  {
    id: `${SAMPLE_PREFIX}8`,
    slug: "when-cramping-starts",
    titleEn: "When Cramping Starts",
    titleEs: "Cuando Empiezan los Calambres",
    descriptionEn:
      "Why it happens mid-session, what your nurse can adjust, and when it is worth reporting.",
    descriptionEs:
      "Por qué ocurre a mitad de sesión, qué puede ajustar tu enfermera y cuándo vale la pena reportarlo.",
    speakers: [
      { id: "sp-11", name: "Nurse Elena Vargas", role: "Access Coordinator" },
    ],
    categoryIds: [cat("Treatment Complications"), cat("Life on Dialysis")],
    audience: "patients",
    thumbnail: THUMBNAIL,
    videoSrc: "/videos/table-talk-cramping.mp4",
    durationSeconds: 726,
    captions: {},
    isShort: false,
    isLiveEvent: false,
    featured: false,
    status: "published",
    publishedAt: "2026-07-23",
    order: 7,
  },
  {
    /* One scheduled episode, so the admin screen shows what scheduling looks
       like and the member shelf shows that it is correctly held back. */
    id: `${SAMPLE_PREFIX}9`,
    slug: "eating-out-on-a-renal-diet",
    titleEn: "Eating Out on a Renal Diet",
    titleEs: "Comer Fuera con una Dieta Renal",
    descriptionEn:
      "Ordering without interrogating the waiter: what to ask for, and what to leave.",
    descriptionEs: "Pedir sin interrogar al mesero: qué pedir y qué dejar.",
    speakers: [
      { id: "sp-12", name: "Marta Reyes, RD", role: "Renal Dietitian" },
    ],
    categoryIds: [cat("Nutrition & Diet"), cat("Life Beyond the Chair")],
    audience: "both",
    thumbnail: THUMBNAIL,
    videoSrc: "/videos/table-talk-eating-out.mp4",
    durationSeconds: 645,
    captions: {},
    isShort: false,
    isLiveEvent: false,
    featured: false,
    status: "scheduled",
    publishAt: "2026-12-01",
    publishedAt: "2026-12-01",
    order: 8,
  },
];
