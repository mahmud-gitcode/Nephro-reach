import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { SEED_CATEGORIES, SEED_EPISODES } from "./tableTalk.seed";
import type {
  TableTalkCategory,
  TableTalkEpisode,
  TableTalkQuestion,
} from "./tableTalk.types";

/* ==========================================================================
   Dialysis Table Talk — storage
   --------------------------------------------------------------------------
   Four keys, because they are written by different people at different times:
   the admin publishes episodes and manages categories, the member taps
   favourites, and questions arrive from members and are worked through by an
   admin. One blob would mean each write racing the others.

   `listEpisodes` takes a page rather than returning everything. It reads the
   whole array today because localStorage has no other shape, but the brief
   asks for a library that can reach thousands of episodes — so the call
   signature is already the one an API will need, and the day this becomes a
   request only the body below changes.
   ========================================================================== */

const EPISODES_KEY = storageKey("table-talk-episodes");
const CATEGORIES_KEY = storageKey("table-talk-categories");
const FAVORITES_KEY = storageKey("table-talk-favorites");
const QUESTIONS_KEY = storageKey("table-talk-questions");

export interface EpisodePage {
  episodes: TableTalkEpisode[];
  /** Pass back as `cursor` for the next page. Null when there are no more. */
  nextCursor: number | null;
  total: number;
}

async function readEpisodes(): Promise<TableTalkEpisode[]> {
  const stored = await readJson<TableTalkEpisode[] | null>(EPISODES_KEY, null);
  return Array.isArray(stored) ? stored : SEED_EPISODES;
}

/** Every episode, for the admin screen. */
export async function listAllEpisodes(): Promise<TableTalkEpisode[]> {
  return readEpisodes();
}

/** One page of episodes, oldest call signature the backend will keep. */
export async function listEpisodes({
  cursor = 0,
  limit = 24,
}: { cursor?: number; limit?: number } = {}): Promise<EpisodePage> {
  const all = await readEpisodes();
  const slice = all.slice(cursor, cursor + limit);
  const next = cursor + limit;

  return {
    episodes: slice,
    nextCursor: next < all.length ? next : null,
    total: all.length,
  };
}

export async function saveEpisodes(
  episodes: TableTalkEpisode[],
): Promise<TableTalkEpisode[]> {
  return writeJson(EPISODES_KEY, episodes);
}

export async function listCategories(): Promise<TableTalkCategory[]> {
  const stored = await readJson<TableTalkCategory[] | null>(
    CATEGORIES_KEY,
    null,
  );
  return Array.isArray(stored) ? stored : SEED_CATEGORIES;
}

export async function saveCategories(
  categories: TableTalkCategory[],
): Promise<TableTalkCategory[]> {
  return writeJson(CATEGORIES_KEY, categories);
}

export async function getFavorites(): Promise<string[]> {
  const stored = await readJson<string[] | null>(FAVORITES_KEY, null);
  return Array.isArray(stored) ? stored : [];
}

export async function saveFavorites(slugs: string[]): Promise<string[]> {
  return writeJson(FAVORITES_KEY, slugs);
}

export async function listQuestions(): Promise<TableTalkQuestion[]> {
  const stored = await readJson<TableTalkQuestion[] | null>(
    QUESTIONS_KEY,
    null,
  );
  return Array.isArray(stored) ? stored : [];
}

export async function saveQuestions(
  questions: TableTalkQuestion[],
): Promise<TableTalkQuestion[]> {
  return writeJson(QUESTIONS_KEY, questions);
}
