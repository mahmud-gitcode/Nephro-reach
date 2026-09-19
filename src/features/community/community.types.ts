/* The board: tabs, posts and the replies under them. */

export type CommunityTab = {
  id: string;
  label: string;
};

export type PostItem = {
  id: string;
  author: string;
  badge: string;
  time: string;
  paragraphs: string[];
  hashtags: string;
  likes: number;
  categoryId: string;
};

export type ReplyItem = {
  id: string;
  postId: string;
  author: string;
  avatar?: string;
  time: string;
  badge?: string;
  content: string;
  likes?: number;
};

/* ==========================================================================
   The moderation queue
   --------------------------------------------------------------------------
   Something a member wrote that the auto-screen would not publish, parked
   for a moderator to read. It is a separate shape from PostItem/ReplyItem on
   purpose: a held item is not on the board, and giving it the same type as
   something that IS on the board is how held content gets rendered by
   accident.
   ========================================================================== */

export type HeldKind = "post" | "reply";

export type HeldStatus = "pending" | "approved" | "rejected";

export type HeldItem = {
  id: string;
  kind: HeldKind;
  /** The post this replies to. Empty string when `kind` is "post". */
  postId: string;
  /** Who wrote it, as the board would have shown them. */
  author: string;
  content: string;
  /** Which category held it, and the phrase that fired — moderators need
      to see what the screen caught, not just that it caught something. */
  reason: "harassment" | "medical";
  matchedPhrase: string;
  status: HeldStatus;
  submittedAt: string;
  decidedAt?: string;
  /** Category chosen in the composer, carried so an approved post lands in
      the tab the member picked. */
  categoryId?: string;
};
