"use client";

import React from "react";
import { Download } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  Card,
  EmptyState,
  KeyCard,
  Skeleton,
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
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { downloadText } from "@/lib/utils/download";
import { actionErrorText } from "@/features/clinic/officeContext";
import { requireOffice } from "@/features/clinic/office.scope";
import { useCan } from "@/features/staff/useStaffAccounts";
import { exportEducationReport } from "./hospital.repository";
import { useHospital } from "./useHospital";
import { educationStatus } from "./hospital.data";
import { DayDots, shortDay } from "./HospitalUi";

/* ==========================================================================
   Education Reports
   --------------------------------------------------------------------------
   For hospital administrators and education staff (client, 2026-10-13):
   enrolled, started, completed, the completion rate, who has not finished,
   and participation month by month.

   The figures and the monthly table are the server's education report.
   The download is the server's CSV of those counts: the server audits every
   download (it appears in the hospital's activity log), and it holds no
   names or MRNs. A per-patient file has no audited server source yet
   (B14-4), so that button is shown but not available.
   ========================================================================== */

const HREF = "/dashboard/hospital/reports";
const PATIENT_REPORT_NOTE =
  "The patient report is not available yet: it needs an audited download from NephroReach.";

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function HospitalReports() {
  const hospital = useHospital();
  const report = hospital.report;
  const canDownload = useCan("hospital.reports.download");
  const s = report.summary;
  const download = useMutation({
    mutationFn: () => exportEducationReport(requireOffice(hospital.orgId)),
    onSuccess: (file) => downloadText(file.filename, file.csv, "text/csv"),
  });
  const incomplete = hospital.enrollments.filter(
    (e) => educationStatus(e) !== "completed" && e.status !== "withdrawn",
  );

  return (
    <div className="space-y-stack-xl">
      <PageTitle
        href={HREF}
        action={
          canDownload ? (
            <div className="flex flex-col items-end gap-stack-xs">
              <Button
                leadingIcon={<Download />}
                disabled
                title={PATIENT_REPORT_NOTE}
                aria-describedby="hospital-patient-report-na"
              >
                Download patient report
              </Button>
              <p
                id="hospital-patient-report-na"
                className="text-caption text-fg-muted"
              >
                Not available yet
              </p>
            </div>
          ) : null
        }
      />

      <AsyncSection
        pending={report.isPending}
        error={report.error}
        errorTitle={errorTitleFor(report.error, "The report did not load")}
        errorMessage={errorMessageFor(report.error, undefined)}
        onRetry={canRetry(report.error) ? report.refetch : undefined}
        skeleton={<Skeleton height={140} />}
      >
        {s ? (
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
              value={s.started}
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
              value={`${s.completionPct}%`}
              label="Course completion"
              note={`${s.incomplete} incomplete`}
            />
          </section>
        ) : null}
      </AsyncSection>

      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-inline-md p-card">
          <h2 className="text-heading-4 text-fg">Monthly participation</h2>
          {canDownload && report.months.length > 0 ? (
            <Button
              size="small"
              variant="neutral"
              appearance="fill-stroke"
              leadingIcon={<Download />}
              loading={download.isPending}
              onClick={() => download.mutate()}
            >
              Download
            </Button>
          ) : null}
        </div>
        {download.error ? (
          <div className="px-card pb-card">
            <Alert tone="danger">{actionErrorText(download.error)}</Alert>
          </div>
        ) : null}
        <AsyncSection
          pending={report.isPending}
          error={report.error}
          errorTitle={errorTitleFor(report.error, "The report did not load")}
          errorMessage={errorMessageFor(report.error, undefined)}
          onRetry={canRetry(report.error) ? report.refetch : undefined}
          isEmpty={report.months.length === 0}
          skeleton={
            <div className="p-card pt-0">
              <Skeleton height={160} />
            </div>
          }
          empty={<EmptyState title="No enrollments yet" />}
        >
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
              {report.months.map((row) => (
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
        </AsyncSection>
      </Card>

      <Card padding="none" className="overflow-hidden">
        <div className="p-card">
          <h2 className="text-heading-4 text-fg">Incomplete courses</h2>
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            Patients who have not finished their program (the loaded page of
            patients).
          </p>
        </div>
        <AsyncSection
          pending={hospital.isPending}
          error={hospital.error}
          errorTitle={errorTitleFor(hospital.error, "Patients did not load")}
          errorMessage={errorMessageFor(hospital.error, undefined)}
          onRetry={canRetry(hospital.error) ? hospital.refetch : undefined}
          isEmpty={incomplete.length === 0}
          skeleton={
            <div className="p-card pt-0">
              <Skeleton height={160} />
            </div>
          }
          empty={<EmptyState title="Every enrolled patient has finished" />}
        >
          <Table minWidth={720}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Patient</TableHeaderCell>
                <TableHeaderCell>Program</TableHeaderCell>
                <TableHeaderCell>Classes</TableHeaderCell>
                <TableHeaderCell>Enrolled</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incomplete.map((e) => (
                <TableRow key={e.id}>
                  <TableCell emphasis>{e.patientName}</TableCell>
                  <TableCell>{e.programName}</TableCell>
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
          {hospital.hasMore ? (
            <div className="flex justify-center p-card">
              <Button
                size="small"
                variant="neutral"
                appearance="fill-stroke"
                disabled={hospital.isLoadingMore}
                onClick={hospital.loadMore}
              >
                Show more patients
              </Button>
            </div>
          ) : null}
        </AsyncSection>
      </Card>
    </div>
  );
}
