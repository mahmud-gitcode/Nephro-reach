import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { recentActivity, roster } from "./members.data";
import { upcomingClasses } from "./liveClass.data";

/* The dashboard's four states — loading, failed, empty, loaded — are driven
 * by one query. These pin each by handing the page that query's result
 * directly, so the test is about what the clinic sees, not about timing. */

const refetch = vi.fn();
const state = {
  data: undefined as unknown,
  isPending: false,
  isFetching: false,
  error: null as unknown,
  updatedAt: 0,
  refetch,
};

vi.mock("./useClinicData", () => ({
  useClinicData: () => state,
  useEnrollPatient: () => ({ mutate: vi.fn(), isPending: false, error: null }),
}));

const { default: ClinicDashboard } = await import("./ClinicDashboard");

const loaded = { roster, activity: recentActivity, classes: upcomingClasses };

function set(partial: Partial<typeof state>) {
  Object.assign(state, {
    data: undefined,
    isPending: false,
    isFetching: false,
    error: null,
    updatedAt: 0,
    ...partial,
  });
}

beforeEach(() => refetch.mockReset());

function panel(name: string | RegExp) {
  return screen.getByRole("heading", { name }).closest("section")!;
}

describe("while loading", () => {
  it("marks each data panel busy instead of showing it empty", () => {
    set({ isPending: true });
    render(<ClinicDashboard />);
    expect(
      panel(/^Needs Attention Today/).querySelector("[aria-busy='true']"),
    ).not.toBeNull();
    expect(
      within(panel("Members")).queryByText(/No members match/),
    ).not.toBeInTheDocument();
  });
});

describe("when the read fails", () => {
  it("says so, never 'nothing here', and retries on request", async () => {
    set({ error: new Error("offline") });
    render(<ClinicDashboard />);
    expect(
      screen.queryByText("Nobody needs attention today"),
    ).not.toBeInTheDocument();
    const retries = screen.getAllByRole("button", { name: "Try again" });
    expect(retries.length).toBeGreaterThan(0);
    await userEvent.click(retries[0]);
    expect(refetch).toHaveBeenCalled();
  });
});

describe("when there is nothing to show", () => {
  it("says so plainly, with a way to fill it", () => {
    set({ data: { roster: [], activity: [], classes: [] } });
    render(<ClinicDashboard />);
    expect(
      screen.getByText("Nobody needs attention today"),
    ).toBeInTheDocument();
    expect(screen.getByText("No upcoming classes")).toBeInTheDocument();
    expect(screen.getByText("No patients enrolled yet")).toBeInTheDocument();
    expect(screen.getByText("No activity yet")).toBeInTheDocument();
  });
});

describe("once loaded", () => {
  it("lists who needs attention, each linked to their Member page", () => {
    set({ data: loaded, updatedAt: Date.now() });
    render(<ClinicDashboard />);
    const attention = within(panel(/^Needs Attention Today/));
    const james = attention.getByRole("link", { name: "James K. Wilson" });
    expect(james).toHaveAttribute(
      "href",
      "/dashboard/clinic/members?mrn=567890",
    );
    expect(screen.getByText(/^Last updated/)).toBeInTheDocument();
  });

  it("pages the members table eight at a time and filters by status", async () => {
    set({ data: loaded });
    render(<ClinicDashboard />);
    const members = within(panel("Members"));
    expect(members.getByText("Showing 1–8 of 23 members")).toBeInTheDocument();

    await userEvent.selectOptions(
      members.getByRole("combobox", { name: "Status" }),
      "Attention Needed",
    );
    expect(members.getByText("Showing 1–2 of 2 members")).toBeInTheDocument();
  });
});

describe("enrolling from the dashboard", () => {
  it("opens the enroll form in place from the members table", async () => {
    set({ data: loaded });
    render(<ClinicDashboard />);
    await userEvent.click(
      screen.getByRole("button", { name: /Enroll Member/ }),
    );
    expect(
      screen.getByRole("dialog", { name: "Enroll New Patient" }),
    ).toBeInTheDocument();
  });
});
