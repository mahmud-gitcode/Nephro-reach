"use client";

import React from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { subjectLabel, type AccessPhoto } from "./accessPhotos";

/**
 * Pick one photo from the member's access-photo log to send with something.
 *
 * Shared by every place a photo can ride along — the care-team message, an
 * access concern, a vascular-access message — so they all look and behave
 * the same. Pressing the chosen photo again clears it.
 */
export function PhotoPicker({
  photos,
  value,
  onChange,
  isEs,
  label,
}: {
  photos: AccessPhoto[];
  value: string | null;
  onChange: (id: string | null) => void;
  isEs: boolean;
  label?: string;
}) {
  return (
    <div className="space-y-1.5">
      <span className="block text-label-md text-fg-secondary">
        {label ?? (isEs ? "Adjuntar una foto" : "Attach a photo")}
      </span>
      {photos.length === 0 ? (
        <p className="text-body-sm text-fg-muted">
          {isEs ? "Aún no hay fotos." : "No photos yet."}
        </p>
      ) : (
        <ul className="flex flex-wrap gap-inline-sm">
          {photos.map((entry) => {
            const selected = entry.id === value;
            const name = subjectLabel(entry.subject, isEs);
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${name}${entry.note ? ` — ${entry.note}` : ""}`}
                  title={entry.note || name}
                  onClick={() => onChange(selected ? null : entry.id)}
                  className={cn(
                    "relative block h-14 w-14 cursor-pointer overflow-hidden rounded-control border-2 bg-surface-sunken transition-colors",
                    selected
                      ? "border-primary-solid"
                      : "border-line hover:border-primary-soft-line",
                  )}
                >
                  <Image
                    src={entry.dataUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="56px"
                    className="object-cover"
                  />
                  {selected ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
                      <Check aria-hidden="true" className="h-5 w-5" />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default PhotoPicker;
