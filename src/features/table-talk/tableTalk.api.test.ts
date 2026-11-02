import { describe, expect, it } from "vitest";
import {
  EPISODE_PLACEHOLDER,
  fromApiCategory,
  fromApiEpisode,
  fromApiQuestion,
  toEpisodeBody,
  toEpisodePatch,
  type ApiPlatformEpisode,
} from "./tableTalk.api";
import { emptyEpisode, popularTopics } from "./tableTalk.rules";

/* Table Talk against the API (Phase 12): the renames both ways, the server's
   category uuids, and a PATCH that sends only what changed. Synthetic
   content only. */

const CAT = "33333333-3333-4333-8333-333333333333";

const platformRow: ApiPlatformEpisode = {
  id: "44444444-4444-4444-8444-444444444444",
  slug: "travel-dialysis",
  titleEn: "Travel dialysis",
  titleEs: "Diálisis de viaje",
  descriptionEn: "d",
  descriptionEs: "",
  speakers: [{ id: "sp-1", name: "Test Host", role: "Host" }],
  categoryIds: [CAT],
  audience: "patients",
  thumbnailUrl: "/images/table-talk/episode-thumbnail.jpg",
  videoUrl: "https://www.youtube.com/watch?v=abcdefghijk",
  durationSeconds: 140,
  isShort: true,
  isLiveEvent: false,
  featured: false,
  publishedOn: "2026-10-05T00:00:00.000Z",
  captionsEn: "WEBVTT\n\n00:00.000 --> 00:01.000\nHi",
  captionsEs: null,
  transcriptEn: null,
  transcriptEs: null,
  status: "scheduled",
  publishOn: "2026-11-20",
  position: 3,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

describe("reading episodes", () => {
  it("renames thumbnailUrl, videoUrl, captions, publishOn, publishedOn and position", () => {
    const episode = fromApiEpisode(platformRow);
    expect(episode).toMatchObject({
      thumbnail: "/images/table-talk/episode-thumbnail.jpg",
      videoSrc: "https://www.youtube.com/watch?v=abcdefghijk",
      captions: { en: platformRow.captionsEn, es: undefined },
      status: "scheduled",
      publishAt: "2026-11-20",
      // A @db.Date: the first ten characters, never through local time.
      publishedAt: "2026-10-05",
      order: 3,
      categoryIds: [CAT],
    });
  });

  it("marks a member's episode live and carries the favorite", () => {
    const { status, publishOn, position, createdAt, updatedAt, ...member } =
      platformRow;
    void status;
    void publishOn;
    void position;
    void createdAt;
    void updatedAt;
    expect(fromApiEpisode({ ...member, favorite: true })).toMatchObject({
      status: "published",
      favorite: true,
    });
  });

  it("shows a remote thumbnail as the local placeholder", () => {
    expect(
      fromApiEpisode({
        ...platformRow,
        thumbnailUrl: "https://example.com/nephroreach-demo/t.jpg",
      }).thumbnail,
    ).toBe(EPISODE_PLACEHOLDER);
  });

  it("uses the server's episode count for popular topics", () => {
    const category = fromApiCategory({
      id: CAT,
      labelEn: "Travel",
      labelEs: "Viajes",
      position: 1,
      archived: false,
      episodeCount: 12,
    });
    expect(category.order).toBe(1);
    // The loaded page holds none of them; the count is still the shelf's.
    expect(popularTopics([], [category])).toEqual([{ category, count: 12 }]);
  });

  it("keeps a question's asker private: no email, and an unknown status is new", () => {
    expect(
      fromApiQuestion({
        id: "q",
        body: "Why phosphorus?",
        status: "odd",
        adminNote: "",
        submittedAt: "2026-11-01T00:00:00.000Z",
        askedById: "u",
        askedByName: null,
      }),
    ).toMatchObject({ askedByEmail: "", askedByName: "", status: "new" });
  });
});

describe("writing episodes", () => {
  it("sends the server's names, uuids only, and publishOn as YYYY-MM-DD", () => {
    const draft = {
      ...emptyEpisode(2),
      titleEn: "New episode",
      categoryIds: [CAT, "cat-travel"],
      status: "scheduled" as const,
      publishAt: "2026-12-01",
      thumbnail: "data:image/png;base64,AAAA",
      videoSrc: "/videos/clip.mp4",
      captions: { en: "WEBVTT" },
    };
    const body = toEpisodeBody(draft);
    expect(body).toMatchObject({
      titleEn: "New episode",
      // A seed id like "cat-travel" is not a server category.
      categoryIds: [CAT],
      status: "scheduled",
      publishOn: "2026-12-01",
      captionsEn: "WEBVTT",
      position: 2,
    });
    expect(body).not.toHaveProperty("thumbnail");
    expect(body).not.toHaveProperty("id");
    expect(body).not.toHaveProperty("slug");
    // A data: URL is never sent.
    expect(JSON.stringify(body)).not.toMatch(/data:/);
  });

  it("patches only what changed; a cleared caption or video is null", () => {
    const before = fromApiEpisode(platformRow);
    expect(toEpisodePatch(before, { ...before })).toEqual({});
    expect(toEpisodePatch(before, { ...before, featured: true })).toEqual({
      featured: true,
    });
    expect(
      toEpisodePatch(before, {
        ...before,
        captions: { en: undefined, es: undefined },
        videoSrc: undefined,
      }),
    ).toEqual({ captionsEn: null, videoUrl: null });
  });

  it("does not clear what the editor never loaded", () => {
    // The admin list holds summaries without captions. Diffing against the
    // same object the editor started from never sends a null for them.
    const summary = fromApiEpisode({
      ...platformRow,
      captionsEn: undefined,
      captionsEs: undefined,
    });
    expect(toEpisodePatch(summary, { ...summary, titleEn: "T" })).toEqual({
      titleEn: "T",
    });
  });
});
