"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Skeleton,
  buttonStyles,
} from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import { CAREGIVER_HOME } from "@/features/auth/auth";
import { setCaregiverViewing } from "@/lib/data/storage";
import { useIsMounted } from "@/lib/utils/useIsMounted";
import { useCaregiverInvite } from "./useCaregivers";

/* ==========================================================================
   The invite link a patient sends their caregiver
   --------------------------------------------------------------------------
   The caregiver signs in, or creates their own login through registration
   (POST /auth/register) — never the patient's — and comes back here to
   accept. Since Phase 2 there is no client-made account or session: the
   in-browser caregiver login that lived here is gone. Phase 3 (FE-ORG)
   moves the invite itself to the API (/invitations).
   ========================================================================== */

export default function CaregiverInvitePage({ id }: { id: string }) {
  const mounted = useIsMounted();
  const invite = useCaregiverInvite(id);

  return (
    <main className="mx-auto flex min-h-screen max-w-[560px] flex-col justify-center px-inset-md py-stack-xl">
      <p className="mb-stack-md text-center text-heading-4 text-fg-brand">
        NephroReach
      </p>
      {!mounted || invite.isPending ? (
        <Skeleton height={320} />
      ) : (
        <Body id={id} invite={invite} />
      )}
    </main>
  );
}

function Body({
  id,
  invite,
}: {
  id: string;
  invite: ReturnType<typeof useCaregiverInvite>;
}) {
  const { user } = useAuth();
  const grant = invite.grant;
  const [busy, setBusy] = useState(false);

  if (!grant || grant.status === "removed") {
    return (
      <Card>
        <EmptyState
          variant="bare"
          title="This invite is no longer valid"
          description="It may have been cancelled. Ask the patient to send a new one."
        />
      </Card>
    );
  }

  const finish = async (caregiverEmail: string) => {
    if (grant.status === "pending") await invite.accept();
    setCaregiverViewing(caregiverEmail, grant.patientEmail);
    /* A full load: the dashboard starts with this patient's data only. */
    window.location.assign(CAREGIVER_HOME);
  };

  const header = (
    <CardHeader
      title={`${grant.patientName} invited you`}
      description={`To be their caregiver (${grant.relationship.toLowerCase()}). You can help with everything in their NephroReach account, and they can remove you at any time.`}
    />
  );

  /* Already signed in. */
  if (user) {
    const same = user.email.toLowerCase() === grant.caregiverEmail;
    return (
      <Card>
        {header}
        <div className="mt-stack-lg">
          {same && user.role === "caregiver" ? (
            <Button
              fullWidth
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await finish(user.email);
              }}
            >
              {grant.status === "active"
                ? "Go to Caregiver Home"
                : "Accept invite"}
            </Button>
          ) : (
            <Alert tone="warning">
              You are signed in as {user.email}. This invite is for{" "}
              {grant.caregiverEmail}. Sign out, then open the link again.
            </Alert>
          )}
        </div>
      </Card>
    );
  }

  const back = encodeURIComponent(`/caregiver-invite/${id}`);
  return (
    <Card>
      {header}
      <p className="mt-stack-md text-body-sm text-fg-muted">
        Sign in as {grant.caregiverEmail}, or create your own login with that
        email, then accept here. This login is yours alone. It never opens{" "}
        {grant.patientName}&apos;s own account.
      </p>
      <div className="mt-stack-lg space-y-stack-sm">
        <Link
          href={`/login?next=${back}`}
          className={buttonStyles({ fullWidth: true })}
        >
          Sign in
        </Link>
        <Link
          href={`/registration?next=${back}`}
          className={buttonStyles({
            fullWidth: true,
            variant: "neutral",
            appearance: "stroke",
          })}
        >
          Create your caregiver login
        </Link>
      </div>
    </Card>
  );
}
