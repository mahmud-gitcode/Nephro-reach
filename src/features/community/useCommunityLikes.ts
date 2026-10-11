"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";

/* The posts this member has liked (member-owned). Likes used to live in
   page state only, so a reload took them back. With a server this is one
   CommunityLike row per member and post, and the counts come from there. */
const KEY = storageKey("community-likes");

export type LikedPosts = Record<string, boolean>;

async function readLikes(): Promise<LikedPosts> {
  const stored = await readJson<unknown>(KEY, null);
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
  return Object.fromEntries(
    Object.entries(stored).filter(([, value]) => value === true),
  );
}

export const communityLikesKey = ["community", "likes"] as const;

export function useCommunityLikes() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: communityLikesKey, queryFn: readLikes });
  const write = useMutation({
    mutationFn: async (postId: string) => {
      const current = await readLikes();
      const { [postId]: wasLiked, ...rest } = current;
      return writeJson<LikedPosts>(
        KEY,
        wasLiked ? rest : { ...rest, [postId]: true },
      );
    },
    onSuccess: (likes) => queryClient.setQueryData(communityLikesKey, likes),
  });
  const { mutate } = write;
  return {
    liked: query.data ?? {},
    toggle: useCallback((postId: string) => mutate(postId), [mutate]),
    saveError: write.error,
  };
}
