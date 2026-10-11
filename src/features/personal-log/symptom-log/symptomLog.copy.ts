/* Spanish for the Dialysis Day Log's fixed labels.

   The English words are also the saved values ("Fatigue", "Mild", "Yes"),
   which the treatment page and the clinic read back, so only what is shown
   is translated. A label without an entry here shows in English. The terms
   follow the Spanish already used elsewhere in the app (es.json). */
const ES: Record<string, string> = {
  // Answers
  Yes: "Sí",
  No: "No",
  Mild: "Leve",
  Moderate: "Moderada",
  Severe: "Grave",
  // How the member felt
  Great: "Excelente",
  Good: "Bien",
  Okay: "Regular",
  Low: "Bajo",
  Poor: "Mal",
  // Symptoms and severity rows
  Fatigue: "Fatiga",
  Swelling: "Hinchazón",
  "Shortness of Breath": "Falta de aire",
  Nausea: "Náuseas",
  Itching: "Picazón",
  Headache: "Dolor de cabeza",
  Dizziness: "Mareo",
  "Muscle Cramps": "Calambres musculares",
  Cramps: "Calambres",
  Cramping: "Calambres",
  "Chest Pain": "Dolor de pecho",
  "Chest Discomfort": "Molestia en el pecho",
  Anxiety: "Ansiedad",
  "Poor Appetite": "Poco apetito",
  "Low BP": "Presión baja",
  "High BP": "Presión alta",
  Vomiting: "Vómitos",
  "Better / No Symptoms": "Mejor / Sin síntomas",
  Pain: "Dolor",
  Overall: "General",
};

/** The label to show: Spanish when there is one, the saved English otherwise. */
export function symptomLabel(label: string, isEs: boolean): string {
  return isEs ? (ES[label] ?? label) : label;
}
