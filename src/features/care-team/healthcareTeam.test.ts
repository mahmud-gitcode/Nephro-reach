import { describe, expect, it } from "vitest";
import {
  accept,
  invite,
  recipients,
  removeMember,
  teamError,
  type TeamMember,
} from "./healthcareTeam";

const draft = {
  email: " Nurse@Clinic.org ",
  name: "Nurse Wilson",
  role: "nurse" as const,
};

describe("the member's healthcare team", () => {
  it("invites by email, stored lower-case and pending", () => {
    const list = invite([], draft, 1);
    expect(list[0]).toMatchObject({
      email: "nurse@clinic.org",
      status: "invited",
    });
  });

  it("refuses a bad email and the same person twice", () => {
    const list = invite([], draft, 1);
    expect(teamError([], { ...draft, email: "nope" })).toBe("email");
    expect(teamError(list, draft)).toBe("duplicate");
  });

  it("only sends to people who accepted", () => {
    let list: TeamMember[] = invite([], draft, 1);
    expect(recipients(list)).toHaveLength(0);
    list = accept(list, list[0].id);
    expect(recipients(list)).toHaveLength(1);
    expect(removeMember(list, list[0].id)).toHaveLength(0);
  });
});
