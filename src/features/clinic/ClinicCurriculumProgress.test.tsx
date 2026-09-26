import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render as rtlRender, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "@/context/LanguageContext";
import { COURSES, members } from "./curriculumProgress.data";

/* The page reads one query and the URL; both are handed in, so these are
 * about what the clinic sees and where the address bar ends up. */

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

vi.mock("./useClinicData", () => ({ useClinicData: () => state }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
  useRouter: () => ({ replace }),
  usePathname: () => "/dashboard/clinic/curriculum-progress",
}));

const { default: ClinicCurriculumProgress } =
  await import("./ClinicCurriculumProgress");

const render = (url = "", data: unknown = { curriculum: members }) => {
  search = new URLSearchParams(url);
  Object.assign(state, { data, isPending: false, error: null });
  return rtlRender(
    <LanguageProvider>
      <ClinicCurriculumProgress />
    </LanguageProvider>,
  );
};

beforeEach(() => {
  refetch.mockReset();
  replace.mockReset();
});

const showing = () => screen.getByText(/^Showing \d+–\d+ of \d+ members$/);
const summary = () =>
  within(screen.getByRole("region", { name: "Curriculum summary" }));

describe("states", () => {
  it("shows a skeleton while loading", () => {
    search = new URLSearchParams();
    Object.assign(state, { data: undefined, isPending: true, error: null });
    const { container } = rtlRender(
      <LanguageProvider>
        <ClinicCurriculumProgress />
      </LanguageProvider>,
    );
    expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
  });

  it("offers to enroll when nobody is in a program", () => {
    render("", { curriculum: [] });
    expect(screen.getByText("No members in a program yet")).toBeInTheDocument();
  });
});

describe("filtering", () => {
  it("narrows the table from the status select, and writes it to the URL", async () => {
    render();
    expect(showing()).toHaveTextContent("of 23 members");

    await userEvent.selectOptions(screen.getByLabelText("Status"), "Completed");
    expect(showing()).toHaveTextContent("of 7 members");
    expect(replace).toHaveBeenLastCalledWith(
      "/dashboard/clinic/curriculum-progress?status=Completed",
      { scroll: false },
    );
  });

  it("does not filter from a summary card", () => {
    // They were filter buttons and the client asked for them not to be. The
    // select in the table's toolbar does the same job.
    render();
    expect(summary().queryAllByRole("button")).toHaveLength(0);
  });

  it("narrows by program from the course tabs", async () => {
    render();
    await userEvent.click(
      within(screen.getByRole("tablist", { name: "Course" })).getByRole("tab", {
        name: "Crash Dialysis",
      }),
    );
    expect(showing()).toHaveTextContent("of 6 members");
  });

  it("narrows the overview to the chosen course, and widens again", async () => {
    // The overview used to be a second course picker sitting next to the
    // tabs. It follows them now: every course on All Programs, one on one.
    render();
    const overview = () =>
      within(screen.getByRole("region", { name: "Program progress" }));
    const tabs = () => within(screen.getByRole("tablist", { name: "Course" }));

    for (const name of COURSES.map((course) => course.name)) {
      expect(overview().getByText(name)).toBeInTheDocument();
    }

    await userEvent.click(tabs().getByRole("tab", { name: "Crash Dialysis" }));
    expect(overview().getByText("Crash Dialysis (5-Day)")).toBeInTheDocument();
    expect(
      overview().queryByText("Journey to Dialysis (21-Day)"),
    ).not.toBeInTheDocument();
    expect(overview().queryByText("Education Library")).not.toBeInTheDocument();

    await userEvent.click(tabs().getByRole("tab", { name: "All Programs" }));
    expect(
      overview().getByText("Journey to Dialysis (21-Day)"),
    ).toBeInTheDocument();
  });

  it("no longer offers the overview card as a second course picker", () => {
    // Two controls a hand's width apart for one choice is how they end up
    // disagreeing about which course you are looking at.
    render();
    expect(
      within(
        screen.getByRole("region", { name: "Program progress" }),
      ).queryAllByRole("button"),
    ).toHaveLength(0);
  });

  it("starts filtered from the dashboard's Completed link", () => {
    render("status=Completed");
    expect(showing()).toHaveTextContent("of 7 members");
  });
});

describe("a member's progress popup", () => {
  it("opens from a row, links to the Member page, and closes", async () => {
    render();
    await userEvent.click(
      screen.getByRole("button", { name: "View Angela T. Brown" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Angela T. Brown" });
    expect(dialog).toHaveTextContent("Day 12 of 21");
    expect(
      within(dialog).getByRole("link", { name: "Open Member Page" }),
    ).toHaveAttribute("href", "/dashboard/clinic/members?mrn=901234");

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens from a name in the recent activity", async () => {
    render();
    const activity = screen
      .getByRole("heading", { name: "Recent Module Activity" })
      .closest("section")!;
    await userEvent.click(
      within(activity).getByRole("button", { name: "Robert L. Davis" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Robert L. Davis" }),
    ).toBeInTheDocument();
  });
});

describe("the course tabs", () => {
  const strip = () => within(screen.getByRole("tablist", { name: "Course" }));

  it("shows one tab per course, plus All Programs", () => {
    // Driven by the catalogue, so a fourth course needs no change here.
    render();
    expect(strip().getAllByRole("tab")).toHaveLength(COURSES.length + 1);

    for (const course of COURSES) {
      expect(strip().getByRole("tab", { name: course.id })).toBeInTheDocument();
    }
  });

  it("opens on All Programs and filters the table when one is picked", async () => {
    render();
    expect(strip().getByRole("tab", { name: "All Programs" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(showing()).toHaveTextContent("of 23 members");

    await userEvent.click(strip().getByRole("tab", { name: "Crash Dialysis" }));
    expect(showing()).not.toHaveTextContent("of 23 members");
  });

  it("writes the chosen course to the URL", async () => {
    render();
    await userEvent.click(strip().getByRole("tab", { name: "Crash Dialysis" }));
    expect(replace).toHaveBeenLastCalledWith(
      "/dashboard/clinic/curriculum-progress?program=Crash+Dialysis",
      { scroll: false },
    );
  });

  it("opens on the course the URL names", () => {
    // A tab selection somebody bookmarked or shared has to survive a reload.
    render("program=Crash+Dialysis");
    expect(
      strip().getByRole("tab", { name: "Crash Dialysis" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("no longer offers the program dropdown it replaced", () => {
    // Two controls for one filter is how they end up disagreeing.
    render();
    expect(screen.queryByLabelText("Program")).toBeNull();
  });
});
