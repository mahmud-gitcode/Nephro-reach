import { afterEach, describe, expect, it } from "vitest";
import {
  effectivePermissions,
  portalPermissions,
  rolesForOrg,
  setCustomPermissionLookup,
  setCustomRolesLookup,
  userCan,
} from "./staff";
import {
  createRole,
  deleteRole,
  normaliseStore,
  roleNameError,
  setRolePermissions,
} from "./rolePermissions";

const rn = {
  role: "hospital" as const,
  staffRole: "Hospital RN" as const,
  org: "Riverside General Hospital",
};

afterEach(() => setCustomPermissionLookup(null));

describe("an organisation sets its own role permissions (2026-10-13)", () => {
  it("starts from the default", () => {
    expect(userCan(rn, "hospital.enroll")).toBe(true);
    expect(userCan(rn, "hospital.reports")).toBe(false);
  });

  it("follows what the main login turned on and off", () => {
    const map = setRolePermissions({}, "riverside-general", "Hospital RN", [
      "hospital.overview",
      "hospital.reports",
    ]);
    setCustomPermissionLookup((orgId, role) => map[orgId]?.permissions[role]);
    expect(userCan(rn, "hospital.enroll")).toBe(false);
    expect(userCan(rn, "hospital.reports")).toBe(true);
    expect(
      effectivePermissions("Hospital RN", "hospital", "riverside-general"),
    ).toEqual(["hospital.overview", "hospital.reports"]);
  });

  it("does not touch another organisation, and reset returns the default", () => {
    let map = setRolePermissions({}, "riverside-general", "Hospital RN", []);
    setCustomPermissionLookup((orgId, role) => map[orgId]?.permissions[role]);
    expect(userCan({ ...rn, org: "Another Hospital" }, "hospital.enroll")).toBe(
      true,
    );
    map = setRolePermissions(map, "riverside-general", "Hospital RN", null);
    expect(userCan(rn, "hospital.enroll")).toBe(true);
  });

  it("offers each portal only its own features", () => {
    const hospital = portalPermissions("hospital");
    expect(hospital).toContain("hospital.enroll");
    expect(hospital).not.toContain("ccm.log");
    expect(portalPermissions("clinic")).not.toContain("hospital.enroll");
  });
});

describe("roles an organisation creates (2026-10-13)", () => {
  it("creates, names and deletes its own roles", () => {
    let store = createRole({}, "riverside-general", "Charge Nurse", [
      "hospital.patients",
    ]);
    setCustomRolesLookup((orgId) => store[orgId]?.custom ?? []);
    setCustomPermissionLookup((orgId, role) => store[orgId]?.permissions[role]);
    expect(rolesForOrg("riverside-general")).toContain("Charge Nurse");
    expect(rolesForOrg("riverside")).not.toContain("Charge Nurse");
    expect(
      roleNameError(store, "riverside-general", "hospital", "charge nurse"),
    ).toBe("taken");
    expect(
      roleNameError(store, "riverside-general", "hospital", "Hospital RN"),
    ).toBe("taken");
    expect(roleNameError(store, "riverside-general", "hospital", " ")).toBe(
      "empty",
    );
    const nurse = {
      role: "hospital" as const,
      staffRole: "Charge Nurse" as never,
      org: "Riverside General Hospital",
    };
    expect(userCan(nurse, "hospital.patients")).toBe(true);
    expect(userCan(nurse, "hospital.enroll")).toBe(false);
    store = deleteRole(store, "riverside-general", "Charge Nurse");
    expect(rolesForOrg("riverside-general")).not.toContain("Charge Nurse");
    setCustomRolesLookup(null);
  });

  it("reads the first saved shape", () => {
    expect(
      normaliseStore({ x: { "Hospital RN": ["hospital.patients"] } }),
    ).toEqual({
      x: { permissions: { "Hospital RN": ["hospital.patients"] }, custom: [] },
    });
  });
});
