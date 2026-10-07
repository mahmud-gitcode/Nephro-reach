import { describe, expect, it } from "vitest";
import { emptyTrip } from "./trip.rules";
import { clinicOnNephroReach, travelRequestEmail } from "./travelEmail";

describe("clinicOnNephroReach", () => {
  it("knows the dialysis centers on the platform, however it is typed", () => {
    expect(clinicOnNephroReach("Riverside Dialysis Center")).toBe(true);
    expect(clinicOnNephroReach("  riverside dialysis center ")).toBe(true);
  });

  it("treats anything else, or nothing, as outside the network", () => {
    expect(clinicOnNephroReach("Sunrise Kidney Care")).toBe(false);
    expect(clinicOnNephroReach("")).toBe(false);
    expect(clinicOnNephroReach(undefined)).toBe(false);
    // An access center is on NephroReach, but it is not a dialysis clinic.
    expect(clinicOnNephroReach("Metro Vascular Access Center")).toBe(false);
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
