"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Reply, Send, Stethoscope } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import { organizationFor } from "./staff";
import { useStaffAccounts } from "./useStaffAccounts";
import {
  markTeamRead,
  messagesFor,
  sendTeamMessage,
  type TeamMessage,
} from "./teamMessages.data";

/* ==========================================================================
   Team Messages card — nurses write to the physicians (client, 2026-10-06)
   ========================================================================== */

const KEY = storageKey("team-messages");
const QUERY = ["team-messages"];

function useTeamMessages() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY,
    queryFn: () => readJson<TeamMessage[]>(KEY, []),
  });
  const write = useMutation({
    mutationFn: async (transform: (current: TeamMessage[]) => TeamMessage[]) =>
      writeJson(KEY, transform(await readJson<TeamMessage[]>(KEY, []))),
    onSuccess: (next) => queryClient.setQueryData(QUERY, next),
  });
  return { all: query.data ?? [], change: write.mutate };
}

export function TeamMessages() {
  const user = useOptionalAuth()?.user;
  const staff = useStaffAccounts();
  const team = useTeamMessages();
  const [writing, setWriting] = useState<{ to: string } | null>(null);
  const org = organizationFor(user);
  if (!user || !org) return null;

  const me = user.name;
  const owner = !user.staffRole;
  const mine = messagesFor(team.all, org.name, me, owner);
  const unread = mine.filter((m) => m.to === me && !m.read).length;
  /* Physicians first: they are who a nurse is usually after. */
  const colleagues = staff.accounts
    .filter((a) => a.orgId === org.id && a.status === "Active" && a.name !== me)
    .sort(
      (a, b) =>
        Number(!a.role.startsWith("Physician")) -
          Number(!b.role.startsWith("Physician")) ||
        a.name.localeCompare(b.name),
    );

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
            disabled={colleagues.length === 0}
            onClick={() => setWriting({ to: colleagues[0]?.name ?? "" })}
          >
            Message a Physician
          </Button>
          {unread > 0 ? (
            <Button
              size="small"
              variant="neutral"
              appearance="ghost"
              onClick={() =>
                team.change((all) => markTeamRead(all, org.name, me))
              }
            >
              Mark read
            </Button>
          ) : null}
        </div>
      </div>

      {mine.length === 0 ? (
        <EmptyState
          variant="bare"
          title="No team messages yet"
          description="Messages between you and your office's physicians appear here."
        />
      ) : (
        <ul className="divide-y divide-line-subtle">
          {mine.slice(0, 20).map((m) => (
            <li
              key={m.id}
              className="flex items-start justify-between gap-inline-lg py-inset-sm first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-label-md text-fg">
                  {m.from}
                  <span className="text-fg-muted"> ({m.fromRole}) → </span>
                  {m.to}
                  {m.to === me && !m.read ? (
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
              {m.to === me ? (
                <Button
                  size="small"
                  variant="neutral"
                  appearance="fill-stroke"
                  leadingIcon={<Reply aria-hidden="true" />}
                  onClick={() => setWriting({ to: m.from })}
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
              value: c.name,
              label: `${c.name} · ${c.role}`,
            })),
            /* A reply to the office's own login, which has no staff row. */
            ...(colleagues.some((c) => c.name === writing.to) || !writing.to
              ? []
              : [{ value: writing.to, label: writing.to }]),
          ]}
          onClose={() => setWriting(null)}
          onSend={(to, body) => {
            team.change((all) =>
              sendTeamMessage(
                all,
                {
                  org: org.name,
                  from: me,
                  fromRole: user.staffRole ?? "Account owner",
                  to,
                  body,
                },
                new Date(),
              ),
            );
            setWriting(null);
          }}
        />
      ) : null}
    </Card>
  );
}

function WriteModal({
  to: initialTo,
  options,
  onSend,
  onClose,
}: {
  to: string;
  options: Array<{ value: string; label: string }>;
  onSend: (to: string, body: string) => void;
  onClose: () => void;
}) {
  const [to, setTo] = useState(initialTo);
  const [body, setBody] = useState("");
  const [tried, setTried] = useState(false);
  const error = body.trim() ? undefined : "Write your message.";
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
            disabled={!to}
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
