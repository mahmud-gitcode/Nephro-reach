"use client";

import React, { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  FormField,
  Input,
  Modal,
  SegmentedChoice,
  Select,
} from "@/components/ui";
import { useLanguageCode } from "@/context/LanguageContext";
import { actionErrorText } from "@/features/clinic/officeContext";
import {
  dayOf,
  enrollmentError,
  localToday,
  MRN_MAX,
  type Diagnosis,
  type EducationProgram,
  type EnrollmentDraft,
  type EnrollmentStatus,
  type HospitalEnrollment,
  programNameOf,
} from "./hospital.data";
import type { EnrollmentChange } from "./useHospital";

/* The small pieces every hospital screen shares. */

/** "Oct 20, 2026" for a YYYY-MM-DD day or an ISO instant (viewer's day). */
export function shortDay(
  value: string | null | undefined,
  isEs = false,
): string {
  const day = dayOf(value);
  if (!day) return "—";
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(isEs ? "es-US" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DiagnosisBadge({ diagnosis }: { diagnosis: Diagnosis | null }) {
  const isEs = useLanguageCode() === "ES";
  if (diagnosis === null) return <span className="text-fg-muted">—</span>;
  return diagnosis === "new" ? (
    <Badge tone="info">
      {isEs ? "Recién diagnosticado" : "Newly diagnosed"}
    </Badge>
  ) : (
    <Badge tone="neutral">{isEs ? "En diálisis" : "On dialysis"}</Badge>
  );
}

export function EnrollmentBadge({ status }: { status: EnrollmentStatus }) {
  const isEs = useLanguageCode() === "ES";
  if (status === "admitted")
    return <Badge tone="info">{isEs ? "Hospitalizado" : "Admitted"}</Badge>;
  if (status === "discharged")
    return <Badge tone="neutral">{isEs ? "Dado de alta" : "Discharged"}</Badge>;
  return <Badge tone="danger">{isEs ? "Retirado" : "Withdrawn"}</Badge>;
}

export function EducationBadge({
  enrollment,
}: {
  enrollment: HospitalEnrollment;
}) {
  const isEs = useLanguageCode() === "ES";
  const status = enrollment.progress.status;
  if (status === "completed")
    return <Badge tone="success">{isEs ? "Completado" : "Completed"}</Badge>;
  if (status === "in-progress")
    return <Badge tone="warning">{isEs ? "En progreso" : "In progress"}</Badge>;
  return <Badge tone="neutral">{isEs ? "Sin comenzar" : "Not started"}</Badge>;
}

/** "2 of 6 classes", as the server counts them. */
export function DayDots({ enrollment }: { enrollment: HospitalEnrollment }) {
  const isEs = useLanguageCode() === "ES";
  const { classesCompleted, classesTotal } = enrollment.progress;
  if (!classesTotal) return null;
  return (
    <span className="text-caption text-fg-muted tabular-nums">
      {isEs ? (
        `${classesCompleted} de ${classesTotal} clases`
      ) : (
        <>
          {classesCompleted} of {classesTotal} classes
        </>
      )}
    </span>
  );
}

function diagnosisOptions(isEs: boolean) {
  return [
    {
      value: "new" as const,
      label: isEs
        ? "Recién diagnosticado con insuficiencia renal"
        : "Newly diagnosed with kidney failure",
    },
    {
      value: "on-dialysis" as const,
      label: isEs ? "Ya recibe diálisis" : "Already receiving dialysis",
    },
  ];
}

const FIELD_ERROR: Record<string, { en: string; es: string }> = {
  firstName: {
    en: "Enter the patient's first name.",
    es: "Ingrese el nombre del paciente.",
  },
  lastName: {
    en: "Enter the patient's last name.",
    es: "Ingrese el apellido del paciente.",
  },
  email: {
    en: "Enter a valid email, or leave it blank.",
    es: "Ingrese un correo electrónico válido o déjelo en blanco.",
  },
  mrn: {
    en: `Enter the MRN (up to ${MRN_MAX} characters).`,
    es: `Ingrese el MRN (hasta ${MRN_MAX} caracteres).`,
  },
  program: { en: "Choose a program.", es: "Seleccione un programa." },
};

/** Enroll a patient: who they are, where they are, and which program. */
export function EnrollModal({
  programs,
  onEnroll,
  onClose,
  saving = false,
  partial = false,
  error = null,
}: {
  programs: readonly EducationProgram[];
  onEnroll: (draft: EnrollmentDraft) => void;
  onClose: () => void;
  saving?: boolean;
  /** The patient is on the roster; only the enrollment is retried. */
  partial?: boolean;
  error?: unknown;
}) {
  const [draft, setDraft] = useState<EnrollmentDraft>({
    firstName: "",
    lastName: "",
    patientEmail: "",
    mrn: "",
    diagnosis: "new",
    programId: programs[0]?.id ?? "",
  });
  const isEs = useLanguageCode() === "ES";
  const [tried, setTried] = useState(false);
  const fieldError = enrollmentError(draft);
  const show = (field: string) =>
    tried && fieldError === field
      ? FIELD_ERROR[field]?.[isEs ? "es" : "en"]
      : undefined;
  const set = (patch: Partial<EnrollmentDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));
  const program = programs.find((p) => p.id === draft.programId);

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={isEs ? "Inscribir a un paciente" : "Enroll a patient"}
      description={
        isEs
          ? "El paciente se agrega a la lista de este hospital y se inscribe al ingresar. Conserva el curso mientras está hospitalizado y durante los días del programa después del alta."
          : "The patient is added to this hospital's list and enrolled at admission. They keep the course while admitted and for the program's days after discharge."
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            disabled={saving || programs.length === 0}
            onClick={() => {
              setTried(true);
              if (fieldError) return;
              onEnroll(draft);
            }}
          >
            {partial
              ? isEs
                ? "Reintentar la inscripción"
                : "Retry enrollment"
              : isEs
                ? "Inscribir paciente"
                : "Enroll patient"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {error ? (
          <Alert tone="danger">
            {partial
              ? isEs
                ? `Paciente agregado; la inscripción falló. ${actionErrorText(error, isEs)}`
                : `Patient added; the enrollment failed. ${actionErrorText(error, isEs)}`
              : actionErrorText(error, isEs)}
          </Alert>
        ) : null}
        {programs.length === 0 ? (
          <Alert tone="warning">
            {isEs
              ? "Aún no hay ningún programa hospitalario publicado. NephroReach publica los programas en Gestión de clases."
              : "No hospital program is published yet. NephroReach publishes the programs in Class Management."}
          </Alert>
        ) : null}
        <div className="grid grid-cols-1 gap-stack-md sm:grid-cols-2">
          <FormField
            label={isEs ? "Nombre" : "First name"}
            required
            error={show("firstName")}
          >
            {(field) => (
              <Input
                {...field}
                value={draft.firstName}
                disabled={partial}
                onChange={(e) => set({ firstName: e.target.value })}
              />
            )}
          </FormField>
          <FormField
            label={isEs ? "Apellido" : "Last name"}
            required
            error={show("lastName")}
          >
            {(field) => (
              <Input
                {...field}
                value={draft.lastName}
                disabled={partial}
                onChange={(e) => set({ lastName: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="MRN" required error={show("mrn")}>
            {(field) => (
              <Input
                {...field}
                value={draft.mrn}
                maxLength={MRN_MAX}
                disabled={partial}
                onChange={(e) => set({ mrn: e.target.value })}
              />
            )}
          </FormField>
          <FormField
            label={isEs ? "Correo electrónico del paciente" : "Patient email"}
            error={show("email")}
            hint={
              isEs
                ? "Aún no disponible: el correo no se envía y el paciente no recibe una invitación desde aquí."
                : "Not available yet: the email is not sent, and the patient is not invited from here."
            }
          >
            {(field) => (
              <Input
                {...field}
                type="email"
                value={draft.patientEmail}
                disabled
                onChange={(e) => set({ patientEmail: e.target.value })}
              />
            )}
          </FormField>
        </div>
        <SegmentedChoice<Diagnosis>
          label={isEs ? "Estado renal" : "Kidney status"}
          value={draft.diagnosis}
          onChange={(diagnosis) => set({ diagnosis })}
          options={diagnosisOptions(isEs)}
        />
        <FormField
          label={isEs ? "Programa educativo" : "Education program"}
          error={show("program")}
          hint={
            program
              ? isEs
                ? `El acceso continúa durante ${program.accessDaysAfterDischarge} días después del alta.`
                : `Access continues for ${program.accessDaysAfterDischarge} days after discharge.`
              : undefined
          }
        >
          {(field) => (
            <Select
              {...field}
              value={draft.programId}
              disabled={partial}
              onChange={(e) => set({ programId: e.target.value })}
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {isEs ? p.nameEs : p.nameEn}
                </option>
              ))}
            </Select>
          )}
        </FormField>
      </div>
    </Modal>
  );
}

/** Update a patient's enrollment: admitted, discharged (with the date),
 *  withdrawn, the kidney status, and which program. */
export function EditEnrollmentModal({
  enrollment,
  programs,
  canAssign,
  onSave,
  onClose,
  saving = false,
  error = null,
}: {
  enrollment: HospitalEnrollment;
  programs: readonly EducationProgram[];
  canAssign: boolean;
  onSave: (change: EnrollmentChange) => void;
  onClose: () => void;
  saving?: boolean;
  error?: unknown;
}) {
  const isEs = useLanguageCode() === "ES";
  const today = localToday();
  const [status, setStatus] = useState<EnrollmentStatus>(enrollment.status);
  const [dischargeDay, setDischargeDay] = useState(
    dayOf(enrollment.dischargedAt) ?? today,
  );
  const [programId, setProgramId] = useState(enrollment.courseId ?? "");
  const [diagnosis, setDiagnosis] = useState<Diagnosis>(
    enrollment.diagnosis ?? "new",
  );
  const programChanged =
    Boolean(enrollment.courseId) && programId !== enrollment.courseId;
  const program = programs.find((p) => p.id === programId);
  const enrolledDay = dayOf(enrollment.enrolledAt) ?? undefined;

  return (
    <Modal
      open
      onClose={onClose}
      title={enrollment.patientName}
      description={
        isEs
          ? `MRN ${enrollment.mrn || "—"} · inscrito el ${shortDay(enrollment.enrolledAt, true)}`
          : `MRN ${enrollment.mrn || "—"} · enrolled ${shortDay(enrollment.enrolledAt)}`
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            disabled={saving}
            onClick={() =>
              onSave({
                status,
                ...(status === "discharged" ? { dischargeDay } : {}),
                programId,
                diagnosis,
              })
            }
          >
            {isEs ? "Guardar" : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {error ? (
          <Alert tone="danger">{actionErrorText(error, isEs)}</Alert>
        ) : null}
        <SegmentedChoice<EnrollmentStatus>
          label={isEs ? "Estado de la inscripción" : "Enrollment status"}
          value={status}
          onChange={setStatus}
          options={[
            { value: "admitted", label: isEs ? "Hospitalizado" : "Admitted" },
            {
              value: "discharged",
              label: isEs ? "Dado de alta" : "Discharged",
            },
            { value: "withdrawn", label: isEs ? "Retirado" : "Withdrawn" },
          ]}
        />
        {status === "discharged" ? (
          <FormField
            label={isEs ? "Fecha de alta" : "Discharge date"}
            hint={
              isEs
                ? `El acceso al curso continúa durante ${program?.accessDaysAfterDischarge ?? 0} días después de esta fecha. NephroReach fija el último día.`
                : `Course access continues for ${program?.accessDaysAfterDischarge ?? 0} days after this date. NephroReach sets the last day.`
            }
          >
            {(field) => (
              <Input
                {...field}
                type="date"
                value={dischargeDay}
                min={enrolledDay}
                max={today}
                onChange={(e) => setDischargeDay(e.target.value || today)}
              />
            )}
          </FormField>
        ) : status === "withdrawn" ? (
          <p className="text-body-sm text-fg-muted">
            {isEs ? (
              "Al retirarlo, el paciente pierde el acceso al curso."
            ) : (
              <>Withdrawing ends the patient&rsquo;s access to the course.</>
            )}
          </p>
        ) : null}
        <SegmentedChoice<Diagnosis>
          label={isEs ? "Estado renal" : "Kidney status"}
          value={diagnosis}
          onChange={setDiagnosis}
          options={diagnosisOptions(isEs)}
        />
        {canAssign && programs.length > 0 ? (
          <FormField label={isEs ? "Programa educativo" : "Education program"}>
            {(field) => (
              <Select
                {...field}
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
              >
                {!programs.some((p) => p.id === programId) ? (
                  <option value={programId}>
                    {programNameOf(enrollment, isEs)}
                  </option>
                ) : null}
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {isEs ? p.nameEs : p.nameEn}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        ) : null}
        {programChanged ? (
          <Alert tone="warning">
            {isEs
              ? "El paciente se retira del programa actual y se inscribe en el nuevo, que comienza desde su primer día."
              : "The patient is withdrawn from the current program and enrolled in the new one, which starts from its own first day."}
          </Alert>
        ) : null}
      </div>
    </Modal>
  );
}
