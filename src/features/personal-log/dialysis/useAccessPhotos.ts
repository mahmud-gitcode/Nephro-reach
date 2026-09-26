"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import {
  MAX_PHOTOS,
  QUALITY,
  addPhoto,
  normalisePhotos,
  removePhoto,
  scaledSize,
  sortPhotos,
  type AccessPhoto,
  type PhotoSubject,
} from "./accessPhotos";

/* ==========================================================================
   Access photos — storage and state
   --------------------------------------------------------------------------
   The downscale happens here, on the way in, because it is the thing that
   keeps the feature inside the storage budget. See accessPhotos.ts for why.
   ========================================================================== */

const PHOTOS_KEY = storageKey("dialysis-access-photos");
const QUERY_KEY = ["dialysis-access-photos"];
const NO_PHOTOS: AccessPhoto[] = [];

async function listPhotos(): Promise<AccessPhoto[]> {
  return normalisePhotos(await readJson<unknown>(PHOTOS_KEY, null));
}

/**
 * Re-encode a chosen image to a bounded JPEG data URL.
 *
 * Rejects rather than falls back to the original: storing a 5 MB camera
 * shot would break the quota for every other feature on the origin, so a
 * failure the member can see beats a save that quietly poisons storage.
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

export function useAccessPhotos() {
  const queryClient = useQueryClient();

  const photosQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: listPhotos,
  });

  const write = useMutation({
    mutationFn: async (transform: (current: AccessPhoto[]) => AccessPhoto[]) =>
      writeJson(PHOTOS_KEY, transform(await listPhotos())),
    onSuccess: (photos) => queryClient.setQueryData(QUERY_KEY, photos),
  });

  /* Separate from the write above so the UI can tell "the picture could not
     be read" from "the picture could not be saved" — different fixes. */
  const encode = useMutation({
    mutationFn: async ({
      file,
      subject,
      note,
    }: {
      file: File;
      subject: PhotoSubject;
      note: string;
    }): Promise<AccessPhoto> => ({
      id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dataUrl: await downscaleToDataUrl(file),
      subject,
      note,
      takenAt: new Date().toISOString(),
      sent: false,
    }),
    onSuccess: (photo) => write.mutate((current) => addPhoto(current, photo)),
  });

  const photos = photosQuery.data ?? NO_PHOTOS;
  const { mutate } = write;

  return {
    photos: useMemo(() => sortPhotos(photos), [photos]),
    /** How many more will fit before the oldest starts dropping off. */
    remaining: Math.max(0, MAX_PHOTOS - photos.length),

    add: useCallback(
      (file: File, subject: PhotoSubject, note: string) =>
        encode.mutate({ file, subject, note }),
      [encode],
    ),
    remove: useCallback(
      (id: string) => mutate((current) => removePhoto(current, id)),
      [mutate],
    ),
    markSent: useCallback(
      (id: string) =>
        mutate((current) =>
          current.map((photo) =>
            photo.id === id ? { ...photo, sent: true } : photo,
          ),
        ),
      [mutate],
    ),

    isPending: photosQuery.isPending,
    error: photosQuery.error,
    isAdding: encode.isPending || write.isPending,
    /** The picture could not be read or resized. */
    encodeError: encode.error,
    /** The picture was read but could not be stored — usually a full quota. */
    saveError: write.error,
    dismissErrors: () => {
      encode.reset();
      write.reset();
    },
  };
}

export type AccessPhotosLog = ReturnType<typeof useAccessPhotos>;
