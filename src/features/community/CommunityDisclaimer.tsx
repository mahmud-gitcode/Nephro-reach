"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils/cn";
import { MODERATION_HOURS } from "./moderation";

/* ==========================================================================
   Community disclaimer
   --------------------------------------------------------------------------
   Standing notice at the top of the board, before the first post.

   Danger tone rather than warning, for the same reason Table Talk's notice
   uses it: the line that must not be missed is that nobody is watching this
   board for emergencies. Amber reads as "heads up" next to the red this app
   uses for the things that actually hurt someone.

   Three things, in the order they matter: this is peer support and not
   medical advice, it is not monitored in real time, and what members owe
   each other. The last one is here because the board is moderated after the
   fact — a member reading the rules before they type is the only control
   that works before something is posted.
   ========================================================================== */

export default function CommunityDisclaimer({
  spaced = true,
  className,
}: {
  /** Off when the notice sits in a layout that handles its own spacing. */
  spaced?: boolean;
  className?: string;
} = {}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    <aside
      role="note"
      aria-labelledby="community-disclaimer"
      className={cn(
        spaced && "mb-stack-lg",
        "rounded-card border border-danger-line bg-danger-surface p-inset-md",
        className,
      )}
    >
      <div className="flex gap-inline-md">
        <AlertTriangle
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-danger"
        />
        <div className="min-w-0 space-y-stack-sm">
          <h2 id="community-disclaimer" className="text-heading-5 text-danger">
            {isEs ? "Aviso de la Comunidad" : "Community & Safety Disclaimer"}
          </h2>

          <p className="text-body-sm text-fg-secondary">
            {isEs
              ? "Esta comunidad es solo para educación y apoyo entre miembros. Lo que comparten otros miembros no sustituye el consejo médico, el diagnóstico ni el tratamiento. Habla siempre con tu equipo de diálisis sobre tu salud."
              : "This community is for education and peer support only. What other members share is not a substitute for professional medical advice, diagnosis, or treatment. Always talk with your dialysis care team about your own health."}
          </p>

          {/* The one line that must survive being skimmed. */}
          <p className="text-label-md text-danger">
            {isEs
              ? "Nadie vigila esta comunidad en tiempo real. En caso de una emergencia médica, llama al 911 de inmediato."
              : "This community is not monitored in real time. In a medical emergency, call 911 immediately."}
          </p>

          {/* What the screen does, in the member's terms. Held is not the
            same as refused, and saying the wrong one is how a member stops
            believing the notice. */}
          <p className="text-body-sm text-fg-secondary">
            {isEs
              ? "Trata a cada miembro con respeto. Las publicaciones y respuestas se revisan automáticamente. Si tu mensaje menciona una posible emergencia, síntomas, consejos médicos, estafas o datos personales, se retiene para que lo lea un moderador y solo tú lo verás hasta que lo apruebe. Usa el menú de una publicación para reportarla."
              : "Treat every member with respect. Posts and replies are screened automatically. If your message mentions a possible emergency, symptoms, medical advice, scams, or personal details, it is held for a moderator to read and only you can see it until they approve it. Use a post's menu to report a post."}
          </p>

          {/* The promise this board can actually keep. Kept in one place so
            it cannot drift from what the moderation queue says. */}
          <p className="text-body-sm text-fg-secondary">
            {isEs ? MODERATION_HOURS.es : MODERATION_HOURS.en}
          </p>
        </div>
      </div>
    </aside>
  );
}
