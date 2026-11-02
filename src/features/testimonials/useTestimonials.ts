"use client";

import { useCallback } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import type { PageParams } from "@/lib/api/paging";
import { uploadFile } from "@/lib/api/upload";
import { useAuth } from "@/features/auth/AuthContext";
import { usePagedContent } from "@/features/community/usePagedContent";
import {
  approveTestimonial,
  declineTestimonial,
  fromApiModerationTestimonial,
  fromApiMyTestimonial,
  fromApiPublicTestimonial,
  listModerationTestimonials,
  listMyTestimonials,
  listPublicTestimonials,
  moderationVideo,
  submitTestimonial,
  testimonialVideo,
  toSubmitBody,
  type ModerationFilter,
} from "./testimonials.api";

export type { Testimonial } from "./testimonials.types";

const PAGE = { limit: 20 } as const;

export const publicTestimonialsKey = ["public", "testimonials"] as const;
export const myTestimonialsKey = (userId: string | undefined): QueryKey => [
  "me",
  userId ?? "anonymous",
  "testimonials",
];

/** Published stories (GET /public/testimonials), paged. */
export function usePublicTestimonials() {
  return usePagedContent({
    queryKey: publicTestimonialsKey,
    params: PAGE,
    fetch: listPublicTestimonials,
    map: fromApiPublicTestimonial,
  });
}

/** The signed-in member's own stories and where each got to. */
export function useMyTestimonials() {
  const { user } = useAuth();
  return usePagedContent({
    queryKey: myTestimonialsKey(user?.id),
    params: PAGE,
    fetch: listMyTestimonials,
    map: fromApiMyTestimonial,
    enabled: Boolean(user?.id),
  });
}

export type TestimonialSubmission = {
  title: string;
  role: string;
  otherRole?: string;
  video: File;
  /** What the browser measured, in seconds (INT-19). */
  durationSeconds?: number;
  summary: string;
};

/** The video goes through /files (PRIVATE), then the story. */
export function useSubmitTestimonial() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: TestimonialSubmission) => {
      const videoFileId = await uploadFile(draft.video);
      return submitTestimonial(
        toSubmitBody({
          title: draft.title,
          role: draft.role,
          otherRole: draft.otherRole,
          videoFileId,
          durationSeconds: draft.durationSeconds,
          summary: draft.summary,
        }),
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: myTestimonialsKey(user?.id) }),
  });
}

/** An uploaded story's video, as a short-lived link fetched on open. It is
 *  not kept past its life. */
export function useTestimonialVideo(
  id: string | null,
  options: { enabled: boolean; moderator?: boolean },
) {
  return useQuery({
    queryKey: [
      options.moderator ? "platform" : "testimonials",
      "video",
      id ?? "none",
    ],
    queryFn: () =>
      options.moderator
        ? moderationVideo(id ?? "")
        : testimonialVideo(id ?? ""),
    enabled: options.enabled && Boolean(id),
    staleTime: 60_000,
    gcTime: 60_000,
  });
}

export const TESTIMONIAL_MODERATION_KEY = [
  "platform",
  "content",
  "testimonials",
] as const;

const COUNT_FILTERS: readonly ModerationFilter[] = [
  "all",
  "pending",
  "approved",
  "declined",
];

/** The story queue for moderators (platform content, Manage). */
export function useTestimonialModeration(tab: ModerationFilter) {
  const queryClient = useQueryClient();
  const list = usePagedContent({
    queryKey: [...TESTIMONIAL_MODERATION_KEY, { status: tab }],
    params: PAGE,
    fetch: (params: PageParams) => listModerationTestimonials(tab, params),
    map: fromApiModerationTestimonial,
  });

  const counts = useQuery({
    queryKey: [...TESTIMONIAL_MODERATION_KEY, "counts"],
    queryFn: async () => {
      const pages = await Promise.all(
        COUNT_FILTERS.map((status) =>
          listModerationTestimonials(status, { limit: 1 }),
        ),
      );
      return Object.fromEntries(
        COUNT_FILTERS.map((status, i) => {
          const p = pages[i].pagination;
          return [status, p && p.mode === "offset" ? p.total : 0];
        }),
      ) as Record<ModerationFilter, number>;
    },
  });

  const settle = useCallback(
    () =>
      queryClient.invalidateQueries({ queryKey: TESTIMONIAL_MODERATION_KEY }),
    [queryClient],
  );
  const approve = useMutation({
    mutationFn: (id: string) => approveTestimonial(id),
    onSettled: settle,
  });
  const decline = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      declineTestimonial(id, reason),
    onSettled: settle,
  });

  return {
    testimonials: list.items,
    counts: counts.data ?? null,
    isPending: list.isPending,
    error: list.error ?? counts.error,
    refetch: () => {
      list.refetch();
      void counts.refetch();
    },
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    isLoadingMore: list.isLoadingMore,

    approve: approve.mutateAsync,
    decline: (id: string, reason: string) =>
      decline.mutateAsync({ id, reason }),
    isSaving: approve.isPending || decline.isPending,
    saveError: approve.error ?? decline.error,
    dismissSaveError: () => {
      approve.reset();
      decline.reset();
    },
  };
}
