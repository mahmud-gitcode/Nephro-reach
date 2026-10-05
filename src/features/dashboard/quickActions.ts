import { readJson, storageKey, writeJson } from "@/lib/data/storage";

/* ==========================================================================
   Quick Actions — the member's own top four
   --------------------------------------------------------------------------
   The client (2026-10-05): Quick Actions are personalised to what the
   member wants, their top four. The catalogue is the member's main pages;
   the choice is saved per member, in the order picked.
   ========================================================================== */

export type QuickActionId =
  | "rides"
  | "classroom"
  | "community"
  | "before-the-er"
  | "messages"
  | "medications"
  | "blood-pressure"
  | "fluid"
  | "nutrition"
  | "appointments"
  | "labs"
  | "vascular-access"
  | "library"
  | "check-in";

export type QuickAction = {
  id: QuickActionId;
  en: string;
  es: string;
  href: string;
};

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "rides",
    en: "Where's My Ride",
    es: "¿Dónde está mi transporte?",
    href: "/dashboard/my-rides",
  },
  {
    id: "classroom",
    en: "My Classroom",
    es: "Mi Salón de Clases",
    href: "/dashboard/my-classroom",
  },
  {
    id: "community",
    en: "Community",
    es: "Comunidad",
    href: "/dashboard/community",
  },
  {
    id: "before-the-er",
    en: "Before the ER™",
    es: "Antes de Urgencias™",
    href: "/dashboard/before-the-er",
  },
  {
    id: "messages",
    en: "Messages",
    es: "Mensajes",
    href: "/dashboard/messages",
  },
  {
    id: "medications",
    en: "Medication Log",
    es: "Registro de Medicamentos",
    href: "/dashboard/personal-log/medications",
  },
  {
    id: "blood-pressure",
    en: "Blood Pressure",
    es: "Presión Arterial",
    href: "/dashboard/personal-log/blood-pressure",
  },
  {
    id: "fluid",
    en: "Weight & Fluid",
    es: "Peso y Líquidos",
    href: "/dashboard/personal-log/fluid-tracker",
  },
  {
    id: "nutrition",
    en: "Nutrition",
    es: "Nutrición",
    href: "/dashboard/personal-log/nutrition",
  },
  {
    id: "appointments",
    en: "Appointments",
    es: "Citas",
    href: "/dashboard/personal-log/appointments",
  },
  {
    id: "labs",
    en: "My Labs",
    es: "Mis Laboratorios",
    href: "/dashboard/personal-log/lab-tracking",
  },
  {
    id: "vascular-access",
    en: "Vascular Access",
    es: "Acceso Vascular",
    href: "/dashboard/vascular-access",
  },
  {
    id: "library",
    en: "My Library",
    es: "Mi Biblioteca",
    href: "/dashboard/my-library",
  },
  {
    id: "check-in",
    en: "Check-In",
    es: "Registro",
    href: "/dashboard/beyond-the-chair",
  },
];

export const DEFAULT_QUICK_ACTIONS: QuickActionId[] = [
  "rides",
  "classroom",
  "community",
  "before-the-er",
];

export const MAX_QUICK_ACTIONS = 4;

/** Keeps known ids, in order, without repeats, at most four; falls back
 *  to the defaults when nothing usable is left. */
export function cleanChoice(ids: unknown): QuickActionId[] {
  if (!Array.isArray(ids)) return DEFAULT_QUICK_ACTIONS;
  const known = new Set(QUICK_ACTIONS.map((a) => a.id));
  const kept = [...new Set(ids)]
    .filter((id): id is QuickActionId => known.has(id as QuickActionId))
    .slice(0, MAX_QUICK_ACTIONS);
  return kept.length > 0 ? kept : DEFAULT_QUICK_ACTIONS;
}

/** Adds or removes one action; a fifth is refused. */
export function toggleChoice(
  ids: QuickActionId[],
  id: QuickActionId,
): QuickActionId[] {
  if (ids.includes(id)) return ids.filter((x) => x !== id);
  return ids.length >= MAX_QUICK_ACTIONS ? ids : [...ids, id];
}

const KEY = storageKey("quick-actions");

export async function readQuickActions(): Promise<QuickActionId[]> {
  return cleanChoice(await readJson<unknown>(KEY, null));
}

export async function writeQuickActions(
  ids: QuickActionId[],
): Promise<QuickActionId[]> {
  return writeJson(KEY, cleanChoice(ids));
}
