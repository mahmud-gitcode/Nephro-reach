import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { axe } from "vitest-axe";
import {
  RecordingModal,
  RecordingsLibraryModal,
  SettingModal,
} from "./LiveClassModals";
import type { RecentClass } from "./liveClass.data";

/* P15a: a recording link becomes an href only when it is http(s)
   (isSafeLinkUrl). Synthetic classes and links only. */

const CLASS_A: RecentClass = {
  id: "class-a",
  title: "Synthetic class A",
  date: "2026-10-01",
  attended: 4,
  rating: 0,
};
const CLASS_B: RecentClass = { ...CLASS_A, id: "class-b", title: "Class B" };
const SAFE = "https://video.example.test/rec/1";
const UNSAFE = "javascript:alert(1)";

afterEach(() => cleanup());

describe("RecordingModal", () => {
  it("links a stored https recording", async () => {
    render(
      <RecordingModal
        item={CLASS_A}
        link={SAFE}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    const open = screen.getByRole("link", { name: /open the recording/i });
    expect(open).toHaveAttribute("href", SAFE);
    expect(await axe(screen.getByRole("dialog"))).toHaveNoViolations();
  });

  it("never renders a stored javascript: link as an href, even after the field is edited", () => {
    const { rerender } = render(
      <RecordingModal
        item={CLASS_A}
        link={UNSAFE}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(document.querySelector('a[href^="javascript"]')).toBeNull();
    /* Typing a valid link in the field used to show the stored one. */
    const input = screen.getByLabelText("Recording link");
    fireEvent.change(input, { target: { value: SAFE } });
    expect(screen.queryByRole("link")).toBeNull();
    expect(document.querySelector('a[href^="javascript"]')).toBeNull();
    rerender(
      <RecordingModal
        item={CLASS_A}
        link={"  JavaScript:alert(1)"}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(document.querySelector("a[href]")).toBeNull();
  });
});

describe("RecordingsLibraryModal", () => {
  it("links only the http(s) recordings; an unsafe one reads 'No link'", async () => {
    render(
      <RecordingsLibraryModal
        open
        onClose={vi.fn()}
        classes={[CLASS_A, CLASS_B]}
        recordings={{ [CLASS_A.id]: SAFE, [CLASS_B.id]: UNSAFE }}
        onSelect={vi.fn()}
      />,
    );
    const dialog = screen.getByRole("dialog");
    const links = within(dialog).getAllByRole("link", { name: /open/i });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", SAFE);
    expect(dialog.querySelector('a[href^="javascript"]')).toBeNull();
    expect(within(dialog).getByText("No link")).toBeInTheDocument();
    expect(await axe(dialog)).toHaveNoViolations();
  });
});

/* P16e: an emptied "Default capacity" read as 0 and the dialog closed as
   if saved, then the server refused it (400). The dialog now says so. */
describe("SettingModal number fields", () => {
  it("keeps Save off and explains when the capacity is outside 1-1000", async () => {
    const onSave = vi.fn();
    const { container } = render(
      <SettingModal
        id="limits"
        title="Registration Limits"
        onClose={() => undefined}
        values={{ capacity: 50, waitlist: false }}
        onSave={onSave}
      />,
    );
    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Default capacity"), {
      target: { value: "" },
    });
    expect(save).toBeDisabled();
    expect(
      screen.getByText("Default capacity must be between 1 and 1000."),
    ).toBeInTheDocument();
    fireEvent.click(save);
    expect(onSave).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();

    fireEvent.change(screen.getByLabelText("Default capacity"), {
      target: { value: "40" },
    });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledWith("limits", {
      capacity: 40,
      waitlist: false,
    });
  });
});
