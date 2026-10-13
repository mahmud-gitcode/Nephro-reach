"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Check, ChevronRight, HandHeart, Lock } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";
import { CAREGIVER_PERMISSIONS } from "./caregivers.data";
import { useCaregiverView } from "./useCaregivers";
import {
  ActiveMedicationsCard,
  CourseProgressCard,
  NextAppointmentCard,
  NextTreatmentCard,
} from "./CaregiverViews";

/* ==========================================================================
   Caregiver Home
   --------------------------------------------------------------------------
   Invitations to accept, the people this caregiver looks after (a parent
   and a grandparent, say), and — for the one they are viewing — a short
   summary and what that person shares with them.
   ========================================================================== */

const BASE = "/dashboard/caregiver";

export default function CaregiverHome() {
  const view = useCaregiverView();
  const { grant, patients, choose, isPending } = view;

  /* One person to look after: no need to make them pick. */
  useEffect(() => {
    if (!isPending && !grant && patients.length === 1) {
      void choose(patients[0].patientEmail);
    }
  }, [isPending, grant, patients, choose]);

  if (isPending) return <Skeleton height={320} />;

  return (
    <div className="space-y-stack-xl">
      <PageTitle href={BASE} title="Caregiver Home" />

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
                  caregiver ({g.relationship.toLowerCase()}).
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
                      if (!grant) await choose(g.patientEmail);
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

      {patients.length > 1 ? (
        <Card>
          <CardHeader title="People you care for" />
          <ul className="mt-stack-md divide-y divide-line">
            {patients.map((g) => {
              const viewing = grant?.id === g.id;
              return (
                <li
                  key={g.id}
                  className="flex items-center justify-between gap-inline-md py-stack-sm"
                >
                  <div className="min-w-0">
                    <p className="text-label-md text-fg">{g.patientName}</p>
                    <p className="text-caption text-fg-muted">
                      {g.relationship}
                    </p>
                  </div>
                  {viewing ? (
                    <Badge tone="success">Viewing</Badge>
                  ) : (
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="fill-stroke"
                      onClick={() => void choose(g.patientEmail)}
                    >
                      View
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      {grant ? (
        <>
          <div className="grid grid-cols-1 gap-stack-md sm:grid-cols-2 xl:grid-cols-4">
            {view.can("schedule") ? <NextTreatmentCard /> : null}
            {view.can("medications") ? <ActiveMedicationsCard /> : null}
            {view.can("appointments") ? <NextAppointmentCard /> : null}
            {view.can("education") ? <CourseProgressCard /> : null}
          </div>

          <Card>
            <CardHeader
              title={`What ${grant.patientName} shares with you`}
              description="Only they can change this, from their own account."
            />
            <ul className="mt-stack-md divide-y divide-line">
              {CAREGIVER_PERMISSIONS.map((p) => {
                const shared = view.can(p.id);
                const href = `${BASE}/${p.id}`;
                return (
                  <li key={p.id}>
                    {shared ? (
                      <Link
                        href={href}
                        className="flex min-h-11 items-center justify-between gap-inline-md py-stack-sm text-fg hover:text-fg-brand"
                      >
                        <span className="text-label-md">{p.label}</span>
                        <span className="flex items-center gap-inline-sm">
                          <Badge tone="success">Shared</Badge>
                          <ChevronRight aria-hidden className="size-4" />
                        </span>
                      </Link>
                    ) : (
                      <div className="flex min-h-11 items-center justify-between gap-inline-md py-stack-sm">
                        <span className="text-label-md text-fg-muted">
                          {p.label}
                        </span>
                        <Badge tone="neutral" icon={<Lock />}>
                          Not shared
                        </Badge>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      ) : null}
    </div>
  );
}
