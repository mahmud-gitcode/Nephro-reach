import { describe, expect, it } from "vitest";
import { emptyTrip } from "./trip.rules";
import { clinicOnNephroReach, travelRequestEmail } from "./travelEmail";

describe("clinicOnNephroReach (NEW-1: the server's answer, not a name match)", () => {
  it("follows onNephroReach from GET /patients/:id/home-dialysis-clinic", () => {
    expect(clinicOnNephroReach({ onNephroReach: true })).toBe(true);
    expect(clinicOnNephroReach({ onNephroReach: false })).toBe(false);
  });

  it("treats no clinic, or an unknown answer, as outside the network", () => {
    expect(clinicOnNephroReach(null)).toBe(false);
    expect(clinicOnNephroReach(undefined)).toBe(false);
    expect(clinicOnNephroReach({})).toBe(false);
  });

  it("never matches a typed name against a demo list any more", () => {
    /* A clinic typed in as "Riverside Dialysis Center" is not linked to
       the center: only a directory pick (organizationId) is. */
    expect(
      clinicOnNephroReach({
        name: "Riverside Dialysis Center",
        onNephroReach: false,
      } as { onNephroReach: boolean }),
    ).toBe(false);
  });
});

describe("travelRequestEmail", () => {
  it("writes the request out, leaving blank fields off", () => {
    const trip = {
      ...emptyTrip(new Date(2026, 9, 7)),
      destination: { street: "", city: "Orlando", state: "FL", zip: "32801" },
      departDate: "2026-11-02",
      returnDate: "2026-11-09",
      treatmentsNeeded: 3,
      contactPhone: "555-0100",
      notes: "",
    };
    const email = travelRequestEmail(trip, "John Taylor");
    expect(email.subject).toBe(
      "Travel dialysis request: John Taylor, 2026-11-02 to 2026-11-09",
    );
    expect(email.body).toContain("Destination: Orlando, FL 32801");
    expect(email.body).toContain("Treatments needed: 3");
    expect(email.body).toContain("Phone: 555-0100");
    expect(email.body).not.toContain("Notes:");
  });
});
