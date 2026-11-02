/* ==========================================================================
   Dialysis Table Talk <-> the API (Phase 12)
   --------------------------------------------------------------------------
   - members: GET /table-talk/episodes (live only; the server filters by
     filter id, category and search), …/featured, …/:slug (with captions and
     transcripts), GET /table-talk/categories,
     PUT|DELETE /me/table-talk/favorites/:episodeId,
     POST /table-talk/questions { body } (400 on urgent wording)
   - the content team (platform content): /platform/content/table-talk/
     episodes, categories and questions

   The API names the fields by what they are (`thumbnailUrl`, `videoUrl`,
   `captionsEn/Es`, `publishOn`, `publishedOn`, `position`); the screens
   keep their names (`thumbnail`, `videoSrc`, `captions`, `publishAt`,
   `publishedAt`, `order`). The rename happens here, both ways. Category
   ids are the server's uuids; ids and slugs are made by the server.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import { displayableImage } from "@/features/library/mediaDisplay";
import { mediaUrl } from "@/features/library/library.api";
import type {
  EpisodeAudience,
  EpisodeStatus,
  QuestionStatus,
  Speaker,
  TableTalkCategory,
  TableTalkEpisode,
  TableTalkQuestion,
} from "./tableTalk.types";

export const EPISODE_PLACEHOLDER = "/images/table-talk/episode-thumbnail.jpg";

export type ApiSpeaker = { id: string; name: string; role: string };

/** GET /table-talk/episodes (member summary) */
export type ApiMemberEpisode = {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  speakers: ApiSpeaker[];
  categoryIds: string[];
  audience: string;
  thumbnailUrl: string;
  videoUrl: string | null;
  durationSeconds: number | null;
  isShort: boolean;
  isLiveEvent: boolean;
  featured: boolean;
  publishedOn: string | null;
  favorite: boolean;
  captionsEn?: string | null;
  captionsEs?: string | null;
  transcriptEn?: string | null;
  transcriptEs?: string | null;
};

/** /platform/content/table-talk/episodes */
export type ApiPlatformEpisode = Omit<ApiMemberEpisode, "favorite"> & {
  status: string;
  publishOn: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiCategory = {
  id: string;
  labelEn: string;
  labelEs: string;
  position: number;
  archived: boolean;
  episodeCount: number;
};

export type ApiQuestion = {
  id: string;
  body: string;
  status: string;
  adminNote: string;
  submittedAt: string;
  askedById: string;
  askedByName: string | null;
};

const AUDIENCES: readonly EpisodeAudience[] = [
  "patients",
  "caregivers",
  "both",
];
const STATUSES: readonly EpisodeStatus[] = [
  "draft",
  "scheduled",
  "published",
  "archived",
];
const QUESTION_STATUSES: readonly QuestionStatus[] = [
  "new",
  "reviewed",
  "planned",
  "answered",
  "declined",
];

const day = (value: string | null | undefined) => (value ?? "").slice(0, 10);

export function fromApiEpisode(
  row: ApiMemberEpisode | ApiPlatformEpisode,
): TableTalkEpisode {
  const platform = "status" in row ? row : null;
  return {
    id: row.id,
    slug: row.slug,
    titleEn: row.titleEn,
    titleEs: row.titleEs ?? "",
    descriptionEn: row.descriptionEn ?? "",
    descriptionEs: row.descriptionEs ?? "",
    speakers: (row.speakers ?? []).map((s): Speaker => ({
      id: s.id,
      name: s.name,
      role: s.role ?? "",
    })),
    categoryIds: row.categoryIds ?? [],
    audience: (AUDIENCES as readonly string[]).includes(row.audience)
      ? (row.audience as EpisodeAudience)
      : "both",
    /* next/image can draw only site paths here (library/mediaDisplay.ts). */
    thumbnail: displayableImage(row.thumbnailUrl, EPISODE_PLACEHOLDER),
    videoSrc: row.videoUrl ?? undefined,
    durationSeconds: row.durationSeconds ?? undefined,
    captions: {
      en: row.captionsEn ?? undefined,
      es: row.captionsEs ?? undefined,
    },
    transcriptEn: row.transcriptEn ?? undefined,
    transcriptEs: row.transcriptEs ?? undefined,
    isShort: row.isShort,
    isLiveEvent: row.isLiveEvent,
    featured: row.featured,
    /* The member list holds live episodes only. */
    status: platform
      ? (STATUSES as readonly string[]).includes(platform.status)
        ? (platform.status as EpisodeStatus)
        : "draft"
      : "published",
    publishAt: platform?.publishOn ? day(platform.publishOn) : undefined,
    /* A @db.Date: the first ten characters, never through local time. */
    publishedAt: day(row.publishedOn ?? platform?.createdAt),
    order: platform?.position ?? 0,
    favorite: "favorite" in row ? row.favorite : undefined,
  };
}

export function fromApiCategory(row: ApiCategory): TableTalkCategory {
  return {
    id: row.id,
    labelEn: row.labelEn,
    labelEs: row.labelEs ?? "",
    order: row.position,
    archived: row.archived,
    episodeCount: row.episodeCount,
  };
}

export function fromApiQuestion(row: ApiQuestion): TableTalkQuestion {
  return {
    id: row.id,
    body: row.body,
    askedByName: row.askedByName ?? "",
    askedByEmail: "",
    submittedAt: row.submittedAt,
    status: (QUESTION_STATUSES as readonly string[]).includes(row.status)
      ? (row.status as QuestionStatus)
      : "new",
    adminNote: row.adminNote ?? "",
  };
}

export type EpisodeBody = {
  titleEn: string;
  titleEs?: string;
  descriptionEn?: string;
  descriptionEs?: string;
  speakers?: { id?: string; name: string; role?: string }[];
  categoryIds?: string[];
  audience?: EpisodeAudience;
  thumbnailUrl?: string;
  videoUrl?: string | null;
  durationSeconds?: number | null;
  captionsEn?: string | null;
  captionsEs?: string | null;
  transcriptEn?: string | null;
  transcriptEs?: string | null;
  isShort?: boolean;
  isLiveEvent?: boolean;
  featured?: boolean;
  status?: EpisodeStatus;
  publishOn?: string | null;
  position?: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The full create body. Only server category ids (uuids) are sent. */
export function toEpisodeBody(episode: TableTalkEpisode): EpisodeBody {
  const opt = (value: string | undefined) =>
    value && value.trim() ? value : undefined;
  const body: EpisodeBody = {
    titleEn: episode.titleEn.trim(),
    titleEs: opt(episode.titleEs?.trim()),
    descriptionEn: opt(episode.descriptionEn?.trim()),
    descriptionEs: opt(episode.descriptionEs?.trim()),
    speakers: episode.speakers
      .filter((s) => s.name.trim())
      .map((s) => ({
        ...(s.id && s.id.length <= 64 ? { id: s.id } : {}),
        name: s.name.trim(),
        ...(s.role.trim() ? { role: s.role.trim() } : {}),
      })),
    categoryIds: episode.categoryIds.filter((id) => UUID.test(id)),
    audience: episode.audience,
    thumbnailUrl: mediaUrl(episode.thumbnail),
    videoUrl: mediaUrl(episode.videoSrc),
    durationSeconds:
      episode.durationSeconds && episode.durationSeconds > 0
        ? Math.round(episode.durationSeconds)
        : undefined,
    captionsEn: opt(episode.captions.en),
    captionsEs: opt(episode.captions.es),
    transcriptEn: opt(episode.transcriptEn),
    transcriptEs: opt(episode.transcriptEs),
    isShort: episode.isShort,
    isLiveEvent: episode.isLiveEvent,
    featured: episode.featured,
    status: episode.status,
    publishOn:
      episode.status === "scheduled" &&
      /^\d{4}-\d{2}-\d{2}$/.test(episode.publishAt ?? "")
        ? episode.publishAt
        : undefined,
    position: Math.max(0, Math.min(100_000, Math.round(episode.order || 0))),
  };
  for (const key of Object.keys(body) as (keyof EpisodeBody)[])
    if (body[key] === undefined) delete body[key];
  return body;
}

const CLEARABLE: readonly (keyof EpisodeBody)[] = [
  "videoUrl",
  "durationSeconds",
  "captionsEn",
  "captionsEs",
  "transcriptEn",
  "transcriptEs",
  "publishOn",
];

/** A PATCH with only what changed; a cleared optional field is null. */
export function toEpisodePatch(
  before: TableTalkEpisode,
  after: TableTalkEpisode,
): Partial<EpisodeBody> {
  const a = toEpisodeBody(before) as Record<string, unknown>;
  const b = toEpisodeBody(after) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (JSON.stringify(a[key]) === JSON.stringify(b[key])) continue;
    if (b[key] !== undefined) patch[key] = b[key];
    else if ((CLEARABLE as readonly string[]).includes(key)) patch[key] = null;
    else if (key === "titleEs" || key.startsWith("description"))
      patch[key] = "";
    else if (key === "speakers" || key === "categoryIds") patch[key] = [];
  }
  return patch as Partial<EpisodeBody>;
}

export type EpisodeFilter =
  | "all"
  | "patients"
  | "caregivers"
  | "expert"
  | "short"
  | "live"
  | "spanish"
  | "favorites";

export type EpisodeQuery = {
  filter?: EpisodeFilter;
  categoryId?: string;
  search?: string;
};

const enc = encodeURIComponent;

export const listEpisodes = (query: EpisodeQuery, params: PageParams) =>
  fetchPage<ApiMemberEpisode>("/table-talk/episodes", params, {
    query: {
      filter: query.filter && query.filter !== "all" ? query.filter : undefined,
      categoryId: query.categoryId,
      search: query.search?.trim() || undefined,
    },
  });

export const getFeaturedEpisode = () =>
  api<ApiMemberEpisode | null>("/table-talk/episodes/featured");

export const getEpisode = (slug: string) =>
  api<ApiMemberEpisode>(`/table-talk/episodes/${enc(slug)}`);

export const listCategories = () =>
  api<ApiCategory[]>("/table-talk/categories");

export const setFavorite = (episodeId: string, favorite: boolean) =>
  api<unknown>(`/me/table-talk/favorites/${enc(episodeId)}`, {
    method: favorite ? "PUT" : "DELETE",
  });

export const askQuestion = (body: string) =>
  api<ApiQuestion>("/table-talk/questions", {
    method: "POST",
    body: { body: body.trim() },
  });

/* The content team. */
const P = "/platform/content/table-talk";

export const listPlatformEpisodes = (params: PageParams) =>
  fetchPage<ApiPlatformEpisode>(`${P}/episodes`, params);

export const getPlatformEpisode = (id: string) =>
  api<ApiPlatformEpisode>(`${P}/episodes/${enc(id)}`);

export const createEpisode = (body: EpisodeBody) =>
  api<ApiPlatformEpisode>(`${P}/episodes`, { method: "POST", body });

export const updateEpisode = (id: string, body: Partial<EpisodeBody>) =>
  api<ApiPlatformEpisode>(`${P}/episodes/${enc(id)}`, {
    method: "PATCH",
    body,
  });

export const deleteEpisode = (id: string) =>
  api<unknown>(`${P}/episodes/${enc(id)}`, { method: "DELETE" });

export const listPlatformCategories = () =>
  api<ApiCategory[]>(`${P}/categories`);

export const createCategory = (labelEn: string, labelEs: string) =>
  api<ApiCategory>(`${P}/categories`, {
    method: "POST",
    body: {
      labelEn: labelEn.trim(),
      ...(labelEs.trim() ? { labelEs: labelEs.trim() } : {}),
    },
  });

export const updateCategory = (
  id: string,
  body: {
    labelEn?: string;
    labelEs?: string;
    position?: number;
    archived?: boolean;
  },
) => api<ApiCategory>(`${P}/categories/${enc(id)}`, { method: "PATCH", body });

export const listQuestions = (
  status: QuestionStatus | undefined,
  params: PageParams,
) => fetchPage<ApiQuestion>(`${P}/questions`, params, { query: { status } });

export const updateQuestion = (
  id: string,
  body: { status?: QuestionStatus; adminNote?: string },
) => api<ApiQuestion>(`${P}/questions/${enc(id)}`, { method: "PATCH", body });
