/* ==========================================================================
   Community <-> the API (Phase 12)
   --------------------------------------------------------------------------
   The board, the composer, likes and the moderation queue are the server's
   (`BE/modules/content`). The server screens every post and ALWAYS holds it
   for a moderator; its answer carries the safety guidance (911/988 tiers)
   and the privacy notice that the member must see. The client screen in
   moderation.ts stays only as a hint before posting.

   - member: GET /community/posts, POST /community/posts,
     GET /community/posts/:id/image, PUT|DELETE /me/community/likes/:id
   - moderators (platform content, Manage): GET /platform/content/community/
     posts, …/:id/image, POST …/:id/approve { note? }, …/:id/reject { reason }

   Posts are a user's, not a patient's: no patient scope and no office
   header. There are no replies (client decision, 2026-09).
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import type { FlagCategory } from "./moderation";
import type { HeldItem, HeldStatus, PostItem } from "./community.types";

/** The six board categories, the same ids as the server's. */
export const COMMUNITY_CATEGORY_IDS = [
  "general",
  "dialysis",
  "transplant",
  "nutrition",
  "caregiver",
  "recipes",
] as const;
export type CommunityCategoryId = (typeof COMMUNITY_CATEGORY_IDS)[number];

export function isCategoryId(value: string): value is CommunityCategoryId {
  return (COMMUNITY_CATEGORY_IDS as readonly string[]).includes(value);
}

/** GET /community/posts: approved posts only. */
export type ApiBoardPost = {
  id: string;
  authorName: string;
  categoryId: string;
  body: string;
  hasImage: boolean;
  likeCount: number;
  likedByMe: boolean;
  mine: boolean;
  submittedAt: string;
};

/** The author's own post, as POST /community/posts returns it. */
export type ApiMyPost = {
  id: string;
  categoryId: string;
  body: string;
  hasImage: boolean;
  status: string;
  likeCount: number;
  submittedAt: string;
  decidedAt: string | null;
};

export type ApiSafety = {
  tier: string;
  tone: string;
  offersEmergencyCall: boolean;
  titleEn: string;
  titleEs: string;
  bodyEn: string;
  bodyEs: string;
};

export type ApiNotice = {
  titleEn: string;
  titleEs: string;
  bodyEn: string;
  bodyEs: string;
};

export type ApiCreatePostReply = {
  post: ApiMyPost;
  safety: ApiSafety | null;
  privacyNotice: ApiNotice | null;
};

/** GET /platform/content/community/posts */
export type ApiModerationPost = {
  id: string;
  authorId: string;
  authorName: string | null;
  categoryId: string;
  body: string;
  hasImage: boolean;
  status: string;
  flagReason: string;
  flagLevel: number;
  matchedPhrase: string;
  softenedByContext: boolean;
  submittedAt: string;
  decidedById: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
};

export type ApiFileLink = { url: string; expiresIn: number };

const FLAG_REASONS: readonly (FlagCategory | "routine")[] = [
  "emergency",
  "crisis",
  "access",
  "symptom",
  "medical-advice",
  "conduct",
  "scam",
  "privacy",
  "routine",
];

/** A relative "posted …" label from the server's time. */
export function postedLabel(
  iso: string,
  isEs: boolean,
  now: Date = new Date(),
): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const minutes = Math.max(0, Math.round((now.getTime() - at.getTime()) / 6e4));
  if (minutes < 1) return isEs ? "Recién publicado" : "Just now";
  if (minutes < 60)
    return isEs ? `Publicado hace ${minutes} min` : `Posted ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24)
    return isEs ? `Publicado hace ${hours} h` : `Posted ${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return isEs ? "Publicado ayer" : "Posted yesterday";
  if (days < 7)
    return isEs ? `Publicado hace ${days} días` : `Posted ${days} days ago`;
  return at.toLocaleDateString(isEs ? "es-ES" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** A board post in the card's shape. The server sends no badge and no
 *  hashtags: the badge is the dictionary's "Member", and hashtags were a
 *  sample-only field. */
export function fromApiBoardPost(
  row: ApiBoardPost,
  labels: { badge: string; isEs: boolean; now?: Date },
): PostItem {
  return {
    id: row.id,
    author: row.authorName,
    badge: labels.badge,
    time: postedLabel(row.submittedAt, labels.isEs, labels.now),
    paragraphs: row.body
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean),
    hashtags: "",
    likes: row.likeCount,
    categoryId: row.categoryId,
    hasImage: row.hasImage,
    liked: row.likedByMe,
    mine: row.mine,
  };
}

function toHeldStatus(value: string): HeldStatus {
  return value === "approved" || value === "rejected" ? value : "pending";
}

export function fromApiModerationPost(row: ApiModerationPost): HeldItem {
  const reason = (FLAG_REASONS as readonly string[]).includes(row.flagReason)
    ? (row.flagReason as HeldItem["reason"])
    : "routine";
  const level = [1, 2, 3, 4].includes(row.flagLevel)
    ? (row.flagLevel as HeldItem["level"])
    : 4;
  return {
    id: row.id,
    kind: "post",
    postId: "",
    author: row.authorName ?? "Member",
    content: row.body,
    reason,
    level,
    matchedPhrase: row.matchedPhrase,
    softenedByContext: row.softenedByContext,
    status: toHeldStatus(row.status),
    submittedAt: row.submittedAt,
    decidedAt: row.decidedAt ?? undefined,
    /* An id, not a name: the server records who decided. The screen says
       "a moderator" (or "you") rather than inventing a name. */
    decidedById: row.decidedById ?? undefined,
    decisionNote: row.decisionNote ?? undefined,
    categoryId: row.categoryId,
    hasImage: row.hasImage,
  };
}

const enc = encodeURIComponent;

export const listBoardPosts = (
  categoryId: CommunityCategoryId | null,
  params: PageParams,
) =>
  fetchPage<ApiBoardPost>("/community/posts", params, {
    query: { categoryId: categoryId ?? undefined },
  });

export type CreatePostBody = {
  categoryId: CommunityCategoryId;
  body: string;
  imageFileId?: string;
};

export const createPost = (body: CreatePostBody) =>
  api<ApiCreatePostReply>("/community/posts", { method: "POST", body });

export const postImage = (postId: string) =>
  api<ApiFileLink>(`/community/posts/${enc(postId)}/image`);

/** Explicit like or unlike, never a toggle: a double tap cannot flip it
 *  back, and the server's count is what shows. */
export const setLike = (postId: string, liked: boolean) =>
  api<unknown>(`/me/community/likes/${enc(postId)}`, {
    method: liked ? "PUT" : "DELETE",
  });

/** "decided" lists approved and rejected together (spec 050). */
export type ModerationTab = "pending" | "decided";

export const listModerationPosts = (
  status: ModerationTab,
  params: PageParams,
) =>
  fetchPage<ApiModerationPost>("/platform/content/community/posts", params, {
    query: { status },
  });

export const moderationImage = (postId: string) =>
  api<ApiFileLink>(`/platform/content/community/posts/${enc(postId)}/image`);

export const approvePost = (postId: string, note?: string) =>
  api<ApiModerationPost>(
    `/platform/content/community/posts/${enc(postId)}/approve`,
    { method: "POST", body: note?.trim() ? { note: note.trim() } : {} },
  );

export const rejectPost = (postId: string, reason: string) =>
  api<ApiModerationPost>(
    `/platform/content/community/posts/${enc(postId)}/reject`,
    { method: "POST", body: { reason: reason.trim() } },
  );
