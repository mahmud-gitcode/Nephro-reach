import type { Question, VideoQuestion } from "./questions.types";

/* ==========================================================================
   Sample questions for the seeded 21-day course
   --------------------------------------------------------------------------
   Placeholders until the curriculum package arrives, so every question
   type can be seen and tried. Admins can edit or delete all of them.
   ========================================================================== */

function choice(
  id: string,
  kind: "multiple-choice" | "scenario",
  promptEn: string,
  promptEs: string,
  options: Array<[string, string, string, string]>,
  correctIndex: number,
  scenario: [string, string] = ["", ""],
): Question {
  return {
    id,
    kind,
    promptEn,
    promptEs,
    scenarioEn: scenario[0],
    scenarioEs: scenario[1],
    options: options.map(([textEn, textEs, feedbackEn, feedbackEs], index) => ({
      id: `${id}-o${index + 1}`,
      textEn,
      textEs,
      feedbackEn,
      feedbackEs,
    })),
    correctOptionId: `${id}-o${correctIndex + 1}`,
    pairs: [],
    fields: [],
    destination: "workbook",
    placeholderEn: "",
    placeholderEs: "",
  };
}

function trueFalse(
  id: string,
  promptEn: string,
  promptEs: string,
  answer: boolean,
  whyEn: string,
  whyEs: string,
): Question {
  return {
    id,
    kind: "true-false",
    promptEn,
    promptEs,
    scenarioEn: "",
    scenarioEs: "",
    options: [
      {
        id: "true",
        textEn: "True",
        textEs: "Verdadero",
        feedbackEn: whyEn,
        feedbackEs: whyEs,
      },
      {
        id: "false",
        textEn: "False",
        textEs: "Falso",
        feedbackEn: whyEn,
        feedbackEs: whyEs,
      },
    ],
    correctOptionId: answer ? "true" : "false",
    pairs: [],
    fields: [],
    destination: "workbook",
    placeholderEn: "",
    placeholderEs: "",
  };
}

function reflection(id: string, promptEn: string, promptEs: string): Question {
  return {
    id,
    kind: "reflection",
    promptEn,
    promptEs,
    scenarioEn: "",
    scenarioEs: "",
    options: [],
    correctOptionId: "",
    pairs: [],
    fields: [],
    destination: "workbook",
    placeholderEn: "Write a few words…",
    placeholderEs: "Escribe unas palabras…",
  };
}

const MATCH_ACCESS: Question = {
  id: "seed-final-match",
  kind: "matching",
  promptEn: "Match each dialysis access to what it is.",
  promptEs: "Relaciona cada acceso de diálisis con lo que es.",
  scenarioEn: "",
  scenarioEs: "",
  options: [],
  correctOptionId: "",
  pairs: [
    {
      id: "seed-final-match-p1",
      leftEn: "Fistula",
      leftEs: "Fístula",
      rightEn: "Your own artery joined to a vein",
      rightEs: "Tu propia arteria unida a una vena",
    },
    {
      id: "seed-final-match-p2",
      leftEn: "Graft",
      leftEs: "Injerto",
      rightEn: "A soft tube linking artery and vein",
      rightEs: "Un tubo blando que une arteria y vena",
    },
    {
      id: "seed-final-match-p3",
      leftEn: "Catheter",
      leftEs: "Catéter",
      rightEn: "A tube placed in a large vein in the chest or neck",
      rightEs: "Un tubo en una vena grande del pecho o cuello",
    },
  ],
  fields: [],
  destination: "workbook",
  placeholderEn: "",
  placeholderEs: "",
};

const CARE_TEAM_FILL_IN: Question = {
  id: "seed-day02-fillin",
  kind: "fill-in",
  promptEn: "What would you like to ask your care team this week?",
  promptEs: "¿Qué te gustaría preguntarle a tu equipo esta semana?",
  scenarioEn: "",
  scenarioEs: "",
  options: [],
  correctOptionId: "",
  pairs: [],
  fields: [
    {
      id: "seed-day02-fillin-f1",
      labelEn: "My question",
      labelEs: "Mi pregunta",
    },
  ],
  destination: "care-team",
  placeholderEn: "e.g. How long will my first treatment take?",
  placeholderEs: "ej. ¿Cuánto durará mi primer tratamiento?",
};

/** Lesson activities, keyed by class id. */
export const SEED_ACTIVITIES: Record<string, Question[]> = {
  "day-01": [
    choice(
      "seed-day01-mc",
      "multiple-choice",
      "What does dialysis do for your body?",
      "¿Qué hace la diálisis por tu cuerpo?",
      [
        [
          "Cleans waste and extra fluid from your blood",
          "Limpia desechos y líquido extra de tu sangre",
          "Right — it takes over the filtering your kidneys can no longer do.",
          "Correcto: hace el filtrado que tus riñones ya no pueden hacer.",
        ],
        [
          "Cures kidney disease",
          "Cura la enfermedad renal",
          "Not quite. Dialysis replaces kidney function; it does not cure the disease.",
          "No exactamente. La diálisis reemplaza la función renal; no cura la enfermedad.",
        ],
        [
          "Replaces your need for medicines",
          "Reemplaza tus medicinas",
          "Most people on dialysis still take medicines prescribed by their team.",
          "La mayoría de las personas en diálisis aún toman medicinas recetadas.",
        ],
      ],
      0,
    ),
    reflection(
      "seed-day01-reflect",
      "How are you feeling about starting dialysis?",
      "¿Cómo te sientes al comenzar la diálisis?",
    ),
  ],
  "day-02": [
    trueFalse(
      "seed-day02-tf",
      "You should tell your care team if your access site is red or warm.",
      "Debes avisar a tu equipo si tu acceso está rojo o caliente.",
      true,
      "Redness or warmth can be a sign of infection, so tell your team early.",
      "El enrojecimiento o calor puede ser señal de infección; avisa pronto a tu equipo.",
    ),
    CARE_TEAM_FILL_IN,
  ],
};

/** Pop-up questions during the video, keyed by class id. */
export const SEED_VIDEO_QUESTIONS: Record<string, VideoQuestion[]> = {
  "day-01": [
    {
      id: "seed-day01-vq",
      at: 30,
      question: trueFalse(
        "seed-day01-vq-q",
        "Dialysis usually happens on a regular weekly schedule.",
        "La diálisis suele hacerse con un horario semanal fijo.",
        true,
        "Most in-center schedules are three times a week.",
        "La mayoría de los horarios en centro son tres veces por semana.",
      ),
    },
  ],
};

/** Exam classes, keyed by the module they close. */
export const SEED_EXAMS: Record<
  string,
  { id: string; titleEn: string; titleEs: string; questions: Question[] }
> = {
  "module-foundation": {
    id: "exam-module-foundation",
    titleEn: "Module 1 exam",
    titleEs: "Examen del módulo 1",
    questions: [
      choice(
        "seed-check-foundation-1",
        "multiple-choice",
        "Which is the most common access for long-term dialysis?",
        "¿Cuál es el acceso más común para la diálisis a largo plazo?",
        [
          [
            "A fistula",
            "Una fístula",
            "Yes — it usually lasts longest and has fewer infections.",
            "Sí: suele durar más y tener menos infecciones.",
          ],
          [
            "A bandage",
            "Un vendaje",
            "A bandage covers the site; it is not an access.",
            "Un vendaje cubre el sitio; no es un acceso.",
          ],
          [
            "An IV in the hand",
            "Una vía en la mano",
            "Hand IVs are not used for dialysis.",
            "Las vías de la mano no se usan para diálisis.",
          ],
        ],
        0,
      ),
      trueFalse(
        "seed-check-foundation-2",
        "It is fine to have blood pressure taken on your fistula arm.",
        "Está bien tomar la presión en el brazo de la fístula.",
        false,
        "Protect your access arm: no blood pressure cuffs or blood draws on it.",
        "Protege el brazo del acceso: sin tomas de presión ni extracciones de sangre.",
      ),
    ],
  },
};

/** The final exam for the seeded course. */
export const SEED_FINAL_EXAM: Question[] = [
  choice(
    "seed-final-1",
    "multiple-choice",
    "Why is limiting fluid between treatments important?",
    "¿Por qué es importante limitar los líquidos entre tratamientos?",
    [
      [
        "Extra fluid strains your heart and lungs",
        "El líquido extra afecta tu corazón y pulmones",
        "Right — fluid builds up when kidneys cannot remove it.",
        "Correcto: el líquido se acumula cuando los riñones no lo eliminan.",
      ],
      [
        "It makes treatments shorter",
        "Hace los tratamientos más cortos",
        "Treatment length is set by your team, not by thirst.",
        "La duración la decide tu equipo, no la sed.",
      ],
      [
        "It has no real effect",
        "No tiene efecto real",
        "It has a big effect on how you feel between treatments.",
        "Tiene un gran efecto en cómo te sientes entre tratamientos.",
      ],
    ],
    0,
  ),
  trueFalse(
    "seed-final-2",
    "Potassium can build up in your blood when your kidneys are not working well.",
    "El potasio puede acumularse en tu sangre cuando tus riñones no funcionan bien.",
    true,
    "High potassium can affect your heartbeat, so it is watched closely.",
    "El potasio alto puede afectar tu ritmo cardíaco, por eso se vigila de cerca.",
  ),
  choice(
    "seed-final-3",
    "scenario",
    "What would you do?",
    "¿Qué harías?",
    [
      [
        "Call your dialysis unit and ask what to do",
        "Llamar a tu unidad de diálisis y preguntar",
        "Best choice — your unit can reschedule or advise you safely.",
        "La mejor opción: tu unidad puede reprogramar o aconsejarte.",
      ],
      [
        "Skip it and wait for the next one",
        "Saltarlo y esperar al siguiente",
        "Missing a treatment lets fluid and potassium build up.",
        "Faltar deja que se acumulen líquido y potasio.",
      ],
      [
        "Drink less water and hope for the best",
        "Beber menos agua y esperar",
        "Less water helps, but it does not replace the treatment.",
        "Beber menos ayuda, pero no reemplaza el tratamiento.",
      ],
    ],
    0,
    [
      "Your ride cancels an hour before your treatment and you cannot find another way in.",
      "Tu transporte cancela una hora antes del tratamiento y no encuentras otra forma de llegar.",
    ],
  ),
  MATCH_ACCESS,
];
