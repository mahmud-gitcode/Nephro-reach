"use client";

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button, Modal } from "@/components/ui";

/* ==========================================================================
   Table Talk disclaimer
   --------------------------------------------------------------------------
   Short on the page, full in a modal — as the brief asks. The short version
   carries the two things a member must not miss: this is education, and it is
   not monitored for emergencies. Everything else is one tap away rather than
   a wall of text people learn to scroll past.
   ========================================================================== */

export function TableTalkDisclaimer() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Danger, not warning. This is the notice that says the series is not
        medical advice and is not watched for emergencies, and amber reads as
        "heads up" next to the red used everywhere else in the app for the
        things that actually hurt someone. */}
      <aside
        role="note"
        aria-labelledby="table-talk-disclaimer"
        className="rounded-card border border-danger-line bg-danger-surface p-inset-md"
      >
        <div className="flex flex-col gap-inline-md">
          <AlertTriangle
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-danger"
          />
          <div className="min-w-0 space-y-stack-sm">
            <h2
              id="table-talk-disclaimer"
              className="text-heading-5 text-danger"
            >
              {isEs
                ? "Aviso de Comunidad y Contenido"
                : "Community & Content Disclaimer"}
            </h2>

            <p className="text-justify text-body-sm text-fg-secondary">
              {isEs
                ? "Dialysis Table Talk es solo educativo e informativo. Lo que comparten presentadores, invitados y miembros de la comunidad no sustituye el consejo médico, el diagnóstico ni el tratamiento. Habla siempre con tu equipo de diálisis sobre tu salud."
                : "Dialysis Table Talk is for educational and informational purposes only. The views and experiences shared by hosts, guests, and community members are not a substitute for professional medical advice, diagnosis, or treatment. Always talk with your dialysis care team about your specific health needs."}
            </p>

            {/* The one line that must survive being skimmed. */}
            <p className="text-label-md text-danger">
              {isEs
                ? "En caso de una emergencia médica, llama al 911 de inmediato."
                : "In case of a medical emergency, call 911 immediately."}
            </p>

            <Button
              size="small"
              variant="neutral"
              appearance="stroke"
              onClick={() => setOpen(true)}
            >
              {isEs ? "Leer el aviso completo" : "Read Full Disclaimer"}
            </Button>
          </div>
        </div>
      </aside>

      {open ? (
        <Modal
          open
          size="big"
          onClose={() => setOpen(false)}
          title={
            isEs
              ? "Dialysis Table Talk — Aviso Educativo"
              : "Dialysis Table Talk — Educational Disclaimer"
          }
          footer={
            <Button onClick={() => setOpen(false)}>
              {isEs ? "Entendido" : "Got it"}
            </Button>
          }
        >
          <div className="space-y-stack-md text-body-md text-fg-secondary">
            {isEs ? (
              <>
                <p>
                  Dialysis Table Talk es ofrecido por NephroReach únicamente con
                  fines educativos e informativos. El contenido compartido por
                  presentadores, invitados, profesionales de la salud,
                  pacientes, cuidadores o miembros de la comunidad no pretende
                  reemplazar el consejo médico individualizado, el diagnóstico,
                  el tratamiento ni las recomendaciones de tu equipo de
                  atención.
                </p>
                <p>
                  La información discutida puede no aplicarse a tu condición
                  médica o a tu plan de tratamiento. No inicies, suspendas ni
                  cambies medicamentos, tratamientos de diálisis, dieta,
                  restricción de líquidos, cuidado del acceso u otro tratamiento
                  médico basándote únicamente en lo presentado en Dialysis Table
                  Talk. Consulta siempre tus dudas con tu nefrólogo, tu centro
                  de diálisis u otro profesional de salud calificado.
                </p>
                <p>
                  Dialysis Table Talk no es un servicio de emergencia y no se
                  supervisa por preocupaciones médicas urgentes. Si crees que
                  estás teniendo una emergencia médica, llama al 911 o busca
                  atención de emergencia de inmediato.
                </p>
              </>
            ) : (
              <>
                <p>
                  Dialysis Table Talk is provided by NephroReach for educational
                  and informational purposes only. Content shared by hosts,
                  guests, healthcare professionals, patients, caregivers, or
                  community members is not intended to replace individualized
                  medical advice, diagnosis, treatment, or recommendations from
                  your healthcare team.
                </p>
                <p>
                  Information discussed may not apply to your individual medical
                  condition or treatment plan. Do not start, stop, or change
                  medications, dialysis treatments, diet, fluid restrictions,
                  access care, or other medical treatment based solely on
                  information presented in Dialysis Table Talk. Always discuss
                  questions about your individual care with your nephrologist,
                  dialysis facility, or other qualified healthcare professional.
                </p>
                <p>
                  Dialysis Table Talk is not an emergency service and is not
                  monitored for urgent medical concerns. If you believe you are
                  experiencing a medical emergency, call 911 or seek emergency
                  medical care immediately.
                </p>
              </>
            )}
          </div>
        </Modal>
      ) : null}
    </>
  );
}

export default TableTalkDisclaimer;
