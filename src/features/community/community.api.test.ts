import { describe, expect, it } from "vitest";
import {
  fromApiBoardPost,
  fromApiModerationPost,
  isCategoryId,
  postedLabel,
  type ApiModerationPost,
} from "./community.api";
import { scaledSize } from "./photo";

/* Community against the API (Phase 12). Synthetic posts only. */

describe("a board post", () => {
  it("maps the server's post to the card, with the server's count and like", () => {
    const post = fromApiBoardPost(
      {
        id: "p1",
        authorName: "Test M.",
        categoryId: "dialysis",
        body: "First paragraph.\n\nSecond paragraph.",
        hasImage: true,
        likeCount: 3,
        likedByMe: true,
        mine: false,
        submittedAt: "2026-11-02T10:00:00.000Z",
      },
      { badge: "Member", isEs: false, now: new Date("2026-11-02T12:00:00Z") },
    );
    expect(post).toEqual({
      id: "p1",
      author: "Test M.",
      badge: "Member",
      time: "Posted 2h ago",
      paragraphs: ["First paragraph.", "Second paragraph."],
      hashtags: "",
      likes: 3,
      categoryId: "dialysis",
      hasImage: true,
      liked: true,
      mine: false,
    });
  });

  it("knows the six categories and nothing else", () => {
    for (const id of [
      "general",
      "dialysis",
      "transplant",
      "nutrition",
      "caregiver",
      "recipes",
    ])
      expect(isCategoryId(id)).toBe(true);
    expect(isCategoryId("all")).toBe(false);
    expect(isCategoryId("admin")).toBe(false);
  });

  it("says when, in either language", () => {
    const now = new Date("2026-11-02T12:00:00Z");
    expect(postedLabel("2026-11-02T11:59:50Z", false, now)).toBe("Just now");
    expect(postedLabel("2026-11-01T12:00:00Z", false, now)).toBe(
      "Posted yesterday",
    );
    expect(postedLabel("2026-10-30T12:00:00Z", true, now)).toBe(
      "Publicado hace 3 días",
    );
    expect(postedLabel("not a date", false, now)).toBe("");
  });
});

describe("a held post for moderators", () => {
  const row: ApiModerationPost = {
    id: "h1",
    authorId: "u1",
    authorName: "Test Member",
    categoryId: "general",
    body: "I have chest pain",
    hasImage: false,
    status: "pending",
    flagReason: "emergency",
    flagLevel: 1,
    matchedPhrase: "chest pain",
    softenedByContext: false,
    submittedAt: "2026-11-02T10:00:00.000Z",
    decidedById: null,
    decidedAt: null,
    decisionNote: null,
  };

  it("keeps the level, reason and phrase the server's screen found", () => {
    expect(fromApiModerationPost(row)).toMatchObject({
      kind: "post",
      level: 1,
      reason: "emergency",
      matchedPhrase: "chest pain",
      status: "pending",
    });
  });

  it("records who decided as an id, never a typed name", () => {
    const decided = fromApiModerationPost({
      ...row,
      status: "rejected",
      decidedById: "admin-1",
      decidedAt: "2026-11-02T11:00:00.000Z",
      decisionNote: "Not for the board",
    });
    expect(decided).toMatchObject({
      status: "rejected",
      decidedById: "admin-1",
      decisionNote: "Not for the board",
    });
    expect(decided).not.toHaveProperty("decidedBy");
  });

  it("reads routine posts as level 4 and unknown values safely", () => {
    expect(
      fromApiModerationPost({ ...row, flagReason: "routine", flagLevel: 4 }),
    ).toMatchObject({ reason: "routine", level: 4 });
    expect(
      fromApiModerationPost({
        ...row,
        flagReason: "new-kind",
        flagLevel: 9,
        status: "odd",
        authorName: null,
      }),
    ).toMatchObject({
      reason: "routine",
      level: 4,
      status: "pending",
      author: "Member",
    });
  });
});

describe("a photo before upload", () => {
  it("shrinks the long edge to 1280 and keeps the shape", () => {
    expect(scaledSize(4000, 3000)).toEqual({ width: 1280, height: 960 });
    expect(scaledSize(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
