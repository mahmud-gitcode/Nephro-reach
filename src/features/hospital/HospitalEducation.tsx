"use client";

import React from "react";
import {
  ClipboardCheck,
  MonitorPlay,
  Presentation,
  Puzzle,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";
import { useCan } from "@/features/staff/useStaffAccounts";
import { useHospital } from "./useHospital";
import {
  PROGRAMS,
  hasAccess,
  percentDone,
  programById,
  type LessonKind,
} from "./hospital.data";
import { DayDots, EducationBadge, shortDay } from "./HospitalUi";

/* ==========================================================================
   Kidney Education — the hospital's main feature
   --------------------------------------------------------------------------
   The client (2026-10-13): Day 1, 2 and 3 of the Kidney Failure Crash
   Course — videos, presentations, interactive activities and knowledge
   checks — with each patient's progress and continued access for 21 days
   after discharge. Programs are listed, not hard-wired, so the next one
   is added without redesigning this page.
   ========================================================================== */

const HREF = "/dashboard/hospital/education";

const KIND: Record<LessonKind, { icon: LucideIcon; label: string }> = {
  video: { icon: MonitorPlay, label: "Video" },
  presentation: { icon: Presentation, label: "Presentation" },
  activity: { icon: Puzzle, label: "Interactive activity" },
  "knowledge-check": { icon: ClipboardCheck, label: "Knowledge check" },
};

export default function HospitalEducation() {
  const hospital = useHospital();
  const canMonitor = useCan("hospital.education.monitor");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-stack-xl">
      <PageTitle href={HREF} />

      {PROGRAMS.map((program) => {
        const enrolled = hospital.enrollments.filter(
          (e) => e.programId === program.id,
        );
        return (
          <Card key={program.id} as="section" className="space-y-stack-md">
            <div className="flex flex-wrap items-start justify-between gap-inline-md">
              <div>
                <h2 className="text-heading-4 text-fg">{program.nameEn}</h2>
                <p className="mt-stack-xs measure text-body-sm text-fg-muted">
                  {program.summaryEn}
                </p>
              </div>
              <div className="flex flex-wrap gap-inline-sm">
                <Badge tone="info">{program.days.length} days</Badge>
                <Badge tone="neutral">
                  Access: while admitted + {program.accessDaysAfterDischarge}{" "}
                  days after discharge
                </Badge>
                <Badge tone="neutral">{enrolled.length} enrolled</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-inset-sm md:grid-cols-3">
              {program.days.map((day) => (
                <div
                  key={day.day}
                  className="space-y-stack-sm rounded-card-nested border border-line-subtle p-inset-sm"
                >
                  <p className="text-overline text-fg-brand">Day {day.day}</p>
                  <h3 className="text-heading-5 text-fg">{day.titleEn}</h3>
                  <ul className="space-y-stack-xs">
                    {day.items.map((item) => {
                      const Icon = KIND[item.kind].icon;
                      return (
                        <li
                          key={item.kind}
                          className="flex items-center gap-inline-sm text-body-sm text-fg-secondary"
                        >
                          <Icon
                            aria-hidden="true"
                            className="size-4 shrink-0 text-fg-muted"
                          />
                          {KIND[item.kind].label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-caption text-fg-muted">
              The course&rsquo;s videos, slides, activities and questions are
              added by NephroReach in Class Management. Patients complete the
              course in their own NephroReach account.
            </p>
          </Card>
        );
      })}

      {canMonitor ? (
        <Card padding="none" className="overflow-hidden">
          <div className="p-card">
            <h2 className="text-heading-4 text-fg">Patient progress</h2>
            <p className="mt-stack-xs text-body-sm text-fg-muted">
              Each day, its knowledge check, and whether the patient can still
              open the course.
            </p>
          </div>
          {hospital.isPending ? (
            <div className="p-card pt-0">
              <Skeleton height={200} />
            </div>
          ) : hospital.enrollments.length === 0 ? (
            <EmptyState
              title="No patients enrolled yet"
              description="Enroll patients on the Patients page."
            />
          ) : (
            <Table minWidth={900}>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Patient</TableHeaderCell>
                  <TableHeaderCell>Days</TableHeaderCell>
                  <TableHeaderCell numeric>Progress</TableHeaderCell>
                  <TableHeaderCell>Knowledge checks</TableHeaderCell>
                  <TableHeaderCell>Last activity</TableHeaderCell>
                  <TableHeaderCell>Course access</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hospital.enrollments.map((e) => {
                  const program = programById(e.programId);
                  const checks = (program?.days ?? [])
                    .map((d) => e.progress[d.day]?.knowledgeCheck)
                    .filter(Boolean);
                  return (
                    <TableRow key={e.id}>
                      <TableCell emphasis>
                        <span className="block">{e.patientName}</span>
                        <span className="block text-caption font-normal text-fg-muted">
                          {program?.nameEn}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex flex-wrap items-center gap-inline-sm">
                          <DayDots enrollment={e} />
                          <EducationBadge enrollment={e} />
                        </span>
                      </TableCell>
                      <TableCell numeric>{percentDone(e)}%</TableCell>
                      <TableCell>
                        {checks.length === 0
                          ? "—"
                          : checks
                              .map((c) => `${c!.score}/${c!.total}`)
                              .join(" · ")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        {shortDay(e.lastActivityAt)}
                      </TableCell>
                      <TableCell>
                        {hasAccess(e, today) ? (
                          <Badge tone="success">Open</Badge>
                        ) : (
                          <Badge tone="neutral">Ended</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      ) : null}
    </div>
  );
}
