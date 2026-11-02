"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, HandHeart, LogOut } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Modal,
} from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";
import { signOut } from "@/lib/data/session";
import { invitationErrorKey } from "@/features/portal/InvitationPage";
import { usePortalText } from "@/features/portal/portalText";
import {
  AREA_LABELS,
  LEVEL_LABELS,
  PRESET_LABELS,
  areaLevel,
  type CaregivingPatient,
} from "./caregivers.mapping";
import { CAREGIVER_AREAS } from "./caregivers.api";
import {
  useCaregiverView,
  useLeaveCaregiving,
  useMyInvitations,
} from "./useCaregivers";
import { PatientAvatar } from "./CaregiverBar";

/* ==========================================================================
   My Patients: a caregiver's home (Phase 3, D1, D5)
   --------------------------------------------------------------------------
   Invitations waiting for this account (from the server, by its verified
   email), and the people it looks after (`GET /me/context`). Opening one
   makes that patient the portal context: every cached query is cleared, so
   nothing from the previous patient can show. What each patient shared is
   listed from the grant itself; the server checks it on every request.
   ========================================================================== */

const HREF = "/dashboard/caregiver";

function SharedAreas({ patient }: { patient: CaregivingPatient }) {
  const open = CAREGIVER_AREAS.filter(
    (a) => areaLevel(patient.permissions, a) > 0,
  );
  const journal = areaLevel(patient.permissions, "journal") > 0;
  return (
    <span className="block text-caption text-fg-muted">
      {open.length === 0
        ? "Nothing shared yet"
        : open
            .map(
              (a) =>
                `${AREA_LABELS[a]} (${LEVEL_LABELS[areaLevel(patient.permissions, a)].toLowerCase()})`,
            )
            .join(", ")}
      {journal ? ", private journal (view)" : ""}
    </span>
  );
}

export default function CaregiverHome() {
  const view = useCaregiverView();
  const { grant, patients, choose } = view;
  const invites = useMyInvitations();
  const leave = useLeaveCaregiving();
  const router = useRouter();
  const t = usePortalText();
  const [leaving, setLeaving] = useState<CaregivingPatient | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = (patient: CaregivingPatient) => {
    if (choose(patient.grantId)) router.push("/dashboard");
  };

  return (
    <div className="space-y-stack-xl">
      <PageTitle href={HREF} />

      {error ? (
        <Alert tone="danger" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {invites.invitations.length > 0 ? (
        <Card>
          <CardHeader title="Invitations" />
          <ul className="mt-stack-md divide-y divide-line">
            {invites.invitations.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-col gap-stack-sm py-stack-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-body-sm text-fg">
                  {inv.kind === "STAFF" ? (
                    <>
                      <strong>{inv.organizationName}</strong> invited you to
                      join as {inv.role}.
                    </>
                  ) : (
                    <>
                      <strong>{inv.inviterFirstName ?? "A patient"}</strong>{" "}
                      invited you to be their caregiver (
                      {PRESET_LABELS[inv.preset ?? ""] ?? inv.preset}).
                    </>
                  )}
                </p>
                <div className="flex gap-inline-sm">
                  <Button
                    variant="neutral"
                    appearance="fill-stroke"
                    disabled={invites.respond.isPending}
                    onClick={() =>
                      invites.respond.mutate(
                        { id: inv.id, accept: false },
                        { onError: (e) => setError(t(invitationErrorKey(e))) },
                      )
                    }
                  >
                    Decline
                  </Button>
                  <Button
                    leadingIcon={<Check />}
                    disabled={invites.respond.isPending}
                    onClick={() =>
                      invites.respond.mutate(
                        { id: inv.id, accept: true },
                        {
                          onError: (e) => setError(t(invitationErrorKey(e))),
                          onSuccess: (result) => {
                            /* Joining an office ends every session of the
                               account (its access changed). */
                            if (
                              result &&
                              typeof result === "object" &&
                              "kind" in result &&
                              result.kind === "STAFF"
                            )
                              void signOut({
                                destination:
                                  "/login?reason=access-changed&next=%2Fdashboard",
                              });
                            else void view.refresh();
                          },
                        },
                      )
                    }
                  >
                    Accept
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {patients.length === 0 && invites.invitations.length === 0 ? (
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
            {patients.map((p) => {
              const current = grant?.grantId === p.grantId;
              return (
                <li
                  key={p.grantId}
                  className="flex flex-col gap-stack-xs rounded-control px-2 py-stack-sm sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-inline-md">
                    <PatientAvatar name={p.patientName} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-inline-sm text-label-lg text-fg">
                        <span className="truncate">{p.patientName}</span>
                        {current ? (
                          <Badge tone="success">Open now</Badge>
                        ) : null}
                      </span>
                      <span className="block text-caption text-fg-muted">
                        {p.relationship} · {PRESET_LABELS[p.preset] ?? p.preset}
                      </span>
                      <SharedAreas patient={p} />
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-inline-sm">
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="ghost"
                      leadingIcon={<LogOut />}
                      onClick={() => setLeaving(p)}
                    >
                      Leave
                    </Button>
                    <Button
                      size="small"
                      trailingIcon={<ArrowRight />}
                      aria-label={`Open ${p.patientName}`}
                      onClick={() => open(p)}
                    >
                      {current ? "Continue" : "Open"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      {leaving ? (
        <Modal
          open
          size="small"
          onClose={() => setLeaving(null)}
          title={`Stop caring for ${leaving.patientName}?`}
          description="You lose access to their account straight away. They can invite you again later."
          footer={
            <>
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setLeaving(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={leave.isPending}
                onClick={() => {
                  const target = leaving;
                  setLeaving(null);
                  leave.mutate(target.grantId, {
                    onError: () => setError("That did not work. Try again."),
                  });
                }}
              >
                Leave
              </Button>
            </>
          }
        />
      ) : null}
    </div>
  );
}
