"use client";

/* ==========================================================================
   Re-authentication ("sudo") before a sensitive change
   --------------------------------------------------------------------------
   Turning MFA on or off, new backup codes, and later email/phone/password
   changes answer 403 `auth.sudo_required` until the user proves it is them
   again. `useSudo()` gives a page `withSudo(fn)`: run `fn`; on that 403 open
   this prompt; when it is confirmed, retry `fn` exactly once.

   The prompt offers what `GET /auth/sudo/options` lists: the password, a
   one-time code by email or text, or the user's own 2FA method. Codes and
   the password stay in component state only and are dropped on close.
   ========================================================================== */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  FormField,
  Input,
  Modal,
  SegmentedChoice,
} from "@/components/ui";
import { isApiError } from "@/lib/api/client";
import * as authApi from "./auth.api";
import { authErrorPath } from "./authErrors";
import { useAuthText } from "./authText";
import type { SudoOption } from "./auth.types";

export const SUDO_REQUIRED = "auth.sudo_required";

export function isSudoRequired(error: unknown): boolean {
  return isApiError(error, { status: 403, code: SUDO_REQUIRED });
}

/** Runs `fn`; on 403 sudo_required asks `confirm()` and retries once. */
export async function withSudo<T>(
  fn: () => Promise<T>,
  confirm: () => Promise<boolean>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isSudoRequired(error)) throw error;
    if (!(await confirm())) throw error;
    return fn();
  }
}

function optionLabel(option: SudoOption, t: (p: string) => string): string {
  if (option.kind === "password") return t("sudo.password");
  if (option.kind === "otp")
    return option.channel === "sms" ? t("sudo.sms") : t("sudo.email");
  if (option.type === "TOTP") return t("sudo.app");
  return option.type === "SMS_OTP" ? t("sudo.sms") : t("sudo.email");
}

function optionKey(option: SudoOption): string {
  return `${option.kind}:${option.channel ?? option.type ?? ""}`;
}

export function SudoPrompt({
  open,
  onDone,
}: {
  open: boolean;
  /** true when confirmed, false when cancelled. */
  onDone: (confirmed: boolean) => void;
}) {
  const t = useAuthText();
  const [options, setOptions] = useState<SudoOption[] | null>(null);
  const [chosen, setChosen] = useState<SudoOption | null>(null);
  const [secret, setSecret] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  /* Nothing typed survives a close. */
  const finish = (confirmed: boolean) => {
    setOptions(null);
    setChosen(null);
    setSecret("");
    setSent(false);
    setError("");
    onDone(confirmed);
  };

  useEffect(() => {
    if (!open) return;
    let live = true;
    authApi
      .sudoOptions()
      .then((list) => {
        if (!live) return;
        setOptions(list);
        setChosen(list[0] ?? null);
      })
      .catch((cause: unknown) => {
        if (live) setError(t(authErrorPath(cause)));
      });
    return () => {
      live = false;
    };
  }, [open, t]);

  const needsSend =
    chosen?.kind === "otp" || (chosen?.kind === "2fa" && chosen.requiresSend);

  const send = async () => {
    if (!chosen) return;
    setBusy(true);
    setError("");
    try {
      if (chosen.kind === "otp" && chosen.channel)
        await authApi.sudoOtpRequest(chosen.channel);
      else if (chosen.kind === "2fa" && chosen.type)
        await authApi.sudo2faSend(chosen.type);
      setSent(true);
    } catch (cause) {
      setError(t(authErrorPath(cause)));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!chosen || !secret) return;
    setBusy(true);
    setError("");
    try {
      if (chosen.kind === "password") await authApi.sudoPassword(secret);
      else if (chosen.kind === "otp" && chosen.channel)
        await authApi.sudoOtpConfirm(chosen.channel, secret.trim());
      else if (chosen.type) await authApi.sudo2fa(chosen.type, secret.trim());
      finish(true);
    } catch (cause) {
      setSecret("");
      setError(t(authErrorPath(cause)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => finish(false)}
      size="small"
      title={t("sudo.title")}
      description={t("sudo.intro")}
      footer={
        <>
          <Button
            variant="neutral"
            appearance="stroke"
            onClick={() => finish(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="sudo-form"
            loading={busy}
            disabled={!chosen || !secret || (needsSend && !sent)}
          >
            {t("sudo.confirm")}
          </Button>
        </>
      }
    >
      <form
        id="sudo-form"
        className="space-y-stack-md"
        onSubmit={(event) => {
          event.preventDefault();
          void confirm();
        }}
      >
        {options && options.length > 1 ? (
          <SegmentedChoice
            label={t("twoFactor.method")}
            options={options.map((option) => ({
              value: optionKey(option),
              label: optionLabel(option, t),
            }))}
            value={chosen ? optionKey(chosen) : ""}
            onChange={(key) => {
              setChosen(options.find((o) => optionKey(o) === key) ?? null);
              setSecret("");
              setSent(false);
              setError("");
            }}
          />
        ) : null}

        {chosen && needsSend ? (
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
              <span className="text-body-sm text-fg-muted" role="status">
                {t("common.codeSent")}
                {chosen.hint ? ` (${chosen.hint})` : ""}
              </span>
            ) : null}
          </div>
        ) : null}

        {chosen ? (
          <FormField
            label={
              chosen.kind === "password"
                ? t("sudo.passwordLabel")
                : t("common.code")
            }
            required
          >
            {(field) => (
              <Input
                {...field}
                type={chosen.kind === "password" ? "password" : "text"}
                inputMode={chosen.kind === "password" ? undefined : "numeric"}
                autoComplete={
                  chosen.kind === "password"
                    ? "current-password"
                    : "one-time-code"
                }
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
              />
            )}
          </FormField>
        ) : null}

        {error ? <Alert tone="danger">{error}</Alert> : null}
      </form>
    </Modal>
  );
}

/** A page's sudo prompt and its `withSudo`. Render `prompt` once. */
export function useSudo() {
  const [open, setOpen] = useState(false);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const ask = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setOpen(true);
      }),
    [],
  );

  const done = useCallback((ok: boolean) => {
    setOpen(false);
    resolver.current?.(ok);
    resolver.current = null;
  }, []);

  const run = useCallback(
    <T,>(fn: () => Promise<T>) => withSudo(fn, ask),
    [ask],
  );

  return {
    withSudo: run,
    prompt: <SudoPrompt open={open} onDone={done} />,
  };
}
