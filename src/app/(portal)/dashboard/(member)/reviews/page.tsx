"use client";

import React, { useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useReviews } from "@/features/reviews/useReviews";
import { reviewsByAuthor } from "@/features/reviews/reviews.rules";
import {
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  Card,
  Chip,
  ChipGroup,
  EmptyState,
  FormField,
  Skeleton,
  Textarea,
} from "@/components/ui";

export default function UserReviewsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [role, setRole] = useState<string>("Dialysis Member");
  const [comment, setComment] = useState<string>("");
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const userEmail = user?.email || "user@nephroreach.com";
  const userName = user?.name || "Charles Xavier";

  const { reviews, isPending, error, refetch, submit, isSaving, saveError } =
    useReviews();
  /* One cache holds every review; this page shows only the member's own. */
  const myReviews = reviewsByAuthor(reviews, userEmail);

  const roleOptions = [
    {
      key: "Dialysis Member",
      label: isEs ? "Miembro en Diálisis" : "Dialysis Member",
    },
    {
      key: "Family Caregiver",
      label: isEs ? "Cuidador Familiar" : "Family Caregiver",
    },
    { key: "CKD Learner", label: isEs ? "Estudiante de ERC" : "CKD Learner" },
  ];

  /* The thank-you appears after the review is stored, and the box is only
     cleared then — losing what someone wrote because the save failed is the
     one outcome this form must not have. */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || isSaving) return;

    void submit({ userName, userEmail, rating, role, comment: comment.trim() })
      .then(() => {
        setComment("");
        setSubmittedMessage(
          isEs
            ? "¡Gracias! Su reseña ha sido enviada para moderación."
            : "Thank you! Your review has been submitted for moderation.",
        );
        setTimeout(() => setSubmittedMessage(null), 5000);
      })
      .catch(() => {});
  };

  return (
    <div className="mx-auto max-w-4xl space-y-stack-xl">
      <header>
        <h1 className="text-heading-1 text-fg">
          {isEs ? "Dejar una Reseña" : "Leave a Review"}
        </h1>
      </header>

      {saveError ? (
        <Alert
          tone="danger"
          title={isEs ? "No se envió" : "Your review was not sent"}
        >
          {saveError instanceof Error
            ? saveError.message
            : isEs
              ? "Inténtelo de nuevo."
              : "Please try again."}
        </Alert>
      ) : null}

      {submittedMessage ? (
        <Alert tone="success">{submittedMessage}</Alert>
      ) : null}

      <Card as="section" padding="big" className="space-y-stack-lg">
        <h2 className="text-heading-4 text-fg">
          {isEs ? "Escribir Reseña" : "Write a Review"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-stack-xl">
          {/* Star rating. A dedicated <Rating> component is still owed —
              these are toggles in a group, not actions. */}
          <fieldset>
            <legend className="text-overline text-fg-muted">
              {isEs ? "Calificación" : "Rating"}
            </legend>
            <div className="mt-stack-sm flex items-center gap-inline-xs">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    aria-pressed={rating >= star}
                    className="cursor-pointer rounded-control-small p-1 transition-transform duration-150 ease-standard hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors duration-150 ease-standard ${
                        isFilled
                          ? "fill-warning-400 text-warning-400"
                          : "fill-surface-sunken text-line-strong"
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-stack-sm text-metric-sm text-fg-secondary">
                {rating} / 5
              </span>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-stack-sm text-overline text-fg-muted">
              {isEs ? "Su Rol" : "Your Role"}
            </legend>
            <ChipGroup label={isEs ? "Su Rol" : "Your Role"}>
              {roleOptions.map((opt) => (
                <Chip
                  key={opt.key}
                  selected={role === opt.key}
                  onClick={() => setRole(opt.key)}
                >
                  {opt.label}
                </Chip>
              ))}
            </ChipGroup>
          </fieldset>

          <FormField label={isEs ? "Su Mensaje" : "Your Review"} required>
            {(props) => (
              <Textarea
                {...props}
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  isEs
                    ? "Escriba su experiencia aquí..."
                    : "Write your honest feedback or experience here..."
                }
              />
            )}
          </FormField>

          <div className="flex justify-end">
            <Button type="submit" disabled={!comment.trim()} loading={isSaving}>
              {isEs ? "Enviar Reseña" : "Submit Review"}
            </Button>
          </div>
        </form>
      </Card>

      <section className="space-y-stack-lg">
        <h2 className="text-heading-4 text-fg">
          {isEs ? "Mis Reseñas" : "My Reviews"}
        </h2>

        <AsyncSection
          pending={isPending}
          error={error}
          onRetry={refetch}
          errorTitle={
            isEs ? "Sus reseñas no se cargaron" : "Your reviews did not load"
          }
          skeleton={
            <div className="space-y-stack-md">
              <Skeleton height={120} />
              <Skeleton height={120} />
            </div>
          }
        >
          {myReviews.length === 0 ? (
            <EmptyState
              icon={<MessageSquare />}
              title={
                isEs
                  ? "Aún no ha enviado ninguna reseña."
                  : "You have not submitted any reviews yet."
              }
              description={
                isEs
                  ? "Sus reseñas aparecerán aquí después de enviarlas."
                  : "Reviews you submit will appear here."
              }
            />
          ) : (
            <div className="space-y-stack-md">
              {myReviews.map((rev) => (
                <Card key={rev.id} as="article">
                  <div className="flex flex-col gap-stack-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-inline-lg">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            aria-hidden="true"
                            className={`h-4 w-4 ${
                              rev.rating >= s
                                ? "fill-warning-400 text-warning-400"
                                : "fill-surface-sunken text-line"
                            }`}
                          />
                        ))}
                      </div>
                      <Badge tone="neutral">{rev.role}</Badge>
                    </div>

                    {rev.status === "approved" ? (
                      <Badge tone="success" icon={<CheckCircle2 />}>
                        {isEs ? "Aprobada y Publicada" : "Approved & Live"}
                      </Badge>
                    ) : rev.status === "pending" ? (
                      <Badge tone="warning" icon={<Clock />}>
                        {isEs ? "En Revisión" : "Pending Review"}
                      </Badge>
                    ) : (
                      <Badge tone="danger" icon={<XCircle />}>
                        {isEs ? "Rechazada" : "Declined"}
                      </Badge>
                    )}
                  </div>

                  <p className="mt-stack-md text-body-md text-fg-secondary">
                    {rev.comment}
                  </p>

                  <p className="mt-stack-md text-caption text-fg-muted">
                    {new Date(rev.createdAt).toLocaleDateString(
                      isEs ? "es-ES" : "en-US",
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  </p>

                  {rev.status === "declined" && rev.adminFeedback ? (
                    <Alert
                      tone="danger"
                      live={false}
                      icon={<AlertCircle />}
                      title={
                        isEs
                          ? "Comentario del Administrador:"
                          : "Admin Feedback:"
                      }
                      className="mt-stack-md"
                    >
                      {rev.adminFeedback}
                    </Alert>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </AsyncSection>
      </section>
    </div>
  );
}
