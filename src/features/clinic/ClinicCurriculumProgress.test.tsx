import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render as rtlRender, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "@/context/LanguageContext";
import { members } from "./curriculumProgress.data";

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
  it("narrows the table from a status card, and writes it to the URL", async () => {
    render();
    expect(showing()).toHaveTextContent("of 23 members");
    await userEvent.click(
      summary().getByRole("button", { name: /^Members Completed Program/ }),
    );
    expect(showing()).toHaveTextContent("of 7 members");
    expect(replace).toHaveBeenLastCalledWith(
      "/dashboard/clinic/curriculum-progress?status=Completed",
      { scroll: false },
    );
  });

  it("narrows by program from the overview", async () => {
    render();
    await userEvent.click(
      screen.getByRole("button", { name: /^Crash Dialysis \(5-Day\)/ }),
    );
    expect(showing()).toHaveTextContent("of 6 members");
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
