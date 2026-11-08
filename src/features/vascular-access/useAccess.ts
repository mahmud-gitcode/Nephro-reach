"use client";

/* ==========================================================================
   Vascular access hooks on the API (Phase 10; ADR 0007)
   --------------------------------------------------------------------------
   - Whose record: the member's patient scope (no office header), or the
     active office (its id from the portal context, never a URL).
   - Keys: patientKey(scope, "access-profiles", …) for the member,
     orgKey(orgId, "access-profiles", …) for an office: whose data and in
     which context are always in the key.
   - Reads are windowed: a profile's parts are read one bounded page each
     (the newest messages, the record's visits, reports, rides, updates and
     history); the office roster and the ride queue are paged.
   - Each write is one server operation. Afterwards the record's reads are
     invalidated (status, unread and open-concern counts change on the
     server), never written by hand.
   - Pictures: uploadFile → file id in the body. They show through a
     short-lived link, kept in memory no longer than it lives, never in
     storage. No data: URL is ever made.
   - The old browser store (`nr:vascular-access`) is retired (legacyPurge).
   ========================================================================== */

import { useCallback, useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import { usePatientScope } from "@/features/profile/patientScope";
import { downscaleToFile } from "@/features/personal-log/dialysis/useAccessPhotos";
import { permissionContextOf } from "@/features/staff/staff";
import { ApiError } from "@/lib/api/client";
import { nextPageParams } from "@/lib/api/paging";
import { uploadFile } from "@/lib/api/upload";
import { orgKey, patientKey } from "@/lib/data/queryKeys";
import * as repo from "./access.repository";
import type { AccessTarget } from "./access.repository";
import {
  toProfileList,
  toQueuedRide,
  toRecord,
  toRosterRow,
} from "./access.mapper";
import {
  toHhMm,
  type AccessRecord,
  type AccessStatus,
  type ConcernRecipient,
  type TransportConfirmation,
  type TransportDetails,
} from "./vascularAccess.data";

export const ACCESS_FEATURE = "access-profiles";
export const RIDE_QUEUE_FEATURE = "access-transport";

/** The office the signed-in staff member is acting for, or null. */
export function useOfficeOrgId(): string | null {
  const user = useOptionalAuth()?.user ?? null;
  return useMemo(() => {
    const ctx = permissionContextOf(user);
    return ctx?.kind === "office" ? (user?.organizationId ?? null) : null;
  }, [user]);
}

/** The member's (or caregiver's) own patient routes, or null. */
export function useMemberTarget(): AccessTarget | null {
  const scope = usePatientScope();
  return useMemo(
    () => (scope ? { kind: "patient", patientId: scope.patientId } : null),
    [scope],
  );
}

/** The active office's routes, or null outside office mode. */
export function useOfficeTarget(): AccessTarget | null {
  const orgId = useOfficeOrgId();
  return useMemo(
    () => (orgId ? { kind: "office", organizationId: orgId } : null),
    [orgId],
  );
}

type KeyPart = string | number | boolean | null | Record<string, unknown>;

/** Every access read for a target sits under this prefix. */
export function accessKey(target: AccessTarget | null, ...rest: KeyPart[]) {
  if (!target) return ["access", "none", ...rest];
  return target.kind === "patient"
    ? patientKey(
        { patientId: target.patientId, organizationId: null },
        ACCESS_FEATURE,
        ...rest,
      )
    : orgKey(target.organizationId, ACCESS_FEATURE, ...rest);
}

const NO_TARGET = () =>
  new ApiError(
    403,
    "No access record is open in this context.",
    "client.no_scope",
  );

function need(target: AccessTarget | null): AccessTarget {
  if (!target) throw NO_TARGET();
  return target;
}

/* ------------------------------------------------------------------ reads */

/** The member's profiles: one per access center (several are possible). */
export function useAccessProfiles(target: AccessTarget | null) {
  const query = useQuery({
    queryKey: accessKey(target, "list"),
    queryFn: () => repo.listProfiles(need(target), { limit: 50 }),
    enabled: !!target,
  });
  return {
    profiles: useMemo(
      () => toProfileList(query.data?.items ?? []),
      [query.data],
    ),
    isPending: !!target && query.isPending,
    error: target ? query.error : NO_TARGET(),
    isFetching: query.isFetching,
    updatedAt: query.dataUpdatedAt,
    refetch: () => void query.refetch(),
  };
}

/** Page sizes for one record's parts: bounded windows, never "everything". */
export const PART_LIMITS = {
  appointments: 100,
  updates: 50,
  history: 100,
  concerns: 100,
  transport: 100,
  messages: 50,
} as const;

/**
 * One record with its parts, as `party` sees it. `who` supplies what the
 * profile itself does not carry: the patient's name (the member's own name,
 * or the office's roster row) and the office's MRN for display.
 */
export function useAccessRecord(
  target: AccessTarget | null,
  profileId: string | null,
  who: { memberName: string; mrn: string | null },
) {
  const enabled = !!target && !!profileId;
  const key = (part: string) => accessKey(target, profileId ?? "", part);
  const t = () => need(target);
  const id = profileId ?? "";
  const results = useQueries({
    queries: [
      {
        queryKey: key("profile"),
        queryFn: () => repo.getProfile(t(), id),
        enabled,
      },
      {
        queryKey: key("appointments"),
        queryFn: () =>
          repo.listAppointments(t(), id, {
            state: "all",
            limit: PART_LIMITS.appointments,
          }),
        enabled,
      },
      {
        queryKey: key("updates"),
        queryFn: () =>
          repo.listUpdates(t(), id, { limit: PART_LIMITS.updates }),
        enabled,
      },
      {
        queryKey: key("history"),
        queryFn: () =>
          repo.listHistory(t(), id, { limit: PART_LIMITS.history }),
        enabled,
      },
      {
        queryKey: key("concerns"),
        queryFn: () =>
          repo.listConcerns(t(), id, { limit: PART_LIMITS.concerns }),
        enabled,
      },
      {
        queryKey: key("transport"),
        queryFn: () =>
          repo.listTransport(t(), id, { limit: PART_LIMITS.transport }),
        enabled,
      },
      {
        queryKey: key("messages"),
        queryFn: () =>
          repo.listMessages(t(), id, { limit: PART_LIMITS.messages }),
        enabled,
      },
    ] as const,
  });
  const [
    profile,
    appointments,
    updates,
    history,
    concerns,
    transport,
    messages,
  ] = results;
  const error = results.find((r) => r.error)?.error ?? null;
  const isPending = enabled && results.some((r) => r.isPending);
  const record: AccessRecord | null = useMemo(() => {
    if (
      !profile.data ||
      !appointments.data ||
      !updates.data ||
      !history.data ||
      !concerns.data ||
      !transport.data ||
      !messages.data
    )
      return null;
    return toRecord(profile.data, {
      memberName: who.memberName,
      mrn: who.mrn,
      appointments: appointments.data.items,
      updates: updates.data.items,
      history: history.data.items,
      concerns: concerns.data.items,
      transport: transport.data.items,
      messages: messages.data.items,
    });
  }, [
    profile.data,
    appointments.data,
    updates.data,
    history.data,
    concerns.data,
    transport.data,
    messages.data,
    who.memberName,
    who.mrn,
  ]);
  const refetch = useCallback(() => {
    for (const r of results) void r.refetch();
  }, [results]);
  return {
    /** Never shown after a failed read (error wins). */
    record: error ? null : record,
    isPending,
    error,
    isFetching: results.some((r) => r.isFetching),
    updatedAt: Math.max(0, ...results.map((r) => r.dataUpdatedAt)),
    refetch,
    /** The thread was cut at the newest PART_LIMITS.messages. */
    olderMessages: messages.data?.pagination?.hasNext ?? false,
  };
}

/** The office roster, paged ("Load more" while the server has more). */
export function useAccessRoster(
  orgId: string | null,
  filter: { status?: string; search?: string } = {},
  options: { enabled?: boolean } = {},
) {
  const target: AccessTarget | null = orgId
    ? { kind: "office", organizationId: orgId }
    : null;
  const params = {
    limit: 50,
    status: filter.status || undefined,
    search: filter.search?.trim() || undefined,
  };
  const enabled = !!orgId && (options.enabled ?? true);
  const query = useInfiniteQuery({
    queryKey: accessKey(target, "roster", {
      status: params.status ?? null,
      search: params.search ?? null,
    }),
    queryFn: ({ pageParam }) => repo.listRoster(orgId!, pageParam),
    initialPageParam: params as repo.ApiRosterParams,
    getNextPageParam: (last, _all, lastParams) =>
      nextPageParams(last.pagination, lastParams) as
        repo.ApiRosterParams | undefined,
    enabled,
  });
  const rows = useMemo(
    () =>
      (query.data?.pages ?? []).flatMap((page) => page.items.map(toRosterRow)),
    [query.data],
  );
  const first = query.data?.pages[0]?.pagination;
  return {
    rows,
    /** The server's count of records matching the filter. */
    total: first && first.mode === "offset" ? first.total : rows.length,
    hasMore: query.hasNextPage,
    loadMore: () => void query.fetchNextPage(),
    isLoadingMore: query.isFetchingNextPage,
    isPending: enabled && query.isPending,
    error: enabled ? query.error : null,
    isFetching: query.isFetching,
    updatedAt: query.dataUpdatedAt,
    refetch: () => void query.refetch(),
  };
}

/** The office's ride queue across all its records (BE-12): rides still in
 *  play, paged. */
export function useRideQueue(
  orgId: string | null,
  options: { enabled?: boolean } = {},
) {
  const enabled = !!orgId && (options.enabled ?? true);
  const query = useInfiniteQuery({
    queryKey: orgId
      ? orgKey(orgId, RIDE_QUEUE_FEATURE, { active: true })
      : ["org", "none", RIDE_QUEUE_FEATURE],
    queryFn: ({ pageParam }) =>
      repo.listOrganizationTransport(orgId!, pageParam),
    initialPageParam: { limit: 50, active: true } as repo.ApiQueueParams,
    getNextPageParam: (last, _all, lastParams) =>
      nextPageParams(last.pagination, lastParams) as
        repo.ApiQueueParams | undefined,
    enabled,
  });
  const rides = useMemo(
    () =>
      (query.data?.pages ?? []).flatMap((page) => page.items.map(toQueuedRide)),
    [query.data],
  );
  return {
    rides,
    hasMore: query.hasNextPage,
    loadMore: () => void query.fetchNextPage(),
    isPending: enabled && query.isPending,
    error: enabled ? query.error : null,
    refetch: () => void query.refetch(),
  };
}

/**
 * A picture's short-lived link while it is on screen: asked for only when
 * `id` is set (never for a hidden message), renewed before it expires,
 * kept in memory no longer than it lives, never in storage.
 */
export function useAccessImageUrl(
  target: AccessTarget | null,
  profileId: string,
  kind: "concern" | "message",
  id: string | null,
) {
  const query = useQuery({
    queryKey: accessKey(target, profileId, `${kind}-image`, id ?? ""),
    queryFn: () =>
      kind === "concern"
        ? repo.concernImageLink(need(target), profileId, id!)
        : repo.messageImageLink(need(target), profileId, id!),
    enabled: !!target && !!id,
    staleTime: 60_000,
    gcTime: 60_000,
    refetchInterval: (q) => {
      const life = q.state.data?.expiresIn;
      return life ? Math.max(30, life - 30) * 1000 : false;
    },
  });
  return { url: query.data?.url ?? null, isError: query.isError };
}

/* ----------------------------------------------------------------- writes */

/** A picture to send: uploaded through /files first, then only its id. */
async function uploadPicture(file: File): Promise<string> {
  return uploadFile(await downscaleToFile(file));
}

export type ConcernDraft = {
  kinds: string[];
  detail: string;
  sendTo: ConcernRecipient[];
  /** A new photo from the device; uploaded, then sent by id. */
  file?: File | null;
};

/**
 * Every write on access records for one target. Each call is one server
 * operation; it resolves true when the server took it, false when it
 * refused (the reason is `error`), and invalidates the target's access
 * reads (and the office's ride queue) either way.
 */
export function useAccessActions(target: AccessTarget | null) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (op: () => Promise<unknown>) => op(),
    onSettled: async () => {
      if (!target) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: accessKey(target) }),
        target.kind === "office"
          ? queryClient.invalidateQueries({
              queryKey: orgKey(target.organizationId, RIDE_QUEUE_FEATURE),
            })
          : Promise.resolve(),
      ]);
    },
  });
  const { mutateAsync } = mutation;
  const run = useCallback(
    (op: () => Promise<unknown>): Promise<boolean> =>
      mutateAsync(op).then(
        () => true,
        () => false,
      ),
    [mutateAsync],
  );

  const office = () => {
    const t = need(target);
    if (t.kind !== "office") throw NO_TARGET();
    return t.organizationId;
  };
  const member = () => {
    const t = need(target);
    if (t.kind !== "patient") throw NO_TARGET();
    return t.patientId;
  };

  return {
    error: mutation.error,
    isSaving: mutation.isPending,
    clearError: mutation.reset,

    /* access center */
    createProfile: (body: repo.CreateProfileBody) =>
      run(() => repo.createProfile(office(), body)),
    editOverview: (profileId: string, body: repo.OverviewBody) =>
      run(() => repo.updateOverview(office(), profileId, body)),
    setStatus: (profileId: string, status: AccessStatus) =>
      run(() => repo.setStatus(office(), profileId, status)),
    bookAppointment: (
      profileId: string,
      appointment: {
        date: string;
        time: string;
        title: string;
        place: string;
        team: string;
      },
    ) =>
      run(() =>
        repo.bookAppointment(office(), profileId, {
          ...appointment,
          time: toHhMm(appointment.time) ?? appointment.time,
        }),
      ),
    completeAppointment: (
      profileId: string,
      appointmentId: string,
      result: string,
      performedBy: string,
    ) =>
      run(() =>
        repo.completeAppointment(office(), profileId, appointmentId, {
          result,
          performedBy,
        }),
      ),
    reviewConcern: (profileId: string, concernId: string) =>
      run(() => repo.reviewConcern(office(), profileId, concernId)),

    /* member */
    reportConcern: (profileId: string, draft: ConcernDraft) =>
      run(async () => {
        const imageFileId = draft.file
          ? await uploadPicture(draft.file)
          : undefined;
        return repo.reportConcern(member(), profileId, {
          kinds: draft.kinds,
          detail: draft.detail,
          sendTo: draft.sendTo,
          ...(imageFileId ? { imageFileId } : {}),
        });
      }),
    /** `removePhoto` sends null; a new file replaces the photo; neither
     *  leaves the photo as it is. */
    editConcern: (
      profileId: string,
      concernId: string,
      draft: ConcernDraft & { removePhoto?: boolean },
    ) =>
      run(async () => {
        const imageFileId = draft.file
          ? await uploadPicture(draft.file)
          : draft.removePhoto
            ? null
            : undefined;
        return repo.editConcern(member(), profileId, concernId, {
          kinds: draft.kinds,
          detail: draft.detail,
          sendTo: draft.sendTo,
          ...(imageFileId !== undefined ? { imageFileId } : {}),
        });
      }),
    resendConcern: (profileId: string, concernId: string) =>
      run(() => repo.resendConcern(member(), profileId, concernId)),
    deleteConcern: (profileId: string, concernId: string) =>
      run(() => repo.deleteConcern(member(), profileId, concernId)),
    requestTransport: (profileId: string, details: TransportDetails) =>
      run(() =>
        repo.requestTransport(member(), profileId, transportBody(details)),
      ),

    /* dialysis center */
    setUpTransport: (profileId: string, details: TransportDetails) =>
      run(() =>
        repo.setUpTransport(office(), profileId, transportBody(details)),
      ),
    acknowledgeTransport: (profileId: string, requestId: string) =>
      run(() => repo.acknowledgeTransport(office(), profileId, requestId)),
    confirmTransport: (
      profileId: string,
      requestId: string,
      confirmation: TransportConfirmation,
    ) =>
      run(() =>
        repo.confirmTransport(
          office(),
          profileId,
          requestId,
          confirmBody(confirmation),
        ),
      ),

    /* either side, on its own route */
    cancelTransport: (profileId: string, requestId: string) =>
      run(() => repo.cancelTransport(need(target), profileId, requestId)),
    sendMessage: (
      profileId: string,
      body: string,
      options: { file?: File | null; isPrivate?: boolean } = {},
    ) =>
      run(async () => {
        const imageFileId = options.file
          ? await uploadPicture(options.file)
          : undefined;
        const text = body.trim();
        return repo.postMessage(need(target), profileId, {
          ...(text ? { body: text } : {}),
          ...(imageFileId ? { imageFileId } : {}),
          ...(options.isPrivate ? { isPrivate: true } : {}),
        });
      }),
    setMessagePrivate: (
      profileId: string,
      messageId: string,
      isPrivate: boolean,
    ) =>
      run(() =>
        repo.setMessagePrivacy(need(target), profileId, messageId, isPrivate),
      ),
    setDialysisCanPost: (profileId: string, allowed: boolean) =>
      run(() => repo.setDialysisCanPost(need(target), profileId, allowed)),
    markRead: (profileId: string) =>
      run(() => repo.markRead(need(target), profileId)),
  };
}

export type AccessActions = ReturnType<typeof useAccessActions>;

function transportBody(details: TransportDetails): repo.TransportBody {
  const note = details.memberNote.trim();
  return {
    appointmentId: details.appointmentId,
    pickupAddress: details.pickupAddress.trim(),
    returnTrip: details.returnTrip,
    mobility: details.mobility,
    ...(note ? { memberNote: note } : {}),
  };
}

/** The confirm form's times as HH:mm (24-hour), empty fields left out. */
export function confirmBody(
  confirmation: TransportConfirmation,
): repo.ConfirmTransportBody {
  const pickup = toHhMm(confirmation.pickupTime) ?? confirmation.pickupTime;
  const back = confirmation.returnPickupTime
    ? toHhMm(confirmation.returnPickupTime)
    : null;
  const note = confirmation.note?.trim();
  return {
    pickupTime: pickup,
    ...(back ? { returnPickupTime: back } : {}),
    provider: confirmation.provider.trim(),
    phone: confirmation.phone.trim(),
    confirmationNumber: confirmation.confirmationNumber.trim(),
    ...(note ? { note } : {}),
  };
}
