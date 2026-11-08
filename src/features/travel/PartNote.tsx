import React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ListCount } from "./listWindow";

/**
 * Says that a travel list shows only its newest entries (QA round 1, M1),
 * e.g. "Showing the newest 150 of 230 past requests." Nothing is drawn
 * when the list is whole.
 */
export function PartNote({
  part,
  text,
  className,
}: {
  part: ListCount | null;
  /** The words for this list and language. */
  text: (part: ListCount) => string;
  className?: string;
}) {
  if (!part) return null;
  return (
    <p
      role="note"
      className={cn(
        "flex items-start gap-inline-xs text-body-sm text-fg-secondary",
        className,
      )}
    >
      <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{text(part)}</span>
    </p>
  );
}
