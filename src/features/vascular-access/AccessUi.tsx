"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleDot, Clock3, MapPin, Send } from "lucide-react";
import {
  Badge,
  Button,
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
  TEAM_LABEL,
  dayParts,
  formatDay,
  formatTime,
  type AccessAppointment,
  type AccessHistoryEntry,
  type AccessMessage,
  type AccessStatus,
  type AccessThread,
  type AccessUpdate,
  type UpdateKind,
} from "./vascularAccess.data";

/* ==========================================================================
   Pieces both portals draw the same way
   ========================================================================== */

export const accessStatusTone: Record<AccessStatus, BadgeTone> = {
  "Working Well": "success",
  "Needs Review": "warning",
  "Problem Reported": "danger",
};

const STATUS_ES: Record<AccessStatus, string> = {
  "Working Well": "Funciona bien",
  "Needs Review": "Requiere revisión",
  "Problem Reported": "Problema reportado",
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

/**
 * One access thread: the messages, then a composer.
 *
 * `me` decides which bubbles are ours. `attach` is an optional slot above
 * the composer (the member's photo picker); `attachedUrl` is what it chose.
 */
export function ThreadView({
  thread,
  me,
  onSend,
  attach,
  attachedUrl,
  sending,
  isEs = false,
}: {
  thread: AccessThread;
  me: AccessMessage["author"];
  onSend: (body: string) => void;
  attach?: React.ReactNode;
  attachedUrl?: string;
  sending?: boolean;
  isEs?: boolean;
}) {
  const now = useNow();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const count = thread.messages.length;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [count]);

  const canSend = draft.trim().length > 0 || !!attachedUrl;
  const other = me === "member" ? thread.contact : "Patient";

  function submit() {
    if (!canSend || sending) return;
    onSend(draft);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-stack-md">
      <div className="max-h-96 min-h-40 overflow-y-auto rounded-control border border-line bg-surface p-inset-sm">
        {count === 0 ? (
          <p className="text-body-sm text-fg-muted">
            {isEs ? "Aún no hay mensajes." : "No messages yet."}
          </p>
        ) : (
          <ol className="space-y-stack-sm">
            {thread.messages.map((message) => {
              const mine = message.author === me;
              return (
                <li
                  key={message.id}
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
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
                        "text-caption",
                        mine ? "text-white/75" : "text-fg-muted",
                      )}
                    >
                      {mine ? (isEs ? "Tú" : "You") : other} ·{" "}
                      {messaging.dayLabel(message.sentAt, now)}{" "}
                      {messaging.timeLabel(message.sentAt)}
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
                </li>
              );
            })}
          </ol>
        )}
        <div ref={endRef} />
      </div>

      {attach}

      <form
        className="flex items-end gap-inline-md"
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
          placeholder={isEs ? "Escribe tu mensaje..." : "Type your message..."}
          aria-label={`${isEs ? "Mensaje para" : "Message"} ${me === "member" ? TEAM_LABEL[thread.team] : other}`}
          className="flex-1 resize-none"
        />
        <Button type="submit" size="small" disabled={!canSend || sending}>
          <Send aria-hidden="true" />
          {isEs ? "Enviar" : "Send"}
        </Button>
      </form>
    </div>
  );
}
