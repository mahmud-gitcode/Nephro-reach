import { describe, expect, it } from "vitest";
import {
  careContactWrite,
  EMPTY_CONTACTS,
  fromApiCareContacts,
  toApiKind,
  type ApiCareContact,
  type OfficeKind,
} from "./careContacts";
import { clinicWrite, EMPTY_CLINIC, fromApiClinic } from "./homeDialysisClinic";
import { officesOfKind, type DirectoryOffice } from "./directory";
import { fromApiPreferences } from "./preferences.repository";
import { profilePatch } from "./profile.repository";

const contact = (
  kind: ApiCareContact["kind"],
  name: string,
): ApiCareContact => ({
  id: kind,
  patientId: "p1",
  kind,
  name,
  phone: "555",
  address: "1 Main St",
  updatedAt: "2026-11-02T10:00:00.000Z",
});

describe("care offices <-> API (Phase 4)", () => {
  it.each<[OfficeKind, ApiCareContact["kind"]]>([
    ["vascular", "vascular"],
    ["nephrology", "nephrology"],
    ["transplant", "transplant"],
    ["primaryCare", "primary-care"],
  ])("maps the %s office to the API kind %s and back", (kind, wire) => {
    expect(toApiKind(kind)).toBe(wire);
    expect(fromApiCareContacts([contact(wire, "Office")])[kind].name).toBe(
      "Office",
    );
  });

  it("reads a kind the server does not have as an empty office", () => {
    const read = fromApiCareContacts([contact("vascular", "Metro")]);
    expect(read.nephrology).toEqual(EMPTY_CONTACTS.nephrology);
    expect(read.primaryCare).toEqual({ name: "", phone: "", address: "" });
  });

  it("reads nothing saved as four empty offices, never a sample", () => {
    expect(fromApiCareContacts([])).toEqual(EMPTY_CONTACTS);
    expect(fromApiCareContacts(null)).toEqual(EMPTY_CONTACTS);
  });

  it("saves a named office and removes a cleared one", () => {
    expect(
      careContactWrite({ name: " Metro ", phone: "", address: " 1 Main " }),
    ).toEqual({ kind: "put", body: { name: "Metro", address: "1 Main" } });
    expect(careContactWrite({ name: " ", phone: "555", address: "" })).toEqual({
      kind: "delete",
    });
  });
});

describe("home dialysis clinic <-> API (Phase 4)", () => {
  it("reads null as not set", () => {
    expect(fromApiClinic(null)).toBeNull();
  });

  it("takes onNephroReach from the server, not from the name", () => {
    const linked = fromApiClinic({
      patientId: "p1",
      organizationId: "org-1",
      onNephroReach: true,
      name: "Any Name",
      phone: "",
      address: "",
      email: null,
      updatedAt: "2026-11-02T10:00:00.000Z",
    });
    expect(linked).toMatchObject({
      organizationId: "org-1",
      onNephroReach: true,
      email: "",
    });
  });

  it("links a picked center by id only (the server copies its name)", () => {
    expect(
      clinicWrite({
        ...EMPTY_CLINIC,
        name: "Riverside",
        organizationId: "org-1",
        phone: " 555 ",
      }),
    ).toEqual({ kind: "put", body: { organizationId: "org-1", phone: "555" } });
  });

  it("sends a typed clinic with its email, and removes a cleared one", () => {
    expect(
      clinicWrite({
        name: "Lake Clinic",
        phone: "",
        address: "",
        email: "front@lake.example",
      }),
    ).toEqual({
      kind: "put",
      body: { name: "Lake Clinic", email: "front@lake.example" },
    });
    expect(clinicWrite({ ...EMPTY_CLINIC })).toEqual({ kind: "delete" });
  });
});

describe("the office directory", () => {
  const offices: DirectoryOffice[] = [
    {
      id: "1",
      name: "D",
      type: "DIALYSIS_CENTER",
      address: null,
      timeZone: null,
    },
    {
      id: "2",
      name: "V",
      type: "ACCESS_CENTER",
      address: null,
      timeZone: null,
    },
    {
      id: "3",
      name: "N",
      type: "NEPHROLOGY_OFFICE",
      address: null,
      timeZone: null,
    },
    { id: "4", name: "H", type: "HOSPITAL", address: null, timeZone: null },
  ];
  it("offers each kind only its own type of office", () => {
    expect(officesOfKind(offices, "dialysis").map((o) => o.id)).toEqual(["1"]);
    expect(officesOfKind(offices, "vascular").map((o) => o.id)).toEqual(["2"]);
    expect(officesOfKind(offices, "nephrology").map((o) => o.id)).toEqual([
      "3",
    ]);
    expect(officesOfKind(offices, "primaryCare")).toEqual([]);
  });
});

describe("account preferences and profile (Phase 4)", () => {
  it("round-trips the fluid unit and keeps an unknown value as ounces", () => {
    expect(fromApiPreferences({ fluidUnit: "ml" }).fluidUnit).toBe("ml");
    expect(fromApiPreferences({ fluidUnit: "oz" }).fluidUnit).toBe("oz");
    expect(fromApiPreferences({ fluidUnit: "cups" }).fluidUnit).toBe("oz");
  });

  it("reads the tour as finished only from a server timestamp", () => {
    expect(fromApiPreferences({ tourCompletedAt: null }).tourCompletedAt).toBe(
      null,
    );
    expect(
      fromApiPreferences({ tourCompletedAt: "2026-11-02T10:00:00.000Z" })
        .tourCompletedAt,
    ).toBe("2026-11-02T10:00:00.000Z");
  });

  it("keeps the quick action ids as the server sent them", () => {
    expect(
      fromApiPreferences({ quickActions: ["labs", "fluid"] }).quickActions,
    ).toEqual(["labs", "fluid"]);
    expect(fromApiPreferences({}).quickActions).toEqual([]);
  });

  it("sends only a changed name or language", () => {
    expect(
      profilePatch(
        { name: "John", language: "EN" },
        { name: " John ", language: "EN" },
      ),
    ).toEqual({});
    expect(
      profilePatch(
        { name: "John", language: "EN" },
        { name: "Johnny", language: "ES" },
      ),
    ).toEqual({ name: "Johnny", language: "ES" });
  });
});
