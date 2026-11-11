import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { EditEdwModal, parseWeight } from "./EditEdwModal";

/* P16b QA round 4: the Weight & EDW settings kept the old value for an
   emptied field and saved "-5" as 5, closing with no message. A weight that
   cannot be saved now stays in the form with a field message. Synthetic
   data only. */

afterEach(cleanup);

function renderModal(onSave = vi.fn(), onClose = vi.fn()) {
  render(
    <LanguageProvider>
      <EditEdwModal
        isOpen
        onClose={onClose}
        edwKg={72.5}
        todayWeightKg={72.9}
        edwNote="Set by care team."
        unit="kg"
        onSave={onSave}
      />
    </LanguageProvider>,
  );
  return { onSave, onClose };
}

function submit() {
  const form = document.getElementById("edw-form");
  if (!form) throw new Error("no form");
  fireEvent.submit(form);
}

describe("parseWeight", () => {
  it("keeps a weight above 0 and refuses the rest", () => {
    expect(parseWeight("72.5")).toBe(72.5);
    expect(parseWeight(" 160 ")).toBe(160);
    expect(parseWeight("")).toBeNull();
    expect(parseWeight(".")).toBeNull();
    expect(parseWeight("0")).toBeNull();
    expect(parseWeight("-5")).toBeNull();
  });
});

describe("EditEdwModal weight validation", () => {
  it("a negative dry weight shows a field message and is not saved", async () => {
    const { onSave, onClose } = renderModal();
    const edw = await screen.findByLabelText(/Estimated Dry Weight/);
    fireEvent.change(edw, { target: { value: "-5" } });
    expect((edw as HTMLInputElement).value).toBe("-5");
    submit();
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain(
      "Enter a weight greater than 0.",
    );
    expect(edw.getAttribute("aria-invalid")).toBe("true");
    expect(await axe(document.body)).toHaveNoViolations();

    /* Fixing the field clears its message and saves the typed weight. */
    fireEvent.change(edw, { target: { value: "71.8" } });
    expect(screen.queryByRole("alert")).toBeNull();
    submit();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].edwKg).toBe(71.8);
    expect(onSave.mock.calls[0][0].todayWeightKg).toBe(72.9);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("an emptied today's weight is named, not replaced by the old one", async () => {
    const { onSave } = renderModal();
    const today = await screen.findByLabelText(/Today's Weight/);
    fireEvent.change(today, { target: { value: "" } });
    submit();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(today.getAttribute("aria-invalid")).toBe("true");
  });
});
