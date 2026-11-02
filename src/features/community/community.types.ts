/* The board: tabs and posts. There are no replies (client decision,
   2026-09): a positive board, not a chat. */

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
  /** A photo with the post (client, 2026-10-05). Its link is fetched on
      demand from the server (`GET /community/posts/:id/image`), never
      stored. */
  hasImage?: boolean;
  /** The server's answer: whether the signed-in member liked it. */
  liked?: boolean;
  /** The signed-in member wrote it. */
  mine?: boolean;
};

import type { FlagCategory, FlagLevel } from "./moderation";

/* ==========================================================================
   The moderation queue
   --------------------------------------------------------------------------
   A post the server is holding for a moderator to read (every post is held,
   client 2026-10-05). It is a separate shape from PostItem on purpose: a
   held item is not on the board, and giving it the same type as something
   that IS on the board is how held content gets rendered by accident.
   ========================================================================== */

export type HeldKind = "post";

export type HeldStatus = "pending" | "approved" | "rejected";

export type HeldItem = {
  id: string;
  kind: HeldKind;
  /** Always empty: posts reply to nothing. */
  postId: string;
  /** Who wrote it: the full profile name, for the team only. */
  author: string;
  content: string;
  /** Which category held it, and the phrase that fired — moderators need
      to see what the screen caught, not just that it caught something.
      "routine" when nothing was caught. */
  reason: FlagCategory | "routine";
  /** 1 emergency · 2 care-team concern · 3 community · 4 routine. Drives
      queue order (the server orders the pending page). */
  level: FlagLevel | 4;
  matchedPhrase: string;
  /** True when the wording placed it in the past and the tier was eased. */
  softenedByContext?: boolean;
  status: HeldStatus;
  submittedAt: string;
  decidedAt?: string;
  /* Audit trail, kept by the server: the account that decided (an id, not
     a name) and the note or reason it wrote down. */
  decidedById?: string;
  decisionNote?: string;
  categoryId?: string;
  hasImage?: boolean;
};
