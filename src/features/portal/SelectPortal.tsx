"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Badge, Button, Skeleton } from "@/components/ui";
import { AuthPageShell } from "@/features/auth/AuthPageShell";
import { useAuth } from "@/features/auth/AuthContext";
import { choiceKey } from "@/features/auth/auth.mapping";
import { destinationFor, pickerEntries } from "./portalContext";
import { usePortalText } from "./portalText";

/* ==========================================================================
   /select-portal: choose which portal to work in (Phase 3, D5)
   --------------------------------------------------------------------------
   Lists every context `GET /me/context` gives the account: the platform
   team, each office, the patient's own record, each patient they care for.
   Entering one sets the office header only in office mode and clears every
   cached query (AuthContext.enterContext), so nothing read in one portal
   shows in another. The server still decides every request.
   ========================================================================== */

function nextParam(): string | null {
  if (typeof window === "undefined") return null;
  const next = new URLSearchParams(window.location.search).get("next");
  /* Never back to this page. */
  return next && !next.startsWith("/select-portal") ? next : null;
}

export function SelectPortal() {
  const { status, context, choice, enterContext } = useAuth();
  const router = useRouter();
  const t = usePortalText();
  const [refused, setRefused] = useState(false);

  useEffect(() => {
    if (status === "signed-out")
      router.replace(`/login?next=${encodeURIComponent("/select-portal")}`);
  }, [status, router]);

  if (status !== "signed-in" || !context) {
    return (
      <AuthPageShell title={t("pickerTitle")} backToSignIn={false}>
        <Skeleton height={160} />
      </AuthPageShell>
    );
  }

  const entries = pickerEntries(context, t);
  const current = choice ? choiceKey(choice) : null;

  return (
    <AuthPageShell
      title={t("pickerTitle")}
      description={t("pickerBody")}
      backToSignIn={false}
    >
      {refused ? (
        <Alert tone="warning" className="mb-stack-md">
          {t("notHeld")}
        </Alert>
      ) : null}
      <ul aria-label={t("pickerList")} className="space-y-stack-sm">
        {entries.map(({ choice: option, label }) => {
          const isCurrent = current === choiceKey(option);
          return (
            <li
              key={label.key}
              className="flex items-center gap-inline-md rounded-card-nested border border-line p-inset-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-label-lg text-fg">{label.title}</p>
                <p className="truncate text-caption text-fg-muted">
                  {label.detail}
                </p>
                {label.suspended ? (
                  <Badge tone="warning" className="mt-stack-xs">
                    {t("suspended")}
                  </Badge>
                ) : null}
              </div>
              {isCurrent ? <Badge tone="neutral">{t("current")}</Badge> : null}
              <Button
                size="small"
                aria-label={`${t("enter")}: ${label.title}`}
                onClick={() => {
                  if (!enterContext(option)) {
                    setRefused(true);
                    return;
                  }
                  router.push(destinationFor(context, option, nextParam()));
                }}
              >
                {t("enter")}
              </Button>
            </li>
          );
        })}
      </ul>
    </AuthPageShell>
  );
}
