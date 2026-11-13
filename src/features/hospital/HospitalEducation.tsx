"use client";

import React from "react";
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  Headphones,
  MonitorPlay,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  AsyncSection,
  Badge,
  Button,
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
import { useLanguageCode } from "@/context/LanguageContext";
import { patientKey } from "@/lib/data/queryKeys";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { useCan } from "@/features/staff/useStaffAccounts";
import { getLearnerCourse } from "@/features/education/education.repository";
import {
  useHospitalEnrollments,
  useHospitalOffice,
  useHospitalPrograms,
} from "./useHospital";
import {
  percentDone,
  programNameOf,
  type HospitalEnrollment,
} from "./hospital.data";
import { DayDots, EducationBadge, shortDay } from "./HospitalUi";

/* ==========================================================================
   Kidney Education: the hospital's main feature
   --------------------------------------------------------------------------
   The client (2026-10-13): the Kidney Failure Crash Course day by day, with
   each patient's progress and continued access after discharge. Programs
   are the published courses with an access rule after discharge, so the
   next one is added in Class Management without redesigning this page.

   Progress, access and the knowledge-check scores are the server's: the
   enrollment list carries the class counts and access, and each patient's
   scores come from their learner record as this hospital (the server
   returns scores only, never answers or notes, and audits the read).
   ========================================================================== */

const HREF = "/dashboard/hospital/education";

const KIND: Record<string, { icon: LucideIcon; label: string; es: string }> = {
  video: { icon: MonitorPlay, label: "Video", es: "Video" },
  audio: { icon: Headphones, label: "Audio", es: "Audio" },
  reading: { icon: BookOpen, label: "Reading", es: "Lectura" },
  exam: {
    icon: ClipboardCheck,
    label: "Knowledge check",
    es: "Prueba de conocimientos",
  },
};
const OTHER = { icon: FileText, label: "Lesson", es: "Lección" };

/** "4/5 · 5/5": the patient's scored attempts in this course. */
function KnowledgeChecks({ enrollment }: { enrollment: HospitalEnrollment }) {
  const isEs = useLanguageCode() === "ES";
  const { orgId } = useHospitalOffice();
  const courseId = enrollment.courseId;
  const scope = orgId
    ? { patientId: enrollment.patientId, organizationId: orgId }
    : null;
  const query = useQuery({
    queryKey: scope
      ? patientKey(scope, "education", "course", courseId ?? "none")
      : ["patient", "none", "education", "course"],
    queryFn: () => getLearnerCourse(scope!, courseId!),
    enabled: scope !== null && courseId !== null,
    staleTime: 60_000,
  });
  if (!courseId || query.isPending) return <>—</>;
  if (query.error)
    return (
      <span className="text-fg-muted">
        {isEs ? "No disponible" : "Not available"}
      </span>
    );
  const attempts = query.data?.attempts ?? [];
  if (attempts.length === 0) return <>—</>;
  return <>{attempts.map((a) => `${a.correct}/${a.total}`).join(" · ")}</>;
}

function EnrolledCount({ courseId }: { courseId: string }) {
  const isEs = useLanguageCode() === "ES";
  const list = useHospitalEnrollments({ courseId });
  if (list.isPending || list.error || list.total === null) return null;
  return (
    <Badge tone="neutral">
      {isEs ? `${list.total} inscritos` : <>{list.total} enrolled</>}
    </Badge>
  );
}

export default function HospitalEducation() {
  const isEs = useLanguageCode() === "ES";
  const lang = isEs ? "es" : "en";
  const programs = useHospitalPrograms();
  const hospital = useHospitalEnrollments();
  const canMonitor = useCan("hospital.education.monitor");

  return (
    <div className="space-y-stack-xl">
      <PageTitle href={HREF} />

      <AsyncSection
        pending={programs.isPending}
        error={programs.error}
        errorTitle={errorTitleFor(
          programs.error,
          isEs ? "Los programas no se cargaron" : "Programs did not load",
          lang,
        )}
        errorMessage={errorMessageFor(programs.error, undefined, lang)}
        onRetry={canRetry(programs.error) ? programs.refetch : undefined}
        isEmpty={programs.programs.length === 0}
        skeleton={<Skeleton height={220} />}
        empty={
          <EmptyState
            title={
              isEs
                ? "Aún no hay ningún programa publicado"
                : "No program is published yet"
            }
            description={
              isEs
                ? "NephroReach publica los programas hospitalarios en Gestión de clases."
                : "NephroReach publishes the hospital programs in Class Management."
            }
          />
        }
      >
        {programs.programs.map((program) => (
          <Card key={program.id} as="section" className="space-y-stack-md">
            <div className="flex flex-wrap items-start justify-between gap-inline-md">
              <div>
                <h2 className="text-heading-4 text-fg">
                  {isEs ? program.nameEs : program.nameEn}
                </h2>
                <p className="mt-stack-xs measure text-body-sm text-fg-muted">
                  {isEs ? program.summaryEs : program.summaryEn}
                </p>
              </div>
              <div className="flex flex-wrap gap-inline-sm">
                {program.days.length > 0 ? (
                  <Badge tone="info">
                    {isEs ? (
                      `${program.days.length} días`
                    ) : (
                      <>{program.days.length} days</>
                    )}
                  </Badge>
                ) : null}
                <Badge tone="neutral">
                  {isEs ? (
                    `Acceso: durante la hospitalización + ${program.accessDaysAfterDischarge} días después del alta`
                  ) : (
                    <>
                      Access: while admitted +{" "}
                      {program.accessDaysAfterDischarge} days after discharge
                    </>
                  )}
                </Badge>
                {canMonitor ? <EnrolledCount courseId={program.id} /> : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-inset-sm md:grid-cols-3">
              {program.days.map((day) => (
                <div
                  key={day.day}
                  className="space-y-stack-sm rounded-card-nested border border-line-subtle p-inset-sm"
                >
                  <p className="text-overline text-fg-brand">
                    {isEs ? `Día ${day.day}` : <>Day {day.day}</>}
                  </p>
                  <h3 className="text-heading-5 text-fg">
                    {isEs ? day.titleEs : day.titleEn}
                  </h3>
                  <ul className="space-y-stack-xs">
                    {day.items.map((item, index) => {
                      const kind = KIND[item.kind] ?? OTHER;
                      const Icon = kind.icon;
                      return (
                        <li
                          key={`${item.kind}-${index}`}
                          className="flex items-center gap-inline-sm text-body-sm text-fg-secondary"
                        >
                          <Icon
                            aria-hidden="true"
                            className="size-4 shrink-0 text-fg-muted"
                          />
                          {isEs ? (
                            `${kind.es}: ${item.titleEs}`
                          ) : (
                            <>
                              {kind.label}: {item.titleEn}
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-caption text-fg-muted">
              {isEs ? (
                "NephroReach agrega los videos, diapositivas, actividades y preguntas del curso en Gestión de clases. Los pacientes completan el curso en su propia cuenta de NephroReach."
              ) : (
                <>
                  The course&rsquo;s videos, slides, activities and questions
                  are added by NephroReach in Class Management. Patients
                  complete the course in their own NephroReach account.
                </>
              )}
            </p>
          </Card>
        ))}
      </AsyncSection>

      {canMonitor ? (
        <Card padding="none" className="overflow-hidden">
          <div className="p-card">
            <h2 className="text-heading-4 text-fg">
              {isEs ? "Progreso de los pacientes" : "Patient progress"}
            </h2>
            <p className="mt-stack-xs text-body-sm text-fg-muted">
              {isEs
                ? "Clases completadas, puntajes de las pruebas de conocimientos y si el paciente todavía puede abrir el curso."
                : "Classes completed, knowledge-check scores, and whether the patient can still open the course."}
            </p>
          </div>
          <AsyncSection
            pending={hospital.isPending}
            error={hospital.error}
            errorTitle={errorTitleFor(
              hospital.error,
              isEs ? "El progreso no se cargó" : "Progress did not load",
              lang,
            )}
            errorMessage={errorMessageFor(hospital.error, undefined, lang)}
            onRetry={canRetry(hospital.error) ? hospital.refetch : undefined}
            isEmpty={hospital.enrollments.length === 0}
            skeleton={
              <div className="p-card pt-0">
                <Skeleton height={200} />
              </div>
            }
            empty={
              <EmptyState
                title={
                  isEs
                    ? "Aún no hay pacientes inscritos"
                    : "No patients enrolled yet"
                }
                description={
                  isEs
                    ? "Inscriba a los pacientes en la página Pacientes."
                    : "Enroll patients on the Patients page."
                }
              />
            }
          >
            <Table minWidth={900}>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>
                    {isEs ? "Paciente" : "Patient"}
                  </TableHeaderCell>
                  <TableHeaderCell>
                    {isEs ? "Clases" : "Classes"}
                  </TableHeaderCell>
                  <TableHeaderCell numeric>
                    {isEs ? "Progreso" : "Progress"}
                  </TableHeaderCell>
                  <TableHeaderCell>
                    {isEs ? "Pruebas de conocimientos" : "Knowledge checks"}
                  </TableHeaderCell>
                  <TableHeaderCell>
                    {isEs ? "Última actividad" : "Last activity"}
                  </TableHeaderCell>
                  <TableHeaderCell>
                    {isEs ? "Acceso al curso" : "Course access"}
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hospital.enrollments.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell emphasis>
                      <span className="block">{e.patientName}</span>
                      <span className="block text-caption font-normal text-fg-muted">
                        {programNameOf(e, isEs)}
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
                      <KnowledgeChecks enrollment={e} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {shortDay(e.progress.lastActivityAt, isEs)}
                    </TableCell>
                    <TableCell>
                      {e.hasAccess ? (
                        <Badge tone="success">
                          {isEs ? "Abierto" : "Open"}
                        </Badge>
                      ) : (
                        <Badge tone="neutral">
                          {isEs ? "Terminado" : "Ended"}
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
      ) : null}
    </div>
  );
}
