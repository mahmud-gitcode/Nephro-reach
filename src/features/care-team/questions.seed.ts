import type { CareTeamQuestion } from "./questions.types";

/* Demo questions, so a member sees the shape of the list before writing
   their own. Deletable in one commit when real accounts arrive. */
export const SEED_QUESTIONS: CareTeamQuestion[] = [
  {
    id: "q1",
    role: "Provider",
    question: "Why was my dry weight changed?",
    status: "Answered",
    answer:
      "Dr. Miller explained that your blood pressure was dropping below 95/60 towards the end of treatments with mild leg cramping. Target dry weight was raised by 0.5 kg to 72.5 kg to evaluate comfort and avoid excessive fluid removal.",
  },
  {
    id: "q2",
    role: "Provider",
    question: "Am I a transplant candidate?",
    status: "Discussed",
    answer:
      "Reviewed initial health criteria with Dr. Miller. Cardiac clearance test referral and evaluation package submitted to the regional transplant center. Awaiting intake interview scheduling.",
  },
  {
    id: "q3",
    role: "Provider",
    question: "Can I switch to home dialysis?",
    status: "Submitted",
    answer: "",
  },
  {
    id: "q4",
    role: "Provider",
    question: "Why is my phosphorus high?",
    status: "Answered",
    answer:
      "Advised taking prescribed phosphate binders with every meal and snack, not after. Recommended avoiding dark sodas and packaged processed meats which contain hidden inorganic phosphate additives.",
  },
  {
    id: "q5",
    role: "Dietitian",
    question: "What are low-potassium fruits I can enjoy safely?",
    status: "Answered",
    answer:
      "Dietitian recommended apples, berries (strawberries, blueberries), grapes, and pineapple as excellent low-potassium choices. Limit high-potassium fruits like bananas, oranges, and melons.",
  },
  {
    id: "q6",
    role: "Dietitian",
    question: "How much fluid am I allowed on non-dialysis days?",
    status: "Discussed",
    answer:
      "Daily fluid target is 32 oz (about 1 liter) on non-dialysis days to keep interdialytic weight gains under 2.0 kg. Suggested using ice chips or freezing grapes to help control thirst.",
  },
  {
    id: "q7",
    role: "Dietitian",
    question:
      "What protein-rich snacks can I safely eat between dialysis days?",
    status: "Answered",
    answer:
      "Egg whites, Greek yogurt (monitored for potassium), renal-friendly protein bars, and roasted unsalted chicken strips are great low-phosphorus high-protein options.",
  },
  {
    id: "q8",
    role: "Social Worker",
    question: "How do I apply for clinic transportation assistance?",
    status: "Answered",
    answer:
      "Social worker completed the regional non-emergency medical transportation application. Door-to-door clinic shuttle ride service is confirmed to begin next Monday.",
  },
  {
    id: "q9",
    role: "Social Worker",
    question: "Are there support groups for newly started dialysis patients?",
    status: "Discussed",
    answer:
      "Connected with our clinic's monthly peer support group (every 2nd Tuesday at 5:00 PM) and provided the National Kidney Foundation peer mentoring program materials.",
  },
  {
    id: "q10",
    role: "Social Worker",
    question:
      "Can the clinic social worker help with prescription co-pay assistance?",
    status: "Answered",
    answer:
      "Social worker enrolled you in the non-profit medication foundation co-pay relief program, covering up to 90% of binder and calcitriol costs.",
  },
  {
    id: "q11",
    role: "Nurse",
    question:
      "My fistula access site has a slight tingling sensation after treatment",
    status: "Answered",
    answer:
      "Nurse assessed thrill and bruit; blood flow is strong and clear. Tingling was determined to be transient nerve sensitivity from arm positioning during the run. Advised warm compress and to report any throbbing.",
  },
  {
    id: "q12",
    role: "Nurse",
    question: "Is mild cramping normal after removing 2.5L?",
    status: "Discussed",
    answer:
      "Rapid fluid shifts towards the end of a session can trigger muscle cramps. Team adjusted the machine ultrafiltration profile and sodium ramp. Advised alerting the tech immediately if cramping starts.",
  },
];
