"use client";

/* ==========================================================================
   Share Outside NephroReach — the sender's hooks (Phase 11, ADR 0007)
   --------------------------------------------------------------------------
   Paged reads under keys that name the patient or the office, and one call
   per change followed by a refetch. A picked file goes up through /files
   (uploadFile) when the share is sent; only its id reaches the share.
   Nothing is stored in the browser.
   ========================================================================== */

import { useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { nextPageParams, type PageParams } from "@/lib/api/paging";

const SHARES_PAGE: PageParams = { limit: 20 };
import { uploadFile } from "@/lib/api/upload";
import { orgKey, patientKey } from "@/lib/data/queryKeys";
import { ApiError } from "@/lib/api/client";
import { usePatientScope } from "@/features/profile/patientScope";
import { useActiveOffice } from "@/features/messaging/useConversations";
import * as api from "./shares.api";
import { attachmentFile, type ShareAttachment, type ShareKind } from "./shares";

/** Whose shares this screen sends and lists: the office's when `office`
 *  (office mode), else the signed-in patient's (or the caregiver's
 *  patient's). Null when the context has neither. */
export function useShareOwner(office: boolean): api.ShareOwner | null {
  const scope = usePatientScope();
  const { organizationId } = useActiveOffice();
  return useMemo(() => {
    if (office)
      return organizationId ? { kind: "office", organizationId } : null;
    return scope ? { kind: "patient", scope } : null;
  }, [office, organizationId, scope]);
}

function sharesKey(owner: api.ShareOwner | null) {
  if (!owner) return ["outside-shares", "none"];
  return owner.kind === "patient"
    ? patientKey(owner.scope, "outside-shares")
    : orgKey(owner.organizationId, "outside-shares");
}

function requireOwner(owner: api.ShareOwner | null): api.ShareOwner {
  if (!owner)
    throw new ApiError(
      403,
      "Nothing is selected to share from.",
      "client.no_share_owner",
    );
  return owner;
}

/** The shares sent from this patient or office, newest first. */
export function useOutsideShares(
  owner: api.ShareOwner | null,
  options: { enabled?: boolean } = {},
) {
  const query = useInfiniteQuery({
    queryKey: sharesKey(owner),
    queryFn: ({ pageParam }) => api.listShares(requireOwner(owner), pageParam),
    initialPageParam: SHARES_PAGE,
    getNextPageParam: (last, _pages, params) =>
      nextPageParams(last.pagination, params),
    enabled: (options.enabled ?? true) && owner !== null,
  });
  const shares = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.items),
    [query.data],
  );
  const pagination = query.data?.pages[0]?.pagination;
  return {
    shares,
    total: pagination?.mode === "offset" ? pagination.total : shares.length,
    isPending: owner !== null && query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    hasMore: query.hasNextPage,
    loadMore: () => void query.fetchNextPage(),
    isLoadingMore: query.isFetchingNextPage,
  };
}

export type NewShareInput = {
  kind: ShareKind;
  recipientEmail: string;
  recipientOrg: string;
  subject: string;
  body: string;
  attachment?: ShareAttachment | null;
};

/** Send one share: upload its file, then create it. */
export function useCreateShare(owner: api.ShareOwner | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewShareInput) => {
      const target = requireOwner(owner);
      const fileId = input.attachment
        ? await uploadFile(attachmentFile(input.attachment))
        : undefined;
      const text = (value: string) => value.trim() || undefined;
      return api.createShare(target, {
        kind: input.kind,
        /* One recipient field only: the email (never a contact id too). */
        recipientEmail: input.recipientEmail.trim(),
        ...(text(input.recipientOrg)
          ? { recipientOrg: text(input.recipientOrg) }
          : {}),
        ...(text(input.subject) ? { subject: text(input.subject) } : {}),
        ...(text(input.body) ? { body: text(input.body) } : {}),
        ...(fileId ? { fileId } : {}),
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: sharesKey(owner) }),
  });
}

/** Stop sharing: the link and every open session on it stop working. */
export function useRevokeShare(owner: api.ShareOwner | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shareId: string) =>
      api.revokeShare(requireOwner(owner), shareId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: sharesKey(owner) }),
  });
}
