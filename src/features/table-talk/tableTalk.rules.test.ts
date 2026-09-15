import { describe, expect, it } from "vitest";
import {
  addCategory,
  archiveCategory,
  canSubmitQuestion,
  emptyEpisode,
  featuredEpisode,
  filterEpisodes,
  isLive,
  liveEpisodes,
  looksUrgent,
  moveEpisode,
  questionError,
  relatedTo,
  renameCategory,
  setEpisodeStatus,
  setFeatured,
  slugify,
  sortForMembers,
  toggleFavorite,
  upsertEpisode,
} from "./tableTalk.rules";
import type { TableTalkCategory, TableTalkEpisode } from "./tableTalk.types";
import {
  SAMPLE_PREFIX,
  SEED_CATEGORIES,
  SEED_EPISODES,
} from "./tableTalk.seed";

/* Two things can go wrong here that matter. An episode reaching a member
 * before it is ready, and the question box quietly filing an emergency as a
 * topic idea. Most of what follows is about those two. */

const TODAY = "2026-09-15";

function episode(patch: Partial<TableTalkEpisode> = {}): TableTalkEpisode {
  return {
    ...emptyEpisode(),
    id: patch.id ?? "ep-1",
    slug: patch.slug ?? "an-episode",
    titleEn: "An Episode",
    videoSrc: "/videos/ep.mp4",
    status: "published",
    publishedAt: "2026-09-01",
    ...patch,
  };
}

const categories: TableTalkCategory[] = [
  { id: "c1", labelEn: "Travel", labelEs: "Viajes", order: 0, archived: false },
  {
    id: "c2",
    labelEn: "Ask the Expert",
    labelEs: "Pregunta al Experto",
    order: 1,
    archived: false,
  },
];

describe("what reaches a member", () => {
  it("shows a published episode", () => {
    expect(isLive(episode(), TODAY)).toBe(true);
  });

  it("hides drafts and archived episodes", () => {
    expect(isLive(episode({ status: "draft" }), TODAY)).toBe(false);
    expect(isLive(episode({ status: "archived" }), TODAY)).toBe(false);
  });

  it("holds a scheduled episode until its date", () => {
    const scheduled = episode({ status: "scheduled", publishAt: "2026-09-20" });
    expect(isLive(scheduled, TODAY)).toBe(false);
    expect(isLive(scheduled, "2026-09-20")).toBe(true);
    expect(isLive(scheduled, "2026-09-21")).toBe(true);
  });

  it("will not show an episode with no video file", () => {
    // A card that opens an empty player is worse than no card at all.
    expect(isLive(episode({ videoSrc: undefined }), TODAY)).toBe(false);
  });

  it("filters a mixed shelf down to what is live", () => {
    const shelf = [
      episode({ id: "a", slug: "a" }),
      episode({ id: "b", slug: "b", status: "draft" }),
      episode({ id: "c", slug: "c", videoSrc: undefined }),
    ];
    expect(liveEpisodes(shelf, TODAY).map((e) => e.id)).toEqual(["a"]);
  });
});

describe("the featured episode", () => {
  it("uses the one an admin marked", () => {
    const shelf = [
      episode({ id: "a", slug: "a", publishedAt: "2026-09-10" }),
      episode({
        id: "b",
        slug: "b",
        publishedAt: "2026-09-01",
        featured: true,
      }),
    ];
    expect(featuredEpisode(shelf, TODAY)?.id).toBe("b");
  });

  it("falls back to the newest rather than showing nothing", () => {
    const shelf = [
      episode({ id: "a", slug: "a", publishedAt: "2026-09-10" }),
      episode({ id: "b", slug: "b", publishedAt: "2026-09-01" }),
    ];
    expect(featuredEpisode(shelf, TODAY)?.id).toBe("a");
  });

  it("never features a draft", () => {
    const shelf = [
      episode({ id: "a", slug: "a", status: "draft", featured: true }),
      episode({ id: "b", slug: "b" }),
    ];
    expect(featuredEpisode(shelf, TODAY)?.id).toBe("b");
  });

  it("is exclusive — featuring one un-features the rest", () => {
    const shelf = [
      episode({ id: "a", slug: "a", featured: true }),
      episode({ id: "b", slug: "b" }),
    ];
    const next = setFeatured(shelf, "b");
    expect(next.find((e) => e.id === "a")?.featured).toBe(false);
    expect(next.find((e) => e.id === "b")?.featured).toBe(true);
  });

  it("drops the feature flag when an episode is archived", () => {
    const shelf = [episode({ id: "a", slug: "a", featured: true })];
    expect(setEpisodeStatus(shelf, "a", "archived")[0].featured).toBe(false);
  });
});

describe("saving an episode", () => {
  it("derives a slug from the title and keeps it unique", () => {
    expect(slugify("¿Cómo Viajar con Diálisis?")).toBe(
      "como-viajar-con-dialisis",
    );

    const shelf = [episode({ id: "a", slug: "an-episode" })];
    const added = upsertEpisode(shelf, episode({ id: "b", slug: "" }));
    expect(added[0].slug).toBe("an-episode-2");
  });

  it("stamps the publication date when it goes live", () => {
    const shelf = [episode({ id: "a", status: "draft" })];
    const published = setEpisodeStatus(shelf, "a", "published", "2026-09-15");
    expect(published[0].publishedAt).toBe("2026-09-15");
  });

  it("moves an episode up the admin list", () => {
    const shelf = [
      episode({ id: "a", slug: "a", order: 0 }),
      episode({ id: "b", slug: "b", order: 1 }),
    ];
    const moved = moveEpisode(shelf, "b", -1);
    expect(moved.find((e) => e.id === "b")?.order).toBe(0);
    expect(moved.find((e) => e.id === "a")?.order).toBe(1);
  });

  it("does nothing when an episode is already at the end", () => {
    const shelf = [episode({ id: "a", slug: "a", order: 0 })];
    expect(moveEpisode(shelf, "a", -1)).toEqual(shelf);
  });
});

describe("browsing", () => {
  const shelf = [
    episode({
      id: "a",
      slug: "travel",
      titleEn: "Travel Dialysis",
      titleEs: "Diálisis en Viaje",
      categoryIds: ["c1", "c2"],
      audience: "patients",
      publishedAt: "2026-09-10",
    }),
    episode({
      id: "b",
      slug: "caregiving",
      titleEn: "Caring at Home",
      titleEs: "",
      categoryIds: ["c1"],
      audience: "caregivers",
      isShort: true,
      publishedAt: "2026-09-05",
    }),
  ];

  const base = {
    search: "",
    categoryId: "all" as const,
    categories,
    favorites: [],
  };

  it("puts the newest first", () => {
    expect(sortForMembers(shelf).map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("splits by audience", () => {
    expect(
      filterEpisodes(shelf, { ...base, filter: "caregivers" }).map((e) => e.id),
    ).toEqual(["b"]);
  });

  it("finds Ask the Expert through the category, not a hard-coded flag", () => {
    expect(
      filterEpisodes(shelf, { ...base, filter: "expert" }).map((e) => e.id),
    ).toEqual(["a"]);
  });

  it("counts an episode as Spanish only when there is something to use", () => {
    expect(
      filterEpisodes(shelf, { ...base, filter: "spanish" }).map((e) => e.id),
    ).toEqual(["a"]);
  });

  it("searches Spanish titles while the interface is in English", () => {
    expect(
      filterEpisodes(shelf, { ...base, filter: "all", search: "dialisis" }).map(
        (e) => e.id,
      ),
    ).toEqual([]);
    expect(
      filterEpisodes(shelf, { ...base, filter: "all", search: "Diálisis" }).map(
        (e) => e.id,
      ),
    ).toEqual(["a"]);
  });

  it("searches the topic name too, so a topic finds every episode on it", () => {
    // Both are in Travel, so "viaje" is a topic hit rather than a title one.
    expect(
      filterEpisodes(shelf, { ...base, filter: "all", search: "viaje" }).map(
        (e) => e.id,
      ),
    ).toEqual(["a", "b"]);
  });

  it("narrows to favourites", () => {
    expect(
      filterEpisodes(shelf, {
        ...base,
        filter: "favorites",
        favorites: ["caregiving"],
      }).map((e) => e.id),
    ).toEqual(["b"]);
  });

  it("toggles a favourite on and back off", () => {
    expect(toggleFavorite([], "travel")).toEqual(["travel"]);
    expect(toggleFavorite(["travel"], "travel")).toEqual([]);
  });

  it("relates by shared topic, never to itself", () => {
    const related = relatedTo(shelf, shelf[0], 3, TODAY);
    expect(related.map((e) => e.id)).toEqual(["b"]);
  });
});

describe("topics", () => {
  it("adds one without letting a duplicate through", () => {
    const next = addCategory(categories, "Nutrition", "Nutrición");
    expect(next).toHaveLength(3);
    // Case-insensitive, so the filter row never shows two of the same thing.
    expect(addCategory(next, "nutrition", "")).toHaveLength(3);
  });

  it("ignores an empty name", () => {
    expect(addCategory(categories, "   ", "")).toHaveLength(2);
  });

  it("renames without touching the id episodes point at", () => {
    const next = renameCategory(categories, "c1", "Travel & Trips", "Viajes");
    expect(next[0].id).toBe("c1");
    expect(next[0].labelEn).toBe("Travel & Trips");
  });

  it("archives rather than deletes", () => {
    // Deleting would leave episodes pointing at nothing and quietly losing a
    // topic, so archive is the only way out.
    const next = archiveCategory(categories, "c1", true);
    expect(next).toHaveLength(2);
    expect(next[0].archived).toBe(true);
  });
});

describe("the question box", () => {
  it("wants an actual question, not two words", () => {
    expect(questionError("why?")).toBe("too-short");
    expect(canSubmitQuestion("Why is phosphorus so important?")).toBe(true);
  });

  it("refuses anything that reads like an emergency", () => {
    // Someone typing this needs help now. Filing it as a topic idea would be
    // the worst thing this screen could do.
    expect(looksUrgent("I have chest pain during treatment")).toBe(true);
    expect(looksUrgent("No puedo respirar después de la diálisis")).toBe(true);
    expect(questionError("I have chest pain right now")).toBe("urgent");
    expect(canSubmitQuestion("I have chest pain right now")).toBe(false);
  });

  it("lets an ordinary question through", () => {
    expect(
      looksUrgent("What should I know before traveling on dialysis?"),
    ).toBe(false);
  });
});

describe("the example shelf that ships with the feature", () => {
  it("shows eight episodes and holds the scheduled one back", () => {
    // The page has to look like something before a real recording exists,
    // and the scheduled example is there to prove scheduling works.
    const live = liveEpisodes(SEED_EPISODES, TODAY);
    expect(live).toHaveLength(8);
    expect(live.some((ep) => ep.slug === "eating-out-on-a-renal-diet")).toBe(
      false,
    );
  });

  it("opens on a featured episode with captions and a transcript", () => {
    const featured = featuredEpisode(SEED_EPISODES, TODAY);
    expect(featured?.slug).toBe("getting-ready-for-travel-dialysis");
    expect(featured?.captions.en).toContain("WEBVTT");
    expect(featured?.captions.es).toContain("WEBVTT");
    expect(featured?.transcriptEn?.length).toBeGreaterThan(200);
  });

  it("has something behind every filter, so none of them look broken", () => {
    const base = {
      search: "",
      categoryId: "all" as const,
      categories: SEED_CATEGORIES,
      favorites: [],
    };
    const count = (filter: Parameters<typeof filterEpisodes>[1]["filter"]) =>
      filterEpisodes(liveEpisodes(SEED_EPISODES, TODAY), {
        ...base,
        filter,
      }).length;

    expect(count("patients")).toBeGreaterThan(0);
    expect(count("caregivers")).toBeGreaterThan(0);
    expect(count("expert")).toBeGreaterThan(0);
    expect(count("short")).toBeGreaterThan(0);
    expect(count("live")).toBeGreaterThan(0);
    expect(count("spanish")).toBeGreaterThan(0);
  });

  it("marks every example so an admin can clear them in one go", () => {
    expect(
      SEED_EPISODES.every((episode) => episode.id.startsWith(SAMPLE_PREFIX)),
    ).toBe(true);
  });
});
