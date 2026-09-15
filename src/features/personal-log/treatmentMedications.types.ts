/** One medication administered during a dialysis run. */
export interface TreatmentMedication {
  id: string;
  /** As displayed, e.g. "May 31, 2024". The backend will make this a date. */
  date: string;
  medication: string;
  /** Amount and unit together, e.g. "100 mg". */
  dose: string;
  reason: string;
  given: boolean;
}
