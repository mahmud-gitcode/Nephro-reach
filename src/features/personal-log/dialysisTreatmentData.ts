type Severity = "Yes" | "No" | "Mild" | "Moderate" | "Severe";

export interface DialysisLogEntry {
  id: string;
  date: string;
  /* Added 2026-10-12, when the log started being stored and tied to the
     schedule. Optional, so the sample entries still read. */
  modality?: "in-center-hd" | "home-hd";
  /** Attended, missed, or a make-up session for a missed one. */
  status?: "attended" | "missed" | "rescheduled";
  /** For a make-up session: the missed day it replaces (yyyy-mm-dd). */
  makeupFor?: string;
  preBloodPressure?: string;
  preHeartRate?: string;
  /** Extra time in the chair after the run, for recovery. */
  extraRecovery?: "Yes" | "No";
  extraRecoveryMinutes?: number;
  dizziness?: Severity;
  swelling?: Severity;
  shortnessOfBreath?: Severity;
  displayDate: string;
  isDialysisDay: boolean;
  treatmentType: string;
  startTime: string;
  endTime: string;
  duration: string;
  location: string;
  careTeam: string;
  postWeightSummary: string;
  // Attendance & Schedule
  attendance: "Attended" | "Arrived Late" | "Ended Early" | "Missed";
  attended: "Yes" | "No";
  arrivedLate: "Yes" | "No";
  endedEarly: "Yes" | "No";
  missedTreatments: number;
  rescheduled: "Yes" | "No";
  // Pre-Treatment Condition
  preOverallFeel: number;
  preSymptoms: string[];
  preSeverity: Record<string, number>;
  // Intra-Treatment Symptoms
  hadIntraSymptoms: boolean;
  sequentialFluidRemoval?: "Yes" | "No";
  cramping: "Yes" | "No" | "Mild" | "Moderate" | "Severe";
  lowBp: "Yes" | "No" | "Mild" | "Moderate" | "Severe";
  highBp?: "Yes" | "No" | "Mild" | "Moderate" | "Severe";
  fatigue: "Yes" | "No" | "Mild" | "Moderate" | "Severe";
  intraSymptoms: string[];
  intraSeverity: Record<string, number>;
  intraNotes: string;
  // Post-Treatment & Clinical Vitals
  postOverallFeel: number;
  recoveryTime: "Yes" | "No" | "Mild" | "Moderate" | "Severe";
  medsTakenPrescribed: "Yes" | "No";
  fluidRemoved: string;
  preWeight: string;
  postWeight: string;
  weightDiff: string;
  bloodPressurePost: string;
  heartRatePost: string;
  /** Always empty from the API: medications given are their own rows
   *  (`/dialysis/treatment-medications`, linked by treatment id). */
  medicationsGiven: string[];
  otherNotes: string;
  /** Post-treatment symptoms and their severity (saved since Phase 7). */
  postSymptoms?: string[];
  postSeverity?: Record<string, number>;
  /** Whether the server holds a photo for this treatment. */
  hasPhoto?: boolean;
}
