import type {
  ExerciseActivity,
  ExerciseFeeling,
  ExerciseIntensity,
  ExerciseUnit,
} from "./exercise.types";

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

/* How hard it felt. `kcalPerMinute` is a coarse average for an adult at
   rest-adjusted effort — enough to show a trend, never a clinical figure,
   which is why the calorie tile is labelled an estimate. */
export interface IntensityOption {
  value: ExerciseIntensity;
  labelEn: string;
  labelEs: string;
  kcalPerMinute: number;
}

export const INTENSITY_OPTIONS: IntensityOption[] = [
  { value: "light", labelEn: "Light", labelEs: "Ligera", kcalPerMinute: 4 },
  {
    value: "moderate",
    labelEn: "Moderate",
    labelEs: "Moderada",
    kcalPerMinute: 6,
  },
  {
    value: "vigorous",
    labelEn: "Vigorous",
    labelEs: "Vigorosa",
    kcalPerMinute: 9,
  },
];

/* How the member felt, worst last: the summary tile reports the lowest of
   the day so a bad session is never averaged out of sight. */
export interface FeelingOption {
  value: ExerciseFeeling;
  labelEn: string;
  labelEs: string;
  /** Said back in the activity list: "Felt good", "Slight fatigue". */
  pastEn: string;
  pastEs: string;
}

export const FEELING_OPTIONS: FeelingOption[] = [
  {
    value: "good",
    labelEn: "Good",
    labelEs: "Bien",
    pastEn: "Felt good",
    pastEs: "Se sintió bien",
  },
  {
    value: "okay",
    labelEn: "Okay",
    labelEs: "Regular",
    pastEn: "Felt okay",
    pastEs: "Se sintió regular",
  },
  {
    value: "tired",
    labelEn: "Tired",
    labelEs: "Cansado",
    pastEn: "Slight fatigue",
    pastEs: "Algo de fatiga",
  },
  {
    value: "unwell",
    labelEn: "Unwell",
    labelEs: "Mal",
    pastEn: "Felt unwell",
    pastEs: "Se sintió mal",
  },
];
