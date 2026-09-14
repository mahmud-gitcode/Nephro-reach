export interface DialysisLogEntry {
  id: string;
  date: string;
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
  medicationsGiven: string[];
  otherNotes: string;
}

export const mockDialysisEntries: DialysisLogEntry[] = [
  {
    id: "entry-01",
    date: "2026-06-24",
    displayDate: "Wednesday, Jun 24, 2026",
    isDialysisDay: true,
    treatmentType: "Hemodialysis",
    startTime: "7:30 AM",
    endTime: "11:30 AM",
    duration: "4h 00m",
    location: "ABC Dialysis Center",
    careTeam: "Jane Smith, RN",
    postWeightSummary: "72.2 kg",
    // Attendance
    attendance: "Attended",
    attended: "Yes",
    arrivedLate: "No",
    endedEarly: "No",
    missedTreatments: 0,
    rescheduled: "No",
    // Pre-Treatment
    preOverallFeel: 4,
    preSymptoms: ["Better / No Symptoms"],
    preSeverity: {},
    // Intra-Treatment
    hadIntraSymptoms: false,
    cramping: "No",
    lowBp: "No",
    fatigue: "Mild",
    intraSymptoms: ["None / Comfortable"],
    intraSeverity: {},
    intraNotes:
      "Session ran smoothly. Machine arterial and venous pressures within normal target ranges. Ultrafiltration rate tolerated without difficulty.",
    // Post-Treatment & Vitals
    postOverallFeel: 4,
    recoveryTime: "Mild",
    medsTakenPrescribed: "Yes",
    fluidRemoved: "2.6 L",
    preWeight: "74.8 kg",
    postWeight: "72.2 kg",
    weightDiff: "-2.6 kg",
    bloodPressurePost: "126/82 mmHg",
    heartRatePost: "72 bpm",
    medicationsGiven: ["EPO / Mircera", "Heparin"],
    otherNotes:
      "Target dry weight reached. AV fistula access site clean, no bleeding after holding pressure for 10 minutes. Good bruit and thrill verified.",
  },
  {
    id: "entry-02",
    date: "2026-06-22",
    displayDate: "Monday, Jun 22, 2026",
    isDialysisDay: true,
    treatmentType: "Hemodialysis",
    startTime: "8:00 AM",
    endTime: "11:30 AM",
    duration: "3h 30m",
    location: "ABC Dialysis Center",
    careTeam: "Jane Smith, RN",
    postWeightSummary: "72.4 kg",
    // Attendance
    attendance: "Arrived Late",
    attended: "Yes",
    arrivedLate: "Yes",
    endedEarly: "No",
    missedTreatments: 0,
    rescheduled: "No",
    // Pre-Treatment
    preOverallFeel: 3,
    preSymptoms: ["Fatigue", "Mild Swelling"],
    preSeverity: { Fatigue: 3, "Mild Swelling": 2 },
    // Intra-Treatment
    hadIntraSymptoms: true,
    cramping: "Mild",
    lowBp: "No",
    fatigue: "Moderate",
    intraSymptoms: ["Leg Cramps"],
    intraSeverity: { "Leg Cramps": 4 },
    intraNotes:
      "Arrived 30 mins late due to medical transportation delay. Patient experienced calf cramps at 10:45 AM. Assisted with calf stretching and heat pack.",
    // Post-Treatment & Vitals
    postOverallFeel: 3,
    recoveryTime: "Moderate",
    medsTakenPrescribed: "Yes",
    fluidRemoved: "2.1 L",
    preWeight: "74.5 kg",
    postWeight: "72.4 kg",
    weightDiff: "-2.1 kg",
    bloodPressurePost: "118/76 mmHg",
    heartRatePost: "76 bpm",
    medicationsGiven: ["Heparin"],
    otherNotes:
      "Cramps subsided after treatment. Advised to rest leg muscles and stay within interdialytic fluid limit over next 48 hours.",
  },
  {
    id: "entry-03",
    date: "2026-06-19",
    displayDate: "Friday, Jun 19, 2026",
    isDialysisDay: true,
    treatmentType: "Hemodialysis",
    startTime: "7:30 AM",
    endTime: "10:45 AM",
    duration: "3h 15m",
    location: "ABC Dialysis Center",
    careTeam: "Robert Chen, RN",
    postWeightSummary: "72.7 kg",
    // Attendance
    attendance: "Ended Early",
    attended: "Yes",
    arrivedLate: "No",
    endedEarly: "Yes",
    missedTreatments: 0,
    rescheduled: "No",
    // Pre-Treatment
    preOverallFeel: 2,
    preSymptoms: ["Dizziness", "Headache"],
    preSeverity: { Dizziness: 4, Headache: 3 },
    // Intra-Treatment
    hadIntraSymptoms: true,
    cramping: "No",
    lowBp: "Moderate",
    fatigue: "Severe",
    intraSymptoms: ["Dizziness", "Lightheadedness"],
    intraSeverity: { "Blood Pressure Drop": 6, Dizziness: 5 },
    intraNotes:
      "At 10:30 AM, patient felt sudden dizziness. Supine BP dropped to 96/60 mmHg. Administered 150mL normal saline bolus, lowered UF rate to zero. Session safely stopped 45 min early with nephrologist approval.",
    // Post-Treatment & Vitals
    postOverallFeel: 2,
    recoveryTime: "Severe",
    medsTakenPrescribed: "Yes",
    fluidRemoved: "2.4 L",
    preWeight: "75.1 kg",
    postWeight: "72.7 kg",
    weightDiff: "-2.4 kg",
    bloodPressurePost: "106/68 mmHg",
    heartRatePost: "80 bpm",
    medicationsGiven: ["Iron", "Heparin"],
    otherNotes:
      "Standing BP recovered to 106/68 mmHg before discharge. Patient instructed to take it easy, avoid hot showers, and monitor dizziness at home.",
  },
  {
    id: "entry-04",
    date: "2026-06-17",
    displayDate: "Wednesday, Jun 17, 2026",
    isDialysisDay: true,
    treatmentType: "Hemodialysis",
    startTime: "7:30 AM",
    endTime: "11:30 AM",
    duration: "4h 00m",
    location: "ABC Dialysis Center",
    careTeam: "Jane Smith, RN",
    postWeightSummary: "72.6 kg",
    // Attendance
    attendance: "Attended",
    attended: "Yes",
    arrivedLate: "No",
    endedEarly: "No",
    missedTreatments: 0,
    rescheduled: "No",
    // Pre-Treatment
    preOverallFeel: 5,
    preSymptoms: ["Better / No Symptoms"],
    preSeverity: {},
    // Intra-Treatment
    hadIntraSymptoms: false,
    cramping: "No",
    lowBp: "No",
    fatigue: "No",
    intraSymptoms: ["None / Comfortable"],
    intraSeverity: {},
    intraNotes:
      "High ultrafiltration goal achieved without hypotensive episodes or machine alarm interruptions.",
    // Post-Treatment & Vitals
    postOverallFeel: 5,
    recoveryTime: "Mild",
    medsTakenPrescribed: "Yes",
    fluidRemoved: "2.8 L",
    preWeight: "75.4 kg",
    postWeight: "72.6 kg",
    weightDiff: "-2.8 kg",
    bloodPressurePost: "130/84 mmHg",
    heartRatePost: "70 bpm",
    medicationsGiven: ["EPO / Mircera", "Zemplar / Hectorol", "Heparin"],
    otherNotes:
      "Excellent session. Patient expressed feeling very refreshed and alert. Cannulation was smooth on first attempt.",
  },
  {
    id: "entry-05",
    date: "2026-06-15",
    displayDate: "Monday, Jun 15, 2026",
    isDialysisDay: true,
    treatmentType: "Hemodialysis",
    startTime: "7:30 AM",
    endTime: "11:30 AM",
    duration: "4h 00m",
    location: "ABC Dialysis Center",
    careTeam: "Robert Chen, RN",
    postWeightSummary: "72.4 kg",
    // Attendance
    attendance: "Attended",
    attended: "Yes",
    arrivedLate: "No",
    endedEarly: "No",
    missedTreatments: 0,
    rescheduled: "No",
    // Pre-Treatment
    preOverallFeel: 4,
    preSymptoms: ["Mild Shortness of Breath"],
    preSeverity: { "Shortness of Breath": 2 },
    // Intra-Treatment
    hadIntraSymptoms: true,
    cramping: "Mild",
    lowBp: "No",
    fatigue: "Mild",
    intraSymptoms: ["Mild Foot Cramps"],
    intraSeverity: { "Foot Cramps": 3 },
    intraNotes:
      "Mild foot cramping at 10:15 AM, responded well to massage and reducing UF rate by 100 mL/hr for 15 minutes.",
    // Post-Treatment & Vitals
    postOverallFeel: 4,
    recoveryTime: "Mild",
    medsTakenPrescribed: "Yes",
    fluidRemoved: "2.5 L",
    preWeight: "74.9 kg",
    postWeight: "72.4 kg",
    weightDiff: "-2.5 kg",
    bloodPressurePost: "128/80 mmHg",
    heartRatePost: "74 bpm",
    medicationsGiven: ["Heparin"],
    otherNotes:
      "Breathing was completely normal post-treatment. Clean access site, pressure dressing applied.",
  },
];
