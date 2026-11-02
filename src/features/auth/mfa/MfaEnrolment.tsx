"use client";

/* ==========================================================================
   Turning on an authenticator app (D17)
   --------------------------------------------------------------------------
   1. Start (sudo first): `POST /auth/2fa/enroll/totp` returns a QR image,
      the setup key and an otpauth URL.
   2. The user scans and types the app's code: `…/totp/confirm`. The first
      method also returns the backup codes, shown once.

   The QR image and the setup key live in this component's state only, are
   never stored or logged, and are dropped as soon as enrolment finishes.
   The setup key is masked until the user asks to see it.
   ========================================================================== */

import React, { useState } from "react";
import { Alert, Button, FormField, Input } from "@/components/ui";
import * as authApi from "../auth.api";
import { authErrorPath } from "../authErrors";
import { useAuthText } from "../authText";
import type { TotpEnrollment } from "../auth.types";
import { BackupCodes } from "./BackupCodes";

type Step =
  | { kind: "start" }
  | { kind: "scan"; enrollment: TotpEnrollment }
  | { kind: "codes"; codes: string[] };

export function MfaEnrolment({
  withSudo,
  onDone,
}: {
  /** From useSudo(): starting enrolment needs a recent re-authentication. */
  withSudo: <T>(fn: () => Promise<T>) => Promise<T>;
  onDone: () => void;
}) {
  const t = useAuthText();
  const [step, setStep] = useState<Step>({ kind: "start" });
  const [code, setCode] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      const enrollment = await withSudo(() => authApi.enrollTotp());
      setStep({ kind: "scan", enrollment });
    } catch (cause) {
      setError(t(authErrorPath(cause)));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    try {
      const codes = await authApi.confirmTotp(code.trim());
      setCode("");
      if (codes && codes.length > 0) setStep({ kind: "codes", codes });
      else {
        setStep({ kind: "start" });
        onDone();
      }
    } catch (cause) {
      setCode("");
      setError(t(authErrorPath(cause)));
    } finally {
      setBusy(false);
    }
  };

  if (step.kind === "codes") {
    return (
      <BackupCodes
        codes={step.codes}
        onDone={() => {
          setStep({ kind: "start" });
          onDone();
        }}
      />
    );
  }

  if (step.kind === "scan") {
    const { enrollment } = step;
    return (
      <form
        className="space-y-stack-md"
        onSubmit={(event) => {
          event.preventDefault();
          void confirm();
        }}
      >
        <p className="text-body-sm text-fg-muted">{t("mfa.scan")}</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- a one-time data: QR image from the API; next/image cannot optimise it and must not cache it */}
        <img
          src={enrollment.qrDataUrl}
          alt={t("mfa.qrAlt")}
          width={192}
          height={192}
          className="mx-auto size-48 rounded-card-nested border border-line bg-surface"
        />
        <div className="flex flex-wrap items-center gap-inline-sm">
          <span className="text-label-md text-fg">{t("mfa.secret")}:</span>
          <code
            className="font-mono text-body-sm break-all text-fg"
            data-testid="totp-secret"
          >
            {showSecret
              ? enrollment.secret
              : "•".repeat(Math.min(enrollment.secret.length, 32))}
          </code>
          <Button
            size="small"
            variant="neutral"
            appearance="ghost"
            onClick={() => setShowSecret((v) => !v)}
          >
            {showSecret ? t("mfa.hideSecret") : t("mfa.showSecret")}
          </Button>
        </div>
        <FormField label={t("mfa.confirmCode")} required>
          {(field) => (
            <Input
              {...field}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          )}
        </FormField>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Button type="submit" fullWidth loading={busy} disabled={!code.trim()}>
          {t("mfa.confirm")}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-stack-md">
      <p className="text-body-sm text-fg-muted">{t("mfa.intro")}</p>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Button fullWidth loading={busy} onClick={() => void start()}>
        {t("mfa.start")}
      </Button>
    </div>
  );
}
