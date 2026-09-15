import type {
  EpisodeAudience,
  EpisodeStatus,
  QuestionStatus,
  TableTalkCategory,
  TableTalkEpisode,
  TableTalkQuestion,
} from "./tableTalk.types";

/* ==========================================================================
   Dialysis Table Talk — pure rules
   --------------------------------------------------------------------------
   Visibility, filtering, ordering and validation, as plain functions. The
   pages only wire these to controls.
   ========================================================================== */

export function todayIso(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** A title becomes the URL, so it is derived rather than typed. */
export function slugify(title: string): string {
  return (
    title
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "episode"
  );
}

export function uniqueSlug(
  episodes: TableTalkEpisode[],
  title: string,
  ownId: string,
): string {
  const base = slugify(title);
  const taken = new Set(
    episodes.filter((entry) => entry.id !== ownId).map((entry) => entry.slug),
  );
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

/* ==========================================================================
   Visibility
   ========================================================================== */

/**
 * What a member is allowed to see.
 *
 * A scheduled episode becomes visible on its date without anyone deploying or
 * pressing anything — which is the whole point of scheduling. An episode with
 * no video file is held back too: a card that opens an empty player is worse
 * than a card that is not there.
 */
export function isLive(episode: TableTalkEpisode, today = todayIso()): boolean {
  if (episode.status === "draft" || episode.status === "archived") return false;
  if (!episode.videoSrc) return false;
  if (episode.status === "scheduled") {
    return Boolean(episode.publishAt) && episode.publishAt! <= today;
  }
  return true;
}

export function liveEpisodes(
  episodes: TableTalkEpisode[],
  today = todayIso(),
): TableTalkEpisode[] {
  return episodes.filter((episode) => isLive(episode, today));
}

/** Newest first, then by the admin's order, then by slug so it never flickers. */
export function sortForMembers(
  episodes: TableTalkEpisode[],
): TableTalkEpisode[] {
  return [...episodes].sort(
    (a, b) =>
      b.publishedAt.localeCompare(a.publishedAt) ||
      a.order - b.order ||
      a.slug.localeCompare(b.slug),
  );
}

/** Admin order: the list they drag. Drafts and scheduled sit above the rest. */
export function sortForAdmin(episodes: TableTalkEpisode[]): TableTalkEpisode[] {
  const rank: Record<EpisodeStatus, number> = {
    draft: 0,
    scheduled: 1,
    published: 2,
    archived: 3,
  };
  return [...episodes].sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      a.order - b.order ||
      b.publishedAt.localeCompare(a.publishedAt),
  );
}

/** The one big episode at the top. Falls back to the newest live one. */
export function featuredEpisode(
  episodes: TableTalkEpisode[],
  today = todayIso(),
): TableTalkEpisode | null {
  const live = liveEpisodes(episodes, today);
  return (
    live.find((episode) => episode.featured) ?? sortForMembers(live)[0] ?? null
  );
}

/* ==========================================================================
   Filtering and search
   ========================================================================== */

export type EpisodeFilter =
  | "all"
  | "patients"
  | "caregivers"
  | "expert"
  | "short"
  | "live"
  | "spanish"
  | "favorites";

/** Categories whose label marks an episode as an "Ask the Expert" one. */
export function isAskTheExpert(
  episode: TableTalkEpisode,
  categories: TableTalkCategory[],
): boolean {
  return episode.categoryIds.some((id) => {
    const match = categories.find((entry) => entry.id === id);
    return match ? /ask the expert/i.test(match.labelEn) : false;
  });
}

/** Spanish means there is something a Spanish speaker can actually use. */
export function hasSpanish(episode: TableTalkEpisode): boolean {
  return Boolean(
    episode.titleEs.trim() ||
    episode.captions.es?.trim() ||
    episode.transcriptEs?.trim(),
  );
}

export function matchesFilter(
  episode: TableTalkEpisode,
  filter: EpisodeFilter,
  categories: TableTalkCategory[],
  favorites: string[],
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "patients":
      return episode.audience === "patients" || episode.audience === "both";
    case "caregivers":
      return episode.audience === "caregivers" || episode.audience === "both";
    case "expert":
      return isAskTheExpert(episode, categories);
    case "short":
      return episode.isShort;
    case "live":
      return episode.isLiveEvent;
    case "spanish":
      return hasSpanish(episode);
    case "favorites":
      return favorites.includes(episode.slug);
    default:
      return true;
  }
}

/**
 * Free text across title, description, speaker and category — in both
 * languages whichever toggle is on, because a member who types "viaje" while
 * the interface sits in English still means that episode.
 */
export function matchesSearch(
  episode: TableTalkEpisode,
  search: string,
  categories: TableTalkCategory[],
): boolean {
  const term = search.trim().toLowerCase();
  if (!term) return true;

  const categoryLabels = episode.categoryIds.flatMap((id) => {
    const match = categories.find((entry) => entry.id === id);
    return match ? [match.labelEn, match.labelEs] : [];
  });

  return [
    episode.titleEn,
    episode.titleEs,
    episode.descriptionEn,
    episode.descriptionEs,
    ...episode.speakers.flatMap((speaker) => [speaker.name, speaker.role]),
    ...categoryLabels,
  ].some((field) => field.toLowerCase().includes(term));
}

export function filterEpisodes(
  episodes: TableTalkEpisode[],
  {
    filter,
    search,
    categoryId,
    categories,
    favorites,
  }: {
    filter: EpisodeFilter;
    search: string;
    categoryId: string | "all";
    categories: TableTalkCategory[];
    favorites: string[];
  },
): TableTalkEpisode[] {
  return episodes.filter((episode) => {
    if (categoryId !== "all" && !episode.categoryIds.includes(categoryId))
      return false;
    if (!matchesFilter(episode, filter, categories, favorites)) return false;
    return matchesSearch(episode, search, categories);
  });
}

export function findBySlug(
  episodes: TableTalkEpisode[],
  slug: string,
): TableTalkEpisode | undefined {
  return episodes.find((episode) => episode.slug === slug);
}

/** Same category, never itself, newest first. */
export function relatedTo(
  episodes: TableTalkEpisode[],
  episode: TableTalkEpisode,
  limit = 3,
  today = todayIso(),
): TableTalkEpisode[] {
  const others = liveEpisodes(episodes, today).filter(
    (candidate) => candidate.slug !== episode.slug,
  );
  const sameTopic = others.filter((candidate) =>
    candidate.categoryIds.some((id) => episode.categoryIds.includes(id)),
  );
  const rest = others.filter((candidate) => !sameTopic.includes(candidate));

  return [...sortForMembers(sameTopic), ...sortForMembers(rest)].slice(
    0,
    limit,
  );
}

export function toggleFavorite(favorites: string[], slug: string): string[] {
  return favorites.includes(slug)
    ? favorites.filter((entry) => entry !== slug)
    : [slug, ...favorites];
}

/* ==========================================================================
   Formatting
   ========================================================================== */

/** 1104 -> "18:24". Episodes run to an hour at most, so no hours field. */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function formatDate(iso: string, isEs: boolean): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(isEs ? "es-ES" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function categoryLabel(
  categories: TableTalkCategory[],
  id: string,
  isEs: boolean,
): string {
  const match = categories.find((entry) => entry.id === id);
  if (!match) return "";
  return isEs ? match.labelEs || match.labelEn : match.labelEn;
}

/* ==========================================================================
   Admin writes
   ========================================================================== */

export function emptyEpisode(order = 0): TableTalkEpisode {
  return {
    id: createId("ep"),
    slug: "",
    titleEn: "",
    titleEs: "",
    descriptionEn: "",
    descriptionEs: "",
    speakers: [],
    categoryIds: [],
    audience: "both",
    thumbnail: "/images/Class.jpg",
    captions: {},
    isShort: false,
    isLiveEvent: false,
    featured: false,
    status: "draft",
    publishedAt: todayIso(),
    order,
  };
}

/**
 * Insert or replace by id.
 *
 * Featuring is exclusive: marking one episode featured un-features every
 * other, because two "featured" episodes means the page has to pick one
 * arbitrarily and the admin cannot tell which.
 */
export function upsertEpisode(
  episodes: TableTalkEpisode[],
  episode: TableTalkEpisode,
): TableTalkEpisode[] {
  const withSlug: TableTalkEpisode = {
    ...episode,
    slug: uniqueSlug(episodes, episode.titleEn || episode.titleEs, episode.id),
  };

  const index = episodes.findIndex((entry) => entry.id === episode.id);
  const next = index === -1 ? [withSlug, ...episodes] : [...episodes];
  if (index !== -1) next[index] = withSlug;

  if (!withSlug.featured) return next;
  return next.map((entry) =>
    entry.id === withSlug.id ? entry : { ...entry, featured: false },
  );
}

export function removeEpisode(
  episodes: TableTalkEpisode[],
  id: string,
): TableTalkEpisode[] {
  return episodes.filter((episode) => episode.id !== id);
}

export function setEpisodeStatus(
  episodes: TableTalkEpisode[],
  id: string,
  status: EpisodeStatus,
  today = todayIso(),
): TableTalkEpisode[] {
  return episodes.map((episode) =>
    episode.id === id
      ? {
          ...episode,
          status,
          /* Publishing stamps the date members see, so "newest first" means
             newest to them. */
          publishedAt: status === "published" ? today : episode.publishedAt,
          /* An archived episode cannot stay the featured one. */
          featured: status === "archived" ? false : episode.featured,
        }
      : episode,
  );
}

export function setFeatured(
  episodes: TableTalkEpisode[],
  id: string,
): TableTalkEpisode[] {
  return episodes.map((episode) => ({
    ...episode,
    featured: episode.id === id,
  }));
}

/** Move an episode up or down the admin list. */
export function moveEpisode(
  episodes: TableTalkEpisode[],
  id: string,
  direction: -1 | 1,
): TableTalkEpisode[] {
  const ordered = sortForAdmin(episodes);
  const index = ordered.findIndex((episode) => episode.id === id);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= ordered.length) return episodes;

  const swapped = [...ordered];
  [swapped[index], swapped[target]] = [swapped[target], swapped[index]];
  return swapped.map((episode, position) => ({ ...episode, order: position }));
}

/** What stops an episode being saved. A draft may be incomplete; a live one may not. */
export function episodeError(episode: TableTalkEpisode): string | null {
  if (episode.titleEn.trim().length === 0) return "title";
  if (episode.status === "scheduled" && !episode.publishAt) return "publish-at";
  return null;
}

export function canSaveEpisode(episode: TableTalkEpisode): boolean {
  return episodeError(episode) === null;
}

/* ==========================================================================
   Categories
   ========================================================================== */

export function activeCategories(
  categories: TableTalkCategory[],
): TableTalkCategory[] {
  return [...categories]
    .filter((category) => !category.archived)
    .sort((a, b) => a.order - b.order || a.labelEn.localeCompare(b.labelEn));
}

export function addCategory(
  categories: TableTalkCategory[],
  labelEn: string,
  labelEs: string,
): TableTalkCategory[] {
  const label = labelEn.trim();
  if (!label) return categories;
  /* Case-insensitive, so "Nutrition" and "nutrition" do not both appear in
     the filter row. */
  if (
    categories.some(
      (entry) => entry.labelEn.trim().toLowerCase() === label.toLowerCase(),
    )
  ) {
    return categories;
  }

  return [
    ...categories,
    {
      id: createId("cat"),
      labelEn: label,
      labelEs: labelEs.trim() || label,
      order: categories.length,
      archived: false,
    },
  ];
}

export function renameCategory(
  categories: TableTalkCategory[],
  id: string,
  labelEn: string,
  labelEs: string,
): TableTalkCategory[] {
  return categories.map((category) =>
    category.id === id
      ? {
          ...category,
          labelEn: labelEn.trim() || category.labelEn,
          labelEs: labelEs.trim() || category.labelEs,
        }
      : category,
  );
}

/**
 * Archived, never deleted.
 *
 * Deleting a category would leave every episode carrying its id pointing at
 * nothing, and those episodes would quietly lose a topic.
 */
export function archiveCategory(
  categories: TableTalkCategory[],
  id: string,
  archived: boolean,
): TableTalkCategory[] {
  return categories.map((category) =>
    category.id === id ? { ...category, archived } : category,
  );
}

export function episodeCountFor(
  episodes: TableTalkEpisode[],
  categoryId: string,
): number {
  return episodes.filter((episode) => episode.categoryIds.includes(categoryId))
    .length;
}

/* ==========================================================================
   Questions
   ========================================================================== */

/**
 * Words that mean this belongs in front of a clinician now, not in a future
 * episode. Matched before the form will send, so the member sees the 911
 * guidance rather than waiting on an answer that is not coming.
 */
const URGENT_TERMS = [
  "chest pain",
  "can't breathe",
  "cannot breathe",
  "shortness of breath",
  "bleeding",
  "unconscious",
  "passed out",
  "emergency",
  "911",
  "stroke",
  "seizure",
  "suicid",
  "dolor de pecho",
  "no puedo respirar",
  "sangrado",
  "emergencia",
];

export function looksUrgent(body: string): boolean {
  const text = body.toLowerCase();
  return URGENT_TERMS.some((term) => text.includes(term));
}

export function questionError(body: string): string | null {
  const text = body.trim();
  if (text.length < 10) return "too-short";
  if (looksUrgent(text)) return "urgent";
  return null;
}

export function canSubmitQuestion(body: string): boolean {
  return questionError(body) === null;
}

export function addQuestion(
  questions: TableTalkQuestion[],
  question: TableTalkQuestion,
): TableTalkQuestion[] {
  return [question, ...questions];
}

export function setQuestionStatus(
  questions: TableTalkQuestion[],
  id: string,
  status: QuestionStatus,
  adminNote?: string,
): TableTalkQuestion[] {
  return questions.map((question) =>
    question.id === id
      ? {
          ...question,
          status,
          adminNote: adminNote ?? question.adminNote,
        }
      : question,
  );
}

export function newQuestionCount(questions: TableTalkQuestion[]): number {
  return questions.filter((question) => question.status === "new").length;
}

export const AUDIENCES: {
  value: EpisodeAudience;
  labelEn: string;
  labelEs: string;
}[] = [
  { value: "both", labelEn: "Everyone", labelEs: "Todos" },
  { value: "patients", labelEn: "Patients", labelEs: "Pacientes" },
  { value: "caregivers", labelEn: "Caregivers", labelEs: "Cuidadores" },
];
