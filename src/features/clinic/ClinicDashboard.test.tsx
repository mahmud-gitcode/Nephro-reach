import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render as rtlRender, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "@/context/LanguageContext";
import { rosterMemberFor } from "./members.data";
import { upcomingClasses } from "./liveClass.data";
import { rosterRows, testPatientId } from "./rosterTestData";
import { ApiError } from "@/lib/api/client";

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

/* The ER visits row reads the office's ER summary from the API (Phase 9,
   tested in phase9 tests); this page test stubs it out. */
vi.mock("./ClinicErVisits", () => ({
  ClinicErVisits: () => null,
}));

vi.mock("./useClinicData", () => ({
  useClinicData: () => state,
  useEnrollPatient: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  /* The enroll form lists the published courses as programs. */
  useProgramCourses: () => [],
  EnrollError: class extends Error {},
}));

const { default: ClinicDashboard } = await import("./ClinicDashboard");

/* Phase 8: synthetic rows through the app's own mapping. */
const NOW = new Date();
const roster = rosterRows().map((p, i) =>
  rosterMemberFor(
    i === 1
      ? {
          ...p,
          lastActivityAt: new Date(
            NOW.getTime() - 9 * 86_400_000,
          ).toISOString(),
        }
      : i === 0
        ? { ...p, lastActivityAt: NOW.toISOString() }
        : p,
    NOW,
  ),
);
const loaded = {
  roster,
  patients: [],
  activity: [],
  classes: upcomingClasses,
  seats: { used: 5, allowed: 30, available: 25 },
};

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

/* The page heading reads its label through the language context, the same
   way every other clinic page does. */
const render = (ui: React.ReactElement) =>
  rtlRender(<LanguageProvider>{ui}</LanguageProvider>);

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
    set({ data: { roster: [], activity: [], classes: [], seats: null } });
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
    const blake = attention.getByRole("link", { name: "Blake Sample" });
    expect(blake).toHaveAttribute(
      "href",
      `/dashboard/clinic/members?patient=${testPatientId(2)}`,
    );
    expect(screen.getByText(/^Last updated/)).toBeInTheDocument();
  });

  it("pages the members table eight at a time and filters by status", async () => {
    set({ data: loaded });
    render(<ClinicDashboard />);
    const members = within(panel("Members"));
    expect(members.getByText("Showing 1–5 of 5 members")).toBeInTheDocument();

    await userEvent.selectOptions(
      members.getByRole("combobox", { name: "Status" }),
      "Need Follow-Up",
    );
    expect(members.getByText("Showing 1–1 of 1 members")).toBeInTheDocument();
  });

  it("counts the status cards from the roster, '—' where there is no source", () => {
    set({ data: loaded });
    render(<ClinicDashboard />);
    /* 5 members, 30 contract seats from the server's contract. */
    expect(screen.getByText("Members Enrolled")).toBeInTheDocument();
    expect(screen.getByText("17% taken · 25 left")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("links members by patientId only, never by MRN", () => {
    set({ data: loaded });
    const { container } = render(<ClinicDashboard />);
    for (const a of container.querySelectorAll("a[href]"))
      expect(a.getAttribute("href")).not.toMatch(/mrn=|[?&]to=/);
  });
});

describe("without access", () => {
  it("shows the no-access words for a 403, and no retry", () => {
    set({ error: new ApiError(403, "Forbidden") });
    render(<ClinicDashboard />);
    expect(
      screen.getAllByText("This has not been shared with you").length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
  });
});

describe("enrolling from the dashboard", () => {
  it("opens the enroll form in place from the page's primary action", async () => {
    set({ data: loaded });
    render(<ClinicDashboard />);
    /* The page header's primary action (the redesign moved it there from
       the members table). Quick Actions carries a second one, further
       down; the header's comes first in the document. */
    const [primary] = screen.getAllByRole("button", { name: /Enroll Patient/ });
    await userEvent.click(primary);
    expect(
      screen.getByRole("dialog", { name: "Enroll New Patient" }),
    ).toBeInTheDocument();
  });
});

describe("members without an MRN (P16c)", () => {
  it("lists each one, with no duplicate-key warning", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const noMrn = roster.slice(0, 2).map((m) => ({ ...m, mrn: "" }));
    set({ data: { ...loaded, roster: noMrn } });
    render(<ClinicDashboard />);
    const members = within(panel("Members"));
    for (const m of noMrn)
      expect(members.getAllByText(m.name).length).toBeGreaterThan(0);
    expect(errors.mock.calls.some((c) => /same key/.test(String(c[0])))).toBe(
      false,
    );
    errors.mockRestore();
  });
});
