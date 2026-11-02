import type { LibraryCategory } from "./library.types";

/* The topic filter row and the composer's topic list. The same keys as the
   server's LIBRARY_CATEGORIES (BE content.constants.ts). */
export const LIBRARY_CATEGORIES: {
  key: LibraryCategory;
  labelEn: string;
  labelEs: string;
}[] = [
  { key: "general", labelEn: "General", labelEs: "General" },
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
