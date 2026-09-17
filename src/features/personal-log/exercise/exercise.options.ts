import type { ExerciseActivity, ExerciseUnit } from "./exercise.types";

/* The choices a member taps, with the unit each one is usually counted in.
   Kept with their Spanish so an activity cannot be added in one language. */

export interface ActivityOption {
  value: ExerciseActivity;
  labelEn: string;
  labelEs: string;
  unit: ExerciseUnit;
}

export const ACTIVITY_OPTIONS: ActivityOption[] = [
  { value: "walking", labelEn: "Walking", labelEs: "Caminar", unit: "steps" },
  {
    value: "push-ups",
    labelEn: "Push-ups",
    labelEs: "Flexiones",
    unit: "reps",
  },
  {
    value: "sit-ups",
    labelEn: "Sit-ups",
    labelEs: "Abdominales",
    unit: "reps",
  },
  { value: "squats", labelEn: "Squats", labelEs: "Sentadillas", unit: "reps" },
  {
    value: "stretching",
    labelEn: "Stretching",
    labelEs: "Estiramientos",
    unit: "minutes",
  },
  {
    value: "cycling",
    labelEn: "Cycling",
    labelEs: "Bicicleta",
    unit: "minutes",
  },
  {
    value: "chair-exercises",
    labelEn: "Chair exercises",
    labelEs: "Ejercicios en silla",
    unit: "minutes",
  },
  { value: "yoga", labelEn: "Yoga", labelEs: "Yoga", unit: "minutes" },
  {
    value: "swimming",
    labelEn: "Swimming",
    labelEs: "Natación",
    unit: "minutes",
  },
  { value: "other", labelEn: "Other", labelEs: "Otro", unit: "minutes" },
];

export const UNIT_OPTIONS: {
  value: ExerciseUnit;
  labelEn: string;
  labelEs: string;
}[] = [
  { value: "steps", labelEn: "steps", labelEs: "pasos" },
  { value: "reps", labelEn: "times", labelEs: "veces" },
  { value: "minutes", labelEn: "minutes", labelEs: "minutos" },
  { value: "km", labelEn: "km", labelEs: "km" },
  { value: "miles", labelEn: "miles", labelEs: "millas" },
];
