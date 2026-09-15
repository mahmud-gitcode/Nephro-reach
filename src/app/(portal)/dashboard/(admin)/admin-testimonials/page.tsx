"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  AsyncSection,
  Button,
  EmptyState,
  Modal,
  Skeleton,
  Tabs,
  Textarea,
  Badge,
  Card,
} from "@/components/ui";
import {
  useTestimonials,
  type Testimonial,
} from "@/features/testimonials/useTestimonials";
import VideoPlayerModal from "@/features/testimonials/VideoPlayerModal";
import {
  Video,
  CheckCircle2,
  Clock,
  XCircle,
  Play,
  Trash2,
  Check,
  X,
} from "lucide-react";
export default function AdminTestimonialsPage() {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const {
    testimonials,
    isPending,
    error,
    refetch,
    setStatus,
    remove,
    isSaving,
    saveError,
    dismissSaveError,
  } = useTestimonials();

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "approved" | "declined"
  >("all");
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineFeedback, setDeclineFeedback] = useState<string>("");
  const [previewTestimonial, setPreviewTestimonial] =
    useState<Testimonial | null>(null);

  /* Approving publishes someone's video. A failure that only reached the
     console would leave a moderator sure they had published it. */
  const handleApprove = (id: string) => {
    void setStatus(id, "approved").catch(() => {});
  };

  const handleStartDecline = (id: string) => {
    setDeclineId(id);
    setDeclineFeedback("");
  };

  const handleConfirmDecline = (id: string) => {
    void setStatus(id, "declined", declineFeedback)
      .then(() => {
        setDeclineId(null);
        setDeclineFeedback("");
      })
      .catch(() => {});
  };

  const handleDelete = () => {
    if (!pendingDeleteId) return;
    void remove(pendingDeleteId)
      .then(() => setPendingDeleteId(null))
      .catch(() => {});
  };

  const filtered = testimonials.filter((t) => {
    if (activeTab === "all") return true;
    return t.status === activeTab;
  });

  const pendingCount = testimonials.filter(
    (t) => t.status === "pending",
  ).length;
  const approvedCount = testimonials.filter(
    (t) => t.status === "approved",
  ).length;
  const declinedCount = testimonials.filter(
    (t) => t.status === "declined",
  ).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {isEs
              ? "Moderación de Testimonios en Video"
              : "'From Fear to Hope' Testimonials Moderation"}
          </h1>
          <p className="mt-1 text-sm font-medium text-fg-muted sm:text-base">
            {isEs
              ? "Revise, apruebe o rechace videos de testimonios enviados por miembros."
              : "Review, watch, and approve member video testimonials before publishing to the dashboard."}
          </p>
        </div>

        {/* Count Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-bold text-fg-secondary shadow-control">
            Total: {testimonials.length}
          </span>
          {pendingCount > 0 && (
            <span className="bg-warning-soft text-warning-fg inline-flex items-center gap-1.5 rounded-control border border-warning-line px-3 py-1.5 text-xs font-bold">
              <Clock className="size-3.5" />
              {pendingCount} {isEs ? "Pendientes" : "Pending"}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        label={isEs ? "Pestañas de moderación" : "Moderation tabs"}
        value={activeTab}
        onChange={(v) => setActiveTab(v as typeof activeTab)}
        items={[
          {
            id: "all",
            label: isEs
              ? `Todos (${testimonials.length})`
              : `All (${testimonials.length})`,
          },
          {
            id: "pending",
            label: isEs
              ? `Pendientes (${pendingCount})`
              : `Pending Approval (${pendingCount})`,
          },
          {
            id: "approved",
            label: isEs
              ? `Publicados (${approvedCount})`
              : `Published / Approved (${approvedCount})`,
          },
          {
            id: "declined",
            label: isEs
              ? `Rechazados (${declinedCount})`
              : `Declined (${declinedCount})`,
          },
        ]}
      />

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

      {/* List of Testimonials */}
      <AsyncSection
        pending={isPending}
        error={error}
        onRetry={refetch}
        errorTitle={
          isEs
            ? "Los testimonios no se cargaron"
            : "The testimonials did not load"
        }
        skeleton={
          <div className="space-y-4">
            <Skeleton height={180} />
            <Skeleton height={180} />
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Video className="size-8 text-fg-muted" />}
            title={isEs ? "No hay testimonios" : "No testimonials found"}
            description={
              activeTab === "pending"
                ? isEs
                  ? "No hay testimonios en video pendientes de aprobación."
                  : "All submitted video testimonials have been reviewed."
                : isEs
                  ? "No hay testimonios en este estado."
                  : "No testimonials in this category."
            }
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => {
              const isPending = item.status === "pending";
              const isApproved = item.status === "approved";
              const isDeclined = item.status === "declined";

              return (
                <Card
                  key={item.id}
                  padding="big"
                  className="hover:border-line-hover transition-all"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    {/* Left: Video thumbnail preview & Info */}
                    <div className="flex flex-1 flex-col gap-4 sm:flex-row">
                      {/* Thumbnail preview button */}
                      <button
                        type="button"
                        onClick={() => setPreviewTestimonial(item)}
                        className="group relative h-28 w-full shrink-0 cursor-pointer overflow-hidden rounded-panel bg-surface-inverse shadow-xs sm:w-44"
                      >
                        {/* next/image needs every remote host declared up front, and a
                            testimonial thumbnail URL is whatever the member
                            submitted. See components/icons/LocalSvg for the
                            same trade in the other direction. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            item.thumbnailUrl ||
                            "/images/user-dashboard/testimonial.jpg"
                          }
                          alt=""
                          className="h-full w-full object-cover opacity-90 transition-transform duration-200 group-hover:scale-105"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/25">
                          <span className="flex size-10 items-center justify-center rounded-pill bg-white/90 text-brand-700 shadow-md">
                            <Play className="ml-0.5 size-5 fill-current" />
                          </span>
                        </span>
                        {item.duration && (
                          <span className="absolute right-1.5 bottom-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
                            {item.duration}
                          </span>
                        )}
                      </button>

                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-fg sm:text-lg">
                            {item.title}
                          </h3>
                          {isPending && (
                            <Badge
                              tone="warning"
                              variant="soft"
                              className="gap-1"
                            >
                              <Clock className="size-3" />
                              {isEs ? "Pendiente" : "Pending Approval"}
                            </Badge>
                          )}
                          {isApproved && (
                            <Badge
                              tone="success"
                              variant="soft"
                              className="gap-1"
                            >
                              <CheckCircle2 className="size-3" />
                              {isEs ? "Publicado" : "Approved & Live"}
                            </Badge>
                          )}
                          {isDeclined && (
                            <Badge
                              tone="danger"
                              variant="soft"
                              className="gap-1"
                            >
                              <XCircle className="size-3" />
                              {isEs ? "Rechazado" : "Declined"}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 text-xs text-fg-muted">
                          <span className="font-semibold text-fg-secondary">
                            {item.memberName}
                          </span>
                          <span>•</span>
                          <span>{item.role}</span>
                          <span>•</span>
                          <span>{item.memberEmail}</span>
                          <span>•</span>
                          <span>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="line-clamp-3 text-body-sm text-fg-secondary italic">
                          &ldquo;{item.summary}&rdquo;
                        </p>

                        {item.adminFeedback && isDeclined && (
                          <div className="rounded-control bg-danger-soft p-2 text-xs text-danger-fg">
                            <strong>Admin Feedback:</strong>{" "}
                            {item.adminFeedback}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                      <Button
                        size="small"
                        variant="neutral"
                        appearance="fill-stroke"
                        leadingIcon={<Play className="size-3.5" />}
                        onClick={() => setPreviewTestimonial(item)}
                      >
                        {isEs ? "Ver Video" : "Watch Video"}
                      </Button>

                      {isPending && (
                        <>
                          <Button
                            size="small"
                            variant="primary"
                            leadingIcon={<Check className="size-3.5" />}
                            onClick={() => handleApprove(item.id)}
                          >
                            {isEs ? "Aprobar y Publicar" : "Approve & Publish"}
                          </Button>
                          <Button
                            size="small"
                            variant="danger"
                            appearance="fill-stroke"
                            leadingIcon={<X className="size-3.5" />}
                            onClick={() => handleStartDecline(item.id)}
                          >
                            {isEs ? "Rechazar" : "Decline"}
                          </Button>
                        </>
                      )}

                      {isApproved && (
                        <Button
                          size="small"
                          variant="neutral"
                          appearance="stroke"
                          onClick={() => void setStatus(item.id, "pending")}
                        >
                          {isEs ? "Retirar a Pendiente" : "Unpublish"}
                        </Button>
                      )}

                      {isDeclined && (
                        <Button
                          size="small"
                          variant="primary"
                          appearance="fill-stroke"
                          onClick={() => handleApprove(item.id)}
                        >
                          {isEs ? "Reconsiderar y Aprobar" : "Re-approve"}
                        </Button>
                      )}

                      <Button
                        size="small"
                        variant="danger"
                        appearance="stroke"
                        iconOnly
                        onClick={() => setPendingDeleteId(item.id)}
                        title={isEs ? "Eliminar" : "Delete"}
                        aria-label="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Decline modal / box */}
                  {declineId === item.id && (
                    <div className="mt-4 space-y-3 rounded-panel border border-danger-line bg-surface-sunken p-4">
                      <p className="text-sm font-semibold text-fg">
                        {isEs
                          ? "Proporcione retroalimentación para el rechazo (opcional):"
                          : "Reason for declining (optional private feedback for member):"}
                      </p>
                      <Textarea
                        rows={2}
                        value={declineFeedback}
                        onChange={(e) => setDeclineFeedback(e.target.value)}
                        placeholder={
                          isEs
                            ? "Ej: El video no tiene audio claro..."
                            : "E.g. The video audio was difficult to hear..."
                        }
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="small"
                          variant="neutral"
                          appearance="fill-stroke"
                          onClick={() => setDeclineId(null)}
                        >
                          {isEs ? "Cancelar" : "Cancel"}
                        </Button>
                        <Button
                          size="small"
                          variant="danger"
                          onClick={() => handleConfirmDecline(item.id)}
                        >
                          {isEs ? "Confirmar Rechazo" : "Confirm Decline"}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </AsyncSection>

      {/* window.confirm blocks the page and leaves a failed delete nowhere
          to report itself. */}
      <Modal
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        size="small"
        title={isEs ? "Eliminar testimonio" : "Delete testimonial"}
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setPendingDeleteId(null)}
              disabled={isSaving}
            >
              {isEs ? "Cancelar" : "Cancel"}
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={isSaving}>
              {isEs ? "Eliminar" : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-body-md text-fg-secondary">
          {isEs
            ? "Este testimonio en video se eliminará de forma permanente."
            : "This video testimonial will be permanently removed."}
        </p>
      </Modal>

      {/* Video Preview Modal */}
      <VideoPlayerModal
        testimonial={previewTestimonial}
        open={Boolean(previewTestimonial)}
        onClose={() => setPreviewTestimonial(null)}
      />
    </div>
  );
}
