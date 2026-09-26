import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render as rtlRender, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { recentActivity, roster } from "./members.data";
import { patients } from "./enrollment.data";
import { upcomingClasses } from "./liveClass.data";
import { LanguageProvider } from "@/context/LanguageContext";

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
vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
  useRouter: () => ({ replace }),
  usePathname: () => "/dashboard/clinic/members",
}));

const { default: ClinicMembers } = await import("./ClinicMembers");

const loaded = {
  patients,
  roster,
  activity: recentActivity,
  classes: upcomingClasses,
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
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("offers to enroll when there is nobody yet, right here", async () => {
    set({ data: { ...loaded, roster: [] } });
    render(<ClinicMembers />);
    expect(screen.getByText("No members yet")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /Enroll a patient/ }),
    );
    expect(
      screen.getByRole("dialog", { name: "Enroll New Patient" }),
    ).toBeInTheDocument();
  });
});

describe("filtering from the page", () => {
  it("narrows the table from the status select, and writes it to the URL", async () => {
    set({ data: loaded });
    render(<ClinicMembers />);
    expect(showing()).toHaveTextContent("of 23 members");

    await userEvent.selectOptions(
      screen.getByLabelText("Status"),
      "Need Follow-Up",
    );
    expect(showing()).toHaveTextContent("Showing 1–3 of 3 members");
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
    expect(showing()).toHaveTextContent("of 7 members");
  });

  it("starts filtered when the link says so, with the panel closed", () => {
    set({ data: loaded }, "status=Attention+Needed");
    render(<ClinicMembers />);
    expect(showing()).toHaveTextContent("Showing 1–2 of 2 members");
    expect(details()).toBeNull();
  });

  it("ignores a status that is not on the menu", () => {
    set({ data: loaded }, "status=Nonsense");
    render(<ClinicMembers />);
    expect(showing()).toHaveTextContent("of 23 members");
  });
});

describe("the details popup", () => {
  it("does not open by itself", () => {
    set({ data: loaded });
    render(<ClinicMembers />);
    expect(details()).toBeNull();
  });

  it("opens on the linked member, and Esc closes it", async () => {
    set({ data: loaded }, "mrn=567890");
    render(<ClinicMembers />);
    expect(details()).toHaveAccessibleName("James K. Wilson");
    expect(details()).toHaveTextContent("Day 5 of 5");

    await userEvent.keyboard("{Escape}");
    expect(details()).toBeNull();
    expect(replace).toHaveBeenLastCalledWith("/dashboard/clinic/members", {
      scroll: false,
    });
  });

  it("switches member from a row's View button", async () => {
    set({ data: loaded });
    render(<ClinicMembers />);
    await userEvent.click(
      screen.getByRole("button", { name: "View Mary S. Johnson" }),
    );
    expect(details()).toHaveAccessibleName("Mary S. Johnson");
  });
});

describe("bulk selection", () => {
  it("shows what can be done with the ticked members, and clears", async () => {
    set({ data: loaded });
    render(<ClinicMembers />);
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Select John D. Smith" }),
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
  it("opens the enroll form here, instead of going to another page", async () => {
    set({ data: loaded });
    render(<ClinicMembers />);
    await userEvent.click(screen.getByRole("button", { name: /Add Member/ }));
    expect(
      screen.getByRole("dialog", { name: "Enroll New Patient" }),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
