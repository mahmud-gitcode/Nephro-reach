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
} from "./hospital.data";
import type { EnrollmentChange } from "./useHospital";

/* The small pieces every hospital screen shares. */

/** "Oct 20, 2026" for a YYYY-MM-DD day or an ISO instant (viewer's day). */
export function shortDay(value: string | null | undefined): string {
  const day = dayOf(value);
  if (!day) return "—";
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DiagnosisBadge({ diagnosis }: { diagnosis: Diagnosis | null }) {
  if (diagnosis === null) return <span className="text-fg-muted">—</span>;
  return diagnosis === "new" ? (
    <Badge tone="info">Newly diagnosed</Badge>
  ) : (
    <Badge tone="neutral">On dialysis</Badge>
  );
}

export function EnrollmentBadge({ status }: { status: EnrollmentStatus }) {
  if (status === "admitted") return <Badge tone="info">Admitted</Badge>;
  if (status === "discharged") return <Badge tone="neutral">Discharged</Badge>;
  return <Badge tone="danger">Withdrawn</Badge>;
}

export function EducationBadge({
  enrollment,
}: {
  enrollment: HospitalEnrollment;
}) {
  const status = enrollment.progress.status;
  if (status === "completed") return <Badge tone="success">Completed</Badge>;
  if (status === "in-progress")
    return <Badge tone="warning">In progress</Badge>;
  return <Badge tone="neutral">Not started</Badge>;
}

/** "2 of 6 classes", as the server counts them. */
export function DayDots({ enrollment }: { enrollment: HospitalEnrollment }) {
  const { classesCompleted, classesTotal } = enrollment.progress;
  if (!classesTotal) return null;
  return (
    <span className="text-caption text-fg-muted tabular-nums">
      {classesCompleted} of {classesTotal} classes
    </span>
  );
}

const DIAGNOSIS_OPTIONS = [
  { value: "new" as const, label: "Newly diagnosed with kidney failure" },
  { value: "on-dialysis" as const, label: "Already receiving dialysis" },
];

const FIELD_ERROR: Record<string, string> = {
  firstName: "Enter the patient's first name.",
  lastName: "Enter the patient's last name.",
  email: "Enter a valid email, or leave it blank.",
  mrn: `Enter the MRN (up to ${MRN_MAX} characters).`,
  program: "Choose a program.",
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
  const [tried, setTried] = useState(false);
  const fieldError = enrollmentError(draft);
  const show = (field: string) =>
    tried && fieldError === field ? FIELD_ERROR[field] : undefined;
  const set = (patch: Partial<EnrollmentDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));
  const program = programs.find((p) => p.id === draft.programId);

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title="Enroll a patient"
      description="The patient is added to this hospital's list and enrolled at admission. They keep the course while admitted and for the program's days after discharge."
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={saving || programs.length === 0}
            onClick={() => {
              setTried(true);
              if (fieldError) return;
              onEnroll(draft);
            }}
          >
            {partial ? "Retry enrollment" : "Enroll patient"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {error ? (
          <Alert tone="danger">
            {partial
              ? `Patient added; the enrollment failed. ${actionErrorText(error)}`
              : actionErrorText(error)}
          </Alert>
        ) : null}
        {programs.length === 0 ? (
          <Alert tone="warning">
            No hospital program is published yet. NephroReach publishes the
            programs in Class Management.
          </Alert>
        ) : null}
        <div className="grid grid-cols-1 gap-stack-md sm:grid-cols-2">
          <FormField label="First name" required error={show("firstName")}>
            {(field) => (
              <Input
                {...field}
                value={draft.firstName}
                disabled={partial}
                onChange={(e) => set({ firstName: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Last name" required error={show("lastName")}>
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
            label="Patient email"
            error={show("email")}
            hint="Not available yet: the email is not sent, and the patient is not invited from here."
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
          label="Kidney status"
          value={draft.diagnosis}
          onChange={(diagnosis) => set({ diagnosis })}
          options={DIAGNOSIS_OPTIONS}
        />
        <FormField
          label="Education program"
          error={show("program")}
          hint={
            program
              ? `Access continues for ${program.accessDaysAfterDischarge} days after discharge.`
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
                  {p.nameEn}
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
      description={`MRN ${enrollment.mrn || "—"} · enrolled ${shortDay(enrollment.enrolledAt)}`}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
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
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {error ? <Alert tone="danger">{actionErrorText(error)}</Alert> : null}
        <SegmentedChoice<EnrollmentStatus>
          label="Enrollment status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "admitted", label: "Admitted" },
            { value: "discharged", label: "Discharged" },
            { value: "withdrawn", label: "Withdrawn" },
          ]}
        />
        {status === "discharged" ? (
          <FormField
            label="Discharge date"
            hint={`Course access continues for ${program?.accessDaysAfterDischarge ?? 0} days after this date. NephroReach sets the last day.`}
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
            Withdrawing ends the patient&rsquo;s access to the course.
          </p>
        ) : null}
        <SegmentedChoice<Diagnosis>
          label="Kidney status"
          value={diagnosis}
          onChange={setDiagnosis}
          options={DIAGNOSIS_OPTIONS}
        />
        {canAssign && programs.length > 0 ? (
          <FormField label="Education program">
            {(field) => (
              <Select
                {...field}
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
              >
                {!programs.some((p) => p.id === programId) ? (
                  <option value={programId}>{enrollment.programName}</option>
                ) : null}
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameEn}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        ) : null}
        {programChanged ? (
          <Alert tone="warning">
            The patient is withdrawn from the current program and enrolled in
            the new one, which starts from its own first day.
          </Alert>
        ) : null}
      </div>
    </Modal>
  );
}
