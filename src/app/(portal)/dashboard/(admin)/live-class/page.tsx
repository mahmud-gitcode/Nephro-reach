"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Clock3,
  Plus,
  UserRoundCheck,
  Users,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  KeyCard,
  type KeyCardTone,
} from "@/components/ui";
import {
  ClockSolid,
  StarSolid,
  UsersSolid,
  VideoSolid,
} from "@/components/icons/solid";
import { PageTitle } from "@/components/layout/PageTitle";
import { useLiveClasses } from "@/features/clinic/useLiveClasses";
import {
  formatClassDate,
  recentClasses,
  summary,
} from "@/features/clinic/liveClass.data";
import type { ManagedClass } from "@/features/clinic/liveClass.actions";
import {
  ScheduleClassModal,
  classTone,
} from "@/features/clinic/LiveClassModals";

/* ==========================================================================
   Live Class (admin)
   --------------------------------------------------------------------------
   The same schedule the clinic's Live Class page edits and the member's
   dashboard reads: a class scheduled here shows up on both, and its
   meeting link becomes the member's Join button.
   ========================================================================== */

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

function DetailRow({
  icon: Icon,
  children,
}: {
  icon: IconType;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-inline-md text-body-sm text-fg-muted">
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-fg-muted" />
      <span>{children}</span>
    </li>
  );
}

function NextClassCard({ item }: { item: ManagedClass | undefined }) {
  if (!item) {
    return (
      <EmptyState
        variant="bare"
        title="Nothing scheduled"
        description="Schedule a class and it appears here and on every member's dashboard."
      />
    );
  }
  return (
    <Card as="article" padding="small">
      <Badge tone={classTone[item.status]}>{item.status}</Badge>
      <h3 className="mt-stack-md text-heading-4 text-fg">{item.topic}</h3>
      <p className="mt-0.5 text-body-sm text-fg-muted">{item.program}</p>
      <ul className="mt-stack-lg space-y-stack-md">
        <DetailRow icon={CalendarDays}>{formatClassDate(item.date)}</DetailRow>
        <DetailRow icon={Clock3}>{item.time}</DetailRow>
        <DetailRow icon={Users}>
          {item.registered}/{item.capacity} registered
        </DetailRow>
        {item.educator ? (
          <DetailRow icon={UserRoundCheck}>Educator: {item.educator}</DetailRow>
        ) : null}
      </ul>
      <Button
        size="small"
        fullWidth
        className="mt-stack-lg"
        disabled={!item.joinUrl}
        title={item.joinUrl ? undefined : "No meeting link added yet"}
        onClick={() =>
          item.joinUrl &&
          window.open(item.joinUrl, "_blank", "noopener,noreferrer")
        }
      >
        Join in
      </Button>
    </Card>
  );
}

function PastClassCard() {
  const last = [...recentClasses].sort((a, b) =>
    b.date.localeCompare(a.date),
  )[0];
  if (!last) return null;
  return (
    <Card as="article" padding="small">
      <Badge tone="neutral">Complete</Badge>
      <h3 className="mt-stack-md text-heading-4 text-fg">{last.title}</h3>
      <ul className="mt-stack-lg space-y-stack-md">
        <DetailRow icon={CalendarDays}>{formatClassDate(last.date)}</DetailRow>
        <DetailRow icon={Users}>{last.attended} attended</DetailRow>
      </ul>
    </Card>
  );
}

export default function LiveClassPage() {
  const { classes, upcoming, today, addClass, isPending } = useLiveClasses();
  const [scheduling, setScheduling] = useState(false);

  const stats: Array<{
    label: string;
    value: React.ReactNode;
    icon: React.ReactNode;
    tone: KeyCardTone;
  }> = [
    {
      label: "Upcoming Classes",
      value: upcoming.length,
      icon: <VideoSolid />,
      tone: "brand",
    },
    {
      label: "Total Registrations",
      value: upcoming.reduce((sum, item) => sum + item.registered, 0),
      icon: <UsersSolid />,
      tone: "success",
    },
    {
      label: "Average Attendance",
      value: `${summary.averageAttendancePct}%`,
      icon: <ClockSolid />,
      tone: "accent",
    },
    {
      label: "Average Rating",
      value: summary.averageRating,
      icon: <StarSolid />,
      tone: "warning",
    },
  ];

  return (
    <div className="space-y-stack-lg">
      <PageTitle
        href="/dashboard/live-class"
        action={
          <Button
            leadingIcon={<Plus aria-hidden="true" />}
            onClick={() => setScheduling(true)}
            disabled={isPending}
          >
            Schedule Class
          </Button>
        }
      />

      <section className="grid grid-cols-1 gap-inline-lg sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <KeyCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            tone={stat.tone}
          />
        ))}
      </section>

      <div className="grid grid-cols-1 gap-inline-lg xl:grid-cols-2">
        <Card as="section" padding="small">
          <h2 className="mb-stack-lg text-heading-4 text-fg">Next Upcoming</h2>
          <NextClassCard item={upcoming[0]} />
        </Card>
        <Card as="section" padding="small">
          <h2 className="mb-stack-lg text-heading-4 text-fg">Past Classes</h2>
          <PastClassCard />
        </Card>
      </div>

      {scheduling ? (
        <ScheduleClassModal
          open
          onClose={() => setScheduling(false)}
          classes={classes}
          editing={null}
          today={today}
          onSave={(draft) => addClass(draft)}
        />
      ) : null}
    </div>
  );
}
