import type { TreatmentIntervalMeta } from "./record.types";

/* Demo records and the dates each treatment accepts. Deletable in one
   commit when real records arrive. */

export const INTERVAL_VIEW_DATA: Record<string, TreatmentIntervalMeta> = {
  "tx-1": {
    id: "tx-1",
    name: "Treatment 1",
    label: "Treatment 1 ➔ Treatment 2",
    startDate: "Friday, Jun 19, 2026",
    endDate: "Monday, Jun 22, 2026",
    isExtra: false,
    orders: [
      {
        id: "ord-1",
        date: "Jun 19, 2026",
        order: "Take phosphate binder with all solid meals",
        completed: true,
      },
      {
        id: "ord-2",
        date: "Jun 19, 2026",
        order:
          "Keep vascular access dressing clean and dry for 6 hours post-treatment",
        completed: true,
      },
      {
        id: "ord-3",
        date: "Jun 20, 2026",
        order: "Record morning dry weight before breakfast and log in portal",
        completed: true,
      },
      {
        id: "ord-4",
        date: "Jun 21, 2026",
        order: "Check standing BP before taking evening beta-blocker",
        completed: true,
      },
      {
        id: "ord-5",
        date: "Jun 21, 2026",
        order: "Maintain daily sodium restriction under 2,000 mg",
        completed: false,
      },
      {
        id: "ord-6",
        date: "Jun 22, 2026",
        order: "Report any access thrill or bruit changes immediately",
        completed: false,
      },
    ],
    symptomEntries: [
      {
        id: "sym-1",
        date: "Friday, Jun 19, 2026",
        dayLabel: "Day 1 (Post-Tx)",
        symptoms: ["Fatigue", "Mild dizziness"],
        severity: "Mild",
        recoveryTime: "2 – 4 hours",
        notes:
          "Rested for 3 hours after clinic. Felt back to baseline by evening.",
      },
      {
        id: "sym-2",
        date: "Saturday, Jun 20, 2026",
        dayLabel: "Day 2 (Interdialytic)",
        symptoms: ["Mild ankle swelling", "Itching"],
        severity: "Mild",
        recoveryTime: "< 2 hours",
        notes:
          "Elevated legs while watching TV. Applied prescribed moisturizing cream.",
      },
      {
        id: "sym-3",
        date: "Sunday, Jun 21, 2026",
        dayLabel: "Day 3 (Interdialytic)",
        symptoms: ["Restless legs", "Difficulty sleeping flat"],
        severity: "Moderate",
        recoveryTime: "4 – 6 hours",
        notes: "Used an extra pillow. Mentioned to care team log.",
      },
    ],
  },
  "tx-2": {
    id: "tx-2",
    name: "Treatment 2",
    label: "Treatment 2 ➔ Treatment 3",
    startDate: "Monday, Jun 22, 2026",
    endDate: "Wednesday, Jun 24, 2026",
    isExtra: false,
    orders: [
      {
        id: "ord-201",
        date: "Jun 22, 2026",
        order: "Schedule access ultrasound review with vascular surgeon",
        completed: false,
      },
      {
        id: "ord-202",
        date: "Jun 22, 2026",
        order: "Verify fistula thrill/bruit morning and evening",
        completed: true,
      },
      {
        id: "ord-203",
        date: "Jun 23, 2026",
        order: "Limit interdialytic fluid intake to 32 oz (1,000 mL) per day",
        completed: true,
      },
      {
        id: "ord-204",
        date: "Jun 23, 2026",
        order:
          "Hold morning antihypertensive if pre-dialysis systolic BP < 110 mmHg",
        completed: true,
      },
      {
        id: "ord-205",
        date: "Jun 24, 2026",
        order: "Review monthly lab Kt/V clearance results with dialysis nurse",
        completed: false,
      },
      {
        id: "ord-206",
        date: "Jun 24, 2026",
        order:
          "Apply cool compress to cannulation sites if mild tenderness occurs",
        completed: false,
      },
    ],
    symptomEntries: [
      {
        id: "sym-201",
        date: "Monday, Jun 22, 2026",
        dayLabel: "Day 1 (Post-Tx)",
        symptoms: ["Fatigue", "Muscle cramping"],
        severity: "Moderate",
        recoveryTime: "4 – 6 hours",
        notes: "Calf cramps resolved after warm compress.",
      },
      {
        id: "sym-202",
        date: "Tuesday, Jun 23, 2026",
        dayLabel: "Day 2 (Interdialytic)",
        symptoms: ["Mild swelling"],
        severity: "Mild",
        recoveryTime: "< 2 hours",
        notes: "Morning weight within target dry weight range (+1.4 kg).",
      },
    ],
  },
  "tx-3": {
    id: "tx-3",
    name: "Treatment 3",
    label: "Treatment 3 ➔ Treatment 4",
    startDate: "Wednesday, Jun 24, 2026",
    endDate: "Saturday, Jun 27, 2026",
    isExtra: false,
    orders: [
      {
        id: "ord-301",
        date: "Jun 24, 2026",
        order:
          "Increase dietary protein intake with high biological value snacks",
        completed: false,
      },
      {
        id: "ord-302",
        date: "Jun 24, 2026",
        order: "Take active Vitamin D analog (Hectorol) with dinner meal",
        completed: true,
      },
      {
        id: "ord-303",
        date: "Jun 25, 2026",
        order:
          "Elevate lower extremities for 30 minutes twice daily to reduce edema",
        completed: true,
      },
      {
        id: "ord-304",
        date: "Jun 26, 2026",
        order:
          "Avoid lifting heavy objects (> 10 lbs) with vascular access arm",
        completed: true,
      },
      {
        id: "ord-305",
        date: "Jun 27, 2026",
        order: "Check and log access arterial flow rate during treatment setup",
        completed: false,
      },
    ],
    symptomEntries: [
      {
        id: "sym-301",
        date: "Thursday, Jun 25, 2026",
        dayLabel: "Day 2 (Interdialytic)",
        symptoms: ["Fatigue", "Decreased appetite"],
        severity: "Mild",
        recoveryTime: "2 – 4 hours",
        notes: "Ate protein snack in evening.",
      },
    ],
  },
  "tx-4": {
    id: "tx-4",
    name: "Treatment 4",
    label: "Treatment 4 ➔ Next Week Treatment 1",
    startDate: "Saturday, Jun 27, 2026",
    endDate: "Tuesday, Jun 30, 2026",
    isExtra: false,
    orders: [
      {
        id: "ord-401",
        date: "Jun 27, 2026",
        order: "Take iron supplement daily with Vitamin C",
        completed: true,
      },
      {
        id: "ord-402",
        date: "Jun 28, 2026",
        order:
          "Strict adherence to 3-day weekend fluid restriction (< 1.5 L total)",
        completed: true,
      },
      {
        id: "ord-403",
        date: "Jun 28, 2026",
        order:
          "Inspect access puncture sites daily for erythema, warmth, or drainage",
        completed: true,
      },
      {
        id: "ord-404",
        date: "Jun 29, 2026",
        order: "Take renal multivitamin in the morning after breakfast",
        completed: false,
      },
      {
        id: "ord-405",
        date: "Jun 30, 2026",
        order:
          "Notify on-call nephrologist if weekend weight gain exceeds 2.5 kg",
        completed: false,
      },
    ],
    symptomEntries: [
      {
        id: "sym-401",
        date: "Sunday, Jun 28, 2026",
        dayLabel: "Day 2 (Weekend Gap)",
        symptoms: ["Mild ankle tightness"],
        severity: "Mild",
        recoveryTime: "< 2 hours",
        notes: "Weekend fluid control maintained under 32 oz.",
      },
    ],
  },
  "tx-extra-3-1": {
    id: "tx-extra-3-1",
    name: "Treatment 3.1",
    label: "Between Treatment 3.1 to 4",
    startDate: "Friday, Jun 26, 2026",
    endDate: "Saturday, Jun 27, 2026",
    isExtra: true,
    clinicalReason: "Fluid Overload (Extra Ultrafiltration needed)",
    additionalNotes:
      "Unscheduled extra session between treatment 3 and 4 to remove excess interdialytic fluid (+2.4 kg) and alleviate shortness of breath.",
    orders: [
      {
        id: "ord-ext-1",
        date: "Jun 26, 2026",
        order:
          "Complete 3.5-hour ultrafiltration-only cycle to achieve target dry weight",
        completed: true,
      },
      {
        id: "ord-ext-2",
        date: "Jun 26, 2026",
        order: "Monitor standing BP every 30 minutes during fluid removal",
        completed: true,
      },
      {
        id: "ord-ext-3",
        date: "Jun 27, 2026",
        order:
          "Strict adherence to 32 oz interdialytic fluid limit over the weekend",
        completed: false,
      },
    ],
    symptomEntries: [
      {
        id: "sym-ext-1",
        date: "Friday, Jun 26, 2026",
        dayLabel: "Extra Session Day",
        symptoms: ["Shortness of breath", "Pedal edema"],
        severity: "Moderate",
        recoveryTime: "2 – 4 hours",
        notes:
          "Breathing significantly improved following 2.1 L fluid removal.",
      },
    ],
  },
};

export const TREATMENT_VALID_DATES: Record<
  string,
  { dateStr: string; dayLabel: string; shortDate: string }[]
> = {
  "tx-1": [
    {
      dateStr: "Friday, Jun 19, 2026",
      dayLabel: "Friday",
      shortDate: "Jun 19, 2026",
    },
    {
      dateStr: "Saturday, Jun 20, 2026",
      dayLabel: "Saturday",
      shortDate: "Jun 20, 2026",
    },
    {
      dateStr: "Sunday, Jun 21, 2026",
      dayLabel: "Sunday",
      shortDate: "Jun 21, 2026",
    },
    {
      dateStr: "Monday, Jun 22, 2026",
      dayLabel: "Monday",
      shortDate: "Jun 22, 2026",
    },
  ],
  "tx-2": [
    {
      dateStr: "Monday, Jun 22, 2026",
      dayLabel: "Monday",
      shortDate: "Jun 22, 2026",
    },
    {
      dateStr: "Tuesday, Jun 23, 2026",
      dayLabel: "Tuesday",
      shortDate: "Jun 23, 2026",
    },
    {
      dateStr: "Wednesday, Jun 24, 2026",
      dayLabel: "Wednesday",
      shortDate: "Jun 24, 2026",
    },
  ],
  "tx-3": [
    {
      dateStr: "Wednesday, Jun 24, 2026",
      dayLabel: "Wednesday",
      shortDate: "Jun 24, 2026",
    },
    {
      dateStr: "Thursday, Jun 25, 2026",
      dayLabel: "Thursday",
      shortDate: "Jun 25, 2026",
    },
    {
      dateStr: "Friday, Jun 26, 2026",
      dayLabel: "Friday",
      shortDate: "Jun 26, 2026",
    },
    {
      dateStr: "Saturday, Jun 27, 2026",
      dayLabel: "Saturday",
      shortDate: "Jun 27, 2026",
    },
  ],
  "tx-4": [
    {
      dateStr: "Saturday, Jun 27, 2026",
      dayLabel: "Saturday",
      shortDate: "Jun 27, 2026",
    },
    {
      dateStr: "Sunday, Jun 28, 2026",
      dayLabel: "Sunday",
      shortDate: "Jun 28, 2026",
    },
    {
      dateStr: "Monday, Jun 29, 2026",
      dayLabel: "Monday",
      shortDate: "Jun 29, 2026",
    },
    {
      dateStr: "Tuesday, Jun 30, 2026",
      dayLabel: "Tuesday",
      shortDate: "Jun 30, 2026",
    },
  ],
  "tx-extra-3-1": [
    {
      dateStr: "Friday, Jun 26, 2026",
      dayLabel: "Friday",
      shortDate: "Jun 26, 2026",
    },
    {
      dateStr: "Saturday, Jun 27, 2026",
      dayLabel: "Saturday",
      shortDate: "Jun 27, 2026",
    },
  ],
};
