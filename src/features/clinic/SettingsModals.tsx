"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import { Button, Modal, Switch } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { SHARING_OPTIONS, type SharingId } from "./settings.actions";
import type { SharingState } from "./settings.data";

/* ==========================================================================
   The dialogs behind Settings' Data & Privacy actions
   --------------------------------------------------------------------------
   The data-sharing choices are the office's settings on the server
   (shareUsageAnalytics, shareOutcomes, shareResearch; off unless turned
   on). Password, two-factor, sessions and login activity are the account's
   own flows (FE-ID), not dialogs here.
   ========================================================================== */

/* --------------------------------------------------------------------------
   7 · Data sharing
   -------------------------------------------------------------------------- */

export function DataSharingModal({
  open,
  onClose,
  sharing,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  sharing: SharingState;
  onToggle: (id: SharingId, on: boolean) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEs ? "Compartir datos" : "Data Sharing"}
      description={
        isEs
          ? "Todo aquí está desactivado a menos que usted lo active."
          : "Everything here is off unless you turn it on."
      }
      footer={<Button onClick={onClose}>{isEs ? "Listo" : "Done"}</Button>}
    >
      <ul className="divide-y divide-line-subtle">
        {SHARING_OPTIONS.map((option) => (
          <li
            key={option.id}
            className="flex items-start gap-inline-lg py-inset-sm first:pt-0"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-label-md text-fg">
                {isEs ? option.labelEs : option.label}
              </span>
              <span className="block text-body-sm text-fg-muted">
                {isEs ? option.noteEs : option.note}
              </span>
            </span>
            <Switch
              checked={sharing[option.id]}
              onChange={(next) => onToggle(option.id, next)}
              label={isEs ? option.labelEs : option.label}
            />
          </li>
        ))}
      </ul>

      <p className="mt-stack-lg text-body-sm text-fg-muted">
        {isEs
          ? "En ninguna de estas opciones se comparte información que identifique a los pacientes."
          : "No patient-identifying information is shared under any of these."}
      </p>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   8 · HIPAA & security
   -------------------------------------------------------------------------- */

const HIPAA_POINTS_ES: [string, string][] = [
  [
    "Sus pacientes son solo suyos",
    "Los registros de un centro nunca son accesibles desde el portal de otro. Cada consulta se limita al consultorio con sesión iniciada.",
  ],
  [
    "Mínimo privilegio por rol",
    "Administrador, Proveedor, Personal, Coordinador y Asistente médico (MA) ven solo lo que cada rol necesita.",
  ],
  [
    "Acceso auditado",
    "Quién abrió qué registro, y cuándo, queda registrado y disponible para el administrador de su consultorio.",
  ],
  [
    "Cifrado en tránsito y en reposo",
    "TLS en cada solicitud y almacenamiento cifrado para todo lo que se guarda sobre un paciente.",
  ],
  [
    "Acuerdo de Socio Comercial (BAA)",
    "NephroReach firma un BAA con cada centro contratado antes de comenzar.",
  ],
];

const HIPAA_POINTS: [string, string][] = [
  [
    "Your patients are yours alone",
    "One facility's records are never reachable from another's portal. Every query is scoped to the signed-in office.",
  ],
  [
    "Least privilege by role",
    "Admin, Provider, Staff, Coordinator and MA each see only what that role needs.",
  ],
  [
    "Audited access",
    "Who opened which record, and when, is recorded and available to your office's admin.",
  ],
  [
    "Encrypted in transit and at rest",
    "TLS on every request, and encrypted storage for everything held about a patient.",
  ],
  [
    "Business Associate Agreement",
    "NephroReach signs a BAA with every contracted facility before go-live.",
  ],
];

export function HipaaModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={isEs ? "HIPAA y seguridad" : "HIPAA & Security"}
      description={
        isEs
          ? "Cómo se mantienen separados y protegidos los datos de su consultorio."
          : "How your office's data is kept separate and protected."
      }
      footer={<Button onClick={onClose}>{isEs ? "Cerrar" : "Close"}</Button>}
    >
      <ul className="space-y-stack-md">
        {(isEs ? HIPAA_POINTS_ES : HIPAA_POINTS).map(([title, detail]) => (
          <li key={title} className="flex items-start gap-inline-md">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-fg-brand"
            />
            <span className="min-w-0">
              <span className="block text-label-md text-fg">{title}</span>
              <span className="block text-body-sm text-fg-secondary">
                {detail}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
