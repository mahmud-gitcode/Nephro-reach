import type { MedicationReminder } from "./reminders.types";

/* Demo reminders, so the screen is not blank on a first visit. Deletable in
   one commit when real accounts arrive. */
export const SEED_REMINDERS: MedicationReminder[] = [
  {
    id: "r1",
    medicationName: "Potassium",
    time: "08:00 AM",
    frequency: "Daily",
    channels: ["in_app"],
    enabled: true,
    notes: "Take with breakfast",
  },
  {
    id: "r2",
    medicationName: "Norvasc",
    time: "08:00 AM",
    frequency: "Daily",
    channels: ["in_app"],
    enabled: true,
    notes: "Hold morning dose on dialysis days until after run",
  },
  {
    id: "r3",
    medicationName: "Sevelamer",
    time: "12:30 PM",
    frequency: "With meals",
    channels: ["in_app"],
    enabled: true,
    notes: "Chew thoroughly with first bite of lunch",
  },
  {
    id: "r4",
    medicationName: "Calcitriol",
    time: "07:00 PM",
    frequency: "Mon/Wed/Fri",
    channels: ["in_app"],
    enabled: true,
    notes: "Take with evening meal",
  },
];
