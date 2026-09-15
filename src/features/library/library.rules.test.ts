import { describe, expect, it } from "vitest";
import { SEED_LIBRARY_RESOURCES } from "./library.seed";
import {
  EMPTY_FILTER,
  filterResources,
  findBySlug,
  formatDuration,
  relatedTo,
  sortByNewest,
  toggleSaved,
} from "./library.rules";

/* The Library is a finding screen, so every rule here is about a member not
 * being told that something they can see in the sidebar does not exist. */

const all = SEED_LIBRARY_RESOURCES;
const noneSaved: string[] = [];

describe("library filtering", () => {
  it("returns the whole shelf when nothing is filtered", () => {
    expect(filterResources(all, EMPTY_FILTER, noneSaved)).toHaveLength(
      all.length,
    );
  });

  it("narrows to one kind", () => {
    const videos = filterResources(
      all,
      { ...EMPTY_FILTER, kind: "video" },
      noneSaved,
    );
    expect(videos.length).toBeGreaterThan(0);
    expect(videos.every((entry) => entry.kind === "video")).toBe(true);
  });

  it("narrows to one topic", () => {
    const nutrition = filterResources(
      all,
      { ...EMPTY_FILTER, category: "nutrition" },
      noneSaved,
    );
    expect(nutrition.every((entry) => entry.category === "nutrition")).toBe(
      true,
    );
  });

  it("searches Spanish titles while the UI is in English", () => {
    const hits = filterResources(
      all,
      { ...EMPTY_FILTER, search: "potasio" },
      noneSaved,
    );
    expect(hits.map((entry) => entry.slug)).toContain(
      "potassium-at-the-grocery-store",
    );
  });

  it("ignores case and surrounding spaces in a search", () => {
    const hits = filterResources(
      all,
      { ...EMPTY_FILTER, search: "  FISTULA " },
      noneSaved,
    );
    expect(hits.map((entry) => entry.slug)).toContain(
      "protecting-your-fistula",
    );
  });

  it("shows only saved items when asked, and nothing when none are saved", () => {
    expect(
      filterResources(all, { ...EMPTY_FILTER, savedOnly: true }, noneSaved),
    ).toHaveLength(0);

    const saved = filterResources(all, { ...EMPTY_FILTER, savedOnly: true }, [
      "protecting-your-fistula",
    ]);
    expect(saved.map((entry) => entry.slug)).toEqual([
      "protecting-your-fistula",
    ]);
  });

  it("combines filters rather than replacing them", () => {
    const hits = filterResources(
      all,
      { ...EMPTY_FILTER, kind: "document", category: "nutrition" },
      noneSaved,
    );
    expect(
      hits.every(
        (entry) => entry.kind === "document" && entry.category === "nutrition",
      ),
    ).toBe(true);
  });
});

describe("library ordering and lookup", () => {
  it("puts the newest resource first without mutating the input", () => {
    const original = [...all];
    const sorted = sortByNewest(all);
    expect(sorted[0].publishedAt >= sorted[sorted.length - 1].publishedAt).toBe(
      true,
    );
    expect(all).toEqual(original);
  });

  it("finds a resource by slug, and reports a missing one as undefined", () => {
    expect(findBySlug(all, "protecting-your-fistula")?.id).toBe("lib-07");
    expect(findBySlug(all, "no-such-resource")).toBeUndefined();
  });

  it("relates within a topic and never to itself", () => {
    const resource = findBySlug(all, "potassium-at-the-grocery-store")!;
    const related = relatedTo(all, resource);
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((entry) => entry.category === "nutrition")).toBe(true);
    expect(related.some((entry) => entry.slug === resource.slug)).toBe(false);
  });
});

describe("saving", () => {
  it("adds a slug to the front and removes it on a second tap", () => {
    const once = toggleSaved(["a"], "b");
    expect(once).toEqual(["b", "a"]);
    expect(toggleSaved(once, "b")).toEqual(["a"]);
  });
});

describe("duration formatting", () => {
  it("pads the seconds so 1:05 never reads as 1:5", () => {
    expect(formatDuration(95)).toBe("1:35");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(138)).toBe("2:18");
  });
});
