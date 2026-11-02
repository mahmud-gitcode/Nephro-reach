"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Skeleton, buttonStyles } from "@/components/ui";
import { AuthPageShell } from "@/features/auth/AuthPageShell";
import { useAuth } from "@/features/auth/AuthContext";
import { availableContexts } from "@/features/auth/auth.mapping";
import {
  acceptInvitation,
  declineInvitation,
  previewInvitation,
  type InvitationPreview,
} from "@/features/caregivers/caregivers.api";
import { isApiError } from "@/lib/api/client";
import { signOut } from "@/lib/data/session";
import { useLanguageCode } from "@/context/LanguageContext";
import { usePortalText } from "./portalText";

/* ==========================================================================
   /invitations/[token]: one page for staff (D3) and caregiver (D1) links
   --------------------------------------------------------------------------
   - The preview is public and minimal (kind, organisation or inviter's
     first name, role or preset, expiry, status). It never names the
     invited email, so neither does this page.
   - Accepting needs a session with the invited email; the server refuses
     any other (403 `invitations.invitation_for_other_email`). A link is
     single use and expires; a revoked or replaced link is refused.
   - Staff acceptance: the server ends every session of the account (its
     access changed, spec 025 §3), so the page signs out and sends the user
     to sign in again, then into the new office (and MFA set-up if needed).
   - Token hygiene: the token is only in the path. It is never stored, logged
     or put in a query key; the page sends no Referer (no-referrer meta here,
     the response header is a Lead delegation in next.config.ts).
   ========================================================================== */

type Load =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "ready"; preview: InvitationPreview };

const ERROR_KEYS: Record<string, string> = {
  "invitations.invitation_for_other_email": "errors.otherEmail",
  "invitations.invitation_expired": "errors.expired",
  "invitations.invitation_no_longer_valid": "errors.noLongerValid",
  "invitations.already_a_member": "errors.alreadyMember",
  "invitations.already_a_caregiver": "errors.alreadyCaregiver",
  "invitations.organization_closed": "errors.organizationClosed",
  "invitations.cannot_be_own_caregiver": "errors.ownCaregiver",
};

/** The dictionary key for a refusal: by the server's code, then status. */
export function invitationErrorKey(error: unknown): string {
  if (!isApiError(error)) return "invitation.errors.generic";
  const code = error.code ?? "";
  const byCode =
    ERROR_KEYS[code] ??
    Object.entries(ERROR_KEYS).find(([k]) =>
      code.endsWith(k.split(".")[1]),
    )?.[1];
  if (byCode) return `invitation.${byCode}`;
  if (error.status === 410) return "invitation.errors.expired";
  if (error.status === 409) return "invitation.errors.noLongerValid";
  return "invitation.errors.generic";
}

function formatDay(iso: string, language: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(language === "ES" ? "es-US" : "en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function InvitationPage({ token }: { token: string }) {
  const { status, refreshContext } = useAuth();
  const router = useRouter();
  const t = usePortalText();
  const language = useLanguageCode();
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);
  /* Kept in a ref so no state, cache or devtools panel holds a copy. */
  const tokenRef = useRef(token);

  useEffect(() => {
    tokenRef.current = token;
    let live = true;
    previewInvitation(token)
      .then((preview) => live && setLoad({ kind: "ready", preview }))
      .catch(() => live && setLoad({ kind: "invalid" }));
    return () => {
      live = false;
    };
  }, [token]);

  const here = typeof window === "undefined" ? "" : window.location.pathname;
  const next = encodeURIComponent(here);

  if (load.kind === "loading") {
    return (
      <AuthPageShell title={t("invitation.loading")} backToSignIn={false}>
        <Skeleton height={120} />
      </AuthPageShell>
    );
  }
  if (load.kind === "invalid") {
    return (
      <AuthPageShell
        title={t("invitation.invalidTitle")}
        description={t("invitation.invalidBody")}
      >
        {null}
      </AuthPageShell>
    );
  }

  const { preview } = load;
  const staff = preview.kind === "STAFF";
  const preset = preview.preset ? t(`presets.${preview.preset}`) : "";
  const title = staff
    ? t("invitation.staffTitle", {
        organization: preview.organizationName ?? "",
      })
    : t("invitation.caregiverTitle");
  const body = staff
    ? t("invitation.staffBody", {
        organization: preview.organizationName ?? "",
        role: preview.role ?? "",
      })
    : preview.inviterFirstName
      ? t("invitation.caregiverBody", {
          inviter: preview.inviterFirstName,
          preset,
        })
      : t("invitation.caregiverBodyNoName", { preset });

  const closed = preview.status !== "PENDING";

  const accept = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await acceptInvitation(tokenRef.current);
      if (result.kind === "STAFF") {
        /* The server ended this account's sessions (its access changed). */
        void signOut({
          destination: "/login?reason=access-changed&next=%2Fdashboard",
        });
        return;
      }
      const ctx = await refreshContext();
      const several = ctx ? availableContexts(ctx).length > 1 : false;
      router.push(
        several
          ? `/select-portal?next=${encodeURIComponent("/dashboard/caregiver")}`
          : "/dashboard/caregiver",
      );
    } catch (cause) {
      setBusy(false);
      setError(t(invitationErrorKey(cause)));
    }
  };

  const decline = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await declineInvitation(tokenRef.current);
      setDeclined(true);
    } catch (cause) {
      setError(t(invitationErrorKey(cause)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthPageShell title={title} description={body}>
      <div className="space-y-stack-md">
        {closed ? (
          <Alert tone="warning">
            {t(`invitation.status.${preview.status}`)}
          </Alert>
        ) : declined ? (
          <Alert tone="info">{t("invitation.declined")}</Alert>
        ) : (
          <>
            <p className="text-body-sm text-fg-muted">
              {t("invitation.expires", {
                date: formatDay(preview.expiresAt, language),
              })}
            </p>
            {error ? <Alert tone="danger">{error}</Alert> : null}
            {status === "signed-in" ? (
              <div className="flex flex-wrap gap-inline-sm">
                <Button onClick={() => void accept()} disabled={busy}>
                  {t("invitation.accept")}
                </Button>
                <Button
                  variant="neutral"
                  appearance="fill-stroke"
                  onClick={() => void decline()}
                  disabled={busy}
                >
                  {t("invitation.decline")}
                </Button>
              </div>
            ) : status === "loading" ? (
              <Skeleton height={44} />
            ) : (
              <>
                <p className="text-body-sm text-fg">
                  {t("invitation.signedOut")}
                </p>
                <div className="flex flex-wrap gap-inline-sm">
                  <Link
                    href={`/login?next=${next}`}
                    rel="noreferrer"
                    className={buttonStyles({})}
                  >
                    {t("invitation.signIn")}
                  </Link>
                  <Link
                    href={`/registration?next=${next}`}
                    rel="noreferrer"
                    className={buttonStyles({
                      variant: "neutral",
                      appearance: "fill-stroke",
                    })}
                  >
                    {t("invitation.createAccount")}
                  </Link>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AuthPageShell>
  );
}
