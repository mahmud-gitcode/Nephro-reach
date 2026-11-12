/* ==========================================================================
   Page permission → the server's (resource, level): one fixed table
   --------------------------------------------------------------------------
   Phase 3 (D4). The server holds each membership's permission levels per
   resource (0 None, 1 View, 2 Edit, 3 Manage) and decides every request.
   The UI only hides and disables, and it does so by reading the levels the
   server sent in `GET /me/context` through this table. There is no client
   role matrix any more: a role's levels come from the server, whatever the
   role is called (built-in, overridden or custom).

   Source: integration-design/permissions/matrix.md §7 (PERM-MATRIX) with the
   D4 resources of final-matrix.md §2 (prescriptions, clinical_actions,
   transport). Each id lists alternatives (any one opens it); each
   alternative lists checks that must all hold. An id with no alternative is
   the owner's only (`account.manage`, `access.schedule`).

   Fails closed: no user, an unknown id, a resource the membership does not
   hold, a patient or caregiver context, or a context of the wrong kind
   (office vs platform) is always false.
   ========================================================================== */

export type PermissionLevel = 0 | 1 | 2 | 3;

export const LEVEL_NONE = 0;
export const LEVEL_VIEW = 1;
export const LEVEL_EDIT = 2;
export const LEVEL_MANAGE = 3;

/** Every office resource the server knows (organization-permission.constants.ts). */
export const OFFICE_RESOURCES = [
  "patients",
  "messages",
  "team_messages",
  "labs",
  "ccm",
  "referrals",
  "vascular_access",
  "check_ins",
  "travel",
  "programs",
  "reports",
  "billing",
  "activity",
  "prescriptions",
  "clinical_actions",
  "transport",
  "settings",
  "staff",
  "roles",
] as const;

/** Every platform resource (platform-permission.constants.ts) plus the
 *  three administration resources a platform role may hold. */
export const PLATFORM_RESOURCES = [
  "organizations",
  "contracts",
  "plans",
  "members",
  "support",
  "content",
  "campaigns",
  "activity",
  "settings",
  "staff",
  "roles",
] as const;

export type ContextKind = "office" | "platform";

type Check = readonly [resource: string, level: 1 | 2 | 3];
type Rule = {
  /** Where the id means anything. The owner holds it only there. */
  kind: ContextKind | "both";
  /** Any one alternative opens it; every check in it must hold. */
  anyOf: readonly (readonly Check[])[];
};

const office = (...anyOf: (readonly Check[])[]): Rule => ({
  kind: "office",
  anyOf,
});
const platform = (...anyOf: (readonly Check[])[]): Rule => ({
  kind: "platform",
  anyOf,
});

/** The table. Keys are the frontend's page permission ids (staff.ts). */
export const REQUIREMENTS = {
  "dashboard.view": office([["patients", 1]]),
  "programs.view": office([["programs", 1]]),
  "checkins.view": office([["check_ins", 1]]),
  "access.view": office([
    ["vascular_access", 1],
    ["referrals", 1],
  ]),
  "travel.view": office([["travel", 1]]),
  "messages.view": office([["messages", 1]]),
  "labs.view": office([["labs", 1]]),
  "labs.upload": office([["labs", 3]]),
  "access.workspace": office([["vascular_access", 1]]),
  "access.dashboard": office([
    ["patients", 1],
    ["referrals", 1],
    ["vascular_access", 1],
  ]),
  "access.referrals": office([["referrals", 1]]),
  "access.referrals.assigned": office([["referrals", 1]]),
  "access.concerns": office([["vascular_access", 1]]),
  "access.photos": office([["vascular_access", 1]]),
  "access.messages": office([
    ["referrals", 1],
    ["vascular_access", 1],
  ]),
  "access.message.nephrology": office([["referrals", 2]]),
  "access.message.dialysis": office([["referrals", 2]]),
  "access.message.patients": office([["vascular_access", 2]]),
  "access.scheduling.info": office([["vascular_access", 1]]),
  "access.appointments": office([["vascular_access", 2]]),
  "access.appointments.confirm": office([["vascular_access", 2]]),
  "access.appointments.status": office([["vascular_access", 2]]),
  "access.appointments.view": office([["vascular_access", 1]]),
  "access.referral.status": office([["referrals", 3]]),
  /* A sensitive clinical write: the route's own resource AND
     clinical_actions (final-matrix.md §2). */
  "access.coordination.status": office([
    ["vascular_access", 3],
    ["clinical_actions", 2],
  ]),
  "access.transport.view": office([["vascular_access", 1]]),
  "access.transport.coordinate": office([["vascular_access", 2]]),
  "access.tracking": office([
    ["referrals", 1],
    ["vascular_access", 1],
  ]),
  "access.documentation": office([["vascular_access", 2]]),
  /* No resource: the owner's alone (matrix.md ⚠B). */
  "account.manage": office(),
  "patients.enroll": office([["patients", 2]]),
  /* The clinic's enroll form puts the patient on the roster AND in a
     program in one server call, which needs both (backend spec 067). */
  "programs.enroll": office([
    ["patients", 2],
    ["programs", 2],
  ]),
  "messages.reply": office([["messages", 2]]),
  "messages.team": office([["team_messages", 2]]),
  /* D4: rides to access visits are the `transport` resource (PM-2). */
  "rides.manage": office([["transport", 2]]),
  "travel.manage": office([["travel", 2]]),
  /* Only the access center books (client 2026-10-07): no role grant. */
  "access.schedule": office(),
  "ccm.log": office([["ccm", 2]]),
  "reports.view": office([["reports", 1]]),
  "billing.view": office([["billing", 1]]),
  "settings.manage": { kind: "both", anyOf: [[["settings", 2]]] },
  /* The team page opens on its first read (staff View); each button checks
     its own level (canLevel). */
  "staff.manage": { kind: "both", anyOf: [[["staff", 1]]] },
  "admin.support": platform([["support", 2]]),
  "admin.reviews": platform([["content", 3]]),
  "admin.community": platform([["content", 3]]),
  "admin.content": platform([["content", 2]]),
  "admin.members": platform([
    ["members", 1],
    ["plans", 1],
    ["campaigns", 1],
  ]),
  "hospital.overview": office([
    ["patients", 1],
    ["programs", 1],
  ]),
  "hospital.patients": office([["patients", 1]]),
  "hospital.enroll": office([["patients", 2]]),
  "hospital.education.assign": office([["programs", 2]]),
  "hospital.education.monitor": office([["programs", 1]]),
  "hospital.reports": office([["reports", 1]]),
  "hospital.reports.download": office([["reports", 1]]),
  "hospital.messages": office([["messages", 2]]),
} as const satisfies Record<string, Rule>;

export type PermissionId = keyof typeof REQUIREMENTS;

/** What the permission checks read: the active office or platform context,
 *  straight from `/me/context`. */
export type PermissionContext = {
  kind: ContextKind;
  isOwner: boolean;
  /** resource → level; the owner's map is `{ "*": 3 }`. */
  permissions: Readonly<Record<string, number>>;
};

/** The level a context holds on a resource (the owner: Manage on all). */
export function levelOf(
  ctx: PermissionContext | null | undefined,
  resource: string,
): number {
  if (!ctx) return LEVEL_NONE;
  if (ctx.isOwner) return LEVEL_MANAGE;
  const own = ctx.permissions[resource];
  const any = ctx.permissions["*"];
  const level =
    typeof own === "number" ? own : typeof any === "number" ? any : 0;
  return Number.isInteger(level) && level > 0 ? Math.min(level, 3) : 0;
}

/** Whether a context holds at least `level` on `resource`. */
export function canLevel(
  ctx: PermissionContext | null | undefined,
  resource: string,
  level: number,
): boolean {
  return level >= 1 && levelOf(ctx, resource) >= level;
}

/** Whether a context opens a page permission id. Unknown ids are false. */
export function canWith(
  ctx: PermissionContext | null | undefined,
  id: string,
): boolean {
  if (!ctx) return false;
  if (!Object.prototype.hasOwnProperty.call(REQUIREMENTS, id)) return false;
  const rule: Rule = REQUIREMENTS[id as PermissionId];
  if (rule.kind !== "both" && rule.kind !== ctx.kind) return false;
  if (ctx.isOwner) return true;
  return rule.anyOf.some(
    (checks) =>
      checks.length > 0 &&
      checks.every(([resource, level]) => canLevel(ctx, resource, level)),
  );
}

/** The resources a role editor lists for a context kind, plus any key the
 *  server sent that this client does not know yet (shown by its own name,
 *  never dropped, so a save never removes a level it cannot see). */
export function editorResources(
  kind: ContextKind,
  serverKeys: Iterable<string> = [],
): string[] {
  const base: readonly string[] =
    kind === "office" ? OFFICE_RESOURCES : PLATFORM_RESOURCES;
  const extra = [...new Set(serverKeys)].filter(
    (key) => key !== "*" && !base.includes(key),
  );
  return [...base, ...extra.sort()];
}
