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
import {
  emptyDraft,
  enrollablePrograms,
  enrollErrorText,
  ENROLL_SOURCES,
  validateEnrollment,
  type EnrollmentDraft,
} from "./enrollment.store";
import {
  EnrollError,
  type EnrollFailure,
  useClinicData,
  useEnrollPatient,
  useProgramCourses,
} from "./useClinicData";
import { useCan } from "@/features/staff/useStaffAccounts";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import { organizationFor } from "@/features/staff/staff";
import { CcmEnrollPartialError, useCcm, type CcmActions } from "./useCcm";
import { actionErrorText } from "./officeContext";
import { isApiError } from "@/lib/api/client";
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
  onClose: () => void;
  /** The new patient's name and patientId; `ccm` (no patientId yet) when
   *  the patient went onto the CCM dashboard instead of the roster. */
  onEnrolled: (name: string, patientId: string | null, ccm?: boolean) => void;
};

/** No program the role may enroll into, so the form cannot be completed. */
const NO_PROGRAM_ACCESS =
  "Your role cannot enroll patients in a program. The office owner, or a role with programs edit, can.";

/** A 403 is "your role can't", never "try again" (P16F-1). The server
 *  enrolls in one transaction, so a refusal saved nothing. */
function notEnrolledText(failure: EnrollFailure | null, error: Error): string {
  if (isApiError(failure?.error, { status: 403 }))
    return "Your role cannot enroll patients in this program. Nothing was saved.";
  return enrollErrorText(failure?.code ?? null, error.message);
}

/**
 * Whether the signed-in role can complete the enroll form: it puts
 * patients on the roster (patients edit) and has a program to choose —
 * programs edit (the server checks both before writing, spec 067), or CCM
 * at the nephrology office with CCM edit (the CCM step is its own call,
 * which needs ccm edit). Pages hide or disable "Enroll" without it.
 */
export function useCanEnrollPatient(): boolean {
  const offersCcm = useOffersCcm();
  const roster = useCan("patients.enroll");
  const program = useCan("programs.enroll");
  return roster && (program || offersCcm);
}

/** CCM is a choice only at the nephrology office, and only for a role that
 *  can write a CCM enrollment (ccm edit). Without it the CCM step after the
 *  roster POST is refused, which would leave a roster patient not in CCM. */
function useOffersCcm(): boolean {
  const nephrology =
    organizationFor(useOptionalAuth()?.user)?.portal === "nephrology";
  const canCcm = useCan("ccm.log");
  return nephrology && canCcm;
}

export function EnrollPatientModal(props: EnrollProps) {
  /* Only the nephrology office runs CCM, so only its form offers it — and
     only it loads the CCM record. */
  const offersCcm = useOffersCcm();
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
  onClose,
  onEnrolled,
  ccm,
}: EnrollProps & {
  /** The CCM record and condition library, for the nephrology office. */
  ccm?: { store: CcmActions; library: CcmCondition[] };
}) {
  /* The CCM form is chosen with ccm edit; checked again here so a role
     without it never gets a CCM step it cannot complete. */
  const canCcm = useCan("ccm.log");
  const offersCcm = Boolean(ccm) && canCcm;
  /* Programs edit as well as patients edit: the server refuses the whole
     enrollment without it (spec 067), so no program is offered then. */
  const canProgram = useCan("programs.enroll");
  const [draft, setDraft] = useState<EnrollmentDraft>(() =>
    canProgram || !offersCcm
      ? emptyDraft()
      : { ...emptyDraft(), program: CCM_PROGRAM },
  );
  const [attempted, setAttempted] = useState(false);
  const enroll = useEnrollPatient();
  const courses = useProgramCourses();
  const programs = useMemo(
    () => (canProgram ? enrollablePrograms(courses) : []),
    [courses, canProgram],
  );
  const seats = useClinicData().data?.seats ?? null;
  const failure =
    enroll.error instanceof EnrollError ? enroll.error.failure : null;
  const serverError = (field: "name" | "mrn" | "program") =>
    failure && failure.field === field
      ? enrollErrorText(
          failure.code,
          enroll.error instanceof Error ? enroll.error.message : "",
        )
      : undefined;
  const canRoster = useCan("patients.enroll");
  /* Nothing to choose: no programs edit and no CCM (with ccm edit) here. */
  const noProgram = !canProgram && !offersCcm;
  const canEnroll = canRoster && !noProgram;
  /* CCM "enroll new" is still two calls: (1) roster, (2) CCM enrolment. When (2)
     fails, the patient (1) created is kept and the retry runs (2) only
     (adding them again would be refused as patients.mrn_taken). */
  const [ccmPatientId, setCcmPatientId] = useState<string | null>(null);
  const ccmLocked = ccmPatientId !== null;
  const locked = ccmLocked;
  const lockedHint =
    "Already added to your roster. Only the CCM enrollment is tried again.";

  const isCcm = offersCcm && (ccmLocked || draft.program === CCM_PROGRAM);
  const library = ccm?.library ?? [];
  const [dob, setDob] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [provider, setProvider] = useState("");
  const [careManager, setCareManager] = useState("");
  const [location, setLocation] = useState("");
  const [ccmFailure, setCcmFailure] = useState<unknown>(null);
  const ccmSaving = ccm?.store.isSaving ?? false;

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

  const hints: Record<string, string | undefined> = attempted
    ? isCcm
      ? ccmErrors()
      : validateEnrollment(draft, programs)
    : {};
  /* The server's answer shows on its field (a taken MRN, a full contract). */
  const errors: Record<string, string | undefined> = {
    ...hints,
    name: hints.name ?? serverError("name"),
    mrn: hints.mrn ?? serverError("mrn"),
    program: hints.program ?? serverError("program"),
  };
  const set = (field: keyof EnrollmentDraft, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canEnroll) return;
    setAttempted(true);
    if (isCcm && ccm) {
      if (Object.keys(ccmErrors()).length > 0) return;
      if (ccmSaving) return;
      const name = draft.name.trim().split(/\s+/);
      const lastName = name.length > 1 ? name.pop()! : "";
      const body = {
        conditions,
        providerName: provider.trim(),
        careManagerName: careManager.trim(),
        ...(location.trim() ? { location: location.trim() } : {}),
      };
      setCcmFailure(null);
      (ccmPatientId
        ? ccm.store.enroll({ ...body, patientId: ccmPatientId })
        : ccm.store.enrollNew(
            {
              firstName: name.join(" "),
              lastName,
              dateOfBirth: dob,
              mrn: draft.mrn.trim(),
            },
            body,
          )
      )
        /* The CCM success links to the CCM dashboard, not a roster row. */
        .then(() => onEnrolled(draft.name.trim(), null, true))
        .catch((error: unknown) => {
          if (error instanceof CcmEnrollPartialError) {
            setCcmPatientId(error.patientId);
            setCcmFailure(error.error);
          } else setCcmFailure(error);
        });
      return;
    }
    if (Object.keys(validateEnrollment(draft, programs)).length > 0) return;
    enroll.mutate(draft, {
      onSuccess: (enrollment) =>
        onEnrolled(
          draft.name.trim().replace(/\s+/g, " "),
          enrollment.patientId,
        ),
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
          : seats && seats.allowed !== null
            ? `${Math.max(0, seats.available ?? seats.allowed - seats.used)} of ${seats.allowed} contract seats open.`
            : undefined
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
            disabled={enroll.isPending || ccmSaving || !canEnroll}
          >
            {enroll.isPending || ccmSaving
              ? "Enrolling…"
              : isCcm
                ? "Enroll in CCM"
                : "Enroll Patient"}
          </Button>
        </>
      }
    >
      <form id="enroll-form" onSubmit={submit} noValidate>
        {!canRoster ? (
          <Alert tone="info" className="mb-stack-lg">
            Your role cannot enroll patients. A care coordinator, the front desk
            or an administrator can.
          </Alert>
        ) : noProgram ? (
          <Alert tone="info" className="mb-stack-lg">
            {NO_PROGRAM_ACCESS}
          </Alert>
        ) : null}
        {ccmFailure ? (
          <Alert
            tone="danger"
            className="mb-stack-lg"
            title={
              ccmLocked
                ? "Patient added, CCM enrollment failed"
                : "Not enrolled"
            }
          >
            {actionErrorText(ccmFailure)}
            {/* A 403 is "your role can't": trying again cannot succeed. */}
            {ccmLocked && !isApiError(ccmFailure, { status: 403 })
              ? " Press Enroll in CCM to try the CCM step again."
              : ""}
          </Alert>
        ) : null}
        {enroll.error &&
        failure?.field !== "name" &&
        failure?.field !== "mrn" &&
        failure?.field !== "program" ? (
          <Alert tone="danger" className="mb-stack-lg" title="Not enrolled">
            {notEnrolledText(failure, enroll.error)}
          </Alert>
        ) : null}

        <div className="grid gap-stack-md sm:grid-cols-2">
          <FormField
            label="Full name"
            required
            hint={locked ? lockedHint : undefined}
            error={errors.name}
            className="sm:col-span-2"
          >
            {(props) => (
              <Input
                {...props}
                readOnly={locked}
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
            hint={locked ? lockedHint : "Six digits, from your EHR."}
            error={errors.mrn}
          >
            {(props) => (
              <Input
                {...props}
                readOnly={locked}
                value={draft.mrn}
                onChange={(event) => set("mrn", event.target.value)}
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
              />
            )}
          </FormField>

          {isCcm ? (
            <FormField
              label="Date of birth"
              required
              hint={ccmLocked ? lockedHint : undefined}
              error={errors.dob}
            >
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  readOnly={ccmLocked}
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
                {/* A CCM retry stays CCM: the patient is already added. */}
                {ccmLocked
                  ? null
                  : programs.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                {offersCcm && (ccmLocked || !locked) ? (
                  <option>{CCM_PROGRAM}</option>
                ) : null}
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
