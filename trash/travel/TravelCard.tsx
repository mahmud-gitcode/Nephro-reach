"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Building2,
  CalendarDays,
  Check,
  FileText,
  MapPin,
  Pencil,
  Phone,
  Plane,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { mockDialysisEntries } from "@/lib/dialysisTreatmentData";
import { toTelHref } from "@/lib/useDialysisClinic";
import {
  createTripId,
  DialysisTrip,
  formatTripDate,
  isDateInTrip,
  TRIP_CHECKLIST,
  tripLengthDays,
  tripStatus,
  useDialysisTrips,
} from "./useDialysisTrips";

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

const LABEL_CLASS =
  "block text-xs font-bold uppercase tracking-wide text-slate-500";

function emptyTrip(): DialysisTrip {
  return {
    id: createTripId(),
    destination: "",
    startDate: "",
    endDate: "",
    awayCenter: "",
    awayCenterPhone: "",
    checklist: {},
  };
}

function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 h-full w-full cursor-default bg-slate-900/50 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[90vh] w-full max-w-[520px] flex-col rounded-2xl bg-white shadow-[0_0_60px_rgba(15,23,42,0.25)]"
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {children}
        </div>

        {footer && (
          <footer className="flex items-center justify-end gap-2.5 border-t border-slate-200 p-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

function TripForm({
  initial,
  onClose,
  onSave,
}: {
  initial: DialysisTrip;
  onClose: () => void;
  onSave: (trip: DialysisTrip) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const [draft, setDraft] = useState<DialysisTrip>(initial);

  const set = (patch: Partial<DialysisTrip>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const valid =
    draft.destination.trim() && draft.startDate && draft.endDate &&
    draft.endDate >= draft.startDate;

  return (
    <Modal
      title={isEs ? "Planificar un viaje" : "Plan a trip"}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onSave(draft)}
            className="rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {isEs ? "Guardar viaje" : "Save trip"}
          </button>
        </>
      }
    >
      <label className="block">
        <span className={LABEL_CLASS}>{isEs ? "Destino" : "Destination"}</span>
        <input
          className={`${INPUT_CLASS} mt-1.5`}
          value={draft.destination}
          onChange={(event) => set({ destination: event.target.value })}
          placeholder="Miami, FL"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={LABEL_CLASS}>{isEs ? "Desde" : "From"}</span>
          <input
            type="date"
            className={`${INPUT_CLASS} mt-1.5 cursor-pointer`}
            value={draft.startDate}
            onChange={(event) => set({ startDate: event.target.value })}
          />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>{isEs ? "Hasta" : "To"}</span>
          <input
            type="date"
            className={`${INPUT_CLASS} mt-1.5 cursor-pointer`}
            value={draft.endDate}
            min={draft.startDate || undefined}
            onChange={(event) => set({ endDate: event.target.value })}
          />
        </label>
      </div>

      <label className="block">
        <span className={LABEL_CLASS}>
          {isEs ? "Centro de destino" : "Away center"}
        </span>
        <input
          className={`${INPUT_CLASS} mt-1.5`}
          value={draft.awayCenter}
          onChange={(event) => set({ awayCenter: event.target.value })}
          placeholder="Bayside Dialysis Center"
        />
      </label>

      <label className="block">
        <span className={LABEL_CLASS}>
          {isEs ? "Teléfono del centro" : "Center phone"}
        </span>
        <input
          type="tel"
          className={`${INPUT_CLASS} mt-1.5`}
          value={draft.awayCenterPhone}
          onChange={(event) => set({ awayCenterPhone: event.target.value })}
          placeholder="(305) 555-0188"
        />
      </label>
    </Modal>
  );
}

function TripSummary({
  trip,
  onClose,
}: {
  trip: DialysisTrip;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  // Any treatment logged inside the trip window is an away session.
  const sessions = mockDialysisEntries
    .filter((entry) => isDateInTrip(trip, entry.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Modal
      title={isEs ? "Resumen del viaje" : "Trip summary"}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
        >
          <FileText className="h-4 w-4" />
          {isEs ? "Imprimir" : "Print"}
        </button>
      }
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
        <p className="text-sm font-bold text-slate-900">{trip.destination}</p>
        <p className="mt-0.5 text-xs font-medium text-slate-600">
          {formatTripDate(trip.startDate, isEs)} —{" "}
          {formatTripDate(trip.endDate, isEs)}
        </p>
        {trip.awayCenter && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            {trip.awayCenter}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {isEs ? "Sesiones" : "Sessions"}
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {sessions.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {isEs ? "Días" : "Days"}
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {tripLengthDays(trip)}
          </p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          {isEs
            ? "No hay tratamientos registrados en estas fechas."
            : "No treatments logged in these dates."}
        </p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-slate-200 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {formatTripDate(entry.date, isEs)}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {entry.duration}
                </span>
              </div>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div>
                  <dt className="text-[10px] font-semibold uppercase text-slate-500">
                    {isEs ? "Líquido" : "Fluid"}
                  </dt>
                  <dd className="text-xs font-bold text-slate-800">
                    {entry.fluidRemoved || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase text-slate-500">
                    {isEs ? "Peso final" : "Post wt"}
                  </dt>
                  <dd className="text-xs font-bold text-slate-800">
                    {entry.postWeight || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase text-slate-500">
                    {isEs ? "Asistencia" : "Attendance"}
                  </dt>
                  <dd className="text-xs font-bold text-slate-800">
                    {entry.attendance}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}

      <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium leading-relaxed text-amber-900">
        {isEs
          ? "Este resumen es lo que el paciente registró, no el expediente del centro visitado."
          : "This summary is what the patient recorded, not the away center's own chart."}
      </p>
    </Modal>
  );
}

/**
 * Travel card for Dialysis Management: plan a trip, work the checklist, see
 * travel mode while away, and review what happened afterwards.
 */
export default function TravelCard() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const {
    trips,
    todayKey,
    activeTrip,
    nextTrip,
    saveTrip,
    deleteTrip,
    toggleChecklistItem,
  } = useDialysisTrips();

  const [editing, setEditing] = useState<DialysisTrip | null>(null);
  const [summaryTrip, setSummaryTrip] = useState<DialysisTrip | null>(null);

  const featured = activeTrip ?? nextTrip ?? trips[trips.length - 1] ?? null;
  const status = featured ? tripStatus(featured, todayKey) : null;

  const daysUntil = featured
    ? Math.round(
        (new Date(`${featured.startDate}T00:00:00`).getTime() -
          new Date(`${todayKey}T00:00:00`).getTime()) /
          86_400_000,
      )
    : 0;

  const dayOfTrip = featured
    ? Math.round(
        (new Date(`${todayKey}T00:00:00`).getTime() -
          new Date(`${featured.startDate}T00:00:00`).getTime()) /
          86_400_000,
      ) + 1
    : 0;

  const doneCount = featured
    ? TRIP_CHECKLIST.filter((item) => featured.checklist[item.id]).length
    : 0;

  return (
    <>
      <section
        className={`rounded-2xl border p-4 shadow-xs sm:p-5 ${
          status === "active"
            ? "border-blue-200 bg-blue-50"
            : "border-slate-200/90 bg-white"
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              status === "active"
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-600"
            }`}
          >
            <Plane className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {isEs ? "Modo Viaje" : "Travel Mode"}
            </p>
            <p className="truncate text-sm font-bold text-slate-900 sm:text-base">
              {featured
                ? featured.destination
                : isEs
                  ? "Ningún viaje planificado"
                  : "No trip planned"}
            </p>
            {featured && (
              <p className="mt-0.5 text-xs font-medium text-slate-600">
                {formatTripDate(featured.startDate, isEs)} —{" "}
                {formatTripDate(featured.endDate, isEs)}
                {status === "active" &&
                  ` · ${isEs ? "Día" : "Day"} ${dayOfTrip}/${tripLengthDays(featured)}`}
                {status === "planned" &&
                  ` · ${isEs ? "en" : "in"} ${daysUntil} ${isEs ? "días" : "days"}`}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {featured && status === "completed" && (
              <button
                type="button"
                onClick={() => setSummaryTrip(featured)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-slate-600" />
                {isEs ? "Resumen" : "Summary"}
              </button>
            )}

            {featured && (
              <button
                type="button"
                onClick={() => setEditing(featured)}
                aria-label={isEs ? "Editar viaje" : "Edit trip"}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-slate-700 cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setEditing(emptyTrip())}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-3.5 py-2.5 text-sm font-bold text-white shadow-2xs transition-colors hover:bg-blue-700 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {isEs ? "Planificar viaje" : "Plan a Trip"}
            </button>
          </div>
        </div>

        {featured && status === "active" && featured.awayCenter && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-white px-3.5 py-2.5">
            <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-800">
              <Building2 className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="truncate">{featured.awayCenter}</span>
            </span>
            {featured.awayCenterPhone && (
              <a
                href={toTelHref(featured.awayCenterPhone)}
                className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
              >
                <Phone className="h-3.5 w-3.5" />
                {featured.awayCenterPhone}
              </a>
            )}
          </div>
        )}

        {featured && status === "planned" && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {isEs ? "Preparación" : "Getting ready"}
              </p>
              <span className="text-[11px] font-bold text-slate-600">
                {doneCount}/{TRIP_CHECKLIST.length}
              </span>
            </div>

            <ul className="mt-2 space-y-1.5">
              {TRIP_CHECKLIST.map((item) => {
                const done = Boolean(featured.checklist[item.id]);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggleChecklistItem(featured.id, item.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-white cursor-pointer"
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          done
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {done && <Check className="h-3 w-3" />}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          done ? "text-slate-400 line-through" : "text-slate-700"
                        }`}
                      >
                        {isEs ? item.labelEs : item.labelEn}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {trips.length > 1 && (
          <ul className="mt-3 space-y-1.5">
            {trips
              .filter((trip) => trip.id !== featured?.id)
              .map((trip) => (
                <li
                  key={trip.id}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">
                    {trip.destination}
                  </span>
                  <span className="shrink-0 text-[11px] font-medium text-slate-500">
                    {formatTripDate(trip.startDate, isEs)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSummaryTrip(trip)}
                    aria-label={isEs ? "Ver resumen" : "View summary"}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTrip(trip.id)}
                    aria-label={isEs ? "Eliminar viaje" : "Delete trip"}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
          </ul>
        )}
      </section>

      {editing && (
        <TripForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(trip) => {
            saveTrip(trip);
            setEditing(null);
          }}
        />
      )}

      {summaryTrip && (
        <TripSummary
          trip={summaryTrip}
          onClose={() => setSummaryTrip(null)}
        />
      )}
    </>
  );
}
