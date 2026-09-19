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
  Skeleton,
  Tabs,
} from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";
import { useModerationQueue } from "@/features/community/useModerationQueue";
import {
  decidedItems,
  pendingItems,
  pendingCount,
} from "@/features/community/moderationQueue.rules";
import type { HeldItem } from "@/features/community/community.types";

/* ==========================================================================
   Community moderation
   --------------------------------------------------------------------------
   The queue behind the community board's auto-screen. Anything the screen
   would not publish lands here for a person to read, with the phrase that
   caught it shown beside it — a queue of "flagged: harassment" with no
   phrase is one nobody can audit or tune.

   Two tabs, not a single list: a moderator working the pending queue should
   not have yesterday's decisions scrolling past underneath it.
   ========================================================================== */

type QueueTab = "pending" | "decided";

function reasonBadge(item: HeldItem, isEs: boolean) {
  return item.reason === "harassment" ? (
    <Badge tone="danger">{isEs ? "Hostilidad" : "Hostility"}</Badge>
  ) : (
    <Badge tone="warning">{isEs ? "Médico" : "Medical"}</Badge>
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

  const {
    items,
    isPending,
    error,
    refetch,
    approve,
    reject,
    remove,
    isSaving,
    saveError,
    dismissSaveError,
  } = useModerationQueue();

  const [tab, setTab] = useState<QueueTab>("pending");

  const pending = pendingItems(items);
  const decided = decidedItems(items);
  const waiting = pendingCount(items);
  const shown = tab === "pending" ? pending : decided;

  return (
    <div className="space-y-stack-xl">
      <PageTitle href="/dashboard/admin-community" />

      <Alert
        tone="info"
        live={false}
        title={isEs ? "Qué llega aquí" : "What reaches this queue"}
      >
        {isEs
          ? "El tablero retiene automáticamente las respuestas y publicaciones que parecen hostiles hacia otro miembro. Solo su autor las ve hasta que alguien decide. Los mensajes con síntomas urgentes no llegan aquí: se rechazan de inmediato y se le indica al miembro llamar al 911."
          : "The board automatically holds replies and posts that read as hostile toward another member. Only their author can see them until someone decides. Messages about urgent symptoms never reach this queue — they are refused outright and the member is told to call 911."}
      </Alert>

      {saveError ? (
        <Alert
          tone="danger"
          title={
            isEs ? "No se guardó su decisión" : "Your decision did not save"
          }
          onDismiss={dismissSaveError}
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
        onRetry={refetch}
        errorTitle={
          isEs ? "La cola no se cargó" : "The moderation queue did not load"
        }
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
                  ? "Cuando el tablero retenga una respuesta, aparecerá aquí."
                  : "When the board holds a reply, it will appear here."
                : isEs
                  ? "Las respuestas que apruebe o rechace quedarán registradas aquí."
                  : "Replies you approve or reject are recorded here."
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
                <Badge tone="neutral">
                  {item.kind === "reply"
                    ? isEs
                      ? "Respuesta"
                      : "Reply"
                    : isEs
                      ? "Publicación"
                      : "Post"}
                </Badge>
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
              </p>

              {item.status === "pending" ? (
                <div className="flex flex-wrap items-center justify-end gap-inline-md">
                  <Button
                    variant="neutral"
                    appearance="stroke"
                    disabled={isSaving}
                    onClick={() => void reject(item.id)}
                  >
                    <X aria-hidden="true" />
                    {isEs ? "Rechazar" : "Reject"}
                  </Button>
                  <Button
                    disabled={isSaving}
                    onClick={() => void approve(item.id)}
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
                  </span>
                  <Button
                    variant="neutral"
                    appearance="stroke"
                    disabled={isSaving}
                    onClick={() => void remove(item.id)}
                    aria-label={
                      isEs
                        ? `Borrar el registro de ${item.author}`
                        : `Delete the record from ${item.author}`
                    }
                  >
                    <Trash2 aria-hidden="true" />
                    {isEs ? "Borrar registro" : "Delete record"}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </ul>
      </AsyncSection>
    </div>
  );
}
