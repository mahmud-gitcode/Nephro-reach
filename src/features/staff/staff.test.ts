import { afterEach, describe, expect, it } from "vitest";
import { authenticate, canAccessPath } from "@/features/auth/auth";
import {
  ALL,
  DEMO_STAFF_PASSWORD,
  addStaff,
  filterStaff,
  findLogin,
  organizationFor,
  roleCan,
  seedStaff,
  staffError,
  updateStaff,
  userCan,
  type StaffDraft,
} from "./staff";
import { STAFF_KEY } from "./staff.repository";

const NOW = new Date(2026, 8, 30, 10).getTime();
const seed = seedStaff(NOW);

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
    expect(organizationFor({ role: "admin" })).toBeUndefined();
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

  it("a deactivated account cannot sign in", () => {
    const email = seed[0].email;
    expect(findLogin(seed, email, DEMO_STAFF_PASSWORD)).not.toBeNull();
    const off = updateStaff(seed, seed[0].id, { status: "Deactivated" });
    expect(findLogin(off, email, DEMO_STAFF_PASSWORD)).toBeNull();
    expect(findLogin(seed, email, "wrong")).toBeNull();
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

describe("signing in as staff", () => {
  afterEach(() => window.localStorage.removeItem(STAFF_KEY));

  it("lands in the organisation's portal, as that person with that role", () => {
    const user = authenticate(
      "socialworker@nephroreach.com",
      DEMO_STAFF_PASSWORD,
    );
    expect(user).toMatchObject({
      name: "Linda Moore, LMSW",
      role: "clinic",
      org: "Riverside Dialysis Center",
      staffRole: "Social Worker",
    });
    expect(canAccessPath(user!.role, "/dashboard/clinic/vascular-access")).toBe(
      true,
    );
  });

  it("an access-center person signs into the access portal only", () => {
    const user = authenticate("surgeon@nephroreach.com", DEMO_STAFF_PASSWORD);
    expect(user?.role).toBe("access");
    expect(canAccessPath("access", "/dashboard/access-center")).toBe(true);
    expect(canAccessPath("access", "/dashboard/clinic")).toBe(false);
  });

  it("a nephrology office has its own login and portal, and nothing else", () => {
    expect(
      authenticate("nephrology@nephroreach.com", "nephrology123"),
    ).toMatchObject({ role: "nephrology" });
    const user = authenticate(
      "nephrologist@nephroreach.com",
      DEMO_STAFF_PASSWORD,
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
    expect(canAccessPath("nephrology", "/dashboard/clinic")).toBe(false);
    expect(canAccessPath("nephrology", "/dashboard/access-center")).toBe(false);
    expect(canAccessPath("nephrology", "/dashboard")).toBe(false);
    expect(canAccessPath("clinic", "/dashboard/nephrology")).toBe(false);
    expect(canAccessPath("access", "/dashboard/nephrology")).toBe(false);
    expect(canAccessPath("user", "/dashboard/nephrology")).toBe(false);
  });

  it("a list saved before the nephrology office existed still lets its staff in", () => {
    const old = seed.filter((a) => a.orgId !== "riverside-nephrology");
    window.localStorage.setItem(STAFF_KEY, JSON.stringify(old));
    expect(authenticate("ccm@nephroreach.com", DEMO_STAFF_PASSWORD)?.role).toBe(
      "nephrology",
    );
  });

  it("uses the accounts the admin saved, including a deactivation", () => {
    const off = updateStaff(seed, seed[0].id, { status: "Deactivated" });
    window.localStorage.setItem(STAFF_KEY, JSON.stringify(off));
    expect(
      authenticate("socialworker@nephroreach.com", DEMO_STAFF_PASSWORD),
    ).toBeNull();
  });
});
