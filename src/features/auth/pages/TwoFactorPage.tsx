"use client";

/* ==========================================================================
   /two-factor: the sign-in challenge
   --------------------------------------------------------------------------
   The challenge id lives in module memory only (pendingChallenge.ts). A
   reload or a deep link finds none and goes back to /login. A backup code
   goes in the same field as the method's code. A locked or expired
   challenge sends the user back to sign in again. Codes are never retried
   automatically (the API client never refreshes on these routes).
   ========================================================================== */

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  FormField,
  Input,
  SegmentedChoice,
} from "@/components/ui";
import { useAuth } from "../AuthContext";
import { routeAfterSignIn } from "../auth.mapping";
import * as authApi from "../auth.api";
import { authErrorKind, authErrorPath } from "../authErrors";
import { useAuthText } from "../authText";
import { AuthPageShell } from "../AuthPageShell";
import type { TwoFactorType } from "../auth.types";
import { clearPendingChallenge, pendingChallenge } from "../pendingChallenge";

export function TwoFactorPage() {
  const t = useAuthText();
  const router = useRouter();
  const { completeTwoFactor } = useAuth();
  const [challenge] = useState(() => pendingChallenge());
  const methods = challenge?.methods ?? [];
  const [type, setType] = useState<TwoFactorType>(
    methods.includes("TOTP") ? "TOTP" : (methods[0] ?? "TOTP"),
  );
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (!challenge) router.replace("/login");
  }, [challenge, router]);

  if (!challenge) return null;

  const label = (method: TwoFactorType) =>
    method === "TOTP"
      ? t("twoFactor.totp")
      : method === "SMS_OTP"
        ? t("twoFactor.sms")
        : t("twoFactor.email");

  const send = async () => {
    setBusy(true);
    setError("");
    try {
      await authApi.sendChallengeCode(challenge.challengeId, type);
      setSent(true);
    } catch (cause) {
      setError(t(authErrorPath(cause)));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (done.current || !code.trim()) return;
    setBusy(true);
    setError("");
    try {
      const outcome = await completeTwoFactor(type, code.trim());
      done.current = true;
      if (outcome.kind === "signed-in")
        router.push(routeAfterSignIn(outcome.context, challenge.next));
    } catch (cause) {
      setCode("");
      const kind = authErrorKind(cause);
      if (kind === "challenge-ended" || kind === "locked") {
        clearPendingChallenge();
        setError(t(authErrorPath(cause)));
        done.current = true;
        window.setTimeout(() => router.replace("/login"), 2500);
        return;
      }
      setError(t(authErrorPath(cause)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthPageShell
      title={t("twoFactor.title")}
      description={t("twoFactor.intro")}
    >
      <form
        className="space-y-stack-md"
        onSubmit={(event) => {
          event.preventDefault();
          void verify();
        }}
      >
        {methods.length > 1 ? (
          <SegmentedChoice
            label={t("twoFactor.method")}
            options={methods.map((method) => ({
              value: method,
              label: label(method),
            }))}
            value={type}
            onChange={(next) => {
              setType(next);
              setSent(false);
              setError("");
            }}
          />
        ) : null}
        {type !== "TOTP" ? (
          <div className="flex items-center gap-inline-md">
            <Button
              variant="neutral"
              appearance="stroke"
              onClick={() => void send()}
              disabled={busy}
            >
              {sent ? t("common.resend") : t("common.sendCode")}
            </Button>
            {sent ? (
              <span role="status" className="text-body-sm text-fg-muted">
                {t("common.codeSent")}
              </span>
            ) : null}
          </div>
        ) : null}
        <FormField label={t("common.code")} required>
          {(field) => (
            <Input
              {...field}
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setError("");
              }}
            />
          )}
        </FormField>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Button type="submit" fullWidth loading={busy} disabled={!code.trim()}>
          {t("twoFactor.verify")}
        </Button>
      </form>
    </AuthPageShell>
  );
}
