import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Alert } from "./Alert";

/* The role follows the tone, and that is the whole design: danger and
 * warning interrupt (role="alert"), info and success wait their turn
 * (role="status"), and a notice that is simply part of the page announces
 * nothing at all. Get this wrong and a screen reader either shouts about a
 * static disclaimer or stays silent about a failed save. */

describe("Alert", () => {
  it("danger interrupts", () => {
    render(<Alert tone="danger">Enter an allergy name.</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter an allergy name.",
    );
  });

  it("warning interrupts", () => {
    render(<Alert tone="warning">Your potassium is high.</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("info waits its turn", () => {
    render(<Alert tone="info">Saved as a draft.</Alert>);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("success waits its turn", () => {
    render(<Alert tone="success">Changes saved.</Alert>);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("live={false} announces nothing", () => {
    render(
      <Alert tone="info" live={false}>
        This community is for education and support only.
      </Alert>,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText(/education and support/i)).toBeInTheDocument();
  });

  it("shows a title above the message", () => {
    render(
      <Alert tone="info" live={false} title="Community Guidelines">
        Please do not post medical advice.
      </Alert>,
    );
    expect(screen.getByText("Community Guidelines")).toBeInTheDocument();
  });

  it("dismisses when asked", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <Alert tone="success" onDismiss={onDismiss}>
        Saved.
      </Alert>,
    );

    await user.click(screen.getByRole("button", { name: /dismiss|close/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("has no axe violations across tones", async () => {
    const { container } = render(
      <>
        <Alert tone="info">Info</Alert>
        <Alert tone="success">Success</Alert>
        <Alert tone="warning">Warning</Alert>
        <Alert tone="danger">Danger</Alert>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
