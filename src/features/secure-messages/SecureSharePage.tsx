"use client";

import { isSafeFileUrl } from "@/lib/utils/safeUrl";
import React, { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  ExternalLink,
  MailCheck,
  Send,
  ShieldCheck,
} from "lucide-react";
import {
  Alert,
  Button,
  buttonStyles,
  Card,
  FormField,
  Input,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { isApiError } from "@/lib/api/client";
import {
  MAX_RECIPIENT_REPLIES,
  isEmail,
  isShareToken,
  kindLabel,
} from "./shares";
import {
  getSharedAttachment,
  getSharedContent,
  getSharedLink,
  replyToShare,
  requestInfoFromShare,
  requestSharedCode,
  verifySharedLink,
  type ApiSharedContent,
  type ApiSharedLink,
} from "./shares.api";

/* ==========================================================================
   The recipient's secure page — one shared item, nothing else
   --------------------------------------------------------------------------
   Opened from the link NephroReach emailed (client, 2026-10-05). No
   NephroReach account, no portal. Phase 11: the server's flow.

   1. The link's teaser (`GET /shared/:token`): who shared what, never the
      content. An unknown, revoked or mistyped link reads "not valid"; an
      expired one says so.
   2. "Email me a code": the server sends a six-digit code to the address
      the link was sent to; the recipient types it with their name.
   3. The server answers with a share session. It lives only in this page's
      memory (never storage, a cookie or a cache key): a reload asks for a
      new code. Every later call sends it as `x-share-session`; the client
      sends these calls without cookies, the office header or a Referer.
   4. The content, the attachment (a short-lived link, asked for when
      shown), up to `maxReplies` replies (the server counts) and "Request
      information for your organization".

   If the sender stops sharing, every call is refused and the page goes
   back to "not valid", even mid-session.
   ========================================================================== */

const NEPHROREACH_URL = "https://nephroreach.com";

/* One fixed key: the raw token never goes into a query key (devtools and
   error logs would show it), and nothing is kept after the page leaves. */
const TEASER_KEY = ["shared-link", "current"] as const;
const CONTENT_KEY = ["shared-link", "current", "content"] as const;
const ATTACHMENT_KEY = ["shared-link", "current", "attachment"] as const;

function when(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** The server's error code, without its module prefix. */
function codeOf(error: unknown): string | null {
  if (!isApiError(error) || !error.code) return null;
  return error.code.replace(/^sharing\./, "");
}

/** The link no longer opens anything: unknown, revoked or expired. */
function isGone(error: unknown): boolean {
  return (
    isApiError(error, { status: 404 }) || isApiError(error, { status: 410 })
  );
}

/** What the server said, or a plain fallback. */
function serverText(error: unknown, fallback: string): string {
  if (isApiError(error) && error.status < 500 && error.messages.length)
    return error.messages.join(" ");
  return fallback;
}

function NotValid({ expired }: { expired?: boolean }) {
  return (
    <Card padding="small">
      <h2 className="text-heading-4 text-fg">
        {expired ? "This link has expired" : "This link is not valid"}
      </h2>
      <p className="mt-stack-xs text-body-sm text-fg-secondary">
        {expired
          ? "Links stop working after a while to protect the information. Ask the person who shared it to send it again."
          : "The link may be mistyped or no longer available. Ask the person who shared it to send it again."}
      </p>
    </Card>
  );
}

function VerifyForm({
  token,
  teaser,
  notice,
  onVerified,
}: {
  token: string;
  teaser: ApiSharedLink;
  /** Why the recipient is back here (an expired session). */
  notice?: string;
  onVerified: (session: string) => void;
}) {
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [code, setCode] = useState("");
  const [tried, setTried] = useState(false);
  const send = useMutation({ mutationFn: () => requestSharedCode(token) });
  const verify = useMutation({
    mutationFn: () =>
      verifySharedLink(token, {
        code: code.trim(),
        name: name.trim(),
        ...(organization.trim() ? { organization: organization.trim() } : {}),
      }),
    onSuccess: (answer) => onVerified(answer.sessionToken),
  });
  const errors = {
    name: name.trim() ? undefined : "Enter your full name.",
    code: /^\d{6}$/.test(code.trim())
      ? undefined
      : "Enter the 6-digit code from the email.",
  };
  const locked = codeOf(verify.error) === "verification_locked";

  return (
    <Card as="section" padding="small" className="space-y-stack-md">
      <div className="flex items-center gap-inline-sm">
        <ShieldCheck aria-hidden="true" className="size-5 text-fg-brand" />
        <h2 className="text-heading-4 text-fg">Verify to view</h2>
      </div>
      <p className="text-body-sm text-fg-secondary">
        {teaser.sharedByName} shared {kindLabel(teaser.kind).toLowerCase()} with
        you on {when(teaser.sharedAt)}. To protect their privacy, we email a
        code to the address this link was sent to.
      </p>
      {notice ? <Alert tone="warning">{notice}</Alert> : null}
      {send.data ? (
        <Alert tone="success" icon={<MailCheck aria-hidden="true" />}>
          We sent a code to {send.data.sentTo}. It works for{" "}
          {Math.max(1, Math.round(send.data.expiresIn / 60))} minutes.
        </Alert>
      ) : null}
      {send.error ? (
        <Alert tone="danger">
          {serverText(send.error, "The code could not be sent. Try again.")}
        </Alert>
      ) : null}
      <div>
        <Button
          variant={send.data ? "neutral" : undefined}
          appearance={send.data ? "fill-stroke" : undefined}
          loading={send.isPending}
          onClick={() => send.mutate()}
        >
          {send.data ? "Send a new code" : "Email me a code"}
        </Button>
      </div>
      <form
        className="space-y-stack-md"
        onSubmit={(event) => {
          event.preventDefault();
          setTried(true);
          if (errors.name || errors.code || locked) return;
          verify.mutate();
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
              maxLength={120}
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </FormField>
        <FormField label="Organization">
          {(field) => (
            <Input
              {...field}
              value={organization}
              maxLength={160}
              autoComplete="organization"
              onChange={(e) => setOrganization(e.target.value)}
            />
          )}
        </FormField>
        <FormField
          label="Code from the email"
          required
          error={tried ? errors.code : undefined}
        >
          {(field) => (
            <Input
              {...field}
              value={code}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          )}
        </FormField>
        {verify.error ? (
          <Alert tone="danger">
            {serverText(
              verify.error,
              "That code did not work. Check it, or send a new one.",
            )}
          </Alert>
        ) : null}
        <div className="flex justify-end">
          <Button type="submit" loading={verify.isPending} disabled={locked}>
            Verify and view
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SharedAttachment({
  token,
  session,
  content,
}: {
  token: string;
  session: string;
  content: ApiSharedContent;
}) {
  const attachment = content.attachment!;
  const name = attachment.originalName ?? "Attachment";
  const isImage = attachment.contentType.startsWith("image/");
  const [failed, setFailed] = useState(false);
  /* A picture shows as itself: its short-lived link is asked for while it
     is on screen and dropped with the page. */
  const preview = useQuery({
    queryKey: ATTACHMENT_KEY,
    queryFn: () => getSharedAttachment(token, session),
    enabled: isImage,
    gcTime: 0,
    staleTime: 30_000,
    retry: false,
  });
  const previewUrl =
    preview.data && isSafeFileUrl(preview.data.url) ? preview.data.url : null;

  async function download() {
    setFailed(false);
    try {
      const { url } = await getSharedAttachment(token, session);
      if (!isSafeFileUrl(url) || url.startsWith("data:")) {
        setFailed(true);
        return;
      }
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="space-y-stack-sm rounded-card-nested border border-line p-inset-sm">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- a short-lived presigned link
        <img
          src={previewUrl}
          alt={`Photo shared by ${content.sharedByName}`}
          referrerPolicy="no-referrer"
          className="max-h-96 w-full rounded-control object-contain"
        />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-inline-md">
        <span className="text-label-md text-fg">{name}</span>
        <Button
          size="small"
          variant="neutral"
          appearance="fill-stroke"
          leadingIcon={<Download aria-hidden="true" />}
          onClick={download}
        >
          Download
        </Button>
      </div>
      {failed ? (
        <p role="alert" className="text-caption text-danger">
          The file could not be opened. Try again.
        </p>
      ) : null}
    </div>
  );
}

function SharedItem({
  token,
  session,
  content,
}: {
  token: string;
  session: string;
  content: ApiSharedContent;
}) {
  return (
    <Card as="article" padding="small" className="space-y-stack-md">
      <div>
        <p className="text-caption text-fg-muted">
          {kindLabel(content.kind)} · from {content.sharedByName} ·{" "}
          {when(content.sharedAt)}
        </p>
        <h2 className="mt-stack-xs text-heading-3 text-fg">
          {content.subject}
        </h2>
      </div>
      {content.body ? (
        <p className="text-body-md whitespace-pre-line text-fg-secondary">
          {content.body}
        </p>
      ) : null}
      {content.attachment ? (
        <SharedAttachment token={token} session={session} content={content} />
      ) : null}
      <Alert tone="info" live={false}>
        {content.fromOrganization
          ? `You are seeing only what ${content.sharedByName} chose to share with you. This page does not give access to NephroReach.`
          : `You are seeing only what ${content.sharedByName} chose to share with you. This page does not give access to their NephroReach account.`}
      </Alert>
    </Card>
  );
}

function Replies({
  token,
  session,
  content,
}: {
  token: string;
  session: string;
  content: ApiSharedContent;
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [tried, setTried] = useState(false);
  const reply = useMutation({
    mutationFn: (text: string) => replyToShare(token, session, text),
    onSuccess: () => {
      setBody("");
      setTried(false);
    },
    /* The server counts the replies: read them again either way. */
    onSettled: () => queryClient.invalidateQueries({ queryKey: CONTENT_KEY }),
  });
  const max = content.maxReplies ?? MAX_RECIPIENT_REPLIES;
  const left = content.repliesLeft;
  const error = body.trim() ? undefined : "Write a reply.";

  return (
    <Card as="section" padding="small" className="space-y-stack-md">
      <div>
        <h2 className="text-heading-4 text-fg">
          Reply to {content.sharedByName}
        </h2>
        <p className="mt-stack-xs text-body-sm text-fg-secondary">
          You can reply {max} times from this page.
        </p>
      </div>
      {content.replies.length > 0 ? (
        <ol className="space-y-stack-sm">
          {content.replies.map((item) => (
            <li
              key={item.id}
              className="rounded-card-nested bg-surface-sunken p-inset-sm"
            >
              <p className="text-caption text-fg-muted">
                {item.authorName} · {when(item.at)}
              </p>
              <p className="mt-stack-xs text-body-sm whitespace-pre-line text-fg">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      ) : null}
      {reply.error ? (
        <Alert tone="danger">
          {serverText(reply.error, "Your reply was not sent. Try again.")}
        </Alert>
      ) : null}
      {left > 0 ? (
        <form
          className="space-y-stack-sm"
          onSubmit={(event) => {
            event.preventDefault();
            setTried(true);
            if (error) return;
            reply.mutate(body.trim());
          }}
        >
          <FormField
            label="Your reply"
            required
            error={tried ? error : undefined}
            hint={`${left} of ${max} replies left`}
          >
            {(field) => (
              <Textarea
                {...field}
                rows={3}
                maxLength={1500}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            )}
          </FormField>
          <div className="flex justify-end">
            <Button
              type="submit"
              loading={reply.isPending}
              leadingIcon={<Send aria-hidden="true" />}
            >
              Send reply
            </Button>
          </div>
        </form>
      ) : (
        <Alert tone="warning" title="You have used your replies">
          To keep the conversation going, visit nephroreach.com and request an
          account for your organization below.
        </Alert>
      )}
    </Card>
  );
}

function LearnMore({
  token,
  session,
  content,
}: {
  token: string;
  session: string;
  content: ApiSharedContent;
}) {
  const [open, setOpen] = useState(false);
  const [tried, setTried] = useState(false);
  const [form, setForm] = useState({
    name: content.verifiedName ?? "",
    organization: content.verifiedOrg ?? content.recipientOrg ?? "",
    email: "",
    phone: "",
  });
  const request = useMutation({
    mutationFn: () =>
      requestInfoFromShare(token, session, {
        name: form.name.trim(),
        email: form.email.trim(),
        ...(form.organization.trim()
          ? { organization: form.organization.trim() }
          : {}),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      }),
  });
  const set = (change: Partial<typeof form>) =>
    setForm((current) => ({ ...current, ...change }));
  const errors = {
    name: form.name.trim() ? undefined : "Enter your name.",
    email: isEmail(form.email) ? undefined : "Enter a valid email address.",
  };

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
        {!request.isSuccess ? (
          <Button onClick={() => setOpen(true)} disabled={open}>
            Request information for your organization
          </Button>
        ) : null}
      </div>
      {request.isSuccess ? (
        <Alert tone="success">
          Thank you. The NephroReach team will contact you about an
          organizational account.
        </Alert>
      ) : open ? (
        <form
          className="grid gap-stack-md sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            setTried(true);
            if (errors.name || errors.email) return;
            request.mutate();
          }}
        >
          {request.error ? (
            <Alert tone="danger" className="sm:col-span-2">
              {serverText(
                request.error,
                "The request was not sent. Try again.",
              )}
            </Alert>
          ) : null}
          <FormField
            label="Name"
            required
            error={tried ? errors.name : undefined}
          >
            {(field) => (
              <Input
                {...field}
                value={form.name}
                maxLength={120}
                onChange={(e) => set({ name: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Organization">
            {(field) => (
              <Input
                {...field}
                value={form.organization}
                maxLength={160}
                onChange={(e) => set({ organization: e.target.value })}
              />
            )}
          </FormField>
          <FormField
            label="Email"
            required
            error={tried ? errors.email : undefined}
          >
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
                maxLength={40}
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
            <Button type="submit" loading={request.isPending}>
              Send request
            </Button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}

function Verified({
  token,
  session,
  onSessionEnded,
}: {
  token: string;
  session: string;
  onSessionEnded: () => void;
}) {
  const content = useQuery({
    queryKey: CONTENT_KEY,
    queryFn: () => getSharedContent(token, session),
    gcTime: 0,
    retry: false,
  });
  const error = content.error;
  const ended = isApiError(error, { status: 401 });
  /* The session expired (30 minutes): back to the code. */
  React.useEffect(() => {
    if (ended) onSessionEnded();
  }, [ended, onSessionEnded]);

  if (content.isPending || ended) return <Skeleton height={320} />;
  if (isGone(error))
    return <NotValid expired={isApiError(error, { status: 410 })} />;
  if (error || !content.data)
    return (
      <Card padding="small" className="space-y-stack-sm">
        <h2 className="text-heading-4 text-fg">This page did not load</h2>
        <p className="text-body-sm text-fg-secondary">
          Something went wrong on our side. Try again in a moment.
        </p>
        <Button size="small" onClick={() => void content.refetch()}>
          Try again
        </Button>
      </Card>
    );
  return (
    <>
      <SharedItem token={token} session={session} content={content.data} />
      <Replies token={token} session={session} content={content.data} />
      <LearnMore token={token} session={session} content={content.data} />
    </>
  );
}

function SecureShare({ token }: { token: string }) {
  const queryClient = useQueryClient();
  /* The share session: in this component's memory only. */
  const [session, setSession] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | undefined>();
  const teaser = useQuery({
    queryKey: TEASER_KEY,
    queryFn: () => getSharedLink(token),
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const endSession = React.useCallback(() => {
    setSession(null);
    queryClient.removeQueries({ queryKey: CONTENT_KEY });
    setNotice("Your session ended. Ask for a new code to keep reading.");
  }, [queryClient]);

  if (teaser.isPending) return <Skeleton height={320} />;
  if (isGone(teaser.error))
    return <NotValid expired={isApiError(teaser.error, { status: 410 })} />;
  if (teaser.error || !teaser.data)
    return (
      <Card padding="small" className="space-y-stack-sm">
        <h2 className="text-heading-4 text-fg">This page did not load</h2>
        <p className="text-body-sm text-fg-secondary">
          {serverText(
            teaser.error,
            "Something went wrong on our side. Try again in a moment.",
          )}
        </p>
        <Button size="small" onClick={() => void teaser.refetch()}>
          Try again
        </Button>
      </Card>
    );
  if (!session)
    return (
      <VerifyForm
        token={token}
        teaser={teaser.data}
        notice={notice}
        onVerified={(next) => {
          setNotice(undefined);
          setSession(next);
        }}
      />
    );
  return (
    <Verified token={token} session={session} onSessionEnded={endSession} />
  );
}

export default function SecureSharePage({ token }: { token: string }) {
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
      {/* A link that cannot be one is refused without asking the server. */}
      {isShareToken(token) ? <SecureShare token={token} /> : <NotValid />}
    </main>
  );
}
