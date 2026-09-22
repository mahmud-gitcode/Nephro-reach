"use client";

import React, { useState } from "react";
import {
  Alert,
  Button,
  FormField,
  Input,
  Modal,
  Select,
} from "@/components/ui";
import { CONTRACT_SLOTS, type Patient } from "./enrollment.data";
import {
  emptyDraft,
  ENROLL_PROGRAMS,
  ENROLL_SOURCES,
  validateEnrollment,
  type EnrollmentDraft,
} from "./enrollment.store";
import { useEnrollPatient } from "./useClinicData";

/* Enrolling is one form wherever it is started — Enroll Patients, the
   Member page's Add Member, the dashboard — so it lives here once and
   each page opens it in place rather than sending the clinic elsewhere. */

/**
 * The enrollment form. Errors show only after a submit attempt, so a
 * clinician is not told the MRN is wrong while still typing it. The store
 * checks again on save — the last seat or an MRN taken in another tab is
 * reported here too, not lost.
 */
export function EnrollPatientModal({
  list,
  onClose,
  onEnrolled,
}: {
  list: Patient[];
  onClose: () => void;
  onEnrolled: (name: string, mrn: string) => void;
}) {
  const [draft, setDraft] = useState<EnrollmentDraft>(emptyDraft);
  const [attempted, setAttempted] = useState(false);
  const enroll = useEnrollPatient();

  const errors = attempted ? validateEnrollment(draft, list) : {};
  const set = (field: keyof EnrollmentDraft, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (Object.keys(validateEnrollment(draft, list)).length > 0) return;
    enroll.mutate(draft, {
      onSuccess: (patient) => onEnrolled(patient.name, patient.mrn),
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title="Enroll New Patient"
      description={`${Math.max(0, CONTRACT_SLOTS - list.length)} of ${CONTRACT_SLOTS} contract seats open.`}
      footer={
        <>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            size="small"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="enroll-form"
            size="small"
            disabled={enroll.isPending}
          >
            {enroll.isPending ? "Enrolling…" : "Enroll Patient"}
          </Button>
        </>
      }
    >
      <form id="enroll-form" onSubmit={submit} noValidate>
        {enroll.error ? (
          <Alert tone="danger" className="mb-stack-lg" title="Not enrolled">
            {enroll.error.message}
          </Alert>
        ) : null}

        <div className="grid gap-stack-md sm:grid-cols-2">
          <FormField
            label="Full name"
            required
            error={errors.name}
            className="sm:col-span-2"
          >
            {(props) => (
              <Input
                {...props}
                value={draft.name}
                onChange={(event) => set("name", event.target.value)}
                autoComplete="off"
                placeholder="e.g. Maria L. Gomez"
              />
            )}
          </FormField>

          <FormField
            label="MRN"
            required
            hint="Six digits, from your EHR."
            error={errors.mrn}
          >
            {(props) => (
              <Input
                {...props}
                value={draft.mrn}
                onChange={(event) => set("mrn", event.target.value)}
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
              />
            )}
          </FormField>

          <FormField
            label="Start date"
            optionalLabel="optional"
            hint="Leave empty if not scheduled yet."
          >
            {(props) => (
              <Input
                {...props}
                type="date"
                value={draft.startDate}
                onChange={(event) => set("startDate", event.target.value)}
              />
            )}
          </FormField>

          <FormField label="Program" required error={errors.program}>
            {(props) => (
              <Select
                {...props}
                value={draft.program}
                onChange={(event) => set("program", event.target.value)}
              >
                {ENROLL_PROGRAMS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField label="Referral source" required error={errors.source}>
            {(props) => (
              <Select
                {...props}
                value={draft.source}
                onChange={(event) => set("source", event.target.value)}
              >
                {ENROLL_SOURCES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
            )}
          </FormField>
        </div>
      </form>
    </Modal>
  );
}

export default EnrollPatientModal;
