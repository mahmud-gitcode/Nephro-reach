"use client";

/* ==========================================================================
   The user's 2FA methods: turn one off, or make new backup codes (D17)
   --------------------------------------------------------------------------
   Patients and caregivers may turn MFA off; staff cannot remove their last
   required method (403 `auth.mfa_required_cannot_disable`, spec 026). Both
   actions consume a sudo grant, so each goes through `withSudo`.
   ========================================================================== */

import React, { useState } from "react";
import { Alert, Badge, Button } from "@/components/ui";
import * as authApi from "../auth.api";
import { authErrorPath } from "../authErrors";
import { useAuthText } from "../authText";
import type { TwoFactorMethod } from "../auth.types";
import { BackupCodes } from "./BackupCodes";

export function MfaMethodList({
  methods,
  withSudo,
  onChanged,
}: {
  methods: readonly TwoFactorMethod[];
  withSudo: <T>(fn: () => Promise<T>) => Promise<T>;
  /** Re-read the methods and the context after a change. */
  onChanged: () => void;
}) {
  const t = useAuthText();
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const label = (method: TwoFactorMethod) =>
    method.type === "TOTP"
      ? t("twoFactor.totp")
      : method.type === "SMS_OTP"
        ? t("twoFactor.sms")
        : t("twoFactor.email");

  const turnOff = async (method: TwoFactorMethod) => {
    setBusy(method.id);
    setError("");
    try {
      await withSudo(() => authApi.disableMfaMethod(method.id));
      onChanged();
    } catch (cause) {
      setError(t(authErrorPath(cause)));
    } finally {
      setBusy(null);
    }
  };

  const regenerate = async () => {
    setBusy("codes");
    setError("");
    try {
      setCodes(await withSudo(() => authApi.regenerateBackupCodes()));
    } catch (cause) {
      setError(t(authErrorPath(cause)));
    } finally {
      setBusy(null);
    }
  };

  if (codes) {
    return <BackupCodes codes={codes} onDone={() => setCodes(null)} />;
  }

  const enabled = methods.filter((m) => m.isEnabled);
  return (
    <section aria-labelledby="mfa-methods-title" className="space-y-stack-md">
      <h2 id="mfa-methods-title" className="text-heading-5 text-fg">
        {t("mfa.methods")}
      </h2>
      <ul className="divide-y divide-line rounded-card-nested border border-line">
        {enabled.map((method) => (
          <li
            key={method.id}
            className="flex items-center justify-between gap-inline-md p-inset-md"
          >
            <span className="flex items-center gap-inline-sm text-body-md text-fg">
              {label(method)}
              {method.destination ? (
                <span className="text-body-sm text-fg-muted">
                  {method.destination}
                </span>
              ) : null}
              <Badge tone="success">{t("mfa.on")}</Badge>
            </span>
            <Button
              size="small"
              variant="danger"
              appearance="stroke"
              loading={busy === method.id}
              onClick={() => void turnOff(method)}
            >
              {t("mfa.turnOff")}
            </Button>
          </li>
        ))}
      </ul>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {enabled.length > 0 ? (
        <Button
          variant="neutral"
          appearance="stroke"
          loading={busy === "codes"}
          onClick={() => void regenerate()}
        >
          {t("mfa.regenerate")}
        </Button>
      ) : null}
    </section>
  );
}
