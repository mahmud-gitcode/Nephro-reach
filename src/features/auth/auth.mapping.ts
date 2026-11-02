/* ==========================================================================
   Identity mapping: pure functions, no I/O
   --------------------------------------------------------------------------
   The one place UI roles are decided. `GET /me/context` lists what the
   account holds (a patient record, caregiving grants, office memberships,
   the platform team); these functions pick the context Phase 2 lands on and
   turn it into the `AuthUser` the sidebar, `canAccessPath` and `userCan`
   already read, so the protected navigation stays unchanged.

   The server decides every permission. A wrong mapping here can only hide or
   show a page; the API refuses what the account may not do.
   ========================================================================== */

import { STAFF_ROLES, type StaffRole } from "@/features/staff/staff";
import {
  canAccessPath,
  homeForRole,
  type AuthUser,
  type UserRole,
} from "./auth";
import type {
  ContextMembership,
  CurrentSession,
  CurrentSessionDto,
  MeContext,
  OrganizationType,
} from "./auth.types";

/* ---------------------------------------------------------------- bodies */

/** "Email or Phone Number": an `@` means an email (lower-cased), anything
 *  else is sent as a phone for the server to normalise and validate. */
export function toLoginBody(
  identifier: string,
  password: string,
): { email: string; password: string } | { phone: string; password: string } {
  const value = identifier.trim();
  return value.includes("@")
    ? { email: value.toLowerCase(), password }
    : { phone: value, password };
}

export type RegisterForm = { name: string; email: string; password: string };

/**
 * The registration body. Only the fields the API accepts today: it refuses
 * unknown fields (`forbidNonWhitelisted`), so the D6 consent record is added
 * by `consent.ts` once the backend supports it (BE-AUTH-2, spec 030).
 */
export function toRegisterBody(
  form: RegisterForm,
  consent?: Record<string, unknown>,
): Record<string, unknown> {
  const name = form.name.trim();
  return {
    ...(name ? { name } : {}),
    email: form.email.trim().toLowerCase(),
    password: form.password,
    ...(consent ? { consent } : {}),
  };
}

/* ---------------------------------------------------------- portal roles */

/** Organization type → UI portal role. TRANSPLANT_CENTER has no portal. */
export function portalRoleFor(type: OrganizationType): UserRole | null {
  switch (type) {
    case "PLATFORM":
      return "admin";
    case "DIALYSIS_CENTER":
      return "clinic";
    case "ACCESS_CENTER":
      return "access";
    case "NEPHROLOGY_OFFICE":
      return "nephrology";
    case "HOSPITAL":
      return "hospital";
    default:
      return null;
  }
}

export type PortalChoice =
  | { kind: "platform"; membership: ContextMembership }
  | { kind: "office"; membership: ContextMembership }
  | { kind: "patient" }
  /** A caregiving context. `grantId` null: the caregiver looks after
   *  several patients and has not picked one yet (member pages read
   *  nothing until they do). */
  | { kind: "caregiver"; grantId: string | null }
  /** Only memberships of an organization type with no portal. */
  | { kind: "no-portal"; membership: ContextMembership }
  | { kind: "none" };

function isActive(m: ContextMembership): boolean {
  return m.organizationStatus === "ACTIVE";
}

/** Memberships that open a portal, in a stable order (by name). */
function officeMemberships(context: MeContext): ContextMembership[] {
  return context.memberships
    .filter((m) => isActive(m) && portalRoleFor(m.organizationType) !== null)
    .sort((a, b) => a.organizationName.localeCompare(b.organizationName));
}

function roleOf(choice: PortalChoice): UserRole | null {
  switch (choice.kind) {
    case "platform":
    case "office":
      return portalRoleFor(choice.membership.organizationType);
    case "patient":
      return "user";
    case "caregiver":
      return "caregiver";
    default:
      return null;
  }
}

/** The caregiving context to land on: the only patient, or none picked
 *  yet when there are several (the caregiver chooses on My Patients). */
function caregiverLanding(context: MeContext): PortalChoice {
  return {
    kind: "caregiver",
    grantId:
      context.caregiving.length === 1 ? context.caregiving[0].grantId : null,
  };
}

/** One entry per portal the account can enter, in a fixed priority:
 *  platform, then offices, then the patient, then caregiving (one entry:
 *  the patient is picked inside the caregiver portal). */
export function availableContexts(context: MeContext): PortalChoice[] {
  const choices: PortalChoice[] = [];
  if (context.platform && isActive(context.platform))
    choices.push({ kind: "platform", membership: context.platform });
  for (const membership of officeMemberships(context))
    choices.push({ kind: "office", membership });
  if (context.patient) choices.push({ kind: "patient" });
  if (context.caregiving.length > 0) choices.push(caregiverLanding(context));
  return choices;
}

/** Every context including each caregiving patient: what the portal picker
 *  lists (Phase 3, D5). */
export function portalChoices(context: MeContext): PortalChoice[] {
  const choices: PortalChoice[] = availableContexts(context).filter(
    (c) => c.kind !== "caregiver",
  );
  for (const grant of context.caregiving)
    choices.push({ kind: "caregiver", grantId: grant.grantId });
  return choices;
}

/** A stable id for a choice (the picker's keys and comparisons). */
export function choiceKey(choice: PortalChoice): string {
  switch (choice.kind) {
    case "platform":
      return `platform:${choice.membership.organizationId}`;
    case "office":
      return `office:${choice.membership.organizationId}`;
    case "caregiver":
      return `caregiver:${choice.grantId ?? "none"}`;
    case "no-portal":
      return `no-portal:${choice.membership.organizationId}`;
    default:
      return choice.kind;
  }
}

/**
 * The same choice read against a fresh context: an office or platform
 * choice takes the membership's new levels; a caregiver choice keeps its
 * patient only while that grant is still listed. Null when the context no
 * longer holds it (a revoked grant, a removed membership): the caller then
 * lands again, never on stale access.
 */
export function reconcileChoice(
  context: MeContext,
  choice: PortalChoice,
): PortalChoice | null {
  switch (choice.kind) {
    case "platform":
    case "office": {
      const id = choice.membership.organizationId;
      const found = availableContexts(context).find(
        (c) =>
          c.kind === choice.kind &&
          (c.kind === "platform" || c.kind === "office") &&
          c.membership.organizationId === id,
      );
      return found ?? null;
    }
    case "patient":
      return context.patient ? choice : null;
    case "caregiver": {
      if (context.caregiving.length === 0) return null;
      if (choice.grantId === null) return caregiverLanding(context);
      return context.caregiving.some((g) => g.grantId === choice.grantId)
        ? choice
        : null;
    }
    default:
      return null;
  }
}

/** Whether a choice is one the context holds (the picker's guard). */
export function holdsChoice(context: MeContext, choice: PortalChoice): boolean {
  return portalChoices(context).some((c) => choiceKey(c) === choiceKey(choice));
}

/**
 * Whether the account must pick a portal: it holds more than one, and
 * `next` (or the page being opened) does not name exactly one of them.
 * Single-portal accounts never see the picker.
 */
export function needsPicker(context: MeContext, next?: string | null): boolean {
  const choices = availableContexts(context);
  if (choices.length <= 1) return false;
  const path = pathOf(next);
  if (!path || !path.startsWith("/dashboard") || path === "/dashboard")
    return true;
  const fits = choices.filter((choice) => {
    const role = roleOf(choice);
    return role !== null && canAccessPath(role, path);
  });
  return fits.length !== 1;
}

/**
 * The context Phase 2 lands on (no picker until Phase 3). If `next` is a
 * page one of the account's contexts may open, that context wins; else the
 * fixed priority. An account whose only memberships have no portal gets
 * "no-portal"; an account with nothing gets "none" (patient setup).
 */
export function defaultContext(
  context: MeContext,
  next?: string | null,
): PortalChoice {
  const choices = availableContexts(context);
  if (choices.length === 0) {
    const noPortal = context.memberships.find(
      (m) => isActive(m) && portalRoleFor(m.organizationType) === null,
    );
    return noPortal
      ? { kind: "no-portal", membership: noPortal }
      : { kind: "none" };
  }
  const path = pathOf(next);
  if (path && path.startsWith("/dashboard")) {
    const wanted = choices.find((choice) => {
      const role = roleOf(choice);
      return role !== null && canAccessPath(role, path);
    });
    if (wanted) return wanted;
  }
  return choices[0];
}

/* A built-in role name matches the client's STAFF_ROLES exactly. A custom
   role name is not in the client's matrix, so userCan() grants it nothing
   until Phase 3 reads the membership's own permissions. The server enforces
   either way. */
function staffRoleOf(name: string): StaffRole {
  return name as StaffRole;
}

export function isKnownStaffRole(name: string): boolean {
  return (STAFF_ROLES as readonly string[]).includes(name);
}

function personName(first: string, last: string): string {
  return `${first} ${last}`.trim();
}

/** The `AuthUser` for one context. Null for "none" and "no-portal". */
export function contextToUser(
  context: MeContext,
  choice: PortalChoice,
): AuthUser | null {
  const role = roleOf(choice);
  if (!role) return null;
  const { user } = context;
  const email = user.email ?? "";
  const base = { id: user.id, email, role };

  if (choice.kind === "platform" || choice.kind === "office") {
    const m = choice.membership;
    return {
      ...base,
      name: user.name ?? m.organizationName,
      organizationId: m.organizationId,
      org: m.organizationName,
      /* The owner may do everything: the client matrix has no "Owner" row,
         so a role name here would lock the owner out of every page. */
      staffRole: m.isOwner ? undefined : staffRoleOf(m.role),
      isOwner: m.isOwner,
      orgPermissions: m.permissions,
    };
  }
  if (choice.kind === "patient" && context.patient) {
    return {
      ...base,
      name:
        user.name ??
        (personName(context.patient.firstName, context.patient.lastName) ||
          email),
      patientId: context.patient.id,
    };
  }
  if (choice.kind === "caregiver") {
    const grant = context.caregiving.find((g) => g.grantId === choice.grantId);
    return {
      ...base,
      name: user.name ?? email,
      patientId: grant?.patientId,
      caregivingGrantId: grant?.grantId,
    };
  }
  return null;
}

/** Whether a context is office or platform (MFA is required there). */
export function isStaffChoice(choice: PortalChoice): boolean {
  return choice.kind === "platform" || choice.kind === "office";
}

/* --------------------------------------------------------------- routing */

function pathOf(next: string | null | undefined): string | null {
  if (!next) return null;
  /* Same-origin paths only: no scheme, no protocol-relative `//`, no
     backslash tricks (`/\evil` is `//evil` to a browser), no control
     characters. */
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  if (next.includes("\\")) return null;
  if (/[\u0000-\u001f\u007f]/.test(next)) return null;
  try {
    const url = new URL(next, "http://same.invalid");
    if (url.origin !== "http://same.invalid") return null;
    return url.pathname;
  } catch {
    return null;
  }
}

const NEXT_PREFIXES = [
  "/dashboard",
  "/select-portal",
  "/invitations/",
  "/setup/",
];

/** Pages a new account opens to accept an invitation: patient setup is
 *  skipped for them (the invitation gives the account its context). */
const INVITE_PREFIXES = ["/invitations/"];

/**
 * A `next` the signed-in role may follow, or null. Only same-origin paths
 * under /dashboard, an invitation page or /setup/, and for /dashboard only pages
 * the role can open. Everything else (other sites, `javascript:`, `//evil`)
 * is refused.
 */
export function safeNext(
  next: string | null | undefined,
  role: UserRole | null,
): string | null {
  const path = pathOf(next);
  if (!path || !next) return null;
  if (!NEXT_PREFIXES.some((p) => path === p || path.startsWith(p))) return null;
  if (path.startsWith("/dashboard") && (!role || !canAccessPath(role, path)))
    return null;
  /* Keep the query (e.g. a tab) but never the host. */
  const url = new URL(next, "http://same.invalid");
  return `${url.pathname}${url.search}`;
}

export type AfterSignIn =
  "/verify-email" | "/setup/mfa" | "/setup/patient" | (string & {});

/**
 * Where a fresh sign-in goes, in order: verify the email; staff and platform
 * without MFA to enrolment; an account with no context to patient setup
 * (unless it came to accept an invitation); else `next` or the role's home.
 */
export function routeAfterSignIn(
  context: MeContext,
  next?: string | null,
): AfterSignIn {
  const carry = next && pathOf(next) ? `?next=${encodeURIComponent(next)}` : "";
  if (!context.user.isAccountVerified) return `/verify-email${carry}`;
  const choice = defaultContext(context, next);
  if (
    context.user.mfaSetupRequired &&
    (isStaffChoice(choice) ||
      availableContexts(context).some((c) => isStaffChoice(c)))
  )
    return `/setup/mfa${carry}`;
  /* Several portals and no page that names one: the picker (D5). */
  if (needsPicker(context, next)) return `/select-portal${carry}`;
  if (choice.kind === "none") {
    const path = pathOf(next);
    const invited = path && INVITE_PREFIXES.some((p) => path.startsWith(p));
    return invited ? path : "/setup/patient";
  }
  if (choice.kind === "no-portal") return "/dashboard";
  const user = contextToUser(context, choice);
  const role = user?.role ?? null;
  return safeNext(next, role) ?? (role ? homeForRole(role) : "/dashboard");
}

/* ------------------------------------------------------------- session */

export function toCurrentSession(dto: CurrentSessionDto): CurrentSession {
  return {
    tier: dto.tier,
    idleTimeoutSeconds: dto.idleTimeoutSeconds,
    maxAgeSeconds: dto.maxAgeSeconds,
    idleExpiresAt: new Date(dto.idleExpiresAt),
    absoluteExpiresAt: new Date(dto.absoluteExpiresAt),
  };
}

/** The legacy local stores' scope for a user (lib/data/storage.ts). */
export function localScopeFor(
  user: AuthUser | null,
): { role: UserRole; email: string } | null {
  return user ? { role: user.role, email: user.email.toLowerCase() } : null;
}
