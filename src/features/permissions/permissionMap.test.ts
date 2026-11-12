import { describe, expect, it } from "vitest";
import {
  PERMISSIONS,
  userCan,
  permissionContextOf,
} from "@/features/staff/staff";
import {
  REQUIREMENTS,
  canLevel,
  canWith,
  editorResources,
  levelOf,
  type PermissionContext,
} from "./permissionMap";

/* Phase 3 (D4): page permissions come from the server's membership levels
   through one fixed table. The bug this replaces: the prototype's userCan
   returned true for anyone without a staff role, and read an organisation's
   own role matrix from localStorage (`nr:role-permissions`), which any user
   of the browser could edit. Synthetic contexts only. */

const office = (
  permissions: Record<string, number>,
  isOwner = false,
): PermissionContext => ({ kind: "office", isOwner, permissions });

/* The seeded built-in defaults (final-matrix.md §3), as /me/context sends
   them: only levels >= 1 are listed. */
const DIALYSIS = {
  socialWorker: office({
    patients: 2,
    messages: 2,
    vascular_access: 1,
    travel: 2,
    transport: 2,
  }),
  nurse: office({
    messages: 2,
    team_messages: 2,
    labs: 1,
    referrals: 2,
    vascular_access: 2,
    check_ins: 1,
    prescriptions: 2,
    clinical_actions: 2,
  }),
  officeManager: office({
    settings: 2,
    staff: 3,
    roles: 1,
    patients: 2,
    labs: 1,
    referrals: 1,
    vascular_access: 1,
    check_ins: 1,
    travel: 1,
    programs: 1,
    reports: 1,
    billing: 1,
    prescriptions: 1,
  }),
  owner: office({ "*": 3 }, true),
};

describe("the fixed table", () => {
  it("has a row for every page permission id the menus use", () => {
    const ids = PERMISSIONS.map((p) => p.id).sort();
    expect(Object.keys(REQUIREMENTS).sort()).toEqual(ids);
  });

  it("fails closed: no context, unknown id, patient or caregiver", () => {
    expect(canWith(null, "dashboard.view")).toBe(false);
    expect(canWith(DIALYSIS.owner, "not.an.id")).toBe(false);
    expect(
      userCan({ role: "user", patientId: "p-1" } as never, "dashboard.view"),
    ).toBe(false);
    expect(userCan({ role: "caregiver" } as never, "messages.view")).toBe(
      false,
    );
    /* A staff role with no organisation id (never sent by the server). */
    expect(userCan({ role: "clinic" }, "dashboard.view")).toBe(false);
    expect(userCan(null, "dashboard.view")).toBe(false);
  });

  it("gives the owner every office page, but no platform page", () => {
    for (const p of PERMISSIONS) {
      const id = p.id;
      const expected = REQUIREMENTS[id].kind !== "platform";
      expect(canWith(DIALYSIS.owner, id), id).toBe(expected);
    }
  });

  it("follows each level boundary (None/View/Edit/Manage)", () => {
    for (const level of [0, 1, 2, 3]) {
      const ctx = office({ travel: level });
      expect(canWith(ctx, "travel.view")).toBe(level >= 1);
      expect(canWith(ctx, "travel.manage")).toBe(level >= 2);
    }
    expect(canWith(office({ labs: 2 }), "labs.upload")).toBe(false);
    expect(canWith(office({ labs: 3 }), "labs.upload")).toBe(true);
  });

  it("needs every check of an alternative (all-of)", () => {
    expect(
      canWith(office({ vascular_access: 3 }), "access.coordination.status"),
    ).toBe(false);
    expect(
      canWith(
        office({ vascular_access: 3, clinical_actions: 2 }),
        "access.coordination.status",
      ),
    ).toBe(true);
  });

  it("puts rides on the D4 transport resource, not vascular access (PM-2)", () => {
    expect(canWith(DIALYSIS.nurse, "rides.manage")).toBe(false);
    expect(canWith(DIALYSIS.socialWorker, "rides.manage")).toBe(true);
  });

  it("matches the server's defaults for four seeded roles (final-matrix.md)", () => {
    /* Social Worker: patients 2, messages 2, travel 2. */
    expect(canWith(DIALYSIS.socialWorker, "dashboard.view")).toBe(true);
    expect(canWith(DIALYSIS.socialWorker, "patients.enroll")).toBe(true);
    expect(canWith(DIALYSIS.socialWorker, "labs.view")).toBe(false);
    expect(canWith(DIALYSIS.socialWorker, "staff.manage")).toBe(false);
    expect(canWith(DIALYSIS.socialWorker, "settings.manage")).toBe(false);
    /* Nurse: no patients, labs view, team messages. */
    expect(canWith(DIALYSIS.nurse, "dashboard.view")).toBe(false);
    expect(canWith(DIALYSIS.nurse, "labs.view")).toBe(true);
    expect(canWith(DIALYSIS.nurse, "messages.team")).toBe(true);
    expect(canWith(DIALYSIS.nurse, "billing.view")).toBe(false);
    /* Office Manager: staff Manage, roles View, settings Edit. */
    expect(canWith(DIALYSIS.officeManager, "staff.manage")).toBe(true);
    expect(canWith(DIALYSIS.officeManager, "settings.manage")).toBe(true);
    expect(canWith(DIALYSIS.officeManager, "messages.view")).toBe(false);
    expect(canWith(DIALYSIS.officeManager, "account.manage")).toBe(false);
    /* Owner: everything of the office, including the owner-only pages. */
    expect(canWith(DIALYSIS.owner, "account.manage")).toBe(true);
    expect(canWith(DIALYSIS.owner, "staff.manage")).toBe(true);
  });

  it("enrolls in a program only with patients edit AND programs edit (P16F-1, spec 067)", () => {
    /* The seeded dialysis Office Manager may put a patient on the roster
       but not in a program: the server refuses the one-call enrollment. */
    expect(canWith(DIALYSIS.officeManager, "patients.enroll")).toBe(true);
    expect(canWith(DIALYSIS.officeManager, "programs.enroll")).toBe(false);
    expect(canWith(DIALYSIS.socialWorker, "programs.enroll")).toBe(false);
    expect(canWith(DIALYSIS.owner, "programs.enroll")).toBe(true);
    expect(
      canWith(office({ patients: 2, programs: 2 }), "programs.enroll"),
    ).toBe(true);
    expect(
      canWith(office({ patients: 1, programs: 3 }), "programs.enroll"),
    ).toBe(false);
  });

  it("keeps platform pages to platform contexts", () => {
    const content: PermissionContext = {
      kind: "platform",
      isOwner: false,
      permissions: { content: 2 },
    };
    expect(canWith(content, "admin.content")).toBe(true);
    expect(canWith(content, "admin.reviews")).toBe(false);
    /* An office role holding the same key opens no platform page. */
    expect(canWith(office({ content: 3 }), "admin.content")).toBe(false);
  });

  it("reads Manage for the owner and the '*' key, and clamps junk", () => {
    expect(levelOf(DIALYSIS.owner, "prescriptions")).toBe(3);
    expect(levelOf(office({ "*": 3 }), "labs")).toBe(3);
    expect(levelOf(office({ labs: 7 }), "labs")).toBe(3);
    expect(levelOf(office({ labs: -1 }), "labs")).toBe(0);
    expect(levelOf(office({ labs: 1.5 }), "labs")).toBe(0);
    expect(canLevel(office({ labs: 2 }), "labs", 0)).toBe(false);
  });
});

describe("permissionContextOf (AuthUser → levels)", () => {
  it("reads the active membership only in office or platform mode", () => {
    expect(
      permissionContextOf({
        role: "clinic",
        organizationId: "org-1",
        isOwner: false,
        orgPermissions: { labs: 1 },
      }),
    ).toEqual({ kind: "office", isOwner: false, permissions: { labs: 1 } });
    expect(
      permissionContextOf({
        role: "admin",
        organizationId: "plat",
        isOwner: true,
        orgPermissions: { "*": 3 },
      })?.kind,
    ).toBe("platform");
    expect(permissionContextOf({ role: "user" })).toBeNull();
    expect(permissionContextOf({ role: "caregiver" })).toBeNull();
  });
});

describe("editorResources", () => {
  it("lists the office resources, including the D4 ones, and keeps unknown server keys", () => {
    const list = editorResources("office", ["patients", "future_key", "*"]);
    for (const key of [
      "prescriptions",
      "clinical_actions",
      "transport",
      "staff",
      "roles",
    ])
      expect(list).toContain(key);
    expect(list).toContain("future_key");
    expect(list).not.toContain("*");
    expect(list).not.toContain("organizations");
  });

  it("lists platform resources without office-only ones", () => {
    const list = editorResources("platform");
    expect(list).toContain("content");
    expect(list).not.toContain("prescriptions");
  });
});
