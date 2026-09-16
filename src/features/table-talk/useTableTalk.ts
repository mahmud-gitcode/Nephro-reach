"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFavorites,
  listAllEpisodes,
  listCategories,
  listQuestions,
  saveCategories,
  saveEpisodes,
  saveFavorites,
  saveQuestions,
} from "./tableTalk.repository";
import * as rules from "./tableTalk.rules";
import type { TableTalkEpisode, TableTalkQuestion } from "./tableTalk.types";

export const episodesKey = ["table-talk", "episodes"] as const;
export const categoriesKey = ["table-talk", "categories"] as const;
export const favoritesKey = ["table-talk", "favorites"] as const;
export const questionsKey = ["table-talk", "questions"] as const;

/**
 * The member's view of Table Talk.
 *
 * Drafts, archived episodes and scheduled ones whose date has not arrived are
 * filtered out here rather than at each call site: this hook is what a member
 * sees, and an unpublished episode reaching a member screen is the one
 * mistake this feature can actually make.
 */
export function useTableTalk() {
  const queryClient = useQueryClient();

  const episodesQuery = useQuery({
    queryKey: episodesKey,
    queryFn: listAllEpisodes,
  });
  const categoriesQuery = useQuery({
    queryKey: categoriesKey,
    queryFn: listCategories,
  });
  const favoritesQuery = useQuery({
    queryKey: favoritesKey,
    queryFn: getFavorites,
  });

  const writeFavorites = useMutation({
    mutationFn: async (slug: string) =>
      saveFavorites(rules.toggleFavorite(await getFavorites(), slug)),
    onSuccess: (slugs) => queryClient.setQueryData(favoritesKey, slugs),
  });

  const writeQuestions = useMutation({
    mutationFn: async (question: TableTalkQuestion) =>
      saveQuestions(rules.addQuestion(await listQuestions(), question)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionsKey }),
  });

  const all = useMemo(() => episodesQuery.data ?? [], [episodesQuery.data]);
  const categories = useMemo(
    () => rules.activeCategories(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );
  const favorites = useMemo(
    () => favoritesQuery.data ?? [],
    [favoritesQuery.data],
  );

  const episodes = useMemo(
    () => rules.sortForMembers(rules.liveEpisodes(all)),
    [all],
  );

  const { mutate: toggle } = writeFavorites;

  return {
    episodes,
    categories,
    favorites,
    featured: useMemo(() => rules.featuredEpisode(all), [all]),

    isFavorite: useCallback(
      (slug: string) => favorites.includes(slug),
      [favorites],
    ),
    toggleFavorite: useCallback((slug: string) => toggle(slug), [toggle]),

    getBySlug: useCallback(
      (slug: string): TableTalkEpisode | undefined =>
        rules.findBySlug(episodes, slug),
      [episodes],
    ),
    getRelated: useCallback(
      (episode: TableTalkEpisode) => rules.relatedTo(all, episode),
      [all],
    ),

    submitQuestion: writeQuestions.mutate,
    questionSaved: writeQuestions.isSuccess,
    questionSaving: writeQuestions.isPending,
    questionError: writeQuestions.error,

    /* One pending flag: the page renders the three together, and a shelf
       without its favourites renders every card as unsaved for a frame. */
    isPending:
      episodesQuery.isPending ||
      categoriesQuery.isPending ||
      favoritesQuery.isPending,
    error: episodesQuery.error ?? categoriesQuery.error ?? favoritesQuery.error,
    refetch: () => {
      void episodesQuery.refetch();
      void categoriesQuery.refetch();
      void favoritesQuery.refetch();
    },
    saveError: writeFavorites.error,
  };
}

/**
 * The admin's view: every episode, every category, and the questions members
 * have sent in.
 *
 * It shares query keys with `useTableTalk`, which is the point — publishing an
 * episode updates the member shelf in the same tab without a reload.
 */
export function useTableTalkAdmin() {
  const queryClient = useQueryClient();

  const episodesQuery = useQuery({
    queryKey: episodesKey,
    queryFn: listAllEpisodes,
  });
  const categoriesQuery = useQuery({
    queryKey: categoriesKey,
    queryFn: listCategories,
  });
  const questionsQuery = useQuery({
    queryKey: questionsKey,
    queryFn: listQuestions,
  });

  const writeEpisodes = useMutation({
    mutationFn: async (
      transform: (current: TableTalkEpisode[]) => TableTalkEpisode[],
    ) => saveEpisodes(transform(await listAllEpisodes())),
    onSuccess: (episodes) => queryClient.setQueryData(episodesKey, episodes),
  });

  const writeCategories = useMutation({
    mutationFn: async (
      transform: (
        current: Awaited<ReturnType<typeof listCategories>>,
      ) => Awaited<ReturnType<typeof listCategories>>,
    ) => saveCategories(transform(await listCategories())),
    onSuccess: (categories) =>
      queryClient.setQueryData(categoriesKey, categories),
  });

  const writeQuestions = useMutation({
    mutationFn: async (
      transform: (current: TableTalkQuestion[]) => TableTalkQuestion[],
    ) => saveQuestions(transform(await listQuestions())),
    onSuccess: (questions) => queryClient.setQueryData(questionsKey, questions),
  });

  const episodes = useMemo(
    () => rules.sortForAdmin(episodesQuery.data ?? []),
    [episodesQuery.data],
  );
  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const questions = useMemo(
    () => questionsQuery.data ?? [],
    [questionsQuery.data],
  );

  const { mutate: mutateEpisodes } = writeEpisodes;
  const { mutate: mutateCategories } = writeCategories;
  const { mutate: mutateQuestions } = writeQuestions;

  return {
    episodes,
    categories,
    questions,
    newQuestionCount: useMemo(
      () => rules.newQuestionCount(questions),
      [questions],
    ),

    saveEpisode: useCallback(
      (episode: TableTalkEpisode) =>
        mutateEpisodes((current) => rules.upsertEpisode(current, episode)),
      [mutateEpisodes],
    ),
    deleteEpisode: useCallback(
      (id: string) =>
        mutateEpisodes((current) => rules.removeEpisode(current, id)),
      [mutateEpisodes],
    ),
    setStatus: useCallback(
      (id: string, status: TableTalkEpisode["status"]) =>
        mutateEpisodes((current) =>
          rules.setEpisodeStatus(current, id, status),
        ),
      [mutateEpisodes],
    ),
    setFeatured: useCallback(
      (id: string) =>
        mutateEpisodes((current) => rules.setFeatured(current, id)),
      [mutateEpisodes],
    ),
    move: useCallback(
      (id: string, direction: -1 | 1) =>
        mutateEpisodes((current) => rules.moveEpisode(current, id, direction)),
      [mutateEpisodes],
    ),

    addCategory: useCallback(
      (labelEn: string, labelEs: string) =>
        mutateCategories((current) =>
          rules.addCategory(current, labelEn, labelEs),
        ),
      [mutateCategories],
    ),
    renameCategory: useCallback(
      (id: string, labelEn: string, labelEs: string) =>
        mutateCategories((current) =>
          rules.renameCategory(current, id, labelEn, labelEs),
        ),
      [mutateCategories],
    ),
    archiveCategory: useCallback(
      (id: string, archived: boolean) =>
        mutateCategories((current) =>
          rules.archiveCategory(current, id, archived),
        ),
      [mutateCategories],
    ),

    setQuestionStatus: useCallback(
      (id: string, status: TableTalkQuestion["status"], adminNote?: string) =>
        mutateQuestions((current) =>
          rules.setQuestionStatus(current, id, status, adminNote),
        ),
      [mutateQuestions],
    ),

    isPending:
      episodesQuery.isPending ||
      categoriesQuery.isPending ||
      questionsQuery.isPending,
    error: episodesQuery.error ?? categoriesQuery.error ?? questionsQuery.error,
    refetch: () => {
      void episodesQuery.refetch();
      void categoriesQuery.refetch();
      void questionsQuery.refetch();
    },
    saveError:
      writeEpisodes.error ?? writeCategories.error ?? writeQuestions.error,
    dismissSaveError: () => {
      writeEpisodes.reset();
      writeCategories.reset();
      writeQuestions.reset();
    },
    isSaving: writeEpisodes.isPending,
  };
}

export type TableTalkAdmin = ReturnType<typeof useTableTalkAdmin>;
