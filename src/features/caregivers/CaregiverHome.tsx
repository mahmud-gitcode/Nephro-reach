"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, HandHeart } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";
import { useCaregiverView } from "./useCaregivers";
import { PatientAvatar } from "./CaregiverBar";

/* ==========================================================================
   My Patients — a caregiver's home
   --------------------------------------------------------------------------
   Invitations to accept, and the people this caregiver looks after (a
   parent and a grandparent, say). Opening one switches the whole portal to
   that patient's account (2026-10-14).
   ========================================================================== */

const HREF = "/dashboard/caregiver";

export default function CaregiverHome() {
  const view = useCaregiverView();
  const { grant, patients, choose } = view;
  const router = useRouter();

  const open = async (patientEmail: string) => {
    await choose(patientEmail);
    router.push("/dashboard");
  };

  if (view.isPending) return <Skeleton height={320} />;

  return (
    <div className="space-y-stack-xl">
      <PageTitle href={HREF} />

      {view.pending.length > 0 ? (
        <Card>
          <CardHeader title="Invitations" />
          <ul className="mt-stack-md divide-y divide-line">
            {view.pending.map((g) => (
              <li
                key={g.id}
                className="flex flex-col gap-stack-sm py-stack-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-body-sm text-fg">
                  <strong>{g.patientName}</strong> invited you to be their
                  caregiver.
                </p>
                <div className="flex gap-inline-sm">
                  <Button
                    variant="neutral"
                    appearance="fill-stroke"
                    onClick={() => view.decline(g.id)}
                  >
                    Decline
                  </Button>
                  <Button
                    leadingIcon={<Check />}
                    disabled={view.isSaving}
                    onClick={async () => {
                      await view.accept(g.id);
                      await open(g.patientEmail);
                    }}
                  >
                    Accept
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {patients.length === 0 && view.pending.length === 0 ? (
        <EmptyState
          icon={<HandHeart />}
          title="No one has invited you yet"
          description="When a patient invites you by email, their invitation appears here."
        />
      ) : null}

      {patients.length > 0 ? (
        <Card>
          <CardHeader
            title="People you care for"
            description="Open a patient to use NephroReach for them. You can switch at any time from the bar at the top of every page."
          />
          <ul className="mt-stack-md space-y-stack-xs">
            {patients.map((g) => {
              const current = grant?.id === g.id;
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => void open(g.patientEmail)}
                    className="flex min-h-16 w-full cursor-pointer items-center gap-inline-md rounded-control px-2 py-stack-sm text-left transition-colors duration-150 ease-standard hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <PatientAvatar name={g.patientName} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-inline-sm text-label-lg text-fg">
                        <span className="truncate">{g.patientName}</span>
                        {current ? (
                          <Badge tone="success">Open now</Badge>
                        ) : null}
                      </span>
                      <span className="block text-caption text-fg-muted">
                        {g.relationship}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-inline-sm text-label-md text-fg-brand">
                      {current ? "Continue" : "Open"}
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
