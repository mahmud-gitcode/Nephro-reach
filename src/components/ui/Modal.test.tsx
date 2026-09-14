import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Modal } from "./Modal";
import { Button } from "./Button";

/* What this file is protecting.
 *
 * Modal replaced 24 hand-written overlays. Of those, 16 set no role, 17
 * ignored Escape, and none trapped focus — a keyboard user could Tab
 * straight out of an open dialog onto the page behind it and keep going,
 * with no way to tell they had left. That is the behaviour these tests
 * exist to keep. None of it is visible in a screenshot, and none of it is
 * caught by the type checker. */

function Fixture({
  open = true,
  onClose = () => {},
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  return (
    <>
      <button type="button">outside before</button>
      <Modal
        open={open}
        onClose={onClose}
        title="Edit reading"
        description="Blood pressure for today"
        footer={<Button>Save</Button>}
      >
        <label htmlFor="systolic">Systolic</label>
        <input id="systolic" />
      </Modal>
      <button type="button">outside after</button>
    </>
  );
}

describe("Modal", () => {
  it("renders nothing when closed", () => {
    render(<Fixture open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is a labelled, modal dialog", () => {
    render(<Fixture />);
    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Edit reading");
    expect(dialog).toHaveAccessibleDescription("Blood pressure for today");
  });

  it("moves focus into the dialog on open", async () => {
    render(<Fixture />);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("keeps Tab inside the dialog", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    const dialog = screen.getByRole("dialog");

    // Walk forward well past the number of focusable things in the dialog.
    // Every stop must still be inside it — that is what "trap" means.
    for (let i = 0; i < 8; i += 1) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("keeps Shift+Tab inside the dialog", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    const dialog = screen.getByRole("dialog");

    for (let i = 0; i < 8; i += 1) {
      await user.tab({ shift: true });
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Fixture onClose={onClose} />);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from the close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Fixture onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks page scroll while open, and restores it after", () => {
    const { rerender } = render(<Fixture open />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<Fixture open={false} />);
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("renders the footer actions", () => {
    render(<Fixture />);
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: "Save" }),
    ).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Fixture />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
