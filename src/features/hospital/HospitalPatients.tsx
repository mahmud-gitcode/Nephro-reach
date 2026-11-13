"use client";

import React, { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import {
  AsyncSection,
  Button,
  Card,
  EmptyState,
  SearchField,
  Select,
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
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { useCan } from "@/features/staff/useStaffAccounts";
import {
  useEnrollPatient,
  useHospitalEnrollments,
  useHospitalPrograms,
  useUpdateEnrollment,
} from "./useHospital";
import {
  educationStatus,
  type EnrollmentStatus,
  type HospitalEnrollment,
  programNameOf,
} from "./hospital.data";
import {
  DayDots,
  DiagnosisBadge,
  EditEnrollmentModal,
  EducationBadge,
  EnrollModal,
  EnrollmentBadge,
  shortDay,
} from "./HospitalUi";

/* ==========================================================================
   Hospital Patients — enrollment and management
   --------------------------------------------------------------------------
   The patients enrolled through this hospital only (client, 2026-10-13):
   when they were enrolled, newly diagnosed or already on dialysis, their
   program and where they are in it, and their enrollment status — which
   staff with the permission can update.

   The list is the server's (this hospital's own roster, a page at a
   time); the status filter is sent to the server, and the search and the
   education filter apply to the loaded rows only.
   ========================================================================== */

const HREF = "/dashboard/hospital/patients";

export default function HospitalPatients() {
  const isEs = useLanguageCode() === "ES";
  const canEnroll = useCan("hospital.enroll");
  const canAssign = useCan("hospital.education.assign");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [education, setEducation] = useState("all");
  const [enrolling, setEnrolling] = useState(false);
  const [editing, setEditing] = useState<HospitalEnrollment | null>(null);
  const hospital = useHospitalEnrollments(
    status === "all" ? {} : { status: status as EnrollmentStatus },
  );
  const programs = useHospitalPrograms().programs;
  const enroll = useEnrollPatient(programs);
  const update = useUpdateEnrollment(programs);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hospital.enrollments.filter(
      (e) =>
        (education === "all" || educationStatus(e) === education) &&
        (!q ||
          e.patientName.toLowerCase().includes(q) ||
          e.mrn.toLowerCase().includes(q)),
    );
  }, [hospital.enrollments, query, education]);

  const closeEnroll = () => {
    enroll.reset();
    enroll.forgetPartial();
    setEnrolling(false);
  };
  const closeEdit = () => {
    update.reset();
    setEditing(null);
  };

  return (
    <div className="space-y-stack-xl">
      <PageTitle
        href={HREF}
        action={
          canEnroll && canAssign ? (
            <Button leadingIcon={<Plus />} onClick={() => setEnrolling(true)}>
              {isEs ? "Inscribir paciente" : "Enroll patient"}
            </Button>
          ) : null
        }
      />

      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-inline-md p-card sm:flex-row sm:flex-wrap sm:items-end">
          <SearchField
            label={isEs ? "Buscar pacientes" : "Search patients"}
            placeholder={isEs ? "Nombre o MRN…" : "Name or MRN…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="sm:w-72"
          />
          <Select
            aria-label={isEs ? "Estado de la inscripción" : "Enrollment status"}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="sm:w-60"
          >
            <option value="all">
              {isEs
                ? "Todos los estados de inscripción"
                : "All enrollment statuses"}
            </option>
            <option value="admitted">
              {isEs ? "Hospitalizado" : "Admitted"}
            </option>
            <option value="discharged">
              {isEs ? "Dado de alta" : "Discharged"}
            </option>
            <option value="withdrawn">{isEs ? "Retirado" : "Withdrawn"}</option>
          </Select>
          <Select
            aria-label={isEs ? "Estado educativo" : "Education status"}
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            className="sm:w-60"
          >
            <option value="all">
              {isEs ? "Todos los estados educativos" : "All education statuses"}
            </option>
            <option value="not-started">
              {isEs ? "Sin comenzar" : "Not started"}
            </option>
            <option value="in-progress">
              {isEs ? "En progreso" : "In progress"}
            </option>
            <option value="completed">
              {isEs ? "Completado" : "Completed"}
            </option>
          </Select>
        </div>

        <AsyncSection
          pending={hospital.isPending}
          error={hospital.error}
          errorTitle={errorTitleFor(
            hospital.error,
            isEs ? "Los pacientes no se cargaron" : "Patients did not load",
            isEs ? "es" : "en",
          )}
          errorMessage={errorMessageFor(
            hospital.error,
            undefined,
            isEs ? "es" : "en",
          )}
          onRetry={canRetry(hospital.error) ? hospital.refetch : undefined}
          isEmpty={rows.length === 0}
          skeleton={
            <div className="p-card pt-0">
              <Skeleton height={240} />
            </div>
          }
          empty={
            <EmptyState
              title={isEs ? "No hay pacientes aquí" : "No patients here"}
              description={
                hospital.enrollments.length === 0
                  ? isEs
                    ? "Inscriba a un paciente para comenzar su educación."
                    : "Enroll a patient to start their education."
                  : isEs
                    ? "Ningún paciente coincide con estos filtros."
                    : "No patient matches these filters."
              }
            />
          }
        >
          <Table minWidth={980}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>
                  {isEs ? "Paciente" : "Patient"}
                </TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Estado renal" : "Kidney status"}
                </TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Programa" : "Program"}
                </TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Inscrito" : "Enrolled"}
                </TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Inscripción" : "Enrollment"}
                </TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Educación" : "Education"}
                </TableHeaderCell>
                <TableHeaderCell>
                  {isEs ? "Acceso hasta" : "Access until"}
                </TableHeaderCell>
                {canAssign ? (
                  <TableHeaderCell>
                    <span className="sr-only">
                      {isEs ? "Acciones" : "Actions"}
                    </span>
                  </TableHeaderCell>
                ) : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell emphasis>
                    <span className="block">{e.patientName}</span>
                    <span className="block text-caption font-normal text-fg-muted">
                      MRN {e.mrn || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DiagnosisBadge diagnosis={e.diagnosis} />
                  </TableCell>
                  <TableCell>{programNameOf(e, isEs)}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {shortDay(e.enrolledAt, isEs)}
                  </TableCell>
                  <TableCell>
                    <EnrollmentBadge status={e.status} />
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-wrap items-center gap-inline-sm">
                      <DayDots enrollment={e} />
                      <EducationBadge enrollment={e} />
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {e.status === "admitted"
                      ? isEs
                        ? "Mientras esté hospitalizado"
                        : "While admitted"
                      : e.status === "withdrawn"
                        ? isEs
                          ? "Terminado"
                          : "Ended"
                        : shortDay(e.accessUntil, isEs)}
                  </TableCell>
                  {canAssign ? (
                    <TableCell>
                      <Button
                        size="small"
                        variant="neutral"
                        appearance="fill-stroke"
                        iconOnly
                        aria-label={
                          isEs
                            ? `Actualizar a ${e.patientName}`
                            : `Update ${e.patientName}`
                        }
                        onClick={() => setEditing(e)}
                      >
                        <Pencil />
                      </Button>
                    </TableCell>
                  ) : null}
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

      {enrolling ? (
        <EnrollModal
          programs={programs}
          saving={enroll.isPending}
          partial={enroll.partialPatientId !== null}
          error={enroll.error?.cause ?? enroll.error}
          onEnroll={(draft) => enroll.mutate(draft, { onSuccess: closeEnroll })}
          onClose={closeEnroll}
        />
      ) : null}
      {editing ? (
        <EditEnrollmentModal
          enrollment={editing}
          programs={programs}
          canAssign={canAssign}
          saving={update.isPending}
          error={update.error}
          onSave={(change) =>
            update.mutate(
              { enrollment: editing, change },
              { onSuccess: closeEdit },
            )
          }
          onClose={closeEdit}
        />
      ) : null}
    </div>
  );
}
