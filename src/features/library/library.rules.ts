import type {
  LibraryCategory,
  LibraryKind,
  LibraryResource,
} from "./library.types";

/* ==========================================================================
   My Library — pure rules
   --------------------------------------------------------------------------
   Filtering, sorting and formatting live here as plain functions so the page
   only wires them to controls, and so they can be tested without a DOM.
   ========================================================================== */

export interface LibraryFilter {
  /** Free text matched against title and summary, in both languages. */
  search: string;
  kind: LibraryKind | "all";
  category: LibraryCategory | "all";
  /** Narrow to what the member has saved. */
  savedOnly: boolean;
}

export const EMPTY_FILTER: LibraryFilter = {
  search: "",
  kind: "all",
  category: "all",
  savedOnly: false,
};

function matchesSearch(resource: LibraryResource, search: string): boolean {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  /* Both languages are searched whichever toggle is active: a member who
     types "potasio" while the UI sits in English still means that video. */
  return [
    resource.titleEn,
    resource.titleEs,
    resource.summaryEn,
    resource.summaryEs,
  ].some((field) => field.toLowerCase().includes(term));
}

export function filterResources(
  resources: LibraryResource[],
  filter: LibraryFilter,
  saved: string[],
): LibraryResource[] {
  return resources.filter((resource) => {
    if (filter.kind !== "all" && resource.kind !== filter.kind) return false;
    if (filter.category !== "all" && resource.category !== filter.category)
      return false;
    if (filter.savedOnly && !saved.includes(resource.slug)) return false;
    return matchesSearch(resource, filter.search);
  });
}

/** Newest first. Ties fall back to the slug so the order never flickers. */
export function sortByNewest(resources: LibraryResource[]): LibraryResource[] {
  return [...resources].sort((a, b) =>
    a.publishedAt === b.publishedAt
      ? a.slug.localeCompare(b.slug)
      : b.publishedAt.localeCompare(a.publishedAt),
  );
}

export function findBySlug(
  resources: LibraryResource[],
  slug: string,
): LibraryResource | undefined {
  return resources.find((resource) => resource.slug === slug);
}

/** Same category, never the resource itself, at most `limit` of them. */
export function relatedTo(
  resources: LibraryResource[],
  resource: LibraryResource,
  limit = 3,
): LibraryResource[] {
  return sortByNewest(
    resources.filter(
      (candidate) =>
        candidate.category === resource.category &&
        candidate.slug !== resource.slug,
    ),
  ).slice(0, limit);
}

export function toggleSaved(saved: string[], slug: string): string[] {
  return saved.includes(slug)
    ? saved.filter((entry) => entry !== slug)
    : [slug, ...saved];
}

/** 95 -> "1:35". Videos here are short enough that hours never appear. */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

/** "2026-08-04" -> "Aug 4, 2026" / "4 ago 2026", without a date library. */
export function formatPublished(iso: string, isEs: boolean): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(isEs ? "es-ES" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ==========================================================================
   Admin-side rules
   --------------------------------------------------------------------------
   The shelf an admin edits and the shelf a member reads are the same array.
   The only thing separating them is `published`, so that filter lives here
   rather than in a component where it could be forgotten on one screen.
   ========================================================================== */

/** What a member is allowed to see. Drafts belong to the admin only. */
export function publishedOnly(resources: LibraryResource[]): LibraryResource[] {
  return resources.filter((resource) => resource.published);
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * A title becomes the URL a member lands on, so the slug is derived rather
 * than typed: accents folded, punctuation dropped, spaces hyphenated.
 */
export function slugify(title: string): string {
  return (
    title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "untitled"
  );
}

/**
 * Two resources may not share a slug — the second would be unreachable,
 * because the member route resolves by slug and returns the first match.
 */
export function uniqueSlug(
  resources: LibraryResource[],
  title: string,
  ownId: string,
): string {
  const base = slugify(title);
  const taken = new Set(
    resources.filter((entry) => entry.id !== ownId).map((entry) => entry.slug),
  );
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

/** A blank resource for the "Add resource" form. Starts as a draft. */
export function emptyResource(): LibraryResource {
  return {
    id: createId("lib"),
    slug: "",
    kind: "video",
    category: "dialysis-basics",
    titleEn: "",
    titleEs: "",
    summaryEn: "",
    summaryEs: "",
    poster: "/images/Class.jpg",
    published: false,
    publishedAt: new Date().toISOString().slice(0, 10),
  };
}

/**
 * Insert or replace by id, re-deriving the slug from the current title so a
 * renamed resource does not keep a URL that contradicts it.
 */
export function upsertResource(
  resources: LibraryResource[],
  resource: LibraryResource,
): LibraryResource[] {
  const withSlug: LibraryResource = {
    ...resource,
    slug: uniqueSlug(
      resources,
      resource.titleEn || resource.titleEs,
      resource.id,
    ),
  };
  const index = resources.findIndex((entry) => entry.id === resource.id);
  if (index === -1) return [withSlug, ...resources];

  const next = [...resources];
  next[index] = withSlug;
  return next;
}

export function removeResource(
  resources: LibraryResource[],
  id: string,
): LibraryResource[] {
  return resources.filter((resource) => resource.id !== id);
}

/**
 * Publishing stamps the date, so "newest first" on the member shelf means
 * newest to them rather than whenever the draft was first started.
 */
export function setPublished(
  resources: LibraryResource[],
  id: string,
  published: boolean,
  today = new Date().toISOString().slice(0, 10),
): LibraryResource[] {
  return resources.map((resource) =>
    resource.id === id
      ? {
          ...resource,
          published,
          publishedAt: published ? today : resource.publishedAt,
        }
      : resource,
  );
}

/** What the admin list needs above the table. */
export function libraryTotals(resources: LibraryResource[]) {
  return {
    total: resources.length,
    published: resources.filter((resource) => resource.published).length,
    drafts: resources.filter((resource) => !resource.published).length,
    videos: resources.filter((resource) => resource.kind === "video").length,
    documents: resources.filter((resource) => resource.kind === "document")
      .length,
    articles: resources.filter((resource) => resource.kind === "article")
      .length,
  };
}

/* ==========================================================================
   The composer
   --------------------------------------------------------------------------
   An admin posts to the Library the way anyone posts anywhere: write
   something, attach a file, post. There is no title field, no summary field
   and no body field on screen — the caption is all three, split the way a
   reader already reads it.

       first line      the title on the card
       next paragraph  the summary under it
       the rest        the body on the resource page

   That split is here, as a pure function, because it has to run in reverse
   too: opening a post to edit rebuilds the caption from the pieces, and a
   round trip that loses a paragraph would lose someone's writing.
   ========================================================================== */

/** What the composer holds while someone is typing. */
export interface LibraryDraft {
  caption: string;
  captionEs: string;
  kind: LibraryKind;
  category: LibraryCategory;
  poster: string;
  videoSrc?: string;
  durationSeconds?: number;
  fileSrc?: string;
  fileMetaEn?: string;
  fileMetaEs?: string;
}

/** Paragraph-split on blank lines, the way the text was typed. */
export function splitCaption(caption: string): string[] {
  return caption
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** A title is one line. A caption that opens with a paragraph gets trimmed. */
function titleFrom(caption: string): string {
  const firstLine = caption.trim().split("\n")[0]?.trim() ?? "";
  if (firstLine.length <= 90) return firstLine;
  return `${firstLine.slice(0, 87).trimEnd()}…`;
}

/** 200 words a minute, rounded, never zero. */
export function estimateReadMinutes(paragraphs: string[]): number {
  const words = paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Title / summary / body out of one block of text. */
function partsFrom(caption: string) {
  const trimmed = caption.trim();
  if (!trimmed) return { title: "", summary: "", body: [] as string[] };

  const lines = trimmed.split("\n");
  const title = titleFrom(trimmed);
  /* Everything after the first line, re-joined so paragraph breaks survive. */
  const rest = splitCaption(lines.slice(1).join("\n"));

  return { title, summary: rest[0] ?? "", body: rest.slice(1) };
}

export function emptyDraft(): LibraryDraft {
  return {
    caption: "",
    captionEs: "",
    kind: "article",
    category: "general",
    poster: "/images/Class.jpg",
  };
}

/**
 * A post, ready to save. Posting publishes: there is no draft step in a
 * composer, and a Post button that quietly did nothing visible would be the
 * cruellest control on the screen.
 */
export function composeResource(
  draft: LibraryDraft,
  existing?: LibraryResource,
  today = new Date().toISOString().slice(0, 10),
): LibraryResource {
  const en = partsFrom(draft.caption);
  const es = partsFrom(draft.captionEs);
  const body = [en.summary, ...en.body].filter(Boolean);

  return {
    id: existing?.id ?? createId("lib"),
    /* upsertResource re-derives this from the title; a new post has no slug
       until it gets there. */
    slug: existing?.slug ?? "",
    kind: draft.kind,
    category: draft.category,
    titleEn: en.title,
    titleEs: es.title,
    summaryEn: en.summary,
    summaryEs: es.summary,
    poster: draft.poster,
    videoSrc: draft.videoSrc,
    durationSeconds: draft.durationSeconds,
    fileSrc: draft.fileSrc,
    fileMetaEn: draft.fileMetaEn,
    fileMetaEs: draft.fileMetaEs,
    bodyEn: en.body,
    bodyEs: es.body,
    readMinutes: body.length > 0 ? estimateReadMinutes(body) : undefined,
    published: true,
    publishedAt: existing?.published ? existing.publishedAt : today,
  };
}

/** The reverse: a saved post reopened in the composer, text intact. */
export function draftFrom(resource: LibraryResource): LibraryDraft {
  const join = (title: string, summary: string, body: string[] | undefined) =>
    [title, summary, ...(body ?? [])].filter(Boolean).join("\n\n");

  return {
    caption: join(resource.titleEn, resource.summaryEn, resource.bodyEn),
    captionEs: join(resource.titleEs, resource.summaryEs, resource.bodyEs),
    kind: resource.kind,
    category: resource.category,
    poster: resource.poster,
    videoSrc: resource.videoSrc,
    durationSeconds: resource.durationSeconds,
    fileSrc: resource.fileSrc,
    fileMetaEn: resource.fileMetaEn,
    fileMetaEs: resource.fileMetaEs,
  };
}

/** A post needs words. Everything else — file, topic, Spanish — is optional. */
export function canPost(draft: LibraryDraft): boolean {
  return draft.caption.trim().length > 0;
}
