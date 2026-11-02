"use client";

/* ==========================================================================
   Access photos, from the API (Phase 7)
   --------------------------------------------------------------------------
   `/patients/:id/dialysis/access-photos`. Adding one shrinks the picture
   (a File, never a stored data: URL), uploads it through /files
   (`uploadFile`) and sends only the file id with the subject, note and an
   ISO `takenAt` with its offset. A picture opens through its short-lived
   download link, asked for when it is shown and cached no longer than the
   link lives; nothing about it is kept in the browser.

   The public names are kept for the screens of other lanes that use this
   hook (`photos`, `add(file, subject, note)`, `remove`, `markSent`, ...).
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { uploadFile } from "@/lib/api/upload";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { usePagedList } from "@/features/profile/usePagedList";
import {
  QUALITY,
  scaledSize,
  sortPhotos,
  type AccessPhoto,
  type PhotoSubject,
} from "./accessPhotos";
import { fromApiAccessPhoto, toAccessPhotoBody } from "./homeDialysis.mapper";
import {
  accessPhotoLink,
  createAccessPhoto,
  listAccessPhotos,
  removeAccessPhoto,
  updateAccessPhoto,
} from "./homeDialysis.repository";

export const ACCESS_PHOTOS_FEATURE = "dialysis-access-photos";

/**
 * Re-encode a chosen image to a bounded JPEG data URL.
 *
 * Kept only for other lanes' screens that still build their own previews
 * (messaging, community, library, vascular access) until they move to
 * uploads in their phases. Member code no longer calls it: access photos
 * are uploaded as files (`downscaleToFile`).
 */
export async function downscaleToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);

  try {
    const { width, height } = scaledSize(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser cannot resize the image.");

    context.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", QUALITY);
  } finally {
    bitmap.close();
  }
}

/**
 * Shrinks a picture to at most MAX_EDGE on its long side, as a JPEG File
 * for upload. When the browser cannot (no canvas, an unreadable format),
 * the original file goes up instead; the upload checks still apply.
 */
export async function downscaleToFile(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const { width, height } = scaledSize(bitmap.width, bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return file;
      context.drawImage(bitmap, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", QUALITY),
      );
      if (!blob) return file;
      const name = file.name.replace(/\.[^.]+$/, "") || "photo";
      return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
    } finally {
      bitmap.close();
    }
  } catch {
    return file;
  }
}

export function useAccessPhotos(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();

  const list = usePagedList({
    scope,
    queryKey: scopedKey(scope, ACCESS_PHOTOS_FEATURE, "list"),
    params: { limit: 50 },
    fetch: listAccessPhotos,
    map: fromApiAccessPhoto,
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: scopedKey(scope, ACCESS_PHOTOS_FEATURE),
    });

  /* Upload, then the record: a refused upload (type, size) is told apart
     from a refused save. */
  const upload = useMutation({
    mutationFn: async (file: File) => uploadFile(await downscaleToFile(file)),
  });
  const create = useMutation({
    mutationFn: ({
      fileId,
      subject,
      note,
    }: {
      fileId: string;
      subject: PhotoSubject;
      note: string;
    }) =>
      createAccessPhoto(
        requireScope(scope),
        toAccessPhotoBody(fileId, subject, note),
      ),
    onSuccess: refresh,
  });
  const change = useMutation({
    mutationFn: ({ id, sent }: { id: string; sent: boolean }) =>
      updateAccessPhoto(requireScope(scope), id, { sent }),
    onSuccess: refresh,
  });
  const drop = useMutation({
    mutationFn: (id: string) => removeAccessPhoto(requireScope(scope), id),
    onSuccess: refresh,
  });

  const photos: AccessPhoto[] = list.items;
  const { mutateAsync: uploadAsync } = upload;
  const { mutateAsync: createAsync } = create;
  const { mutate: changeMutate } = change;
  const { mutate: dropMutate } = drop;

  const add = useCallback(
    async (file: File, subject: PhotoSubject, note: string) => {
      try {
        const fileId = await uploadAsync(file);
        await createAsync({ fileId, subject, note });
      } catch {
        /* Shown through encodeError / saveError. */
      }
    },
    [uploadAsync, createAsync],
  );

  return {
    photos: useMemo(() => sortPhotos(photos), [photos]),
    /** No browser quota any more: the server keeps them. */
    remaining: Infinity,
    hasMore: list.hasMore,
    loadMore: list.loadMore,

    add,
    remove: useCallback((id: string) => dropMutate(id), [dropMutate]),
    markSent: useCallback(
      (id: string) => changeMutate({ id, sent: true }),
      [changeMutate],
    ),
    /** The photo's short-lived link, fetched on demand. */
    link: useCallback(
      (id: string) => accessPhotoLink(requireScope(scope), id),
      [scope],
    ),

    isPending: list.isPending,
    error: list.error,
    isError: list.isError,
    refetch: list.refetch,
    isAdding: upload.isPending || create.isPending,
    /** The picture could not be uploaded (type, size, network). */
    encodeError: upload.error,
    /** The picture was uploaded but the record was refused, or a change failed. */
    saveError: create.error ?? change.error ?? drop.error,
    dismissErrors: () => {
      upload.reset();
      create.reset();
      change.reset();
      drop.reset();
    },
  };
}

export type AccessPhotosLog = ReturnType<typeof useAccessPhotos>;

/**
 * A photo's picture URL while it is on screen: the short-lived link, kept
 * in memory no longer than it lives (30 s less), never in storage.
 */
export function useAccessPhotoUrl(
  photoId: string | null | undefined,
  explicitScope?: PatientScope | null,
) {
  const scope = usePatientScope(explicitScope);
  const query = useQuery({
    queryKey: scopedKey(scope, ACCESS_PHOTOS_FEATURE, "link", photoId ?? ""),
    queryFn: () => accessPhotoLink(requireScope(scope), photoId!),
    enabled: !!photoId && !!scope,
    staleTime: 60_000,
    gcTime: 60_000,
    refetchInterval: (q) => {
      const life = q.state.data?.expiresIn;
      return life ? Math.max(30, life - 30) * 1000 : false;
    },
  });
  return { url: query.data?.url ?? null, isError: query.isError };
}
