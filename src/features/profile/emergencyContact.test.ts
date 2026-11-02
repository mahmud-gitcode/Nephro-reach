import { describe, expect, it } from "vitest";
import {
  canCall,
  describeContact,
  dialable,
  emergencyContactWrite,
  emptyEmergencyContact,
  fromApiEmergencyContact,
} from "./emergencyContact";

/* The Before-the-ER screen dials whatever this returns. A member reaching
 * that screen is having the worst moment this app will be present for, so
 * the only failure that matters is offering a call that cannot be made. */

describe("whether there is somebody to call", () => {
  it("needs a number, not just a name", () => {
    // A name with no number looks answered on the emergency screen and
    // cannot be dialled — worse than showing nothing.
    expect(
      canCall({ name: "Denise", phone: "", relationship: "Daughter" }),
    ).toBe(false);
    expect(canCall({ name: "", phone: "555-0199", relationship: "" })).toBe(
      true,
    );
  });

  it("does not count whitespace as a number", () => {
    expect(canCall({ name: "Denise", phone: "   ", relationship: "" })).toBe(
      false,
    );
  });
});

describe("dialling", () => {
  it("strips a written number down to what a phone can call", () => {
    expect(dialable("(555) 010-9920")).toBe("5550109920");
    expect(dialable("+1 555 010 9920")).toBe("+15550109920");
  });
});

describe("who is about to be called", () => {
  it("names them and how they are related", () => {
    expect(
      describeContact({
        name: "Denise Park",
        phone: "555",
        relationship: "Daughter",
      }),
    ).toBe("Denise Park · Daughter");
  });

  it("drops the separator when there is only a name", () => {
    expect(
      describeContact({ name: "Denise Park", phone: "555", relationship: "" }),
    ).toBe("Denise Park");
  });
});

describe("the API's emergency contact (Phase 4)", () => {
  it("reads the server's null as not set: empty fields, never a sample", () => {
    expect(fromApiEmergencyContact(null)).toEqual(emptyEmergencyContact());
  });

  it("keeps the saved fields", () => {
    expect(
      fromApiEmergencyContact({
        name: "Denise Park",
        phone: "(555) 010-9920",
        relationship: "Daughter",
      }),
    ).toEqual({
      name: "Denise Park",
      phone: "(555) 010-9920",
      relationship: "Daughter",
    });
  });

  it("fills a field the server left out", () => {
    expect(fromApiEmergencyContact({ name: "Denise Park" })).toEqual({
      name: "Denise Park",
      phone: "",
      relationship: "",
    });
  });

  it("saves a contact with a number as a PUT, trimmed", () => {
    expect(
      emergencyContactWrite({
        name: " Denise Park ",
        phone: " 555 ",
        relationship: "Daughter ",
      }),
    ).toEqual({
      kind: "put",
      body: { name: "Denise Park", phone: "555", relationship: "Daughter" },
    });
  });

  /* The API needs a number; a name alone cannot be dialled, so clearing
     the number removes the contact rather than failing validation. */
  it("removes the contact when the number is cleared", () => {
    expect(
      emergencyContactWrite({
        name: "Denise Park",
        phone: "  ",
        relationship: "",
      }),
    ).toEqual({ kind: "delete" });
  });
});
