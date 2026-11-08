/* ==========================================================================
   Access / site / equipment photos
   --------------------------------------------------------------------------
   A member at home cannot show a nurse a red exit site across a phone call,
   so they photograph it. The picture is evidence for the care team, not an
   album.

   ON THE SERVER (Phase 7)
   -----------------------
   A photo is uploaded through /files (`uploadFile`, the server's allowlist
   and 10 MB cap) and only its file id is sent, to
   `/patients/:id/dialysis/access-photos`. The picture is never kept in the
   browser: it opens through a short-lived download link, asked for when it
   is shown. Before upload it is still shrunk to at most MAX_EDGE on its long
   side (a File, never a stored data: URL), which keeps uploads small on a
   phone connection.
   ========================================================================== */

export const MAX_EDGE = 1024;
export const QUALITY = 0.72;
export const MAX_PHOTOS = 12;
/** What the member may hand us before we re-encode it. */
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

export type PhotoSubject = "access" | "exit-site" | "equipment" | "other";

export const PHOTO_SUBJECTS: {
  value: PhotoSubject;
  labelEn: string;
  labelEs: string;
}[] = [
  { value: "access", labelEn: "Access", labelEs: "Acceso" },
  { value: "exit-site", labelEn: "Exit site", labelEs: "Sitio de salida" },
  { value: "equipment", labelEn: "Equipment", labelEs: "Equipo" },
  { value: "other", labelEn: "Other", labelEs: "Otro" },
];

export function subjectLabel(value: PhotoSubject, isEs: boolean): string {
  const option = PHOTO_SUBJECTS.find((entry) => entry.value === value);
  if (!option) return value;
  return isEs ? option.labelEs : option.labelEn;
}

/**
 * A photo as a message attachment: its name only. The image is NOT copied
 * into the message any more (no data: URLs, ADR 0007 §4); messaging will
 * reference the photo's file id (COLLAB, Phase 11).
 */
export function photoAttachment(
  photo: AccessPhoto,
  isEs: boolean,
): { name: string; sizeLabel: string } {
  const label = subjectLabel(photo.subject, isEs);
  return {
    name: photo.note ? `${label} — ${photo.note}` : label,
    sizeLabel: "JPEG",
  };
}

export interface AccessPhoto {
  id: string;
  /* No picture data here (Phase 7): it is on the server, opened through
     `link(id)` / `AccessPhotoImage`. */
  subject: PhotoSubject;
  note: string;
  /** ISO 8601. */
  takenAt: string;
  /** Whether it has been sent to the care team thread. */
  sent: boolean;
}

/** Why a chosen file cannot be used, or null when it can. */
export function fileError(file: File, isEs: boolean): string | null {
  if (!file.type.startsWith("image/")) {
    return isEs ? "Elige una imagen." : "Choose an image.";
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return isEs
      ? "Esa imagen es demasiado grande."
      : "That image is too large.";
  }
  return null;
}

/** The size a photo is re-encoded to, keeping its shape. */
export function scaledSize(
  width: number,
  height: number,
  maxEdge = MAX_EDGE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge || longest === 0) {
    return { width, height };
  }

  const ratio = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

/**
 * Keep the newest MAX_PHOTOS, dropping the oldest.
 *
 * A cap the member cannot exceed is kinder than a save that fails: the
 * alternative is a quota error at the moment they are trying to show a
 * nurse something that worries them.
 */
export function capPhotos(
  photos: AccessPhoto[],
  max = MAX_PHOTOS,
): AccessPhoto[] {
  if (photos.length <= max) return photos;

  return [...photos]
    .sort((a, b) => b.takenAt.localeCompare(a.takenAt))
    .slice(0, max);
}

export function addPhoto(
  photos: AccessPhoto[],
  photo: AccessPhoto,
): AccessPhoto[] {
  return capPhotos([photo, ...photos]);
}

export function removePhoto(photos: AccessPhoto[], id: string): AccessPhoto[] {
  return photos.filter((photo) => photo.id !== id);
}

/** Newest first, which is the order a care team would want to look. */
export function sortPhotos(photos: AccessPhoto[]): AccessPhoto[] {
  return [...photos].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
}
