import React from "react";
import {
  AlertTriangleSolid,
  CheckCircleSolid,
  ClockSolid,
  GraduationCapSolid,
  NotStartedSolid,
  type SolidIconProps,
} from "@/components/icons/solid";
import type { MemberStatus } from "./clinicDashboard.data";
import type { KeyCardTone } from "@/components/ui";

/* ==========================================================================
   A member status, as a KeyCard needs it
   --------------------------------------------------------------------------
   The glyphs themselves live in `@/components/icons/solid`, because nothing
   about them is clinic-specific. What is clinic-specific is which glyph and
   which colour a status takes, and that is what these two maps hold.
   ========================================================================== */

export const statusIconSolid: Record<
  MemberStatus,
  React.ComponentType<SolidIconProps>
> = {
  "On Track": CheckCircleSolid,
  "Need Follow-Up": ClockSolid,
  "Attention Needed": AlertTriangleSolid,
  "Not Started": NotStartedSolid,
  Completed: GraduationCapSolid,
};

/** The status colour as ink, for a glyph or a word rather than a panel. */
export const statusText: Record<MemberStatus, string> = {
  "On Track": "text-success",
  "Need Follow-Up": "text-warning",
  "Attention Needed": "text-danger",
  "Not Started": "text-fg-muted",
  Completed: "text-fg-brand",
};

export const statusKeyTone: Record<MemberStatus, KeyCardTone> = {
  "On Track": "success",
  "Need Follow-Up": "warning",
  "Attention Needed": "danger",
  "Not Started": "neutral",
  Completed: "brand",
};
