/* ==========================================================================
   Access / site / equipment photos
   --------------------------------------------------------------------------
   A member at home cannot show a nurse a red exit site across a phone call,
   so they photograph it. The picture is evidence for the care team, not an
   album.

   STORAGE, AND WHY IT LOOKS LIKE THIS
   -----------------------------------
   There is no backend yet, so a photo has to live in localStorage with
   everything else. The camera on a modern phone produces 3–5 MB per shot,
   base64 adds a third again, and the whole origin gets about 5 MB — so
   storing what the member picked would blow the quota on the second photo
   and take every other feature's data down with it.

   Two rules keep it inside the budget, both enforced here rather than
   trusted to the member:

     · every photo is re-encoded to at most MAX_EDGE on its long side at
       JPEG quality QUALITY, which lands a typical shot at 100–200 KB;
     · at most MAX_PHOTOS are kept, oldest dropped first.

   That is roughly 2 MB at worst. It is deliberately a thumbnail: enough for
   a nurse to see redness, swelling or a cracked line, not a diagnostic
   image. When there is a real backend, the original should be uploaded and
   this downscale kept only for the on-page preview.
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

export interface AccessPhoto {
  id: string;
  /** A downscaled JPEG data URL — see the note at the top of this file. */
  dataUrl: string;
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

/** Read stored photos back, dropping anything without an image in it. */
export function normalisePhotos(stored: unknown): AccessPhoto[] {
  if (!Array.isArray(stored)) return [];

  return stored.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const raw = value as Partial<AccessPhoto>;

    if (
      typeof raw.id !== "string" ||
      typeof raw.dataUrl !== "string" ||
      !raw.dataUrl.startsWith("data:image/")
    ) {
      return [];
    }

    return [
      {
        id: raw.id,
        dataUrl: raw.dataUrl,
        subject: PHOTO_SUBJECTS.some((entry) => entry.value === raw.subject)
          ? (raw.subject as PhotoSubject)
          : "other",
        note: typeof raw.note === "string" ? raw.note : "",
        takenAt:
          typeof raw.takenAt === "string"
            ? raw.takenAt
            : new Date(0).toISOString(),
        sent: raw.sent === true,
      },
    ];
  });
}
