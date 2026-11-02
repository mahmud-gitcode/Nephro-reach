"use client";

import React, { useState } from "react";
import {
  Check,
  Clock,
  MessageSquare,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Modal,
  Skeleton,
  Tabs,
  Textarea,
} from "@/components/ui";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { PageTitle } from "@/components/layout/PageTitle";
import { useAuth } from "@/features/auth/AuthContext";
import { MODERATION_HOURS } from "@/features/community/moderation";
import { useModerationQueue } from "@/features/community/useModerationQueue";
import {
  pendingItems,
  urgentPendingCount,
} from "@/features/community/moderationQueue.rules";
import type { HeldItem } from "@/features/community/community.types";
import { collabText } from "@/features/community/collabText";

/* ==========================================================================
   Community moderation
   --------------------------------------------------------------------------
   The queue behind the community board's auto-screen. Anything the screen
   would not publish lands here for a person to read, with the phrase that
   caught it shown beside it — a queue of "flagged: harassment" with no
   phrase is one nobody can audit or tune.

   Two tabs, not a single list: a moderator working the pending queue should
   not have yesterday's decisions scrolling past underneath it.

   Phase 12: the queue is the server's (platform content, Manage). It records
   who decided (an id, so the screen says "you" or "a moderator") and the
   note. A rejection needs a reason (the server requires one; it is kept as
   the decision note). A decided record is the audit trail and there is no
   API route to delete one (D52), so "Delete record" is shown but disabled,
   with a "not available yet" note, until the Lead/user decide.
   ========================================================================== */

type QueueTab = "pending" | "decided";

/* Level first, because it is what decides the order of the work. */
function levelBadge(item: HeldItem, isEs: boolean) {
  if (item.level === 1) {
    return (
      <Badge tone="danger" variant="solid">
        {isEs ? "Nivel 1 · Urgente" : "Level 1 · Urgent"}
      </Badge>
    );
  }
  if (item.level === 2) {
    return (
      <Badge tone="warning">
        {isEs ? "Nivel 2 · Revisar" : "Level 2 · Review"}
      </Badge>
    );
  }
  if (item.level === 3) {
    return (
      <Badge tone="neutral">
        {isEs ? "Nivel 3 · Comunidad" : "Level 3 · Community"}
      </Badge>
    );
  }
  return (
    <Badge tone="info">
      {isEs ? "Aprobación de rutina" : "Routine approval"}
    </Badge>
  );
}

const CATEGORY_LABEL: Record<HeldItem["reason"], { en: string; es: string }> = {
  emergency: { en: "Possible emergency", es: "Posible emergencia" },
  crisis: { en: "Mental health / safety", es: "Salud mental / seguridad" },
  access: { en: "Dialysis access", es: "Acceso de diálisis" },
  symptom: { en: "Symptoms", es: "Síntomas" },
  "medical-advice": { en: "Medical advice", es: "Consejo médico" },
  conduct: { en: "Conduct", es: "Conducta" },
  scam: { en: "Scam / money", es: "Estafa / dinero" },
  privacy: { en: "Personal information", es: "Datos personales" },
  routine: { en: "New post", es: "Publicación nueva" },
};

function reasonBadge(item: HeldItem, isEs: boolean) {
  const label = CATEGORY_LABEL[item.reason];
  return (
    <Badge tone="neutral" variant="outline">
      {isEs ? label.es : label.en}
    </Badge>
  );
}

function statusBadge(item: HeldItem, isEs: boolean) {
  if (item.status === "approved") {
    return <Badge tone="success">{isEs ? "Aprobada" : "Approved"}</Badge>;
  }
  if (item.status === "rejected") {
    return <Badge tone="danger">{isEs ? "Rechazada" : "Rejected"}</Badge>;
  }
  return <Badge tone="warning">{isEs ? "Pendiente" : "Pending"}</Badge>;
}

function formatWhen(iso: string, isEs: boolean): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(isEs ? "es-ES" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminCommunityPage() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { user } = useAuth();
  const notAvailable = collabText(isEs, "notAvailable.communityRecord");

  const [tab, setTab] = useState<QueueTab>("pending");
  /* The pending page is always read: its count and its level 1 alarm show
     on both tabs. */
  const pendingQueue = useModerationQueue("pending");
  const decidedQueue = useModerationQueue("decided");
  const active = tab === "pending" ? pendingQueue : decidedQueue;
  const { isPending, error, refetch, saveError, dismissSaveError } = active;
  const { approve, reject } = pendingQueue;

  const [rejecting, setRejecting] = useState<HeldItem | null>(null);
  const [reason, setReason] = useState("");

  const pending = pendingItems(pendingQueue.items);
  const waiting = pendingQueue.total ?? pending.length;
  const urgent = urgentPendingCount(pendingQueue.items);
  const shown = tab === "pending" ? pending : decidedQueue.items;

  const whoDecided = (item: HeldItem) =>
    item.decidedById && item.decidedById === user?.id
      ? isEs
        ? "usted"
        : "you"
      : isEs
        ? "un moderador"
        : "a moderator";

  const confirmReject = () => {
    if (!rejecting || !reason.trim()) return;
    void reject(rejecting.id, reason)
      .then(() => {
        setRejecting(null);
        setReason("");
      })
      .catch(() => {});
  };

  return (
    <div className="space-y-stack-xl">
      <PageTitle href="/dashboard/admin-community" />

      {/* Loud, and above everything. A level 1 sitting unread is the one
          failure state of this screen. */}
      {urgent > 0 ? (
        <Alert
          tone="danger"
          title={
            isEs
              ? `${urgent} mensaje(s) de nivel 1 esperando`
              : `${urgent} level 1 message(s) waiting`
          }
        >
          {isEs
            ? "Estos describen una posible emergencia o una crisis de salud mental. Ya se le mostró al miembro la guía del 911 y del 988; léelos primero."
            : "These describe a possible emergency or a mental health crisis. The member has already been shown 911 and 988 guidance — read these first."}
        </Alert>
      ) : null}

      <Alert
        tone="info"
        live={false}
        title={isEs ? "Qué llega aquí" : "What reaches this queue"}
      >
        {isEs
          ? `El tablero retiene todo lo que marca el filtro, en tres niveles: 1 posible emergencia o crisis, 2 inquietud para el equipo de atención, 3 conducta, estafas o datos personales. Solo su autor lo ve hasta que alguien decide. Al miembro ya se le respondió según el nivel. ${MODERATION_HOURS.es}`
          : `The board holds everything the screen catches, at three levels: 1 possible emergency or crisis, 2 a care-team concern, 3 conduct, scams or personal information. Only the author can see it until someone decides. The member has already been answered according to the level. ${MODERATION_HOURS.en}`}
      </Alert>

      {(saveError ?? pendingQueue.saveError) ? (
        <Alert
          tone="danger"
          title={
            isEs ? "No se guardó su decisión" : "Your decision did not save"
          }
          onDismiss={() => {
            dismissSaveError();
            pendingQueue.dismissSaveError();
          }}
        >
          {isEs
            ? "Inténtelo de nuevo. El elemento sigue pendiente."
            : "Please try again. The item is still pending."}
        </Alert>
      ) : null}

      <Tabs<QueueTab>
        label={isEs ? "Estado de la cola" : "Queue status"}
        value={tab}
        onChange={setTab}
        items={[
          {
            id: "pending",
            label: `${isEs ? "Pendientes" : "Pending"}${
              waiting > 0 ? ` (${waiting})` : ""
            }`,
            icon: <Clock aria-hidden="true" />,
          },
          {
            id: "decided",
            label: isEs ? "Decididas" : "Decided",
            icon: <ShieldAlert aria-hidden="true" />,
          },
        ]}
      />

      <AsyncSection
        pending={isPending}
        error={error}
        onRetry={canRetry(error) ? refetch : undefined}
        errorTitle={errorTitleFor(
          error,
          isEs ? "La cola no se cargó" : "The moderation queue did not load",
          isEs ? "es" : "en",
        )}
        errorMessage={errorMessageFor(error, undefined, isEs ? "es" : "en")}
        isEmpty={shown.length === 0}
        empty={
          <EmptyState
            icon={<MessageSquare aria-hidden="true" />}
            title={
              tab === "pending"
                ? isEs
                  ? "Nada esperando revisión"
                  : "Nothing waiting for review"
                : isEs
                  ? "Aún no hay decisiones"
                  : "No decisions yet"
            }
            description={
              tab === "pending"
                ? isEs
                  ? "Cuando el tablero retenga una publicación, aparecerá aquí."
                  : "When the board holds a post, it will appear here."
                : isEs
                  ? "Las publicaciones que apruebe o rechace quedarán registradas aquí."
                  : "Posts you approve or reject are recorded here."
            }
          />
        }
        skeleton={
          <div className="space-y-stack-md">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} height={150} />
            ))}
          </div>
        }
      >
        <ul className="space-y-stack-md">
          {shown.map((item) => (
            <Card as="li" key={item.id} className="space-y-stack-md">
              <div className="flex flex-wrap items-center gap-inline-sm">
                <span className="text-label-lg text-fg">{item.author}</span>
                <Badge tone="neutral">{isEs ? "Publicación" : "Post"}</Badge>
                {levelBadge(item, isEs)}
                {reasonBadge(item, isEs)}
                {statusBadge(item, isEs)}
                <span className="ml-auto text-caption text-fg-muted">
                  {formatWhen(item.submittedAt, isEs)}
                </span>
              </div>

              {/* The text verbatim. A moderator deciding on abuse has to be
                  able to read exactly what was written. */}
              <blockquote className="rounded-card border border-line bg-surface-sunken p-inset-md text-body-md text-fg-secondary">
                {item.content}
              </blockquote>

              <p className="text-caption text-fg-muted">
                {isEs ? "Frase detectada: " : "Matched phrase: "}
                <code className="text-fg">{item.matchedPhrase}</code>
                {/* Said out loud, because a moderator seeing "Level 2" on
                    a chest-pain phrase needs to know why it is not a 1. */}
                {item.softenedByContext ? (
                  <span className="ml-inline-sm">
                    {isEs
                      ? "· bajado a nivel 2: el texto habla del pasado"
                      : "· eased to level 2: the wording refers to the past"}
                  </span>
                ) : null}
              </p>

              {item.status === "pending" ? (
                <div className="flex flex-wrap items-center justify-end gap-inline-md">
                  <Button
                    variant="neutral"
                    appearance="stroke"
                    disabled={pendingQueue.isSaving}
                    onClick={() => {
                      setReason("");
                      setRejecting(item);
                    }}
                  >
                    <X aria-hidden="true" />
                    {isEs ? "Rechazar" : "Reject"}
                  </Button>
                  <Button
                    disabled={pendingQueue.isSaving}
                    onClick={() => void approve(item.id).catch(() => {})}
                  >
                    <Check aria-hidden="true" />
                    {isEs ? "Aprobar y publicar" : "Approve and publish"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-inline-md">
                  <span className="text-caption text-fg-muted">
                    {isEs ? "Decidida el " : "Decided "}
                    {item.decidedAt ? formatWhen(item.decidedAt, isEs) : "—"}
                    {` · ${whoDecided(item)}`}
                    {item.decisionNote ? ` · ${item.decisionNote}` : ""}
                  </span>
                  {/* D52: no API route yet. Shown, disabled, explained; it
                      has no handler and changes nothing. */}
                  <Button
                    variant="neutral"
                    appearance="stroke"
                    disabled
                    title={notAvailable}
                    aria-describedby={`record-na-${item.id}`}
                    aria-label={
                      isEs
                        ? `Borrar el registro de ${item.author}`
                        : `Delete the record from ${item.author}`
                    }
                  >
                    <Trash2 aria-hidden="true" />
                    {isEs ? "Borrar registro" : "Delete record"}
                  </Button>
                  <p
                    id={`record-na-${item.id}`}
                    className="w-full text-caption text-fg-muted"
                  >
                    {notAvailable}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </ul>
        {active.hasMore ? (
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={active.loadMore}
            loading={active.isLoadingMore}
          >
            {isEs ? "Ver más" : "Load more"}
          </Button>
        ) : null}
      </AsyncSection>

      {/* The server keeps the reason as the decision note. */}
      <Modal
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        size="small"
        title={isEs ? "Rechazar publicación" : "Reject post"}
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setRejecting(null)}
              disabled={pendingQueue.isSaving}
            >
              {isEs ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              variant="danger"
              onClick={confirmReject}
              disabled={!reason.trim()}
              loading={pendingQueue.isSaving}
            >
              {isEs ? "Rechazar" : "Reject"}
            </Button>
          </>
        }
      >
        <FormField
          label={isEs ? "Motivo del rechazo" : "Reason for rejecting"}
          required
        >
          {(field) => (
            <Textarea
              {...field}
              rows={3}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
        </FormField>
      </Modal>
    </div>
  );
}
