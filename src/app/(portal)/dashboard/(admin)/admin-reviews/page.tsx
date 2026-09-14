"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Button, EmptyState, Tabs, Textarea } from "@/components/ui";
import {
  Review,
  getReviews,
  updateReviewStatus,
  deleteReview,
  REVIEWS_EVENT,
} from "@/features/reviews/reviews";
import {
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { useClientValue } from "@/lib/storage/useClientValue";

/* Stable empty array: useClientValue returns this before hydration, and a
   fresh [] each render would be a new reference every time. */
const NO_REVIEWS: Review[] = [];

export default function AdminReviewsPage() {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [reviews, , refresh] = useClientValue(getReviews, NO_REVIEWS);
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "approved" | "declined"
  >("all");
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineFeedback, setDeclineFeedback] = useState<string>("");

  /* The effect now only subscribes. The first read happens during render,
     via useClientValue, instead of in a second pass. */
  useEffect(() => {
    window.addEventListener(REVIEWS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(REVIEWS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const handleAccept = (id: string) => {
    updateReviewStatus(id, "approved");
  };

  const handleStartDecline = (id: string) => {
    setDeclineId(id);
    setDeclineFeedback("");
  };

  const handleConfirmDecline = (id: string) => {
    updateReviewStatus(id, "declined", declineFeedback);
    setDeclineId(null);
    setDeclineFeedback("");
  };

  const handleDelete = (id: string) => {
    if (confirm(isEs ? "¿Eliminar esta reseña?" : "Delete this review?")) {
      deleteReview(id);
    }
  };

  const filtered = reviews.filter((r) => {
    if (activeTab === "all") return true;
    return r.status === activeTab;
  });

  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const approvedCount = reviews.filter((r) => r.status === "approved").length;
  const declinedCount = reviews.filter((r) => r.status === "declined").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
      {/* Header - Simple & Clean */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {isEs ? "Moderación de Reseñas" : "Reviews Moderation"}
          </h1>
          <p className="mt-1 text-sm font-medium text-fg-muted sm:text-base">
            {isEs
              ? "Revise, apruebe o rechace reseñas para mostrarlas en el sitio web."
              : "Approve or decline member reviews to display on the public website."}
          </p>
        </div>

        {/* Status Count Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-bold text-fg-secondary shadow-control">
            {isEs ? "Total" : "Total"}: {reviews.length}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-control border border-warning-line bg-warning-surface px-3 py-1.5 text-xs font-bold text-warning shadow-control">
            <Clock className="h-3.5 w-3.5" />
            {isEs ? "Pendientes" : "Pending"}: {pendingCount}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-control border border-success-line bg-success-surface px-3 py-1.5 text-xs font-bold text-success shadow-control">
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
              label: `${isEs ? "Todas" : "All"} (${reviews.length})`,
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

      {/* Reviews List */}
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
              className="rounded-card border border-line bg-surface p-5 shadow-control transition-all hover:border-line-strong sm:p-6"
            >
              {/* Top Row: User details & Status Badge */}
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-fg">
                      {rev.userName}
                    </h3>
                    <span className="rounded-control-small bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-fg-brand">
                      {rev.role}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-fg-subtle">
                    {rev.userEmail} •{" "}
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
                    <span className="inline-flex items-center gap-1.5 rounded-pill border border-success-line bg-success-surface px-3 py-1 text-xs font-bold text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {isEs
                        ? "Aprobada (En sitio web)"
                        : "Approved (Live on site)"}
                    </span>
                  )}
                  {rev.status === "pending" && (
                    <span className="inline-flex items-center gap-1.5 rounded-pill border border-warning-line bg-warning-surface px-3 py-1 text-xs font-bold text-warning">
                      <Clock className="h-3.5 w-3.5" />
                      {isEs ? "Pendiente de revisión" : "Pending Review"}
                    </span>
                  )}
                  {rev.status === "declined" && (
                    <span className="inline-flex items-center gap-1.5 rounded-pill border border-danger-line bg-danger-surface px-3 py-1 text-xs font-bold text-danger">
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
                <span className="ml-1.5 text-xs font-bold text-fg-muted">
                  {rev.rating}.0
                </span>
              </div>

              {/* Review Text */}
              <p className="mt-2.5 text-sm leading-relaxed font-medium text-fg-secondary sm:text-base">
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
                      ? "Comentario o motivo de rechazo (opcional para el usuario):"
                      : "Reason or feedback for user (optional):"}
                  </label>
                  <Textarea
                    id={`decline-${rev.id}`}
                    rows={2}
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

                  {rev.status === "approved" && declineId !== rev.id && (
                    <Button
                      variant="neutral"
                      appearance="fill-stroke"
                      size="small"
                      onClick={() => updateReviewStatus(rev.id, "pending")}
                    >
                      {isEs ? "Mover a Pendiente" : "Unpublish"}
                    </Button>
                  )}
                </div>

                {/* title= is a tooltip, not a name. */}
                <Button
                  variant="danger"
                  appearance="stroke"
                  size="small"
                  className="px-inset-xs"
                  onClick={() => handleDelete(rev.id)}
                  aria-label={
                    isEs
                      ? `Eliminar reseña de ${rev.userName}`
                      : `Delete review by ${rev.userName}`
                  }
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
