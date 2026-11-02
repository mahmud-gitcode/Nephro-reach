import { describe, expect, it } from "vitest";
import {
  fromApiTeamMember,
  recipients,
  teamError,
  toInviteBody,
  TEAM_ROLES,
  type TeamMember,
} from "./healthcareTeam";
import * as rules from "./healthcareTeam";

const draft = {
  email: " Nurse@Clinic.org ",
  name: "Nurse Wilson",
  role: "nurse" as const,
};

const row = (over: Partial<TeamMember> = {}): TeamMember => ({
  id: "c1",
  email: "nurse@clinic.org",
  name: "Nurse Wilson",
  role: "nurse",
  status: "invited",
  invitedAt: "2026-11-02T10:00:00.000Z",
  ...over,
});

describe("the member's healthcare team", () => {
  it("invites by email, sent lower-case, with no empty name", () => {
    expect(toInviteBody(draft)).toEqual({
      email: "nurse@clinic.org",
      name: "Nurse Wilson",
      role: "nurse",
    });
    expect(toInviteBody({ ...draft, name: "  " })).toEqual({
      email: "nurse@clinic.org",
      role: "nurse",
    });
  });

  it("refuses a bad email and the same person twice", () => {
    expect(teamError([], { ...draft, email: "nope" })).toBe("email");
    expect(teamError([row()], draft)).toBe("duplicate");
  });

  it("only sends to people who accepted", () => {
    expect(recipients([row()])).toHaveLength(0);
    expect(recipients([row({ status: "accepted" })])).toHaveLength(1);
  });

  /* INT-14: the member used to "Mark accepted" on someone else's behalf,
     which made that address a recipient of health logs without the person
     ever answering. The action is gone (and the API refuses it, spec 040). */
  it("has no way for the member to accept on someone's behalf", () => {
    expect("accept" in rules).toBe(false);
  });

  it("round-trips every role the API stores", () => {
    for (const { value } of TEAM_ROLES) {
      expect(
        fromApiTeamMember({
          id: "c1",
          patientId: "p1",
          name: "",
          email: "a@b.co",
          role: value,
          status: "invited",
          invitedAt: "2026-11-02T10:00:00.000Z",
        }).role,
      ).toBe(value);
      expect(
        toInviteBody({ email: "a@b.co", name: "", role: value }).role,
      ).toBe(value);
    }
  });

  it("reads an unknown status as invited, never accepted", () => {
    expect(
      fromApiTeamMember({
        id: "c1",
        patientId: "p1",
        name: "",
        email: "a@b.co",
        role: "nurse",
        status: "something-new",
        invitedAt: "2026-11-02T10:00:00.000Z",
      }).status,
    ).toBe("invited");
  });
});
