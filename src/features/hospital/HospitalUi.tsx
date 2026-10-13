"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
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
import {
  PROGRAMS,
  daysDone,
  educationStatus,
  enrollmentError,
  programById,
  type Diagnosis,
  type EnrollmentDraft,
  type EnrollmentStatus,
  type HospitalEnrollment,
} from "./hospital.data";

/* The small pieces every hospital screen shares. */

export function shortDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DiagnosisBadge({ diagnosis }: { diagnosis: Diagnosis }) {
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
  const status = educationStatus(enrollment);
  if (status === "completed") return <Badge tone="success">Completed</Badge>;
  if (status === "in-progress")
    return <Badge tone="warning">In progress</Badge>;
  return <Badge tone="neutral">Not started</Badge>;
}

/** Day 1 · Day 2 · Day 3, ticked as the patient finishes each. */
export function DayDots({ enrollment }: { enrollment: HospitalEnrollment }) {
  const program = programById(enrollment.programId);
  if (!program) return null;
  return (
    <span
      className="inline-flex items-center gap-inline-xs"
      aria-label={`${daysDone(enrollment)} of ${program.days.length} days completed`}
    >
      {program.days.map((day) => {
        const done = Boolean(enrollment.progress[day.day]?.completedAt);
        return (
          <span
            key={day.day}
            aria-hidden="true"
            title={`Day ${day.day}${done ? " — completed" : ""}`}
            className={`flex size-6 items-center justify-center rounded-pill text-caption ${
              done
                ? "bg-success-surface text-success"
                : "bg-surface-sunken text-fg-muted"
            }`}
          >
            {done ? <Check className="size-3.5" /> : day.day}
          </span>
        );
      })}
    </span>
  );
}

const DIAGNOSIS_OPTIONS = [
  { value: "new" as const, label: "Newly diagnosed with kidney failure" },
  { value: "on-dialysis" as const, label: "Already receiving dialysis" },
];

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Enroll a patient: who they are, where they are, and which program. */
export function EnrollModal({
  existing,
  onEnroll,
  onClose,
}: {
  existing: HospitalEnrollment[];
  onEnroll: (draft: EnrollmentDraft) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<EnrollmentDraft>({
    patientName: "",
    patientEmail: "",
    mrn: "",
    diagnosis: "new",
    programId: PROGRAMS[0].id,
    enrolledAt: today(),
  });
  const [tried, setTried] = useState(false);
  const error = enrollmentError(existing, draft);
  const show = (field: string) =>
    tried && error === field
      ? field === "email"
        ? "Enter the patient's email — it is how they sign in to learn."
        : "This is needed."
      : undefined;
  const set = (patch: Partial<EnrollmentDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title="Enroll a patient"
      description="The patient learns in their own NephroReach account. They get the course while admitted and for the program's days after discharge."
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setTried(true);
              if (error) return;
              onEnroll(draft);
              onClose();
            }}
          >
            Enroll patient
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {tried && error === "duplicate" ? (
          <Alert tone="warning">
            This patient is already enrolled in this program.
          </Alert>
        ) : null}
        <div className="grid grid-cols-1 gap-stack-md sm:grid-cols-2">
          <FormField label="Patient name" required error={show("name")}>
            {(field) => (
              <Input
                {...field}
                value={draft.patientName}
                onChange={(e) => set({ patientName: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="MRN" required error={show("mrn")}>
            {(field) => (
              <Input
                {...field}
                value={draft.mrn}
                onChange={(e) => set({ mrn: e.target.value })}
              />
            )}
          </FormField>
          <FormField
            label="Patient email"
            required
            error={show("email")}
            hint="They receive an invitation to their own account."
            className="sm:col-span-2"
          >
            {(field) => (
              <Input
                {...field}
                type="email"
                value={draft.patientEmail}
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
        <div className="grid grid-cols-1 gap-stack-md sm:grid-cols-2">
          <FormField label="Education program">
            {(field) => (
              <Select
                {...field}
                value={draft.programId}
                onChange={(e) => set({ programId: e.target.value })}
              >
                {PROGRAMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameEn}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField label="Enrollment date">
            {(field) => (
              <Input
                {...field}
                type="date"
                value={draft.enrolledAt}
                onChange={(e) => set({ enrolledAt: e.target.value || today() })}
              />
            )}
          </FormField>
        </div>
      </div>
    </Modal>
  );
}

/** Update a patient's enrollment: admitted, discharged (with the date),
 *  withdrawn, and which program. */
export function EditEnrollmentModal({
  enrollment,
  canAssign,
  onSave,
  onClose,
}: {
  enrollment: HospitalEnrollment;
  canAssign: boolean;
  onSave: (change: {
    status: EnrollmentStatus;
    dischargedAt?: string;
    programId: string;
    diagnosis: Diagnosis;
  }) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<EnrollmentStatus>(enrollment.status);
  const [dischargedAt, setDischargedAt] = useState(
    enrollment.dischargedAt ?? today(),
  );
  const [programId, setProgramId] = useState(enrollment.programId);
  const [diagnosis, setDiagnosis] = useState<Diagnosis>(enrollment.diagnosis);
  const programChanged = programId !== enrollment.programId;

  return (
    <Modal
      open
      onClose={onClose}
      title={enrollment.patientName}
      description={`MRN ${enrollment.mrn} · enrolled ${shortDay(enrollment.enrolledAt)}`}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave({
                status,
                ...(status !== "admitted" ? { dischargedAt } : {}),
                programId,
                diagnosis,
              });
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
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
        {status !== "admitted" ? (
          <FormField
            label={status === "discharged" ? "Discharge date" : "Date"}
            hint={
              status === "discharged"
                ? `Course access continues for ${programById(programId)?.accessDaysAfterDischarge ?? 0} days after this date.`
                : "Withdrawing ends the patient's access to the course."
            }
          >
            {(field) => (
              <Input
                {...field}
                type="date"
                value={dischargedAt}
                onChange={(e) => setDischargedAt(e.target.value || today())}
              />
            )}
          </FormField>
        ) : null}
        <SegmentedChoice<Diagnosis>
          label="Kidney status"
          value={diagnosis}
          onChange={setDiagnosis}
          options={DIAGNOSIS_OPTIONS}
        />
        {canAssign ? (
          <FormField label="Education program">
            {(field) => (
              <Select
                {...field}
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
              >
                {PROGRAMS.map((p) => (
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
            A new program starts from its own first day.
          </Alert>
        ) : null}
      </div>
    </Modal>
  );
}
