import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { ApiError } from "@/lib/api/client";
import { EmergencyContactSection } from "./EmergencyContactSection";

/* P16b crawl (round 4): a caregiver whose grant only lets them view the
   profile saved the emergency contact; the server refused it (403) and the
   form said "We could not save your emergency contact. Please try again."
   A refusal now says it is a permission; any other failure keeps the plain
   text. Synthetic data only. */

const state = vi.hoisted(() => ({ saveError: null as unknown }));

vi.mock("@/context/LanguageContext", () => ({
  useLanguage: () => ({ language: "EN", dictionary: null }),
  useLanguageCode: () => "EN",
}));

vi.mock("./useEmergencyContact", () => ({
  useEmergencyContact: () => ({
    contact: { name: "Test Person", relationship: "", phone: "5555550100" },
    isSet: true,
    save: vi.fn(),
    isPending: false,
    error: null,
    isError: false,
    refetch: vi.fn(),
    saveError: state.saveError,
    isSaving: false,
  }),
}));

afterEach(() => {
  cleanup();
  state.saveError = null;
});

describe("the emergency contact form on a failed save", () => {
  it("a refused save (403) says it is a permission", async () => {
    state.saveError = new ApiError(403, "No", "access.patient_access_denied");
    const { container } = render(<EmergencyContactSection />);
    expect(screen.getByRole("alert").textContent).toBe(
      "You don't have permission to change this emergency contact.",
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("any other failure keeps the plain text", () => {
    state.saveError = new ApiError(500, "Boom", null);
    render(<EmergencyContactSection />);
    expect(screen.getByRole("alert").textContent).toBe(
      "We could not save your emergency contact. Please try again.",
    );
  });

  it("no alert when nothing failed", () => {
    render(<EmergencyContactSection />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
