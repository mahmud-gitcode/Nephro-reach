"use client";

import {
  useAcknowledge,
  type AckCopy,
} from "@/features/sharing/ExternalShareNotice";

/* ==========================================================================
   Important Health & Safety Notice (client, 2026-10-07)
   --------------------------------------------------------------------------
   NephroReach is a communication conduit, not an emergency service. Before
   a member's Send Secure Message or Report an Access Concern goes anywhere,
   this stops them, says so, and needs the box ticked. In the client's own
   words.
   ========================================================================== */

const COPY: Record<"en" | "es", AckCopy> = {
  en: {
    title: "⚠️ Important Health & Safety Notice",
    lead: "If you are experiencing chest pain, severe shortness of breath, uncontrolled bleeding from your access site, or any other medical emergency, STOP using this application immediately and call 911 or proceed to the nearest Emergency Room.",
    body: [
      "NephroReach is a secure communication and data coordination conduit only. This platform is NOT monitored for life-threatening or medical emergencies, and our clinical messaging logs are reviewed only during standard business or scheduled on-call tracking hours.",
    ],
    check:
      "I understand that this message is not for emergencies and will be reviewed by my care team during standard routing schedules.",
    cancel: "Cancel",
    confirm: "Submit Secure Message",
  },
  es: {
    title: "⚠️ Aviso Importante de Salud y Seguridad",
    lead: "Si tiene dolor de pecho, falta de aire grave, sangrado incontrolable en su acceso o cualquier otra emergencia médica, DEJE de usar esta aplicación de inmediato y llame al 911 o vaya a la sala de emergencias más cercana.",
    body: [
      "NephroReach es solo un medio seguro de comunicación y coordinación de datos. Esta plataforma NO se supervisa para emergencias médicas o que pongan en peligro la vida, y los mensajes clínicos se revisan solo durante el horario normal de oficina o de guardia programada.",
    ],
    check:
      "Entiendo que este mensaje no es para emergencias y que mi equipo de atención lo revisará durante el horario establecido.",
    cancel: "Cancelar",
    confirm: "Enviar Mensaje Seguro",
  },
};

/** Wrap a member's send: `safety.guard(() => send())`, render `notice`. */
export function useSafetyNotice(isEs = false) {
  return useAcknowledge(isEs ? COPY.es : COPY.en);
}
