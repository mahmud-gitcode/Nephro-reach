/* ==========================================================================
   My Library <-> the API (Phase 12)
   --------------------------------------------------------------------------
   - members: GET /library (published only; the server filters by kind,
     category, search and savedOnly), GET /library/:slug,
     PUT|DELETE /me/library/saves/:resourceId
   - the content team (platform content): GET /platform/content/library,
     POST, PATCH /:id, POST /:id/publish|unpublish, DELETE /:id

   The API names the media fields by what they are (`posterUrl`, `videoUrl`,
   `fileUrl`, `publishedOn`); the screens keep their own names (`poster`,
   `videoSrc`, `fileSrc`, `publishedAt`). The rename happens here, both ways,
   and nowhere else. The server makes the slug and the read time.

   Media uploads wait on D18 (a public storage host) and INT-16 (video size):
   a resource carries https or site-path URLs only, and never a data: URL.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import { displayableImage } from "./mediaDisplay";
import type {
  LibraryCategory,
  LibraryKind,
  LibraryResource,
} from "./library.types";

/** GET /library and /library/:slug */
export type ApiLibraryItem = {
  id: string;
  slug: string;
  kind: string;
  category: string;
  titleEn: string;
  titleEs: string;
  summaryEn: string;
  summaryEs: string;
  posterUrl: string;
  videoUrl: string | null;
  durationSeconds: number | null;
  fileUrl: string | null;
  fileMetaEn: string | null;
  fileMetaEs: string | null;
  bodyEn: string[];
  bodyEs: string[];
  readMinutes: number | null;
  publishedOn: string | null;
  saved?: boolean;
};

/** GET /platform/content/library */
export type ApiPlatformLibraryResource = Omit<ApiLibraryItem, "saved"> & {
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export const LIBRARY_KINDS: readonly LibraryKind[] = [
  "video",
  "document",
  "article",
  "image",
];
export const LIBRARY_CATEGORY_KEYS: readonly LibraryCategory[] = [
  "general",
  "dialysis-basics",
  "nutrition",
  "labs",
  "access-care",
  "medications",
  "emergencies",
  "living-well",
];

const toKind = (value: string): LibraryKind =>
  (LIBRARY_KINDS as readonly string[]).includes(value)
    ? (value as LibraryKind)
    : "article";
const toCategory = (value: string): LibraryCategory =>
  (LIBRARY_CATEGORY_KEYS as readonly string[]).includes(value)
    ? (value as LibraryCategory)
    : "general";

export const LIBRARY_PLACEHOLDER = "/images/Class.jpg";

/** A day as YYYY-MM-DD, without passing it through local time. */
export const toDay = (value: string | null | undefined): string =>
  (value ?? "").slice(0, 10);

export function fromApiLibraryItem(row: ApiLibraryItem): LibraryResource {
  return {
    id: row.id,
    slug: row.slug,
    kind: toKind(row.kind),
    category: toCategory(row.category),
    titleEn: row.titleEn,
    titleEs: row.titleEs ?? "",
    summaryEn: row.summaryEn ?? "",
    summaryEs: row.summaryEs ?? "",
    /* next/image can draw only site paths here (mediaDisplay.ts). */
    poster: displayableImage(row.posterUrl, LIBRARY_PLACEHOLDER),
    videoSrc: row.videoUrl ?? undefined,
    durationSeconds: row.durationSeconds ?? undefined,
    fileSrc: row.fileUrl ?? undefined,
    fileMetaEn: row.fileMetaEn ?? undefined,
    fileMetaEs: row.fileMetaEs ?? undefined,
    bodyEn: row.bodyEn ?? [],
    bodyEs: row.bodyEs ?? [],
    readMinutes: row.readMinutes ?? undefined,
    publishedAt: toDay(row.publishedOn),
    published: true,
    saved: Boolean(row.saved),
  };
}

export function fromApiPlatformResource(
  row: ApiPlatformLibraryResource,
): LibraryResource {
  return {
    ...fromApiLibraryItem(row),
    published: row.published,
    publishedAt: toDay(row.publishedOn ?? row.createdAt),
    saved: undefined,
  };
}

/** The server takes an https URL or a site path (MEDIA_URL_PATTERN). A
 *  data: URL or anything else is never sent. */
export function mediaUrl(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (v.length > 2048) return undefined;
  return /^(?:https:\/\/\S+|\/\S*)$/.test(v) ? v : undefined;
}

export type LibraryBody = {
  kind: LibraryKind;
  category: LibraryCategory;
  titleEn: string;
  titleEs?: string;
  summaryEn?: string;
  summaryEs?: string;
  posterUrl?: string;
  videoUrl?: string | null;
  durationSeconds?: number | null;
  fileUrl?: string | null;
  fileMetaEn?: string | null;
  fileMetaEs?: string | null;
  bodyEn?: string[];
  bodyEs?: string[];
};

/** The create body: only what is set. */
export function toLibraryBody(resource: LibraryResource): LibraryBody {
  const body: LibraryBody = {
    kind: resource.kind,
    category: resource.category,
    titleEn: resource.titleEn.trim(),
  };
  const text = (key: keyof LibraryBody, value: string | undefined) => {
    if (value?.trim()) (body as Record<string, unknown>)[key] = value.trim();
  };
  text("titleEs", resource.titleEs);
  text("summaryEn", resource.summaryEn);
  text("summaryEs", resource.summaryEs);
  const poster = mediaUrl(resource.poster);
  if (poster) body.posterUrl = poster;
  const video = mediaUrl(resource.videoSrc);
  if (video) body.videoUrl = video;
  if (resource.durationSeconds && resource.durationSeconds > 0)
    body.durationSeconds = Math.round(resource.durationSeconds);
  const file = mediaUrl(resource.fileSrc);
  if (file) body.fileUrl = file;
  text("fileMetaEn", resource.fileMetaEn);
  text("fileMetaEs", resource.fileMetaEs);
  if (resource.bodyEn?.length) body.bodyEn = resource.bodyEn;
  if (resource.bodyEs?.length) body.bodyEs = resource.bodyEs;
  return body;
}

const NULLABLE: readonly (keyof LibraryBody)[] = [
  "videoUrl",
  "durationSeconds",
  "fileUrl",
  "fileMetaEn",
  "fileMetaEs",
];

/** A PATCH sends only the fields that changed; a cleared optional media
 *  field is sent as null. Text fields cleared to empty are sent empty. */
export function toLibraryPatch(
  before: LibraryResource,
  after: LibraryResource,
): Partial<LibraryBody> {
  const a = toLibraryBody(before) as Record<string, unknown>;
  const b = toLibraryBody(after) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (JSON.stringify(a[key]) === JSON.stringify(b[key])) continue;
    if (b[key] !== undefined) patch[key] = b[key];
    else if ((NULLABLE as readonly string[]).includes(key)) patch[key] = null;
    else if (key === "bodyEn" || key === "bodyEs") patch[key] = [];
    else if (key !== "posterUrl") patch[key] = "";
  }
  return patch as Partial<LibraryBody>;
}

export type LibraryQuery = {
  kind?: LibraryKind;
  category?: LibraryCategory;
  search?: string;
  savedOnly?: boolean;
};

const enc = encodeURIComponent;

export const listLibrary = (filter: LibraryQuery, params: PageParams) =>
  fetchPage<ApiLibraryItem>("/library", params, {
    query: {
      kind: filter.kind,
      category: filter.category,
      search: filter.search?.trim() || undefined,
      savedOnly: filter.savedOnly ? true : undefined,
    },
  });

export const getLibraryResource = (slug: string) =>
  api<ApiLibraryItem>(`/library/${enc(slug)}`);

export const setSaved = (resourceId: string, saved: boolean) =>
  api<unknown>(`/me/library/saves/${enc(resourceId)}`, {
    method: saved ? "PUT" : "DELETE",
  });

export const listPlatformLibrary = (params: PageParams) =>
  fetchPage<ApiPlatformLibraryResource>("/platform/content/library", params);

export const createLibraryResource = (body: LibraryBody) =>
  api<ApiPlatformLibraryResource>("/platform/content/library", {
    method: "POST",
    body,
  });

export const updateLibraryResource = (id: string, body: Partial<LibraryBody>) =>
  api<ApiPlatformLibraryResource>(`/platform/content/library/${enc(id)}`, {
    method: "PATCH",
    body,
  });

export const publishLibraryResource = (id: string, published: boolean) =>
  api<ApiPlatformLibraryResource>(
    `/platform/content/library/${enc(id)}/${published ? "publish" : "unpublish"}`,
    { method: "POST" },
  );

export const deleteLibraryResource = (id: string) =>
  api<unknown>(`/platform/content/library/${enc(id)}`, { method: "DELETE" });
