/* ==========================================================================
   Dialysis Table Talk — types
   --------------------------------------------------------------------------
   A curated conversation series: short videos with a host and a guest, about
   living on dialysis. It is not the Classroom (an ordered course) and not the
   Library (loose reference material) — it is episodes, and it is deliberately
   separate from Community, which is where members talk to each other.

   Everything here is content an admin enters. Nothing about an episode is
   hard-coded, including its categories: the brief is that NephroReach can
   publish a new episode without a developer, and a hard-coded category list
   breaks that promise the first time a new topic comes up.
   ========================================================================== */

export interface Speaker {
  id: string;
  name: string;
  /** "Nephrologist", "Renal Dietitian", "Patient Advocate". */
  role: string;
}

/** Who an episode is aimed at. Drives the Patients / Caregivers filters. */
export type EpisodeAudience = "patients" | "caregivers" | "both";

/**
 * Where an episode is in its life.
 *
 * `scheduled` is separate from `draft` because they fail differently: a draft
 * is unfinished, a scheduled episode is finished and waiting for its date.
 * Only `published` — and a `scheduled` one whose date has passed — reaches a
 * member.
 */
export type EpisodeStatus = "draft" | "scheduled" | "published" | "archived";

export interface EpisodeCaptions {
  /** WebVTT text, as uploaded. Parsed with features/education/vtt.ts. */
  en?: string;
  es?: string;
}

export interface TableTalkEpisode {
  id: string;
  /** URL segment, e.g. /dashboard/table-talk/travel-dialysis. */
  slug: string;

  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;

  speakers: Speaker[];
  /** Many, not one: an episode can be both "Travel" and "Ask the Expert". */
  categoryIds: string[];
  audience: EpisodeAudience;

  thumbnail: string;
  /** Drop a file in `public/videos/` and the player plays it. */
  videoSrc?: string;
  durationSeconds?: number;

  captions: EpisodeCaptions;
  /** Plain text, shown beside the player when present. */
  transcriptEn?: string;
  transcriptEs?: string;

  /** Under three minutes. Drives the "Short Videos" filter. */
  isShort: boolean;
  /** A recording of a live session, or an upcoming one. */
  isLiveEvent: boolean;

  /** At most one episode is featured; the rules enforce it. */
  featured: boolean;

  status: EpisodeStatus;
  /** ISO `yyyy-mm-dd`. A scheduled episode appears on this day. */
  publishAt?: string;
  /** ISO `yyyy-mm-dd`. What members see as the publication date. */
  publishedAt: string;

  /** Admin ordering. Lower comes first within the same status. */
  order: number;
}

export interface TableTalkCategory {
  id: string;
  labelEn: string;
  labelEs: string;
  order: number;
  /** Archived categories keep existing episodes but take no new ones. */
  archived: boolean;
}

/* ==========================================================================
   Suggested questions
   --------------------------------------------------------------------------
   A member asks what they would like a future episode to cover. This is not
   clinical messaging, and a submitted question never becomes public on its
   own — an admin reads every one.
   ========================================================================== */

export type QuestionStatus =
  "new" | "reviewed" | "planned" | "answered" | "declined";

export interface TableTalkQuestion {
  id: string;
  body: string;
  /** Who asked, so an admin can follow up through the proper channel. */
  askedByName: string;
  askedByEmail: string;
  submittedAt: string;
  status: QuestionStatus;
  /** Admin-only. Never rendered on a member screen. */
  adminNote: string;
}
