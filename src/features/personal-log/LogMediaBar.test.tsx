import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { ApiError } from "@/lib/api/client";
import { LogMediaBar } from "./LogMediaBar";

/* P16b crawl: a caregiver whose grant does not cover photos attached one
   to an appointment; the server refused it (403) and the bar said only
   "The photo could not be saved." A refusal now says it is a permission;
   any other failure keeps the plain text. Synthetic data only. */

const state = vi.hoisted(() => ({ saveError: null as unknown }));

vi.mock("./dialysis/useAccessPhotos", () => ({
  useAccessPhotos: () => ({
    add: vi.fn(),
    isAdding: false,
    encodeError: null,
    saveError: state.saveError,
  }),
}));

afterEach(() => {
  cleanup();
  state.saveError = null;
});

function renderBar() {
  return render(
    <LogMediaBar logName="Appointments" onDictated={vi.fn()} isEs={false} />,
  );
}

describe("the log photo bar on a failed save", () => {
  it("a refused save (403) says it is a permission", async () => {
    state.saveError = new ApiError(403, "No", "access.patient_access_denied");
    const { container } = renderBar();
    expect(screen.getByRole("alert").textContent).toBe(
      "You don't have permission to save photos here.",
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("any other failure keeps the plain text", () => {
    state.saveError = new ApiError(500, "Boom", null);
    renderBar();
    expect(screen.getByRole("alert").textContent).toBe(
      "The photo could not be saved.",
    );
  });
});
