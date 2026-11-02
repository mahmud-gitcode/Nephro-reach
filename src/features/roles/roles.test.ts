import { describe, expect, it } from "vitest";
import type { PermissionContext } from "@/features/permissions/permissionMap";
import {
  assignableRoles,
  changedResources,
  permissionsBody,
  roleNameProblem,
  selectableLevels,
  withinReach,
} from "./roles";

/* The D4 editor mirrors the server's canGrant on the levels it sent, so it
   disables what would be refused (the server still decides and its refusal
   is shown). Synthetic maps only. */

const ctx = (
  permissions: Record<string, number>,
  isOwner = false,
): PermissionContext => ({ kind: "office", isOwner, permissions });

const manager = ctx({ staff: 3, roles: 3, patients: 2, prescriptions: 1 });

describe("selectableLevels", () => {
  it("never offers a level above the editor's own", () => {
    const options = selectableLevels(manager, "prescriptions", 0);
    expect(options.map((o) => o.disabled)).toEqual([false, false, true, true]);
  });

  it("locks a level the role holds above the editor (no lowering either)", () => {
    const options = selectableLevels(manager, "prescriptions", 3);
    /* Only the current level stays selectable. */
    expect(options.filter((o) => !o.disabled).map((o) => o.level)).toEqual([3]);
  });

  it("gives the owner every level", () => {
    const owner = ctx({ "*": 3 }, true);
    expect(
      selectableLevels(owner, "clinical_actions", 0).every((o) => !o.disabled),
    ).toBe(true);
  });
});

describe("withinReach (canGrant)", () => {
  it("refuses a change that raises or lowers above the editor's level", () => {
    expect(withinReach(manager, { patients: 1 }, { patients: 2 })).toBe(true);
    expect(withinReach(manager, { patients: 1 }, { patients: 3 })).toBe(false);
    expect(
      withinReach(manager, { prescriptions: 2 }, { prescriptions: 0 }),
    ).toBe(false);
    expect(withinReach(manager, {}, { clinical_actions: 2 })).toBe(false);
  });

  it("ignores unchanged resources the editor does not hold", () => {
    expect(
      withinReach(
        manager,
        { clinical_actions: 2 },
        { clinical_actions: 2, patients: 1 },
      ),
    ).toBe(true);
  });
});

describe("permissionsBody", () => {
  it("sends every listed resource explicitly and keeps unlisted keys", () => {
    const body = permissionsBody(
      ["patients", "labs"],
      { patients: 0, labs: 2 },
      { patients: 2, future_key: 1 },
    );
    expect(body).toEqual({ patients: 0, labs: 2, future_key: 1 });
    expect(changedResources({ patients: 2 }, { patients: 0, labs: 2 })).toEqual(
      ["labs", "patients"],
    );
  });
});

describe("assignableRoles", () => {
  it("hides the owner role and roles above the editor", () => {
    const roles: { name: string; permissions: Record<string, number> }[] = [
      { name: "Owner", permissions: { "*": 3 } },
      { name: "Front Desk", permissions: { patients: 2 } },
      {
        name: "Physician",
        permissions: { prescriptions: 3, clinical_actions: 2 },
      },
    ];
    expect(assignableRoles(manager, roles).map((r) => r.name)).toEqual([
      "Front Desk",
    ]);
  });
});

describe("roleNameProblem", () => {
  it("checks empty, length and a taken name (case-insensitive)", () => {
    expect(roleNameProblem("  ", [])).toBe("empty");
    expect(roleNameProblem("x".repeat(61), [])).toBe("long");
    expect(roleNameProblem("nurse", ["Nurse"])).toBe("taken");
    expect(roleNameProblem("Charge Nurse", ["Nurse"])).toBeNull();
  });
});
