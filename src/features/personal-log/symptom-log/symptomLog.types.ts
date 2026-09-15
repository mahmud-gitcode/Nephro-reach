/* ==========================================================================
   The dialysis-day symptom log — the shape of one day
   --------------------------------------------------------------------------
   Fifty fields, because that is what the paper form has: vitals before and
   after the run, the symptoms during it, and how the member felt for the
   rest of the day.
   ========================================================================== */

export interface DialysisDayLogData {
  date: string;
  isDialysisDay: boolean;
  treatmentType: string;
  startTime: string;
  endTime: string;
  location: string;
  careTeam: string;
  postWeightSummary: string;
  // Attendance & Compliance
  attended: "Yes" | "No";
  arrivedLate: "Yes" | "No";
  endedEarly: "Yes" | "No";
  missedTreatments: number;
  rescheduled: "Yes" | "No";
  // Specific 5-level Symptoms
  cramping: "Yes" | "No" | "Mild" | "Moderate" | "Severe";
  lowBp: "Yes" | "No" | "Mild" | "Moderate" | "Severe";
  highBp?: "Yes" | "No" | "Mild" | "Moderate" | "Severe";
  fatigue: "Yes" | "No" | "Mild" | "Moderate" | "Severe";
  recoveryTime: "Yes" | "No" | "Mild" | "Moderate" | "Severe";
  sequentialFluidRemoval?: "Yes" | "No";
  // Medication Adherence
  medsTakenPrescribed: "Yes" | "No";
  // Pre-treatment
  preOverallFeel: number;
  preSymptoms: string[];
  preOtherSymptom: string;
  preSeverity: Record<string, number>;
  // Intra-treatment
  hadIntraSymptoms: boolean;
  intraSymptoms: string[];
  intraOtherSymptom: string;
  intraSeverity: Record<string, number>;
  intraNotes: string;
  // Post-treatment
  postOverallFeel: number;
  postSymptoms: string[];
  postOtherSymptom: string;
  postSeverity: Record<string, number>;
  // Clinical vitals
  fluidRemoved: string;
  preWeight: string;
  postWeight: string;
  bloodPressurePost: string;
  heartRatePost: string;
  medicationsGiven: string[];
  medicationsOther: string;
  otherNotes: string;
}
