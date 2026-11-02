"use client";

import React from "react";
import { Phone } from "lucide-react";
import { Alert, buttonStyles } from "@/components/ui";
import type { ApiNotice, ApiSafety } from "./community.api";

/* ==========================================================================
   What the server said about a post just sent (Phase 12)
   --------------------------------------------------------------------------
   The server screens every post. When the wording is about an emergency, a
   crisis, a symptom or medical advice, its reply carries the guidance for
   that tier, and when it holds a personal detail, a privacy notice. This
   shows exactly that reply, in the member's language: the composer's own
   screen (moderation.ts) is only a hint before posting, and must never be
   what a member in crisis is answered with after it.
   ========================================================================== */

export function ServerSafetyNotice({
  safety,
  privacyNotice,
  isEs,
}: {
  safety: ApiSafety | null;
  privacyNotice: ApiNotice | null;
  isEs: boolean;
}) {
  if (!safety && !privacyNotice) return null;
  return (
    <div className="space-y-stack-md">
      {safety ? (
        <Alert
          tone={safety.tone === "danger" ? "danger" : "warning"}
          title={isEs ? safety.titleEs : safety.titleEn}
        >
          <p>{isEs ? safety.bodyEs : safety.bodyEn}</p>
          {safety.offersEmergencyCall ? (
            <p className="mt-stack-sm flex flex-wrap gap-inline-md">
              <a href="tel:911" className={buttonStyles({ variant: "danger" })}>
                <Phone aria-hidden="true" />
                {isEs ? "Llamar al 911" : "Call 911"}
              </a>
              <a
                href="tel:988"
                className={buttonStyles({
                  variant: "danger",
                  appearance: "stroke",
                })}
              >
                <Phone aria-hidden="true" />
                {isEs ? "Llamar o textear 988" : "Call or text 988"}
              </a>
            </p>
          ) : null}
        </Alert>
      ) : null}
      {privacyNotice ? (
        <Alert
          tone="warning"
          title={isEs ? privacyNotice.titleEs : privacyNotice.titleEn}
        >
          {isEs ? privacyNotice.bodyEs : privacyNotice.bodyEn}
        </Alert>
      ) : null}
    </div>
  );
}

export default ServerSafetyNotice;
