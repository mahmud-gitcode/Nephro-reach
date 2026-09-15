import { describe, expect, it } from "vitest";
import { getBreadcrumbTrail, isActiveRoute, sidebarItems } from "./navigation";

/* Which nav item is lit is how a member knows where they are. It had never
 * been tested, and it has three special cases, which is exactly the number
 * that quietly stops agreeing with itself. */

describe("isActiveRoute", () => {
  it("lights the dashboard only on the dashboard itself", () => {
    // "/dashboard" is a prefix of every other route, so the naive
    // startsWith would light it everywhere.
    expect(isActiveRoute("/dashboard", "/dashboard")).toBe(true);
    expect(isActiveRoute("/dashboard", "/dashboard/my-rides")).toBe(false);
  });

  it("lights a section from any page inside it", () => {
    expect(isActiveRoute("/dashboard/my-rides", "/dashboard/my-rides")).toBe(
      true,
    );
    expect(
      isActiveRoute(
        "/dashboard/education-center",
        "/dashboard/education-center/day-3",
      ),
    ).toBe(true);
  });

  it("keeps the dialysis journal out of the personal log", () => {
    // The journal sits under /personal-log in the URL but is its own item
    // in the sidebar, so lighting both would be wrong.
    expect(
      isActiveRoute(
        "/dashboard/personal-log",
        "/dashboard/personal-log/medications",
      ),
    ).toBe(true);
    expect(
      isActiveRoute(
        "/dashboard/personal-log",
        "/dashboard/personal-log/dialysis-journal",
      ),
    ).toBe(false);
  });

  it("never lights a placeholder href", () => {
    expect(isActiveRoute("#", "/dashboard")).toBe(false);
    expect(isActiveRoute("#", "#")).toBe(false);
  });
});

describe("the sidebar", () => {
  it("gives every item a role, so nothing is visible to everyone by accident", () => {
    for (const item of sidebarItems) {
      expect(item.roles.length).toBeGreaterThan(0);
    }
  });

  it("has no two items pointing at the same route", () => {
    const hrefs = sidebarItems
      .map((item) => item.href)
      .filter((h) => h !== "#");
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("lights exactly one item for a member’s routes", () => {
    // Two lit items is the bug this guards; zero is the other one.
    const memberItems = sidebarItems.filter(
      (item) => item.roles.includes("user") && item.href !== "#",
    );
    for (const item of memberItems) {
      const lit = memberItems.filter((candidate) =>
        isActiveRoute(candidate.href, item.href),
      );
      expect(lit.map((l) => l.href)).toEqual([item.href]);
    }
  });
});

describe("getBreadcrumbTrail", () => {
  it("is just the dashboard on the dashboard", () => {
    expect(getBreadcrumbTrail("/dashboard")).toEqual(["Dashboard"]);
    expect(getBreadcrumbTrail("/dashboard/")).toEqual(["Dashboard"]);
  });

  it("puts a personal-log page under Personal Log", () => {
    const trail = getBreadcrumbTrail("/dashboard/personal-log/medications");
    expect(trail[0]).toBe("Dashboard");
    expect(trail[1]).toBe("Personal Log");
    expect(trail).toHaveLength(3);
  });

  it("keeps the dialysis journal out of Personal Log, as the sidebar does", () => {
    // The trail and the lit nav item have to agree, or the page says it is
    // in one place and the sidebar says another.
    const trail = getBreadcrumbTrail(
      "/dashboard/personal-log/dialysis-journal",
    );
    expect(trail).not.toContain("Personal Log");
  });

  it("translates the whole trail, not just the last step", () => {
    const trail = getBreadcrumbTrail(
      "/dashboard/personal-log/medications",
      "ES",
    );
    expect(trail[0]).toBe("Panel");
    expect(trail[1]).toBe("Registro Personal");
  });

  it("gives a top-level page a two-step trail", () => {
    expect(getBreadcrumbTrail("/dashboard/my-rides")).toHaveLength(2);
  });
});
