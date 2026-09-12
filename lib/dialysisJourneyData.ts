/**
 * Content for the 21-Day Dialysis Journey shown in the Education Center.
 *
 * Every learner-facing string ships in both languages (`*En` / `*Es`) so the
 * player, the transcript and the resource panel can switch with the language
 * toggle without refetching anything.
 */

export type JourneyPhaseKey = "foundation" | "management" | "living";

export interface JourneyPhase {
  key: JourneyPhaseKey;
  labelEn: string;
  labelEs: string;
  rangeEn: string;
  rangeEs: string;
  /** Tailwind classes for the phase chip in the day list. */
  chipClass: string;
  dotClass: string;
}

export interface TranscriptCue {
  /** Seconds into the video. Doubles as the visible timestamp. */
  at: number;
  textEn: string;
  textEs: string;
}

export type JourneyDocumentKind = "pdf" | "checklist" | "worksheet";

export interface JourneyDocument {
  id: string;
  titleEn: string;
  titleEs: string;
  kind: JourneyDocumentKind;
  metaEn: string;
  metaEs: string;
}

export interface JourneyDay {
  day: number;
  slug: string;
  phase: JourneyPhaseKey;
  titleEn: string;
  titleEs: string;
  summaryEn: string;
  summaryEs: string;
  durationMinutes: number;
  poster: string;
  /** Drop a matching file in `public/videos/` and the stage plays it. */
  videoSrc: string;
  keyPointsEn: string[];
  keyPointsEs: string[];
  transcript: TranscriptCue[];
  documents: JourneyDocument[];
}

export const JOURNEY_PHASES: Record<JourneyPhaseKey, JourneyPhase> = {
  foundation: {
    key: "foundation",
    labelEn: "Week 1 · Getting Started",
    labelEs: "Semana 1 · Primeros Pasos",
    rangeEn: "Days 1-7",
    rangeEs: "Días 1-7",
    chipClass: "border-blue-200 bg-blue-50 text-blue-700",
    dotClass: "bg-blue-500",
  },
  management: {
    key: "management",
    labelEn: "Week 2 · Daily Management",
    labelEs: "Semana 2 · Manejo Diario",
    rangeEn: "Days 8-14",
    rangeEs: "Días 8-14",
    chipClass: "border-violet-200 bg-violet-50 text-violet-700",
    dotClass: "bg-violet-500",
  },
  living: {
    key: "living",
    labelEn: "Week 3 · Living Well",
    labelEs: "Semana 3 · Vivir Bien",
    rangeEn: "Days 15-21",
    rangeEs: "Días 15-21",
    chipClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-500",
  },
};

export const PHASE_ORDER: JourneyPhaseKey[] = [
  "foundation",
  "management",
  "living",
];

const POSTER = "/images/education-center-video.png";

export const JOURNEY_DAYS: JourneyDay[] = [
  {
    day: 1,
    slug: "day-01",
    phase: "foundation",
    titleEn: "Welcome to Your Dialysis Journey",
    titleEs: "Bienvenido a su Viaje de Diálisis",
    summaryEn:
      "A short orientation to the next three weeks. You will meet the care team roles you will work with, learn how this program is organized, and set one goal for your first week.",
    summaryEs:
      "Una breve orientación sobre las próximas tres semanas. Conocerá los roles del equipo de atención con los que trabajará, aprenderá cómo está organizado este programa y fijará una meta para su primera semana.",
    durationMinutes: 6,
    poster: POSTER,
    videoSrc: "/videos/day-01.mp4",
    keyPointsEn: [
      "Three weeks, one short lesson a day",
      "Who is on your dialysis care team",
      "How to ask questions between visits",
    ],
    keyPointsEs: [
      "Tres semanas, una lección breve por día",
      "Quiénes forman su equipo de diálisis",
      "Cómo hacer preguntas entre visitas",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Welcome. Over the next twenty-one days we will walk through what dialysis is, how to manage everyday life around treatment, and how to spot problems early.",
        textEs:
          "Bienvenido. Durante los próximos veintiún días recorreremos qué es la diálisis, cómo manejar la vida diaria alrededor del tratamiento y cómo detectar problemas a tiempo.",
      },
      {
        at: 42,
        textEn:
          "Each day is one short video with a transcript you can read, plus a handout you can bring to your next appointment.",
        textEs:
          "Cada día es un video corto con una transcripción que puede leer, más un documento que puede llevar a su próxima cita.",
      },
      {
        at: 118,
        textEn:
          "Your care team usually includes a nephrologist, dialysis nurses, a dietitian, and a social worker. Each one handles a different part of your care.",
        textEs:
          "Su equipo de atención suele incluir un nefrólogo, enfermeras de diálisis, un dietista y un trabajador social. Cada uno atiende una parte diferente de su cuidado.",
      },
      {
        at: 205,
        textEn:
          "Write down questions as they come up during the week. Bringing a written list to your appointment is the single easiest way to get more out of it.",
        textEs:
          "Anote sus preguntas a medida que surjan durante la semana. Llevar una lista escrita a su cita es la forma más sencilla de aprovecharla mejor.",
      },
      {
        at: 288,
        textEn:
          "Before tomorrow, pick one goal for this week. It can be as small as drinking from a measured cup so you know how much fluid you are taking in.",
        textEs:
          "Antes de mañana, elija una meta para esta semana. Puede ser tan simple como beber de un vaso medido para saber cuánto líquido está tomando.",
      },
    ],
    documents: [
      {
        id: "d1-welcome",
        titleEn: "Welcome Packet & Program Map",
        titleEs: "Paquete de Bienvenida y Mapa del Programa",
        kind: "pdf",
        metaEn: "PDF · 4 pages",
        metaEs: "PDF · 4 páginas",
      },
      {
        id: "d1-questions",
        titleEn: "Questions to Ask Your Care Team",
        titleEs: "Preguntas para su Equipo de Atención",
        kind: "worksheet",
        metaEn: "Worksheet · 1 page",
        metaEs: "Hoja de trabajo · 1 página",
      },
    ],
  },
  {
    day: 2,
    slug: "day-02",
    phase: "foundation",
    titleEn: "How Your Kidneys Work",
    titleEs: "Cómo Funcionan sus Riñones",
    summaryEn:
      "What healthy kidneys do all day, which of those jobs dialysis replaces, and which jobs it cannot replace. This is the foundation for everything else in the program.",
    summaryEs:
      "Qué hacen los riñones sanos durante todo el día, cuáles de esas funciones reemplaza la diálisis y cuáles no puede reemplazar. Esta es la base de todo lo demás en el programa.",
    durationMinutes: 8,
    poster: POSTER,
    videoSrc: "/videos/day-02.mp4",
    keyPointsEn: [
      "Kidneys filter waste, balance fluid, and control minerals",
      "Dialysis replaces filtering, not hormone production",
      "Why treatment is scheduled, not on demand",
    ],
    keyPointsEs: [
      "Los riñones filtran desechos, equilibran líquidos y controlan minerales",
      "La diálisis reemplaza el filtrado, no la producción de hormonas",
      "Por qué el tratamiento es programado y no a demanda",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Healthy kidneys do four main jobs: they remove waste, remove extra fluid, balance minerals like potassium and phosphorus, and make hormones.",
        textEs:
          "Los riñones sanos hacen cuatro trabajos principales: eliminan desechos, eliminan el exceso de líquido, equilibran minerales como el potasio y el fósforo, y producen hormonas.",
      },
      {
        at: 65,
        textEn:
          "Dialysis does the first three. It filters your blood and pulls off fluid during each session.",
        textEs:
          "La diálisis hace los tres primeros. Filtra su sangre y elimina líquido durante cada sesión.",
      },
      {
        at: 150,
        textEn:
          "It does not make hormones. That is why many people on dialysis also take medication for anemia and for bone health.",
        textEs:
          "No produce hormonas. Por eso muchas personas en diálisis también toman medicamentos para la anemia y la salud ósea.",
      },
      {
        at: 240,
        textEn:
          "Healthy kidneys work every minute of every day. Dialysis works in sessions, so waste and fluid build up in between.",
        textEs:
          "Los riñones sanos trabajan cada minuto de cada día. La diálisis trabaja en sesiones, por lo que los desechos y el líquido se acumulan entre ellas.",
      },
      {
        at: 330,
        textEn:
          "That gap is the reason your diet, your fluid limit, and your treatment schedule matter so much. They keep the build-up manageable.",
        textEs:
          "Esa diferencia es la razón por la que su dieta, su límite de líquidos y su horario de tratamiento importan tanto. Mantienen la acumulación bajo control.",
      },
    ],
    documents: [
      {
        id: "d2-anatomy",
        titleEn: "Kidney Function at a Glance",
        titleEs: "Función Renal de un Vistazo",
        kind: "pdf",
        metaEn: "PDF · 2 pages",
        metaEs: "PDF · 2 páginas",
      },
    ],
  },
  {
    day: 3,
    slug: "day-03",
    phase: "foundation",
    titleEn: "Understanding Your Treatment Schedule",
    titleEs: "Entendiendo su Horario de Tratamiento",
    summaryEn:
      "Why most in-center schedules run three days a week, what your prescribed treatment time means, and what happens when a session is shortened or skipped.",
    summaryEs:
      "Por qué la mayoría de los horarios en el centro son tres días por semana, qué significa su tiempo de tratamiento indicado y qué pasa cuando una sesión se acorta o se omite.",
    durationMinutes: 7,
    poster: POSTER,
    videoSrc: "/videos/day-03.mp4",
    keyPointsEn: [
      "Your prescription has a set time for a reason",
      "Shortened sessions leave fluid and waste behind",
      "How to plan the rest of your week around treatment",
    ],
    keyPointsEs: [
      "Su indicación tiene un tiempo fijo por una razón",
      "Las sesiones acortadas dejan líquido y desechos atrás",
      "Cómo planificar el resto de su semana según el tratamiento",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Most in-center hemodialysis schedules are three sessions a week, often around four hours each.",
        textEs:
          "La mayoría de los horarios de hemodiálisis en centro son tres sesiones por semana, a menudo de unas cuatro horas cada una.",
      },
      {
        at: 70,
        textEn:
          "That length is part of your prescription. It is calculated for your body size and your remaining kidney function.",
        textEs:
          "Esa duración es parte de su indicación médica. Se calcula según su tamaño corporal y la función renal que le queda.",
      },
      {
        at: 160,
        textEn:
          "Cutting a session short by even thirty minutes leaves fluid and waste in your body that the next session has to remove instead.",
        textEs:
          "Acortar una sesión incluso treinta minutos deja líquido y desechos en su cuerpo que la siguiente sesión tendrá que eliminar.",
      },
      {
        at: 245,
        textEn:
          "The longest gap in your week, usually the two days between your last and first session, is when people most often feel unwell.",
        textEs:
          "El intervalo más largo de su semana, normalmente los dos días entre su última y su primera sesión, es cuando la gente suele sentirse peor.",
      },
      {
        at: 320,
        textEn:
          "If you need to change a session, call the center ahead of time so they can move you rather than lose the slot.",
        textEs:
          "Si necesita cambiar una sesión, llame al centro con anticipación para que puedan reubicarlo en lugar de perder el turno.",
      },
    ],
    documents: [
      {
        id: "d3-schedule",
        titleEn: "Weekly Treatment Planner",
        titleEs: "Planificador Semanal de Tratamiento",
        kind: "worksheet",
        metaEn: "Worksheet · 1 page",
        metaEs: "Hoja de trabajo · 1 página",
      },
    ],
  },
  {
    day: 4,
    slug: "day-04",
    phase: "foundation",
    titleEn: "Your Dialysis Access",
    titleEs: "Su Acceso de Diálisis",
    summaryEn:
      "Fistula, graft, or catheter: how each one works, what daily care each needs, and the warning signs that mean you should call your center right away.",
    summaryEs:
      "Fístula, injerto o catéter: cómo funciona cada uno, qué cuidado diario necesita y las señales de alarma que significan que debe llamar a su centro de inmediato.",
    durationMinutes: 9,
    poster: POSTER,
    videoSrc: "/videos/day-04.mp4",
    keyPointsEn: [
      "Check your thrill or bruit every day",
      "Keep the catheter dressing clean and dry",
      "Redness, swelling, or fever means call now",
    ],
    keyPointsEs: [
      "Revise su frémito o soplo todos los días",
      "Mantenga el apósito del catéter limpio y seco",
      "Enrojecimiento, hinchazón o fiebre significa llamar ahora",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Your access is the place where blood leaves and returns to your body during treatment. There are three common types.",
        textEs:
          "Su acceso es el lugar por donde la sangre sale y regresa a su cuerpo durante el tratamiento. Hay tres tipos comunes.",
      },
      {
        at: 80,
        textEn:
          "A fistula joins an artery and a vein in your arm. It lasts the longest and has the lowest infection risk.",
        textEs:
          "Una fístula une una arteria y una vena en su brazo. Dura más tiempo y tiene el menor riesgo de infección.",
      },
      {
        at: 175,
        textEn:
          "With a fistula or graft, feel for the buzzing vibration called a thrill every morning. If you cannot feel it, call your center.",
        textEs:
          "Con una fístula o un injerto, palpe la vibración llamada frémito cada mañana. Si no la siente, llame a su centro.",
      },
      {
        at: 270,
        textEn:
          "A catheter goes into a large vein in your neck or chest. It can be used right away, but it carries the highest infection risk.",
        textEs:
          "Un catéter se coloca en una vena grande del cuello o del pecho. Se puede usar de inmediato, pero conlleva el mayor riesgo de infección.",
      },
      {
        at: 390,
        textEn:
          "Never let anyone take blood pressure or draw blood from your access arm, and do not sleep on it or wear tight sleeves.",
        textEs:
          "Nunca permita que le tomen la presión ni le saquen sangre del brazo del acceso, y no duerma sobre él ni use mangas ajustadas.",
      },
    ],
    documents: [
      {
        id: "d4-access-care",
        titleEn: "Daily Access Care Checklist",
        titleEs: "Lista de Cuidado Diario del Acceso",
        kind: "checklist",
        metaEn: "Checklist · 8 items",
        metaEs: "Lista · 8 puntos",
      },
      {
        id: "d4-warning",
        titleEn: "Access Warning Signs",
        titleEs: "Señales de Alarma del Acceso",
        kind: "pdf",
        metaEn: "PDF · 1 page",
        metaEs: "PDF · 1 página",
      },
    ],
  },
  {
    day: 5,
    slug: "day-05",
    phase: "foundation",
    titleEn: "What Happens During Treatment",
    titleEs: "Qué Sucede Durante el Tratamiento",
    summaryEn:
      "A walk-through of a full session from weigh-in to post-treatment vitals, so nothing in the chair is a surprise.",
    summaryEs:
      "Un recorrido por una sesión completa, desde el peso inicial hasta los signos vitales finales, para que nada en el sillón sea una sorpresa.",
    durationMinutes: 8,
    poster: POSTER,
    videoSrc: "/videos/day-05.mp4",
    keyPointsEn: [
      "Weigh-in sets how much fluid comes off",
      "Speak up early if you feel unwell",
      "Post-treatment weight tells you how it went",
    ],
    keyPointsEs: [
      "El peso inicial define cuánto líquido se retira",
      "Avise temprano si se siente mal",
      "El peso final le dice cómo resultó la sesión",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Every session starts the same way: you weigh in. The difference between that weight and your dry weight sets your fluid removal goal.",
        textEs:
          "Cada sesión empieza igual: usted se pesa. La diferencia entre ese peso y su peso seco define la meta de líquido a retirar.",
      },
      {
        at: 85,
        textEn:
          "Staff check your blood pressure, temperature and pulse, then clean your access and begin treatment.",
        textEs:
          "El personal revisa su presión arterial, temperatura y pulso, luego limpia su acceso y comienza el tratamiento.",
      },
      {
        at: 180,
        textEn:
          "During the session it is normal to feel cool. Cramping, dizziness, or nausea is not something to wait out. Tell your nurse as soon as it starts.",
        textEs:
          "Durante la sesión es normal sentir frío. Los calambres, mareos o náuseas no son algo que deba aguantar. Avise a su enfermera apenas comiencen.",
      },
      {
        at: 285,
        textEn:
          "Small adjustments early, like slowing the fluid removal rate, usually prevent a bigger problem later in the session.",
        textEs:
          "Los pequeños ajustes tempranos, como reducir la velocidad de extracción de líquido, suelen evitar un problema mayor más adelante.",
      },
      {
        at: 380,
        textEn:
          "At the end, you weigh again and hold pressure on your access site. Log how you felt while it is still fresh.",
        textEs:
          "Al final, se pesa de nuevo y hace presión en el sitio del acceso. Registre cómo se sintió mientras lo recuerda bien.",
      },
    ],
    documents: [
      {
        id: "d5-session",
        titleEn: "What to Bring to Treatment",
        titleEs: "Qué Llevar al Tratamiento",
        kind: "checklist",
        metaEn: "Checklist · 10 items",
        metaEs: "Lista · 10 puntos",
      },
    ],
  },
  {
    day: 6,
    slug: "day-06",
    phase: "foundation",
    titleEn: "Common Symptoms After Treatment",
    titleEs: "Síntomas Comunes Después del Tratamiento",
    summaryEn:
      "Fatigue, cramps, low blood pressure and headaches are common after a session. Learn which ones usually settle on their own and which ones need a call.",
    summaryEs:
      "La fatiga, los calambres, la presión baja y los dolores de cabeza son comunes después de una sesión. Aprenda cuáles suelen pasar solos y cuáles requieren una llamada.",
    durationMinutes: 7,
    poster: POSTER,
    videoSrc: "/videos/day-06.mp4",
    keyPointsEn: [
      "Washed-out feeling often follows large fluid removal",
      "Cramps often mean fluid came off too fast",
      "Track recovery time so patterns show up",
    ],
    keyPointsEs: [
      "El agotamiento suele seguir a una gran extracción de líquido",
      "Los calambres suelen indicar que el líquido salió muy rápido",
      "Registre el tiempo de recuperación para ver patrones",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Many people feel drained for a few hours after treatment. That recovery time is worth tracking, because it tends to follow a pattern.",
        textEs:
          "Muchas personas se sienten agotadas unas horas después del tratamiento. Vale la pena registrar ese tiempo de recuperación, porque suele seguir un patrón.",
      },
      {
        at: 75,
        textEn:
          "If you regularly need more than a few hours to recover, that is something to raise with your team. Your prescription may need adjusting.",
        textEs:
          "Si regularmente necesita más de unas horas para recuperarse, coméntelo con su equipo. Su indicación puede necesitar ajustes.",
      },
      {
        at: 165,
        textEn:
          "Cramps usually mean fluid was removed faster than your body could refill the blood vessels. Gaining less fluid between sessions helps most.",
        textEs:
          "Los calambres suelen significar que el líquido se retiró más rápido de lo que su cuerpo pudo reponer. Ganar menos líquido entre sesiones ayuda mucho.",
      },
      {
        at: 260,
        textEn:
          "Feeling faint or light-headed at the end of a session can mean your dry weight is set too low. Report it rather than adjusting on your own.",
        textEs:
          "Sentirse débil o mareado al final de una sesión puede significar que su peso seco está muy bajo. Repórtelo en lugar de ajustarlo por su cuenta.",
      },
      {
        at: 345,
        textEn:
          "Chest pain, trouble breathing, or confusion are different. Those are emergencies. Call 911.",
        textEs:
          "El dolor de pecho, la dificultad para respirar o la confusión son diferentes. Esas son emergencias. Llame al 911.",
      },
    ],
    documents: [
      {
        id: "d6-symptoms",
        titleEn: "Symptom & Recovery Log",
        titleEs: "Registro de Síntomas y Recuperación",
        kind: "worksheet",
        metaEn: "Worksheet · 2 pages",
        metaEs: "Hoja de trabajo · 2 páginas",
      },
    ],
  },
  {
    day: 7,
    slug: "day-07",
    phase: "foundation",
    titleEn: "Week 1 Review: Building Your Routine",
    titleEs: "Repaso Semana 1: Construyendo su Rutina",
    summaryEn:
      "A recap of week one and a simple routine you can keep: check your access, weigh yourself, log your fluid, and note how you felt.",
    summaryEs:
      "Un repaso de la primera semana y una rutina sencilla que puede mantener: revise su acceso, pésese, registre sus líquidos y anote cómo se sintió.",
    durationMinutes: 5,
    poster: POSTER,
    videoSrc: "/videos/day-07.mp4",
    keyPointsEn: [
      "Four habits that take under five minutes a day",
      "What to review before your next appointment",
      "Setting your goal for week two",
    ],
    keyPointsEs: [
      "Cuatro hábitos que toman menos de cinco minutos al día",
      "Qué revisar antes de su próxima cita",
      "Fijar su meta para la semana dos",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "You have covered what dialysis does, how your schedule works, how to care for your access, and what a session feels like.",
        textEs:
          "Ya vio qué hace la diálisis, cómo funciona su horario, cómo cuidar su acceso y cómo se siente una sesión.",
      },
      {
        at: 55,
        textEn:
          "Now turn that into a routine. Every morning: feel your access, weigh yourself, and note anything unusual.",
        textEs:
          "Ahora conviértalo en una rutina. Cada mañana: palpe su acceso, pésese y anote cualquier cosa inusual.",
      },
      {
        at: 130,
        textEn:
          "Every evening: log your fluid for the day and how you felt. Both take about a minute in your personal log.",
        textEs:
          "Cada noche: registre sus líquidos del día y cómo se sintió. Ambos toman aproximadamente un minuto en su registro personal.",
      },
      {
        at: 200,
        textEn:
          "Before your next appointment, look back over the week and mark anything that repeated. Patterns are what your team needs to see.",
        textEs:
          "Antes de su próxima cita, revise la semana y marque lo que se repitió. Los patrones son lo que su equipo necesita ver.",
      },
      {
        at: 255,
        textEn:
          "Next week we move into daily management: fluid, labs, and the minerals that matter most.",
        textEs:
          "La próxima semana pasamos al manejo diario: líquidos, laboratorios y los minerales que más importan.",
      },
    ],
    documents: [
      {
        id: "d7-routine",
        titleEn: "Daily Routine Card",
        titleEs: "Tarjeta de Rutina Diaria",
        kind: "checklist",
        metaEn: "Checklist · 4 habits",
        metaEs: "Lista · 4 hábitos",
      },
    ],
  },
  {
    day: 8,
    slug: "day-08",
    phase: "management",
    titleEn: "Fluid Limits and Dry Weight",
    titleEs: "Límites de Líquido y Peso Seco",
    summaryEn:
      "What dry weight means, how your daily fluid allowance is calculated, and why the number on the scale before treatment is the most useful number you track.",
    summaryEs:
      "Qué significa el peso seco, cómo se calcula su cantidad diaria de líquido y por qué el número en la báscula antes del tratamiento es el dato más útil que registra.",
    durationMinutes: 9,
    poster: POSTER,
    videoSrc: "/videos/day-08.mp4",
    keyPointsEn: [
      "Dry weight is your target weight with no extra fluid",
      "Everything that melts at room temperature counts as fluid",
      "Aim for a steady gain between sessions, not a spike",
    ],
    keyPointsEs: [
      "El peso seco es su peso objetivo sin líquido extra",
      "Todo lo que se derrite a temperatura ambiente cuenta como líquido",
      "Busque un aumento constante entre sesiones, no un pico",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Dry weight is the weight your body should be at when no extra fluid is sitting in it. Your team sets it and adjusts it over time.",
        textEs:
          "El peso seco es el peso que su cuerpo debería tener cuando no hay líquido extra acumulado. Su equipo lo establece y lo ajusta con el tiempo.",
      },
      {
        at: 90,
        textEn:
          "Between sessions you gain fluid. The goal for most people is to keep that gain small and steady rather than large on one day.",
        textEs:
          "Entre sesiones usted gana líquido. La meta para la mayoría es mantener ese aumento pequeño y constante, en lugar de mucho en un solo día.",
      },
      {
        at: 195,
        textEn:
          "Fluid is not just what you drink. Soup, gelatin, ice, ice cream, and juicy fruit all count toward your limit.",
        textEs:
          "El líquido no es solo lo que bebe. La sopa, la gelatina, el hielo, el helado y la fruta jugosa cuentan para su límite.",
      },
      {
        at: 300,
        textEn:
          "Salt is the hidden driver. The more sodium you eat, the thirstier you get, and the harder your fluid limit becomes to keep.",
        textEs:
          "La sal es el factor oculto. Cuanto más sodio consume, más sed tiene, y más difícil se vuelve mantener su límite de líquido.",
      },
      {
        at: 420,
        textEn:
          "Weigh yourself at the same time each day, on the same scale, wearing similar clothes. Consistency is what makes the number meaningful.",
        textEs:
          "Pésese a la misma hora cada día, en la misma báscula y con ropa similar. La constancia es lo que hace que el número tenga sentido.",
      },
    ],
    documents: [
      {
        id: "d8-fluid",
        titleEn: "Daily Fluid Allowance Tracker",
        titleEs: "Control de Líquido Diario Permitido",
        kind: "worksheet",
        metaEn: "Worksheet · 2 pages",
        metaEs: "Hoja de trabajo · 2 páginas",
      },
      {
        id: "d8-thirst",
        titleEn: "Managing Thirst Without Drinking",
        titleEs: "Manejar la Sed Sin Beber",
        kind: "pdf",
        metaEn: "PDF · 1 page",
        metaEs: "PDF · 1 página",
      },
    ],
  },
  {
    day: 9,
    slug: "day-09",
    phase: "management",
    titleEn: "Reading Your Lab Results",
    titleEs: "Interpretando sus Resultados de Laboratorio",
    summaryEn:
      "The handful of lab values that come back every month, what each one is telling you, and how to spot a trend instead of reacting to a single result.",
    summaryEs:
      "Los pocos valores de laboratorio que llegan cada mes, qué le dice cada uno y cómo detectar una tendencia en vez de reaccionar a un solo resultado.",
    durationMinutes: 10,
    poster: POSTER,
    videoSrc: "/videos/day-09.mp4",
    keyPointsEn: [
      "Kt/V and URR measure how well treatment is clearing waste",
      "Hemoglobin, potassium, phosphorus and albumin tell different stories",
      "One out-of-range result is not a crisis, a trend matters more",
    ],
    keyPointsEs: [
      "Kt/V y URR miden qué tan bien el tratamiento elimina desechos",
      "Hemoglobina, potasio, fósforo y albúmina cuentan historias distintas",
      "Un resultado fuera de rango no es una crisis, la tendencia importa más",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Most dialysis labs are drawn monthly. The same handful of values come back each time, which makes them easy to follow once you know them.",
        textEs:
          "La mayoría de los laboratorios de diálisis se toman mensualmente. Los mismos valores regresan cada vez, lo que facilita seguirlos una vez que los conoce.",
      },
      {
        at: 95,
        textEn:
          "Kt over V, and URR, describe how much waste your treatment removed. If they drop, your team looks at session length and access flow.",
        textEs:
          "Kt sobre V, y URR, describen cuántos desechos eliminó su tratamiento. Si bajan, su equipo revisa la duración de la sesión y el flujo del acceso.",
      },
      {
        at: 215,
        textEn:
          "Hemoglobin reflects anemia. Low hemoglobin is why you may feel short of breath or exhausted climbing stairs.",
        textEs:
          "La hemoglobina refleja la anemia. Una hemoglobina baja es la razón por la que puede sentir falta de aire o agotamiento al subir escaleras.",
      },
      {
        at: 330,
        textEn:
          "Albumin is a nutrition marker. A falling albumin usually means you are not getting enough protein, and it is worth acting on early.",
        textEs:
          "La albúmina es un marcador de nutrición. Una albúmina en descenso suele significar que no recibe suficiente proteína, y conviene actuar temprano.",
      },
      {
        at: 460,
        textEn:
          "Log your results each month. Three points in a row going the same direction tells you far more than any single number.",
        textEs:
          "Registre sus resultados cada mes. Tres puntos seguidos en la misma dirección le dicen mucho más que cualquier número aislado.",
      },
    ],
    documents: [
      {
        id: "d9-labs",
        titleEn: "Lab Values Reference Card",
        titleEs: "Tarjeta de Referencia de Laboratorios",
        kind: "pdf",
        metaEn: "PDF · 2 pages",
        metaEs: "PDF · 2 páginas",
      },
    ],
  },
  {
    day: 10,
    slug: "day-10",
    phase: "management",
    titleEn: "Potassium: Foods to Watch",
    titleEs: "Potasio: Alimentos a Vigilar",
    summaryEn:
      "Why potassium is the mineral that can affect your heart rhythm between sessions, which everyday foods are highest, and practical swaps that still taste good.",
    summaryEs:
      "Por qué el potasio es el mineral que puede afectar su ritmo cardíaco entre sesiones, qué alimentos cotidianos son los más altos y qué cambios prácticos siguen sabiendo bien.",
    durationMinutes: 8,
    poster: POSTER,
    videoSrc: "/videos/day-10.mp4",
    keyPointsEn: [
      "High potassium can cause dangerous heart rhythms",
      "Potatoes, tomatoes, bananas and oranges are common sources",
      "Leaching and portion size both help",
    ],
    keyPointsEs: [
      "El potasio alto puede causar ritmos cardíacos peligrosos",
      "Papas, tomates, plátanos y naranjas son fuentes comunes",
      "Remojar y controlar la porción ayudan",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Potassium keeps your heart and muscles working. Between sessions it builds up, and high levels can cause a dangerous heart rhythm.",
        textEs:
          "El potasio mantiene su corazón y músculos funcionando. Entre sesiones se acumula, y los niveles altos pueden causar un ritmo cardíaco peligroso.",
      },
      {
        at: 70,
        textEn:
          "What makes it tricky is that high potassium often has no symptoms until it is already serious. Your monthly lab is the main warning.",
        textEs:
          "Lo complicado es que el potasio alto a menudo no da síntomas hasta que ya es grave. Su laboratorio mensual es la principal advertencia.",
      },
      {
        at: 170,
        textEn:
          "The highest everyday sources are potatoes, tomatoes and tomato sauce, bananas, oranges, melon, beans, and salt substitutes.",
        textEs:
          "Las fuentes cotidianas más altas son papas, tomates y salsa de tomate, plátanos, naranjas, melón, frijoles y sustitutos de sal.",
      },
      {
        at: 275,
        textEn:
          "Salt substitutes deserve special mention. Most of them replace sodium with potassium chloride, which is exactly what you are trying to limit.",
        textEs:
          "Los sustitutos de sal merecen mención especial. La mayoría reemplaza el sodio con cloruro de potasio, que es justo lo que intenta limitar.",
      },
      {
        at: 375,
        textEn:
          "You do not have to give up potatoes. Cutting them small and boiling them in plenty of water pulls a good share of the potassium out.",
        textEs:
          "No tiene que renunciar a las papas. Cortarlas pequeñas y hervirlas en bastante agua extrae buena parte del potasio.",
      },
    ],
    documents: [
      {
        id: "d10-potassium",
        titleEn: "Low & High Potassium Food Lists",
        titleEs: "Listas de Alimentos Altos y Bajos en Potasio",
        kind: "pdf",
        metaEn: "PDF · 3 pages",
        metaEs: "PDF · 3 páginas",
      },
    ],
  },
  {
    day: 11,
    slug: "day-11",
    phase: "management",
    titleEn: "Phosphorus and Bone Health",
    titleEs: "Fósforo y Salud Ósea",
    summaryEn:
      "How phosphorus builds up, why it pulls calcium out of your bones over the years, and how binders work when you take them at the right moment.",
    summaryEs:
      "Cómo se acumula el fósforo, por qué extrae calcio de sus huesos con los años y cómo funcionan los quelantes cuando se toman en el momento correcto.",
    durationMinutes: 9,
    poster: POSTER,
    videoSrc: "/videos/day-11.mp4",
    keyPointsEn: [
      "Binders only work if taken with food",
      "Additives labelled PHOS absorb almost completely",
      "Itching and bone pain can be phosphorus related",
    ],
    keyPointsEs: [
      "Los quelantes solo funcionan si se toman con comida",
      "Los aditivos etiquetados PHOS se absorben casi por completo",
      "La picazón y el dolor óseo pueden relacionarse con el fósforo",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Phosphorus is in almost everything you eat, and dialysis removes only part of it. Over time the excess pulls calcium out of your bones.",
        textEs:
          "El fósforo está en casi todo lo que come, y la diálisis elimina solo una parte. Con el tiempo el exceso extrae calcio de sus huesos.",
      },
      {
        at: 95,
        textEn:
          "That process is slow and quiet. The first things people notice are usually stubborn itching, or aching bones and joints.",
        textEs:
          "Ese proceso es lento y silencioso. Lo primero que la gente nota suele ser una picazón persistente, o dolor en huesos y articulaciones.",
      },
      {
        at: 200,
        textEn:
          "Phosphate binders work by grabbing phosphorus in your stomach before it reaches your blood. That only happens if food is there too.",
        textEs:
          "Los quelantes de fosfato capturan el fósforo en el estómago antes de que llegue a la sangre. Eso solo ocurre si también hay comida.",
      },
      {
        at: 310,
        textEn:
          "Taking a binder an hour after eating does almost nothing. Take it with the first bites of a meal, and with snacks that contain protein.",
        textEs:
          "Tomar un quelante una hora después de comer no sirve de casi nada. Tómelo con los primeros bocados, y con las meriendas que tengan proteína.",
      },
      {
        at: 430,
        textEn:
          "Check labels for ingredients containing PHOS. Added phosphorus in processed foods is absorbed almost completely, unlike the natural kind.",
        textEs:
          "Revise las etiquetas buscando ingredientes con PHOS. El fósforo añadido en alimentos procesados se absorbe casi por completo, a diferencia del natural.",
      },
    ],
    documents: [
      {
        id: "d11-binders",
        titleEn: "Binder Timing Guide",
        titleEs: "Guía de Horarios para Quelantes",
        kind: "pdf",
        metaEn: "PDF · 2 pages",
        metaEs: "PDF · 2 páginas",
      },
      {
        id: "d11-labels",
        titleEn: "Reading Labels for Hidden Phosphorus",
        titleEs: "Leer Etiquetas para Fósforo Oculto",
        kind: "checklist",
        metaEn: "Checklist · 6 items",
        metaEs: "Lista · 6 puntos",
      },
    ],
  },
  {
    day: 12,
    slug: "day-12",
    phase: "management",
    titleEn: "Sodium, Blood Pressure and Thirst",
    titleEs: "Sodio, Presión Arterial y Sed",
    summaryEn:
      "Sodium is the lever that moves thirst, fluid gain, and blood pressure all at once. Cutting it back is the highest-value change most people can make.",
    summaryEs:
      "El sodio es la palanca que mueve la sed, la ganancia de líquido y la presión arterial a la vez. Reducirlo es el cambio de mayor valor para la mayoría.",
    durationMinutes: 8,
    poster: POSTER,
    videoSrc: "/videos/day-12.mp4",
    keyPointsEn: [
      "Most sodium comes from packaged food, not the salt shaker",
      "Less sodium means less thirst and smaller fluid gains",
      "Herbs and acid replace salt without potassium",
    ],
    keyPointsEs: [
      "La mayor parte del sodio viene de alimentos empacados, no del salero",
      "Menos sodio significa menos sed y menor ganancia de líquido",
      "Las hierbas y el ácido reemplazan la sal sin potasio",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Sodium sits at the center of three problems at once: thirst, fluid gain between sessions, and high blood pressure.",
        textEs:
          "El sodio está en el centro de tres problemas a la vez: la sed, la ganancia de líquido entre sesiones y la presión arterial alta.",
      },
      {
        at: 80,
        textEn:
          "Most of it does not come from the salt shaker. Canned soup, deli meat, frozen meals, bread and restaurant food carry the bulk of it.",
        textEs:
          "La mayor parte no viene del salero. Las sopas enlatadas, los embutidos, las comidas congeladas, el pan y la comida de restaurante la concentran.",
      },
      {
        at: 190,
        textEn:
          "When you lower sodium, thirst drops within days. Smaller fluid gains then make each treatment gentler on your body.",
        textEs:
          "Cuando baja el sodio, la sed disminuye en pocos días. Ganancias de líquido menores hacen que cada tratamiento sea más suave para su cuerpo.",
      },
      {
        at: 300,
        textEn:
          "For flavor, reach for garlic, onion, black pepper, cumin, smoked paprika, fresh herbs, vinegar and lemon juice.",
        textEs:
          "Para dar sabor, use ajo, cebolla, pimienta negra, comino, pimentón ahumado, hierbas frescas, vinagre y jugo de limón.",
      },
      {
        at: 395,
        textEn:
          "Remember the rule from day ten: avoid salt substitutes unless your team has specifically approved one.",
        textEs:
          "Recuerde la regla del día diez: evite los sustitutos de sal a menos que su equipo haya aprobado uno específicamente.",
      },
    ],
    documents: [
      {
        id: "d12-sodium",
        titleEn: "Low-Sodium Shopping Guide",
        titleEs: "Guía de Compras Bajas en Sodio",
        kind: "pdf",
        metaEn: "PDF · 2 pages",
        metaEs: "PDF · 2 páginas",
      },
    ],
  },
  {
    day: 13,
    slug: "day-13",
    phase: "management",
    titleEn: "Protein and Energy Needs",
    titleEs: "Necesidades de Proteína y Energía",
    summaryEn:
      "Dialysis removes protein along with waste, so needs on dialysis are higher than before. How to hit them without overshooting phosphorus or potassium.",
    summaryEs:
      "La diálisis elimina proteína junto con los desechos, por lo que las necesidades son mayores que antes. Cómo alcanzarlas sin excederse en fósforo o potasio.",
    durationMinutes: 8,
    poster: POSTER,
    videoSrc: "/videos/day-13.mp4",
    keyPointsEn: [
      "Protein needs go up once dialysis starts",
      "Egg whites and fresh meat are efficient choices",
      "Low albumin is a signal to act, not to wait",
    ],
    keyPointsEs: [
      "Las necesidades de proteína suben al iniciar la diálisis",
      "Las claras de huevo y la carne fresca son opciones eficientes",
      "La albúmina baja es una señal para actuar, no para esperar",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Before dialysis, many people are told to limit protein. Once dialysis starts, that advice reverses, because each session removes protein.",
        textEs:
          "Antes de la diálisis, a muchas personas se les dice que limiten la proteína. Al iniciar la diálisis, ese consejo se invierte, porque cada sesión elimina proteína.",
      },
      {
        at: 95,
        textEn:
          "Not getting enough shows up as muscle loss, weakness, slow healing, and a falling albumin on your monthly labs.",
        textEs:
          "No recibir suficiente se manifiesta como pérdida muscular, debilidad, cicatrización lenta y una albúmina en descenso en sus laboratorios mensuales.",
      },
      {
        at: 205,
        textEn:
          "The challenge is that many protein foods are also high in phosphorus. Egg whites, fresh chicken, fish and lean beef give protein with less of it.",
        textEs:
          "El reto es que muchos alimentos proteicos también son altos en fósforo. Las claras de huevo, el pollo fresco, el pescado y la carne magra dan proteína con menos fósforo.",
      },
      {
        at: 320,
        textEn:
          "Processed and enhanced meats are the ones to avoid. They are injected with phosphate and sodium solutions before packaging.",
        textEs:
          "Las carnes procesadas y realzadas son las que debe evitar. Se inyectan con soluciones de fosfato y sodio antes de empacarlas.",
      },
      {
        at: 415,
        textEn:
          "Eating during treatment is allowed at some centers and not at others. Ask your team what their policy is before bringing food.",
        textEs:
          "Comer durante el tratamiento se permite en algunos centros y en otros no. Pregunte a su equipo cuál es su política antes de llevar comida.",
      },
    ],
    documents: [
      {
        id: "d13-protein",
        titleEn: "Protein Portions Made Simple",
        titleEs: "Porciones de Proteína Simplificadas",
        kind: "worksheet",
        metaEn: "Worksheet · 2 pages",
        metaEs: "Hoja de trabajo · 2 páginas",
      },
    ],
  },
  {
    day: 14,
    slug: "day-14",
    phase: "management",
    titleEn: "Week 2 Review: Your Kidney-Friendly Plate",
    titleEs: "Repaso Semana 2: Su Plato Amigable con el Riñón",
    summaryEn:
      "Everything from week two on one plate: protein, potassium, phosphorus, sodium and fluid balanced together instead of managed one at a time.",
    summaryEs:
      "Todo lo de la semana dos en un solo plato: proteína, potasio, fósforo, sodio y líquidos equilibrados juntos en lugar de manejados uno por uno.",
    durationMinutes: 6,
    poster: POSTER,
    videoSrc: "/videos/day-14.mp4",
    keyPointsEn: [
      "Build the plate around fresh protein first",
      "Cook at home more often than not",
      "One change at a time sticks better than five",
    ],
    keyPointsEs: [
      "Arme el plato empezando por la proteína fresca",
      "Cocine en casa más veces que no",
      "Un cambio a la vez funciona mejor que cinco",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Managing four nutrients separately is exhausting. On a plate, they mostly line up with one habit: cook fresh food at home.",
        textEs:
          "Manejar cuatro nutrientes por separado es agotador. En el plato, casi todos se alinean con un solo hábito: cocinar comida fresca en casa.",
      },
      {
        at: 60,
        textEn:
          "Start with a palm-sized portion of fresh protein. Add a low-potassium vegetable, and a grain or bread that is not heavily processed.",
        textEs:
          "Empiece con una porción de proteína fresca del tamaño de su palma. Agregue una verdura baja en potasio y un grano o pan poco procesado.",
      },
      {
        at: 150,
        textEn:
          "Season with herbs and acid instead of salt, and take your binder with the first bites.",
        textEs:
          "Sazone con hierbas y ácido en lugar de sal, y tome su quelante con los primeros bocados.",
      },
      {
        at: 230,
        textEn:
          "Measure your drink rather than guessing. A marked bottle you refill is easier to keep track of than counting glasses.",
        textEs:
          "Mida su bebida en lugar de adivinar. Una botella marcada que rellena es más fácil de controlar que contar vasos.",
      },
      {
        at: 300,
        textEn:
          "Pick one change for next week. One habit you keep beats five you abandon.",
        textEs:
          "Elija un cambio para la próxima semana. Un hábito que mantiene vale más que cinco que abandona.",
      },
    ],
    documents: [
      {
        id: "d14-plate",
        titleEn: "Kidney-Friendly Plate Guide",
        titleEs: "Guía del Plato Amigable con el Riñón",
        kind: "pdf",
        metaEn: "PDF · 3 pages",
        metaEs: "PDF · 3 páginas",
      },
      {
        id: "d14-menu",
        titleEn: "Seven-Day Sample Menu",
        titleEs: "Menú de Muestra de Siete Días",
        kind: "worksheet",
        metaEn: "Worksheet · 4 pages",
        metaEs: "Hoja de trabajo · 4 páginas",
      },
    ],
  },
  {
    day: 15,
    slug: "day-15",
    phase: "living",
    titleEn: "Your Medications and Why Each One Matters",
    titleEs: "Sus Medicamentos y Por Qué Importa Cada Uno",
    summaryEn:
      "The common medication groups on dialysis, what each is doing, and how to build a list you can hand to any provider who asks.",
    summaryEs:
      "Los grupos de medicamentos comunes en diálisis, qué hace cada uno y cómo armar una lista que pueda entregar a cualquier profesional que la pida.",
    durationMinutes: 9,
    poster: POSTER,
    videoSrc: "/videos/day-15.mp4",
    keyPointsEn: [
      "Binders, blood pressure pills, anemia and vitamin D treatments",
      "Some doses are held before treatment on purpose",
      "Carry one current list, including over-the-counter items",
    ],
    keyPointsEs: [
      "Quelantes, pastillas para la presión, tratamientos de anemia y vitamina D",
      "Algunas dosis se retienen antes del tratamiento a propósito",
      "Lleve una lista actualizada, incluyendo productos de venta libre",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Most people on dialysis take several medications, and they fall into a few groups once you sort them out.",
        textEs:
          "La mayoría de las personas en diálisis toman varios medicamentos, y se agrupan en unas pocas categorías una vez que los ordena.",
      },
      {
        at: 85,
        textEn:
          "Phosphate binders go with food. Blood pressure medicines manage pressure between sessions, and some are deliberately held on treatment mornings.",
        textEs:
          "Los quelantes de fosfato van con la comida. Los medicamentos para la presión la controlan entre sesiones, y algunos se retienen a propósito los días de tratamiento.",
      },
      {
        at: 200,
        textEn:
          "Never skip or hold a dose on your own. If a medication makes you feel bad, tell your team, because there is usually an alternative.",
        textEs:
          "Nunca omita ni retenga una dosis por su cuenta. Si un medicamento lo hace sentir mal, dígale a su equipo, porque suele haber una alternativa.",
      },
      {
        at: 315,
        textEn:
          "Over-the-counter products count. Many pain relievers, antacids and herbal supplements are not safe with reduced kidney function.",
        textEs:
          "Los productos de venta libre cuentan. Muchos analgésicos, antiácidos y suplementos herbales no son seguros con función renal reducida.",
      },
      {
        at: 430,
        textEn:
          "Keep one current list with names, doses and times. Bring it to every appointment and to the emergency room if you ever need one.",
        textEs:
          "Mantenga una lista actualizada con nombres, dosis y horarios. Llévela a cada cita y a la sala de emergencias si alguna vez la necesita.",
      },
    ],
    documents: [
      {
        id: "d15-medlist",
        titleEn: "My Medication List Template",
        titleEs: "Plantilla de Mi Lista de Medicamentos",
        kind: "worksheet",
        metaEn: "Worksheet · 2 pages",
        metaEs: "Hoja de trabajo · 2 páginas",
      },
      {
        id: "d15-otc",
        titleEn: "Over-the-Counter Products to Avoid",
        titleEs: "Productos de Venta Libre a Evitar",
        kind: "pdf",
        metaEn: "PDF · 1 page",
        metaEs: "PDF · 1 página",
      },
    ],
  },
  {
    day: 16,
    slug: "day-16",
    phase: "living",
    titleEn: "Preventing Infection",
    titleEs: "Prevención de Infecciones",
    summaryEn:
      "Infection is the complication most likely to send someone on dialysis to the hospital, and it is also the most preventable. Here is the daily routine that prevents it.",
    summaryEs:
      "La infección es la complicación que más envía al hospital a quienes reciben diálisis, y también la más prevenible. Esta es la rutina diaria que la evita.",
    durationMinutes: 7,
    poster: POSTER,
    videoSrc: "/videos/day-16.mp4",
    keyPointsEn: [
      "Wash the access site before every session",
      "Never get a catheter dressing wet",
      "Fever with a catheter is an emergency",
    ],
    keyPointsEs: [
      "Lave el sitio del acceso antes de cada sesión",
      "Nunca moje el apósito del catéter",
      "La fiebre con un catéter es una emergencia",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Your access connects directly to your bloodstream, so anything that gets in at that site travels everywhere quickly.",
        textEs:
          "Su acceso se conecta directamente al torrente sanguíneo, así que cualquier cosa que entre por ahí viaja rápidamente a todas partes.",
      },
      {
        at: 70,
        textEn:
          "Wash your access arm with soap and water before every treatment, and expect staff to clean it again before cannulation.",
        textEs:
          "Lave su brazo del acceso con agua y jabón antes de cada tratamiento, y espere que el personal lo limpie otra vez antes de la punción.",
      },
      {
        at: 160,
        textEn:
          "If you have a catheter, the dressing stays dry. That means no swimming, no baths, and covering it carefully in the shower.",
        textEs:
          "Si tiene un catéter, el apósito se mantiene seco. Eso significa no nadar, no bañarse en tina y cubrirlo con cuidado en la ducha.",
      },
      {
        at: 255,
        textEn:
          "Only trained staff should handle a catheter. The caps and clamps stay closed between sessions.",
        textEs:
          "Solo personal capacitado debe manipular un catéter. Las tapas y pinzas permanecen cerradas entre sesiones.",
      },
      {
        at: 340,
        textEn:
          "Fever, chills, drainage, or new redness around the site means call your center immediately. With a catheter, treat fever as an emergency.",
        textEs:
          "Fiebre, escalofríos, secreción o enrojecimiento nuevo alrededor del sitio significa llamar a su centro de inmediato. Con un catéter, trate la fiebre como una emergencia.",
      },
    ],
    documents: [
      {
        id: "d16-infection",
        titleEn: "Infection Prevention Checklist",
        titleEs: "Lista de Prevención de Infecciones",
        kind: "checklist",
        metaEn: "Checklist · 9 items",
        metaEs: "Lista · 9 puntos",
      },
    ],
  },
  {
    day: 17,
    slug: "day-17",
    phase: "living",
    titleEn: "Recognizing Emergencies",
    titleEs: "Reconociendo Emergencias",
    summaryEn:
      "The short list of symptoms that mean call 911 now, the ones that mean call your dialysis center today, and how to tell the two apart under stress.",
    summaryEs:
      "La lista corta de síntomas que significan llamar al 911 ahora, los que significan llamar a su centro hoy, y cómo distinguirlos bajo estrés.",
    durationMinutes: 8,
    poster: POSTER,
    videoSrc: "/videos/day-17.mp4",
    keyPointsEn: [
      "Chest pain, severe breathlessness and stroke signs mean 911",
      "Bleeding from the access that will not stop is an emergency",
      "Tell responders you are a dialysis patient immediately",
    ],
    keyPointsEs: [
      "Dolor de pecho, falta de aire grave y signos de derrame significan 911",
      "El sangrado del acceso que no se detiene es una emergencia",
      "Diga de inmediato a los rescatistas que recibe diálisis",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Some symptoms cannot wait for your next session. Chest pain or pressure, severe trouble breathing, and sudden weakness on one side are all 911 calls.",
        textEs:
          "Algunos síntomas no pueden esperar a su próxima sesión. El dolor u opresión en el pecho, la dificultad grave para respirar y la debilidad súbita de un lado son llamadas al 911.",
      },
      {
        at: 95,
        textEn:
          "So is bleeding from your access that does not stop with firm pressure after a few minutes, and any loss of consciousness.",
        textEs:
          "También lo es el sangrado del acceso que no se detiene con presión firme después de unos minutos, y cualquier pérdida del conocimiento.",
      },
      {
        at: 195,
        textEn:
          "When you call, say you are a dialysis patient in the first sentence. It changes how responders treat you and where they take you.",
        textEs:
          "Cuando llame, diga que recibe diálisis en la primera frase. Eso cambia cómo lo tratan los rescatistas y a dónde lo llevan.",
      },
      {
        at: 300,
        textEn:
          "Other things need a same-day call to your center rather than 911: a missed treatment, fever, a change in your access, or sudden swelling.",
        textEs:
          "Otras cosas requieren una llamada el mismo día a su centro en lugar del 911: un tratamiento perdido, fiebre, un cambio en su acceso o hinchazón repentina.",
      },
      {
        at: 400,
        textEn:
          "Keep both numbers, your center and your nephrologist, somewhere you can find them without thinking.",
        textEs:
          "Guarde ambos números, el de su centro y el de su nefrólogo, en un lugar donde pueda encontrarlos sin pensar.",
      },
    ],
    documents: [
      {
        id: "d17-emergency",
        titleEn: "Emergency Contact Card",
        titleEs: "Tarjeta de Contactos de Emergencia",
        kind: "worksheet",
        metaEn: "Worksheet · 1 page",
        metaEs: "Hoja de trabajo · 1 página",
      },
      {
        id: "d17-911",
        titleEn: "Call 911 vs Call Your Center",
        titleEs: "Llamar al 911 o a su Centro",
        kind: "pdf",
        metaEn: "PDF · 1 page",
        metaEs: "PDF · 1 página",
      },
    ],
  },
  {
    day: 18,
    slug: "day-18",
    phase: "living",
    titleEn: "Energy, Sleep and Staying Active",
    titleEs: "Energía, Sueño y Mantenerse Activo",
    summaryEn:
      "Fatigue has causes you can act on: anemia, poor sleep, fluid swings and inactivity. Small amounts of movement help more than most people expect.",
    summaryEs:
      "La fatiga tiene causas sobre las que puede actuar: anemia, mal sueño, cambios de líquido e inactividad. Pequeñas cantidades de movimiento ayudan más de lo que se espera.",
    durationMinutes: 7,
    poster: POSTER,
    videoSrc: "/videos/day-18.mp4",
    keyPointsEn: [
      "Fatigue is common but not something to simply accept",
      "Restless legs and cramps disrupt sleep and are treatable",
      "Ten-minute walks count",
    ],
    keyPointsEs: [
      "La fatiga es común pero no es algo que simplemente deba aceptar",
      "Las piernas inquietas y los calambres afectan el sueño y son tratables",
      "Las caminatas de diez minutos cuentan",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Fatigue is the symptom people on dialysis report most. It is common, but common is not the same as untreatable.",
        textEs:
          "La fatiga es el síntoma más reportado por las personas en diálisis. Es común, pero común no significa que no tenga tratamiento.",
      },
      {
        at: 80,
        textEn:
          "Anemia is the first thing to check, and it shows on your monthly hemoglobin. Treating it often makes a noticeable difference.",
        textEs:
          "La anemia es lo primero que se revisa, y se ve en su hemoglobina mensual. Tratarla suele hacer una diferencia notable.",
      },
      {
        at: 175,
        textEn:
          "Sleep is the second. Restless legs, night cramps, and sleep apnea are all more common on dialysis and all have treatments.",
        textEs:
          "El sueño es lo segundo. Las piernas inquietas, los calambres nocturnos y la apnea del sueño son más comunes en diálisis y todos tienen tratamiento.",
      },
      {
        at: 275,
        textEn:
          "Movement is the third, and it is the one most people skip. Being inactive makes fatigue worse, not better.",
        textEs:
          "El movimiento es lo tercero, y es lo que más personas omiten. Estar inactivo empeora la fatiga, no la mejora.",
      },
      {
        at: 360,
        textEn:
          "Start with ten minutes of walking on a non-treatment day. Check with your team before anything heavier, especially lifting with your access arm.",
        textEs:
          "Empiece con diez minutos de caminata en un día sin tratamiento. Consulte a su equipo antes de algo más pesado, especialmente levantar peso con el brazo del acceso.",
      },
    ],
    documents: [
      {
        id: "d18-activity",
        titleEn: "Gentle Activity Starter Plan",
        titleEs: "Plan Inicial de Actividad Suave",
        kind: "worksheet",
        metaEn: "Worksheet · 2 pages",
        metaEs: "Hoja de trabajo · 2 páginas",
      },
    ],
  },
  {
    day: 19,
    slug: "day-19",
    phase: "living",
    titleEn: "Mood, Stress and Asking for Support",
    titleEs: "Ánimo, Estrés y Pedir Apoyo",
    summaryEn:
      "Depression and anxiety are common after starting dialysis and they affect how well people manage everything else. What help looks like and how to ask for it.",
    summaryEs:
      "La depresión y la ansiedad son comunes después de comenzar la diálisis y afectan qué tan bien se maneja todo lo demás. Cómo es la ayuda y cómo pedirla.",
    durationMinutes: 8,
    poster: POSTER,
    videoSrc: "/videos/day-19.mp4",
    keyPointsEn: [
      "Low mood is common and treatable, not a character flaw",
      "Your social worker is part of the care team for this reason",
      "Peer support helps in ways clinical advice cannot",
    ],
    keyPointsEs: [
      "El ánimo bajo es común y tratable, no un defecto de carácter",
      "Su trabajador social es parte del equipo justamente por esto",
      "El apoyo de pares ayuda de formas que el consejo clínico no puede",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Starting dialysis changes your schedule, your diet, your work and often your independence. Feeling low about that is a normal reaction.",
        textEs:
          "Comenzar la diálisis cambia su horario, su dieta, su trabajo y a menudo su independencia. Sentirse desanimado por eso es una reacción normal.",
      },
      {
        at: 90,
        textEn:
          "It becomes something to treat when it lasts. Losing interest in things you used to enjoy, or pulling away from people, are the signs to watch.",
        textEs:
          "Se convierte en algo que tratar cuando persiste. Perder interés en cosas que disfrutaba, o alejarse de la gente, son las señales a vigilar.",
      },
      {
        at: 200,
        textEn:
          "Depression also makes the practical parts harder. People who are struggling emotionally miss more treatments and manage fluid less well.",
        textEs:
          "La depresión también dificulta la parte práctica. Quienes tienen dificultades emocionales pierden más tratamientos y manejan peor los líquidos.",
      },
      {
        at: 320,
        textEn:
          "Your dialysis social worker is there for exactly this, along with transport, insurance and work questions. Asking is routine, not a burden.",
        textEs:
          "Su trabajador social de diálisis está justamente para esto, junto con transporte, seguros y temas laborales. Pedir ayuda es rutinario, no una carga.",
      },
      {
        at: 430,
        textEn:
          "Talking with other patients helps too. People who have been in the chair for years know things that are hard to learn any other way.",
        textEs:
          "Hablar con otros pacientes también ayuda. Quienes llevan años en el sillón saben cosas difíciles de aprender de otra manera.",
      },
    ],
    documents: [
      {
        id: "d19-support",
        titleEn: "Support Resources Directory",
        titleEs: "Directorio de Recursos de Apoyo",
        kind: "pdf",
        metaEn: "PDF · 2 pages",
        metaEs: "PDF · 2 páginas",
      },
    ],
  },
  {
    day: 20,
    slug: "day-20",
    phase: "living",
    titleEn: "Travel, Work and Planning Ahead",
    titleEs: "Viajes, Trabajo y Planificar con Anticipación",
    summaryEn:
      "Dialysis does not have to end travel or work. What transient dialysis arrangements involve, how far ahead to plan, and what to carry with you.",
    summaryEs:
      "La diálisis no tiene que acabar con los viajes ni el trabajo. Qué implica la diálisis transitoria, con cuánta anticipación planificar y qué llevar consigo.",
    durationMinutes: 8,
    poster: POSTER,
    videoSrc: "/videos/day-20.mp4",
    keyPointsEn: [
      "Book transient treatment four to six weeks ahead",
      "Carry your medical summary and medication list",
      "Ask about home modalities if your schedule is the problem",
    ],
    keyPointsEs: [
      "Reserve tratamiento transitorio con cuatro a seis semanas de anticipación",
      "Lleve su resumen médico y lista de medicamentos",
      "Pregunte por modalidades en casa si el horario es el problema",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "People on dialysis travel regularly. It takes planning, but centers arrange transient treatment for visiting patients all the time.",
        textEs:
          "Las personas en diálisis viajan con regularidad. Requiere planificación, pero los centros organizan tratamiento transitorio para pacientes visitantes todo el tiempo.",
      },
      {
        at: 85,
        textEn:
          "Start four to six weeks out. Your social worker contacts the center at your destination and sends your records ahead.",
        textEs:
          "Empiece con cuatro a seis semanas de anticipación. Su trabajador social contacta al centro de su destino y envía sus registros por adelantado.",
      },
      {
        at: 190,
        textEn:
          "Carry your medication list, a short medical summary, and your access details in your hand luggage, never in a checked bag.",
        textEs:
          "Lleve su lista de medicamentos, un breve resumen médico y los detalles de su acceso en su equipaje de mano, nunca en la maleta documentada.",
      },
      {
        at: 300,
        textEn:
          "For work, many people move to evening or early morning shifts at the center so their schedule fits around a job.",
        textEs:
          "Para el trabajo, muchas personas cambian a turnos de noche o de la mañana temprano en el centro para que su horario se ajuste al empleo.",
      },
      {
        at: 400,
        textEn:
          "If the schedule itself is the barrier, ask about home hemodialysis or peritoneal dialysis. They offer more flexibility for some people.",
        textEs:
          "Si el horario en sí es la barrera, pregunte por la hemodiálisis en casa o la diálisis peritoneal. Ofrecen más flexibilidad para algunas personas.",
      },
    ],
    documents: [
      {
        id: "d20-travel",
        titleEn: "Travel Planning Checklist",
        titleEs: "Lista de Planificación de Viaje",
        kind: "checklist",
        metaEn: "Checklist · 12 items",
        metaEs: "Lista · 12 puntos",
      },
      {
        id: "d20-summary",
        titleEn: "Portable Medical Summary",
        titleEs: "Resumen Médico Portátil",
        kind: "worksheet",
        metaEn: "Worksheet · 2 pages",
        metaEs: "Hoja de trabajo · 2 páginas",
      },
    ],
  },
  {
    day: 21,
    slug: "day-21",
    phase: "living",
    titleEn: "Your Long-Term Care Plan",
    titleEs: "Su Plan de Cuidado a Largo Plazo",
    summaryEn:
      "The last day pulls the program together: the habits worth keeping, the treatment options ahead including transplant, and how to keep steering your own care.",
    summaryEs:
      "El último día reúne todo el programa: los hábitos que vale la pena mantener, las opciones de tratamiento futuras incluido el trasplante, y cómo seguir dirigiendo su propio cuidado.",
    durationMinutes: 10,
    poster: POSTER,
    videoSrc: "/videos/day-21.mp4",
    keyPointsEn: [
      "Four habits carry most of the benefit",
      "Transplant evaluation can start while on dialysis",
      "Review your care plan with your team every few months",
    ],
    keyPointsEs: [
      "Cuatro hábitos aportan la mayor parte del beneficio",
      "La evaluación para trasplante puede iniciar durante la diálisis",
      "Revise su plan de cuidado con su equipo cada pocos meses",
    ],
    transcript: [
      {
        at: 0,
        textEn:
          "Three weeks in, the habits that carry most of the benefit are simple: attend full treatments, watch fluid, take binders with food, and protect your access.",
        textEs:
          "Tres semanas después, los hábitos que aportan la mayor parte del beneficio son simples: asistir a tratamientos completos, vigilar los líquidos, tomar quelantes con comida y proteger su acceso.",
      },
      {
        at: 110,
        textEn:
          "Beyond that, keep logging. The value of your log is not any single entry, it is the pattern your team can see across months.",
        textEs:
          "Además de eso, siga registrando. El valor de su registro no es una entrada individual, es el patrón que su equipo puede ver a lo largo de los meses.",
      },
      {
        at: 230,
        textEn:
          "Dialysis is one option, not the only one. Home modalities and kidney transplant are worth discussing even if they are not right today.",
        textEs:
          "La diálisis es una opción, no la única. Las modalidades en casa y el trasplante de riñón vale la pena discutirlos incluso si hoy no son adecuados.",
      },
      {
        at: 360,
        textEn:
          "Transplant evaluation takes time, and being on dialysis does not prevent you from starting it. Ask your nephrologist whether you are a candidate.",
        textEs:
          "La evaluación para trasplante toma tiempo, y estar en diálisis no le impide comenzarla. Pregunte a su nefrólogo si es candidato.",
      },
      {
        at: 500,
        textEn:
          "Set a reminder to review your care plan every few months. You know more now than you did on day one, so keep asking questions.",
        textEs:
          "Programe un recordatorio para revisar su plan de cuidado cada pocos meses. Ahora sabe más que el primer día, así que siga haciendo preguntas.",
      },
    ],
    documents: [
      {
        id: "d21-plan",
        titleEn: "My Long-Term Care Plan",
        titleEs: "Mi Plan de Cuidado a Largo Plazo",
        kind: "worksheet",
        metaEn: "Worksheet · 3 pages",
        metaEs: "Hoja de trabajo · 3 páginas",
      },
      {
        id: "d21-transplant",
        titleEn: "Transplant Evaluation: What to Expect",
        titleEs: "Evaluación para Trasplante: Qué Esperar",
        kind: "pdf",
        metaEn: "PDF · 3 pages",
        metaEs: "PDF · 3 páginas",
      },
    ],
  },
];

export const TOTAL_JOURNEY_DAYS = JOURNEY_DAYS.length;

export function getJourneyDayBySlug(slug: string): JourneyDay | undefined {
  return JOURNEY_DAYS.find((entry) => entry.slug === slug);
}

export function getJourneyDayByNumber(day: number): JourneyDay | undefined {
  return JOURNEY_DAYS.find((entry) => entry.day === day);
}

export function getJourneyDaysByPhase(phase: JourneyPhaseKey): JourneyDay[] {
  return JOURNEY_DAYS.filter((entry) => entry.phase === phase);
}

/** Renders a cue offset as `m:ss`, matching how the timestamps read on screen. */
export function formatCueTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
