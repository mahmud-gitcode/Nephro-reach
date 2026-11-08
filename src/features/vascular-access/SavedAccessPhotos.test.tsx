import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import type { AccessPhoto } from "@/features/personal-log/dialysis/accessPhotos";
import { SavedAccessPhotos } from "./SavedAccessPhotos";

/* Phase 10 (QA M2, NEW-5): the saved access photos stay listed in the
   concern and message modals, honestly unavailable to attach. Each picture
   is drawn through the record link component (no data: URL); synthetic
   data only. */

vi.mock("@/features/personal-log/dialysis/AccessPhotoImage", () => ({
  AccessPhotoImage: ({ photoId }: { photoId: string }) => (
    <span data-testid="picture" data-photo={photoId} />
  ),
}));

const PHOTOS: AccessPhoto[] = [
  {
    id: "ph-1",
    subject: "access",
    note: "Redness (synthetic)",
    takenAt: "2026-11-01T10:00:00.000Z",
    sent: false,
  },
  {
    id: "ph-2",
    subject: "exit-site",
    note: "",
    takenAt: "2026-11-02T10:00:00.000Z",
    sent: true,
  },
];

afterEach(cleanup);

describe("SavedAccessPhotos", () => {
  it("lists each saved photo through its link, disabled, with the note", async () => {
    const { container } = render(
      <SavedAccessPhotos photos={PHOTOS} isEs={false} />,
    );
    expect(screen.getByText("Or one of your saved photos")).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button).toBeDisabled();
      expect(button).toHaveAccessibleDescription(
        /Attaching a saved photo is not available yet/,
      );
    }
    expect(
      screen.getByRole("button", { name: "Access — Redness (synthetic)" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByTestId("picture").map((el) => el.dataset.photo),
    ).toEqual(["ph-1", "ph-2"]);
    expect(container.innerHTML).not.toContain("data:");
    fireEvent.click(buttons[0]);
    expect(buttons[0]).not.toHaveAttribute("aria-pressed", "true");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Spanish copy", () => {
    render(<SavedAccessPhotos photos={PHOTOS} isEs />);
    expect(
      screen.getByText("O una de sus fotos guardadas"),
    ).toBeInTheDocument();
    expect(screen.getByText(/aún no está disponible/)).toBeInTheDocument();
  });

  it("renders nothing without saved photos", () => {
    const { container } = render(
      <SavedAccessPhotos photos={[]} isEs={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
