"use client";

/* ==========================================================================
   /forgot-password and /reset-password
   --------------------------------------------------------------------------
   Forgot: identifier → the API answers a reset id and masked channels
   (empty when no account matches). The copy is the same either way. The
   reset id stays in this component's state only. The user picks a channel,
   gets a code, and sets the new password with it.
   Reset (link): `?token=` is read once and dropped from the URL.
   Both end at /login?reason=password-reset.
   ========================================================================== */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, FormField, Input } from "@/components/ui";
import * as authApi from "../auth.api";
import { authErrorPath } from "../authErrors";
import { useAuthText } from "../authText";
import { AuthPageShell } from "../AuthPageShell";
import type { ForgotPasswordResult } from "../auth.types";
import { useOneTimeToken } from "../useOneTimeToken";

const DONE = "/login?reason=password-reset";

function NewPasswordFields({
  password,
  confirm,
  onPassword,
  onConfirm,
  tried,
}: {
  password: string;
  confirm: string;
  onPassword: (v: string) => void;
  onConfirm: (v: string) => void;
  tried: boolean;
}) {
  const t = useAuthText();
  return (
    <>
      <FormField
        label={t("common.newPassword")}
        required
        error={
          tried && password.length < 8 ? t("common.passwordShort") : undefined
        }
      >
        {(field) => (
          <Input
            {...field}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => onPassword(event.target.value)}
          />
        )}
      </FormField>
      <FormField
        label={t("common.confirmPassword")}
        required
        error={
          tried && confirm !== password
            ? t("common.passwordMismatch")
            : undefined
        }
      >
        {(field) => (
          <Input
            {...field}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => onConfirm(event.target.value)}
          />
        )}
      </FormField>
    </>
  );
}

const valid = (password: string, confirm: string) =>
  password.length >= 8 && password.length <= 128 && password === confirm;

export function ForgotPasswordPage() {
  const t = useAuthText();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [found, setFound] = useState<ForgotPasswordResult | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tried, setTried] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (cause) {
      setError(t(authErrorPath(cause)));
    } finally {
      setBusy(false);
    }
  };

  const find = () =>
    act(async () => {
      setFound(await authApi.forgotPassword(identifier));
    });

  const send = (id: string) =>
    act(async () => {
      if (!found) return;
      await authApi.sendResetCode(found.resetId, id);
      setChannelId(id);
    });

  const reset = () => {
    setTried(true);
    if (!found || !code.trim() || !valid(password, confirm)) return;
    void act(async () => {
      await authApi.resetByCode(found.resetId, code.trim(), password);
      setPassword("");
      setConfirm("");
      router.push(DONE);
    });
  };

  return (
    <AuthPageShell title={t("forgot.title")} description={t("forgot.intro")}>
      {!found ? (
        <form
          className="space-y-stack-md"
          onSubmit={(event) => {
            event.preventDefault();
            if (identifier.trim().length >= 3) void find();
          }}
        >
          <FormField label={t("forgot.identifier")} required>
            {(field) => (
              <Input
                {...field}
                autoComplete="username"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
            )}
          </FormField>
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <Button
            type="submit"
            fullWidth
            loading={busy}
            disabled={identifier.trim().length < 3}
          >
            {t("common.continue")}
          </Button>
        </form>
      ) : (
        <form
          className="space-y-stack-md"
          onSubmit={(event) => {
            event.preventDefault();
            reset();
          }}
        >
          <p className="text-body-sm text-fg-muted">{t("forgot.sent")}</p>
          <div className="space-y-stack-sm">
            {found.channels.map((channel) => (
              <Button
                key={channel.id}
                fullWidth
                variant="neutral"
                appearance={channelId === channel.id ? "fill-stroke" : "stroke"}
                disabled={busy}
                onClick={() => void send(channel.id)}
              >
                {t("forgot.sendTo", { hint: channel.hint ?? "" })}
              </Button>
            ))}
          </div>
          {channelId ? (
            <>
              <p role="status" className="text-body-sm text-fg-muted">
                {t("common.codeSent")}
              </p>
              <FormField label={t("forgot.codeLabel")} required>
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
              <NewPasswordFields
                password={password}
                confirm={confirm}
                onPassword={setPassword}
                onConfirm={setConfirm}
                tried={tried}
              />
              <Button type="submit" fullWidth loading={busy}>
                {t("forgot.submit")}
              </Button>
            </>
          ) : null}
          {error ? <Alert tone="danger">{error}</Alert> : null}
        </form>
      )}
    </AuthPageShell>
  );
}

export function ResetPasswordPage() {
  const t = useAuthText();
  const router = useRouter();
  const token = useOneTimeToken();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tried, setTried] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setTried(true);
    if (!token || !valid(password, confirm)) return;
    setBusy(true);
    setError("");
    try {
      await authApi.resetByToken(token, password);
      setPassword("");
      setConfirm("");
      router.push(DONE);
    } catch (cause) {
      setError(t(authErrorPath(cause)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthPageShell title={t("reset.title")}>
      {token === null ? (
        <Alert tone="danger">{t("errors.linkInvalid")}</Alert>
      ) : (
        <form
          className="space-y-stack-md"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <NewPasswordFields
            password={password}
            confirm={confirm}
            onPassword={setPassword}
            onConfirm={setConfirm}
            tried={tried}
          />
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <Button
            type="submit"
            fullWidth
            loading={busy}
            disabled={token === undefined}
          >
            {t("reset.submit")}
          </Button>
        </form>
      )}
    </AuthPageShell>
  );
}
