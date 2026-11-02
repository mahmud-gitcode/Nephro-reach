import { describe, expect, it } from "vitest";
import {
  pendingCount,
  pendingItems,
  urgentPendingCount,
} from "./moderationQueue.rules";
import type { HeldItem } from "./community.types";

/* The queue behind the community board. The server holds every post and
 * records every decision (Phase 12); these rules only read a loaded page. */

const held = (patch: Partial<HeldItem> = {}): HeldItem => ({
  id: "h1",
  kind: "post",
  postId: "",
  author: "Test Member",
  content: "Die already",
  reason: "conduct",
  level: 3,
  matchedPhrase: "die already",
  status: "pending",
  submittedAt: "2026-09-19T10:00:00.000Z",
  ...patch,
});

describe("working the queue", () => {
  it("lists pending oldest first within a level", () => {
    const items = [
      held({ id: "late", submittedAt: "2026-09-19T11:00:00.000Z" }),
      held({ id: "early", submittedAt: "2026-09-19T09:00:00.000Z" }),
      held({ id: "done", status: "approved" }),
    ];
    expect(pendingItems(items).map((item) => item.id)).toEqual([
      "early",
      "late",
    ]);
  });

  it("puts a possible emergency ahead of older name-calling", () => {
    // A level 1 must not sit behind yesterday's level 3 just because the
    // level 3 arrived first (a merged "load more" page keeps the order).
    const items = [
      held({
        id: "old-conduct",
        level: 3,
        submittedAt: "2026-09-18T09:00:00.000Z",
      }),
      held({
        id: "new-emergency",
        level: 1,
        reason: "emergency",
        submittedAt: "2026-09-19T15:00:00.000Z",
      }),
      held({
        id: "concern",
        level: 2,
        reason: "access",
        submittedAt: "2026-09-18T10:00:00.000Z",
      }),
    ];
    expect(pendingItems(items).map((item) => item.id)).toEqual([
      "new-emergency",
      "concern",
      "old-conduct",
    ]);
  });

  it("counts the level 1 findings still waiting", () => {
    const items = [
      held({ id: "a", level: 1, reason: "emergency" }),
      held({ id: "b", level: 1, reason: "crisis", status: "approved" }),
      held({ id: "c", level: 3 }),
    ];
    expect(urgentPendingCount(items)).toBe(1);
  });

  it("counts only what is still waiting", () => {
    expect(pendingCount([held(), held({ id: "h2", status: "approved" })])).toBe(
      1,
    );
  });
});
