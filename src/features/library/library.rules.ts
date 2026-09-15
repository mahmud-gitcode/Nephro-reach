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
