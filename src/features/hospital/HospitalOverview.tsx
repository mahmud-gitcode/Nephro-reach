"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import {
  Button,
  Card,
  DonutChart,
  EmptyState,
  KeyCard,
  ProgressRing,
  Skeleton,
} from "@/components/ui";
import {
  CheckCircleSolid,
  ClockSolid,
  NotStartedSolid,
  UsersSolid,
} from "@/components/icons/solid";
import { PageTitle } from "@/components/layout/PageTitle";
import { useCan } from "@/features/staff/useStaffAccounts";
import { useHospital } from "./useHospital";
import { recentActivity, PROGRAMS } from "./hospital.data";
import { EnrollModal, shortDay } from "./HospitalUi";

/* ==========================================================================
   Hospital Overview — enrollment and education at a glance
   --------------------------------------------------------------------------
   The five things the client listed (2026-10-13): how many are enrolled,
   in a course, finished, not finished, and what happened lately. Laid out
   after the showcase: the figures in a row, then two-thirds / one-third.
   ========================================================================== */

const HREF = "/dashboard/hospital";

const EVENT_TEXT = {
  enrolled: "was enrolled",
  "day-completed": "completed Day",
  "course-completed": "completed the course",
  discharged: "was discharged",
} as const;

export default function HospitalOverview() {
  const hospital = useHospital();
  const canEnroll = useCan("hospital.enroll");
  const [enrolling, setEnrolling] = useState(false);
  const s = hospital.summary;
  const completionPct = s.enrolled
    ? Math.round((s.completed / s.enrolled) * 100)
    : 0;
  const activity = recentActivity(hospital.enrollments);

  return (
    <div className="space-y-stack-xl">
      <PageTitle
        href={HREF}
        title={hospital.hospitalName || "Hospital Overview"}
        action={
          canEnroll ? (
            <Button leadingIcon={<Plus />} onClick={() => setEnrolling(true)}>
              Enroll patient
            </Button>
          ) : null
        }
      />

      {hospital.isPending ? (
        <Skeleton height={140} />
      ) : (
        <section
          aria-label="Education at a glance"
          className="grid grid-cols-2 gap-inset-sm sm:gap-inset-md xl:grid-cols-4"
        >
          <KeyCard
            icon={<UsersSolid />}
            tone="brand"
            value={s.enrolled}
            label="Patients enrolled"
            note={`${s.newlyDiagnosed} newly diagnosed · ${s.onDialysis} on dialysis`}
          />
          <KeyCard
            icon={<ClockSolid />}
            tone="warning"
            value={s.inProgress}
            label="In a course now"
            note="Started, not finished"
          />
          <KeyCard
            icon={<CheckCircleSolid />}
            tone="success"
            value={s.completed}
            label="Completed"
            note={`${completionPct}% of enrolled`}
          />
          <KeyCard
            icon={<NotStartedSolid />}
            tone="danger"
            value={s.incomplete}
            label="Incomplete"
            note={`${s.notStarted} not started yet`}
          />
        </section>
      )}

      <section className="grid grid-cols-1 gap-inset-md xl:grid-cols-3">
        <Card as="section" className="space-y-stack-md xl:col-span-2">
          <div className="flex items-center justify-between gap-inline-md">
            <h2 className="text-heading-4 text-fg">Recent activity</h2>
            <Link
              href="/dashboard/hospital/patients"
              className="-my-2.5 inline-flex min-h-11 items-center gap-inline-xs text-label-md text-fg-brand hover:underline"
            >
              All patients <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          {activity.length === 0 ? (
            <EmptyState
              variant="bare"
              title="No activity yet"
              description="Enroll a patient to get started."
            />
          ) : (
            <ul className="divide-y divide-line-subtle">
              {activity.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-inline-md py-inset-xs"
                >
                  <span className="text-body-md text-fg">
                    <span className="text-label-md">{event.patientName}</span>{" "}
                    {EVENT_TEXT[event.kind]}
                    {event.kind === "day-completed" ? ` ${event.day}` : ""}
                  </span>
                  <span className="text-caption text-fg-muted tabular-nums">
                    {shortDay(event.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card as="section" className="space-y-stack-md">
          <h2 className="text-heading-4 text-fg">Course completion</h2>
          <div className="flex justify-center">
            <ProgressRing
              value={completionPct}
              label="Course completion"
              centerValue={`${completionPct}%`}
              centerLabel={`${s.completed} of ${s.enrolled}`}
              tone="success"
            />
          </div>
          <DonutChart
            className="self-center"
            label="Patients by kidney status"
            size={140}
            segments={[
              {
                label: "Newly diagnosed",
                value: s.newlyDiagnosed,
                tone: "brand",
              },
              { label: "On dialysis", value: s.onDialysis, tone: "accent" },
            ]}
            centerValue={s.enrolled}
            centerLabel="patients"
          />
          <ul className="flex flex-wrap justify-center gap-inline-lg text-body-sm text-fg-secondary">
            <li className="inline-flex items-center gap-inline-xs">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-pill bg-[var(--chart-brand)]"
              />
              Newly diagnosed · {s.newlyDiagnosed}
            </li>
            <li className="inline-flex items-center gap-inline-xs">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-pill bg-[var(--color-accent-600)]"
              />
              On dialysis · {s.onDialysis}
            </li>
          </ul>
          <p className="text-caption text-fg-muted">
            Programs: {PROGRAMS.map((p) => p.nameEn).join(", ")}.
          </p>
        </Card>
      </section>

      {enrolling ? (
        <EnrollModal
          existing={hospital.enrollments}
          onEnroll={hospital.enroll}
          onClose={() => setEnrolling(false)}
        />
      ) : null}
    </div>
  );
}
