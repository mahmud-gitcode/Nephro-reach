/* ==========================================================================
   Caregivers: pure mapping and rules for display (Phase 3, D1)
   --------------------------------------------------------------------------
   The server owns every caregiver rule: which preset gives which levels,
   who may invite, revoke or change a grant, what a caregiver may open. These
   functions only reshape the server's answers for the screens and build
   request bodies the server accepts. No storage, no I/O.
   ========================================================================== */

import type { ContextCaregiving } from "@/features/auth/auth.types";
import {
  CAREGIVER_AREAS,
  type CaregiverPermissions,
  type CaregiverPreset,
  type CaregivingRow,
} from "./caregivers.api";

/** One patient a caregiver looks after, from `context.caregiving[]` or
 *  `GET /me/caregiving` (they name the patient's fields differently). */
export type CaregivingPatient = {
  /** The grant id (kept as `id` for the existing shell code). */
  id: string;
  grantId: string;
  patientId: string;
  patientName: string;
  relationship: string;
  preset: string;
  permissions: CaregiverPermissions;
};

const fullName = (first: string, last: string) => `${first} ${last}`.trim();

export function fromContext(grant: ContextCaregiving): CaregivingPatient {
  return {
    id: grant.grantId,
    grantId: grant.grantId,
    patientId: grant.patientId,
    patientName: fullName(grant.firstName, grant.lastName),
    relationship: grant.relationship,
    preset: grant.preset,
    permissions: { ...grant.permissions },
  };
}

export function fromCaregivingRow(row: CaregivingRow): CaregivingPatient {
  return {
    id: row.grantId,
    grantId: row.grantId,
    patientId: row.patientId,
    patientName: fullName(row.patientFirstName, row.patientLastName),
    relationship: row.relationship,
    preset: row.preset,
    permissions: { ...row.permissions },
  };
}

/** The level a grant holds on a caregiver key (0 when absent). */
export function areaLevel(
  permissions: CaregiverPermissions | null | undefined,
  key: string,
): number {
  const level = permissions?.[key];
  return typeof level === "number" && Number.isInteger(level) && level > 0
    ? level
    : 0;
}

/* ---------------------------------------------------------- presets */

export const PRESET_LABELS: Record<string, string> = {
  full: "Full access",
  "view-only": "View only",
  support: "Support",
  custom: "Custom",
};

/** What each preset says it covers, in plain words. The levels themselves
 *  are the server's (the invitation and the grant come back with their
 *  map); this is the description shown before choosing. */
export const PRESET_DESCRIPTIONS: Record<CaregiverPreset, string> = {
  full: "View and update your profile, logs, nutrition, check-ins, ER visits, dialysis, medications, labs and messages with your care team.",
  "view-only": "See those same areas, but change nothing.",
  support:
    "Update day-to-day logs, nutrition, check-ins, ER visits, medications and messages; see your profile, dialysis and labs.",
  custom: "Choose each area yourself.",
};

/** What Full Access never covers (D1). Shown before the patient
 *  authorizes it. */
export const NEVER_COVERED = [
  "Your password and sign-in methods",
  "Your security settings",
  "Owning or closing your account",
  "Who your caregivers are and what they can do",
  "Your private journal (only with its own, separate permission)",
] as const;

export const AREA_LABELS: Record<string, string> = {
  profile: "Profile and education",
  "personal-logs": "Personal logs and care-team questions",
  nutrition: "Nutrition",
  "check-ins": "Check-ins",
  "er-visits": "ER visits",
  dialysis: "Dialysis, travel and vascular access",
  medications: "Medications and reminders",
  labs: "Labs",
  messages: "Messages with your care team",
  journal: "Private journal",
  sharing: "Sharing records outside NephroReach",
};

export const LEVEL_LABELS: Record<number, string> = {
  0: "None",
  1: "View",
  2: "Edit",
  3: "Manage",
};

/** An empty custom map: every area None. */
export function emptyCustomMap(): CaregiverPermissions {
  return Object.fromEntries(CAREGIVER_AREAS.map((a) => [a, 0]));
}

/**
 * The custom map to PATCH when the patient edits areas: the edited areas,
 * plus every other key the grant already holds (journal, sharing, anything
 * newer) unchanged, so an edit never silently opens or closes something
 * the editor does not show.
 */
export function customMapFor(
  current: CaregiverPermissions,
  edited: CaregiverPermissions,
): CaregiverPermissions {
  const out: CaregiverPermissions = {};
  for (const [key, level] of Object.entries(current)) out[key] = level;
  for (const area of CAREGIVER_AREAS) out[area] = areaLevel(edited, area);
  return out;
}

/** The map that opens (level 1, read) or closes (0) the private journal,
 *  everything else unchanged. Always a custom map: no preset carries the
 *  journal (D1, spec 028). */
export function journalMap(
  current: CaregiverPermissions,
  open: boolean,
): CaregiverPermissions {
  return { ...current, journal: open ? 1 : 0 };
}

/* ------------------------------------------------- Spanish (display only) */

const PRESET_LABELS_ES: Record<string, string> = {
  full: "Acceso completo",
  "view-only": "Solo ver",
  support: "Apoyo",
  custom: "Personalizado",
};

const PRESET_DESCRIPTIONS_ES: Record<CaregiverPreset, string> = {
  full: "Ver y actualizar su perfil, registros, nutrición, chequeos, visitas a la sala de emergencias, diálisis, medicamentos, laboratorios y mensajes con su equipo de atención.",
  "view-only": "Ver esas mismas áreas, sin cambiar nada.",
  support:
    "Actualizar registros diarios, nutrición, chequeos, visitas a la sala de emergencias, medicamentos y mensajes; ver su perfil, diálisis y laboratorios.",
  custom: "Elija cada área usted mismo.",
};

const NEVER_COVERED_ES = [
  "Su contraseña y sus métodos de inicio de sesión",
  "Su configuración de seguridad",
  "Ser dueño de su cuenta o cerrarla",
  "Quiénes son sus cuidadores y lo que pueden hacer",
  "Su diario privado (solo con su propio permiso por separado)",
] as const;

const AREA_LABELS_ES: Record<string, string> = {
  profile: "Perfil y educación",
  "personal-logs": "Registros personales y preguntas al equipo de atención",
  nutrition: "Nutrición",
  "check-ins": "Chequeos",
  "er-visits": "Visitas a la sala de emergencias",
  dialysis: "Diálisis, viajes y acceso vascular",
  medications: "Medicamentos y recordatorios",
  labs: "Laboratorios",
  messages: "Mensajes con su equipo de atención",
  journal: "Diario privado",
  sharing: "Compartir registros fuera de NephroReach",
};

const LEVEL_LABELS_ES: Record<number, string> = {
  0: "Ninguno",
  1: "Ver",
  2: "Editar",
  3: "Administrar",
};

/** Display labels for the relationship values the server stores in
 *  English (the value sent stays the English one). */
const RELATIONSHIP_LABELS_ES: Record<string, string> = {
  "Spouse / partner": "Cónyuge / pareja",
  Son: "Hijo",
  Daughter: "Hija",
  Parent: "Padre o madre",
  Grandchild: "Nieto/a",
  Sibling: "Hermano/a",
  Friend: "Amigo/a",
  "Professional caregiver": "Cuidador profesional",
  Other: "Otro",
};

const OUTCOME_LABELS_ES: Record<string, string> = {
  DENIED: "denegado",
  FAILURE: "fallido",
  FAILED: "fallido",
  ERROR: "error",
};

export const presetLabel = (preset: string, isEs = false): string =>
  (isEs ? PRESET_LABELS_ES : PRESET_LABELS)[preset] ?? preset;

export const presetDescription = (preset: CaregiverPreset, isEs = false) =>
  (isEs ? PRESET_DESCRIPTIONS_ES : PRESET_DESCRIPTIONS)[preset];

export const neverCovered = (isEs = false): readonly string[] =>
  isEs ? NEVER_COVERED_ES : NEVER_COVERED;

export const areaLabel = (key: string, isEs = false): string =>
  (isEs ? AREA_LABELS_ES : AREA_LABELS)[key] ?? AREA_LABELS[key] ?? key;

export const levelLabel = (level: number, isEs = false): string =>
  (isEs ? LEVEL_LABELS_ES : LEVEL_LABELS)[level];

export const relationshipLabel = (relationship: string, isEs = false) =>
  isEs ? (RELATIONSHIP_LABELS_ES[relationship] ?? relationship) : relationship;

/** An activity outcome other than SUCCESS, lowercased as before. */
export const outcomeLabel = (outcome: string, isEs = false): string =>
  isEs
    ? (OUTCOME_LABELS_ES[outcome] ?? outcome.toLowerCase())
    : outcome.toLowerCase();

/** Friendly text for an activity row; unknown actions show as sent. */
export function activityLabel(
  row: { module: string; action: string },
  isEs = false,
): string {
  const area = areaLabel(row.module, isEs);
  return `${area} · ${row.action}`;
}
