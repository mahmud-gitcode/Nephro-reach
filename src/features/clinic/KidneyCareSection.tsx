"use client";

import React, { useState } from "react";
import {
  Check,
  Circle,
  CircleCheck,
  CircleMinus,
  Contrast,
  Send,
} from "lucide-react";
import { Badge, Button, Select, Switch } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/features/auth/AuthContext";
import { userCan } from "@/features/staff/staff";
import { useVascularAccess } from "@/features/vascular-access/useVascularAccess";
import { ACCESS_CENTER_NAME } from "@/features/vascular-access/vascularAccess.data";
import { SendReferralModal } from "./AccessReferrals";
import { kidneyCareFor, usDate } from "./ccm.data";
import type { CcmStore } from "./useCcm";
import {
  ACCESS_TYPE_CHOICES,
  KRT_ANSWERS,
  KRT_ITEMS,
  PROGRESS_STEPS,
  accessProgress,
  milestones,
  type AccessTypeChoice,
  type KrtAnswer,
  type MilestoneState,
} from "./kidneyCare";

/* ==========================================================================
   CKD Access / Kidney Replacement Therapy Planning — the CCM patient popup
   --------------------------------------------------------------------------
   Milestones at a glance, the access center's progress once a referral is
   placed, then the checklist the office fills in. Every change saves at
   once and stamps who made it. See kidneyCare.ts for the rules.
   ========================================================================== */

const glyph: Record<
  MilestoneState,
  { icon: typeof Circle; className: string; label: string }
> = {
  done: { icon: CircleCheck, className: "text-success", label: "Done" },
  partial: {
    icon: Contrast,
    className: "text-warning-glyph",
    label: "In progress",
  },
  todo: { icon: Circle, className: "text-fg-subtle", label: "Not yet" },
  na: { icon: CircleMinus, className: "text-fg-subtle", label: "N/A" },
};

/** Who an organisation's own login writes as. */
const OFFICE_PERSON = "Dr. Samuel Reed";

export function KidneyCareSection({
  patient,
  store,
  today,
  canEdit,
}: {
  patient: { name: string; mrn: string };
  store: CcmStore;
  today: string;
  /** The signed-in role may update the checklist. */
  canEdit: boolean;
}) {
  const { user } = useAuth();
  const me = user?.staffRole ? user.name : OFFICE_PERSON;
  const access = useVascularAccess();
  const [referring, setReferring] = useState(false);

  const plan = kidneyCareFor(store.state, patient.mrn);
  const referrals = access.referrals.filter(
    (r) => r.mrn === patient.mrn && r.source === "nephrology",
  );
  const record = access.records.find((r) => r.mrn === patient.mrn);
  const progress = accessProgress(plan, referrals, record);
  const marks = milestones(plan, progress);
  const sent = referrals.some((r) => r.kind !== "General Message");
  const canSend =
    plan?.answers.accessReferral === "Yes" &&
    !sent &&
    userCan(user, "messages.reply");

  const save = (change: Parameters<CcmStore["setKidneyCare"]>[1]) =>
    store.setKidneyCare(patient.mrn, change, today, me);

  return (
    <section>
      <div className="mb-stack-sm flex flex-wrap items-baseline justify-between gap-inline-md">
        <h3 className="text-heading-5 text-fg">
          CKD Access / Kidney Replacement Therapy Planning
        </h3>
        <span className="text-caption text-fg-muted">
          {plan?.updatedOn
            ? `Last updated ${usDate(plan.updatedOn)}${plan.updatedBy ? ` by ${plan.updatedBy}` : ""}`
            : "Not started"}
        </span>
      </div>

      <div className="space-y-stack-md rounded-card-nested border border-line p-inset-md">
        {/* At a glance */}
        <div>
          <p className="mb-stack-sm text-label-md text-fg">
            Kidney Care Milestones
          </p>
          <ul className="grid gap-x-inline-lg gap-y-stack-xs sm:grid-cols-2">
            {marks.map((mark) => {
              const g = glyph[mark.state];
              const Icon = g.icon;
              return (
                <li
                  key={mark.label}
                  className="flex items-center gap-inline-sm text-body-sm text-fg"
                >
                  <Icon
                    aria-hidden="true"
                    className={cn("size-5 shrink-0", g.className)}
                  />
                  <span>{mark.label}</span>
                  <span className="sr-only">: {g.label}</span>
                  {mark.state === "na" ? (
                    <span className="text-caption text-fg-muted">N/A</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        {/* The referral at the access center, once the practice placed one */}
        {progress > 0 ? (
          <div className="border-t border-line pt-stack-md">
            <p className="mb-stack-sm text-label-md text-fg">
              Access Referral Progress
              <span className="ml-inline-sm text-caption font-normal text-fg-muted">
                at {ACCESS_CENTER_NAME}
              </span>
            </p>
            <ol className="flex flex-wrap items-center gap-inline-sm">
              {PROGRESS_STEPS.map((step, i) => {
                const reached = i < progress;
                return (
                  <li key={step} className="flex items-center gap-inline-sm">
                    <Badge
                      tone={reached ? "success" : "neutral"}
                      icon={reached ? <Check aria-hidden="true" /> : undefined}
                    >
                      {step}
                      <span className="sr-only">
                        {reached ? " (reached)" : " (not yet)"}
                      </span>
                    </Badge>
                    {i < PROGRESS_STEPS.length - 1 ? (
                      <span aria-hidden="true" className="text-fg-subtle">
                        →
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}

        {canSend ? (
          <div className="flex flex-wrap items-center justify-between gap-inline-md rounded-card-nested bg-surface-sunken p-inset-sm">
            <p className="text-body-sm text-fg-secondary">
              Referral marked as placed. Send it to the access center to follow
              its progress here.
            </p>
            <Button
              size="small"
              leadingIcon={<Send aria-hidden="true" />}
              onClick={() => setReferring(true)}
            >
              Send to Access Center
            </Button>
          </div>
        ) : null}

        {/* The checklist */}
        <ul className="divide-y divide-line-subtle border-t border-line pt-stack-sm">
          {KRT_ITEMS.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-inline-md py-inset-xs"
            >
              <span className="text-label-md text-fg">{item.label}</span>
              <div className="w-36 shrink-0">
                <Select
                  selectSize="small"
                  aria-label={item.label}
                  className="w-full"
                  disabled={!canEdit}
                  value={plan?.answers[item.id] ?? ""}
                  onChange={(e) =>
                    save({
                      answers: {
                        [item.id]: (e.target.value || undefined) as
                          KrtAnswer | undefined,
                      },
                    })
                  }
                >
                  <option value="">—</option>
                  {KRT_ANSWERS.map((answer) => (
                    <option key={answer}>{answer}</option>
                  ))}
                </Select>
              </div>
            </li>
          ))}
          <li className="flex items-center justify-between gap-inline-md py-inset-xs">
            <span className="text-label-md text-fg">Access type</span>
            <div className="w-36 shrink-0">
              <Select
                selectSize="small"
                aria-label="Access type"
                className="w-full"
                disabled={!canEdit}
                value={plan?.accessType ?? ""}
                onChange={(e) =>
                  save({ accessType: e.target.value as AccessTypeChoice })
                }
              >
                {plan?.accessType ? null : <option value="">—</option>}
                {ACCESS_TYPE_CHOICES.map((choice) => (
                  <option key={choice}>{choice}</option>
                ))}
              </Select>
            </div>
          </li>
          <li className="flex items-center justify-between gap-inline-md py-inset-xs">
            <span className="text-label-md text-fg">Documentation in EHR</span>
            <Switch
              size="small"
              label="Documentation in EHR"
              checked={plan?.ehrDocumented ?? false}
              disabled={!canEdit}
              onChange={(on) => save({ ehrDocumented: on })}
            />
          </li>
        </ul>

        <p className="text-caption text-fg-muted">
          Practice-entered tracking only. Clinical decisions and documentation
          remain with the practice.
        </p>
      </div>

      {referring ? (
        <SendReferralModal
          side="nephrology"
          patients={[patient]}
          initialMrn={patient.mrn}
          initialKind="New Access Referral"
          me={me}
          onSend={access.sendReferral}
          onClose={() => setReferring(false)}
        />
      ) : null}
    </section>
  );
}
