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
      <aside
        role="note"
        className="rounded-card border border-warning-line bg-warning-surface p-inset-md"
      >
        <div className="flex items-start gap-inline-md">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-warning"
          />
          <div className="min-w-0">
            <p className="text-body-sm text-fg-secondary">
              {isEs
                ? "Dialysis Table Talk es solo educativo. No reemplaza el consejo de tu equipo médico, y no se revisa por urgencias. Si crees que es una emergencia, llama al 911."
                : "Dialysis Table Talk is educational only. It does not replace advice from your care team, and it is not monitored for urgent concerns. If you think you have an emergency, call 911."}
            </p>
            <Button
              size="small"
              variant="neutral"
              appearance="stroke"
              className="mt-stack-sm"
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
