"use client";

/* ==========================================================================
   /verify-email
   --------------------------------------------------------------------------
   - From the email link: `?token=` is read once and dropped from the URL,
     then `POST /auth/email/verify`.
   - Signed in (just registered): the code from the email,
     `POST /auth/email/verify/confirm`; resend with `…/resend/me`.
   - Signed out: email + code, `POST /auth/email/verify/otp`.
   Then the context is re-read and the user goes on (patient setup, or
   where they were going).
   ========================================================================== */

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, FormField, Input } from "@/components/ui";
import { useAuth } from "../AuthContext";
import { routeAfterSignIn } from "../auth.mapping";
import * as authApi from "../auth.api";
import { authErrorPath } from "../authErrors";
import { useAuthText } from "../authText";
import { AuthPageShell } from "../AuthPageShell";
import { useOneTimeToken } from "../useOneTimeToken";

function nextParam(): string | null {
  return new URLSearchParams(window.location.search).get("next");
}

export function VerifyEmailPage() {
  const t = useAuthText();
  const router = useRouter();
  const { status, context, refreshContext } = useAuth();
  const token = useOneTimeToken();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [linkDone, setLinkDone] = useState(false);
  const usedToken = useRef(false);

  const signedIn = status === "signed-in" && context !== null;
  const checkingLink = Boolean(token) && !linkDone;

  const goOn = async () => {
    const fresh = await refreshContext();
    if (fresh) router.push(routeAfterSignIn(fresh, nextParam()));
    else router.push("/login");
  };

  /* Already verified (a second visit): go on. */
  useEffect(() => {
    if (signedIn && context.user.isAccountVerified && !token)
      router.replace(routeAfterSignIn(context, nextParam()));
  }, [signedIn, context, token, router]);

  /* The link: verify once. */
  useEffect(() => {
    if (!token || usedToken.current) return;
    usedToken.current = true;
    authApi
      .verifyEmailToken(token)
      .then(() => {
        setNotice(t("verifyEmail.verified"));
        return status === "signed-in" ? goOn() : undefined;
      })
      .catch((cause: unknown) => setError(t(authErrorPath(cause))))
      .finally(() => setLinkDone(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the token is used exactly once
  }, [token]);

  const submit = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    try {
      if (signedIn) {
        await authApi.verifyEmailCode(code.trim());
        await goOn();
      } else {
        await authApi.verifyEmailOtp(email, code.trim());
        setNotice(t("verifyEmail.verified"));
        router.push("/login");
      }
    } catch (cause) {
      setCode("");
      setError(t(authErrorPath(cause)));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setError("");
    try {
      if (signedIn) await authApi.resendVerification();
      else await authApi.resendVerificationFor(email);
      setNotice(t("common.codeSent"));
    } catch (cause) {
      setError(t(authErrorPath(cause)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthPageShell
      title={t("verifyEmail.title")}
      description={
        signedIn ? t("verifyEmail.intro") : t("verifyEmail.introSignedOut")
      }
    >
      {checkingLink ? (
        <p role="status" className="text-body-sm text-fg-muted">
          {t("verifyEmail.checkingLink")}
        </p>
      ) : null}
      <form
        className="space-y-stack-md"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {!signedIn ? (
          <FormField label={t("common.email")} required>
            {(field) => (
              <Input
                {...field}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            )}
          </FormField>
        ) : null}
        <FormField label={t("common.code")} required>
          {(field) => (
            <Input
              {...field}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          )}
        </FormField>
        {notice ? <Alert tone="success">{notice}</Alert> : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Button type="submit" fullWidth loading={busy} disabled={!code.trim()}>
          {t("verifyEmail.verify")}
        </Button>
        <Button
          fullWidth
          variant="neutral"
          appearance="stroke"
          disabled={busy || (!signedIn && !email.trim())}
          onClick={() => void resend()}
        >
          {t("common.resend")}
        </Button>
      </form>
    </AuthPageShell>
  );
}
