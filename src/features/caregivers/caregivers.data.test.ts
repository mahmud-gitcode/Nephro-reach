import { describe, expect, it } from "vitest";
import {
  DEFAULT_PERMISSIONS,
  accept,
  activeGrant,
  can,
  grantsForCaregiver,
  grantsForPatient,
  invite,
  inviteError,
  remove,
  setPermission,
  type CaregiverState,
  type InviteDraft,
} from "./caregivers.data";

const patient = { email: "John@Example.com", name: "John" };
const draft: InviteDraft = {
  caregiverName: "Sarah",
  caregiverEmail: "Sarah@Example.com ",
  relationship: "Daughter",
  permissions: [...DEFAULT_PERMISSIONS],
};
const empty: CaregiverState = { grants: [] };

describe("caregivers", () => {
  it("starts pending, with the journal off", () => {
    const { state, grant } = invite(empty, patient, draft, 1000);
    expect(grant.status).toBe("pending");
    expect(grant.caregiverEmail).toBe("sarah@example.com");
    expect(grant.permissions).not.toContain("journal");
    expect(can(grant, "medications")).toBe(false);
    expect(grantsForPatient(state, "john@example.com")).toHaveLength(1);
  });

  it("grants access only once accepted", () => {
    const { state, grant } = invite(empty, patient, draft, 1000);
    const next = accept(state, grant.id, 2000);
    const active = activeGrant(next, "sarah@example.com", "john@example.com");
    expect(active?.status).toBe("active");
    expect(can(active, "medications")).toBe(true);
    expect(can(active, "journal")).toBe(false);
  });

  it("lets the patient turn a permission off, and records it", () => {
    const { state, grant } = invite(empty, patient, draft, 1000);
    const next = setPermission(
      accept(state, grant.id, 2),
      grant.id,
      "labs",
      false,
      3,
    );
    const g = next.grants[0];
    expect(can(g, "labs")).toBe(false);
    expect(g.activity[0].action).toBe("Lab results turned off");
  });

  it("ends access when removed", () => {
    const { state, grant } = invite(empty, patient, draft, 1000);
    const next = remove(accept(state, grant.id, 2), grant.id, 3);
    expect(
      activeGrant(next, "sarah@example.com", "john@example.com"),
    ).toBeUndefined();
    expect(grantsForCaregiver(next, "sarah@example.com")).toHaveLength(0);
  });

  it("refuses an empty name, a bad email, the patient's own, and a repeat", () => {
    expect(
      inviteError(empty, patient.email, { ...draft, caregiverName: " " }),
    ).toBe("name");
    expect(
      inviteError(empty, patient.email, { ...draft, caregiverEmail: "x" }),
    ).toBe("email");
    expect(
      inviteError(empty, patient.email, {
        ...draft,
        caregiverEmail: "john@example.com",
      }),
    ).toBe("self");
    const { state } = invite(empty, patient, draft, 1000);
    expect(inviteError(state, patient.email, draft)).toBe("duplicate");
  });
});
