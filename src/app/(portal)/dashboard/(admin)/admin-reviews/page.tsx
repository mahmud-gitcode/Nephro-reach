"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
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
  AlertCircle,
  Send,
} from "lucide-react";

export default function AdminReviewsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "declined">("all");
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineFeedback, setDeclineFeedback] = useState<string>("");

  const loadAllReviews = () => {
    setReviews(getReviews());
  };

  useEffect(() => {
    loadAllReviews();

    const handleReviewsChange = () => {
      loadAllReviews();
    };

    window.addEventListener(REVIEWS_EVENT, handleReviewsChange);
    window.addEventListener("storage", handleReviewsChange);
    return () => {
      window.removeEventListener(REVIEWS_EVENT, handleReviewsChange);
      window.removeEventListener("storage", handleReviewsChange);
    };
  }, []);

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {isEs ? "Moderación de Reseñas" : "Reviews Moderation"}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600 sm:text-base">
            {isEs
              ? "Revise, apruebe o rechace reseñas para mostrarlas en el sitio web."
              : "Approve or decline member reviews to display on the public website."}
          </p>
        </div>

        {/* Status Count Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs">
            {isEs ? "Total" : "Total"}: {reviews.length}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-2xs">
            <Clock className="h-3.5 w-3.5" />
            {isEs ? "Pendientes" : "Pending"}: {pendingCount}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isEs ? "Aprobadas" : "Approved"}: {approvedCount}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto no-scrollbar">
        {[
          { key: "all", label: isEs ? "Todas" : "All", count: reviews.length },
          { key: "pending", label: isEs ? "Pendientes" : "Pending", count: pendingCount },
          { key: "approved", label: isEs ? "Aprobadas" : "Approved", count: approvedCount },
          { key: "declined", label: isEs ? "Rechazadas" : "Declined", count: declinedCount },
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  active ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xs">
            <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold">
              {isEs ? "No hay reseñas en esta categoría." : "No reviews found in this category."}
            </p>
          </div>
        ) : (
          filtered.map((rev) => (
            <div
              key={rev.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-slate-300"
            >
              {/* Top Row: User details & Status Badge */}
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900">{rev.userName}</h3>
                    <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                      {rev.role}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    {rev.userEmail} •{" "}
                    {new Date(rev.createdAt).toLocaleDateString(isEs ? "es-ES" : "en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {rev.status === "approved" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {isEs ? "Aprobada (En sitio web)" : "Approved (Live on site)"}
                    </span>
                  )}
                  {rev.status === "pending" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                      <Clock className="h-3.5 w-3.5" />
                      {isEs ? "Pendiente de revisión" : "Pending Review"}
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

              {/* Star Rating */}
              <div className="mt-3 flex items-center gap-1">
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
                <span className="ml-1.5 text-xs font-bold text-slate-600">{rev.rating}.0</span>
              </div>

              {/* Review Text */}
              <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-slate-700 font-medium">
                "{rev.comment}"
              </p>

              {/* Existing Decline Feedback if any */}
              {rev.status === "declined" && rev.adminFeedback && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-800">
                  <span className="font-bold">{isEs ? "Motivo del rechazo:" : "Decline Feedback:"}</span>{" "}
                  {rev.adminFeedback}
                </div>
              )}

              {/* Inline Decline Feedback Form */}
              {declineId === rev.id && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-slate-700">
                    {isEs
                      ? "Comentario o motivo de rechazo (opcional para el usuario):"
                      : "Reason or feedback for user (optional):"}
                  </label>
                  <textarea
                    rows={2}
                    value={declineFeedback}
                    onChange={(e) => setDeclineFeedback(e.target.value)}
                    placeholder={
                      isEs
                        ? "ej. Por favor actualice el mensaje sin incluir datos médicos personales..."
                        : "e.g. Please update your review without including private medical numbers..."
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDeclineId(null)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {isEs ? "Cancelar" : "Cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmDecline(rev.id)}
                      className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
                    >
                      {isEs ? "Confirmar Rechazo" : "Confirm Decline"}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons Bar */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
                <div className="flex items-center gap-2">
                  {rev.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() => handleAccept(rev.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {isEs ? "Aceptar (Publicar)" : "Accept (Publish)"}
                    </button>
                  )}

                  {rev.status !== "declined" && declineId !== rev.id && (
                    <button
                      type="button"
                      onClick={() => handleStartDecline(rev.id)}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                      {isEs ? "Rechazar..." : "Decline..."}
                    </button>
                  )}

                  {rev.status === "approved" && declineId !== rev.id && (
                    <button
                      type="button"
                      onClick={() => updateReviewStatus(rev.id, "pending")}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {isEs ? "Mover a Pendiente" : "Unpublish"}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(rev.id)}
                  title={isEs ? "Eliminar reseña" : "Delete review"}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer rounded-lg hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
