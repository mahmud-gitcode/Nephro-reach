"use client";

import { useCallback } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { uploadFile } from "@/lib/api/upload";
import { useAuth } from "@/features/auth/AuthContext";
import {
  createPost,
  fromApiBoardPost,
  isCategoryId,
  listBoardPosts,
  moderationImage,
  postImage,
  setLike,
  type ApiBoardPost,
  type CreatePostBody,
} from "./community.api";
import { usePagedContent } from "./usePagedContent";

const PAGE = { limit: 20 } as const;

/** Everything about the board for this account: likes and `mine` are the
 *  signed-in member's, so the key carries the account id. */
export const boardKey = (userId: string | undefined): QueryKey => [
  "me",
  userId ?? "anonymous",
  "community",
  "posts",
];

/**
 * The board (approved posts only), one category or all, paged. A failed
 * read is an error, never sample posts.
 */
export function useCommunityBoard(
  tabId: string,
  labels: { badge: string; isEs: boolean },
) {
  const { user } = useAuth();
  const categoryId = isCategoryId(tabId) ? tabId : null;
  const { badge, isEs } = labels;
  const map = useCallback(
    (row: ApiBoardPost) => fromApiBoardPost(row, { badge, isEs }),
    [badge, isEs],
  );
  return usePagedContent({
    queryKey: [...boardKey(user?.id), { categoryId }],
    params: PAGE,
    fetch: (params) => listBoardPosts(categoryId, params),
    map,
    enabled: Boolean(user?.id),
  });
}

export type ComposedPost = {
  body: string;
  categoryId: string;
  /** A downscaled JPEG, uploaded PRIVATE through /files on submit. */
  photo?: Blob | null;
};

/** Posting: the photo goes through /files first, then the post. The reply
 *  carries the server's safety guidance and privacy notice. */
export function useCreatePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: ComposedPost) => {
      const imageFileId = draft.photo
        ? await uploadFile(draft.photo, { filename: "community-photo.jpg" })
        : undefined;
      const body: CreatePostBody = {
        categoryId: isCategoryId(draft.categoryId)
          ? draft.categoryId
          : "general",
        body: draft.body.trim(),
        ...(imageFileId ? { imageFileId } : {}),
      };
      return createPost(body);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: boardKey(user?.id) }),
  });
}

/** An explicit like or unlike; the server's count shows after it. */
export function useLikePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      setLike(postId, liked),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: boardKey(user?.id) }),
  });
}

/**
 * A post's photo link, fetched when the post is shown. The link is a
 * short-lived presigned URL: it is not cached past its life and never
 * stored.
 */
export function usePostImage(
  postId: string,
  options: { enabled: boolean; moderator?: boolean },
) {
  return useQuery({
    queryKey: [
      options.moderator ? "platform" : "community",
      "post-image",
      postId,
    ],
    queryFn: () =>
      options.moderator ? moderationImage(postId) : postImage(postId),
    enabled: options.enabled,
    staleTime: 60_000,
    gcTime: 60_000,
  });
}
