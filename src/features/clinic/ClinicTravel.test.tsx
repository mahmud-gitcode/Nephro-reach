import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render as rtlRender, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "@/context/LanguageContext";
import { samplePastTrips, sampleTrip } from "@/features/travel/trip.seed";
import type { TripRequest } from "@/features/travel/trip.types";

/* The clinic's Travel Requests page (moved from the admin dashboard and
 * laid out like the other clinic pages, 2026-09-29). These pin what the
 * clinic must be able to do with a patient's request: see whose it is,
 * find it, and manage it in one save. */

const saveArrangement = vi.fn();
const state = {
  trips: [] as TripRequest[],
  saveArrangement,
  resolveTimeChange: vi.fn(),
  isPending: false,
  error: null as unknown,
  refetch: vi.fn(),
  saveError: null as unknown,
  dismissSaveError: vi.fn(),
};

vi.mock("@/features/travel/useTrips", () => ({ useTrips: () => state }));

const { default: ClinicTravel } = await import("./ClinicTravel");

const render = (ui: React.ReactElement) =>
  rtlRender(<LanguageProvider>{ui}</LanguageProvider>);

/* An open request still waiting on the clinic. */
const pending: TripRequest = {
  ...sampleTrip(),
  id: "trip-test-open",
  patient: { name: "Maria Lopez", email: "maria@example.com" },
  status: "submitted",
  placement: undefined,
};

beforeEach(() => {
  saveArrangement.mockReset();
  state.trips = [pending, ...samplePastTrips()];
});

describe("Travel Requests", () => {
  it("lists open requests by patient", () => {
    render(<ClinicTravel />);
    const table = screen.getByRole("table");
    expect(within(table).getByText("Maria Lopez")).toBeInTheDocument();
    expect(within(table).getByText("maria@example.com")).toBeInTheDocument();
  });

  it("counts a request with no facility yet as needing action", () => {
    render(<ClinicTravel />);
    const card = screen.getByText("Need action").closest("article")!;
    expect(card).toHaveTextContent("1");
  });

  it("finds a request by patient name", async () => {
    const user = userEvent.setup();
    render(<ClinicTravel />);
    await user.type(
      screen.getByRole("searchbox", { name: "Search travel requests" }),
      "nobody",
    );
    expect(
      screen.getByText("No requests match these filters."),
    ).toBeInTheDocument();
  });

  it("saves the arrangement in one write, with only what changed", async () => {
    const user = userEvent.setup();
    render(<ClinicTravel />);
    await user.click(
      screen.getByRole("button", { name: /Manage Maria Lopez's trip/ }),
    );
    const dialog = screen.getByRole("dialog");
    await user.selectOptions(
      within(dialog).getByRole("combobox", { name: "Status" }),
      "facility-reviewing",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );
    expect(saveArrangement).toHaveBeenCalledTimes(1);
    expect(saveArrangement).toHaveBeenCalledWith("trip-test-open", {
      status: "facility-reviewing",
      placement: undefined,
      note: undefined,
    });
  });

  it("shows finished trips under Past, by patient", async () => {
    const user = userEvent.setup();
    render(<ClinicTravel />);
    await user.click(screen.getByRole("tab", { name: /Past/ }));
    // The seeded past trips belong to the demo member.
    expect(
      within(screen.getByRole("table")).getAllByText("John Taylor").length,
    ).toBe(3);
  });

  it("says so when there are no requests at all", () => {
    state.trips = [];
    render(<ClinicTravel />);
    expect(screen.getByText("No travel requests")).toBeInTheDocument();
  });
});
