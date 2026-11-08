"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import { Button, Modal, Switch } from "@/components/ui";
import { SHARING_OPTIONS, type SharingId } from "./settings.actions";
import type { SharingState } from "./settings.data";

/* ==========================================================================
   The dialogs behind Settings' Data & Privacy actions
   --------------------------------------------------------------------------
   The data-sharing choices are the office's settings on the server
   (shareUsageAnalytics, shareOutcomes, shareResearch; off unless turned
   on). Password, two-factor, sessions and login activity are the account's
   own flows (FE-ID), not dialogs here.
   ========================================================================== */

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
