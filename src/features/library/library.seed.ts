import type { LibraryCategory, LibraryResource } from "./library.types";

/* ==========================================================================
   My Library — the starting shelf
   --------------------------------------------------------------------------
   Placeholder content until the admin-side Library management screen lands
   and real uploads replace it. The shapes are realistic on purpose: videos
   run 90-150 seconds, documents are one- or two-page handouts, and articles
   are short enough to read on a phone in a waiting room.
   ========================================================================== */

const POSTER = "/images/Class.jpg";

/** Category chips, in the order they appear above the grid. */
export const LIBRARY_CATEGORIES: {
  key: LibraryCategory;
  labelEn: string;
  labelEs: string;
}[] = [
  {
    key: "dialysis-basics",
    labelEn: "Dialysis Basics",
    labelEs: "Conceptos Básicos",
  },
  { key: "nutrition", labelEn: "Nutrition", labelEs: "Nutrición" },
  {
    key: "labs",
    labelEn: "Understanding Labs",
    labelEs: "Entender los Laboratorios",
  },
  { key: "access-care", labelEn: "Access Care", labelEs: "Cuidado del Acceso" },
  { key: "medications", labelEn: "Medications", labelEs: "Medicamentos" },
  { key: "emergencies", labelEn: "Emergencies", labelEs: "Emergencias" },
  { key: "living-well", labelEn: "Living Well", labelEs: "Vivir Bien" },
];

export const SEED_LIBRARY_RESOURCES: LibraryResource[] = [
  {
    id: "lib-01",
    slug: "what-happens-during-a-treatment",
    kind: "video",
    category: "dialysis-basics",
    titleEn: "What Happens During a Treatment",
    titleEs: "Qué Sucede Durante un Tratamiento",
    summaryEn:
      "A ninety-second walk through a single session, from weigh-in to the last set of vitals.",
    summaryEs:
      "Un recorrido de noventa segundos por una sesión, desde el pesaje hasta los últimos signos vitales.",
    poster: POSTER,
    videoSrc: "/videos/library-treatment-walkthrough.mp4",
    durationSeconds: 95,
    publishedAt: "2026-08-04",
  },
  {
    id: "lib-02",
    slug: "reading-your-dry-weight",
    kind: "video",
    category: "dialysis-basics",
    titleEn: "Reading Your Dry Weight",
    titleEs: "Entender Tu Peso Seco",
    summaryEn:
      "Why the number moves between treatments, and what a two-kilogram jump is telling you.",
    summaryEs:
      "Por qué el número cambia entre tratamientos y qué significa un aumento de dos kilogramos.",
    poster: POSTER,
    videoSrc: "/videos/library-dry-weight.mp4",
    durationSeconds: 128,
    publishedAt: "2026-07-22",
  },
  {
    id: "lib-03",
    slug: "potassium-at-the-grocery-store",
    kind: "video",
    category: "nutrition",
    titleEn: "Potassium at the Grocery Store",
    titleEs: "El Potasio en el Supermercado",
    summaryEn:
      "Swaps that keep meals familiar, aisle by aisle, without a calculator.",
    summaryEs:
      "Cambios que mantienen las comidas familiares, pasillo por pasillo y sin calculadora.",
    poster: POSTER,
    videoSrc: "/videos/library-potassium.mp4",
    durationSeconds: 112,
    publishedAt: "2026-07-09",
  },
  {
    id: "lib-04",
    slug: "low-potassium-grocery-list",
    kind: "document",
    category: "nutrition",
    titleEn: "Low-Potassium Grocery List",
    titleEs: "Lista de Compras Baja en Potasio",
    summaryEn:
      "One page to fold into a wallet: safer picks, portion sizes, and what to leave on the shelf.",
    summaryEs:
      "Una página para llevar en la cartera: opciones seguras, porciones y qué dejar en el estante.",
    poster: POSTER,
    fileSrc: "/documents/low-potassium-grocery-list.pdf",
    fileMetaEn: "PDF · 1 page",
    fileMetaEs: "PDF · 1 página",
    publishedAt: "2026-06-30",
  },
  {
    id: "lib-05",
    slug: "fluid-tracking-worksheet",
    kind: "document",
    category: "nutrition",
    titleEn: "Fluid Tracking Worksheet",
    titleEs: "Hoja de Control de Líquidos",
    summaryEn:
      "A printable week of fluid columns, for members who would rather write it down than tap it in.",
    summaryEs:
      "Una semana imprimible de columnas de líquidos, para quienes prefieren anotarlo a mano.",
    poster: POSTER,
    fileSrc: "/documents/fluid-tracking-worksheet.pdf",
    fileMetaEn: "PDF · 2 pages",
    fileMetaEs: "PDF · 2 páginas",
    publishedAt: "2026-06-18",
  },
  {
    id: "lib-06",
    slug: "what-your-lab-numbers-mean",
    kind: "article",
    category: "labs",
    titleEn: "What Your Lab Numbers Mean",
    titleEs: "Qué Significan Tus Resultados de Laboratorio",
    summaryEn:
      "Hemoglobin, phosphorus, albumin and Kt/V, in the words a member would actually use.",
    summaryEs:
      "Hemoglobina, fósforo, albúmina y Kt/V, explicados en palabras corrientes.",
    poster: POSTER,
    readMinutes: 4,
    bodyEn: [
      "A monthly lab panel can look like a wall of numbers, but most of it comes down to four questions: is there enough oxygen being carried, is the phosphorus under control, is nutrition holding, and is the treatment clearing enough.",
      "Hemoglobin answers the first. When it drops, fatigue usually arrives before anything else does, which is why a member often notices it before the panel confirms it.",
      "Phosphorus answers the second, and it is the number most tied to what was eaten between draws. A single high result is worth watching; three in a row is worth a conversation about binders and timing.",
      "Albumin is the nutrition signal and Kt/V is the clearance one. Neither moves quickly, so read them as a trend across several months rather than as a verdict on one month.",
      "Bring the numbers you do not understand to your care team, and write the question down before the appointment. The Care Team Questions page is there for exactly that.",
    ],
    bodyEs: [
      "Un panel mensual de laboratorio puede parecer un muro de números, pero casi todo se reduce a cuatro preguntas: si se transporta suficiente oxígeno, si el fósforo está controlado, si la nutrición se mantiene y si el tratamiento limpia lo suficiente.",
      "La hemoglobina responde la primera. Cuando baja, el cansancio suele aparecer antes que cualquier otra señal, y por eso muchas personas lo notan antes de que el panel lo confirme.",
      "El fósforo responde la segunda y es el número más ligado a lo que se comió entre extracciones. Un resultado alto vale la pena vigilarlo; tres seguidos merecen una conversación sobre los quelantes y sus horarios.",
      "La albúmina es la señal de nutrición y el Kt/V es la de limpieza. Ninguna cambia rápido, así que conviene leerlas como una tendencia de varios meses y no como un veredicto de un solo mes.",
      "Lleva los números que no entiendas a tu equipo de atención y escribe la pregunta antes de la cita: la página de Preguntas al Equipo existe justo para eso.",
    ],
    publishedAt: "2026-06-02",
  },
  {
    id: "lib-07",
    slug: "protecting-your-fistula",
    kind: "video",
    category: "access-care",
    titleEn: "Protecting Your Fistula",
    titleEs: "Cómo Proteger Tu Fístula",
    summaryEn:
      "The daily thrill check, the sleeve rule, and the three things that should never touch that arm.",
    summaryEs:
      "La revisión diaria del frémito, la regla de la manga y las tres cosas que nunca deben tocar ese brazo.",
    poster: POSTER,
    videoSrc: "/videos/library-fistula-care.mp4",
    durationSeconds: 104,
    publishedAt: "2026-05-27",
  },
  {
    id: "lib-08",
    slug: "catheter-site-care-handout",
    kind: "document",
    category: "access-care",
    titleEn: "Catheter Site Care Handout",
    titleEs: "Guía de Cuidado del Sitio del Catéter",
    summaryEn:
      "Keeping the dressing dry, spotting an infection early, and who to call when you do.",
    summaryEs:
      "Mantener el apósito seco, detectar una infección a tiempo y a quién llamar cuando ocurre.",
    poster: POSTER,
    fileSrc: "/documents/catheter-site-care.pdf",
    fileMetaEn: "PDF · 2 pages",
    fileMetaEs: "PDF · 2 páginas",
    publishedAt: "2026-05-12",
  },
  {
    id: "lib-09",
    slug: "why-binders-are-taken-with-food",
    kind: "article",
    category: "medications",
    titleEn: "Why Binders Are Taken With Food",
    titleEs: "Por Qué los Quelantes se Toman con la Comida",
    summaryEn:
      "A binder taken an hour after lunch has already missed the meal it was meant to catch.",
    summaryEs:
      "Un quelante tomado una hora después del almuerzo ya perdió la comida que debía atrapar.",
    poster: POSTER,
    readMinutes: 3,
    bodyEn: [
      "A phosphate binder does its work in the stomach, not in the bloodstream. It attaches to the phosphorus in a meal so that the phosphorus leaves the body with the meal rather than entering it.",
      "That is the whole reason timing matters. Taken with the first bites, the binder is in place when the food arrives. Taken an hour later, the phosphorus has already been absorbed and the dose has nothing left to bind.",
      "Snacks count. A binder schedule built only around three meals will miss the evening snack that quietly carries as much phosphorus as dinner did.",
      "If a dose is regularly missed because it is not nearby at mealtimes, that is a logistics problem with a logistics answer: a second bottle where you eat. Log the misses in your medication log so the pattern is visible to your team.",
    ],
    bodyEs: [
      "Un quelante de fosfato actúa en el estómago, no en la sangre. Se une al fósforo de la comida para que salga del cuerpo junto con ella en lugar de absorberse.",
      "Por eso el horario importa tanto. Tomado con los primeros bocados, el quelante ya está en su lugar cuando llega la comida. Tomado una hora después, el fósforo ya se absorbió y a la dosis no le queda nada que atrapar.",
      "Los bocadillos cuentan. Un horario pensado solo para tres comidas pasa por alto la merienda de la noche, que muchas veces lleva tanto fósforo como la cena.",
      "Si olvidas la dosis porque no la tienes cerca a la hora de comer, es un problema logístico con una solución logística: un segundo frasco donde comes. Registra los olvidos en tu registro de medicamentos para que tu equipo vea el patrón.",
    ],
    publishedAt: "2026-04-28",
  },
  {
    id: "lib-10",
    slug: "warning-signs-that-cannot-wait",
    kind: "video",
    category: "emergencies",
    titleEn: "Warning Signs That Cannot Wait",
    titleEs: "Señales de Alarma Que No Pueden Esperar",
    summaryEn:
      "Two minutes on the symptoms that mean the emergency room now, not the next treatment.",
    summaryEs:
      "Dos minutos sobre los síntomas que significan sala de urgencias ahora, no en el próximo tratamiento.",
    poster: POSTER,
    videoSrc: "/videos/library-warning-signs.mp4",
    durationSeconds: 138,
    publishedAt: "2026-04-15",
  },
  {
    id: "lib-11",
    slug: "emergency-contact-card",
    kind: "document",
    category: "emergencies",
    titleEn: "Emergency Contact Card",
    titleEs: "Tarjeta de Contactos de Emergencia",
    summaryEn:
      "Print it, fill it in, keep it in a wallet: clinic, nephrologist, access surgeon, dry weight.",
    summaryEs:
      "Imprímela, complétala y guárdala en la cartera: clínica, nefrólogo, cirujano de acceso y peso seco.",
    poster: POSTER,
    fileSrc: "/documents/emergency-contact-card.pdf",
    fileMetaEn: "PDF · 1 page",
    fileMetaEs: "PDF · 1 página",
    publishedAt: "2026-03-30",
  },
  {
    id: "lib-12",
    slug: "getting-through-the-day-after",
    kind: "article",
    category: "living-well",
    titleEn: "Getting Through the Day After",
    titleEs: "Cómo Sobrellevar el Día Siguiente",
    summaryEn:
      "Post-treatment fatigue is normal, predictable, and easier to plan around than to fight.",
    summaryEs:
      "El cansancio después del tratamiento es normal y predecible, y es más fácil planificarlo que combatirlo.",
    poster: POSTER,
    readMinutes: 3,
    bodyEn: [
      "Most members feel flattest in the four to six hours after a run, and better by the next morning. Knowing that shape in advance turns an alarming afternoon into an expected one.",
      "Plan the demanding part of the day before treatment rather than after it. Errands, appointments and anything that needs concentration go on the front half.",
      "Hydration, food and rest in the hours afterwards do more than pushing through does. If the fatigue is still there two days later, or arrives with cramping or dizziness, that is a change worth logging and reporting.",
      "Your between-treatment check-in is the place to record it. A pattern across several weeks says far more to a care team than one bad Tuesday does.",
    ],
    bodyEs: [
      "La mayoría se siente peor en las cuatro a seis horas después de una sesión y mejor a la mañana siguiente. Conocer esa curva de antemano convierte una tarde alarmante en una tarde esperada.",
      "Planifica la parte exigente del día antes del tratamiento y no después. Los mandados, las citas y todo lo que requiera concentración van en la primera mitad.",
      "La hidratación, la comida y el descanso en las horas siguientes ayudan más que forzar el cuerpo. Si el cansancio sigue dos días después, o llega con calambres o mareos, es un cambio que vale la pena registrar y reportar.",
      "Tu registro entre tratamientos es el lugar para anotarlo. Un patrón de varias semanas le dice mucho más a tu equipo que un solo martes malo.",
    ],
    publishedAt: "2026-03-11",
  },
];
