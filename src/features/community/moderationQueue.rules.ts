import { flagDetail } from "./moderation";
import type { HeldItem, HeldKind, HeldStatus } from "./community.types";

/* ==========================================================================
   Moderation queue — pure rules
   --------------------------------------------------------------------------
   What is held, what a moderator's decision does to it, and which held
   items a given member is allowed to see.

   Nothing here decides whether text is publishable — that is moderation.ts.
   These rules only move an already-judged item through the queue.
   ========================================================================== */

export interface HeldDraft {
  kind: HeldKind;
  postId: string;
  author: string;
  content: string;
  categoryId?: string;
}

/**
 * Park a piece of text for review.
 *
 * Returns null when the text would not have been held at all, so a caller
 * cannot accidentally queue something that was fine — the queue is meant to
 * be short enough that a human actually reads it.
 */
export function buildHeldItem(
  draft: HeldDraft,
  id: string,
  now = new Date(),
): HeldItem | null {
  const detail = flagDetail(draft.content);
  if (!detail) return null;

  return {
    id,
    kind: draft.kind,
    postId: draft.kind === "reply" ? draft.postId : "",
    author: draft.author,
    content: draft.content.trim(),
    reason: detail.category,
    level: detail.level,
    matchedPhrase: detail.phrase,
    softenedByContext: detail.softenedByContext,
    status: "pending",
    submittedAt: now.toISOString(),
    categoryId: draft.categoryId,
  };
}

export function applyDecision(
  items: HeldItem[],
  id: string,
  status: Exclude<HeldStatus, "pending">,
  by?: string,
  note?: string,
  now = new Date(),
): HeldItem[] {
  return items.map((item) =>
    item.id === id
      ? {
          ...item,
          status,
          decidedAt: now.toISOString(),
          decidedBy: by,
          decisionNote: note,
        }
      : item,
  );
}

export function withoutHeldItem(items: HeldItem[], id: string): HeldItem[] {
  return items.filter((item) => item.id !== id);
}

/**
 * Level 1 first, then oldest first inside each level.
 *
 * A possible emergency must not sit behind yesterday's name-calling just
 * because the name-calling arrived earlier. Within a level the order is
 * stable and chronological, so a queue worked top-down does not reshuffle
 * underneath the person working it.
 */
export function pendingItems(items: HeldItem[]): HeldItem[] {
  return items
    .filter((item) => item.status === "pending")
    .sort(
      (a, b) => a.level - b.level || a.submittedAt.localeCompare(b.submittedAt),
    );
}

/** How many level 1 findings are still waiting. */
export function urgentPendingCount(items: HeldItem[]): number {
  return items.reduce(
    (total, item) =>
      item.status === "pending" && item.level === 1 ? total + 1 : total,
    0,
  );
}

export function decidedItems(items: HeldItem[]): HeldItem[] {
  return items
    .filter((item) => item.status !== "pending")
    .sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? ""));
}

/**
 * The held replies under one post that `viewer` may see.
 *
 * A pending or rejected item is shown to the member who wrote it and to
 * nobody else — that is the whole point of holding it. An approved one is
 * on the board and is returned for everyone.
 */
export function visibleHeldReplies(
  items: HeldItem[],
  postId: string,
  viewer: string,
): HeldItem[] {
  return items
    .filter((item) => item.kind === "reply" && item.postId === postId)
    .filter((item) => item.status === "approved" || item.author === viewer)
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

/** Approved held posts, for merging back into the feed. */
export function approvedPosts(items: HeldItem[]): HeldItem[] {
  return items
    .filter((item) => item.kind === "post" && item.status === "approved")
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function pendingCount(items: HeldItem[]): number {
  return items.reduce(
    (total, item) => (item.status === "pending" ? total + 1 : total),
    0,
  );
}
