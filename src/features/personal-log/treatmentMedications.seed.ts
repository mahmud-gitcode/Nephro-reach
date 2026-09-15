import type { TreatmentMedication } from "./treatmentMedications.types";

/* Demo rows, so the table is not blank on a first visit. Deletable in one
   commit when real accounts arrive. */
export const SEED_TREATMENT_MEDICATIONS: TreatmentMedication[] = [
  {
    id: "1",
    date: "May 31, 2024",
    medication: "Epoetin Alfa (Epogen)",
    dose: "8,000 units",
    reason: "Anemia",
    given: true,
  },
  {
    id: "2",
    date: "May 31, 2024",
    medication: "Iron Sucrose (Venofer)",
    dose: "100 mg",
    reason: "Iron Deficiency",
    given: true,
  },
  {
    id: "3",
    date: "May 31, 2024",
    medication: "Doxercalciferol (Hectorol)",
    dose: "2 mcg",
    reason: "Secondary Hyperparathyroidism",
    given: true,
  },
  {
    id: "4",
    date: "May 29, 2024",
    medication: "Epoetin Alfa (Epogen)",
    dose: "8,000 units",
    reason: "Anemia",
    given: true,
  },
  {
    id: "5",
    date: "May 29, 2024",
    medication: "Iron Sucrose (Venofer)",
    dose: "100 mg",
    reason: "Iron Deficiency",
    given: true,
  },
];
