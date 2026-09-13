"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Standing notice shown at the top of every Personal Log page.
 *
 * Rendered from app/dashboard/personal-log/layout.tsx so it appears once,
 * above the content, on every log and its add/view sub-pages.
 */
export default function PersonalLogDisclaimer() {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    <aside
      role="note"
      className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 sm:p-4"
    >
      <div className="flex gap-2.5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-xs sm:text-sm font-medium leading-relaxed text-amber-900">
          {isEs ? (
            <>
              NephroReach es una herramienta educativa de registro y comunicación.{" "}
              <strong className="font-bold">
                No es un dispositivo de diagnóstico autorizado por la FDA y no
                transmite datos automáticamente a los servicios de emergencia.
              </strong>{" "}
              Los pacientes son responsables de la exactitud de sus registros. Si
              está sufriendo una emergencia médica o síntomas graves, llame al 911
              o comuníquese directamente con su nefrólogo.
            </>
          ) : (
            <>
              NephroReach is an educational tracking log and communication tool.{" "}
              <strong className="font-bold">
                It is not an FDA-cleared diagnostic device and does not
                automatically transmit data to emergency services.
              </strong>{" "}
              Patients are responsible for the accuracy of their entries. If you
              are experiencing a medical emergency or severe symptoms, contact 911
              or your nephrologist directly.
            </>
          )}
        </p>
      </div>
    </aside>
  );
}
