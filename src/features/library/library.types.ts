/* ==========================================================================
   My Library — types
   --------------------------------------------------------------------------
   The Library is not the Classroom. The Classroom is one ordered course a
   member works through day by day; the Library is loose reference material
   they drop into when a question comes up — a two-minute video, a handout to
   print, a short article. Nothing here is sequenced, nothing is required,
   and nothing gates anything else.

   Every member-facing string ships in both languages (`*En` / `*Es`) so the
   language toggle never has to refetch, exactly as the journey content does.
   ========================================================================== */

/** How a resource is consumed. Drives the icon and the detail layout. */
export type LibraryKind = "video" | "document" | "article";

/** Topic buckets the filter row is built from. */
export type LibraryCategory =
  | "general"
  | "dialysis-basics"
  | "nutrition"
  | "labs"
  | "access-care"
  | "medications"
  | "emergencies"
  | "living-well";

export interface LibraryResource {
  id: string;
  /** URL segment, e.g. /dashboard/my-library/what-is-a-fistula. */
  slug: string;
  kind: LibraryKind;
  category: LibraryCategory;
  titleEn: string;
  titleEs: string;
  summaryEn: string;
  summaryEs: string;
  /** Poster for videos, cover for everything else. */
  poster: string;
  /** Videos only. Drop a matching file in `public/videos/` and it plays. */
  videoSrc?: string;
  /** Videos only. Runtime in seconds — most of these are 90-120s. */
  durationSeconds?: number;
  /** Documents only. A file under `public/documents/`. */
  fileSrc?: string;
  /** Documents only, e.g. "PDF · 2 pages". */
  fileMetaEn?: string;
  fileMetaEs?: string;
  /** Articles only. One entry per paragraph. */
  bodyEn?: string[];
  bodyEs?: string[];
  /** Articles only. Rough read time in minutes. */
  readMinutes?: number;
  /** ISO date the resource was published. Newest sorts first. */
  publishedAt: string;
  /**
   * Draft resources are visible to admins only. An admin uploading a video
   * on Monday for a Friday announcement should not have it appear on every
   * member shelf the moment the file finishes reading.
   */
  published: boolean;
}

/** Slugs the member has saved, newest first. */
export type LibrarySavedList = string[];
