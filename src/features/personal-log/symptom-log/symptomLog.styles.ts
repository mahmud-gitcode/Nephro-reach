import { Angry, Frown, Laugh, Meh, Smile } from "lucide-react";

/* The shared class strings for this form's controls. Kept together so a new
   row cannot quietly be styled differently from the fifty already here. */

export const MOODS = [
  {
    level: 5,
    label: "Great",
    icon: Laugh,
    color: "text-success-700",
  },
  {
    level: 4,
    label: "Good",
    icon: Smile,
    color: "text-success-500",
  },
  {
    level: 3,
    label: "Okay",
    icon: Meh,
    color: "text-warning",
  },
  {
    level: 2,
    label: "Low",
    icon: Frown,
    color: "text-danger-500",
  },
  {
    level: 1,
    label: "Poor",
    icon: Angry,
    color: "text-danger-700",
  },
];

/* ---- Shared style tokens: one radius scale, one type scale, one palette ---- */

export const SEGMENT_TRACK =
  "flex items-center gap-0.5 rounded-control border border-line bg-surface-sunken p-1";
export const SEGMENT_ITEM =
  "flex h-7 items-center justify-center rounded-control-small px-3 text-xs font-bold transition-colors cursor-pointer";
export const SEGMENT_ACTIVE =
  "bg-primary-solid text-primary-on-solid shadow-control";
export const SEGMENT_IDLE = "text-fg-muted hover:text-fg-secondary";

export const FIELD_ROW =
  "flex flex-col gap-2.5 rounded-control border border-line bg-surface p-3.5 transition-colors hover:border-line-strong sm:flex-row sm:items-center sm:justify-between sm:gap-4";
export const FIELD_LABEL = "text-sm font-semibold text-fg-secondary";

export const PANEL = "rounded-control border border-line bg-surface-sunken p-4";
export const CHIP_BASE =
  "rounded-control border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer";
