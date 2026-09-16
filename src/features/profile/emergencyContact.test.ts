import { beforeEach, describe, expect, it } from "vitest";
import {
  canCall,
  describeContact,
  dialable,
  emptyEmergencyContact,
  readEmergencyContact,
  writeEmergencyContact,
} from "./emergencyContact";

/* The Before-the-ER screen dials whatever this returns. A member reaching
 * that screen is having the worst moment this app will be present for, so
 * the only failure that matters is offering a call that cannot be made. */

beforeEach(() => {
  window.localStorage.clear();
});

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

describe("storage", () => {
  it("starts empty rather than undefined", async () => {
    expect(await readEmergencyContact()).toEqual(emptyEmergencyContact());
  });

  it("reads back what was written", async () => {
    const contact = {
      name: "Denise Park",
      phone: "(555) 010-9920",
      relationship: "Daughter",
    };
    await writeEmergencyContact(contact);
    expect(await readEmergencyContact()).toEqual(contact);
  });

  it("fills in a field a partial older record is missing", async () => {
    window.localStorage.setItem(
      "nr:profile-emergency-contact",
      JSON.stringify({ name: "Denise Park" }),
    );
    expect(await readEmergencyContact()).toEqual({
      name: "Denise Park",
      phone: "",
      relationship: "",
    });
  });
});
