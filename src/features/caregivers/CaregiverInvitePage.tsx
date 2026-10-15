"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HandHeart } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  EmptyState,
  FormField,
  Input,
  Skeleton,
  buttonStyles,
} from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import {
  CAREGIVER_HOME,
  accountRole,
  registerCaregiver,
} from "@/features/auth/auth";
import { setCaregiverViewing } from "@/lib/data/storage";
import { useIsMounted } from "@/lib/utils/useIsMounted";
import { useCaregiverInvite } from "./useCaregivers";

/* ==========================================================================
   The invite link a patient sends their caregiver
   --------------------------------------------------------------------------
   The caregiver makes their own login here — never the patient's — and
   accepts. An email that already has a caregiver account signs in instead;
   one that belongs to a member or an organization cannot be used, so one
   login never mixes a patient's own record with someone else's.
   ========================================================================== */

const LOGIN = `/login?next=${encodeURIComponent(CAREGIVER_HOME)}`;

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
  const { user, loginAs } = useAuth();
  const grant = invite.grant;
  const [name, setName] = useState(grant?.caregiverName ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tried, setTried] = useState(false);
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

  const existing = accountRole(grant.caregiverEmail);
  if (existing === "caregiver") {
    return (
      <Card>
        {header}
        <p className="mt-stack-md text-body-sm text-fg-muted">
          {grant.caregiverEmail} already has a caregiver login. Sign in and
          accept from your Home page.
        </p>
        <Link
          href={LOGIN}
          className={`${buttonStyles({ fullWidth: true })} mt-stack-lg`}
        >
          Sign in
        </Link>
      </Card>
    );
  }
  if (existing) {
    return (
      <Card>
        {header}
        <Alert tone="warning" className="mt-stack-md">
          {grant.caregiverEmail} is already used by another NephroReach account.
          Ask {grant.patientName} to invite a different email for caregiving.
        </Alert>
      </Card>
    );
  }

  const nameError = tried && !name.trim() ? "Enter your name." : undefined;
  const passwordError =
    tried && password.length < 8 ? "Use at least 8 characters." : undefined;
  const confirmError =
    tried && confirm !== password ? "The passwords do not match." : undefined;

  return (
    <Card>
      {header}
      <form
        className="mt-stack-lg space-y-stack-md"
        onSubmit={async (e) => {
          e.preventDefault();
          setTried(true);
          if (!name.trim() || password.length < 8 || confirm !== password)
            return;
          setBusy(true);
          const result = registerCaregiver({
            name,
            email: grant.caregiverEmail,
            password,
          });
          if ("error" in result) {
            setBusy(false);
            return;
          }
          loginAs(result.user);
          await finish(result.user.email);
        }}
      >
        <p className="flex items-center gap-inline-sm text-label-md text-fg">
          <HandHeart aria-hidden className="size-5 text-fg-brand" />
          Create your caregiver login
        </p>
        <FormField label="Your name" required error={nameError}>
          {(field) => (
            <Input
              {...field}
              value={name}
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </FormField>
        <FormField label="Email">
          {(field) => (
            <Input {...field} value={grant.caregiverEmail} readOnly />
          )}
        </FormField>
        <FormField label="Password" required error={passwordError}>
          {(field) => (
            <Input
              {...field}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </FormField>
        <FormField label="Confirm password" required error={confirmError}>
          {(field) => (
            <Input
              {...field}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}
        </FormField>
        <Button type="submit" fullWidth disabled={busy}>
          Create login and accept
        </Button>
        <p className="text-center text-caption text-fg-muted">
          Invite {id.slice(-5)} · This login is yours alone. It never opens{" "}
          {grant.patientName}&apos;s own account.
        </p>
      </form>
    </Card>
  );
}
