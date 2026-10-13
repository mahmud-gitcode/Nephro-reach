"use client";

import React from "react";
import { Download } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  KeyCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import {
  CheckCircleSolid,
  GraduationCapSolid,
  TargetSolid,
  UsersSolid,
} from "@/components/icons/solid";
import { PageTitle } from "@/components/layout/PageTitle";
import { useCan } from "@/features/staff/useStaffAccounts";
import { downloadText } from "@/lib/utils/download";
import { useHospital } from "./useHospital";
import {
  educationStatus,
  enrollmentsCsv,
  monthlyCsv,
  monthlyReport,
  programById,
} from "./hospital.data";
import { DayDots, shortDay } from "./HospitalUi";

/* ==========================================================================
   Education Reports
   --------------------------------------------------------------------------
   For hospital administrators and education staff (client, 2026-10-13):
   enrolled, started, completed, the completion rate, who has not finished,
   and participation month by month — downloadable where the role allows.
   ========================================================================== */

const HREF = "/dashboard/hospital/reports";

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function HospitalReports() {
  const hospital = useHospital();
  const canDownload = useCan("hospital.reports.download");
  const s = hospital.summary;
  const started = s.enrolled - s.notStarted;
  const completionPct = s.enrolled
    ? Math.round((s.completed / s.enrolled) * 100)
    : 0;
  const months = monthlyReport(hospital.enrollments);
  const incomplete = hospital.enrollments.filter(
    (e) => educationStatus(e) !== "completed",
  );
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-stack-xl">
      <PageTitle
        href={HREF}
        action={
          canDownload ? (
            <Button
              leadingIcon={<Download />}
              onClick={() =>
                downloadText(
                  `education-patients-${stamp}.csv`,
                  enrollmentsCsv(hospital.enrollments),
                  "text/csv",
                )
              }
            >
              Download patient report
            </Button>
          ) : null
        }
      />

      <section className="grid grid-cols-2 gap-inset-sm sm:gap-inset-md xl:grid-cols-4">
        <KeyCard
          icon={<UsersSolid />}
          tone="brand"
          value={s.enrolled}
          label="Patients enrolled"
        />
        <KeyCard
          icon={<GraduationCapSolid />}
          tone="accent"
          value={started}
          label="Started education"
          note={`${s.notStarted} not started`}
        />
        <KeyCard
          icon={<CheckCircleSolid />}
          tone="success"
          value={s.completed}
          label="Completed education"
        />
        <KeyCard
          icon={<TargetSolid />}
          tone="warning"
          value={`${completionPct}%`}
          label="Course completion"
          note={`${s.incomplete} incomplete`}
        />
      </section>

      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-inline-md p-card">
          <h2 className="text-heading-4 text-fg">Monthly participation</h2>
          {canDownload && months.length > 0 ? (
            <Button
              size="small"
              variant="neutral"
              appearance="fill-stroke"
              leadingIcon={<Download />}
              onClick={() =>
                downloadText(
                  `education-monthly-${stamp}.csv`,
                  monthlyCsv(months),
                  "text/csv",
                )
              }
            >
              Download
            </Button>
          ) : null}
        </div>
        {months.length === 0 ? (
          <EmptyState title="No enrollments yet" />
        ) : (
          <Table minWidth={640}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Month enrolled</TableHeaderCell>
                <TableHeaderCell numeric>Enrolled</TableHeaderCell>
                <TableHeaderCell numeric>Started</TableHeaderCell>
                <TableHeaderCell numeric>Completed</TableHeaderCell>
                <TableHeaderCell numeric>Completion</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {months.map((row) => (
                <TableRow key={row.month}>
                  <TableCell emphasis>{monthLabel(row.month)}</TableCell>
                  <TableCell numeric>{row.enrolled}</TableCell>
                  <TableCell numeric>{row.started}</TableCell>
                  <TableCell numeric>{row.completed}</TableCell>
                  <TableCell numeric>{row.completionPct}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card padding="none" className="overflow-hidden">
        <div className="p-card">
          <h2 className="text-heading-4 text-fg">Incomplete courses</h2>
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            Patients who have not finished their program.
          </p>
        </div>
        {incomplete.length === 0 ? (
          <EmptyState title="Every enrolled patient has finished" />
        ) : (
          <Table minWidth={720}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Patient</TableHeaderCell>
                <TableHeaderCell>Program</TableHeaderCell>
                <TableHeaderCell>Days</TableHeaderCell>
                <TableHeaderCell>Enrolled</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incomplete.map((e) => (
                <TableRow key={e.id}>
                  <TableCell emphasis>{e.patientName}</TableCell>
                  <TableCell>{programById(e.programId)?.nameEn}</TableCell>
                  <TableCell>
                    <DayDots enrollment={e} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {shortDay(e.enrolledAt)}
                  </TableCell>
                  <TableCell>
                    {educationStatus(e) === "not-started" ? (
                      <Badge tone="neutral">Not started</Badge>
                    ) : (
                      <Badge tone="warning">In progress</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
