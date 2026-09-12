"use client";

import React, { useEffect, useRef, useState } from "react";
import { Building2, Pencil, Phone, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { toTelHref, useDialysisClinic } from "@/lib/useDialysisClinic";

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

function ClinicModal({
  name,
  phone,
  onClose,
  onSave,
}: {
  name: string;
  phone: string;
  onClose: () => void;
  onSave: (next: { name: string; phone: string }) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [draftName, setDraftName] = useState(name);
  const [draftPhone, setDraftPhone] = useState(phone);
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
        aria-label={isEs ? "Cerrar" : "Close"}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-900/50 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEs ? "Mi Centro de Diálisis" : "My Dialysis Center"}
        className="relative w-full max-w-[440px] rounded-2xl bg-white shadow-[0_0_60px_rgba(15,23,42,0.25)]"
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-slate-950">
            {isEs ? "Mi Centro de Diálisis" : "My Dialysis Center"}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={isEs ? "Cerrar" : "Close"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 p-4 sm:p-5">
          <label className="block">
            <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">
              {isEs ? "Nombre del centro" : "Center name"}
            </span>
            <input
              className={`${INPUT_CLASS} mt-1.5`}
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder={
                isEs ? "ej. Centro de Diálisis ABC" : "e.g. ABC Dialysis Center"
              }
            />
          </label>

          <label className="block">
            <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">
              {isEs ? "Número de teléfono" : "Phone number"}
            </span>
            <input
              type="tel"
              className={`${INPUT_CLASS} mt-1.5`}
              value={draftPhone}
              onChange={(event) => setDraftPhone(event.target.value)}
              placeholder="(305) 555-0142"
            />
          </label>
        </div>

        <footer className="flex items-center justify-end gap-2.5 border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={() =>
              onSave({ name: draftName.trim(), phone: draftPhone.trim() })
            }
            className="rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
          >
            {isEs ? "Guardar" : "Save"}
          </button>
        </footer>
      </div>
    </div>
  );
}

/**
 * Dialysis center name and the number to call, pinned to the top of Dialysis
 * Management so the number is one tap away before anything else on the page.
 */
export default function DialysisClinicCard() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { clinic, setClinic } = useDialysisClinic();
  const [editing, setEditing] = useState(false);

  return (
    <>
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-3 shadow-xs sm:px-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Building2 className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            {isEs ? "Mi Centro de Diálisis" : "My Dialysis Center"}
          </p>
          <p className="truncate text-sm font-bold text-slate-800 sm:text-base">
            {clinic.name || (isEs ? "Sin nombre" : "Not set")}
          </p>
        </div>

        {clinic.phone ? (
          <a
            href={toTelHref(clinic.phone)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#2563EB] px-3.5 py-2.5 text-sm font-bold text-white shadow-2xs transition-colors hover:bg-blue-700"
          >
            <Phone className="h-4 w-4 shrink-0" />
            <span>{clinic.phone}</span>
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600 cursor-pointer"
          >
            <Phone className="h-4 w-4 shrink-0" />
            {isEs ? "Agregar número" : "Add phone number"}
          </button>
        )}

        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={isEs ? "Editar centro" : "Edit center"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </section>

      {editing && (
        <ClinicModal
          name={clinic.name}
          phone={clinic.phone}
          onClose={() => setEditing(false)}
          onSave={(next) => {
            setClinic(next);
            setEditing(false);
          }}
        />
      )}
    </>
  );
}
