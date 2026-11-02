import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { WindowNote, windowNoteText } from "./WindowNote";

const partial = {
  loaded: 150,
  total: 420,
  enrollmentsLoaded: 150,
  enrollmentsTotal: 380,
  rosterWhole: false,
  complete: false,
};

describe("WindowNote", () => {
  it("says how much of the roster a count covers", () => {
    expect(windowNoteText(partial, "Counts cover", "members")).toBe(
      "Counts cover your 150 most recently added members of 420.",
    );
  });

  it("names the enrollments when only they are partial", () => {
    expect(
      windowNoteText(
        { ...partial, loaded: 40, total: 40, rosterWhole: true },
        "Counts cover",
        "members",
      ),
    ).toBe("Counts cover your 150 most recent program enrollments of 380.");
  });

  it("draws nothing for a window that holds everyone, or before a read", () => {
    const { container } = render(
      <>
        <WindowNote
          window={{ ...partial, complete: true }}
          what="Counts cover"
          noun="members"
        />
        <WindowNote window={undefined} what="Counts cover" noun="members" />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("is a note, with no accessibility violations", async () => {
    const { container } = render(
      <WindowNote window={partial} what="Counts cover" noun="members" />,
    );
    expect(screen.getByRole("note")).toHaveTextContent(
      "Counts cover your 150 most recently added members of 420.",
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
