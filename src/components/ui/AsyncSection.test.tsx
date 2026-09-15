import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { AsyncSection } from "./AsyncSection";

/* The order of these four states is the whole component. The one that
 * matters most is the first test: a read that failed must never render as
 * "you have nothing saved" — on a medical log that reads as data loss. */

const props = {
  skeleton: <p>Loading…</p>,
  empty: <p>Nothing saved yet</p>,
  children: <p>The list</p>,
};

describe("AsyncSection", () => {
  it("shows the content once the read has landed", () => {
    render(<AsyncSection {...props} pending={false} />);
    expect(screen.getByText("The list")).toBeInTheDocument();
  });

  it("shows the skeleton while pending", () => {
    render(<AsyncSection {...props} pending />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByText("The list")).not.toBeInTheDocument();
  });

  it("marks the pending region busy, not the page", () => {
    const { container } = render(<AsyncSection {...props} pending />);
    expect(container.querySelector("[aria-busy='true']")).toBeInTheDocument();
  });

  it("shows the empty state only when the list is genuinely empty", () => {
    render(<AsyncSection {...props} pending={false} isEmpty />);
    expect(screen.getByText("Nothing saved yet")).toBeInTheDocument();
  });

  it("prefers the error over the empty state, so a failed read never reads as empty", () => {
    render(
      <AsyncSection
        {...props}
        pending={false}
        isEmpty
        error={new Error("localStorage is blocked")}
      />,
    );
    expect(screen.queryByText("Nothing saved yet")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("prefers the error over the skeleton, so a failure is not hidden by a spinner", () => {
    render(<AsyncSection {...props} pending error={new Error("nope")} />);
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("shows the error's own message when it has one", () => {
    render(
      <AsyncSection
        {...props}
        pending={false}
        error={new Error("There is no room left to save this.")}
      />,
    );
    expect(
      screen.getByText("There is no room left to save this."),
    ).toBeInTheDocument();
  });

  it("offers a retry that re-runs the read", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <AsyncSection
        {...props}
        pending={false}
        error={new Error("failed")}
        onRetry={onRetry}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("has no axe violations in the error state", async () => {
    const { container } = render(
      <AsyncSection
        {...props}
        pending={false}
        error={new Error("failed")}
        onRetry={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
