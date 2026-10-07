"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  CircleDot,
  Clock3,
  Lock,
  LockOpen,
  MapPin,
  Send,
  Users,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Switch,
  SwitchRow,
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea,
  type BadgeTone,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useNow } from "@/lib/utils/useNow";
import * as messaging from "@/features/messaging/messaging.rules";
import {
  dayParts,
  formatDay,
  formatTime,
  type AccessAppointment,
  type AccessHistoryEntry,
  MOBILITY_LEVELS,
  PARTY_LABEL,
  canManagePrivacy,
  canPost,
  canRead,
  type AccessParty,
  type AccessRecord,
  type AccessStatus,
  type AccessUpdate,
  type TransportConfirmation,
  type TransportRequest,
  type TransportStatus,
  type UpdateKind,
} from "./vascularAccess.data";

/* ==========================================================================
   Pieces both portals draw the same way
   ========================================================================== */

export const accessStatusTone: Record<AccessStatus, BadgeTone> = {
  "No Active Concern": "success",
  "Review Requested": "warning",
  "Concern Reported": "danger",
  "Appointment Scheduled": "info",
  "Follow-Up Needed": "accent",
  Closed: "neutral",
};

const STATUS_ES: Record<AccessStatus, string> = {
  "No Active Concern": "Sin inquietudes activas",
  "Review Requested": "Revisión solicitada",
  "Concern Reported": "Inquietud reportada",
  "Appointment Scheduled": "Cita programada",
  "Follow-Up Needed": "Requiere seguimiento",
  Closed: "Cerrado",
};

export function AccessStatusBadge({
  status,
  isEs = false,
}: {
  status: AccessStatus;
  isEs?: boolean;
}) {
  return (
    <Badge tone={accessStatusTone[status]}>
      {isEs ? STATUS_ES[status] : status}
    </Badge>
  );
}

export function TeamBadge({
  team,
  isEs = false,
}: {
  team: AccessAppointment["team"];
  isEs?: boolean;
}) {
  const label =
    team === "vascular"
      ? isEs
        ? "Equipo vascular"
        : "Vascular Team"
      : isEs
        ? "Centro de diálisis"
        : "Dialysis Center";
  return (
    <Badge tone={team === "vascular" ? "info" : "success"} variant="soft">
      {label}
    </Badge>
  );
}

/** A date tile, a title, the time and place, and who it is with. */
export function AppointmentRow({
  appointment,
  isEs = false,
  action,
}: {
  appointment: AccessAppointment;
  isEs?: boolean;
  action?: React.ReactNode;
}) {
  const parts = dayParts(appointment.date);
  return (
    <div className="flex items-center gap-inline-lg">
      <span className="flex w-14 shrink-0 flex-col items-center rounded-control border border-line bg-surface-sunken py-1.5 text-center">
        <span className="text-caption font-semibold text-fg-brand">
          {parts.month}
        </span>
        <span className="text-heading-5 leading-none text-fg tabular-nums">
          {parts.day}
        </span>
        <span className="text-caption text-fg-muted tabular-nums">
          {parts.year}
        </span>
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-label-lg text-fg">{appointment.title}</p>
        <p className="flex items-center gap-inline-xs text-body-sm text-fg-secondary">
          <Clock3 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {formatTime(appointment.time)}
        </p>
        <p className="flex items-center gap-inline-xs text-body-sm text-fg-secondary">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{appointment.place}</span>
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-inline-sm">
        <TeamBadge team={appointment.team} isEs={isEs} />
        {action}
      </div>
    </div>
  );
}

const updateDot: Record<UpdateKind, string> = {
  done: "text-success",
  scheduled: "text-fg-brand",
  received: "text-warning",
};

export function UpdatesTimeline({
  updates,
  emptyLabel,
}: {
  updates: AccessUpdate[];
  emptyLabel: string;
}) {
  if (updates.length === 0) {
    return <p className="text-body-sm text-fg-muted">{emptyLabel}</p>;
  }
  return (
    <ol className="relative space-y-stack-md">
      {updates.map((update, index) => {
        const Icon = update.kind === "done" ? CheckCircle2 : CircleDot;
        return (
          <li key={update.id} className="relative flex gap-inline-lg">
            {index < updates.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute top-6 left-2 h-[calc(100%-0.5rem)] w-px bg-line"
              />
            ) : null}
            <Icon
              aria-hidden="true"
              className={cn("mt-0.5 h-4 w-4 shrink-0", updateDot[update.kind])}
            />
            <div className="min-w-0 flex-1">
              <p className="text-label-lg text-fg">{update.title}</p>
              <p className="text-body-sm text-fg-secondary">{update.detail}</p>
            </div>
            <span className="shrink-0 text-body-sm text-fg-muted tabular-nums">
              {formatDay(update.date)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function HistoryTable({
  history,
  isEs = false,
}: {
  history: AccessHistoryEntry[];
  isEs?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-control border border-line">
      <Table minWidth={720}>
        <TableHead className="bg-surface-sunken">
          <TableRow>
            <TableHeaderCell>{isEs ? "Fecha" : "Date"}</TableHeaderCell>
            <TableHeaderCell>{isEs ? "Tipo" : "Type"}</TableHeaderCell>
            <TableHeaderCell>
              {isEs ? "Procedimiento" : "Procedure"}
            </TableHeaderCell>
            <TableHeaderCell>{isEs ? "Lugar" : "Location"}</TableHeaderCell>
            <TableHeaderCell>
              {isEs ? "Realizado por" : "Performed By"}
            </TableHeaderCell>
            <TableHeaderCell>{isEs ? "Resultado" : "Result"}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.length === 0 ? (
            <TableEmptyRow colSpan={6}>
              {isEs ? "Aún no hay historial." : "No history yet."}
            </TableEmptyRow>
          ) : (
            history.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatDay(entry.date)}
                </TableCell>
                <TableCell>{entry.type}</TableCell>
                <TableCell emphasis>{entry.procedure}</TableCell>
                <TableCell>{entry.location}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {entry.performedBy}
                </TableCell>
                <TableCell>{entry.result}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/* ------------------------------------------------------------ transport */

export const transportTone: Record<TransportStatus, BadgeTone> = {
  Requested: "warning",
  Acknowledged: "info",
  Confirmed: "success",
  Cancelled: "neutral",
};

const TRANSPORT_ES: Record<TransportStatus, string> = {
  Requested: "Solicitado",
  Acknowledged: "Recibido",
  Confirmed: "Confirmado",
  Cancelled: "Cancelado",
};

export function TransportStatusBadge({
  status,
  isEs = false,
}: {
  status: TransportStatus;
  isEs?: boolean;
}) {
  return (
    <Badge tone={transportTone[status]}>
      {isEs ? TRANSPORT_ES[status] : status}
    </Badge>
  );
}

/** Where the request is, as three steps: sent, received, booked. */
export function TransportSteps({
  request,
  isEs = false,
}: {
  request: TransportRequest;
  isEs?: boolean;
}) {
  const steps = [
    { label: isEs ? "Enviado" : "Requested", at: request.requestedAt },
    { label: isEs ? "Recibido" : "Acknowledged", at: request.acknowledgedAt },
    { label: isEs ? "Confirmado" : "Confirmed", at: request.confirmedAt },
  ];
  return (
    <ol
      aria-label={isEs ? "Estado del transporte" : "Transportation progress"}
      className="grid grid-cols-3 gap-inline-xs"
    >
      {steps.map((step) => (
        <li key={step.label} className="min-w-0">
          <span
            aria-hidden="true"
            className={cn(
              "block h-1.5 rounded-pill",
              step.at ? "bg-chart-success" : "bg-line",
            )}
          />
          <span
            className={cn(
              "mt-stack-xs block truncate text-caption",
              step.at ? "text-fg" : "text-fg-muted",
            )}
          >
            {step.label}
            <span className="sr-only">
              {step.at
                ? isEs
                  ? ", hecho"
                  : ", done"
                : isEs
                  ? ", pendiente"
                  : ", pending"}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** What the patient asked for: address, trip, mobility, note. */
export function TransportAsk({
  request,
  isEs = false,
}: {
  request: TransportRequest;
  isEs?: boolean;
}) {
  const mobility = MOBILITY_LEVELS.find((m) => m.id === request.mobility);
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-inline-lg gap-y-stack-xs text-body-sm">
      <dt className="text-fg-muted">{isEs ? "Recoger en" : "Pickup at"}</dt>
      <dd className="text-fg">{request.pickupAddress}</dd>
      <dt className="text-fg-muted">{isEs ? "Viaje" : "Trip"}</dt>
      <dd className="text-fg">
        {request.returnTrip
          ? isEs
            ? "Ida y vuelta"
            : "Round trip"
          : isEs
            ? "Solo ida"
            : "One way"}
      </dd>
      <dt className="text-fg-muted">{isEs ? "Movilidad" : "Mobility"}</dt>
      <dd className="text-fg">
        {mobility ? (isEs ? mobility.es : mobility.en) : "—"}
      </dd>
      {request.memberNote ? (
        <>
          <dt className="text-fg-muted">{isEs ? "Nota" : "Note"}</dt>
          <dd className="text-fg">{request.memberNote}</dd>
        </>
      ) : null}
    </dl>
  );
}

/** The booked ride, as the patient needs it on the day. */
export function TransportConfirmationView({
  confirmation,
  confirmedBy,
  isEs = false,
}: {
  confirmation: TransportConfirmation;
  confirmedBy?: string;
  isEs?: boolean;
}) {
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-inline-lg gap-y-stack-xs rounded-card-nested bg-success-surface p-inset-sm text-body-sm">
      <dt className="text-fg-secondary">{isEs ? "Recogida" : "Pickup"}</dt>
      <dd className="text-label-md text-fg">
        {formatTime(confirmation.pickupTime)}
      </dd>
      {confirmation.returnPickupTime ? (
        <>
          <dt className="text-fg-secondary">{isEs ? "Regreso" : "Return"}</dt>
          <dd className="text-label-md text-fg">
            {formatTime(confirmation.returnPickupTime)}
          </dd>
        </>
      ) : null}
      <dt className="text-fg-secondary">{isEs ? "Compañía" : "Company"}</dt>
      <dd className="text-fg">{confirmation.provider}</dd>
      <dt className="text-fg-secondary">{isEs ? "Teléfono" : "Phone"}</dt>
      <dd>
        <a
          href={`tel:${confirmation.phone.replace(/[^\d+]/g, "")}`}
          className="rounded-control-small text-fg-brand underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {confirmation.phone}
        </a>
      </dd>
      <dt className="text-fg-secondary">
        {isEs ? "Confirmación" : "Confirmation #"}
      </dt>
      <dd className="text-fg tabular-nums">
        {confirmation.confirmationNumber}
      </dd>
      {confirmation.note ? (
        <>
          <dt className="text-fg-secondary">{isEs ? "Nota" : "Note"}</dt>
          <dd className="text-fg">{confirmation.note}</dd>
        </>
      ) : null}
      {confirmedBy ? (
        <>
          <dt className="text-fg-secondary">
            {isEs ? "Reservado por" : "Booked by"}
          </dt>
          <dd className="text-fg">{confirmedBy}</dd>
        </>
      ) : null}
    </dl>
  );
}

/* --------------------------------------------------------- conversation */

const PARTY_ES: Record<AccessParty, string> = {
  member: "Paciente",
  access: "Centro de Acceso Vascular",
  dialysis: "Centro de Diálisis",
};

/**
 * The three-way access conversation, from one party's side.
 *
 * Everyone reads what is shared. A private message (patient ↔ access
 * center) reaches the dialysis center only as a placeholder. The patient
 * and the access center can make a message private or share it again, and
 * decide whether the dialysis center may post; the dialysis center reads
 * until they do. `attach` is an optional slot above the composer (the
 * member's photo picker); `attachedUrl` is what it chose.
 */
export function AccessConversationView({
  record,
  party,
  myName,
  onSend,
  onSetPrivate,
  onSetDialysisCanPost,
  attach,
  attachedUrl,
  sending,
  readOnlyReason,
  isEs = false,
  confirmSend,
}: {
  /** Runs before the send, e.g. the safety notice; it calls `send` when
   *  the member confirms, so a cancel keeps what they typed. */
  confirmSend?: (send: () => void) => void;
  record: AccessRecord;
  party: AccessParty;
  /** Set when this person's role may not post; shown instead of the
   *  composer, and they cannot change privacy either. */
  readOnlyReason?: string;
  myName: string;
  onSend: (body: string, isPrivate: boolean) => void;
  onSetPrivate: (messageId: string, isPrivate: boolean) => void;
  onSetDialysisCanPost: (allowed: boolean) => void;
  attach?: React.ReactNode;
  attachedUrl?: string;
  sending?: boolean;
  isEs?: boolean;
}) {
  const now = useNow();
  const [draft, setDraft] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const conversation = record.conversation;
  const count = conversation.messages.length;
  const manages = canManagePrivacy(party) && !readOnlyReason;
  const mayPost = canPost(conversation, party) && !readOnlyReason;
  const partyLabel = (p: AccessParty) =>
    p === "member" ? record.memberName : isEs ? PARTY_ES[p] : PARTY_LABEL[p];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [count]);

  const canSend = draft.trim().length > 0 || !!attachedUrl;

  function submit() {
    if (!canSend || sending || !mayPost) return;
    const body = draft;
    const priv = manages && isPrivate;
    const send = () => {
      onSend(body, priv);
      setDraft("");
      setIsPrivate(false);
    };
    if (confirmSend) confirmSend(send);
    else send();
  }

  return (
    <div className="flex flex-col gap-stack-md">
      {/* Who is in the conversation, so nobody writes thinking it is
          one-to-one. */}
      <div className="flex flex-wrap items-center gap-inline-sm text-caption text-fg-muted">
        <Users aria-hidden="true" className="size-4" />
        {(["member", "access", "dialysis"] as const).map((p) => (
          <Badge key={p} tone={p === party ? "info" : "neutral"}>
            {partyLabel(p)}
            {p === party ? (isEs ? " (tú)" : " (you)") : ""}
          </Badge>
        ))}
      </div>

      <div className="max-h-96 min-h-40 overflow-y-auto rounded-card-nested border border-line bg-surface p-inset-sm">
        {count === 0 ? (
          <p className="text-body-sm text-fg-muted">
            {isEs ? "Aún no hay mensajes." : "No messages yet."}
          </p>
        ) : (
          <ol className="space-y-stack-sm">
            {conversation.messages.map((message) => {
              const mine = message.author === party;
              const readable = canRead(message, party);
              const who = mine
                ? isEs
                  ? "Tú"
                  : "You"
                : message.author === "member"
                  ? message.authorName
                  : `${message.authorName} · ${partyLabel(message.author)}`;
              return (
                <li
                  key={message.id}
                  className={cn(
                    "flex flex-col",
                    mine ? "items-end" : "items-start",
                  )}
                >
                  {readable ? (
                    <div
                      className={cn(
                        "max-w-[85%] rounded-card px-inset-sm py-inset-xs",
                        mine
                          ? "bg-brand-600 text-white"
                          : "bg-surface-sunken text-fg",
                      )}
                    >
                      <p
                        className={cn(
                          "flex flex-wrap items-center gap-inline-xs text-caption",
                          mine ? "text-white/75" : "text-fg-muted",
                        )}
                      >
                        {message.private ? (
                          <Lock aria-hidden="true" className="size-3" />
                        ) : null}
                        <span>
                          {who} · {messaging.dayLabel(message.sentAt, now)}{" "}
                          {messaging.timeLabel(message.sentAt)}
                          {message.private
                            ? isEs
                              ? " · Privado"
                              : " · Private"
                            : ""}
                        </span>
                      </p>
                      {message.body ? (
                        <p className="mt-0.5 text-body-sm whitespace-pre-wrap">
                          {message.body}
                        </p>
                      ) : null}
                      {message.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- a data URL, nothing to optimise
                        <img
                          src={message.imageUrl}
                          alt={isEs ? "Foto adjunta" : "Attached photo"}
                          className="mt-stack-sm block max-h-56 w-full max-w-xs rounded-control object-cover"
                        />
                      ) : null}
                    </div>
                  ) : (
                    <p className="flex max-w-[85%] items-center gap-inline-xs rounded-card border border-dashed border-line px-inset-sm py-inset-xs text-caption text-fg-muted">
                      <Lock aria-hidden="true" className="size-3 shrink-0" />
                      {isEs
                        ? "Mensaje privado entre el paciente y el centro de acceso"
                        : "Private message between the patient and the access center"}{" "}
                      · {messaging.dayLabel(message.sentAt, now)}
                    </p>
                  )}
                  {manages && readable && message.author !== "dialysis" ? (
                    <button
                      type="button"
                      onClick={() => onSetPrivate(message.id, !message.private)}
                      className="mt-0.5 inline-flex min-h-8 cursor-pointer items-center gap-inline-xs rounded-control-small px-1 text-caption text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {message.private ? (
                        <LockOpen aria-hidden="true" className="size-3" />
                      ) : (
                        <Lock aria-hidden="true" className="size-3" />
                      )}
                      {message.private
                        ? isEs
                          ? "Compartir con el centro de diálisis"
                          : "Share with dialysis center"
                        : isEs
                          ? "Hacer privado"
                          : "Make private"}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
        <div ref={endRef} />
      </div>

      {manages ? (
        <SwitchRow
          checked={conversation.dialysisCanPost}
          onChange={onSetDialysisCanPost}
          title={
            isEs
              ? "El centro de diálisis puede escribir"
              : "Dialysis center can reply"
          }
          description={
            isEs
              ? "Siempre puede leer lo que no es privado."
              : "It can always read what is not private."
          }
        />
      ) : null}

      {mayPost ? (
        <>
          {attach}
          <form
            className="flex flex-col gap-stack-sm"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <Textarea
              rows={2}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder={
                isEs ? "Escribe tu mensaje..." : "Type your message..."
              }
              aria-label={isEs ? "Mensaje" : `Message as ${myName}`}
              className="resize-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-inline-md">
              {manages ? (
                <label className="flex cursor-pointer items-center gap-inline-sm text-body-sm text-fg-secondary">
                  <Switch
                    size="small"
                    checked={isPrivate}
                    onChange={setIsPrivate}
                    label={isEs ? "Mensaje privado" : "Private message"}
                  />
                  <span aria-hidden="true">
                    {isEs
                      ? "Privado (oculto al centro de diálisis)"
                      : "Private (hidden from the dialysis center)"}
                  </span>
                </label>
              ) : (
                <span />
              )}
              <Button
                type="submit"
                size="small"
                disabled={!canSend || sending}
                leadingIcon={<Send aria-hidden="true" />}
              >
                {isEs ? "Enviar" : "Send"}
              </Button>
            </div>
          </form>
        </>
      ) : (
        <Alert tone="info">
          {readOnlyReason ??
            (isEs
              ? "Solo lectura. El paciente o el centro de acceso pueden permitir que el centro de diálisis escriba."
              : "Read-only. The patient or the access center can let the dialysis center reply.")}
        </Alert>
      )}
    </div>
  );
}
