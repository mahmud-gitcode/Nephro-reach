"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Review,
  getUserReviews,
  submitReview,
  REVIEWS_EVENT,
} from "@/lib/reviews";
import {
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export default function UserReviewsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [role, setRole] = useState<string>("Dialysis Member");
  const [comment, setComment] = useState<string>("");
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const userEmail = user?.email || "user@nephroreach.com";
  const userName = user?.name || "Charles Xavier";

  const roleOptions = [
    { key: "Dialysis Member", label: isEs ? "Miembro en Diálisis" : "Dialysis Member" },
    { key: "Family Caregiver", label: isEs ? "Cuidador Familiar" : "Family Caregiver" },
    { key: "CKD Learner", label: isEs ? "Estudiante de ERC" : "CKD Learner" },
  ];

  const loadUserReviews = () => {
    const list = getUserReviews(userEmail);
    setMyReviews(list);
  };

  useEffect(() => {
    loadUserReviews();

    const handleReviewsChange = () => {
      loadUserReviews();
    };

    window.addEventListener(REVIEWS_EVENT, handleReviewsChange);
    window.addEventListener("storage", handleReviewsChange);
    return () => {
      window.removeEventListener(REVIEWS_EVENT, handleReviewsChange);
      window.removeEventListener("storage", handleReviewsChange);
    };
  }, [userEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    submitReview({
      userName,
      userEmail,
      rating,
      role,
      comment: comment.trim(),
    });

    setComment("");
    setSubmittedMessage(
      isEs
        ? "¡Gracias! Su reseña ha sido enviada para moderación."
        : "Thank you! Your review has been submitted for moderation."
    );

    setTimeout(() => {
      setSubmittedMessage(null);
    }, 5000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
      {/* Header - Simple & Clean */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {isEs ? "Dejar una Reseña" : "Leave a Review"}
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-600 sm:text-base">
          {isEs
            ? "Comparta su experiencia con NephroReach."
            : "Share your experience with NephroReach."}
        </p>
      </div>

      {/* Success Banner */}
      {submittedMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm font-semibold">{submittedMessage}</p>
        </div>
      )}

      {/* Review Submission Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
          {isEs ? "Escribir Reseña" : "Write a Review"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Star Rating */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              {isEs ? "Calificación" : "Rating"}
            </label>
            <div className="mt-2 flex items-center gap-1.5">
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
                    className="p-1 transition-transform hover:scale-110 cursor-pointer focus:outline-hidden"
                  >
                    <Star
                      className={`h-8 w-8 sm:h-9 sm:w-9 ${
                        isFilled
                          ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                          : "fill-slate-100 text-slate-300"
                      } transition-colors`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-sm font-bold text-slate-700">
                {rating} / 5
              </span>
            </div>
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              {isEs ? "Su Rol" : "Your Role"}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {roleOptions.map((opt) => {
                const active = role === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setRole(opt.key)}
                    className={`rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      active
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review text */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              {isEs ? "Su Mensaje" : "Your Review"}
            </label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isEs
                  ? "Escriba su experiencia aquí..."
                  : "Write your honest feedback or experience here..."
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!comment.trim()}
              className="flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-xs transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
            >
              {isEs ? "Enviar Reseña" : "Submit Review"}
            </button>
          </div>
        </form>
      </section>

      {/* My Submitted Reviews */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
          {isEs ? "Mis Reseñas" : "My Reviews"}
        </h2>

        {myReviews.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-xs">
            <MessageSquare className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-medium">
              {isEs
                ? "Aún no ha enviado ninguna reseña."
                : "You have not submitted any reviews yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {myReviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {/* Stars + Role */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            rev.rating >= s
                              ? "fill-amber-400 text-amber-400"
                              : "fill-slate-100 text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                      {rev.role}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {rev.status === "approved" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isEs ? "Aprobada y Publicada" : "Approved & Live"}
                      </span>
                    )}
                    {rev.status === "pending" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                        <Clock className="h-3.5 w-3.5" />
                        {isEs ? "En Revisión" : "Pending Review"}
                      </span>
                    )}
                    {rev.status === "declined" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
                        <XCircle className="h-3.5 w-3.5" />
                        {isEs ? "Rechazada" : "Declined"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Comment */}
                <p className="mt-3 text-sm leading-relaxed text-slate-800 font-medium">
                  {rev.comment}
                </p>

                {/* Date */}
                <p className="mt-3 text-xs font-medium text-slate-400">
                  {new Date(rev.createdAt).toLocaleDateString(
                    isEs ? "es-ES" : "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </p>

                {/* Admin Feedback Callout (if declined) */}
                {rev.status === "declined" && rev.adminFeedback && (
                  <div className="mt-3.5 rounded-xl border border-rose-200 bg-rose-50/60 p-3.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                      <div>
                        <p className="text-xs font-bold text-rose-900">
                          {isEs ? "Comentario del Administrador:" : "Admin Feedback:"}
                        </p>
                        <p className="mt-0.5 text-xs text-rose-700 leading-relaxed font-medium">
                          {rev.adminFeedback}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
