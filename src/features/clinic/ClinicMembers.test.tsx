import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render as rtlRender, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rosterMemberFor } from "./members.data";
import { upcomingClasses } from "./liveClass.data";
import { rosterRows, testPatientId } from "./rosterTestData";
import { ApiError } from "@/lib/api/client";
import { LanguageProvider } from "@/context/LanguageContext";
import type { Patient } from "./enrollment.data";

/* The page title reads the app language, as it does in the portal. */
const render = (ui: React.ReactElement) =>
  rtlRender(<LanguageProvider>{ui}</LanguageProvider>);

/* The Member page is driven by one query and by the URL. Both are handed
 * in directly here, so each test is about what the clinic sees and where
 * the address bar ends up — not about timing or routing internals. */

const refetch = vi.fn();
const replace = vi.fn();
let search = new URLSearchParams();

const state = {
  data: undefined as unknown,
  isPending: false,
  isFetching: false,
  error: null as unknown,
  updatedAt: 0,
  refetch,
};

const mutate = vi.fn();
vi.mock("./useClinicData", () => ({
  useClinicData: () => state,
  useEnrollPatient: () => ({ mutate, isPending: false, error: null }),
}));
/* The table pages on the server (useRosterPage). The stand-in pages the
   same synthetic patients the way the API does (search by name or MRN,
   the BE-2 program slug, page and limit) and records what it was asked. */
const pageCalls: { input: Record<string, unknown>; enabled: boolean }[] = [];
const serverPage = {
  /* Set to pretend the server holds more than the window. */
  total: null as number | null,
  error: null as unknown,
};
vi.mock("./useRosterPage", () => ({
  useRosterPage: (
    input: {
      search: string;
      program: string | null;
      page: number;
      limit: number;
    },
    enabled: boolean,
  ) => {
    pageCalls.push({ input, enabled });
    const all = ((state.data as { patients?: Patient[] } | undefined)
      ?.patients ?? []) as Patient[];
    const q = input.search.trim().toLowerCase();
    const matched = all.filter(
      (p) =>
        (!input.program || p.programSlug === input.program) &&
        (!q || p.name.toLowerCase().includes(q) || p.mrn.includes(q)),
    );
    const total = serverPage.total ?? matched.length;
    const rows = matched.slice(
      (input.page - 1) * input.limit,
      input.page * input.limit,
    );
    return {
      rows: serverPage.error ? undefined : rows,
      total,
      page: input.page,
      pageCount: Math.max(1, Math.ceil(total / input.limit)),
      firstShown: rows.length ? (input.page - 1) * input.limit + 1 : 0,
      lastShown: (input.page - 1) * input.limit + rows.length,
      isPending: false,
      isFetching: false,
      error: serverPage.error,
      refetch,
    };
  },
  useRosterPatient: () => null,
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
  useRouter: () => ({ replace }),
  usePathname: () => "/dashboard/clinic/members",
}));

const { default: ClinicMembers } = await import("./ClinicMembers");

/* Phase 8: synthetic rows through the app's own mapping (the roster is
   the API's). Avery is active today, Blake quiet for 9 days. */
const NOW = new Date();
const DAY = 86_400_000;
const patients = rosterRows().map((p, i) =>
  i === 0
    ? { ...p, lastActivityAt: new Date(NOW.getTime()).toISOString() }
    : i === 1
      ? {
          ...p,
          lastActivityAt: new Date(NOW.getTime() - 9 * DAY).toISOString(),
        }
      : p,
);
const roster = patients.map((p) => rosterMemberFor(p, NOW));
const loaded = {
  patients,
  roster,
  activity: [],
  classes: upcomingClasses,
  rosterTotal: roster.length,
  seats: { used: 5, allowed: 30, available: 25 },
};

function set(partial: Partial<typeof state>, url = "") {
  search = new URLSearchParams(url);
  Object.assign(state, {
    data: undefined,
    isPending: false,
    isFetching: false,
    error: null,
    updatedAt: 0,
    ...partial,
  });
}

beforeEach(() => {
  refetch.mockReset();
  replace.mockReset();
  pageCalls.length = 0;
  serverPage.total = null;
  serverPage.error = null;
});

const showing = () => screen.getByText(/^Showing \d+–\d+ of \d+ members$/);
/* The details open as a dialog named after the member. */
const details = () => screen.queryByRole("dialog");

describe("states", () => {
  it("shows a skeleton while loading, never an empty list", () => {
    set({ isPending: true });
    const { container } = render(<ClinicMembers />);
    expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
    expect(screen.queryByText("No members yet")).not.toBeInTheDocument();
  });

  it("says the read failed, and retries", async () => {
    set({ error: new Error("offline") });
    render(<ClinicMembers />);
    expect(screen.queryByText("No members yet")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
  });

  /* A role without patients read (or another office's roster): the server
     answers 403, and the page says so, with no retry and no rows. */
  it("shows the no-access state for a 403, never rows or a retry", () => {
    set({
      error: new ApiError(403, "Forbidden", "access.insufficient_permission"),
    });
    render(<ClinicMembers />);
    expect(
      screen.getByText("This has not been shared with you"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("sends to Enroll Patients when there is nobody yet", () => {
    set({ data: { ...loaded, roster: [] } });
    render(<ClinicMembers />);
    expect(screen.getByText("No members yet")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Enroll a patient/ }),
    ).toHaveAttribute("href", "/dashboard/clinic/enroll-patients");
  });
});

describe("filtering from the page", () => {
  it("narrows the table from the status select, and writes it to the URL", async () => {
    set({ data: loaded });
    render(<ClinicMembers />);
    expect(showing()).toHaveTextContent("of 5 members");

    await userEvent.selectOptions(
      screen.getByLabelText("Status"),
      "Need Follow-Up",
    );
    expect(showing()).toHaveTextContent("Showing 1–1 of 1 members");
    expect(replace).toHaveBeenLastCalledWith(
      "/dashboard/clinic/members?status=Need+Follow-Up",
      { scroll: false },
    );
  });

  it("does not filter from a summary card", () => {
    // They were filter buttons and the client asked for them not to be. The
    // select above does the same job, so the row is a summary now.
    set({ data: loaded });
    render(<ClinicMembers />);

    expect(
      within(
        screen.getByRole("region", { name: "Member summary" }),
      ).queryAllByRole("button"),
    ).toHaveLength(0);
  });

  it("narrows by program from the chart legend", async () => {
    set({ data: loaded });
    render(<ClinicMembers />);
    await userEvent.click(
      screen.getByRole("button", { name: /^Crash Dialysis/ }),
    );
    expect(showing()).toHaveTextContent("of 1 members");
  });

  it("starts filtered when the link says so, with the panel closed", () => {
    set({ data: loaded }, "status=Not+Started");
    render(<ClinicMembers />);
    expect(showing()).toHaveTextContent("Showing 1–1 of 1 members");
    expect(details()).toBeNull();
  });

  it("ignores a status that is not on the menu", () => {
    set({ data: loaded }, "status=Nonsense");
    render(<ClinicMembers />);
    expect(showing()).toHaveTextContent("of 5 members");
  });

  it("shows '—' for the columns with no source, never 0 (NEW-2)", () => {
    set({ data: loaded });
    render(<ClinicMembers />);
    const summary = screen.getByRole("region", { name: "Member summary" });
    expect(within(summary).getByText("Not tracked yet")).toBeInTheDocument();
  });

  it("never names a member by MRN in a link", () => {
    set({ data: loaded });
    const { container } = render(<ClinicMembers />);
    for (const a of container.querySelectorAll("a[href]"))
      expect(a.getAttribute("href")).not.toMatch(/mrn=|to=|9000\d\d/);
  });
});

describe("the details popup", () => {
  it("does not open by itself", () => {
    set({ data: loaded });
    render(<ClinicMembers />);
    expect(details()).toBeNull();
  });

  it("opens on the member the link names by patientId, and Esc closes it", async () => {
    set({ data: loaded }, `patient=${testPatientId(2)}`);
    render(<ClinicMembers />);
    expect(details()).toHaveAccessibleName("Blake Sample");
    expect(details()).toHaveTextContent("13 of 21 classes");
    /* No source for these yet (NEW-2). */
    expect(details()).toHaveTextContent("Live Classes Attended—");
    expect(
      within(details()!).getByRole("link", { name: "View Progress" }),
    ).toHaveAttribute(
      "href",
      `/dashboard/clinic/curriculum-progress?patient=${testPatientId(2)}#member-progress`,
    );

    await userEvent.keyboard("{Escape}");
    expect(details()).toBeNull();
    expect(replace).toHaveBeenLastCalledWith("/dashboard/clinic/members", {
      scroll: false,
    });
  });

  it("opens nothing for an old ?mrn= link (no MRN in URLs)", () => {
    set({ data: loaded }, "mrn=900002");
    render(<ClinicMembers />);
    expect(details()).toBeNull();
  });

  it("switches member from a row's View button, and writes the patientId", async () => {
    set({ data: loaded });
    render(<ClinicMembers />);
    await userEvent.click(
      screen.getByRole("button", { name: "View Casey Synthetic" }),
    );
    expect(details()).toHaveAccessibleName("Casey Synthetic");
    expect(replace).toHaveBeenLastCalledWith(
      `/dashboard/clinic/members?patient=${testPatientId(3)}`,
      { scroll: false },
    );
  });
});

describe("bulk selection", () => {
  it("'Select all' is off while the filters leave no rows (P16c crawl: it did nothing)", async () => {
    set({ data: loaded });
    render(<ClinicMembers />);
    const all = screen.getByRole("checkbox", {
      name: "Select all members on this page",
    });
    expect(all).toBeEnabled();
    await userEvent.selectOptions(
      screen.getByLabelText("Status"),
      "Attention Needed",
    );
    expect(showing()).toHaveTextContent("of 0 members");
    expect(all).toBeDisabled();
  });

  it("shows what can be done with the ticked members, and clears", async () => {
    set({ data: loaded });
    render(<ClinicMembers />);
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Select Avery Testpatient" }),
    );
    const bar = screen.getByRole("region", { name: "Selected members" });
    expect(within(bar).getByText("1 selected")).toBeInTheDocument();
    expect(
      within(bar).getByRole("link", { name: /Message selected/ }),
    ).toHaveAttribute("href", "/dashboard/clinic/messages");

    await userEvent.click(within(bar).getByRole("button", { name: "Clear" }));
    expect(
      screen.queryByRole("region", { name: "Selected members" }),
    ).not.toBeInTheDocument();
  });
});

describe("adding a member", () => {
  it("has one way in: Enroll Patients", () => {
    set({ data: loaded });
    render(<ClinicMembers />);
    expect(
      screen.queryByRole("button", { name: /Add Member/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Enroll Patient" }),
    ).toHaveAttribute("href", "/dashboard/clinic/enroll-patients");
  });
});

/* QA round 1, H1: the roster is paged on the server, not one silent window. */
describe("server paging", () => {
  const lastCall = () => pageCalls[pageCalls.length - 1];

  it("asks the server for the page, and shows the server's total", () => {
    serverPage.total = 420;
    set({ data: { ...loaded, rosterTotal: 420 } });
    render(<ClinicMembers />);
    expect(lastCall()).toEqual({
      input: { search: "", program: null, page: 1, limit: 10 },
      enabled: true,
    });
    expect(showing()).toHaveTextContent("Showing 1–5 of 420 members");
    /* Total Members is the server's count too, not the rows read. */
    const summary = screen.getByRole("region", { name: "Member summary" });
    expect(within(summary).getByText(/^420/)).toBeInTheDocument();
  });

  it("sends the program as the BE-2 slug and the search to the server", async () => {
    set({ data: loaded });
    render(<ClinicMembers />);
    await userEvent.selectOptions(
      screen.getByLabelText("Program"),
      "Crash Dialysis (5-Day)",
    );
    expect(lastCall().input.program).toBe("crash-5-day");
    await userEvent.type(screen.getByLabelText("Search members"), "blake");
    expect(lastCall().input.search).toBe("blake");
    expect(lastCall().enabled).toBe(true);
  });

  it("filters the window for a member status, and says when it is partial", async () => {
    set({
      data: {
        ...loaded,
        rosterTotal: 420,
        window: {
          loaded: 150,
          total: 420,
          enrollmentsLoaded: 150,
          enrollmentsTotal: 400,
          rosterWhole: false,
          complete: false,
        },
      },
    });
    render(<ClinicMembers />);
    /* The cards and charts say what they cover. */
    expect(
      screen.getByText(
        "Status counts and charts cover your 150 most recently added members of 420.",
      ),
    ).toBeInTheDocument();
    await userEvent.selectOptions(
      screen.getByLabelText("Status"),
      "Need Follow-Up",
    );
    /* No server filter for this status (NEW-2): the server read is off. */
    expect(lastCall().enabled).toBe(false);
    expect(
      screen.getByText(
        "The status filter covers your 150 most recently added members of 420.",
      ),
    ).toBeInTheDocument();
  });

  it("says nothing about a window that holds everyone", () => {
    set({
      data: {
        ...loaded,
        window: {
          loaded: 5,
          total: 5,
          enrollmentsLoaded: 4,
          enrollmentsTotal: 4,
          rosterWhole: true,
          complete: true,
        },
      },
    });
    render(<ClinicMembers />);
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("shows a failed page read as an error, never as no members", () => {
    serverPage.error = new Error("offline");
    set({ data: loaded });
    render(<ClinicMembers />);
    expect(screen.getByText("Members could not be loaded")).toBeInTheDocument();
    expect(
      screen.queryByText("No members match these filters."),
    ).not.toBeInTheDocument();
  });

  it("shows a 403 on the page read as no access, with no retry", () => {
    serverPage.error = new ApiError(403, "Forbidden");
    set({ data: loaded });
    render(<ClinicMembers />);
    expect(
      screen.getByText("This has not been shared with you"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
  });
});
