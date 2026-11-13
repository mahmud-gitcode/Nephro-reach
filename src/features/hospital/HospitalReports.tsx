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
import { useLanguageCode } from "@/context/LanguageContext";
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
import { educationStatus, programNameOf } from "./hospital.data";
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
const PATIENT_REPORT_NOTE_ES =
  "El informe de pacientes aún no está disponible: necesita una descarga auditada de NephroReach.";

function monthLabel(key: string, isEs = false): string {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString(isEs ? "es-US" : "en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function HospitalReports() {
  const isEs = useLanguageCode() === "ES";
  const lang = isEs ? "es" : "en";
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
                title={isEs ? PATIENT_REPORT_NOTE_ES : PATIENT_REPORT_NOTE}
                aria-describedby="hospital-patient-report-na"
              >
                {isEs
                  ? "Descargar informe de pacientes"
                  : "Download patient report"}
              </Button>
              <p
                id="hospital-patient-report-na"
                className="text-caption text-fg-muted"
              >
                {isEs ? "Aún no disponible" : "Not available yet"}
              </p>
            </div>
          ) : null
        }
      />

      <AsyncSection
        pending={report.isPending}
        error={report.error}
        errorTitle={errorTitleFor(
          report.error,
          isEs ? "El informe no se cargó" : "The report did not load",
          lang,
        )}
        errorMessage={errorMessageFor(report.error, undefined, lang)}
        onRetry={canRetry(report.error) ? report.refetch : undefined}
        skeleton={<Skeleton height={140} />}
      >
        {s ? (
          <section className="grid grid-cols-2 gap-inset-sm sm:gap-inset-md xl:grid-cols-4">
            <KeyCard
              icon={<UsersSolid />}
              tone="brand"
              value={s.enrolled}
              label={isEs ? "Pacientes inscritos" : "Patients enrolled"}
            />
            <KeyCard
              icon={<GraduationCapSolid />}
              tone="accent"
              value={s.started}
              label={isEs ? "Comenzaron la educación" : "Started education"}
              note={
                isEs
                  ? `${s.notStarted} sin comenzar`
                  : `${s.notStarted} not started`
              }
            />
            <KeyCard
              icon={<CheckCircleSolid />}
              tone="success"
              value={s.completed}
              label={isEs ? "Completaron la educación" : "Completed education"}
            />
            <KeyCard
              icon={<TargetSolid />}
              tone="warning"
              value={`${s.completionPct}%`}
              label={isEs ? "Finalización del curso" : "Course completion"}
              note={
                isEs
                  ? `${s.incomplete} incompletos`
                  : `${s.incomplete} incomplete`
              }
            />
          </section>
        ) : null}
      </AsyncSection>

      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-inline-md p-card">
          <h2 className="text-heading-4 text-fg">
            {isEs ? "Participación mensual" : "Monthly participation"}
          </h2>
          {canDownload && report.months.length > 0 ? (
            <Button
              size="small"
              variant="neutral"
              appearance="fill-stroke"
              leadingIcon={<Download />}
              loading={download.isPending}
              onClick={() => download.mutate()}
            >
              {isEs ? "Descargar" : "Download"}
            </Button>
          ) : null}
        </div>
        {download.error ? (
          <div className="px-card pb-card">
            <Alert tone="danger">{actionErrorText(download.error, isEs)}</Alert>
          </div>
        ) : null}
        <AsyncSection
          pending={report.isPending}
          error={report.error}
          errorTitle={errorTitleFor(
            report.error,
            isEs ? "El informe no se cargó" : "The report did not load",
            lang,
          )}
          errorMessage={errorMessageFor(report.error, undefined, lang)}
          onRetry={canRetry(report.error) ? report.refetch : undefined}
          isEmpty={report.months.length === 0}
          skeleton={
            <div className="p-card pt-0">
              <Skeleton height={160} />
            </div>
          }
          empty={
            <EmptyState
              title={isEs ? "Aún no hay inscripciones" : "No enrollments yet"}
            />
          }
        >
          <Table minWidth={640}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>
                  {isEs ? "Mes de inscripción" : "Month enrolled"}
                </TableHeaderCell>
                <TableHeaderCell numeric>
                  {isEs ? "Inscritos" : "Enrolled"}
                </TableHeaderCell>
                <TableHeaderCell numeric>
                  {isEs ? "Comenzaron" : "Started"}
                </TableHeaderCell>
                <TableHeaderCell numeric>
                  {isEs ? "Completaron" : "Completed"}
                </TableHeaderCell>
                <TableHeaderCell numeric>
                  {isEs ? "Finalización" : "Completion"}
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.months.map((row) => (
                <TableRow key={row.month}>
                  <TableCell emphasis>{monthLabel(row.month, isEs)}</TableCell>
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
          <h2 className="text-heading-4 text-fg">
            {isEs ? "Cursos incompletos" : "Incomplete courses"}
          </h2>
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            {isEs
              ? "Pacientes que no han terminado su programa (la página de pacientes cargada)."
              : "Patients who have not finished their program (the loaded page of patients)."}
          </p>
        </div>
        <AsyncSection
          pending={hospital.isPending}
          error={hospital.error}
          errorTitle={errorTitleFor(
            hospital.error,
            isEs ? "Los pacientes no se cargaron" : "Patients did not load",
            lang,
          )}
          errorMessage={errorMessageFor(hospital.error, undefined, lang)}
          onRetry={canRetry(hospital.error) ? hospital.refetch : undefined}
          isEmpty={incomplete.length === 0}
          skeleton={
            <div className="p-card pt-0">
              <Skeleton height={160} />
            </div>
          }
          empty={
            <EmptyState
              title={
                isEs
                  ? "Todos los pacientes inscritos han terminado"
                  : "Every enrolled patient has finished"
              }
            />
          }
        >
          <Table minWidth={720}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>
                  {isEs ? "Paciente" : "Patient"}
                </TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Programa" : "Program"}
                </TableHeaderCell>
                <TableHeaderCell>{isEs ? "Clases" : "Classes"}</TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Inscrito" : "Enrolled"}
                </TableHeaderCell>
                <TableHeaderCell>{isEs ? "Estado" : "Status"}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incomplete.map((e) => (
                <TableRow key={e.id}>
                  <TableCell emphasis>{e.patientName}</TableCell>
                  <TableCell>{programNameOf(e, isEs)}</TableCell>
                  <TableCell>
                    <DayDots enrollment={e} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {shortDay(e.enrolledAt, isEs)}
                  </TableCell>
                  <TableCell>
                    {educationStatus(e) === "not-started" ? (
                      <Badge tone="neutral">
                        {isEs ? "Sin comenzar" : "Not started"}
                      </Badge>
                    ) : (
                      <Badge tone="warning">
                        {isEs ? "En progreso" : "In progress"}
                      </Badge>
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
                {isEs ? "Ver más pacientes" : "Show more patients"}
              </Button>
            </div>
          ) : null}
        </AsyncSection>
      </Card>
    </div>
  );
}
