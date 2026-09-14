export type NextStepLevel =
  "call911" | "urgentMedical" | "callDialysis" | "monitor";

export interface NextStepConfig {
  level: NextStepLevel;
  badgeEn: string;
  badgeEs: string;
  descriptionEn: string;
  descriptionEs: string;
  dotColor: string;
  badgeClass: string;
  cardBorder: string;
  cardBg: string;
}

/* Four rungs of urgency, three owned hues. The palette has one warning, so
   rungs 2 and 3 share it and separate by weight instead: urgentMedical is a
   solid warning badge, callDialysis a soft one. */
export const NEXT_STEP_CONFIGS: Record<NextStepLevel, NextStepConfig> = {
  call911: {
    level: "call911",
    badgeEn: "CALL 911 NOW",
    badgeEs: "LLAME AL 911 AHORA",
    descriptionEn:
      "Your answers may indicate a medical emergency. Do not wait for your next dialysis treatment.",
    descriptionEs:
      "Sus respuestas pueden indicar una emergencia médica. No espere a su próximo tratamiento de diálisis.",
    dotColor: "bg-danger-solid",
    badgeClass: "bg-danger-600 text-white border-danger-600",
    cardBorder: "border-danger-line",
    cardBg: "bg-danger-surface",
  },
  urgentMedical: {
    level: "urgentMedical",
    badgeEn: "Urgent Medical Evaluation",
    badgeEs: "Evaluación Médica Urgente",
    descriptionEn: "Your symptoms need prompt medical evaluation.",
    descriptionEs: "Sus síntomas necesitan una pronta evaluación médica.",
    dotColor: "bg-warning-600",
    badgeClass: "bg-warning-600 text-white border-warning-600",
    cardBorder: "border-warning-line",
    cardBg: "bg-warning-surface",
  },
  callDialysis: {
    level: "callDialysis",
    badgeEn: "Call Your Dialysis Center Now",
    badgeEs: "Llame a su Centro de Diálisis Ahora",
    descriptionEn:
      "This may be something your dialysis team needs to assess before you go to the ER.",
    descriptionEs:
      "Esto puede ser algo que su equipo de diálisis deba evaluar antes de ir a urgencias.",
    dotColor: "bg-warning-600",
    badgeClass: "bg-warning-100 text-warning border-warning-line",
    cardBorder: "border-warning-line",
    cardBg: "bg-warning-surface",
  },
  monitor: {
    level: "monitor",
    badgeEn: "Monitor & Recheck",
    badgeEs: "Monitorear y Volver a Revisar",
    descriptionEn:
      "Symptoms are mild and there are no emergency warning signs.",
    descriptionEs:
      "Los síntomas son leves y no hay señales de advertencia de emergencia.",
    dotColor: "bg-success-600",
    badgeClass: "bg-success-100 text-success border-success-line",
    cardBorder: "border-success-line",
    cardBg: "bg-success-surface",
  },
};

export interface BeforeTheErTopicInfo {
  slug: string;
  key: string;
  titleEn: string;
  titleEs: string;
  urgent: boolean;
  nextStepLevel: NextStepLevel;
  whatToWatchForFullEn: string;
  whatToWatchForFullEs: string;
  symptomsListEn: string[];
  symptomsListEs: string[];
  actionNoteEn: string;
  actionNoteEs: string;
  importantInEn: string[];
  importantInEs: string[];
}

export const BEFORE_THE_ER_TOPICS: Record<string, BeforeTheErTopicInfo> = {
  "chest-pain": {
    slug: "chest-pain",
    key: "chestPain",
    titleEn: "Chest Pain",
    titleEs: "Dolor de Pecho",
    urgent: true,
    nextStepLevel: "call911",
    whatToWatchForFullEn:
      "Pressure, squeezing, heaviness or tightness; pain spreading to arm, jaw, back, neck or stomach; shortness of breath; sweating; nausea; dizziness/lightheadedness; new or worsening chest discomfort. New/severe chest pain or heart-attack-type symptoms → Call 911. ([www.heart.org](https://www.heart.org/en/about-us/heart-attack-and-stroke-symptoms?linkId=118155972&utm_source=chatgpt.com))",
    whatToWatchForFullEs:
      "Presión, opresión, pesadez o tirantez; dolor que se extiende al brazo, mandíbula, espalda, cuello o estómago; dificultad para respirar; sudoración; náuseas; mareo o aturdimiento; malestar en el pecho nuevo o que empeora. Dolor de pecho nuevo/grave o síntomas de tipo infarto → Llame al 911.",
    symptomsListEn: [
      "Pressure, squeezing, heaviness, or tightness in the chest",
      "Pain spreading to arm, jaw, back, neck, or stomach",
      "Shortness of breath or difficulty catching breath",
      "Cold sweats or unexplained heavy sweating",
      "Nausea or vomiting",
      "Dizziness or lightheadedness",
      "New or rapidly worsening chest discomfort",
    ],
    symptomsListEs: [
      "Presión, opresión, pesadez o tirantez en el pecho",
      "Dolor que se extiende al brazo, mandíbula, espalda, cuello o estómago",
      "Dificultad para respirar o falta de aire",
      "Sudores fríos o sudoración intensa inexplicable",
      "Náuseas o vómitos",
      "Mareos o sensación de desmayo",
      "Malestar en el pecho nuevo o que empeora rápidamente",
    ],
    actionNoteEn:
      "New/severe chest pain or heart-attack-type symptoms → Call 911.",
    actionNoteEs:
      "Dolor de pecho nuevo o grave o síntomas de tipo infarto → Llame al 911.",
    importantInEn: [
      "Dialysis patients with high cardiovascular risk",
      "Patients with kidney failure and fluid shifts",
      "Patients with diabetes or prior heart disease",
    ],
    importantInEs: [
      "Pacientes en diálisis con alto riesgo cardiovascular",
      "Pacientes con insuficiencia renal y cambios de líquidos",
      "Pacientes con diabetes o antecedentes de cardiopatía",
    ],
  },

  "severe-fluid-overload": {
    slug: "severe-fluid-overload",
    key: "severeFluidOverload",
    titleEn: "Severe Fluid Overload",
    titleEs: "Sobrecarga de Líquidos Grave",
    urgent: true,
    nextStepLevel: "callDialysis",
    whatToWatchForFullEn:
      "Rapid weight gain above usual dry weight; increasing ankle/leg/face swelling; worsening shortness of breath; difficulty lying flat; needing extra pillows to breathe; cough; abdominal swelling/tightness; missed or shortened dialysis treatment. Severe trouble breathing → 911. Dialysis patients should report significant swelling and breathing problems promptly. ([National Kidney Foundation](https://www.kidney.org/sites/default/files/2026-09/441-0518_2608-patflyer_checklist_hemodialysis-v2.pdf?utm_source=chatgpt.com))",
    whatToWatchForFullEs:
      "Aumento rápido de peso por encima del peso seco habitual; hinchazón creciente en tobillos, piernas o cara; empeoramiento de la dificultad para respirar; dificultad para acostarse plano; necesidad de almohadas adicionales para respirar; tos; hinchazón o tirantez abdominal; tratamiento de diálisis omitido o acortado. Dificultad grave para respirar → 911. Los pacientes en diálisis deben informar de inmediato la hinchazón significativa y los problemas respiratorios.",
    symptomsListEn: [
      "Rapid weight gain above usual dry weight",
      "Increasing ankle, leg, or facial swelling",
      "Worsening shortness of breath",
      "Difficulty lying flat; needing extra pillows to breathe (orthopnea)",
      "Persistent or worsening cough",
      "Abdominal swelling or tightness (ascites / fluid retention)",
      "Symptoms occurring after a missed or shortened dialysis treatment",
    ],
    symptomsListEs: [
      "Aumento rápido de peso por encima del peso seco habitual",
      "Hinchazón creciente en tobillos, piernas o cara",
      "Empeoramiento de la falta de aire",
      "Dificultad para acostarse boca arriba; necesidad de más almohadas para respirar",
      "Tos persistente o que empeora",
      "Hinchazón o tirantez abdominal",
      "Síntomas tras una sesión de diálisis omitida o acortada",
    ],
    actionNoteEn:
      "Severe trouble breathing → Call 911. Dialysis patients should report significant swelling and breathing problems promptly.",
    actionNoteEs:
      "Dificultad respiratoria grave → Llame al 911. Los pacientes en diálisis deben reportar de inmediato hinchazón severa y problemas respiratorios.",
    importantInEn: [
      "Dialysis patients between treatment days",
      "Patients with interdialytic weight gains exceeding recommended limits",
      "Patients with underlying congestive heart failure",
    ],
    importantInEs: [
      "Pacientes en diálisis entre días de tratamiento",
      "Pacientes con ganancia de peso interdialítica por encima de los límites",
      "Pacientes con insuficiencia cardíaca congestiva",
    ],
  },

  "signs-of-stroke": {
    slug: "signs-of-stroke",
    key: "signsOfStroke",
    titleEn: "Signs of Stroke",
    titleEs: "Signos de Accidente Cerebrovascular",
    urgent: true,
    nextStepLevel: "call911",
    whatToWatchForFullEn:
      "Balance suddenly off; Eyes/vision suddenly changed; Face drooping; Arm weakness/numbness; Speech slurred/confused; Time to call 911. Also watch for sudden severe headache. Do not wait to see if symptoms improve. Call 911. ([American Heart Association](https://newsroom.heart.org/news/knowing-stroke-signs-can-save-a-life-when-every-minute-counts?utm_source=chatgpt.com))",
    whatToWatchForFullEs:
      "Pérdida repentina del equilibrio; cambios repentinos en ojos o visión; rostro caído; debilidad o entumecimiento en el brazo; habla arrastrada o confundida; hora de llamar al 911. Esté alerta a dolor de cabeza repentino e intenso. No espere a ver si los síntomas mejoran. Llame al 911.",
    symptomsListEn: [
      "Balance suddenly off or difficulty walking",
      "Eyes or vision suddenly blurred, doubled, or lost",
      "Face drooping or uneven smile",
      "Arm weakness or numbness on one side of the body",
      "Speech slurred, strange, or difficulty understanding",
      "Sudden, unusually severe headache",
    ],
    symptomsListEs: [
      "Pérdida repentina del equilibrio o dificultad para caminar",
      "Visión borrosa, doble o pérdida repentina de visión",
      "Rostro caído o sonrisa asimétrica",
      "Debilidad o entumecimiento en un brazo o lado del cuerpo",
      "Habla arrastrada, confusa o dificultad para comprender",
      "Dolor de cabeza repentino y de intensidad inusual",
    ],
    actionNoteEn:
      "Time to call 911. Also watch for sudden severe headache. Do not wait to see if symptoms improve. Call 911.",
    actionNoteEs:
      "Hora de llamar al 911. También vigile dolor de cabeza severo repentino. No espere a ver si mejora. Llame al 911.",
    importantInEn: [
      "Dialysis patients with high blood pressure or vascular disease",
      "Patients on anticoagulants or blood thinners",
      "Patients with history of stroke, TIA, or atrial fibrillation",
    ],
    importantInEs: [
      "Pacientes en diálisis con hipertensión o enfermedad vascular",
      "Pacientes bajo tratamiento con anticoagulantes",
      "Pacientes con antecedentes de ACV, AIT o fibrilación auricular",
    ],
  },

  "loss-of-consciousness": {
    slug: "loss-of-consciousness",
    key: "lossOfConsciousness",
    titleEn: "Loss of Consciousness",
    titleEs: "Pérdida del Conocimiento",
    urgent: true,
    nextStepLevel: "call911",
    whatToWatchForFullEn:
      "Fainting/unresponsiveness; inability to wake normally; abnormal or absent breathing; seizure-like activity; chest pain or severe breathing difficulty before/after episode. Unresponsive or not breathing normally → Call 911. ([www.heart.org](https://www.heart.org/en/about-us/heart-attack-and-stroke-symptoms?linkId=118155972&utm_source=chatgpt.com))",
    whatToWatchForFullEs:
      "Desmayo o falta de respuesta; incapacidad para despertar normalmente; respiración anormal o ausente; actividad similar a convulsiones; dolor de pecho o dificultad respiratoria grave antes o después del episodio. Inconsciente o sin respiración normal → Llame al 911.",
    symptomsListEn: [
      "Fainting, blackout, or unresponsiveness",
      "Inability to wake the person normally",
      "Abnormal, shallow, or completely absent breathing",
      "Seizure-like jerking or stiffening activity",
      "Chest pain or severe breathlessness occurring before or after episode",
    ],
    symptomsListEs: [
      "Desmayos, pérdida de conciencia o falta de respuesta",
      "Incapacidad para despertar normalmente a la persona",
      "Respiración anormal, superficial o ausente",
      "Sacudidas o rigidez de tipo convulsivo",
      "Dolor torácico o dificultad respiratoria severa antes o después",
    ],
    actionNoteEn: "Unresponsive or not breathing normally → Call 911.",
    actionNoteEs: "Inconsciente o sin respiración normal → Llame al 911.",
    importantInEn: [
      "Dialysis patients experiencing severe post-treatment hypotension",
      "Patients with cardiac arrhythmias or severe electrolyte abnormalities",
      "Diabetic kidney disease patients prone to hypoglycemia",
    ],
    importantInEs: [
      "Pacientes en diálisis con hipotensión posdiálisis severa",
      "Pacientes con arritmias cardíacas o anomalías electrolíticas",
      "Pacientes diabéticos con riesgo de hipoglucemia severa",
    ],
  },

  "severe-allergic-reactions": {
    slug: "severe-allergic-reactions",
    key: "severeAllergicReactions",
    titleEn: "Severe Allergic Reaction",
    titleEs: "Reacción Alérgica Grave",
    urgent: true,
    nextStepLevel: "call911",
    whatToWatchForFullEn:
      "Swelling of lips, tongue, face or throat; difficulty breathing; wheezing; trouble swallowing; widespread hives with breathing/swelling symptoms; dizziness, fainting or sudden weakness. Suspected anaphylaxis → 911.",
    whatToWatchForFullEs:
      "Hinchazón de labios, lengua, cara o garganta; dificultad para respirar; sibilancias; dificultad para tragar; urticaria generalizada acompañada de problemas respiratorios; mareos, desmayos o debilidad repentina. Sospecha de anafilaxia → 911.",
    symptomsListEn: [
      "Swelling of the lips, tongue, face, eyes, or throat",
      "Difficulty breathing, gasping, or noisy wheezing",
      "Trouble swallowing or feeling like throat is closing",
      "Widespread hives or intense rash with breathing/swelling symptoms",
      "Dizziness, lightheadedness, fainting, or sudden weakness",
    ],
    symptomsListEs: [
      "Hinchazón de labios, lengua, cara, ojos o garganta",
      "Dificultad para respirar, jadeos o silbidos en el pecho",
      "Dificultad para tragar o sensación de cierre en la garganta",
      "Urticaria generalizada con síntomas respiratorios",
      "Mareo, aturdimiento, desmayo o debilidad repentina",
    ],
    actionNoteEn: "Suspected anaphylaxis → Call 911 immediately.",
    actionNoteEs: "Sospecha de anafilaxia → Llame al 911 de inmediato.",
    importantInEn: [
      "Patients starting new medications, antibiotics, or dialyzer membranes",
      "Patients receiving intravenous iron or erythropoietin injections",
      "Individuals with known severe drug or food allergies",
    ],
    importantInEs: [
      "Pacientes con medicamentos nuevos, antibióticos o membranas dializadoras",
      "Pacientes que reciben hierro intravenoso o inyecciones de EPO",
      "Personas con alergias graves conocidas a fármacos o alimentos",
    ],
  },

  "severe-shortness-of-breath": {
    slug: "severe-shortness-of-breath",
    key: "severeShortnessOfBreath",
    titleEn: "Severe Shortness of Breath",
    titleEs: "Dificultad Respiratoria Grave",
    urgent: true,
    nextStepLevel: "call911",
    whatToWatchForFullEn:
      "Unable to speak normally because of breathlessness; struggling/gasping for air; sudden worsening; chest pain; fainting/confusion; severe weakness; rapidly worsening swelling/fluid overload. Severe breathing difficulty → 911. ([Nkf](https://nkf.li/kidney-topics/hemodialysis?utm_source=chatgpt.com))",
    whatToWatchForFullEs:
      "Incapaz de hablar normalmente debido a la falta de aire; lucha o jadeo por respirar; empeoramiento repentino; dolor de pecho; desmayos o confusión; debilidad grave; hinchazón o sobrecarga de líquidos que empeora rápidamente. Dificultad respiratoria grave → 911.",
    symptomsListEn: [
      "Unable to speak in full sentences because of breathlessness",
      "Struggling, gasping, or fighting for air",
      "Sudden, acute worsening of breathing while resting",
      "Shortness of breath accompanied by chest pain or tightness",
      "Fainting, severe confusion, or blue-tinted lips/fingers",
      "Severe weakness combined with rapidly worsening fluid overload",
    ],
    symptomsListEs: [
      "Incapaz de hablar en oraciones completas por falta de aire",
      "Lucha o jadeo intenso por respirar",
      "Empeoramiento agudo y repentino en reposo",
      "Falta de aire acompañada de dolor u opresión en el pecho",
      "Desmayos, confusión severa o labios/dedos azulados",
      "Debilidad intensa combinada con sobrecarga rápida de líquidos",
    ],
    actionNoteEn: "Severe breathing difficulty → Call 911 immediately.",
    actionNoteEs: "Dificultad respiratoria grave → Llame al 911 de inmediato.",
    importantInEn: [
      "Dialysis patients after missed treatments (acute pulmonary edema)",
      "Patients with severe anemia or pericardial effusion",
      "Patients with combined heart failure and kidney failure",
    ],
    importantInEs: [
      "Pacientes en diálisis con tratamientos omitidos (edema pulmonar agudo)",
      "Pacientes con anemia severa o derrame pericárdico",
      "Pacientes con insuficiencia cardíaca y renal combinada",
    ],
  },

  seizures: {
    slug: "seizures",
    key: "seizures",
    titleEn: "Seizures",
    titleEs: "Convulsiones",
    urgent: true,
    nextStepLevel: "urgentMedical",
    whatToWatchForFullEn:
      "Loss of awareness; stiffening/jerking; staring/unresponsiveness; unusual movements; confusion afterward. Emergency triggers include prolonged seizure, repeated seizures without recovery, injury, breathing difficulty, or first known seizure.",
    whatToWatchForFullEs:
      "Pérdida de conciencia; rigidez o sacudidas corporales; mirada perdida o falta de respuesta; movimientos inusuales; confusión posterior. Los factores de emergencia incluyen convulsión prolongada, convulsiones repetidas sin recuperación, lesión, dificultad respiratoria o primera convulsión conocida.",
    symptomsListEn: [
      "Sudden loss of awareness or consciousness",
      "Rhythmic stiffening, twitching, or jerking of arms and legs",
      "Blank staring with complete unresponsiveness",
      "Involuntary unusual movements or loss of bowel/bladder control",
      "Confusion, disorientation, or prolonged sleepiness afterward",
    ],
    symptomsListEs: [
      "Pérdida repentina de conciencia o percepción",
      "Rigidez rítmica, temblores o sacudidas de brazos y piernas",
      "Mirada fija y vacía con falta total de respuesta",
      "Movimientos involuntarios o pérdida de control de esfínteres",
      "Confusión profunda, desorientación o somnolencia prolongada posterior",
    ],
    actionNoteEn:
      "Emergency triggers include prolonged seizure (>5 min), repeated seizures without recovery, injury, breathing difficulty, or first known seizure → Call 911.",
    actionNoteEs:
      "Detonantes de emergencia: convulsión prolongada (>5 min), convulsiones repetidas sin recuperación, lesión, dificultad respiratoria o primera convulsión → Llame al 911.",
    importantInEn: [
      "Dialysis disequilibrium syndrome (rapid electrolyte shifts during treatment)",
      "Critical electrolyte disturbances (severe hyperkalemia, hyponatremia, hypocalcemia)",
      "Severe uremic encephalopathy or malignant hypertension",
    ],
    importantInEs: [
      "Síndrome de desequilibrio por diálisis (cambios rápidos de electrolitos)",
      "Alteraciones electrolíticas críticas (hiperpotasemia, hiponatremia, hipocalcemia)",
      "Encefalopatía urémica severa o crisis hipertensiva",
    ],
  },

  "dialysis-access-emergencies": {
    slug: "dialysis-access-emergencies",
    key: "dialysisAccessEmergencies",
    titleEn: "Dialysis Access Emergencies",
    titleEs: "Emergencias del Acceso de Diálisis",
    urgent: true,
    nextStepLevel: "callDialysis",
    whatToWatchForFullEn:
      "Fistula/graft: absent or significantly changed thrill/buzz, increasing redness/warmth/swelling/pain, drainage, or bleeding. Catheter: redness, drainage, pain, wet/loose dressing, catheter moved/cracked/leaking, fever/chills. Heavy/spurting bleeding → 911. ([National Kidney Foundation](https://www.kidney.org/kidney-topics/hemodialysis-access?page=2&utm_source=chatgpt.com))",
    whatToWatchForFullEs:
      "Fístula/injerto: ausencia o cambio significativo en el frémito/vibración (thrill), enrojecimiento/calor/hinchazón/dolor crecientes, secreción o sangrado. Catéter: enrojecimiento, secreción, dolor, vendaje húmedo o suelto, catéter desplazado/agrietado/con fugas, fiebre o escalofríos. Sangrado abundante o en chorro → 911.",
    symptomsListEn: [
      "Fistula/Graft: Absent or significantly reduced thrill (buzzing vibration) or bruit",
      "Fistula/Graft: Increasing redness, heat, swelling, or severe tenderness",
      "Fistula/Graft: Drainage, pus, or persistent bleeding from needle sites",
      "Catheter: Redness, pus, drainage, or tenderness at the exit site/cuff",
      "Catheter: Wet, soiled, or loose dressing; catheter pulled, cracked, or leaking",
      "Fever or chills following a dialysis session",
      "Heavy, continuous, or spurting bleeding from any access site",
    ],
    symptomsListEs: [
      "Fístula/Injerto: Ausencia o reducción importante del frémito (vibración) o soplo",
      "Fístula/Injerto: Enrojecimiento, calor, hinchazón creciente o dolor severo",
      "Fístula/Injerto: Supuración, pus o sangrado persistente en sitios de punción",
      "Catéter: Enrojecimiento, pus, secreción o dolor en el sitio de salida o túnel",
      "Catéter: Vendaje mojado, sucio o suelto; catéter movido, roto o con fuga",
      "Fiebre o escalofríos después de una sesión de diálisis",
      "Sangrado profuso, continuo o en chorro desde cualquier sitio de acceso",
    ],
    actionNoteEn:
      "Heavy or spurting bleeding from dialysis access → Call 911 immediately.",
    actionNoteEs:
      "Sangrado profuso o en chorro del acceso de diálisis → Llame al 911 de inmediato.",
    importantInEn: [
      "Hemodialysis patients with arteriovenous (AV) fistula or graft",
      "Patients with tunneled or temporary central venous dialysis catheters",
      "Patients on blood thinners with delayed needle-site clotting",
    ],
    importantInEs: [
      "Pacientes en hemodiálisis con fístula o injerto arteriovenoso (FAV)",
      "Pacientes con catéter venoso central tunelizado o temporal",
      "Pacientes anticoagulados con coagulación tardía en sitios de aguja",
    ],
  },

  "severe-bleeding": {
    slug: "severe-bleeding",
    key: "severeBleeding",
    titleEn: "Severe Bleeding",
    titleEs: "Sangrado Intenso",
    urgent: true,
    nextStepLevel: "call911",
    whatToWatchForFullEn:
      "Bleeding that will not stop with firm direct pressure; blood soaking through gauze/towels; spurting/pulsating bleeding; dizziness, weakness or fainting. Dialysis-access bleeding that is heavy, spurting, or will not stop requires emergency help. ([Nkf](https://nkf.li/kidney-topics/hemodialysis-access?page=0&utm_source=chatgpt.com))",
    whatToWatchForFullEs:
      "Sangrado que no se detiene con presión directa y firme; sangre que empapa gasas o toallas; sangrado en chorro o pulsátil; mareos, debilidad o desmayos. El sangrado del acceso de diálisis que es abundante, en chorro o que no se detiene requiere ayuda de emergencia inmediata.",
    symptomsListEn: [
      "Bleeding that will not stop despite 15–20 minutes of continuous firm pressure",
      "Blood rapidly soaking through multiple thick bandages, gauze, or towels",
      "Pulsating, pumping, or spurting bright red blood from access site",
      "Severe dizziness, cold clammy skin, confusion, or fainting from blood loss",
      "Bleeding from dialysis puncture sites that restarts after leaving clinic",
    ],
    symptomsListEs: [
      "Sangrado que no cesa tras 15-20 minutos de presión firme y constante",
      "Sangre que empapa rápidamente vendajes gruesos, gasas o toallas",
      "Sangrado pulsátil, continuo o a chorros desde el sitio de punción",
      "Mareos intensos, piel fría y sudorosa, confusión o desmayos por pérdida de sangre",
      "Sangrado del acceso que recomienza después de salir de la clínica",
    ],
    actionNoteEn:
      "Dialysis-access bleeding that is heavy, spurting, or will not stop requires immediate emergency help → Call 911.",
    actionNoteEs:
      "El sangrado del acceso que es profuso, en chorro o no para requiere auxilio médico de emergencia → Llame al 911.",
    importantInEn: [
      "Patients who recently received systemic heparin during hemodialysis",
      "Patients with AV fistula pseudoaneurysms or fragile skin over access",
      "Patients taking aspirin, Plavix, Coumadin, or other anticoagulants",
    ],
    importantInEs: [
      "Pacientes con heparina reciente recibida durante la hemodiálisis",
      "Pacientes con pseudoaneurismas en fístula o piel delgada sobre el acceso",
      "Pacientes que toman aspirina, clopidogrel, warfarina u otros anticoagulantes",
    ],
  },

  "severe-hyperkalemia-symptoms": {
    slug: "severe-hyperkalemia-symptoms",
    key: "severeHyperkalemia",
    titleEn: "High Potassium Warning Signs",
    titleEs: "Signos de Alarma de Potasio Alto",
    urgent: true,
    nextStepLevel: "urgentMedical",
    whatToWatchForFullEn:
      "New muscle weakness; numbness/tingling; nausea/vomiting; pounding, racing or irregular heartbeat; chest pain; shortness of breath. Important: high potassium may cause few or no symptoms, so a known critically high potassium result should not be judged by symptoms alone. Sudden/severe hyperkalemia requires immediate care. ([National Kidney Foundation](https://www.kidney.org/kidney-topics/hyperkalemia-high-potassium?page=1&utm_source=chatgpt.com))",
    whatToWatchForFullEs:
      "Debilidad muscular nueva; entumecimiento o hormigueo; náuseas o vómitos; latidos cardíacos fuertes, acelerados o irregulares; dolor de pecho; dificultad para respirar. Importante: el potasio alto puede causar pocos o ningún síntoma, por lo que un resultado conocido de potasio críticamente alto no debe juzgarse solo por los síntomas. La hiperpotasemia repentina o grave requiere atención inmediata.",
    symptomsListEn: [
      "New, unexplained muscle weakness (especially in legs and arms)",
      "Numbness, tingling, or crawling sensations in hands, feet, or lips",
      "Nausea, vomiting, or abdominal cramping",
      "Pounding, skipping, racing, or noticeably irregular heartbeat (palpitations)",
      "Chest discomfort or shortness of breath",
      "Critically elevated potassium lab value (>6.0 mEq/L) reported by clinic or lab",
    ],
    symptomsListEs: [
      "Debilidad muscular nueva e inexplicable (sobre todo en piernas y brazos)",
      "Entumecimiento, hormigueo o adormecimiento en manos, pies o labios",
      "Náuseas, vómitos o cólicos abdominales",
      "Latidos fuertes, acelerados, irregulares o pausas cardíacas (palpitaciones)",
      "Malestar torácico o falta de aire",
      "Valor crítico de potasio en análisis (>6.0 mEq/L) informado por el laboratorio",
    ],
    actionNoteEn:
      "Important: high potassium may cause few or no symptoms, so a known critically high potassium result should not be judged by symptoms alone. Sudden/severe hyperkalemia requires immediate emergency care → Call 911.",
    actionNoteEs:
      "Importante: el potasio alto puede causar pocos o ningún síntoma; un nivel crítico no debe evaluarse solo por síntomas. La hiperpotasemia severa requiere atención inmediata → Llame al 911.",
    importantInEn: [
      "Dialysis patients who missed one or more scheduled dialysis treatments",
      "Patients consuming high-potassium foods (potatoes, melons, bananas, salt substitutes)",
      "Patients experiencing tissue breakdown, gastrointestinal bleeding, or acidosis",
    ],
    importantInEs: [
      "Pacientes en diálisis que omitieron una o más sesiones programadas",
      "Pacientes con ingesta de alimentos ricos en potasio o sustitutos de sal",
      "Pacientes con hemorragia digestiva, acidosis o traumatismos",
    ],
  },

  "fever-with-dialysis-catheter": {
    slug: "fever-with-dialysis-catheter",
    key: "feverDialysisCatheter",
    titleEn: "Fever With Dialysis Catheter",
    titleEs: "Fiebre con Catéter de Diálisis",
    urgent: true,
    nextStepLevel: "callDialysis",
    whatToWatchForFullEn:
      "Fever/chills; shaking chills; redness/warmth/swelling around catheter; pain/tenderness; drainage; feeling suddenly ill or weak, particularly during or after dialysis. Catheter infection can become serious quickly, so this should direct the patient to contact the dialysis team immediately and receive urgent assessment based on symptoms. ([National Kidney Foundation](https://www.kidney.org/kidney-topics/hemodialysis-access?page=2&utm_source=chatgpt.com))",
    whatToWatchForFullEs:
      "Fiebre o escalofríos; escalofríos con temblores intensos; enrojecimiento, calor o hinchazón alrededor del catéter; dolor o sensibilidad; secreción; sentirse repentinamente enfermo o débil, especialmente durante o después de la diálisis. La infección del catéter puede volverse grave rápidamente, por lo que debe comunicarse con el equipo de diálisis de inmediato y recibir una evaluación urgente según los síntomas.",
    symptomsListEn: [
      "Fever (body temperature > 100.4°F / 38°C) or feeling hot/sweaty",
      "Shaking chills or teeth-chattering rigors (especially during/after dialysis)",
      "Redness, warmth, or swelling around the catheter skin exit site or tunnel",
      "Pain or tenderness when touching the catheter area",
      "Pus, yellow/green drainage, or foul odor from catheter exit site",
      "Feeling suddenly sick, lightheaded, very weak, or nauseated after treatment",
    ],
    symptomsListEs: [
      "Fiebre (> 38°C / 100.4°F) o sensación de calor y sudores",
      "Escalofríos con temblores fuertes (especialmente durante o después de diálisis)",
      "Enrojecimiento, calor o hinchazón alrededor del orificio del catéter",
      "Dolor o sensibilidad al tacto en la zona del catéter",
      "Pus, secreción turbia o mal olor en el sitio de salida del catéter",
      "Malestar súbito, mareos, debilidad extrema o náuseas tras el tratamiento",
    ],
    actionNoteEn:
      "Catheter infection can become serious bloodstream infection (sepsis) quickly. Contact your dialysis clinic immediately or seek urgent emergency assessment based on symptoms.",
    actionNoteEs:
      "La infección del catéter puede derivar en bacteriemia o sepsis rápidamente. Llame a su clínica de diálisis de inmediato o busque atención de urgencias.",
    importantInEn: [
      "Patients with central venous hemodialysis catheters (chest or neck catheter)",
      "Patients with recent catheter exchange, dressing change, or catheter manipulations",
      "Immunocompromised patients with history of bacteremia or tunnel infections",
    ],
    importantInEs: [
      "Pacientes con catéter venoso central para hemodiálisis (yugular o subclavio)",
      "Pacientes con cambio reciente de catéter, curaciones o manipulaciones",
      "Pacientes inmunodeprimidos con antecedentes de bacteriemia",
    ],
  },

  "confusion-or-mental-status-changes": {
    slug: "confusion-or-mental-status-changes",
    key: "confusionMentalStatus",
    titleEn: "Confusion or Mental Status Changes",
    titleEs: "Confusión o Cambios en el Estado Mental",
    urgent: true,
    nextStepLevel: "urgentMedical",
    whatToWatchForFullEn:
      "New confusion; unusual sleepiness; difficult to awaken; not knowing person/place/time; new trouble speaking; unusual behavior; severe weakness; confusion after missed dialysis; confusion associated with fever, breathing difficulty, chest pain or neurologic changes. Sudden confusion—especially with stroke signs → 911. ([American Heart Association](https://newsroom.heart.org/facts/stroke?utm_source=chatgpt.com))",
    whatToWatchForFullEs:
      "Confusión nueva; somnolencia inusual; dificultad para despertar; no reconocer personas, lugares o tiempo; nuevos problemas para hablar; comportamiento inusual; debilidad severa; confusión después de una diálisis omitida; confusión asociada con fiebre, dificultad respiratoria, dolor en el pecho o cambios neurológicos. Confusión repentina, especialmente con signos de ACV → 911.",
    symptomsListEn: [
      "New onset of confusion, disorientation, or memory loss",
      "Unusual sleepiness, lethargy, or extreme difficulty awakening",
      "Not knowing who they are, where they are, or what day/time it is",
      "New trouble finding words, speaking coherently, or understanding others",
      "Unusual agitation, hallucinations, or drastic personality changes",
      "Severe generalized weakness or unsteadiness",
      "Confusion following missed dialysis sessions (uremic toxin accumulation)",
      "Confusion accompanied by fever, breathlessness, chest pain, or stroke signs",
    ],
    symptomsListEs: [
      "Confusión, desorientación o pérdida de memoria de inicio reciente",
      "Somnolencia inusual, letargo o gran dificultad para despertar",
      "Desorientación sobre persona, lugar o fecha/hora",
      "Dificultad repentina para hablar, articular palabras o comprender",
      "Agitación inusual, alucinaciones o cambios drásticos de conducta",
      "Debilidad generalizada severa o inestabilidad al pararse",
      "Confusión tras sesiones de diálisis omitidas (acumulación de toxinas urémicas)",
      "Confusión acompañada de fiebre, dificultad respiratoria, dolor torácico o signos de ACV",
    ],
    actionNoteEn:
      "Sudden confusion—especially accompanied by stroke signs, high fever, or severe breathing difficulty → Call 911 immediately.",
    actionNoteEs:
      "Confusión repentina—especialmente si se acompaña de signos de ACV, fiebre alta o dificultad para respirar → Llame al 911 de inmediato.",
    importantInEn: [
      "Dialysis patients with missed treatments developing uremic encephalopathy",
      "Elderly kidney disease patients sensitive to medication buildup",
      "Patients with severe infection (sepsis), stroke, or critical electrolyte shifts",
    ],
    importantInEs: [
      "Pacientes en diálisis con sesiones omitidas que desarrollan encefalopatía urémica",
      "Pacientes de edad avanzada susceptibles a acumulación de fármacos",
      "Pacientes con infección grave (sepsis), accidente cerebrovascular o cambios electrolíticos",
    ],
  },
};

export const SLUG_LIST = Object.keys(BEFORE_THE_ER_TOPICS);

export function getBeforeTheErTopic(
  slugOrKey: string,
): BeforeTheErTopicInfo | undefined {
  if (!slugOrKey) return undefined;
  const normalized = slugOrKey.toLowerCase().replace(/%20/g, "-");

  if (BEFORE_THE_ER_TOPICS[normalized]) {
    return BEFORE_THE_ER_TOPICS[normalized];
  }

  const found = Object.values(BEFORE_THE_ER_TOPICS).find(
    (item) => item.key.toLowerCase() === slugOrKey.toLowerCase(),
  );
  return found;
}
