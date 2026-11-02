import { afterEach, describe, expect, it } from "vitest";
import { canAccessPath } from "@/features/auth/auth";
import { contextToUser, defaultContext } from "@/features/auth/auth.mapping";
import type {
  ContextMembership,
  MeContext,
  OrganizationType,
} from "@/features/auth/auth.types";
import {
  ALL,
  addStaff,
  filterStaff,
  organizationFor,
  roleCan,
  rolesFor,
  portalRole,
  sampleStaffRoster,
  staffError,
  updateStaff,
  userCan,
  type StaffDraft,
} from "./staff";
import { listStaff, saveStaff, STAFF_KEY } from "./staff.repository";

const NOW = new Date(2026, 8, 30, 10).getTime();
const seed = sampleStaffRoster(NOW);

const draft: StaffDraft = {
  name: "Ana Ruiz, RN",
  email: " Ana.Ruiz@Riverside.org ",
  orgId: "riverside",
  role: "Nurse",
  password: "RiverMaple123",
};

describe("roles", () => {
  it("the dialysis center follows the client's list (2026-10-01)", () => {
    /* Social worker: travel, rides, messages, enrolling, the dashboard. */
    expect(roleCan("Social Worker", "rides.manage")).toBe(true);
    expect(roleCan("Social Worker", "travel.manage")).toBe(true);
    expect(roleCan("Social Worker", "dashboard.view")).toBe(true);
    expect(roleCan("Social Worker", "access.view")).toBe(false);
    /* Administrator: the same plus vascular access and lab uploads, but no
       reports or billing. */
    expect(roleCan("Administrator", "access.view")).toBe(true);
    expect(roleCan("Administrator", "labs.upload")).toBe(true);
    expect(roleCan("Administrator", "billing.view")).toBe(false);
    expect(roleCan("Administrator", "reports.view")).toBe(false);
    /* Dietitian: messages and labs only. */
    expect(roleCan("Dietitian", "labs.view")).toBe(true);
    expect(roleCan("Dietitian", "dashboard.view")).toBe(false);
    /* Nurse: messages, vascular access, check-ins, labs. */
    expect(roleCan("Nurse", "checkins.view")).toBe(true);
    expect(roleCan("Nurse", "rides.manage")).toBe(false);
    /* Office manager: the whole panel, reports and billing, no messages. */
    expect(roleCan("Office Manager", "billing.view")).toBe(true);
    expect(roleCan("Office Manager", "reports.view")).toBe(true);
    expect(roleCan("Office Manager", "programs.view")).toBe(true);
    expect(roleCan("Office Manager", "messages.view")).toBe(false);
  });

  it("the other offices keep the general matrix", () => {
    expect(roleCan("Administrator", "billing.view", "access")).toBe(true);
    expect(roleCan("Physician", "ccm.log", "nephrology")).toBe(true);
    expect(roleCan("Front Desk", "messages.reply", "access")).toBe(false);
  });

  it("an organisation login is its owner; members are not governed", () => {
    expect(userCan({ role: "clinic" }, "billing.view")).toBe(true);
    expect(
      userCan({ role: "clinic", staffRole: "Nurse" }, "billing.view"),
    ).toBe(false);
    expect(userCan({ role: "user" }, "billing.view")).toBe(true);
    expect(userCan(null, "billing.view")).toBe(false);
  });
});

describe("whose staff", () => {
  it("each organisation manages its own; only its managers may", () => {
    expect(organizationFor({ role: "clinic" })?.id).toBe("riverside");
    expect(organizationFor({ role: "access" })?.id).toBe("metro-access");
    expect(
      organizationFor({ role: "clinic", org: "Riverside Dialysis Center" })?.id,
    ).toBe("riverside");
    /* NephroReach's own team (client, 2026-10-12): the admin owns it. */
    expect(organizationFor({ role: "admin" })?.id).toBe("nephroreach");
    expect(roleCan("Administrative Support", "admin.support", "admin")).toBe(
      true,
    );
    expect(roleCan("Content Manager", "admin.support", "admin")).toBe(false);
    expect(roleCan("Office Manager", "staff.manage")).toBe(true);
    expect(roleCan("Administrator", "staff.manage", "access")).toBe(true);
    expect(roleCan("Nurse", "staff.manage")).toBe(false);
  });
});

describe("accounts", () => {
  it("adds a staff member, with a normalised email", () => {
    const next = addStaff(seed, draft, NOW);
    expect(next.at(-1)).toMatchObject({
      email: "ana.ruiz@riverside.org",
      status: "Active",
      role: "Nurse",
    });
  });

  it("refuses a taken email, a short password, or a missing name", () => {
    expect(staffError(draft, ["ana.ruiz@riverside.org"])).toBe("email-taken");
    expect(staffError({ ...draft, password: "short" }, [])).toBe("password");
    expect(staffError({ ...draft, name: " " }, [])).toBe("name");
    expect(staffError({ ...draft, orgId: "nowhere" }, [])).toBe("organization");
    expect(staffError(draft, [])).toBeNull();
  });

  /* Phase 2: the roster is display data. Sign-in is the API's, and no
     password is kept in this browser. */
  it("keeps no password, even when the form or an old list has one", async () => {
    expect(JSON.stringify(seed)).not.toContain("password");
    const added = addStaff(seed, draft, NOW);
    expect(added.at(-1)).not.toHaveProperty("password");
    const edited = updateStaff(added, added[0].id, { password: "NewPass123" });
    expect(edited[0]).not.toHaveProperty("password");
    await saveStaff([
      { ...seed[0], password: "old-demo" } as (typeof seed)[number],
    ]);
    expect(window.localStorage.getItem(STAFF_KEY)).not.toContain("password");
    window.localStorage.setItem(
      STAFF_KEY,
      JSON.stringify([{ ...seed[0], password: "old-demo" }]),
    );
    const listed = await listStaff();
    expect(JSON.stringify(listed)).not.toContain("old-demo");
    expect(window.localStorage.getItem(STAFF_KEY)).not.toContain("old-demo");
    window.localStorage.removeItem(STAFF_KEY);
  });

  it("filters by organisation and lists active people first", () => {
    const off = updateStaff(seed, seed[1].id, { status: "Deactivated" });
    const rows = filterStaff(off, {
      query: "",
      orgId: "riverside",
      role: ALL,
    });
    expect(rows.every((r) => r.orgId === "riverside")).toBe(true);
    expect(rows.at(-1)?.status).toBe("Deactivated");
  });
});

/* Staff sign in through the API (Phase 2). Their portal comes from their
   membership in GET /me/context; these pin that mapping and the pages each
   portal may open. */
function staffContext(
  type: OrganizationType,
  organizationName: string,
  role: string,
  isOwner = false,
): MeContext {
  const membership: ContextMembership = {
    organizationId: `org-${type}`,
    organizationName,
    organizationType: type,
    organizationStatus: "ACTIVE",
    role,
    title: null,
    isOwner,
    permissions: {},
  };
  return {
    user: {
      id: "u1",
      name: "Linda Moore, LMSW",
      email: "socialworker@nephroreach.com",
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
    memberships: [membership],
    platform: null,
  };
}

const staffUser = (context: MeContext) =>
  contextToUser(context, defaultContext(context))!;

describe("signing in as staff", () => {
  afterEach(() => window.localStorage.removeItem(STAFF_KEY));

  it("lands in the organisation's portal, as that person with that role", () => {
    const user = staffUser(
      staffContext(
        "DIALYSIS_CENTER",
        "Riverside Dialysis Center",
        "Social Worker",
      ),
    );
    expect(user).toMatchObject({
      name: "Linda Moore, LMSW",
      role: "clinic",
      org: "Riverside Dialysis Center",
      staffRole: "Social Worker",
    });
    expect(canAccessPath(user.role, "/dashboard/clinic/vascular-access")).toBe(
      true,
    );
    expect(organizationFor(user)?.id).toBe("riverside");
  });

  it("an access-center person signs into the access portal only", () => {
    const user = staffUser(
      staffContext(
        "ACCESS_CENTER",
        "Metro Vascular Access Center",
        "Physician / APP",
      ),
    );
    expect(user.role).toBe("access");
    expect(canAccessPath("access", "/dashboard/access-center")).toBe(true);
    expect(canAccessPath("access", "/dashboard/clinic")).toBe(false);
  });

  it("a nephrology office has its own portal, and nothing else", () => {
    const user = staffUser(
      staffContext(
        "NEPHROLOGY_OFFICE",
        "Riverside Nephrology Associates",
        "Physician",
      ),
    );
    expect(user).toMatchObject({
      role: "nephrology",
      org: "Riverside Nephrology Associates",
      staffRole: "Physician",
    });
    expect(canAccessPath("nephrology", "/dashboard/nephrology")).toBe(true);
    expect(canAccessPath("nephrology", "/dashboard/nephrology/messages")).toBe(
      true,
    );
    /* Everything the clinic has, except travel and the dialysis center's
       own inbox, settings and staff (client, 2026-10-05). */
    expect(canAccessPath("nephrology", "/dashboard/clinic")).toBe(true);
    expect(canAccessPath("nephrology", "/dashboard/clinic/billing")).toBe(true);
    expect(
      canAccessPath("nephrology", "/dashboard/clinic/vascular-access"),
    ).toBe(true);
    expect(canAccessPath("nephrology", "/dashboard/clinic/travel")).toBe(false);
    expect(canAccessPath("nephrology", "/dashboard/clinic/messages")).toBe(
      false,
    );
    expect(canAccessPath("nephrology", "/dashboard/clinic/team")).toBe(false);
    expect(canAccessPath("nephrology", "/dashboard/access-center")).toBe(false);
    expect(canAccessPath("nephrology", "/dashboard")).toBe(false);
    expect(canAccessPath("clinic", "/dashboard/nephrology")).toBe(false);
    expect(canAccessPath("access", "/dashboard/nephrology")).toBe(false);
    expect(canAccessPath("user", "/dashboard/nephrology")).toBe(false);
  });

  /* The owner's membership role is "Owner", which the client matrix does
     not know: mapping it to a staff role would lock the owner out of every
     page (Phase 2 bridge until Phase 3 reads membership permissions). */
  it("an organisation's owner keeps every page", () => {
    const owner = staffUser(
      staffContext(
        "DIALYSIS_CENTER",
        "Riverside Dialysis Center",
        "Owner",
        true,
      ),
    );
    expect(owner.staffRole).toBeUndefined();
    expect(owner.isOwner).toBe(true);
    expect(userCan(owner, "staff.manage")).toBe(true);
    expect(userCan(owner, "settings.manage")).toBe(true);
  });

  it("a custom role the client does not know gets nothing here (the server decides)", () => {
    const user = staffUser(
      staffContext(
        "DIALYSIS_CENTER",
        "Riverside Dialysis Center",
        "Night Desk",
      ),
    );
    expect(userCan(user, "staff.manage")).toBe(false);
  });
});

describe("the Vascular Access Center's own roles (client, 2026-10-06)", () => {
  it("offers its own eight roles, not the practice roles", () => {
    expect(rolesFor("access")).toEqual([
      "Access Center Administrator",
      "Office Manager",
      "Physician / APP",
      "Nurse",
      "Access Coordinator",
      "Medical Assistant",
      "Scheduler / Front Desk",
      "Billing / Administrative Staff",
    ]);
    expect(rolesFor("clinic")).not.toContain("Access Coordinator");
  });

  it("follows the client's table", () => {
    expect(
      roleCan("Access Center Administrator", "billing.view", "access"),
    ).toBe(true);
    expect(roleCan("Office Manager", "billing.view", "access")).toBe(false);
    expect(
      roleCan("Physician / APP", "access.referrals.assigned", "access"),
    ).toBe(true);
    expect(roleCan("Physician / APP", "access.referrals", "access")).toBe(
      false,
    );
    expect(roleCan("Access Coordinator", "access.tracking", "access")).toBe(
      true,
    );
    expect(roleCan("Scheduler / Front Desk", "access.photos", "access")).toBe(
      false,
    );
    expect(
      roleCan(
        "Scheduler / Front Desk",
        "access.appointments.confirm",
        "access",
      ),
    ).toBe(true);
    /* Billing staff: no clinical or access-photo access by default. */
    expect(
      roleCan("Billing / Administrative Staff", "access.photos", "access"),
    ).toBe(false);
    expect(
      roleCan("Billing / Administrative Staff", "access.workspace", "access"),
    ).toBe(false);
    expect(
      roleCan("Billing / Administrative Staff", "billing.view", "access"),
    ).toBe(true);
  });

  it("gives no access role CCM time", () => {
    for (const role of rolesFor("access")) {
      expect(roleCan(role, "ccm.log", "access")).toBe(false);
    }
  });

  it("reads an old access role as the nearest new one", () => {
    expect(portalRole("Physician", "access")).toBe("Physician / APP");
    expect(portalRole("Front Desk", "access")).toBe("Scheduler / Front Desk");
    expect(roleCan("Physician", "access.photos", "access")).toBe(true);
  });

  it("lets billing staff reach reports and billing, not the workspace", () => {
    expect(canAccessPath("access", "/dashboard/clinic/billing")).toBe(true);
    expect(canAccessPath("access", "/dashboard/clinic/reports")).toBe(false);
    expect(canAccessPath("access", "/dashboard/clinic")).toBe(false);
  });
});
