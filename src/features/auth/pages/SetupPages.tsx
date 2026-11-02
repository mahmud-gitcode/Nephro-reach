"use client";

/* ==========================================================================
   /setup/patient and /setup/mfa
   --------------------------------------------------------------------------
   Patient setup: an account with no context at all (no patient record, no
   caregiving, no membership) creates its own patient record
   (`POST /me/patient`). The name is prefilled from the account as an
   editable suggestion; the date comes from a date input, already
   YYYY-MM-DD.

   MFA: forced for an office or platform context while `mfaSetupRequired`
   (staff cannot reach patient data before enrolling: the API answers 403
   `access.mfa_required`); otherwise the self-service page where patients
   and caregivers turn MFA on or off (D17), both behind sudo.
   ========================================================================== */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, FormField, Input, Skeleton } from "@/components/ui";
import { useAuth } from "../AuthContext";
import { isStaffChoice, routeAfterSignIn } from "../auth.mapping";
import * as authApi from "../auth.api";
import { authErrorPath } from "../authErrors";
import { useAuthText } from "../authText";
import { AuthPageShell } from "../AuthPageShell";
import type { TwoFactorMethod } from "../auth.types";
import { MfaEnrolment } from "../mfa/MfaEnrolment";
import { MfaMethodList } from "../mfa/MfaMethodList";
import { useSudo } from "../SudoPrompt";

function nextParam(): string | null {
  return new URLSearchParams(window.location.search).get("next");
}

/** Signed out → /login?next=<this page>. */
function useSignedInOnly(path: string) {
  const { status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === "signed-out")
      router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [status, router, path]);
  return status;
}

function splitName(name: string | null): { first: string; last: string } {
  const value = (name ?? "").trim();
  const at = value.lastIndexOf(" ");
  return at > 0
    ? { first: value.slice(0, at), last: value.slice(at + 1) }
    : { first: value, last: "" };
}

export function SetupPatientPage() {
  const t = useAuthText();
  const router = useRouter();
  const status = useSignedInOnly("/setup/patient");
  const { context, refreshContext } = useAuth();
  const suggested = splitName(context?.user.name ?? null);
  const [first, setFirst] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const [dob, setDob] = useState("");
  const [tried, setTried] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const firstName = (first ?? suggested.first).trim();
  const lastName = (last ?? suggested.last).trim();

  /* Someone who already has a context has nothing to set up. */
  useEffect(() => {
    if (
      context &&
      (context.patient ||
        context.caregiving.length > 0 ||
        context.memberships.length > 0 ||
        context.platform)
    )
      router.replace(routeAfterSignIn(context, null));
  }, [context, router]);

  const save = async () => {
    setTried(true);
    if (!firstName || !lastName) return;
    setBusy(true);
    setError("");
    try {
      await authApi.createMyPatient({
        firstName,
        lastName,
        ...(dob ? { dateOfBirth: dob } : {}),
      });
      const fresh = await refreshContext();
      router.push(fresh ? routeAfterSignIn(fresh, null) : "/dashboard");
    } catch (cause) {
      setError(t(authErrorPath(cause)));
    } finally {
      setBusy(false);
    }
  };

  if (status !== "signed-in") {
    return (
      <AuthPageShell title={t("setupPatient.title")} backToSignIn={false}>
        <Skeleton height={160} />
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title={t("setupPatient.title")}
      description={t("setupPatient.intro")}
      backToSignIn={false}
    >
      <form
        className="space-y-stack-md"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <FormField
          label={t("setupPatient.firstName")}
          required
          error={tried && !firstName ? t("common.required") : undefined}
        >
          {(field) => (
            <Input
              {...field}
              autoComplete="given-name"
              maxLength={100}
              value={first ?? suggested.first}
              onChange={(event) => setFirst(event.target.value)}
            />
          )}
        </FormField>
        <FormField
          label={t("setupPatient.lastName")}
          required
          error={tried && !lastName ? t("common.required") : undefined}
        >
          {(field) => (
            <Input
              {...field}
              autoComplete="family-name"
              maxLength={100}
              value={last ?? suggested.last}
              onChange={(event) => setLast(event.target.value)}
            />
          )}
        </FormField>
        <FormField label={t("setupPatient.dateOfBirth")}>
          {(field) => (
            <Input
              {...field}
              type="date"
              autoComplete="bday"
              value={dob}
              onChange={(event) => setDob(event.target.value)}
            />
          )}
        </FormField>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Button type="submit" fullWidth loading={busy}>
          {t("setupPatient.save")}
        </Button>
      </form>
    </AuthPageShell>
  );
}

export function SetupMfaPage() {
  const t = useAuthText();
  const router = useRouter();
  const status = useSignedInOnly("/setup/mfa");
  const { context, choice, refreshContext } = useAuth();
  const { withSudo, prompt } = useSudo();
  const [methods, setMethods] = useState<TwoFactorMethod[] | null>(null);
  const [error, setError] = useState("");

  const forced = Boolean(
    context?.user.mfaSetupRequired && choice && isStaffChoice(choice),
  );

  /* Bumped after a change, to read the methods again. */
  const [reads, setReads] = useState(0);
  useEffect(() => {
    if (status !== "signed-in") return;
    let live = true;
    authApi
      .listMfaMethods()
      .then((list) => {
        if (!live) return;
        setMethods(list);
        setError("");
      })
      .catch((cause: unknown) => {
        if (live) setError(t(authErrorPath(cause)));
      });
    return () => {
      live = false;
    };
  }, [status, reads, t]);

  const afterChange = async () => {
    const fresh = await refreshContext();
    if (forced && fresh && !fresh.user.mfaSetupRequired) {
      router.push(routeAfterSignIn(fresh, nextParam()));
      return;
    }
    setReads((n) => n + 1);
  };

  if (status !== "signed-in" || methods === null) {
    return (
      <AuthPageShell title={t("mfa.title")} backToSignIn={false}>
        {error ? (
          <Alert tone="danger">{error}</Alert>
        ) : (
          <Skeleton height={160} />
        )}
      </AuthPageShell>
    );
  }

  const enabled = methods.filter((m) => m.isEnabled);
  return (
    <AuthPageShell
      title={t("mfa.title")}
      description={enabled.length > 0 ? t("mfa.on") : t("mfa.off")}
      backToSignIn={false}
    >
      <div className="space-y-stack-lg">
        {forced ? <Alert tone="warning">{t("mfa.required")}</Alert> : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {enabled.length > 0 ? (
          <MfaMethodList
            methods={methods}
            withSudo={withSudo}
            onChanged={() => void afterChange()}
          />
        ) : null}
        {!enabled.some((m) => m.type === "TOTP") ? (
          <MfaEnrolment withSudo={withSudo} onDone={() => void afterChange()} />
        ) : null}
        {!forced && context ? (
          <Button
            fullWidth
            variant="neutral"
            appearance="stroke"
            onClick={() => router.push(routeAfterSignIn(context, nextParam()))}
          >
            {t("mfa.goOn")}
          </Button>
        ) : null}
      </div>
      {prompt}
    </AuthPageShell>
  );
}
