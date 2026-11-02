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
  useClinicData,
  useEnrollPatient,
  useProgramCourses,
} from "./useClinicData";
import { useCan } from "@/features/staff/useStaffAccounts";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import { organizationFor } from "@/features/staff/staff";
import { useCcm } from "./useCcm";
import { CARE_MANAGERS, LOCATIONS, PROVIDERS, ccmPatientsOf } from "./ccm.data";
import { ConditionSelect } from "./ConditionSelect";
import { useConditionLibrary } from "./useConditionLibrary";
import { chronicCount, type CcmCondition } from "./ccmConditions";

/** The nephrology office's own program (client, 2026-10-09). Not an
 *  education program: it goes straight onto the CCM dashboard as an
 *  enrolled patient. (Whether it takes a contract seat is NEW-3: the
 *  backend counts one, so the form promises nothing either way.) */
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
  onClose,
  onEnrolled,
  ccm,
}: EnrollProps & {
  /** The CCM record and condition library, for the nephrology office. */
  ccm?: { store: ReturnType<typeof useCcm>; library: CcmCondition[] };
}) {
  const [draft, setDraft] = useState<EnrollmentDraft>(emptyDraft);
  const [attempted, setAttempted] = useState(false);
  const enroll = useEnrollPatient();
  const courses = useProgramCourses();
  const programs = useMemo(() => enrollablePrograms(courses), [courses]);
  const seats = useClinicData().data?.seats ?? null;
  const failure =
    enroll.error instanceof EnrollError ? enroll.error.failure : null;
  const serverError = (field: "name" | "mrn" | "program") =>
    failure && !failure.partial && failure.field === field
      ? enrollErrorText(
          failure.code,
          enroll.error instanceof Error ? enroll.error.message : "",
        )
      : undefined;
  const canEnroll = useCan("patients.enroll");
  /* ① put this patient on the roster and ② failed: the retry runs ② for
     that patient only, so the name and MRN they were added with stay as
     they are (an edit here would never reach the server, QA round 1). */
  const locked = enroll.partialPatientId !== null;
  const lockedHint =
    "Already added to your roster. Only the program is tried again.";

  const offersCcm = Boolean(ccm);
  const isCcm = offersCcm && draft.program === CCM_PROGRAM;
  const library = ccm?.library ?? [];
  const [dob, setDob] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [provider, setProvider] = useState<string>(PROVIDERS[0]);
  const [careManager, setCareManager] = useState<string>(CARE_MANAGERS[0]);
  const [location, setLocation] = useState<string>(LOCATIONS[0]);

  function ccmErrors() {
    const out: {
      name?: string;
      mrn?: string;
      dob?: string;
      conditions?: string;
    } = {};
    if (!draft.name.trim()) out.name = "Enter the patient's full name.";
    const mrn = draft.mrn.trim();
    if (!/^\d{6}$/.test(mrn)) out.mrn = "An MRN is 6 digits.";
    else if (ccm && ccmPatientsOf(ccm.store.state).some((p) => p.mrn === mrn))
      out.mrn = "This patient is already in CCM.";
    if (!dob) out.dob = "Enter the date of birth.";
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
      ccm.store.enroll({
        mrn: draft.mrn.trim(),
        name: draft.name.trim(),
        dob,
        conditions,
        provider,
        careManager,
        location,
      });
      onEnrolled(draft.name.trim(), null, true);
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
          ? "Adds the patient to your CCM dashboard."
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
        {failure?.partial ? (
          <Alert
            tone="danger"
            className="mb-stack-lg"
            title="Patient added, program enrollment failed"
          >
            {enrollErrorText(
              failure.code,
              "The program enrollment did not save.",
            )}{" "}
            Press Enroll Patient to try the program again.
          </Alert>
        ) : enroll.error &&
          failure?.field !== "name" &&
          failure?.field !== "mrn" &&
          failure?.field !== "program" ? (
          <Alert tone="danger" className="mb-stack-lg" title="Not enrolled">
            {enrollErrorText(failure?.code ?? null, enroll.error.message)}
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
                {offersCcm && !locked ? <option>{CCM_PROGRAM}</option> : null}
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
              <FormField label="Provider" required>
                {(props) => (
                  <Select
                    {...props}
                    value={provider}
                    onChange={(event) => setProvider(event.target.value)}
                  >
                    {PROVIDERS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </Select>
                )}
              </FormField>
              <FormField label="Care manager" required>
                {(props) => (
                  <Select
                    {...props}
                    value={careManager}
                    onChange={(event) => setCareManager(event.target.value)}
                  >
                    {CARE_MANAGERS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </Select>
                )}
              </FormField>
              <FormField label="Location" required>
                {(props) => (
                  <Select
                    {...props}
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  >
                    {LOCATIONS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </Select>
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
