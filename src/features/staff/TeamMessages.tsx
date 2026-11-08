"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Reply, Send, Stethoscope } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  Modal,
  Select,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { isApiError } from "@/lib/api/client";
import { orgKey } from "@/lib/data/queryKeys";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import { canLevel } from "@/features/permissions/permissionMap";
import {
  actionErrorText,
  requireOffice,
  useOfficeOrg,
} from "@/features/clinic/officeContext";
import { listStaff } from "./staff.api";
import { staffKeys, useAdminContext } from "./useStaffAccounts";
import {
  listTeamMessages,
  listUnreadTeamMessages,
  markTeamMessagesRead,
  orderColleagues,
  sendTeamMessage,
  SOMEONE,
  TEAM_MESSAGE_MAX,
  viewTeamMessages,
  type Colleague,
} from "./teamMessages.data";

/* ==========================================================================
   Team Messages card — nurses write to the physicians (client, 2026-10-06)
   --------------------------------------------------------------------------
   On the API (P15c, INT-P15-1): the active office's
   /organizations/{orgId}/team-messages, read and written as that office
   (path and X-Organization-Id from the portal context, office mode only).
   The server decides every call; a 403 is "no access", never an empty list.

   Colleagues' names and the "To" list come from the office's staff list,
   which only a role with staff View may read. Without it the card still
   lists the messages and lets the person reply, but starting a new message
   is shown disabled with the D52 "not available yet" note (no colleague
   directory route for team messages; decision D75).
   ========================================================================== */

const STAFF_PAGE = { page: 1, limit: 150 } as const;

const NOT_AVAILABLE_ID = "team-messages-not-available";
const NOT_AVAILABLE =
  "Not available yet: starting a message needs the office's staff list, which your role cannot view. You can reply to messages sent to you.";

function useTeamMessages(orgId: string | null) {
  const queryClient = useQueryClient();
  const enabled = orgId !== null;
  const list = useQuery({
    queryKey: orgId
      ? orgKey(orgId, "team-messages")
      : ["org", "none", "team-messages"],
    queryFn: () => listTeamMessages(requireOffice(orgId)),
    enabled,
  });
  const unread = useQuery({
    queryKey: orgId
      ? orgKey(orgId, "team-messages", "unread")
      : ["org", "none", "team-messages", "unread"],
    queryFn: () => listUnreadTeamMessages(requireOffice(orgId)),
    enabled,
  });
  const settle = () =>
    orgId
      ? queryClient.invalidateQueries({
          queryKey: orgKey(orgId, "team-messages"),
        })
      : undefined;
  const send = useMutation({
    mutationFn: (body: { toId: string; body: string }) =>
      sendTeamMessage(requireOffice(orgId), body),
    onSettled: settle,
  });
  const markRead = useMutation({
    mutationFn: () => markTeamMessagesRead(requireOffice(orgId)),
    onSettled: settle,
  });
  return { list, unread, send, markRead };
}

/** The office's active colleagues, when this role may read the staff list. */
function useColleagues(orgId: string | null, allowed: boolean) {
  const query = useQuery({
    queryKey: orgId
      ? staffKeys.staff(orgId, STAFF_PAGE)
      : ["org", "none", "staff"],
    queryFn: () => listStaff(requireOffice(orgId), STAFF_PAGE),
    enabled: orgId !== null && allowed,
  });
  const colleagues: Colleague[] = (query.data?.items ?? [])
    .filter((m) => m.status === "ACTIVE")
    .map((m) => ({
      userId: m.userId,
      name: m.name ?? m.email ?? SOMEONE,
      role: m.role,
    }));
  return { colleagues, isPending: allowed && query.isPending };
}

export function TeamMessages() {
  const user = useOptionalAuth()?.user;
  const { orgId } = useOfficeOrg();
  const { permissions } = useAdminContext();
  const canSend = canLevel(permissions, "team_messages", 2);
  const canListStaff = canLevel(permissions, "staff", 1);
  const team = useTeamMessages(orgId);
  const staff = useColleagues(orgId, canListStaff);
  const [writing, setWriting] = useState<{ to: string } | null>(null);
  if (!user || !orgId) return null;

  const me = {
    userId: user.id,
    name: user.name,
    role: user.staffRole ?? "Account owner",
  };
  const colleagues = orderColleagues(
    staff.colleagues.filter((c) => c.userId !== me.userId),
  );
  const mine = viewTeamMessages(
    team.list.data?.items ?? [],
    me,
    staff.colleagues,
  );
  const unread = (team.unread.data?.items ?? []).length;
  const notShared =
    isApiError(team.list.error) && team.list.error.status === 403;
  const startDisabled = !canSend || colleagues.length === 0;
  const writeError = team.send.error ?? team.markRead.error;

  return (
    <Card as="section" padding="small">
      <div className="mb-stack-lg flex flex-wrap items-start justify-between gap-inline-lg">
        <div className="min-w-0">
          <h2 className="text-heading-4 text-fg">Team Messages</h2>
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            Message the physicians and colleagues in your office. Patients
            can&apos;t message physicians directly.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-inline-md">
          {unread > 0 ? <Badge tone="info">{unread} new</Badge> : null}
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            leadingIcon={<Stethoscope aria-hidden="true" />}
            disabled={startDisabled}
            aria-describedby={
              canSend && !canListStaff ? NOT_AVAILABLE_ID : undefined
            }
            onClick={() => setWriting({ to: colleagues[0]?.userId ?? "" })}
          >
            Message a Physician
          </Button>
          {unread > 0 ? (
            <Button
              size="small"
              variant="neutral"
              appearance="ghost"
              disabled={team.markRead.isPending}
              onClick={() => team.markRead.mutate()}
            >
              Mark read
            </Button>
          ) : null}
        </div>
        {canSend && !canListStaff ? (
          <p
            id={NOT_AVAILABLE_ID}
            className="w-full text-caption text-fg-muted"
          >
            {NOT_AVAILABLE}
          </p>
        ) : null}
      </div>

      {writeError ? (
        <Alert
          tone="danger"
          className="mb-stack-md"
          onDismiss={() => {
            team.send.reset();
            team.markRead.reset();
          }}
        >
          {actionErrorText(writeError)}
        </Alert>
      ) : null}

      {team.list.error ? (
        <ErrorState
          title={
            notShared
              ? "Team messages are not available to your role"
              : "Team messages could not be loaded"
          }
          error={team.list.error}
          onRetry={() => void team.list.refetch()}
        />
      ) : team.list.isPending ? (
        <Skeleton height={120} />
      ) : mine.length === 0 ? (
        <EmptyState
          variant="bare"
          title="No team messages yet"
          description="Messages between you and your office's physicians appear here."
        />
      ) : (
        <ul className="divide-y divide-line-subtle">
          {mine.map((m) => (
            <li
              key={m.id}
              className="flex items-start justify-between gap-inline-lg py-inset-sm first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-label-md text-fg">
                  {m.from}
                  <span className="text-fg-muted">
                    {m.fromRole ? ` (${m.fromRole})` : ""} →{" "}
                  </span>
                  {m.to}
                  {m.isNew ? (
                    <Badge tone="info" className="ml-inline-sm">
                      New
                    </Badge>
                  ) : null}
                </p>
                <p className="mt-stack-xs text-body-sm text-fg-secondary">
                  {m.body}
                </p>
                <p className="mt-stack-xs text-caption text-fg-muted">
                  {new Date(m.sentAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {m.toMe && m.fromId !== me.userId && canSend ? (
                <Button
                  size="small"
                  variant="neutral"
                  appearance="fill-stroke"
                  leadingIcon={<Reply aria-hidden="true" />}
                  aria-label={`Reply to ${m.from}`}
                  onClick={() => setWriting({ to: m.fromId })}
                >
                  Reply
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {writing ? (
        <WriteModal
          to={writing.to}
          options={[
            ...colleagues.map((c) => ({
              value: c.userId,
              label: `${c.name} · ${c.role}`,
            })),
            /* A reply to someone this role cannot list (the office's own
               login, or any colleague when the staff list is not
               readable): named from the message, never by id. */
            ...(colleagues.some((c) => c.userId === writing.to) || !writing.to
              ? []
              : [
                  {
                    value: writing.to,
                    label:
                      mine.find((m) => m.fromId === writing.to)?.from ??
                      SOMEONE,
                  },
                ]),
          ]}
          isSending={team.send.isPending}
          onClose={() => setWriting(null)}
          onSend={(toId, body) => {
            team.send.mutate(
              { toId, body },
              { onSuccess: () => setWriting(null) },
            );
          }}
        />
      ) : null}
    </Card>
  );
}

function WriteModal({
  to: initialTo,
  options,
  isSending,
  onSend,
  onClose,
}: {
  to: string;
  options: Array<{ value: string; label: string }>;
  isSending: boolean;
  onSend: (to: string, body: string) => void;
  onClose: () => void;
}) {
  const [to, setTo] = useState(initialTo);
  const [body, setBody] = useState("");
  const [tried, setTried] = useState(false);
  const error = !body.trim()
    ? "Write your message."
    : body.trim().length > TEAM_MESSAGE_MAX
      ? `Keep it under ${TEAM_MESSAGE_MAX} characters.`
      : undefined;
  return (
    <Modal
      open
      onClose={onClose}
      title="Team Message"
      description="Only staff in your office can read it."
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            leadingIcon={<Send aria-hidden="true" />}
            disabled={!to || isSending}
            onClick={() => {
              setTried(true);
              if (error) return;
              onSend(to, body.trim());
            }}
          >
            Send
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        <FormField label="To" required>
          {(field) => (
            <Select
              {...field}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            >
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField label="Message" required error={tried ? error : undefined}>
          {(field) => (
            <Textarea
              {...field}
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          )}
        </FormField>
      </div>
    </Modal>
  );
}
