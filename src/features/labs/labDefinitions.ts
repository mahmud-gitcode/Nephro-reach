/* ==========================================================================
   What each lab measures — the ⓘ beside a lab name
   --------------------------------------------------------------------------
   The client (2026-10-05): "BUN ⓘ — click and the BUN definition
   appears." General education only, in the same spirit as Before the ER:
   what the test measures and why a dialysis care team follows it, never
   what a particular result means for the member.
   ========================================================================== */

export type LabDefinition = { en: string; es: string };

export const LAB_DEFINITIONS: Record<string, LabDefinition> = {
  bun: {
    en: "BUN (blood urea nitrogen) measures urea, a waste product made when the body breaks down protein. Kidneys normally remove it; dialysis helps remove it when they cannot.",
    es: "El BUN (nitrógeno ureico en sangre) mide la urea, un desecho que se produce cuando el cuerpo descompone las proteínas. Los riñones normalmente la eliminan; la diálisis ayuda cuando no pueden.",
  },
  creatinine: {
    en: "Creatinine is a waste product from normal muscle activity. It is removed by the kidneys or by dialysis, and your care team follows it over time.",
    es: "La creatinina es un desecho de la actividad muscular normal. La eliminan los riñones o la diálisis, y su equipo la sigue con el tiempo.",
  },
  egfr: {
    en: "eGFR (estimated glomerular filtration rate) is an estimate of how well the kidneys filter the blood, calculated from creatinine, age and other factors.",
    es: "La TFGe (tasa de filtración glomerular estimada) es un cálculo de qué tan bien filtran la sangre los riñones, a partir de la creatinina, la edad y otros factores.",
  },
  potassium: {
    en: "Potassium is a mineral that helps nerves and muscles, including the heart, work. Kidneys and dialysis help keep it in balance, and diet affects it too.",
    es: "El potasio es un mineral que ayuda a que los nervios y músculos, incluido el corazón, funcionen. Los riñones y la diálisis ayudan a mantenerlo en equilibrio, y la dieta también influye.",
  },
  sodium: {
    en: "Sodium is a mineral that helps control the balance of fluid in the body.",
    es: "El sodio es un mineral que ayuda a controlar el equilibrio de líquidos en el cuerpo.",
  },
  chloride: {
    en: "Chloride is a mineral that works with sodium and bicarbonate to keep the body's fluids and acid–base balance steady.",
    es: "El cloruro es un mineral que trabaja con el sodio y el bicarbonato para mantener estables los líquidos del cuerpo y su equilibrio ácido-base.",
  },
  bicarbonate: {
    en: "Bicarbonate (CO2) reflects the acid–base balance of the blood. Kidneys and dialysis help keep it steady.",
    es: "El bicarbonato (CO2) refleja el equilibrio ácido-base de la sangre. Los riñones y la diálisis ayudan a mantenerlo estable.",
  },
  co2: {
    en: "CO2 (bicarbonate) reflects the acid–base balance of the blood. Kidneys and dialysis help keep it steady.",
    es: "El CO2 (bicarbonato) refleja el equilibrio ácido-base de la sangre. Los riñones y la diálisis ayudan a mantenerlo estable.",
  },
  calcium: {
    en: "Calcium is a mineral used for bones, muscles and nerves. It is followed together with phosphorus, PTH and vitamin D.",
    es: "El calcio es un mineral para los huesos, los músculos y los nervios. Se sigue junto con el fósforo, la PTH y la vitamina D.",
  },
  phosphorus: {
    en: "Phosphorus is a mineral found in many foods. Kidneys normally remove the extra; diet, binders and dialysis help manage it.",
    es: "El fósforo es un mineral presente en muchos alimentos. Los riñones normalmente eliminan el exceso; la dieta, los quelantes y la diálisis ayudan a manejarlo.",
  },
  pth: {
    en: "PTH (parathyroid hormone) helps control calcium and phosphorus in the body and affects bone health.",
    es: "La PTH (hormona paratiroidea) ayuda a controlar el calcio y el fósforo del cuerpo y afecta la salud de los huesos.",
  },
  vitamind: {
    en: "Vitamin D 25-OH measures the body's vitamin D stores. Vitamin D helps the body use calcium.",
    es: "La vitamina D 25-OH mide las reservas de vitamina D del cuerpo. La vitamina D ayuda al cuerpo a usar el calcio.",
  },
  albumin: {
    en: "Albumin is a protein in the blood. Your care team follows it as one sign of nutrition.",
    es: "La albúmina es una proteína de la sangre. Su equipo la sigue como una señal de la nutrición.",
  },
  hemoglobin: {
    en: "Hemoglobin is the protein in red blood cells that carries oxygen around the body.",
    es: "La hemoglobina es la proteína de los glóbulos rojos que transporta el oxígeno por el cuerpo.",
  },
  hematocrit: {
    en: "Hematocrit is the share of the blood made up of red blood cells.",
    es: "El hematocrito es la proporción de la sangre formada por glóbulos rojos.",
  },
  ferritin: {
    en: "Ferritin reflects how much iron the body has stored.",
    es: "La ferritina refleja cuánto hierro tiene almacenado el cuerpo.",
  },
  tsat: {
    en: "Iron saturation (TSAT) shows how much iron is available in the blood to make red blood cells.",
    es: "La saturación de hierro (TSAT) muestra cuánto hierro hay disponible en la sangre para producir glóbulos rojos.",
  },
  ktv: {
    en: "Kt/V is a measure of how much waste a dialysis treatment removes, used to check that treatments are doing their job.",
    es: "El Kt/V mide cuántos desechos elimina un tratamiento de diálisis y se usa para comprobar que los tratamientos cumplen su función.",
  },
};

export function labDefinition(id: string): LabDefinition | undefined {
  return LAB_DEFINITIONS[id];
}
