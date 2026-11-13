"use client";

import React, { useState } from "react";
import { CalendarPlus, Check, Send, UserPlus, X } from "lucide-react";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Alert,
  Badge,
  Button,
  Card,
  Chip,
  ChipGroup,
  Composer,
  EmptyState,
  ErrorState,
  FormField,
  Modal,
  SegmentedChoice,
  Select,
  Skeleton,
  SwitchRow,
  Tabs,
  Textarea,
  type BadgeTone,
} from "@/components/ui";
import { useLanguageCode } from "@/context/LanguageContext";
import { isApiError } from "@/lib/api/client";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { cn } from "@/lib/utils/cn";
import { useNow } from "@/lib/utils/useNow";
import * as messaging from "@/features/messaging/messaging.rules";
import { useDirectory } from "@/features/profile/directory";
import {
  ACCESS_CENTER_REFERRAL_KINDS,
  CONCERN_KINDS,
  REFERRAL_KINDS,
  type AccessReferral,
  type AccessRosterRow,
  type ReferralKind,
  type ReferralSource,
  type ReferralStatus,
} from "@/features/vascular-access/vascularAccess.data";
import {
  useAccessActions,
  useAccessRecord,
  useAccessRoster,
  useOfficeOrgId,
  useOfficeTarget,
} from "@/features/vascular-access/useAccess";
import { useAuth } from "@/features/auth/AuthContext";
import { userCan } from "@/features/staff/staff";
import { UpdatedBar } from "./UpdatedBar";
import { AccessConversationView } from "@/features/vascular-access/AccessUi";
import {
  useOfficePatients,
  useReferral,
  useReferralActions,
  useReferrals,
  type ReferralActions,
} from "./useAccessReferrals";

/* ==========================================================================
   Referrals and office messages — staff to staff, without the patient
   --------------------------------------------------------------------------
   The client (2026-10-01): a dialysis nurse who finds no thrill or bruit
   should alert the access center directly and get an appointment booked,
   not wait for the patient to ask. The access center also takes referrals
   from the nephrology office, and has a Messages page of its own to send
   and receive messages with both offices.

   Every one is a thread: who wrote first, about which patient (or none,
   for a general message), and the replies. The patient never sees them.

   On the API (Phase 10): `/organizations/:orgId/referrals`. The server
   gives each office only its own threads; the other office is picked by
   its directory id, the patient by id from this office's roster (the MRN
   is never sent). Which offices may be written to is the server's rule
   (D11 / COLLAB-3 open: the directory lists what the backend allows).
   Access center: acknowledges, schedules or closes; can write first.
   ========================================================================== */

export const referralTone: Record<ReferralStatus, BadgeTone> = {
  New: "warning",
  Acknowledged: "info",
  Scheduled: "success",
  Closed: "neutral",
};

/** Display text for a referral status; the value sent stays English. */
export const REFERRAL_STATUS_ES: Record<ReferralStatus, string> = {
  New: "Nueva",
  Acknowledged: "Recibida",
  Scheduled: "Programada",
  Closed: "Cerrada",
};

/** Display text for a referral kind; the value sent stays English. */
export const REFERRAL_KIND_ES: Record<ReferralKind, string> = {
  "Access Concern": "Inquietud sobre el acceso",
  "New Access Referral": "Nueva derivación de acceso",
  "Appointment Request": "Solicitud de cita",
  "General Message": "Mensaje general",
};

function statusText(status: ReferralStatus, isEs: boolean) {
  return isEs ? REFERRAL_STATUS_ES[status] : status;
}

function kindText(kind: ReferralKind, isEs: boolean) {
  return isEs ? (REFERRAL_KIND_ES[kind] ?? kind) : kind;
}

/** Whose screen this is: the access center, or one office. */
type Side = "access" | ReferralSource;

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function findingsLabel(ids: string[], isEs = false) {
  return ids
    .map((id) => {
      const kind = CONCERN_KINDS.find((k) => k.id === id);
      return (isEs ? kind?.es : kind?.en) ?? id;
    })
    .join(", ");
}

/** The thread's name in a list: its patient, or "General message". */
function subjectOf(referral: AccessReferral, isEs = false) {
  return (
    referral.patient?.name || (isEs ? "Mensaje general" : "General message")
  );
}

/** The office on the other side of the thread from this one. */
function otherOffice(referral: AccessReferral, side: Side) {
  return side === "access" ? referral.from : referral.to;
}

/** Why a send was refused, in words that say what to do. */
export function referralRefusal(
  error: unknown,
  side: Side,
  isEs = false,
): string {
  if (isApiError(error, { status: 404 })) {
    if (error.code?.endsWith("referral_patient_not_linked"))
      return side === "access"
        ? isEs
          ? "Este paciente no está vinculado a su centro y al consultorio que eligió."
          : "This patient is not linked to both your center and the office you chose."
        : isEs
          ? "Este paciente no está vinculado a su consultorio."
          : "This patient is not linked to your office.";
  }
  return isApiError(error) && error.messages[0]
    ? error.messages[0]
    : isEs
      ? "No se envió. Inténtelo de nuevo."
      : "That did not send. Try again.";
}

/* ------------------------------------------------------------------ list */

function ReferralList({
  referrals,
  side,
  onOpen,
  empty,
}: {
  referrals: AccessReferral[];
  side: Side;
  onOpen: (id: string) => void;
  empty: string;
}) {
  const now = useNow();
  const isEs = useLanguageCode() === "ES";
  if (referrals.length === 0) {
    return <p className="text-body-sm text-fg-muted">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-line-subtle">
      {referrals.map((referral) => {
        const waiting = referral.waitingOnYou;
        const sentBy = referral.sentBy ?? "";
        return (
          <li key={referral.id} className="py-inset-xs first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => onOpen(referral.id)}
              className={cn(
                "group flex w-full cursor-pointer items-start gap-inline-lg rounded-control-small text-left",
                focusRing,
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-inline-sm">
                  <span
                    className={cn(
                      "text-label-lg group-hover:text-fg-brand group-hover:underline",
                      waiting ? "text-fg" : "text-fg-secondary",
                    )}
                  >
                    {subjectOf(referral, isEs)}
                  </span>
                  {referral.urgent ? (
                    <Badge tone="danger">{isEs ? "Urgente" : "Urgent"}</Badge>
                  ) : null}
                </span>
                <span className="block text-body-sm text-fg-secondary">
                  {kindText(referral.kind, isEs)}
                  {referral.findings.length > 0
                    ? ` — ${findingsLabel(referral.findings, isEs)}`
                    : ""}
                </span>
                <span className="block text-caption text-fg-muted">
                  {side === "access"
                    ? referral.startedByAccess
                      ? `${isEs ? "Para" : "To"} ${referral.from.name}`
                      : `${referral.from.name}${sentBy ? ` · ${sentBy}` : ""}`
                    : referral.startedByAccess
                      ? `${isEs ? "De" : "From"} ${referral.to.name}`
                      : `${isEs ? "Enviado por" : "Sent by"} ${sentBy || referral.from.name}`}
                  {" · "}
                  {messaging.relativeLabel(referral.sentAt, now, isEs)}
                  {referral.replyCount > 0
                    ? isEs
                      ? ` · ${referral.replyCount} respuesta${referral.replyCount === 1 ? "" : "s"}`
                      : ` · ${referral.replyCount} repl${referral.replyCount === 1 ? "y" : "ies"}`
                    : ""}
                </span>
              </span>
              <Badge tone={referralTone[referral.status]}>
                {statusText(referral.status, isEs)}
              </Badge>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ----------------------------------------------------------------- panel */

export function ReferralsPanel({
  referrals,
  error,
  onRetry,
  side,
  canSend,
  onSend,
  onOpen,
}: {
  referrals: AccessReferral[];
  /** A failed read is never shown as "nothing open". */
  error?: unknown;
  onRetry?: () => void;
  /** "access" sees every office; an office only its own threads. */
  side: Side;
  canSend: boolean;
  onSend: () => void;
  onOpen: (id: string) => void;
}) {
  const isEs = useLanguageCode() === "ES";
  return (
    <Card as="section" padding="small" className="h-full">
      <div className="mb-stack-sm flex items-center justify-between gap-inline-lg">
        <h2 className="text-heading-4 text-fg">
          {side === "access"
            ? isEs
              ? "Derivaciones y solicitudes"
              : "Referrals & Requests"
            : isEs
              ? "Mensajes del centro de acceso vascular"
              : "Access Center Messages"}
        </h2>
        {canSend ? (
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            onClick={onSend}
            leadingIcon={<Send aria-hidden="true" />}
          >
            {isEs ? "Nuevo" : "New"}
          </Button>
        ) : null}
      </div>
      <p className="mb-stack-md text-caption text-fg-muted">
        {side === "access"
          ? isEs
            ? "Directamente del centro de diálisis y del consultorio de nefrología. Solo para el personal: el paciente no los ve."
            : "Straight from the dialysis center and the nephrology office. Staff only — the patient does not see these."
          : isEs
            ? "Inquietudes, derivaciones y mensajes con el centro de acceso vascular. Solo para el personal: el paciente no los ve."
            : "Concerns, referrals and messages with the access center. Staff only — the patient does not see these."}
      </p>
      {error ? (
        <ErrorState
          title={errorTitleFor(
            error,
            isEs
              ? "No se pudieron cargar las derivaciones"
              : "Referrals could not be loaded",
            isEs ? "es" : "en",
          )}
          message={errorMessageFor(error, undefined, isEs ? "es" : "en")}
          error={error}
          onRetry={canRetry(error) ? onRetry : undefined}
        />
      ) : (
        <ReferralList
          referrals={referrals.filter((r) => r.status !== "Closed")}
          side={side}
          onOpen={onOpen}
          empty={
            side === "access"
              ? isEs
                ? "No hay derivaciones abiertas."
                : "No open referrals."
              : isEs
                ? "No hay nada abierto con el centro de acceso vascular."
                : "Nothing open with the access center."
          }
        />
      )}
    </Card>
  );
}

/* ------------------------------------------------------------- send form */

export type ReferralPatient = {
  patientId: string;
  name: string;
  mrn: string | null;
};

export function SendReferralModal({
  side,
  orgId,
  patients,
  patientsError,
  initialPatientId,
  initialKind,
  onSent,
  onClose,
}: {
  side: Side;
  /** The active office: the referral is sent under its id. */
  orgId: string | null;
  /** This office's patients (its roster), by id. */
  patients: ReferralPatient[];
  patientsError?: unknown;
  initialPatientId?: string;
  initialKind?: ReferralKind;
  onSent?: () => void;
  onClose: () => void;
}) {
  const actions = useReferralActions(orgId);
  const directory = useDirectory();
  const isEs = useLanguageCode() === "ES";
  /* The access center may start only these two (the server's rule; a
     hint here). */
  const kinds: readonly ReferralKind[] =
    side === "access" ? ACCESS_CENTER_REFERRAL_KINDS : REFERRAL_KINDS;
  /* The access center picks which kind of office, then which office. */
  const [officeKind, setOfficeKind] = useState<ReferralSource>("dialysis");
  const targets = directory.offices.filter((office) =>
    side === "access"
      ? office.type ===
        (officeKind === "dialysis" ? "DIALYSIS_CENTER" : "NEPHROLOGY_OFFICE")
      : office.type === "ACCESS_CENTER",
  );
  const [toId, setToId] = useState("");
  const chosenTo = targets.some((t) => t.id === toId)
    ? toId
    : (targets[0]?.id ?? "");
  const [kind, setKind] = useState<ReferralKind>(
    initialKind && kinds.includes(initialKind) ? initialKind : kinds[0],
  );
  const [patientId, setPatientId] = useState(
    initialPatientId ??
      (kind === "General Message" ? "" : (patients[0]?.patientId ?? "")),
  );
  const [findings, setFindings] = useState<string[]>([]);
  const [detail, setDetail] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [tried, setTried] = useState(false);
  const [failed, setFailed] = useState<unknown>(null);
  const general = kind === "General Message";
  const patient = patients.find((p) => p.patientId === patientId);
  const patientError =
    patient || (general && patientId === "")
      ? undefined
      : isEs
        ? "Elija el paciente."
        : "Choose the patient.";
  const detailError = detail.trim()
    ? undefined
    : isEs
      ? "Escriba su mensaje."
      : "Write your message.";
  const toError = chosenTo
    ? undefined
    : isEs
      ? "Elija el destinatario."
      : "Choose who it goes to.";
  const targetName = targets.find((t) => t.id === chosenTo)?.name;

  function toggle(id: string) {
    setFindings((current) =>
      current.includes(id) ? current.filter((f) => f !== id) : [...current, id],
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={
        side === "access"
          ? isEs
            ? "Nuevo mensaje"
            : "New Message"
          : isEs
            ? "Enviar mensaje al centro de acceso vascular"
            : "Message Access Center"
      }
      description={
        side === "access"
          ? isEs
            ? "Se envía al consultorio que elija. El paciente no lo ve."
            : "Goes to the office you choose. The patient does not see it."
          : isEs
            ? `Se envía directamente a ${targetName ?? "el centro de acceso vascular"}. El paciente no lo ve.`
            : `Goes straight to ${targetName ?? "the access center"}. The patient does not see it.`
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            leadingIcon={<Send aria-hidden="true" />}
            disabled={actions.isSaving}
            onClick={async () => {
              setTried(true);
              if (patientError || detailError || toError) return;
              setFailed(null);
              const ok = await actions.send({
                toOrganizationId: chosenTo,
                kind,
                patientId: patient?.patientId ?? null,
                findings,
                detail,
                urgent,
              });
              if (ok) {
                onSent?.();
                onClose();
              } else setFailed(true);
            }}
          >
            {isEs ? "Enviar" : "Send"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {failed ? (
          <Alert tone="danger" onDismiss={() => setFailed(null)}>
            {referralRefusal(actions.error ?? failed, side, isEs)}
          </Alert>
        ) : null}
        {directory.error ? (
          <Alert tone="danger">
            {errorMessageFor(
              directory.error,
              isEs
                ? "No se pudo cargar el directorio de consultorios."
                : "The office directory could not be loaded.",
              isEs ? "es" : "en",
            )}
          </Alert>
        ) : null}
        {side === "access" ? (
          <SegmentedChoice
            label={isEs ? "Enviar a" : "Send to"}
            value={officeKind}
            onChange={(next: ReferralSource) => {
              setOfficeKind(next);
              setToId("");
            }}
            options={[
              {
                value: "dialysis",
                label: isEs ? "Centro de diálisis" : "Dialysis Center",
              },
              {
                value: "nephrology",
                label: isEs ? "Consultorio de nefrología" : "Nephrology Office",
              },
            ]}
          />
        ) : null}
        {side === "access" || targets.length !== 1 ? (
          <FormField
            label={
              side === "access"
                ? isEs
                  ? "Consultorio"
                  : "Office"
                : isEs
                  ? "Centro de acceso vascular"
                  : "Access center"
            }
            required
            error={tried ? toError : undefined}
          >
            {(field) => (
              <Select
                {...field}
                value={chosenTo}
                onChange={(e) => setToId(e.target.value)}
              >
                {targets.length === 0 ? (
                  <option value="">
                    {directory.isPending
                      ? isEs
                        ? "Cargando…"
                        : "Loading…"
                      : isEs
                        ? "Ninguno en la lista"
                        : "None listed"}
                  </option>
                ) : null}
                {targets.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        ) : null}
        <div className="grid gap-stack-md sm:grid-cols-2">
          <FormField label={isEs ? "Tipo" : "Type"} required>
            {(field) => (
              <Select
                {...field}
                value={kind}
                onChange={(e) => setKind(e.target.value as ReferralKind)}
              >
                {kinds.map((option) => (
                  <option key={option} value={option}>
                    {kindText(option, isEs)}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField
            label={isEs ? "Paciente" : "Patient"}
            required={!general}
            error={tried ? patientError : undefined}
          >
            {(field) => (
              <Select
                {...field}
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              >
                {general || patientId === "" ? (
                  <option value="">
                    {general
                      ? isEs
                        ? "Ningún paciente específico"
                        : "No specific patient"
                      : isEs
                        ? "Elija un paciente"
                        : "Choose a patient"}
                  </option>
                ) : null}
                {patients.map((p) => (
                  <option key={p.patientId} value={p.patientId}>
                    {p.name}
                    {p.mrn ? ` · MRN ${p.mrn}` : ""}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>
        {patientsError ? (
          <p className="text-caption text-fg-muted">
            {errorMessageFor(
              patientsError,
              isEs
                ? "No se pudo cargar su lista de pacientes."
                : "Your patient list could not be loaded.",
              isEs ? "es" : "en",
            )}
          </p>
        ) : null}
        {kind === "Access Concern" ? (
          <div>
            <p className="mb-stack-xs text-label-md text-fg">
              {isEs ? "Hallazgos" : "Findings"}
            </p>
            <ChipGroup
              label={isEs ? "Hallazgos" : "Findings"}
              selection="multiple"
            >
              {CONCERN_KINDS.map((option) => (
                <Chip
                  key={option.id}
                  selected={findings.includes(option.id)}
                  onClick={() => toggle(option.id)}
                >
                  {isEs ? option.es : option.en}
                </Chip>
              ))}
            </ChipGroup>
          </div>
        ) : null}
        <FormField
          label={isEs ? "Mensaje" : "Message"}
          required
          error={tried ? detailError : undefined}
        >
          {(field) => (
            <Textarea
              {...field}
              rows={4}
              maxLength={4000}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={
                kind === "Access Concern"
                  ? isEs
                    ? "Ej.: Sin frémito ni soplo en la canulación de esta mañana. Por favor, evalúe y programe una cita."
                    : "E.g. No thrill or bruit at cannulation this morning. Please evaluate and schedule."
                  : isEs
                    ? "Escriba su mensaje."
                    : "Write your message."
              }
            />
          )}
        </FormField>
        <SwitchRow
          checked={urgent}
          onChange={setUrgent}
          title={isEs ? "Urgente" : "Urgent"}
          description={
            isEs
              ? "Lo coloca al principio de la lista del otro consultorio."
              : "Puts it at the top of the other office's list."
          }
        />
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------- detail popup */

export function ReferralModal({
  orgId,
  referralId,
  hasRecord,
  side,
  canReplyTo,
  canAct,
  actions,
  onSchedule,
  onStartRecord,
  onClose,
}: {
  orgId: string | null;
  referralId: string;
  /** Whether this office has an access record for the patient. */
  hasRecord: (patientId: string) => boolean;
  side: Side;
  canReplyTo: (referral: AccessReferral) => boolean;
  /** The access center may acknowledge, schedule and close. */
  canAct: boolean;
  actions: ReferralActions;
  /** Absent where the page cannot book (the Messages page). */
  onSchedule?: (referral: AccessReferral) => void;
  onStartRecord?: (referral: AccessReferral) => void;
  onClose: () => void;
}) {
  const now = useNow();
  const read = useReferral(orgId, referralId);
  const [draft, setDraft] = useState("");
  const isEs = useLanguageCode() === "ES";
  const referral = read.referral;

  if (!referral) {
    return (
      <Modal
        open
        onClose={onClose}
        size="wide"
        title={isEs ? "Derivación" : "Referral"}
      >
        {read.error ? (
          <ErrorState
            title={errorTitleFor(
              read.error,
              isEs
                ? "No se pudo cargar esta conversación"
                : "This thread could not be loaded",
              isEs ? "es" : "en",
            )}
            message={errorMessageFor(read.error, undefined, isEs ? "es" : "en")}
            error={read.error}
            onRetry={canRetry(read.error) ? read.refetch : undefined}
          />
        ) : (
          <Skeleton height={240} className="rounded-card" />
        )}
      </Modal>
    );
  }

  const open = referral.status !== "Closed";
  const opener = referral.startedByAccess ? referral.to : referral.from;
  const orgNameOf = (id: string) =>
    id === referral.to.id ? referral.to.name : referral.from.name;
  const thread = [
    {
      id: referral.id,
      authorName: referral.sentBy ?? "",
      orgName: opener.name,
      mine: opener.id === orgId,
      body: referral.detail,
      sentAt: referral.sentAt,
    },
    ...(referral.replies ?? []).map((reply) => ({
      id: reply.id,
      authorName: reply.authorName ?? "",
      orgName: orgNameOf(reply.authorOrgId),
      /* The side is the writer's office, compared by id. */
      mine: reply.authorOrgId === orgId,
      body: reply.body,
      sentAt: reply.sentAt,
    })),
  ];
  const actionsShown = side === "access" && open && canAct;
  const patientId = referral.patient?.id ?? null;
  const record = patientId ? hasRecord(patientId) : false;
  const canReply = canReplyTo(referral);
  const other = otherOffice(referral, side);

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={subjectOf(referral, isEs)}
      description={
        referral.mrn
          ? `MRN ${referral.mrn} · ${kindText(referral.kind, isEs)}`
          : kindText(referral.kind, isEs)
      }
      footer={
        actionsShown ? (
          <>
            <Button
              variant="neutral"
              appearance="ghost"
              disabled={actions.isSaving}
              leadingIcon={<X aria-hidden="true" />}
              onClick={async () => {
                if (await actions.setStatus(referral.id, "Closed")) onClose();
              }}
            >
              {isEs ? "Cerrar conversación" : "Close Thread"}
            </Button>
            {referral.status === "New" && referral.waitingOnYou ? (
              <Button
                variant="neutral"
                appearance="fill-stroke"
                disabled={actions.isSaving}
                leadingIcon={<Check aria-hidden="true" />}
                onClick={() =>
                  void actions.setStatus(referral.id, "Acknowledged")
                }
              >
                {isEs ? "Confirmar recepción" : "Acknowledge"}
              </Button>
            ) : null}
            {patientId && record && onSchedule ? (
              <Button
                leadingIcon={<CalendarPlus aria-hidden="true" />}
                onClick={() => onSchedule(referral)}
              >
                {isEs ? "Programar cita" : "Schedule Appointment"}
              </Button>
            ) : null}
            {patientId && !record && onStartRecord ? (
              <Button
                leadingIcon={<UserPlus aria-hidden="true" />}
                onClick={() => onStartRecord(referral)}
              >
                {isEs ? "Crear registro de acceso" : "Start Access Record"}
              </Button>
            ) : null}
          </>
        ) : undefined
      }
    >
      <div className="space-y-stack-lg">
        {actions.error ? (
          <Alert tone="danger" onDismiss={actions.clearError}>
            {referralRefusal(actions.error, side, isEs)}
          </Alert>
        ) : null}
        <dl className="grid gap-stack-sm text-body-sm sm:grid-cols-3">
          <div>
            <dt className="text-caption text-fg-muted">
              {side === "access"
                ? isEs
                  ? "Consultorio"
                  : "Office"
                : isEs
                  ? "Con"
                  : "With"}
            </dt>
            <dd className="text-label-lg text-fg">{other.name}</dd>
          </div>
          <div>
            <dt className="text-caption text-fg-muted">
              {isEs ? "Estado" : "Status"}
            </dt>
            <dd className="flex flex-wrap gap-inline-sm">
              <Badge tone={referralTone[referral.status]}>
                {statusText(referral.status, isEs)}
              </Badge>
              {referral.urgent ? (
                <Badge tone="danger">{isEs ? "Urgente" : "Urgent"}</Badge>
              ) : null}
            </dd>
          </div>
          {referral.findings.length > 0 ? (
            <div>
              <dt className="text-caption text-fg-muted">
                {isEs ? "Hallazgos" : "Findings"}
              </dt>
              <dd className="text-label-lg text-fg">
                {findingsLabel(referral.findings, isEs)}
              </dd>
            </div>
          ) : null}
        </dl>

        {patientId && !record && side === "access" && onStartRecord ? (
          <p className="text-body-sm text-fg-muted">
            {isEs
              ? "Este paciente aún no tiene registro de acceso. Cree uno para programar."
              : "This patient has no access record yet. Start one to schedule."}
          </p>
        ) : null}

        <section aria-label={isEs ? "Conversación" : "Thread"}>
          <ol className="space-y-stack-md">
            {thread.map((entry) => (
              <li
                key={entry.id}
                className={cn(
                  "rounded-card-nested p-inset-sm",
                  entry.mine
                    ? "bg-surface-sunken"
                    : "border border-line bg-surface",
                )}
              >
                <p className="text-caption text-fg-muted">
                  {entry.authorName ? (
                    <>
                      <span className="text-label-md text-fg">
                        {entry.authorName}
                      </span>
                      {" · "}
                    </>
                  ) : null}
                  {entry.orgName}
                  {" · "}
                  {messaging.relativeLabel(entry.sentAt, now, isEs)}
                </p>
                <p className="mt-stack-xs text-body-sm whitespace-pre-line text-fg">
                  {entry.body}
                </p>
              </li>
            ))}
          </ol>
          {referral.handledBy && referral.handledAt ? (
            <p className="mt-stack-sm text-caption text-fg-muted">
              {isEs
                ? `${REFERRAL_STATUS_ES[referral.status]} por ${referral.handledBy},`
                : `${referral.status} by ${referral.handledBy},`}{" "}
              {messaging.relativeLabel(referral.handledAt, now, isEs)}
            </p>
          ) : null}
        </section>

        {open && canReply ? (
          <Composer
            value={draft}
            onChange={setDraft}
            sending={actions.isSaving}
            label={`${isEs ? "Responder a" : "Reply to"} ${other.name}`}
            placeholder={`${isEs ? "Responder a" : "Reply to"} ${other.name}…`}
            onSend={async (body) => {
              if (await actions.reply(referral.id, body)) setDraft("");
            }}
          />
        ) : !open ? (
          <EmptyState
            variant="bare"
            title={
              isEs ? "Esta conversación está cerrada" : "This thread is closed"
            }
          />
        ) : null}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------- message a patient */

/** The access center starts a message in a patient's access conversation
 *  (client, 2026-10-06: the access center can message patients too). */
function MessagePatientModal({
  rows,
  onSend,
  onClose,
}: {
  rows: AccessRosterRow[];
  onSend: (profileId: string, body: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const [profileId, setProfileId] = useState(rows[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [tried, setTried] = useState(false);
  const [failed, setFailed] = useState(false);
  const isEs = useLanguageCode() === "ES";
  const error = body.trim()
    ? undefined
    : isEs
      ? "Escriba su mensaje."
      : "Write your message.";
  return (
    <Modal
      open
      onClose={onClose}
      title={isEs ? "Enviar mensaje a un paciente" : "Message a Patient"}
      description={
        isEs
          ? "Se envía a la conversación de acceso del paciente."
          : "Goes to the patient's access conversation."
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            leadingIcon={<Send aria-hidden="true" />}
            disabled={!profileId}
            onClick={async () => {
              setTried(true);
              if (error) return;
              setFailed(false);
              if (!(await onSend(profileId, body.trim()))) setFailed(true);
            }}
          >
            {isEs ? "Enviar" : "Send"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {failed ? (
          <Alert tone="danger" onDismiss={() => setFailed(false)}>
            {isEs
              ? "No se envió. Inténtelo de nuevo."
              : "That did not send. Try again."}
          </Alert>
        ) : null}
        <FormField label={isEs ? "Paciente" : "Patient"} required>
          {(field) => (
            <Select
              {...field}
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
            >
              {rows.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.memberName}
                  {row.mrn ? ` · MRN ${row.mrn}` : ""}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField
          label={isEs ? "Mensaje" : "Message"}
          required
          error={tried ? error : undefined}
        >
          {(field) => (
            <Textarea
              {...field}
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          )}
        </FormField>
      </div>
    </Modal>
  );
}

/** One patient's access conversation, read when it is opened. */
function PatientConversation({
  row,
  canMessagePatients,
  onClose,
}: {
  row: AccessRosterRow;
  canMessagePatients: boolean;
  onClose: () => void;
}) {
  const target = useOfficeTarget();
  const actions = useAccessActions(target);
  const reads = useAccessRecord(target, row.id, {
    memberName: row.memberName,
    mrn: row.mrn,
  });
  const record = reads.record;
  const isEs = useLanguageCode() === "ES";
  return (
    <Modal
      open
      size="wide"
      onClose={onClose}
      title={row.memberName}
      description={`${row.mrn ? `MRN ${row.mrn} · ` : ""}${isEs ? "conversación de acceso" : "access conversation"}`}
    >
      {reads.error ? (
        <ErrorState
          title={errorTitleFor(
            reads.error,
            isEs
              ? "No se pudo cargar esta conversación"
              : "This conversation could not be loaded",
            isEs ? "es" : "en",
          )}
          message={errorMessageFor(reads.error, undefined, isEs ? "es" : "en")}
          error={reads.error}
          onRetry={canRetry(reads.error) ? reads.refetch : undefined}
        />
      ) : !record ? (
        <Skeleton height={240} className="rounded-card" />
      ) : (
        <>
          {actions.error ? (
            <Alert tone="danger" onDismiss={actions.clearError}>
              {isEs
                ? "No se pudo guardar el cambio. Inténtelo de nuevo."
                : "That change did not save. Try again."}
            </Alert>
          ) : null}
          <AccessConversationView
            record={record}
            party={record.party}
            target={target}
            myName={record.memberName}
            isEs={isEs}
            readOnlyReason={
              canMessagePatients
                ? undefined
                : isEs
                  ? "Su rol puede leer esta conversación, pero no responder."
                  : "Your role can read this conversation but not reply."
            }
            sending={actions.isSaving}
            onSend={(body, isPrivate) =>
              void actions.sendMessage(record.id, body, { isPrivate })
            }
            onSetPrivate={(messageId, isPrivate) =>
              void actions.setMessagePrivate(record.id, messageId, isPrivate)
            }
            onSetDialysisCanPost={(allowed) =>
              void actions.setDialysisCanPost(record.id, allowed)
            }
          />
        </>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------ Messages */

type Folder = "all" | ReferralSource | "closed" | "patients";

const MESSAGES_HREF: Record<Side, string> = {
  access: "/dashboard/access-center/messages",
  dialysis: "/dashboard/clinic/vascular-access",
  nephrology: "/dashboard/nephrology/access-messages",
};

/** A Messages page for staff-to-staff threads. The access center sees
 *  every office, in folders, and books from Access Patients; an office
 *  sees only its own threads with the access center (the server's list). */
export function OfficeMessages({ side }: { side: Side }) {
  const { user } = useAuth();
  const isEs = useLanguageCode() === "ES";
  const orgId = useOfficeOrgId();
  const target = useOfficeTarget();
  /* The access center's own permissions (2026-10-06); the offices keep
     theirs. */
  const atAccess = side === "access";
  const canReply = atAccess
    ? userCan(user, "access.message.nephrology") ||
      userCan(user, "access.message.dialysis")
    : userCan(user, "messages.reply");
  const canAct = atAccess
    ? userCan(user, "access.referral.status")
    : userCan(user, "access.schedule");
  const canMessagePatients =
    atAccess && userCan(user, "access.message.patients");
  const read = useReferrals(orgId);
  const actions = useReferralActions(orgId);
  const accessActions = useAccessActions(target);
  /* The access center's patients' conversations (its roster). */
  const roster = useAccessRoster(orgId, {}, { enabled: atAccess });
  const patientsRead = useOfficePatients(orgId);
  const directory = useDirectory();
  const typeOf = (id: string) =>
    directory.offices.find((o) => o.id === id)?.type;
  const sourceOf = (referral: AccessReferral): ReferralSource =>
    typeOf(referral.from.id) === "NEPHROLOGY_OFFICE"
      ? "nephrology"
      : "dialysis";
  const [folder, setFolder] = useState<Folder>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [toPatient, setToPatient] = useState(false);
  const [chattingId, setChattingId] = useState<string | null>(null);
  const chatting = chattingId
    ? roster.rows.find((row) => row.id === chattingId)
    : undefined;
  /* Unread first, then by name. */
  const patientChats = [...roster.rows].sort(
    (a, b) => b.unread - a.unread || a.memberName.localeCompare(b.memberName),
  );

  const referrals = read.referrals;
  const count = (f: Folder) =>
    referrals.filter((r) =>
      f === "closed"
        ? r.status === "Closed"
        : r.status !== "Closed" && (f === "all" || sourceOf(r) === f),
    ).length;
  const shown = referrals.filter((r) =>
    folder === "closed"
      ? r.status === "Closed"
      : r.status !== "Closed" && (folder === "all" || sourceOf(r) === folder),
  );

  let body: React.ReactNode;
  if (read.error) {
    body = (
      <ErrorState
        title={errorTitleFor(
          read.error,
          isEs
            ? "No se pudieron cargar los mensajes"
            : "Messages could not be loaded",
          isEs ? "es" : "en",
        )}
        message={errorMessageFor(read.error, undefined, isEs ? "es" : "en")}
        error={read.error}
        onRetry={canRetry(read.error) ? read.refetch : undefined}
      />
    );
  } else if (read.isPending) {
    body = <Skeleton className="h-96 w-full" />;
  } else {
    body = (
      <Card as="section" padding="small">
        <Tabs
          label={isEs ? "Carpetas" : "Folders"}
          value={folder}
          onChange={setFolder}
          className="mb-stack-lg"
          items={[
            {
              id: "all",
              label: `${isEs ? "Todos los abiertos" : "All Open"} (${count("all")})`,
            },
            ...(side === "access"
              ? [
                  {
                    id: "dialysis" as const,
                    label: `${isEs ? "Centro de diálisis" : "Dialysis Center"} (${count("dialysis")})`,
                  },
                  {
                    id: "nephrology" as const,
                    label: `${isEs ? "Consultorio de nefrología" : "Nephrology Office"} (${count("nephrology")})`,
                  },
                ]
              : []),
            {
              id: "closed",
              label: `${isEs ? "Cerrados" : "Closed"} (${count("closed")})`,
            },
            /* The access center writes to patients too (client,
               2026-10-06). */
            ...(atAccess
              ? [
                  {
                    id: "patients" as const,
                    label: `${isEs ? "Pacientes" : "Patients"} (${roster.total})`,
                  },
                ]
              : []),
          ]}
        />
        {folder === "patients" ? (
          roster.error ? (
            <ErrorState
              title={errorTitleFor(
                roster.error,
                isEs
                  ? "No se pudieron cargar las conversaciones con pacientes"
                  : "Patient conversations could not be loaded",
                isEs ? "es" : "en",
              )}
              message={errorMessageFor(
                roster.error,
                undefined,
                isEs ? "es" : "en",
              )}
              error={roster.error}
              onRetry={canRetry(roster.error) ? roster.refetch : undefined}
            />
          ) : patientChats.length === 0 ? (
            <p className="text-body-sm text-fg-muted">
              {isEs
                ? "Aún no hay conversaciones con pacientes."
                : "No patient conversations yet."}
            </p>
          ) : (
            <ul className="divide-y divide-line-subtle">
              {patientChats.map((row) => (
                <li key={row.id} className="py-inset-xs first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => {
                      setChattingId(row.id);
                      if (row.unread > 0) void accessActions.markRead(row.id);
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-start justify-between gap-inline-lg rounded-control-small text-left",
                      focusRing,
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-label-lg text-fg">
                        {row.memberName}
                      </span>
                      <span className="block truncate text-body-sm text-fg-secondary">
                        {row.overview.type} · {row.overview.status}
                      </span>
                    </span>
                    {row.unread > 0 ? (
                      <Badge tone="danger">
                        {row.unread}{" "}
                        {isEs ? (row.unread === 1 ? "nuevo" : "nuevos") : "new"}
                      </Badge>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <ReferralList
            referrals={shown}
            side={side}
            onOpen={setOpenId}
            empty={
              folder === "closed"
                ? isEs
                  ? "No hay conversaciones cerradas."
                  : "No closed threads."
                : isEs
                  ? "No hay mensajes abiertos."
                  : "No open messages."
            }
          />
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <PageTitle
        href={MESSAGES_HREF[side]}
        action={
          <div className="flex flex-wrap items-center gap-inline-md">
            <UpdatedBar
              updatedAt={read.updatedAt}
              isFetching={read.isFetching}
              refetch={read.refetch}
            />
            {canMessagePatients ? (
              <Button
                size="small"
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setToPatient(true)}
                leadingIcon={<Send aria-hidden="true" />}
              >
                {isEs ? "Enviar mensaje a un paciente" : "Message a Patient"}
              </Button>
            ) : null}
            {canReply ? (
              <Button
                size="small"
                onClick={() => setComposing(true)}
                leadingIcon={<Send aria-hidden="true" />}
              >
                {atAccess
                  ? isEs
                    ? "Enviar mensaje a un consultorio"
                    : "Message an Office"
                  : isEs
                    ? "Nuevo mensaje"
                    : "New Message"}
              </Button>
            ) : null}
          </div>
        }
      />
      {body}
      {openId ? (
        <ReferralModal
          key={openId}
          orgId={orgId}
          referralId={openId}
          hasRecord={(patientId) =>
            roster.rows.some((row) => row.patientId === patientId)
          }
          side={side}
          canReplyTo={(referral) =>
            atAccess
              ? userCan(
                  user,
                  sourceOf(referral) === "nephrology"
                    ? "access.message.nephrology"
                    : "access.message.dialysis",
                )
              : canReply
          }
          canAct={canAct}
          actions={actions}
          onClose={() => setOpenId(null)}
        />
      ) : null}
      {toPatient ? (
        <MessagePatientModal
          rows={roster.rows}
          onClose={() => setToPatient(false)}
          onSend={async (profileId, text) => {
            const ok = await accessActions.sendMessage(profileId, text);
            if (ok) {
              setToPatient(false);
              setFolder("patients");
            }
            return ok;
          }}
        />
      ) : null}
      {chatting ? (
        <PatientConversation
          row={chatting}
          canMessagePatients={canMessagePatients}
          onClose={() => setChattingId(null)}
        />
      ) : null}
      {composing ? (
        <SendReferralModal
          side={side}
          orgId={orgId}
          patients={patientsRead.patients}
          patientsError={patientsRead.error}
          onClose={() => setComposing(false)}
        />
      ) : null}
    </div>
  );
}
