"use client";

import React, { useMemo, useState } from "react";
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
  enrollablePrograms,
  ENROLL_SOURCES,
  validateEnrollment,
  type EnrollmentDraft,
} from "./enrollment.store";
import { useEnrollPatient } from "./useClinicData";
import { useCourseLibrary } from "@/features/education/courseLibrary";
import { useCan } from "@/features/staff/useStaffAccounts";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import { organizationFor } from "@/features/staff/staff";
import { useCcm, type CcmActions } from "./useCcm";
import { actionErrorText } from "./officeContext";
import { ConditionSelect } from "./ConditionSelect";
import { useConditionLibrary } from "./useConditionLibrary";
import { chronicCount, type CcmCondition } from "./ccmConditions";

/** The nephrology office's own program (client, 2026-10-09). Not an
 *  education program: the patient goes onto the roster (the server counts
 *  a roster link against the contract seats, NEW-3) and straight onto the
 *  CCM dashboard as an enrolled patient (Phase 9: both on the API). */
export const CCM_PROGRAM = "Chronic Care Management (CCM)";

/* Enrolling is one form wherever it is started — Enroll Patients, the
   Member page's Add Member, the dashboard — so it lives here once and
   each page opens it in place rather than sending the clinic elsewhere. */

type EnrollProps = {
  list: Patient[];
  onClose: () => void;
  /** `ccm` when the patient went onto the CCM dashboard instead of the
   *  education roster. */
  onEnrolled: (name: string, mrn: string, ccm?: boolean) => void;
};

export function EnrollPatientModal(props: EnrollProps) {
  /* Only the nephrology office runs CCM, so only its form offers it — and
     only it loads the CCM record. */
  const offersCcm =
    organizationFor(useOptionalAuth()?.user)?.portal === "nephrology";
  return offersCcm ? <CcmEnrollForm {...props} /> : <EnrollForm {...props} />;
}

function CcmEnrollForm(props: EnrollProps) {
  const store = useCcm();
  const library = useConditionLibrary().library;
  return <EnrollForm {...props} ccm={{ store, library }} />;
}

/**
 * The enrollment form. Errors show only after a submit attempt, so a
 * clinician is not told the MRN is wrong while still typing it. The store
 * checks again on save — the last seat or an MRN taken in another tab is
 * reported here too, not lost.
 */
function EnrollForm({
  list,
  onClose,
  onEnrolled,
  ccm,
}: EnrollProps & {
  /** The CCM record and condition library, for the nephrology office. */
  ccm?: { store: CcmActions; library: CcmCondition[] };
}) {
  const [draft, setDraft] = useState<EnrollmentDraft>(emptyDraft);
  const [attempted, setAttempted] = useState(false);
  const enroll = useEnrollPatient();
  const { courses } = useCourseLibrary();
  const programs = useMemo(() => enrollablePrograms(courses), [courses]);
  const canEnroll = useCan("patients.enroll");

  const offersCcm = Boolean(ccm);
  const isCcm = offersCcm && draft.program === CCM_PROGRAM;
  const library = ccm?.library ?? [];
  const [dob, setDob] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [provider, setProvider] = useState("");
  const [careManager, setCareManager] = useState("");
  const [location, setLocation] = useState("");
  const [ccmFailure, setCcmFailure] = useState<unknown>(null);

  function ccmErrors() {
    const out: {
      name?: string;
      mrn?: string;
      dob?: string;
      conditions?: string;
      provider?: string;
      careManager?: string;
    } = {};
    if (!draft.name.trim()) out.name = "Enter the patient's full name.";
    const mrn = draft.mrn.trim();
    /* A taken MRN or a patient already in CCM is refused by the server. */
    if (!/^\d{6}$/.test(mrn)) out.mrn = "An MRN is 6 digits.";
    if (!dob) out.dob = "Enter the date of birth.";
    if (!provider.trim()) out.provider = "Enter the provider.";
    if (!careManager.trim()) out.careManager = "Enter the care manager.";
    if (chronicCount(conditions, library) < 2)
      out.conditions = "CCM needs two or more chronic conditions.";
    return out;
  }

  const errors: Record<string, string | undefined> = attempted
    ? isCcm
      ? ccmErrors()
      : validateEnrollment(draft, list, programs)
    : {};
  const set = (field: keyof EnrollmentDraft, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canEnroll) return;
    setAttempted(true);
    if (isCcm && ccm) {
      if (Object.keys(ccmErrors()).length > 0) return;
      const name = draft.name.trim().split(/\s+/);
      const lastName = name.length > 1 ? name.pop()! : "";
      setCcmFailure(null);
      ccm.store
        .enrollNew(
          {
            firstName: name.join(" "),
            lastName,
            dateOfBirth: dob,
            mrn: draft.mrn.trim(),
          },
          {
            conditions,
            providerName: provider.trim(),
            careManagerName: careManager.trim(),
            ...(location.trim() ? { location: location.trim() } : {}),
          },
        )
        .then(() => onEnrolled(draft.name.trim(), draft.mrn.trim(), true))
        .catch(setCcmFailure);
      return;
    }
    if (Object.keys(validateEnrollment(draft, list, programs)).length > 0)
      return;
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
      description={
        isCcm
          ? "Adds the patient to your roster and your CCM dashboard."
          : `${Math.max(0, CONTRACT_SLOTS - list.length)} of ${CONTRACT_SLOTS} contract seats open.`
      }
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
            disabled={enroll.isPending || !canEnroll}
          >
            {enroll.isPending
              ? "Enrolling…"
              : isCcm
                ? "Enroll in CCM"
                : "Enroll Patient"}
          </Button>
        </>
      }
    >
      <form id="enroll-form" onSubmit={submit} noValidate>
        {!canEnroll ? (
          <Alert tone="info" className="mb-stack-lg">
            Your role cannot enroll patients. A care coordinator, the front desk
            or an administrator can.
          </Alert>
        ) : null}
        {ccmFailure ? (
          <Alert tone="danger" className="mb-stack-lg" title="Not enrolled">
            {actionErrorText(ccmFailure)}
          </Alert>
        ) : null}
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

          {isCcm ? (
            <FormField label="Date of birth" required error={errors.dob}>
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  value={dob}
                  onChange={(event) => setDob(event.target.value)}
                />
              )}
            </FormField>
          ) : (
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
          )}

          <FormField label="Program" required error={errors.program}>
            {(props) => (
              <Select
                {...props}
                value={draft.program}
                onChange={(event) => set("program", event.target.value)}
              >
                {programs.map((option) => (
                  <option key={option}>{option}</option>
                ))}
                {offersCcm ? <option>{CCM_PROGRAM}</option> : null}
              </Select>
            )}
          </FormField>

          {isCcm ? (
            <>
              <FormField
                label="Chronic conditions"
                required
                hint="Choose every condition that applies. Use Other for anything not listed."
                error={errors.conditions}
                className="sm:col-span-2"
              >
                {(props) => (
                  <ConditionSelect
                    library={library}
                    value={conditions}
                    onChange={setConditions}
                    invalid={Boolean(errors.conditions)}
                    describedBy={props["aria-describedby"]}
                  />
                )}
              </FormField>
              <FormField label="Provider" required error={errors.provider}>
                {(props) => (
                  <Input
                    {...props}
                    value={provider}
                    maxLength={120}
                    onChange={(event) => setProvider(event.target.value)}
                  />
                )}
              </FormField>
              <FormField
                label="Care manager"
                required
                error={errors.careManager}
              >
                {(props) => (
                  <Input
                    {...props}
                    value={careManager}
                    maxLength={120}
                    onChange={(event) => setCareManager(event.target.value)}
                  />
                )}
              </FormField>
              <FormField label="Location" optionalLabel="optional">
                {(props) => (
                  <Input
                    {...props}
                    value={location}
                    maxLength={120}
                    onChange={(event) => setLocation(event.target.value)}
                  />
                )}
              </FormField>
            </>
          ) : (
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
          )}
        </div>
      </form>
    </Modal>
  );
}

export default EnrollPatientModal;
