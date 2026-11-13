/* ==========================================================================
   The D4 role editor: pure helpers (Phase 3)
   --------------------------------------------------------------------------
   The server stores, per organisation, each role's map of resource → level
   (0 None, 1 View, 2 Edit, 3 Manage) and refuses any change the editor may
   not make: nobody can grant or remove a level they do not hold themselves
   (`canGrant`, backend access/permission.util.ts), only an office's own
   resources, the owner role is reserved. These helpers only mirror that
   rule on the levels the server sent, so the editor can disable what would
   be refused. The server's answer is still the one that counts, and a
   refusal is shown, never swallowed.
   ========================================================================== */

import {
  LEVEL_MANAGE,
  LEVEL_NONE,
  levelOf,
  type PermissionContext,
} from "@/features/permissions/permissionMap";

export const LEVELS = [0, 1, 2, 3] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_NAMES: Record<Level, string> = {
  0: "None",
  1: "View",
  2: "Edit",
  3: "Manage",
};

export const LEVEL_NAMES_ES: Record<Level, string> = {
  0: "Ninguno",
  1: "Ver",
  2: "Editar",
  3: "Administrar",
};

/** A level's name in the viewer's language (English by default). */
export function levelName(level: number, isEs = false): string {
  const names = isEs ? LEVEL_NAMES_ES : LEVEL_NAMES;
  return names[level as Level] ?? String(level);
}

/** Plain names for the server's resources; an unknown key shows as sent. */
export const RESOURCE_LABELS: Record<string, string> = {
  patients: "Patients and charts",
  messages: "Patient messages",
  team_messages: "Team messages",
  labs: "Labs",
  ccm: "Chronic care management",
  referrals: "Referrals",
  vascular_access: "Vascular access",
  check_ins: "Check-ins",
  travel: "Travel",
  programs: "Programs and education",
  reports: "Reports",
  billing: "Billing",
  activity: "Activity log",
  prescriptions: "Dialysis prescriptions",
  clinical_actions: "Sensitive clinical actions",
  transport: "Transport (rides)",
  settings: "Office settings",
  staff: "Staff administration",
  roles: "Roles and permissions",
  organizations: "Organizations",
  contracts: "Contracts",
  plans: "Plans",
  members: "Members",
  support: "Support",
  content: "Content",
  campaigns: "Campaigns",
};

/** The Spanish names for the same resources. */
export const RESOURCE_LABELS_ES: Record<string, string> = {
  patients: "Pacientes y expedientes",
  messages: "Mensajes de pacientes",
  team_messages: "Mensajes del equipo",
  labs: "Laboratorios",
  ccm: "Gestión de atención crónica",
  referrals: "Derivaciones",
  vascular_access: "Acceso vascular",
  check_ins: "Controles",
  travel: "Viajes",
  programs: "Programas y educación",
  reports: "Informes",
  billing: "Facturación",
  activity: "Registro de actividad",
  prescriptions: "Prescripciones de diálisis",
  clinical_actions: "Acciones clínicas sensibles",
  transport: "Transporte (traslados)",
  settings: "Configuración del consultorio",
  staff: "Administración del personal",
  roles: "Roles y permisos",
  organizations: "Organizaciones",
  contracts: "Contratos",
  plans: "Planes",
  members: "Miembros",
  support: "Soporte",
  content: "Contenido",
  campaigns: "Campañas",
};

/** Resources that carry the separate D4 permissions, called out in the
 *  editor so an administrator sees what they are granting. */
export const SENSITIVE_RESOURCES: readonly string[] = [
  "prescriptions",
  "clinical_actions",
  "staff",
  "roles",
];

export function resourceLabel(resource: string, isEs = false): string {
  return (isEs ? RESOURCE_LABELS_ES : RESOURCE_LABELS)[resource] ?? resource;
}

/** A role map's level for a resource (absent = None). */
export function mapLevel(
  map: Readonly<Record<string, number>> | null | undefined,
  resource: string,
): number {
  const v = map?.[resource];
  return typeof v === "number" && Number.isInteger(v) && v > 0
    ? Math.min(v, LEVEL_MANAGE)
    : LEVEL_NONE;
}

/**
 * Which levels the editor may pick for one resource, given the editor's
 * own levels and the role's current level: a change from `current` to `to`
 * is allowed only when the editor holds at least max(current, to) on it.
 * The current level is always selectable (no change).
 */
export function selectableLevels(
  editor: PermissionContext | null,
  resource: string,
  current: number,
): { level: Level; disabled: boolean }[] {
  const own = levelOf(editor, resource);
  return LEVELS.map((level) => ({
    level,
    disabled: level !== current && own < Math.max(current, level),
  }));
}

/** Whether the editor could make this whole change (the server's canGrant
 *  on the levels it sent). Every changed resource must be within reach. */
export function withinReach(
  editor: PermissionContext | null,
  from: Readonly<Record<string, number>>,
  to: Readonly<Record<string, number>>,
): boolean {
  const keys = new Set([...Object.keys(from), ...Object.keys(to)]);
  for (const key of keys) {
    const before = mapLevel(from, key);
    const after = mapLevel(to, key);
    if (before === after) continue;
    if (levelOf(editor, key) < Math.max(before, after)) return false;
  }
  return true;
}

/** The resources whose level differs between two maps. */
export function changedResources(
  from: Readonly<Record<string, number>>,
  to: Readonly<Record<string, number>>,
): string[] {
  const keys = new Set([...Object.keys(from), ...Object.keys(to)]);
  return [...keys].filter((k) => mapLevel(from, k) !== mapLevel(to, k)).sort();
}

/** The body for PUT /roles/permissions: every listed resource with its
 *  level (0 included, so a lowered level is explicit), plus any key the
 *  role already holds that the editor does not list, unchanged. */
export function permissionsBody(
  resources: readonly string[],
  edited: Readonly<Record<string, number>>,
  original: Readonly<Record<string, number>>,
): Record<string, number> {
  const body: Record<string, number> = {};
  for (const key of Object.keys(original))
    if (key !== "*") body[key] = mapLevel(original, key);
  for (const resource of resources) body[resource] = mapLevel(edited, resource);
  return body;
}

/** Roles the inviter or role changer may hand out: never the owner role,
 *  and only a role whose map is within the editor's own levels. */
export function assignableRoles<
  T extends { name: string; permissions: Record<string, number> },
>(editor: PermissionContext | null, roles: readonly T[]): T[] {
  return roles.filter(
    (role) =>
      role.name !== "Owner" && withinReach(editor, {}, role.permissions),
  );
}

/** A role name the server would accept: trimmed, 1-60 characters, not one
 *  already used. Returns the problem, or null. */
export function roleNameProblem(
  name: string,
  taken: readonly string[],
): "empty" | "long" | "taken" | null {
  const trimmed = name.trim();
  if (!trimmed) return "empty";
  if (trimmed.length > 60) return "long";
  if (taken.some((t) => t.toLowerCase() === trimmed.toLowerCase()))
    return "taken";
  return null;
}
