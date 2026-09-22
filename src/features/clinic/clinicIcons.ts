import type React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  GraduationCap,
  MessageCircleQuestion,
  Video,
} from "lucide-react";
import type { MemberStatus } from "./clinicDashboard.data";
import type { ActivityKind } from "./members.data";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

/* ==========================================================================
   Clinic status and activity icons
   --------------------------------------------------------------------------
   One icon per status, used by every clinic page that shows one, so a
   status reads the same on the dashboard, the Member page and anywhere
   after — and never on colour alone.
   ========================================================================== */

export const statusIcon: Record<MemberStatus, IconType> = {
  "On Track": CheckCircle2,
  "Need Follow-Up": Clock3,
  "Attention Needed": AlertTriangle,
  "Not Started": CircleDashed,
  Completed: GraduationCap,
};

/** Surface and ink for a status tile — the same steps Badge draws with. */
export const statusTile: Record<MemberStatus, string> = {
  "On Track": "bg-success-surface text-success",
  "Need Follow-Up": "bg-warning-surface text-warning",
  "Attention Needed": "bg-danger-surface text-danger",
  "Not Started": "bg-surface-sunken text-fg-secondary",
  Completed: "bg-info-surface text-info",
};

export const activityIcon: Record<
  ActivityKind,
  { icon: IconType; tile: string }
> = {
  completed: { icon: CheckCircle2, tile: "bg-success-surface text-success" },
  missed: { icon: AlertTriangle, tile: "bg-danger-surface text-danger" },
  attended: { icon: Video, tile: "bg-surface-brand-subtle text-brand-600" },
  question: {
    icon: MessageCircleQuestion,
    tile: "bg-warning-surface text-warning",
  },
};

/** "Angela T. Brown" → "AB". Middle initials are dropped. */
export function initials(name: string) {
  return name
    .split(" ")
    .filter((part) => !part.endsWith("."))
    .map((part) => part[0])
    .join("");
}

/** "Journey to Dialysis (21-Day)" → "Journey to Dialysis". */
export function shortProgram(program: string) {
  return program.replace(/ \(.*\)$/, "");
}
