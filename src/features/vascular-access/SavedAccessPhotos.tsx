"use client";

import React, { useId } from "react";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";
import {
  subjectLabel,
  type AccessPhoto,
} from "@/features/personal-log/dialysis/accessPhotos";
import { AccessPhotoImage } from "@/features/personal-log/dialysis/AccessPhotoImage";

/* ==========================================================================
   The member's saved access photos, beside a fresh upload (Phase 10)
   --------------------------------------------------------------------------
   Before the API, an access concern or message could carry a photo picked
   from the dialysis access-photo log. On the API an attached picture must
   be a file the sender uploads for it, and the access-photo records do not
   expose their file, so picking a saved one waits on NEW-5 (BE-15). The
   gallery stays where it was, each picture through its own short-lived
   link, and says plainly that attaching one is not available yet. The
   photos' bytes are never fetched to be uploaded again.
   ========================================================================== */

export function SavedAccessPhotos({
  photos,
  isEs,
}: {
  photos: AccessPhoto[];
  isEs: boolean;
}) {
  const noteId = useId();
  if (photos.length === 0) return null;
  const unavailable = notBuiltYet(
    isEs ? "Adjuntar una foto guardada" : "Attaching a saved photo",
  );
  return (
    <div className="space-y-1.5">
      <span className="block text-label-md text-fg-secondary">
        {isEs ? "O una de sus fotos guardadas" : "Or one of your saved photos"}
      </span>
      <ul className="flex flex-wrap gap-inline-sm">
        {photos.map((entry) => {
          const name = subjectLabel(entry.subject, isEs);
          return (
            <li key={entry.id}>
              <button
                type="button"
                {...unavailable}
                aria-label={`${name}${entry.note ? ` — ${entry.note}` : ""}`}
                aria-describedby={noteId}
                className="relative block h-14 w-14 cursor-not-allowed overflow-hidden rounded-control border-2 border-line bg-surface-sunken opacity-60"
              >
                <AccessPhotoImage
                  photoId={entry.id}
                  alt=""
                  className="absolute inset-0"
                />
              </button>
            </li>
          );
        })}
      </ul>
      <p id={noteId} className="text-caption text-fg-muted">
        {isEs
          ? "Adjuntar una foto guardada aún no está disponible: tome o elija la foto otra vez arriba."
          : "Attaching a saved photo is not available yet: take or choose the picture again above."}
      </p>
    </div>
  );
}

export default SavedAccessPhotos;
