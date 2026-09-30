"use client";

import React, { useMemo, useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { Alert, Badge, Button, Modal, Switch } from "@/components/ui";
import {
  SHARING_OPTIONS,
  loginActivity,
  passwordError,
  sessionsFor,
  type SharingId,
  type SharingState,
  type TwoFactorMethod,
} from "./settings.actions";

/* ==========================================================================
   The dialogs behind Settings' actions
   --------------------------------------------------------------------------
   Kept out of ClinicSettings.tsx, which is already a long page of cards.
   Each owns only its own draft; the page owns what is open.
   ========================================================================== */

const field =
  "w-full rounded-control border border-line bg-surface px-inset-sm py-inset-xs " +
  "text-body-sm text-fg outline-none placeholder:text-fg-subtle " +
  "focus:border-primary-soft-line focus:ring-2 focus:ring-ring/60";

/** "3 hr ago" — close enough for a session list, and needs no library. */
export function timeAgo(iso: string, now: Date): string {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} d ago`;
}

/* --------------------------------------------------------------------------
   3 · Password
   -------------------------------------------------------------------------- */

export function ChangePasswordModal({
  open,
  onClose,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const error = passwordError(next, confirm);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (error) return;

    onChanged();
    setNext("");
    setConfirm("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change Password"
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="password-form" disabled={!!error}>
            Change Password
          </Button>
        </>
      }
    >
      <form
        id="password-form"
        onSubmit={handleSubmit}
        className="space-y-stack-md"
      >
        <div className="space-y-1.5">
          <label
            htmlFor="new-password"
            className="block text-label-md text-fg-secondary"
          >
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            className={field}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirm-password"
            className="block text-label-md text-fg-secondary"
          >
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className={field}
          />
        </div>

        <p className="text-body-sm text-fg-muted">
          At least 12 characters, upper and lower case, and a number.
        </p>

        {next.length > 0 && error ? (
          <Alert tone="warning">{error}</Alert>
        ) : null}
      </form>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   4 · Two-factor
   -------------------------------------------------------------------------- */

const TWO_FACTOR_OPTIONS: {
  value: TwoFactorMethod;
  label: string;
  note: string;
}[] = [
  {
    value: "app",
    label: "Authenticator app",
    note: "A code from an app on your phone. Works without signal.",
  },
  {
    value: "sms",
    label: "Text message",
    note: "A code by SMS. Easier to set up, easier to intercept.",
  },
];

export function TwoFactorModal({
  open,
  onClose,
  current,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  current: TwoFactorMethod | null;
  onChoose: (method: TwoFactorMethod | null) => void;
}) {
  const [method, setMethod] = useState<TwoFactorMethod>(current ?? "app");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Two-Factor Authentication"
      description={
        current
          ? "Two-factor is on for this office."
          : "A second step at sign-in, on top of the password."
      }
      footer={
        <>
          {current ? (
            <Button
              variant="danger"
              appearance="fill-stroke"
              onClick={() => {
                onChoose(null);
                onClose();
              }}
            >
              Turn Off
            </Button>
          ) : (
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={onClose}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={() => {
              onChoose(method);
              onClose();
            }}
          >
            {current ? "Save Method" : "Turn On"}
          </Button>
        </>
      }
    >
      <div className="space-y-inline-sm">
        {TWO_FACTOR_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-start gap-inline-md rounded-control border p-inset-sm transition-colors ${
              method === option.value
                ? "border-primary-edge bg-primary-soft"
                : "border-line bg-surface hover:border-line-strong"
            }`}
          >
            <input
              type="radio"
              name="two-factor"
              value={option.value}
              checked={method === option.value}
              onChange={() => setMethod(option.value)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-brand-600)]"
            />
            <span className="min-w-0">
              <span className="block text-label-md text-fg">
                {option.label}
              </span>
              <span className="block text-body-sm text-fg-muted">
                {option.note}
              </span>
            </span>
          </label>
        ))}
      </div>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   5 · Sessions
   -------------------------------------------------------------------------- */

export function SessionsModal({
  open,
  onClose,
  signedOut,
  onSignOut,
}: {
  open: boolean;
  onClose: () => void;
  signedOut: string[];
  onSignOut: (id: string) => void;
}) {
  /* Read once when the dialog mounts: a clock ticking behind an open list
     would reshuffle "3 hr ago" under the reader. */
  const now = useMemo(() => new Date(), []);
  const sessions = useMemo(
    () =>
      sessionsFor(
        typeof navigator === "undefined" ? "" : navigator.userAgent,
        now,
      ),
    [now],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Active Sessions"
      description="Where this office is signed in."
      footer={
        <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
          Close
        </Button>
      }
    >
      <ul className="divide-y divide-line-subtle">
        {sessions.map((session) => {
          const gone = signedOut.includes(session.id);

          return (
            <li
              key={session.id}
              className="flex flex-wrap items-center gap-inline-md py-inset-xs first:pt-0"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-label-md text-fg">
                  {session.device}
                </span>
                <span className="block text-body-sm text-fg-muted">
                  {session.location} · {timeAgo(session.lastSeen, now)}
                </span>
              </span>

              {session.current ? (
                <Badge tone="success" variant="soft">
                  This device
                </Badge>
              ) : gone ? (
                <Badge tone="neutral" variant="soft">
                  Signed out
                </Badge>
              ) : (
                <Button
                  variant="neutral"
                  appearance="fill-stroke"
                  size="small"
                  onClick={() => onSignOut(session.id)}
                >
                  <LogOut aria-hidden="true" />
                  <span>Sign out</span>
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   6 · Login activity
   -------------------------------------------------------------------------- */

export function LoginActivityModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const now = useMemo(() => new Date(), []);
  const events = useMemo(() => loginActivity(now), [now]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Login Activity"
      description="Recent sign-ins to this office portal."
      footer={
        <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
          Close
        </Button>
      }
    >
      <ul className="divide-y divide-line-subtle">
        {events.map((event) => (
          <li
            key={event.id}
            className="flex flex-wrap items-center gap-inline-md py-inset-xs first:pt-0"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-label-md text-fg">{event.who}</span>
              <span className="block text-body-sm text-fg-muted">
                {event.device} · {timeAgo(event.at, now)}
              </span>
            </span>
            <Badge tone={event.ok ? "success" : "danger"} variant="soft">
              {event.ok ? "Signed in" : "Failed"}
            </Badge>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   7 · Data sharing
   -------------------------------------------------------------------------- */

export function DataSharingModal({
  open,
  onClose,
  sharing,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  sharing: SharingState;
  onToggle: (id: SharingId, on: boolean) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Data Sharing"
      description="Everything here is off unless you turn it on."
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <ul className="divide-y divide-line-subtle">
        {SHARING_OPTIONS.map((option) => (
          <li
            key={option.id}
            className="flex items-start gap-inline-lg py-inset-sm first:pt-0"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-label-md text-fg">
                {option.label}
              </span>
              <span className="block text-body-sm text-fg-muted">
                {option.note}
              </span>
            </span>
            <Switch
              checked={sharing[option.id]}
              onChange={(next) => onToggle(option.id, next)}
              label={option.label}
            />
          </li>
        ))}
      </ul>

      <p className="mt-stack-lg text-body-sm text-fg-muted">
        No patient-identifying information is shared under any of these.
      </p>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   8 · HIPAA & security
   -------------------------------------------------------------------------- */

const HIPAA_POINTS: [string, string][] = [
  [
    "Your patients are yours alone",
    "One facility's records are never reachable from another's portal. Every query is scoped to the signed-in office.",
  ],
  [
    "Least privilege by role",
    "Admin, Provider, Staff, Coordinator and MA each see only what that role needs.",
  ],
  [
    "Audited access",
    "Who opened which record, and when, is recorded and available to your office's admin.",
  ],
  [
    "Encrypted in transit and at rest",
    "TLS on every request, and encrypted storage for everything held about a patient.",
  ],
  [
    "Business Associate Agreement",
    "NephroReach signs a BAA with every contracted facility before go-live.",
  ],
];

export function HipaaModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title="HIPAA & Security"
      description="How your office's data is kept separate and protected."
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <ul className="space-y-stack-md">
        {HIPAA_POINTS.map(([title, detail]) => (
          <li key={title} className="flex items-start gap-inline-md">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-fg-brand"
            />
            <span className="min-w-0">
              <span className="block text-label-md text-fg">{title}</span>
              <span className="block text-body-sm text-fg-secondary">
                {detail}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
