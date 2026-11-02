"use client";

import { useCallback, useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { isApiError } from "@/lib/api/client";
import { useAuth } from "@/features/auth/AuthContext";
import { usePagedContent } from "@/features/community/usePagedContent";
import {
  askQuestion,
  createCategory,
  createEpisode,
  deleteEpisode as removeEpisode,
  fromApiCategory,
  fromApiEpisode,
  fromApiQuestion,
  getEpisode,
  getFeaturedEpisode,
  getPlatformEpisode,
  listCategories,
  listEpisodes,
  listPlatformCategories,
  listPlatformEpisodes,
  listQuestions,
  setFavorite,
  toEpisodeBody,
  toEpisodePatch,
  updateCategory,
  updateEpisode,
  updateQuestion,
  type EpisodeQuery,
} from "./tableTalk.api";
import * as rules from "./tableTalk.rules";
import type { TableTalkEpisode, TableTalkQuestion } from "./tableTalk.types";

/** Everything Table Talk caches for this account (favorites are per member). */
export const tableTalkKey = (userId: string | undefined): QueryKey => [
  "me",
  userId ?? "anonymous",
  "table-talk",
];

const PAGE = { limit: 20 } as const;

/**
 * The member's view of Table Talk (Phase 12): live episodes only, filtered
 * and searched by the server, paged; the featured one; the categories with
 * the server's counts; and this member's favorites.
 */
export function useTableTalk(query: EpisodeQuery = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const base = tableTalkKey(user?.id);
  const enabled = Boolean(user?.id);
  const filter: EpisodeQuery = {
    filter: query.filter,
    categoryId:
      query.categoryId && query.categoryId !== "all"
        ? query.categoryId
        : undefined,
    search: query.search?.trim() || undefined,
  };

  const list = usePagedContent({
    queryKey: [...base, "episodes", filter],
    params: PAGE,
    fetch: (params) => listEpisodes(filter, params),
    map: fromApiEpisode,
    enabled,
    keepPrevious: true,
  });
  const featuredQuery = useQuery({
    queryKey: [...base, "featured"],
    queryFn: async () => {
      const row = await getFeaturedEpisode();
      return row ? fromApiEpisode(row) : null;
    },
    enabled,
  });
  const categoriesQuery = useQuery({
    queryKey: [...base, "categories"],
    queryFn: async () => (await listCategories()).map(fromApiCategory),
    enabled,
  });

  /* An explicit favorite or unfavorite by episode id, never a toggle. */
  const writeFavorite = useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) =>
      setFavorite(id, favorite),
    onSettled: () => queryClient.invalidateQueries({ queryKey: base }),
  });

  /* The server screens the wording again: urgent words get a 400 with
     guidance, which reaches the form as the error. */
  const writeQuestion = useMutation({
    mutationFn: (body: string) => askQuestion(body),
  });

  const episodes = list.items;
  const featured = featuredQuery.data ?? null;
  const categories = useMemo(
    () => rules.activeCategories(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );
  const known = useMemo(
    () => (featured ? [featured, ...episodes] : episodes),
    [featured, episodes],
  );
  const favorites = useMemo(
    () => known.filter((e) => e.favorite).map((e) => e.slug),
    [known],
  );

  const { mutate: mutateFavorite } = writeFavorite;
  const toggleFavorite = useCallback(
    (slug: string, episode?: TableTalkEpisode) => {
      const target = episode ?? rules.findBySlug(known, slug);
      if (target) mutateFavorite({ id: target.id, favorite: !target.favorite });
    },
    [known, mutateFavorite],
  );

  return {
    episodes,
    categories,
    favorites,
    featured,
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    isLoadingMore: list.isLoadingMore,

    isFavorite: useCallback(
      (slug: string) => favorites.includes(slug),
      [favorites],
    ),
    toggleFavorite,

    submitQuestion: writeQuestion.mutateAsync,
    questionSaving: writeQuestion.isPending,
    questionError: writeQuestion.error,

    isPending:
      list.isPending || featuredQuery.isPending || categoriesQuery.isPending,
    error: list.error ?? featuredQuery.error ?? categoriesQuery.error,
    refetch: () => {
      list.refetch();
      void featuredQuery.refetch();
      void categoriesQuery.refetch();
    },
    saveError: writeFavorite.error,
  };
}

/** One episode by slug, with its captions and transcript. A slug that is not
 *  live is a 404 from the server, shown as "not found". */
export function useEpisode(slug: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const base = tableTalkKey(user?.id);
  const enabled = Boolean(user?.id) && Boolean(slug);

  const query = useQuery({
    queryKey: [...base, "episode", slug],
    queryFn: async () => {
      try {
        return fromApiEpisode(await getEpisode(slug));
      } catch (error) {
        if (isApiError(error, { status: 404 })) return null;
        throw error;
      }
    },
    enabled,
  });
  const episode = query.data ?? undefined;
  const firstCategory = episode?.categoryIds[0];

  /* Related: the first topic's shelf, minus this one. */
  const related = useQuery({
    queryKey: [...base, "related", firstCategory ?? "none"],
    queryFn: async () =>
      (
        await listEpisodes({ categoryId: firstCategory }, { limit: 4 })
      ).items.map(fromApiEpisode),
    enabled: enabled && Boolean(firstCategory),
  });
  const categories = useQuery({
    queryKey: [...base, "categories"],
    queryFn: async () => (await listCategories()).map(fromApiCategory),
    enabled,
  });

  const writeFavorite = useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) =>
      setFavorite(id, favorite),
    onSettled: () => queryClient.invalidateQueries({ queryKey: base }),
  });

  return {
    episode,
    related: useMemo(
      () => (related.data ?? []).filter((e) => e.slug !== slug).slice(0, 3),
      [related.data, slug],
    ),
    categories: categories.data ?? [],
    isFavorite: Boolean(episode?.favorite),
    toggleFavorite: () => {
      if (episode)
        writeFavorite.mutate({ id: episode.id, favorite: !episode.favorite });
    },
    saveError: writeFavorite.error,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

export const PLATFORM_TABLE_TALK_KEY = [
  "platform",
  "content",
  "table-talk",
] as const;

/* The content team's lists are small; one page of the server's maximum,
   with "load more" past it. */
const ADMIN_PAGE = { limit: 150 } as const;

/**
 * The admin's view: every episode, every category, and the questions members
 * have sent in (platform content). One call per server operation; after
 * each, the admin lists and this tab's member shelves are read again.
 */
export function useTableTalkAdmin() {
  const queryClient = useQueryClient();

  const episodesList = usePagedContent({
    queryKey: [...PLATFORM_TABLE_TALK_KEY, "episodes"],
    params: ADMIN_PAGE,
    fetch: listPlatformEpisodes,
    map: fromApiEpisode,
  });
  const categoriesQuery = useQuery({
    queryKey: [...PLATFORM_TABLE_TALK_KEY, "categories"],
    queryFn: async () => (await listPlatformCategories()).map(fromApiCategory),
  });
  const questionsList = usePagedContent({
    queryKey: [...PLATFORM_TABLE_TALK_KEY, "questions"],
    params: ADMIN_PAGE,
    fetch: (params) => listQuestions(undefined, params),
    map: fromApiQuestion,
  });
  const newCount = useQuery({
    queryKey: [...PLATFORM_TABLE_TALK_KEY, "questions", "new-count"],
    queryFn: async () => {
      const page = await listQuestions("new", { limit: 1 });
      const p = page.pagination;
      return p ? (p.mode === "offset" ? p.total : page.items.length) : 0;
    },
  });

  const settle = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: PLATFORM_TABLE_TALK_KEY });
    await queryClient.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === "me" && q.queryKey[2] === "table-talk",
    });
  }, [queryClient]);

  const episodes = useMemo(
    () => rules.sortForAdmin(episodesList.items),
    [episodesList.items],
  );

  const writeEpisode = useMutation({
    mutationFn: async ({
      episode,
      before,
    }: {
      episode: TableTalkEpisode;
      before?: TableTalkEpisode;
    }) => {
      if (!before) {
        await createEpisode(toEpisodeBody(episode));
        return;
      }
      const patch = toEpisodePatch(before, episode);
      if (Object.keys(patch).length > 0) await updateEpisode(before.id, patch);
    },
    onSettled: settle,
  });
  const patchEpisode = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Parameters<typeof updateEpisode>[1];
    }) => updateEpisode(id, patch),
    onSettled: settle,
  });
  /* Moving swaps two positions: two writes, not atomic. A failure part-way
     shows the error and the lists are read again. */
  const moveEpisode = useMutation({
    mutationFn: async ({
      id,
      direction,
    }: {
      id: string;
      direction: -1 | 1;
    }) => {
      const index = episodes.findIndex((e) => e.id === id);
      const other = episodes[index + direction];
      const current = episodes[index];
      if (!current || !other) return;
      await updateEpisode(current.id, { position: other.order });
      await updateEpisode(other.id, { position: current.order });
    },
    onSettled: settle,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeEpisode(id),
    onSettled: settle,
  });
  const writeCategory = useMutation({
    mutationFn: (
      change:
        | { kind: "add"; labelEn: string; labelEs: string }
        | { kind: "rename"; id: string; labelEn: string; labelEs: string }
        | { kind: "archive"; id: string; archived: boolean },
    ) =>
      change.kind === "add"
        ? createCategory(change.labelEn, change.labelEs)
        : change.kind === "rename"
          ? updateCategory(change.id, {
              labelEn: change.labelEn.trim(),
              labelEs: change.labelEs.trim(),
            })
          : updateCategory(change.id, { archived: change.archived }),
    onSettled: settle,
  });
  const writeQuestion = useMutation({
    mutationFn: ({
      id,
      status,
      adminNote,
    }: {
      id: string;
      status: TableTalkQuestion["status"];
      adminNote?: string;
    }) =>
      updateQuestion(id, {
        status,
        ...(adminNote !== undefined ? { adminNote } : {}),
      }),
    onSettled: settle,
  });

  const { mutate: mutateEpisode } = writeEpisode;
  const { mutate: mutatePatch } = patchEpisode;
  const { mutate: mutateMove } = moveEpisode;
  const { mutate: mutateDelete } = deleteMutation;
  const { mutate: mutateCategory } = writeCategory;
  const { mutate: mutateQuestion } = writeQuestion;

  const mutations = [
    writeEpisode,
    patchEpisode,
    moveEpisode,
    deleteMutation,
    writeCategory,
    writeQuestion,
  ];

  return {
    episodes,
    categories: categoriesQuery.data ?? [],
    questions: questionsList.items,
    newQuestionCount: newCount.data ?? 0,

    /** The full episode (captions and transcripts) for the editor. */
    openEpisode: useCallback(
      async (id: string) =>
        fromApiEpisode(
          await queryClient.fetchQuery({
            queryKey: [...PLATFORM_TABLE_TALK_KEY, "episode", id],
            queryFn: () => getPlatformEpisode(id),
            staleTime: 0,
          }),
        ),
      [queryClient],
    ),
    /** `before` is what the editor started from: only the changes are sent,
     *  so a field the editor never loaded is never cleared. */
    saveEpisode: useCallback(
      (episode: TableTalkEpisode, before?: TableTalkEpisode) =>
        mutateEpisode({ episode, before }),
      [mutateEpisode],
    ),
    deleteEpisode: useCallback(
      (id: string) => mutateDelete(id),
      [mutateDelete],
    ),
    setStatus: useCallback(
      (id: string, status: TableTalkEpisode["status"]) =>
        mutatePatch({ id, patch: { status } }),
      [mutatePatch],
    ),
    /* The server un-features every other episode when one is featured. */
    setFeatured: useCallback(
      (id: string) => mutatePatch({ id, patch: { featured: true } }),
      [mutatePatch],
    ),
    move: useCallback(
      (id: string, direction: -1 | 1) => mutateMove({ id, direction }),
      [mutateMove],
    ),

    addCategory: useCallback(
      (labelEn: string, labelEs: string) =>
        mutateCategory({ kind: "add", labelEn, labelEs }),
      [mutateCategory],
    ),
    renameCategory: useCallback(
      (id: string, labelEn: string, labelEs: string) =>
        mutateCategory({ kind: "rename", id, labelEn, labelEs }),
      [mutateCategory],
    ),
    archiveCategory: useCallback(
      (id: string, archived: boolean) =>
        mutateCategory({ kind: "archive", id, archived }),
      [mutateCategory],
    ),

    setQuestionStatus: useCallback(
      (id: string, status: TableTalkQuestion["status"], adminNote?: string) =>
        mutateQuestion({ id, status, adminNote }),
      [mutateQuestion],
    ),

    isPending:
      episodesList.isPending ||
      categoriesQuery.isPending ||
      questionsList.isPending,
    error: episodesList.error ?? categoriesQuery.error ?? questionsList.error,
    refetch: () => {
      episodesList.refetch();
      void categoriesQuery.refetch();
      questionsList.refetch();
      void newCount.refetch();
    },
    saveError: mutations.find((m) => m.error)?.error ?? null,
    dismissSaveError: () => mutations.forEach((m) => m.reset()),
    isSaving: mutations.some((m) => m.isPending),
  };
}

export type TableTalkAdmin = ReturnType<typeof useTableTalkAdmin>;
