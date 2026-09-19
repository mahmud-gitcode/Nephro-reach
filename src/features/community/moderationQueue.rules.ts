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
    matchedPhrase: detail.phrase,
    status: "pending",
    submittedAt: now.toISOString(),
    categoryId: draft.categoryId,
  };
}

export function applyDecision(
  items: HeldItem[],
  id: string,
  status: Exclude<HeldStatus, "pending">,
  now = new Date(),
): HeldItem[] {
  return items.map((item) =>
    item.id === id ? { ...item, status, decidedAt: now.toISOString() } : item,
  );
}

export function withoutHeldItem(items: HeldItem[], id: string): HeldItem[] {
  return items.filter((item) => item.id !== id);
}

/** Oldest first: a queue a moderator works top-down should not reshuffle. */
export function pendingItems(items: HeldItem[]): HeldItem[] {
  return items
    .filter((item) => item.status === "pending")
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
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
