import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { PartNote } from "./PartNote";

const text = ({ loaded, total }: { loaded: number; total: number }) =>
  `Showing the newest ${loaded} of ${total} past requests.`;

describe("PartNote", () => {
  it("draws nothing for a whole list", () => {
    const { container } = render(<PartNote part={null} text={text} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("says how much of the list is shown, with no accessibility violations", async () => {
    const { container } = render(
      <PartNote part={{ loaded: 150, total: 230 }} text={text} />,
    );
    expect(screen.getByRole("note")).toHaveTextContent(
      "Showing the newest 150 of 230 past requests.",
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
