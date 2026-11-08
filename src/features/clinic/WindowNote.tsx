import React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { RosterWindow } from "./useClinicData";

/** The note's words; null when the window holds everyone. */
export function windowNoteText(
  window: RosterWindow | undefined,
  what: string,
  noun: string,
): string | null {
  if (!window || window.complete) return null;
  return window.rosterWhole
    ? `${what} your ${window.enrollmentsLoaded} most recent program enrollments of ${window.enrollmentsTotal}.`
    : `${what} your ${window.loaded} most recently added ${noun} of ${window.total}.`;
}

/**
 * Says, in plain words, that a count or a filter covers only part of the
 * roster (QA round 1, H1). The cards, charts and the client-only filters
 * read one bounded window of the newest patients; when the office has
 * more than that, this note is shown instead of passing a part off as the
 * whole. Nothing is drawn when the window holds everyone.
 */
export function WindowNote({
  window,
  what,
  noun,
  className,
}: {
  window: RosterWindow | undefined;
  /** What the note is about, e.g. "Counts and charts cover". */
  what: string;
  /** "members" or "patients". */
  noun: string;
  className?: string;
}) {
  const text = windowNoteText(window, what, noun);
  if (!text) return null;
  return (
    <p
      role="note"
      className={cn(
        "flex items-start gap-inline-xs text-body-sm text-fg-secondary",
        className,
      )}
    >
      <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{text}</span>
    </p>
  );
}
