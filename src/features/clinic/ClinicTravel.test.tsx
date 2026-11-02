import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render as rtlRender, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { emptyTrip } from "@/features/travel/trip.rules";
import type { OfficeTripRow } from "@/features/travel/trip.mapping";
import type { TripRequest } from "@/features/travel/trip.types";
import { ApiError } from "@/lib/api/client";

/* The clinic's Travel Requests page (Phase 8: the office inbox on the API).
 * These pin what the clinic must be able to do with a patient's request:
 * see whose it is (never their email), find it, and manage it, saving
 * only what changed. Synthetic people only. */

const saveArrangement = vi.fn();
const list = {
  upcoming: [] as OfficeTripRow[],
  past: [] as OfficeTripRow[],
  isPending: false,
  error: null as unknown,
  refetch: vi.fn(),
};
const detail = {
  trip: null as TripRequest | null,
  error: null as unknown,
  saveArrangement,
  resolveTimeChange: vi.fn(),
  saveError: null as unknown,
  dismissSaveError: vi.fn(),
};
const filtersSeen: unknown[] = [];

vi.mock("@/features/travel/useTrips", () => ({
  useOfficeTrips: (filters: unknown) => {
    filtersSeen.push(filters);
    return list;
  },
  useOfficeTrip: (id: string | null) => ({
    ...detail,
    trip: id && detail.trip?.id === id ? detail.trip : null,
  }),
  ArrangementError: class extends Error {},
}));

const { default: ClinicTravel } = await import("./ClinicTravel");

const render = (ui: React.ReactElement) =>
  rtlRender(<LanguageProvider>{ui}</LanguageProvider>);

const row = (over: Partial<OfficeTripRow> = {}): OfficeTripRow => ({
  id: "trip-open",
  patientId: "00000000-0000-4000-8000-000000000001",
  patientName: "Avery Testpatient",
  mrn: "900001",
  city: "Tampa",
  state: "FL",
  departDate: "2099-01-10",
  returnDate: "2099-01-17",
  treatmentsNeeded: 3,
  bookedCount: 0,
  status: "submitted",
  facilityName: "",
  hasOpenTimeChange: false,
  submittedAt: "2026-10-01T10:00:00.000Z",
  ...over,
});

const openTrip: TripRequest = {
  ...emptyTrip(new Date(2026, 9, 1)),
  id: "trip-open",
  patient: { name: "Avery Testpatient", mrn: "900001" },
  destination: { street: "1 Test St", city: "Tampa", state: "FL", zip: "" },
  departDate: "2099-01-10",
  returnDate: "2099-01-17",
  status: "submitted",
};

beforeEach(() => {
  saveArrangement.mockReset();
  filtersSeen.length = 0;
  list.upcoming = [row()];
  list.past = [
    row({
      id: "trip-past",
      patientName: "Blake Sample",
      returnDate: "2026-01-01",
      departDate: "2025-12-20",
      status: "closed",
    }),
  ];
  list.error = null;
  detail.trip = openTrip;
  detail.error = null;
});

describe("Travel Requests", () => {
  it("lists open requests by patient name, with no email anywhere", () => {
    const { container } = render(<ClinicTravel />);
    const table = screen.getByRole("table");
    expect(within(table).getByText("Avery Testpatient")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/@/);
  });

  it("counts a request with no facility yet as needing action", () => {
    render(<ClinicTravel />);
    const card = screen.getByText("Need action").closest("article")!;
    expect(card).toHaveTextContent("1");
  });

  it("searches on the server (name, MRN or city), not the loaded rows", async () => {
    const user = userEvent.setup();
    render(<ClinicTravel />);
    await user.type(
      screen.getByRole("searchbox", { name: "Search travel requests" }),
      "tampa",
    );
    expect(filtersSeen.at(-1)).toEqual({ search: "tampa", status: undefined });
  });

  it("saves only what changed", async () => {
    const user = userEvent.setup();
    render(<ClinicTravel />);
    await user.click(
      screen.getByRole("button", { name: /Manage Avery Testpatient's trip/ }),
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
    expect(saveArrangement).toHaveBeenCalledWith(openTrip, {
      status: "facility-reviewing",
      placement: undefined,
      note: undefined,
    });
  });

  it("will not confirm a trip with no facility or treatment times", async () => {
    const user = userEvent.setup();
    render(<ClinicTravel />);
    await user.click(
      screen.getByRole("button", { name: /Manage Avery Testpatient's trip/ }),
    );
    const dialog = screen.getByRole("dialog");
    await user.selectOptions(
      within(dialog).getByRole("combobox", { name: "Status" }),
      "confirmed",
    );
    expect(
      within(dialog).getByRole("button", { name: "Save changes" }),
    ).toBeDisabled();
    expect(saveArrangement).not.toHaveBeenCalled();
  });

  it("shows finished trips under Past", async () => {
    const user = userEvent.setup();
    render(<ClinicTravel />);
    await user.click(screen.getByRole("tab", { name: /Past/ }));
    expect(
      within(screen.getByRole("table")).getByText("Blake Sample"),
    ).toBeInTheDocument();
  });

  it("says so when there are no requests at all", () => {
    list.upcoming = [];
    list.past = [];
    render(<ClinicTravel />);
    expect(screen.getByText("No travel requests")).toBeInTheDocument();
  });

  it("shows a failed read as an error, never as no requests", () => {
    list.upcoming = [];
    list.past = [];
    list.error = new ApiError(500, "Down");
    render(<ClinicTravel />);
    expect(screen.queryByText("No travel requests")).not.toBeInTheDocument();
    expect(
      screen.getByText("Travel requests did not load"),
    ).toBeInTheDocument();
  });

  it("shows the no-access words for a 403, with no retry", () => {
    list.upcoming = [];
    list.past = [];
    list.error = new ApiError(403, "Forbidden");
    render(<ClinicTravel />);
    expect(
      screen.getByText("This has not been shared with you"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
  });

  it("has no accessibility violations with requests listed", async () => {
    const { container } = render(<ClinicTravel />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
