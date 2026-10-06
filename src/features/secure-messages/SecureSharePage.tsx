"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Download, ExternalLink, ShieldCheck } from "lucide-react";
import {
  Alert,
  Button,
  buttonStyles,
  Card,
  FormField,
  Input,
  Skeleton,
} from "@/components/ui";
import {
  SHARE_KINDS,
  isEmail,
  shareByToken,
  type OutsideShare,
} from "./shares";
import { useShares } from "./useShares";

/* ==========================================================================
   The recipient's secure page — one shared item, nothing else
   --------------------------------------------------------------------------
   Opened from the link a member sent (client, 2026-10-05). The recipient
   confirms who they are, then sees and can download only that item. No
   NephroReach account, no portal, no reply box. The page ends with "Learn
   more about NephroReach" and "Request information for your organization"
   — ongoing tools come with an organisational account.

   Frontend phase: verification is confirming the email the link was sent
   to; the real identity check comes with the backend.
   ========================================================================== */

const NEPHROREACH_URL = "https://nephroreach.com";

function when(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function VerifyForm({
  share,
  onVerified,
}: {
  share: OutsideShare;
  onVerified: () => void;
}) {
  const store = useShares();
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState(share.recipientOrg);
  const [email, setEmail] = useState("");
  const [tried, setTried] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const errors = {
    name: name.trim() ? undefined : "Enter your full name.",
    email: isEmail(email) ? undefined : "Enter your email address.",
  };

  return (
    <Card as="section" padding="small" className="space-y-stack-md">
      <div className="flex items-center gap-inline-sm">
        <ShieldCheck aria-hidden="true" className="size-5 text-fg-brand" />
        <h2 className="text-heading-4 text-fg">Verify to view</h2>
      </div>
      <p className="text-body-sm text-fg-secondary">
        A NephroReach member shared information with you. To protect their
        privacy, confirm who you are and the email address this link was sent
        to.
      </p>
      <form
        className="space-y-stack-md"
        onSubmit={async (event) => {
          event.preventDefault();
          setTried(true);
          setMismatch(false);
          if (errors.name || errors.email) return;
          const ok = await store.verify(share.id, {
            email,
            name,
            organization,
          });
          if (ok) onVerified();
          else setMismatch(true);
        }}
      >
        <FormField
          label="Your full name"
          required
          error={tried ? errors.name : undefined}
        >
          {(field) => (
            <Input
              {...field}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </FormField>
        <FormField label="Organization">
          {(field) => (
            <Input
              {...field}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          )}
        </FormField>
        <FormField
          label="Email this link was sent to"
          required
          error={tried ? errors.email : undefined}
        >
          {(field) => (
            <Input
              {...field}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </FormField>
        {mismatch ? (
          <Alert tone="danger">
            That email does not match the address this link was sent to.
          </Alert>
        ) : null}
        <p className="text-caption text-fg-muted">
          Demo: full identity verification is completed by NephroReach when the
          secure backend is connected.
        </p>
        <div className="flex justify-end">
          <Button type="submit" loading={store.isSaving}>
            Verify and view
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SharedItem({ share }: { share: OutsideShare }) {
  const store = useShares();
  const kind = SHARE_KINDS.find((k) => k.id === share.kind)!;
  const attachment = share.attachment;
  const isImage = attachment?.type.startsWith("image/");

  return (
    <Card as="article" padding="small" className="space-y-stack-md">
      <div>
        <p className="text-caption text-fg-muted">
          {kind.en} · from {share.patientName} · {when(share.sharedAt)}
        </p>
        <h2 className="mt-stack-xs text-heading-3 text-fg">{share.subject}</h2>
      </div>
      {share.body ? (
        <p className="text-body-md whitespace-pre-line text-fg-secondary">
          {share.body}
        </p>
      ) : null}
      {attachment ? (
        <div className="space-y-stack-sm rounded-card-nested border border-line p-inset-sm">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- a data URL the member shared
            <img
              src={attachment.dataUrl}
              alt={`Photo shared by ${share.patientName}`}
              className="max-h-96 w-full rounded-control object-contain"
            />
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-inline-md">
            <span className="text-label-md text-fg">{attachment.name}</span>
            <a
              href={attachment.dataUrl}
              download={attachment.name}
              onClick={() => store.downloaded(share.id)}
              className={buttonStyles({
                size: "small",
                variant: "neutral",
                appearance: "fill-stroke",
              })}
            >
              <Download aria-hidden="true" />
              Download
            </a>
          </div>
        </div>
      ) : null}
      <Alert tone="info" live={false}>
        You are seeing only what {share.patientName} chose to share with you.
        This page does not give access to their NephroReach account.
      </Alert>
    </Card>
  );
}

function LearnMore({ share }: { share: OutsideShare }) {
  const store = useShares();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: share.verifiedBy?.name ?? "",
    organization: share.verifiedBy?.organization ?? share.recipientOrg,
    email: share.recipientEmail,
    phone: "",
  });
  const set = (change: Partial<typeof form>) =>
    setForm((current) => ({ ...current, ...change }));

  return (
    <Card as="section" padding="small" className="space-y-stack-md">
      <h2 className="text-heading-4 text-fg">
        Bring your renal communication into one workspace
      </h2>
      <p className="text-body-sm text-fg-secondary">
        NephroReach gives organizations secure patient communication, referrals,
        care coordination, education enrollment, reporting and more.
      </p>
      <div className="flex flex-wrap gap-inline-sm">
        <a
          href={NEPHROREACH_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonStyles({
            variant: "neutral",
            appearance: "fill-stroke",
          })}
        >
          Learn more about NephroReach
          <ExternalLink aria-hidden="true" />
        </a>
        {!done ? (
          <Button onClick={() => setOpen(true)} disabled={open}>
            Request information for your organization
          </Button>
        ) : null}
      </div>
      {done ? (
        <Alert tone="success">
          Thank you. The NephroReach team will contact you about an
          organizational account.
        </Alert>
      ) : open ? (
        <form
          className="grid gap-stack-md sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!form.name.trim() || !isEmail(form.email)) return;
            store.requestInfo(share.id, form);
            setDone(true);
          }}
        >
          <FormField label="Name" required>
            {(field) => (
              <Input
                {...field}
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Organization">
            {(field) => (
              <Input
                {...field}
                value={form.organization}
                onChange={(e) => set({ organization: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Email" required>
            {(field) => (
              <Input
                {...field}
                type="email"
                value={form.email}
                onChange={(e) => set({ email: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Phone">
            {(field) => (
              <Input
                {...field}
                type="tel"
                value={form.phone}
                onChange={(e) => set({ phone: e.target.value })}
              />
            )}
          </FormField>
          <div className="flex justify-end gap-inline-sm sm:col-span-2">
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Send request</Button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}

export default function SecureSharePage({ token }: { token: string }) {
  const store = useShares();
  const share = shareByToken(store.state, token);
  const [verified, setVerified] = useState(false);
  const logged = useRef(false);

  /* Log the first open of this page. */
  useEffect(() => {
    if (share && !logged.current) {
      logged.current = true;
      void store.opened(share.id);
    }
  }, [share, store]);

  let body: React.ReactNode;
  if (store.isPending) {
    body = <Skeleton height={320} />;
  } else if (!share) {
    body = (
      <Card padding="small">
        <h2 className="text-heading-4 text-fg">This link is not valid</h2>
        <p className="mt-stack-xs text-body-sm text-fg-secondary">
          The link may be mistyped or no longer available. Ask the person who
          shared it to send it again.
        </p>
      </Card>
    );
  } else if (!verified) {
    body = <VerifyForm share={share} onVerified={() => setVerified(true)} />;
  } else {
    body = (
      <>
        <SharedItem share={share} />
        <LearnMore share={share} />
      </>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-4 px-4 py-10">
      <header className="flex items-center gap-inline-md">
        <Image
          src="/images/logo.svg"
          alt="NephroReach"
          width={140}
          height={40}
        />
        <span className="text-label-md text-fg-muted">Secure Share</span>
      </header>
      {body}
    </main>
  );
}
