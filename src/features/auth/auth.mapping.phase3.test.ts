import { describe, expect, it } from "vitest";
import {
  availableContexts,
  contextToUser,
  defaultContext,
  holdsChoice,
  needsPicker,
  portalChoices,
  reconcileChoice,
  routeAfterSignIn,
  type PortalChoice,
} from "./auth.mapping";
import type { ContextMembership, MeContext } from "./auth.types";

/* Phase 3 (D5): every context the account holds, the picker when more than
   one portal applies, and a context that is re-read against a fresh
   /me/context (a revoked grant or a removed membership is dropped, never
   kept from memory). Synthetic ids only. */

const office = (
  id: string,
  name: string,
  type: ContextMembership["organizationType"] = "DIALYSIS_CENTER",
  permissions: Record<string, number> = { patients: 1 },
): ContextMembership => ({
  organizationId: id,
  organizationName: name,
  organizationType: type,
  organizationStatus: "ACTIVE",
  role: "Office Manager",
  title: null,
  isOwner: false,
  permissions,
});

const grant = (grantId: string, patientId: string, first: string) => ({
  grantId,
  patientId,
  firstName: first,
  lastName: "Test",
  relationship: "Friend",
  preset: "full",
  permissions: { profile: 2 },
});

function ctx(over: Partial<MeContext> = {}): MeContext {
  return {
    user: {
      id: "u-1",
      name: "Pat Test",
      email: "pat@example.test",
      phone: null,
      avatarUrl: null,
      language: "EN",
      timeZone: null,
      isAccountVerified: true,
      mfaEnabled: true,
      mfaSetupRequired: false,
    },
    patient: null,
    caregiving: [],
    memberships: [],
    platform: null,
    ...over,
  };
}

const twoOffices = ctx({
  memberships: [
    office("org-r", "Riverside Test Dialysis"),
    office("org-m", "Metro Test Access", "ACCESS_CENTER"),
  ],
});

describe("contexts and the picker (D5)", () => {
  it("one portal never needs the picker", () => {
    expect(needsPicker(ctx({ memberships: [office("o", "One")] }), null)).toBe(
      false,
    );
    expect(
      needsPicker(
        ctx({ patient: { id: "p", firstName: "P", lastName: "T" } }),
        null,
      ),
    ).toBe(false);
  });

  it("several portals need the picker unless the page names exactly one", () => {
    expect(needsPicker(twoOffices, null)).toBe(true);
    expect(needsPicker(twoOffices, "/dashboard")).toBe(true);
    /* Only the dialysis portal opens clinic pages; only the access center
       opens its own. */
    expect(needsPicker(twoOffices, "/dashboard/clinic/team")).toBe(false);
    expect(needsPicker(twoOffices, "/dashboard/access-center/team")).toBe(
      false,
    );
    /* Two offices of the same type: a clinic page names neither. */
    const sameType = ctx({
      memberships: [office("a", "A Dialysis"), office("b", "B Dialysis")],
    });
    expect(needsPicker(sameType, "/dashboard/clinic/team")).toBe(true);
  });

  it("sends a multi-portal sign-in to the picker, carrying next", () => {
    expect(routeAfterSignIn(twoOffices, null)).toBe("/select-portal");
    expect(routeAfterSignIn(twoOffices, "/dashboard")).toBe(
      "/select-portal?next=%2Fdashboard",
    );
  });

  it("lists every caregiving patient in the picker, one caregiver entry for landing", () => {
    const c = ctx({
      caregiving: [grant("g-1", "p-1", "John"), grant("g-2", "p-2", "Grace")],
    });
    expect(availableContexts(c)).toEqual([
      { kind: "caregiver", grantId: null },
    ]);
    expect(portalChoices(c)).toEqual([
      { kind: "caregiver", grantId: "g-1" },
      { kind: "caregiver", grantId: "g-2" },
    ]);
    /* Several patients: none is picked for the caregiver on landing. */
    expect(defaultContext(c)).toEqual({ kind: "caregiver", grantId: null });
    expect(
      contextToUser(c, { kind: "caregiver", grantId: null })?.patientId,
    ).toBeUndefined();
    expect(
      contextToUser(c, { kind: "caregiver", grantId: "g-2" })?.patientId,
    ).toBe("p-2");
    /* One patient: that one. */
    const one = ctx({ caregiving: [grant("g-1", "p-1", "John")] });
    expect(defaultContext(one)).toEqual({ kind: "caregiver", grantId: "g-1" });
  });

  it("refuses a choice the account does not hold (a forged office or grant)", () => {
    const forged: PortalChoice = {
      kind: "office",
      membership: office("org-x", "Not Mine"),
    };
    expect(holdsChoice(twoOffices, forged)).toBe(false);
    expect(holdsChoice(twoOffices, { kind: "caregiver", grantId: "g-9" })).toBe(
      false,
    );
    expect(
      holdsChoice(twoOffices, {
        kind: "office",
        membership: twoOffices.memberships[1],
      }),
    ).toBe(true);
  });
});

describe("reconcileChoice (a re-read of /me/context)", () => {
  it("keeps an office with the server's new levels", () => {
    const before: PortalChoice = {
      kind: "office",
      membership: twoOffices.memberships[0],
    };
    const fresh = ctx({
      memberships: [
        office("org-r", "Riverside Test Dialysis", "DIALYSIS_CENTER", {
          patients: 0,
        }),
      ],
    });
    const kept = reconcileChoice(fresh, before);
    expect(
      kept && kept.kind === "office" ? kept.membership.permissions : null,
    ).toEqual({
      patients: 0,
    });
  });

  it("drops a revoked grant and a removed membership", () => {
    const c = ctx({ caregiving: [grant("g-2", "p-2", "Grace")] });
    expect(
      reconcileChoice(c, { kind: "caregiver", grantId: "g-1" }),
    ).toBeNull();
    expect(
      reconcileChoice(ctx(), {
        kind: "office",
        membership: twoOffices.memberships[0],
      }),
    ).toBeNull();
    expect(reconcileChoice(ctx(), { kind: "patient" })).toBeNull();
  });
});
