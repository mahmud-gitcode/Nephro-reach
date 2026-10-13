"use client";

import React, { useState } from "react";
import { Copy, HandHeart, Plus, Trash2 } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  FormField,
  Input,
  Modal,
  Select,
  Skeleton,
  SwitchRow,
} from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  CAREGIVER_PERMISSIONS,
  DEFAULT_PERMISSIONS,
  RELATIONSHIPS,
  inviteError,
  type CaregiverGrant,
  type CaregiverPermission,
  type InviteDraft,
} from "./caregivers.data";
import { useMyCaregivers } from "./useCaregivers";

/* ==========================================================================
   My Caregivers — the patient decides
   --------------------------------------------------------------------------
   The patient invites a caregiver by email and turns on, one by one, what
   that person may see. The journal starts off. A caregiver can be removed
   at any time, and the patient sees what each caregiver has done.
   ========================================================================== */

const HREF = "/dashboard/my-caregivers";

const inviteLink = (id: string) =>
  `${typeof window === "undefined" ? "" : window.location.origin}/caregiver-invite/${id}`;

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MyCaregivers() {
  const mine = useMyCaregivers();
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<CaregiverGrant | null>(null);

  return (
    <div className="space-y-stack-xl">
      <PageTitle
        href={HREF}
        action={
          <Button leadingIcon={<Plus />} onClick={() => setInviting(true)}>
            Invite caregiver
          </Button>
        }
      />

      <Alert tone="info" icon={<HandHeart />}>
        A caregiver signs in with their own account and sees only what you turn
        on. Your journal stays private unless you share it.
      </Alert>

      {mine.saveError ? (
        <Alert tone="danger">That change did not save. Please try again.</Alert>
      ) : null}

      {mine.isPending ? (
        <Skeleton height={240} />
      ) : mine.caregivers.length === 0 ? (
        <EmptyState
          icon={<HandHeart />}
          title="No caregivers yet"
          description="Invite a family member or friend who helps with your care."
          action={
            <Button leadingIcon={<Plus />} onClick={() => setInviting(true)}>
              Invite caregiver
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-stack-lg xl:grid-cols-2">
          {mine.caregivers.map((g) => (
            <CaregiverCard
              key={g.id}
              grant={g}
              disabled={mine.isSaving}
              onToggle={(p, on) => mine.setPermission(g.id, p, on)}
              onRemove={() => setRemoving(g)}
            />
          ))}
        </div>
      )}

      {inviting ? (
        <InviteModal
          onInvite={(draft) => mine.invite(draft)}
          error={(draft) => inviteError(mine.state, mine.patientEmail, draft)}
          onClose={() => setInviting(false)}
        />
      ) : null}

      {removing ? (
        <Modal
          open
          size="small"
          onClose={() => setRemoving(null)}
          title={`Remove ${removing.caregiverName}?`}
          description="They lose access straight away. What they already saw cannot be taken back, and anything they did stays in your activity."
          footer={
            <>
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setRemoving(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  mine.remove(removing.id);
                  setRemoving(null);
                }}
              >
                Remove caregiver
              </Button>
            </>
          }
        />
      ) : null}
    </div>
  );
}

function CaregiverCard({
  grant,
  disabled,
  onToggle,
  onRemove,
}: {
  grant: CaregiverGrant;
  disabled: boolean;
  onToggle: (permission: CaregiverPermission, on: boolean) => void;
  onRemove: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const pending = grant.status === "pending";

  return (
    <Card>
      <CardHeader
        title={grant.caregiverName}
        description={`${grant.relationship} · ${grant.caregiverEmail}`}
        action={
          <Badge tone={pending ? "warning" : "success"}>
            {pending ? "Invite sent" : "Active"}
          </Badge>
        }
      />

      {pending ? (
        <div className="mt-stack-md flex flex-wrap items-center gap-inline-sm">
          <p className="text-body-sm text-fg-muted">
            Waiting for them to accept.
          </p>
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            leadingIcon={<Copy />}
            onClick={() => {
              void navigator.clipboard
                ?.writeText(inviteLink(grant.id))
                .then(() => setCopied(true))
                .catch(() => undefined);
            }}
          >
            {copied ? "Link copied" : "Copy invite link"}
          </Button>
        </div>
      ) : null}

      <h4 className="mt-stack-lg text-label-md text-fg">What they can see</h4>
      <div className="mt-stack-xs divide-y divide-line">
        {CAREGIVER_PERMISSIONS.map((p) => (
          <SwitchRow
            key={p.id}
            title={p.label}
            description={p.description}
            checked={grant.permissions.includes(p.id)}
            disabled={disabled}
            onChange={(on) => onToggle(p.id, on)}
          />
        ))}
      </div>
      <p className="mt-stack-sm text-caption text-fg-muted">
        Billing and account settings are never shared.
      </p>

      <h4 className="mt-stack-lg text-label-md text-fg">Recent activity</h4>
      <ul className="mt-stack-xs space-y-stack-xs">
        {grant.activity.slice(0, 5).map((a, i) => (
          <li
            key={`${a.at}-${i}`}
            className="flex justify-between gap-inline-md text-body-sm"
          >
            <span className="text-fg">{a.action}</span>
            <span className="shrink-0 text-fg-muted tabular-nums">
              {when(a.at)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-stack-lg flex justify-end">
        <Button
          variant="danger"
          appearance="fill-stroke"
          leadingIcon={<Trash2 />}
          onClick={onRemove}
        >
          Remove caregiver
        </Button>
      </div>
    </Card>
  );
}

function InviteModal({
  onInvite,
  error,
  onClose,
}: {
  onInvite: (draft: InviteDraft) => Promise<string>;
  error: (draft: InviteDraft) => ReturnType<typeof inviteError>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<InviteDraft>({
    caregiverName: "",
    caregiverEmail: "",
    relationship: RELATIONSHIPS[0],
    permissions: [...DEFAULT_PERMISSIONS],
  });
  const [tried, setTried] = useState(false);
  const [sentId, setSentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const problem = error(draft);
  const set = (patch: Partial<InviteDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));

  if (sentId) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Invite ready"
        description={`Send this link to ${draft.caregiverName.trim()}. They create their own login and accept. Once NephroReach is live, we email it for you.`}
        footer={<Button onClick={onClose}>Done</Button>}
      >
        <div className="flex flex-col gap-inline-sm sm:flex-row">
          <Input
            readOnly
            aria-label="Invite link"
            value={inviteLink(sentId)}
            className="sm:flex-1"
          />
          <Button
            variant="neutral"
            appearance="fill-stroke"
            leadingIcon={<Copy />}
            onClick={() => {
              void navigator.clipboard
                ?.writeText(inviteLink(sentId))
                .then(() => setCopied(true))
                .catch(() => undefined);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title="Invite a caregiver"
      description="Someone who helps with your care, such as a family member. They see only what you turn on below."
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setTried(true);
              if (problem) return;
              setSentId(await onInvite(draft));
            }}
          >
            Send invite
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {tried && problem === "duplicate" ? (
          <Alert tone="warning">This person is already your caregiver.</Alert>
        ) : null}
        <div className="grid grid-cols-1 gap-stack-md sm:grid-cols-2">
          <FormField
            label="Their name"
            required
            error={
              tried && problem === "name" ? "Enter their name." : undefined
            }
          >
            {(field) => (
              <Input
                {...field}
                value={draft.caregiverName}
                onChange={(e) => set({ caregiverName: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Relationship">
            {(field) => (
              <Select
                {...field}
                value={draft.relationship}
                onChange={(e) => set({ relationship: e.target.value })}
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField
            label="Their email"
            required
            className="sm:col-span-2"
            error={
              tried && problem === "email"
                ? "Enter a valid email."
                : tried && problem === "self"
                  ? "This is your own email. Use theirs."
                  : undefined
            }
          >
            {(field) => (
              <Input
                {...field}
                type="email"
                value={draft.caregiverEmail}
                onChange={(e) => set({ caregiverEmail: e.target.value })}
              />
            )}
          </FormField>
        </div>
        <div>
          <h4 className="text-label-md text-fg">What they can see</h4>
          <div className="mt-stack-xs divide-y divide-line">
            {CAREGIVER_PERMISSIONS.map((p) => (
              <SwitchRow
                key={p.id}
                title={p.label}
                description={p.description}
                checked={draft.permissions.includes(p.id)}
                onChange={(on) =>
                  set({
                    permissions: on
                      ? [...draft.permissions, p.id]
                      : draft.permissions.filter((x) => x !== p.id),
                  })
                }
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
