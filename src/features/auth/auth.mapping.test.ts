import { describe, expect, it } from "vitest";
import type { ContextMembership, MeContext } from "./auth.types";
import {
  contextToUser,
  defaultContext,
  localScopeFor,
  routeAfterSignIn,
  safeNext,
  toCurrentSession,
  toLoginBody,
  toRegisterBody,
} from "./auth.mapping";

/* Synthetic identities only. */
function membership(over: Partial<ContextMembership> = {}): ContextMembership {
  return {
    organizationId: "org-1",
    organizationName: "Riverside Dialysis Center",
    organizationType: "DIALYSIS_CENTER",
    organizationStatus: "ACTIVE",
    role: "Nurse",
    title: null,
    isOwner: false,
    permissions: {},
    ...over,
  };
}

function context(over: Partial<MeContext> = {}): MeContext {
  return {
    user: {
      id: "u-1",
      name: "Test Person",
      email: "Test.Person@example.test",
      phone: null,
      avatarUrl: null,
      language: "EN",
      timeZone: null,
      isAccountVerified: true,
      mfaEnabled: false,
      mfaSetupRequired: false,
      ...over.user,
    },
    patient: null,
    caregiving: [],
    memberships: [],
    platform: null,
    ...over,
    ...(over.user ? { user: { ...context().user, ...over.user } } : {}),
  };
}

const patient = { id: "p-1", firstName: "Test", lastName: "Person" };

describe("request bodies", () => {
  it("sends an identifier with @ as a lower-cased email, else as a phone", () => {
    expect(toLoginBody(" A@Example.TEST ", "pw")).toEqual({
      email: "a@example.test",
      password: "pw",
    });
    expect(toLoginBody("+1 555 0100", "pw")).toEqual({
      phone: "+1 555 0100",
      password: "pw",
    });
  });

  /* The API refuses unknown fields: without backend consent support the
     body must carry no consent key at all (D6 pending). */
  it("adds no consent field unless one is given", () => {
    const body = toRegisterBody({
      name: " Test ",
      email: "X@example.test",
      password: "pw",
    });
    expect(body).toEqual({
      name: "Test",
      email: "x@example.test",
      password: "pw",
    });
    expect("consent" in body).toBe(false);
  });
});

describe("defaultContext and contextToUser", () => {
  it("prefers platform, then offices, then patient, then caregiving", () => {
    const ctx = context({
      patient,
      memberships: [membership()],
      platform: membership({
        organizationType: "PLATFORM",
        organizationName: "Platform",
      }),
    });
    expect(defaultContext(ctx).kind).toBe("platform");
    expect(defaultContext({ ...ctx, platform: null }).kind).toBe("office");
    expect(
      defaultContext({ ...ctx, platform: null, memberships: [] }).kind,
    ).toBe("patient");
  });

  it("follows `next` to a context that may open it", () => {
    const ctx = context({ patient, memberships: [membership()] });
    expect(defaultContext(ctx, "/dashboard/personal-log").kind).toBe("patient");
  });

  it("ignores inactive organizations and portal-less types", () => {
    const ctx = context({
      memberships: [
        membership({ organizationStatus: "SUSPENDED" }),
        membership({ organizationType: "TRANSPLANT_CENTER" }),
      ],
    });
    expect(defaultContext(ctx).kind).toBe("no-portal");
    expect(defaultContext(context()).kind).toBe("none");
  });

  /* The client matrix has no "Owner" row: a role name on the owner would
     lock them out of every page. */
  it("gives the owner no staff role and keeps isOwner", () => {
    const ctx = context({ memberships: [membership({ isOwner: true })] });
    const user = contextToUser(ctx, defaultContext(ctx));
    expect(user).toMatchObject({
      role: "clinic",
      isOwner: true,
      organizationId: "org-1",
    });
    expect(user?.staffRole).toBeUndefined();
  });

  it("maps a staff member, a patient and a caregiver", () => {
    const staff = context({ memberships: [membership()] });
    expect(contextToUser(staff, defaultContext(staff))).toMatchObject({
      role: "clinic",
      staffRole: "Nurse",
      isOwner: false,
    });
    const member = context({ patient });
    expect(contextToUser(member, defaultContext(member))).toMatchObject({
      role: "user",
      patientId: "p-1",
    });
    const carer = context({
      caregiving: [
        {
          grantId: "g-1",
          patientId: "p-2",
          firstName: "A",
          lastName: "B",
          relationship: "Spouse",
          preset: "FULL",
          permissions: {},
        },
      ],
    });
    expect(contextToUser(carer, defaultContext(carer))).toMatchObject({
      role: "caregiver",
      patientId: "p-2",
      caregivingGrantId: "g-1",
    });
  });

  it("scopes legacy stores by role and lower-cased email", () => {
    const member = context({ patient });
    expect(
      localScopeFor(contextToUser(member, defaultContext(member))),
    ).toEqual({ role: "user", email: "test.person@example.test" });
    expect(localScopeFor(null)).toBeNull();
  });
});

describe("safeNext (open redirect)", () => {
  it.each([
    "https://evil.example/dashboard",
    "//evil.example/dashboard",
    "/\\evil.example",
    "javascript:alert(1)",
    "/dashboard\u0000",
    "/elsewhere",
  ])("refuses %s", (next) => {
    expect(safeNext(next, "user")).toBeNull();
  });

  it("keeps a same-origin page the role may open, with its query", () => {
    expect(safeNext("/dashboard/personal-log?tab=2", "user")).toBe(
      "/dashboard/personal-log?tab=2",
    );
  });

  it("refuses a portal page the role may not open", () => {
    expect(safeNext("/dashboard/clinic", "user")).toBeNull();
  });
});

describe("routeAfterSignIn", () => {
  it("sends an unverified account to verify its email first", () => {
    const ctx = context({
      patient,
      user: { ...context().user, isAccountVerified: false },
    });
    expect(routeAfterSignIn(ctx)).toBe("/verify-email");
  });

  /* D17: staff without MFA must enrol before any portal page. */
  it("sends staff with mfaSetupRequired to enrolment, keeping next", () => {
    const ctx = context({
      memberships: [membership()],
      user: { ...context().user, mfaSetupRequired: true },
    });
    expect(routeAfterSignIn(ctx, "/dashboard/clinic")).toBe(
      "/setup/mfa?next=%2Fdashboard%2Fclinic",
    );
  });

  it("does not force enrolment on a patient", () => {
    const ctx = context({
      patient,
      user: { ...context().user, mfaSetupRequired: true },
    });
    expect(routeAfterSignIn(ctx)).toBe("/dashboard");
  });

  it("sends an account with no context to patient setup, unless invited", () => {
    expect(routeAfterSignIn(context())).toBe("/setup/patient");
    expect(routeAfterSignIn(context(), "/invitations/abc")).toBe(
      "/invitations/abc",
    );
  });

  it("lands each role on its home or a safe next", () => {
    expect(routeAfterSignIn(context({ memberships: [membership()] }))).toBe(
      "/dashboard/clinic",
    );
    expect(routeAfterSignIn(context({ patient }), "https://evil.example")).toBe(
      "/dashboard",
    );
  });
});

describe("toCurrentSession", () => {
  it("turns the deadlines into dates", () => {
    const s = toCurrentSession({
      tier: "staff",
      idleTimeoutSeconds: 900,
      maxAgeSeconds: 28800,
      idleExpiresAt: "2026-11-02T10:15:00.000Z",
      absoluteExpiresAt: "2026-11-02T18:00:00.000Z",
    });
    expect(s.idleExpiresAt.toISOString()).toBe("2026-11-02T10:15:00.000Z");
    expect(s.tier).toBe("staff");
  });
});
