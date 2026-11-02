"use client";

import React from "react";
import { Camera } from "lucide-react";
import { isSafeFileUrl } from "@/lib/utils/safeUrl";
import { cn } from "@/lib/utils/cn";
import { useAccessPhotoUrl } from "./useAccessPhotos";

/* ==========================================================================
   One access photo's picture, through its short-lived link (Phase 7)
   --------------------------------------------------------------------------
   The photo list holds no image data. While the picture is on screen its
   download link is asked for (and renewed before it expires); a camera
   icon stands in until then, or if the link cannot be had.
   ========================================================================== */

export function AccessPhotoImage({
  photoId,
  alt,
  className,
}: {
  photoId: string;
  alt: string;
  className?: string;
}) {
  const { url } = useAccessPhotoUrl(photoId);
  if (!url || !isSafeFileUrl(url)) {
    return (
      <span
        role="img"
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={cn(
          "flex h-full w-full items-center justify-center text-fg-subtle",
          className,
        )}
      >
        <Camera aria-hidden="true" className="h-5 w-5" />
      </span>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- a short-lived private link, never cached */
    <img
      src={url}
      alt={alt}
      referrerPolicy="no-referrer"
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

export default AccessPhotoImage;
