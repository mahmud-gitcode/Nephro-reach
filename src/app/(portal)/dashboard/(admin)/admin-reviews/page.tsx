"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  EmptyState,
  Skeleton,
  Tabs,
  Textarea,
} from "@/components/ui";
import { useReviewModeration } from "@/features/reviews/useReviews";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import {
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  Check,
  X,
} from "lucide-react";

/* Phase 12: the queue is the server's (GET /platform/content/reviews, platform
   content Manage). Approve and decline are its two decisions; a decline needs
   a reason, which the member sees. There is no API route to delete a review
   or to move it back to pending, so those two buttons are gone (recorded as
   a decision for the Lead/user); "Decline" still takes an approved review
   off the website. */
export default function AdminReviewsPage() {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "approved" | "declined"
  >("all");
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineFeedback, setDeclineFeedback] = useState<string>("");

  const {
    reviews,
    counts,
    isPending,
    error,
    refetch,
    hasMore,
    loadMore,
    isLoadingMore,
    approve,
    decline,
    isSaving,
    saveError,
    dismissSaveError,
  } = useReviewModeration(activeTab);

  /* Every one of these publishes or unpublishes something on the marketing
     site, so a failure that only reached the console would leave a moderator
     believing they had taken a review down. The Alert below says otherwise. */
  const handleAccept = (id: string) => {
    void approve(id).catch(() => {});
  };

  const handleStartDecline = (id: string) => {
    setDeclineId(id);
    setDeclineFeedback("");
  };

  const handleConfirmDecline = (id: string) => {
    if (!declineFeedback.trim()) return;
    void decline(id, declineFeedback)
      .then(() => {
        setDeclineId(null);
        setDeclineFeedback("");
      })
      .catch(() => {});
  };

  /* The server filters by tab; the counts are its totals. */
  const filtered = reviews;
  const totalCount = counts?.all ?? 0;
  const pendingCount = counts?.pending ?? 0;
  const approvedCount = counts?.approved ?? 0;
  const declinedCount = counts?.declined ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
      {/* Header - Simple & Clean */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading-3 font-bold tracking-tight text-fg sm:text-heading-2">
            {isEs ? "Moderación de Reseñas" : "Reviews Moderation"}
          </h1>
          <p className="mt-1 text-body-sm font-medium text-fg-muted sm:text-body-md">
            {isEs
              ? "Revise, apruebe o rechace reseñas para mostrarlas en el sitio web."
              : "Approve or decline member reviews to display on the public website."}
          </p>
        </div>

        {/* Status Count Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-1.5 text-caption font-bold text-fg-secondary shadow-control">
            {isEs ? "Total" : "Total"}: {totalCount}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-control border border-warning-line bg-warning-surface px-3 py-1.5 text-caption font-bold text-warning shadow-control">
            <Clock className="h-3.5 w-3.5" />
            {isEs ? "Pendientes" : "Pending"}: {pendingCount}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-control border border-success-line bg-success-surface px-3 py-1.5 text-caption font-bold text-success shadow-control">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isEs ? "Aprobadas" : "Approved"}: {approvedCount}
          </span>
        </div>
      </div>

      {/* Tabs — four separate tab stops became one, with arrow keys. The
          `as any` on setActiveTab is gone too: TabItem carries the union. */}
      <div className="overflow-x-auto">
        <Tabs
          items={[
            {
              id: "all",
              label: `${isEs ? "Todas" : "All"} (${totalCount})`,
            },
            {
              id: "pending",
              label: `${isEs ? "Pendientes" : "Pending"} (${pendingCount})`,
            },
            {
              id: "approved",
              label: `${isEs ? "Aprobadas" : "Approved"} (${approvedCount})`,
            },
            {
              id: "declined",
              label: `${isEs ? "Rechazadas" : "Declined"} (${declinedCount})`,
            },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          label={isEs ? "Filtrar rese\u00f1as" : "Filter reviews"}
        />
      </div>

      {saveError ? (
        <Alert
          tone="danger"
          title={isEs ? "El cambio no se guardó" : "That change was not saved"}
          onDismiss={dismissSaveError}
        >
          {saveError instanceof Error
            ? saveError.message
            : isEs
              ? "Inténtelo de nuevo."
              : "Please try again."}
        </Alert>
      ) : null}

      {/* Reviews List */}
      <AsyncSection
        pending={isPending}
        error={error}
        onRetry={canRetry(error) ? refetch : undefined}
        errorTitle={errorTitleFor(
          error,
          isEs ? "Las reseñas no se cargaron" : "The reviews did not load",
          isEs ? "es" : "en",
        )}
        errorMessage={errorMessageFor(error, undefined, isEs ? "es" : "en")}
        skeleton={
          <div className="space-y-4">
            <Skeleton height={160} />
            <Skeleton height={160} />
            <Skeleton height={160} />
          </div>
        }
      >
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<MessageSquare />}
              title={
                isEs
                  ? "No hay reseñas en esta categoría."
                  : "No reviews found in this category."
              }
            />
          ) : (
            filtered.map((rev) => (
              <div
                key={rev.id}
                className="rounded-card border border-line bg-surface p-6 transition-all hover:border-line-strong sm:p-6"
              >
                {/* Top Row: User details & Status Badge */}
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-body-md font-bold text-fg">
                        {rev.userName}
                      </h3>
                      <span className="rounded-control-small bg-primary-soft px-2.5 py-0.5 text-caption font-bold text-fg-brand">
                        {rev.role}
                      </span>
                      {rev.personalInfoDetected ? (
                        <Badge tone="warning">
                          {isEs
                            ? "Posibles datos personales"
                            : "Possible personal details"}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-caption font-medium text-fg-subtle">
                      {new Date(rev.createdAt).toLocaleDateString(
                        isEs ? "es-ES" : "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {rev.status === "approved" && (
                      <span className="inline-flex items-center gap-1.5 rounded-pill border border-transparent bg-success-surface px-3 py-1 text-caption font-bold text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isEs
                          ? "Aprobada (En sitio web)"
                          : "Approved (Live on site)"}
                      </span>
                    )}
                    {rev.status === "pending" && (
                      <span className="inline-flex items-center gap-1.5 rounded-pill border border-transparent bg-warning-surface px-3 py-1 text-caption font-bold text-warning">
                        <Clock className="h-3.5 w-3.5" />
                        {isEs ? "Pendiente de revisión" : "Pending Review"}
                      </span>
                    )}
                    {rev.status === "declined" && (
                      <span className="inline-flex items-center gap-1.5 rounded-pill border border-transparent bg-danger-surface px-3 py-1 text-caption font-bold text-danger">
                        <XCircle className="h-3.5 w-3.5" />
                        {isEs ? "Rechazada" : "Declined"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Star Rating */}
                <div className="mt-3 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${
                        rev.rating >= s
                          ? "fill-warning-500 text-warning-500"
                          : "fill-line-subtle text-line"
                      }`}
                    />
                  ))}
                  <span className="ml-1.5 text-caption font-bold text-fg-muted">
                    {rev.rating}.0
                  </span>
                </div>

                {/* Review Text */}
                <p className="mt-2.5 text-body-sm leading-relaxed font-medium text-fg-secondary sm:text-body-md">
                  &ldquo;{rev.comment}&rdquo;
                </p>

                {/* Existing Decline Feedback if any */}
                {rev.status === "declined" && rev.adminFeedback && (
                  <div className="mt-3 rounded-control border border-danger-line bg-danger-surface/70 p-inset-sm text-caption text-danger">
                    <span className="font-bold">
                      {isEs ? "Motivo del rechazo:" : "Decline Feedback:"}
                    </span>{" "}
                    {rev.adminFeedback}
                  </div>
                )}

                {/* Inline Decline Feedback Form */}
                {declineId === rev.id && (
                  <div className="mt-stack-lg space-y-stack-md rounded-control border border-line bg-surface-sunken p-inset-md">
                    <label
                      htmlFor={`decline-${rev.id}`}
                      className="block text-label-sm text-fg-secondary"
                    >
                      {isEs
                        ? "Motivo del rechazo (el miembro lo verá):"
                        : "Reason for the member (required):"}
                    </label>
                    <Textarea
                      id={`decline-${rev.id}`}
                      rows={2}
                      maxLength={1000}
                      value={declineFeedback}
                      onChange={(e) => setDeclineFeedback(e.target.value)}
                      placeholder={
                        isEs
                          ? "ej. Por favor actualice el mensaje sin incluir datos médicos personales..."
                          : "e.g. Please update your review without including private medical numbers..."
                      }
                    />
                    <div className="flex items-center justify-end gap-inline-md">
                      <Button
                        variant="neutral"
                        appearance="fill-stroke"
                        size="small"
                        onClick={() => setDeclineId(null)}
                      >
                        {isEs ? "Cancelar" : "Cancel"}
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        disabled={!declineFeedback.trim()}
                        loading={isSaving}
                        onClick={() => handleConfirmDecline(rev.id)}
                      >
                        {isEs ? "Confirmar Rechazo" : "Confirm Decline"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Buttons Bar */}
                <div className="mt-stack-lg flex items-center justify-between border-t border-line-subtle pt-inset-sm">
                  <div className="flex items-center gap-inline-md">
                    {rev.status !== "approved" && (
                      <Button size="small" onClick={() => handleAccept(rev.id)}>
                        <Check aria-hidden="true" />
                        {isEs ? "Aceptar (Publicar)" : "Accept (Publish)"}
                      </Button>
                    )}

                    {rev.status !== "declined" && declineId !== rev.id && (
                      <Button
                        variant="danger"
                        appearance="fill-stroke"
                        size="small"
                        onClick={() => handleStartDecline(rev.id)}
                      >
                        <X aria-hidden="true" />
                        {isEs ? "Rechazar..." : "Decline..."}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {hasMore ? (
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={loadMore}
              loading={isLoadingMore}
            >
              {isEs ? "Ver más" : "Load more"}
            </Button>
          ) : null}
        </div>
      </AsyncSection>
    </div>
  );
}
