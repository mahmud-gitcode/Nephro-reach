import type { BadgeProps } from "@/components/ui";
import type { AllergySeverity, ConditionStatus } from "./health.types";

/* The badge tone each severity and status takes. */

export const severityBadge: Record<
  AllergySeverity,
  Pick<BadgeProps, "tone" | "variant">
> = {
  Severe: { tone: "danger", variant: "soft" },
  Moderate: { tone: "warning", variant: "soft" },
  Mild: { tone: "neutral", variant: "soft" },
};

export const statusBadge: Record<
  ConditionStatus,
  Pick<BadgeProps, "tone" | "variant">
> = {
  Current: { tone: "success", variant: "soft" },
  Past: { tone: "neutral", variant: "soft" },
};
