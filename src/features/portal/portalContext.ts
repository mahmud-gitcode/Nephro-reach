/* ==========================================================================
   Portal contexts (Phase 3, D5): what the picker and the switch bar show
   --------------------------------------------------------------------------
   An account may hold several portals: the platform team, one or more
   offices, its own patient record, and patients it cares for. Each is
   isolated: entering one goes through AuthContext.enterContext, which sends
   the office header only in office mode and clears every cached query.
   These functions only describe the choices; they decide nothing.
   ========================================================================== */

import { homeForRole } from "@/features/auth/auth";
import {
  contextToUser,
  portalChoices,
  safeNext,
  type PortalChoice,
} from "@/features/auth/auth.mapping";
import type { MeContext } from "@/features/auth/auth.types";

export type PortalLabel = {
  key: string;
  /** The main line: an office name, "My health", "Caring for John Taylor". */
  title: string;
  /** The second line: the role (and title) or the relationship. */
  detail: string;
  /** Read-only banner text when the organisation is suspended. */
  suspended: boolean;
};

type T = (path: string, vars?: Record<string, string>) => string;

function personName(first: string, last: string): string {
  return `${first} ${last}`.trim();
}

/** Display text for one choice. */
export function labelFor(
  context: MeContext,
  choice: PortalChoice,
  t: T,
): PortalLabel {
  switch (choice.kind) {
    case "platform":
    case "office": {
      const m = choice.membership;
      const type = t(`orgTypes.${m.organizationType}`);
      const role = m.isOwner
        ? t("owner")
        : m.title
          ? `${m.role}, ${m.title}`
          : m.role;
      return {
        key: `${choice.kind}:${m.organizationId}`,
        title: choice.kind === "platform" ? t("platform") : m.organizationName,
        detail: `${type} · ${role}`,
        suspended: m.organizationStatus === "SUSPENDED",
      };
    }
    case "patient":
      return {
        key: "patient",
        title: t("patient"),
        detail: t("patientDetail"),
        suspended: false,
      };
    case "caregiver": {
      const grant = context.caregiving.find(
        (g) => g.grantId === choice.grantId,
      );
      const name = grant ? personName(grant.firstName, grant.lastName) : "";
      return {
        key: `caregiver:${choice.grantId ?? "none"}`,
        title: t("caregiver", { name }),
        detail: t("caregiverDetail", {
          relationship: grant?.relationship ?? "",
        }),
        suspended: false,
      };
    }
    default:
      return { key: choice.kind, title: "", detail: "", suspended: false };
  }
}

/** The choices the picker lists, each with its label. */
export function pickerEntries(context: MeContext, t: T) {
  return portalChoices(context).map((choice) => ({
    choice,
    label: labelFor(context, choice, t),
  }));
}

/** Where to go after entering a choice: `next` when that portal may open
 *  it, else the portal's home. */
export function destinationFor(
  context: MeContext,
  choice: PortalChoice,
  next: string | null,
): string {
  const user = contextToUser(context, choice);
  if (!user) return "/dashboard";
  return safeNext(next, user.role) ?? homeForRole(user.role);
}
