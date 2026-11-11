import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { ApiError } from "@/lib/api/client";
import { LogMediaBar } from "./LogMediaBar";

/* P16b crawl: a caregiver whose grant does not cover photos attached one
   to an appointment; the server refused it (403) and the bar said only
   "The photo could not be saved." A refusal now says it is a permission;
   any other failure keeps the plain text. Synthetic data only. */

const state = vi.hoisted(() => ({
  saveError: null as unknown,
  add: null as unknown as (...args: unknown[]) => void,
  hookArgs: [] as unknown[],
  grant: null as null | { permissions: Record<string, number> },
}));

vi.mock("./dialysis/useAccessPhotos", () => ({
  useAccessPhotos: (...args: unknown[]) => {
    state.hookArgs = args;
    return {
      add: state.add,
      isAdding: false,
      encodeError: null,
      saveError: state.saveError,
    };
  },
}));

vi.mock("@/features/caregivers/useCaregivers", () => ({
  useCaregiverView: () => ({ grant: state.grant }),
}));

afterEach(() => {
  cleanup();
  state.saveError = null;
  state.grant = null;
  state.hookArgs = [];
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

/* P16b QA round 2: the bar read the Photos list it never shows (a refused
   read for a caregiver without the dialysis area), and a caregiver without
   dialysis edit uploaded the picture to storage before the record was
   refused, leaving an unattached copy. */
describe("the log photo bar for a caregiver", () => {
  function pick(container: HTMLElement) {
    const input = container.querySelector('input[type="file"]');
    if (!input) throw new Error("no file input");
    const file = new File(["synthetic"], "site.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });
  }

  it("never reads the Photos list", () => {
    state.add = vi.fn();
    renderBar();
    expect(state.hookArgs[1]).toEqual({ list: false });
  });

  it("without dialysis edit, nothing is uploaded and the bar says why", async () => {
    state.add = vi.fn();
    state.grant = { permissions: { dialysis: 1, "personal-logs": 2 } };
    const { container } = renderBar();
    pick(container);
    expect(state.add).not.toHaveBeenCalled();
    expect((await screen.findByRole("alert")).textContent).toBe(
      "You don't have permission to save photos here.",
    );
  });

  it("with dialysis edit, the photo is added as before", () => {
    state.add = vi.fn();
    state.grant = { permissions: { dialysis: 2 } };
    const { container } = renderBar();
    pick(container);
    expect(state.add).toHaveBeenCalledTimes(1);
  });

  it("the member (no grant) adds the photo as before", () => {
    state.add = vi.fn();
    const { container } = renderBar();
    pick(container);
    expect(state.add).toHaveBeenCalledTimes(1);
  });
});
