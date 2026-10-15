import { describe, expect, it } from "vitest";
import {
  accept,
  activeGrant,
  grantsForCaregiver,
  grantsForPatient,
  invite,
  inviteError,
  remove,
  type CaregiverState,
  type InviteDraft,
} from "./caregivers.data";

const patient = { email: "John@Example.com", name: "John" };
const draft: InviteDraft = {
  caregiverName: "Sarah",
  caregiverEmail: "Sarah@Example.com ",
  relationship: "Daughter",
};
const empty: CaregiverState = { grants: [] };

describe("caregivers", () => {
  it("starts pending, and is not active until accepted", () => {
    const { state, grant } = invite(empty, patient, draft, 1000);
    expect(grant.status).toBe("pending");
    expect(grant.caregiverEmail).toBe("sarah@example.com");
    expect(
      activeGrant(state, "sarah@example.com", "john@example.com"),
    ).toBeUndefined();
    expect(grantsForPatient(state, "john@example.com")).toHaveLength(1);
  });

  it("grants access once accepted", () => {
    const { state, grant } = invite(empty, patient, draft, 1000);
    const next = accept(state, grant.id, 2000);
    const active = activeGrant(next, "sarah@example.com", "john@example.com");
    expect(active?.status).toBe("active");
    expect(active?.activity[0].action).toBe("Accepted");
  });

  it("ends access when removed", () => {
    const { state, grant } = invite(empty, patient, draft, 1000);
    const next = remove(accept(state, grant.id, 2), grant.id, 3);
    expect(
      activeGrant(next, "sarah@example.com", "john@example.com"),
    ).toBeUndefined();
    expect(grantsForCaregiver(next, "sarah@example.com")).toHaveLength(0);
  });

  it("lets one caregiver look after several patients", () => {
    const first = invite(empty, patient, draft, 1);
    const second = invite(
      first.state,
      { email: "grace@example.com", name: "Grace" },
      draft,
      2,
    );
    let state = accept(second.state, first.grant.id, 3);
    state = accept(state, second.grant.id, 4);
    expect(
      grantsForCaregiver(state, "sarah@example.com").map((g) => g.patientName),
    ).toEqual(["John", "Grace"]);
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
