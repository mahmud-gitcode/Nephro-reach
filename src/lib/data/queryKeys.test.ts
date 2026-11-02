import { describe, expect, it } from "vitest";
import {
  orgKey,
  patientKey,
  patientScopeKey,
  platformKey,
  SELF_CONTEXT,
} from "./queryKeys";

describe("query keys", () => {
  it("always hold the patient and the organization", () => {
    expect(
      patientKey(
        { patientId: "p1", organizationId: "org-1" },
        "blood-pressure",
        {
          page: 1,
        },
      ),
    ).toEqual(["patient", "p1", "org", "org-1", "blood-pressure", { page: 1 }]);
  });

  it("mark patient/caregiver mode explicitly", () => {
    expect(patientScopeKey({ patientId: "p1", organizationId: null })).toEqual([
      "patient",
      "p1",
      "org",
      SELF_CONTEXT,
    ]);
  });

  it("differ between offices for the same patient", () => {
    const a = patientKey({ patientId: "p1", organizationId: "org-1" }, "labs");
    const b = patientKey({ patientId: "p1", organizationId: "org-2" }, "labs");
    const self = patientKey({ patientId: "p1", organizationId: null }, "labs");
    expect(a).not.toEqual(b);
    expect(a).not.toEqual(self);
  });

  it("refuse a missing id", () => {
    expect(() =>
      patientKey({ patientId: "", organizationId: null }, "labs"),
    ).toThrow();
    expect(() =>
      patientKey({ patientId: "p1", organizationId: " " }, "labs"),
    ).toThrow();
    expect(() => orgKey("", "roster")).toThrow();
  });

  it("file office reads under the office", () => {
    expect(orgKey("org-1", "roster", { page: 2 })).toEqual([
      "org",
      "org-1",
      "roster",
      { page: 2 },
    ]);
  });

  it("files platform-console reads apart from patient and office data", () => {
    expect(platformKey("course", "c1")).toEqual(["platform", "course", "c1"]);
    expect(() => platformKey("")).toThrow();
  });
});
