import { describe, expect, it } from "vitest";
import { SEED_LIBRARY_RESOURCES } from "./library.seed";
import {
  canPost,
  composeResource,
  draftFrom,
  emptyDraft,
  EMPTY_FILTER,
  emptyResource,
  filterResources,
  findBySlug,
  formatDuration,
  libraryTotals,
  publishedOnly,
  relatedTo,
  removeResource,
  setPublished,
  slugify,
  sortByNewest,
  toggleSaved,
  upsertResource,
} from "./library.rules";
import type { LibraryResource } from "./library.types";

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

describe("admin shelf rules", () => {
  const draft: LibraryResource = {
    ...emptyResource(),
    id: "draft-1",
    titleEn: "Draft Item",
  };

  it("hides drafts from the member shelf", () => {
    const shelf = publishedOnly([...all, draft]);
    expect(shelf).toHaveLength(all.length);
    expect(shelf.some((entry) => entry.id === "draft-1")).toBe(false);
  });

  it("derives a slug from the title, folding accents and punctuation", () => {
    expect(slugify("Cómo Proteger Tu Fístula!")).toBe(
      "como-proteger-tu-fistula",
    );
    expect(slugify("   ")).toBe("untitled");
  });

  it("never lets two resources share a slug", () => {
    const clash: LibraryResource = {
      ...emptyResource(),
      titleEn: "Protecting Your Fistula",
    };
    const next = upsertResource(all, clash);
    expect(next[0].slug).toBe("protecting-your-fistula-2");
    expect(next).toHaveLength(all.length + 1);
  });

  it("keeps its own slug when a resource is edited in place", () => {
    const existing = findBySlug(all, "protecting-your-fistula")!;
    const next = upsertResource(all, { ...existing, summaryEn: "Reworded." });
    expect(next).toHaveLength(all.length);
    expect(findBySlug(next, "protecting-your-fistula")?.summaryEn).toBe(
      "Reworded.",
    );
  });

  it("removes a resource by id", () => {
    const next = removeResource(all, "lib-07");
    expect(next).toHaveLength(all.length - 1);
    expect(findBySlug(next, "protecting-your-fistula")).toBeUndefined();
  });

  it("stamps the date on publish and leaves it alone on unpublish", () => {
    const staged = [{ ...draft, publishedAt: "2020-01-01" }];

    const live = setPublished(staged, "draft-1", true, "2026-09-15");
    expect(live[0].published).toBe(true);
    expect(live[0].publishedAt).toBe("2026-09-15");

    const pulled = setPublished(live, "draft-1", false, "2026-10-01");
    expect(pulled[0].published).toBe(false);
    expect(pulled[0].publishedAt).toBe("2026-09-15");
  });

  it("counts what the admin summary cards show", () => {
    const totals = libraryTotals([...all, draft]);
    expect(totals.total).toBe(all.length + 1);
    expect(totals.published).toBe(all.length);
    expect(totals.drafts).toBe(1);
    expect(totals.videos + totals.documents + totals.articles).toBe(
      totals.total,
    );
  });
});

describe("the composer", () => {
  const caption = [
    "Protecting Your Fistula",
    "The daily thrill check takes ten seconds.",
    "Never let anyone draw blood from that arm.",
    "Call the clinic if the thrill changes.",
  ].join("\n\n");

  it("splits a caption into title, summary and body", () => {
    const post = composeResource({ ...emptyDraft(), caption });
    expect(post.titleEn).toBe("Protecting Your Fistula");
    expect(post.summaryEn).toBe("The daily thrill check takes ten seconds.");
    expect(post.bodyEn).toEqual([
      "Never let anyone draw blood from that arm.",
      "Call the clinic if the thrill changes.",
    ]);
  });

  it("posts published, so a Post button visibly does something", () => {
    const post = composeResource({ ...emptyDraft(), caption });
    expect(post.published).toBe(true);
  });

  it("survives a round trip through the composer without losing text", () => {
    const post = composeResource({ ...emptyDraft(), caption });
    expect(draftFrom(post).caption).toBe(caption);
  });

  it("keeps a one-line post usable", () => {
    const post = composeResource({
      ...emptyDraft(),
      caption: "Clinic closed Thursday for the holiday.",
    });
    expect(post.titleEn).toBe("Clinic closed Thursday for the holiday.");
    expect(post.bodyEn).toEqual([]);
    expect(post.summaryEn).toBe("");
  });

  it("trims a runaway first line rather than using it whole as a title", () => {
    const long = "word ".repeat(40).trim();
    const post = composeResource({ ...emptyDraft(), caption: long });
    expect(post.titleEn.length).toBeLessThanOrEqual(90);
    expect(post.titleEn.endsWith("…")).toBe(true);
  });

  it("keeps the original post date when an existing post is edited", () => {
    const first = composeResource(
      { ...emptyDraft(), caption },
      undefined,
      "2026-09-01",
    );
    const edited = composeResource(
      { ...emptyDraft(), caption: `${caption}\n\nOne more thing.` },
      first,
      "2026-09-20",
    );
    expect(edited.id).toBe(first.id);
    expect(edited.publishedAt).toBe("2026-09-01");
  });

  it("will not post an empty caption", () => {
    expect(canPost(emptyDraft())).toBe(false);
    expect(canPost({ ...emptyDraft(), caption: "   \n  " })).toBe(false);
    expect(canPost({ ...emptyDraft(), caption: "Something." })).toBe(true);
  });

  it("carries an attachment through to the saved post", () => {
    const post = composeResource({
      ...emptyDraft(),
      caption,
      kind: "video",
      videoSrc: "/videos/fistula.mp4",
      durationSeconds: 104,
    });
    expect(post.kind).toBe("video");
    expect(post.videoSrc).toBe("/videos/fistula.mp4");
    expect(post.durationSeconds).toBe(104);
  });

  it("carries the Spanish caption through the same split", () => {
    const post = composeResource({
      ...emptyDraft(),
      caption,
      captionEs: "Cómo Proteger Tu Fístula\n\nLa revisión diaria es rápida.",
    });
    expect(post.titleEs).toBe("Cómo Proteger Tu Fístula");
    expect(post.summaryEs).toBe("La revisión diaria es rápida.");
  });
});
