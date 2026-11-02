"use client";

/* ==========================================================================
   /confirm-email and /confirm-added-email (spec 019 §2, INT-5)
   --------------------------------------------------------------------------
   Two link types, two routes: changing the primary email
   (`POST /auth/email/change/confirm`) and adding another one
   (`POST /auth/identifiers/email/confirm`). Each token is refused on the
   other route. The token is read once and dropped from the URL; any invalid
   token gets the same generic copy.
   ========================================================================== */

import React, { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui";
import * as authApi from "../auth.api";
import { authErrorPath } from "../authErrors";
import { useAuthText } from "../authText";
import { AuthPageShell } from "../AuthPageShell";
import { useOneTimeToken } from "../useOneTimeToken";

type Outcome = { kind: "ok" } | { kind: "error"; text: string };

function ConfirmLink({
  title,
  done,
  confirm,
}: {
  title: string;
  done: string;
  confirm: (token: string) => Promise<void>;
}) {
  const t = useAuthText();
  const token = useOneTimeToken();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const used = useRef(false);

  useEffect(() => {
    if (!token || used.current) return;
    used.current = true;
    confirm(token)
      .then(() => setOutcome({ kind: "ok" }))
      .catch((cause: unknown) =>
        setOutcome({ kind: "error", text: t(authErrorPath(cause)) }),
      );
  }, [token, confirm, t]);

  return (
    <AuthPageShell title={title}>
      {token === null ? (
        <Alert tone="danger">{t("errors.linkInvalid")}</Alert>
      ) : outcome === null ? (
        <p role="status" className="text-body-sm text-fg-muted">
          {t("verifyEmail.checkingLink")}
        </p>
      ) : outcome.kind === "ok" ? (
        <Alert tone="success">{done}</Alert>
      ) : (
        <Alert tone="danger">{outcome.text}</Alert>
      )}
    </AuthPageShell>
  );
}

export function ConfirmEmailPage() {
  const t = useAuthText();
  return (
    <ConfirmLink
      title={t("confirmEmail.title")}
      done={t("confirmEmail.done")}
      confirm={authApi.confirmEmailChange}
    />
  );
}

export function ConfirmAddedEmailPage() {
  const t = useAuthText();
  return (
    <ConfirmLink
      title={t("confirmEmail.addedTitle")}
      done={t("confirmEmail.addedDone")}
      confirm={authApi.confirmAddedEmail}
    />
  );
}
