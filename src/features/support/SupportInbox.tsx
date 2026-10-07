"use client";

import React, { useState } from "react";
import { Building2, LifeBuoy } from "lucide-react";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Select,
  TabPanel,
  Tabs,
} from "@/components/ui";
import { useShares } from "@/features/secure-messages/useShares";
import type { SupportStatus } from "./support.data";
import { useSupport } from "./useSupport";
import {
  STATUS_TONE,
  TicketThread,
  categoryLabel,
  statusLabel,
} from "./SupportCenter";

/* ==========================================================================
   Support Inbox (admin) — client, 2026-10-07
   --------------------------------------------------------------------------
   Two things reach NephroReach here:
     · Support requests from every dashboard's Support tab.
     · "Request information for your organization", sent by an office that
       received a secure share from a patient. These are sales leads: an
       organization not yet on NephroReach asking to hear more.
   ========================================================================== */

type Tab = "tickets" | "organizations";
type Filter = "all" | SupportStatus;

export default function SupportInbox() {
  const support = useSupport();
  const shares = useShares();
  const [tab, setTab] = useState<Tab>("tickets");
  const [filter, setFilter] = useState<Filter>("open");
  const [openId, setOpenId] = useState<string | null>(null);

  const tickets = support.state.tickets.filter(
    (t) => filter === "all" || t.status === filter,
  );
  const openCount = support.state.tickets.filter(
    (t) => t.status === "open",
  ).length;

  /* Every organization request, from every secure share, newest first. */
  const requests = shares.state.shares
    .flatMap((share) =>
      share.infoRequests.map((request) => ({
        key: `${share.id}|${request.at}`,
        request,
        patientName: share.patientName,
        sharedWith: share.recipientEmail,
      })),
    )
    .sort((a, b) => b.request.at.localeCompare(a.request.at));
  const newRequests = requests.filter(
    (r) => !support.state.contacted.includes(r.key),
  ).length;

  return (
    <div className="space-y-stack-lg">
      <PageTitle href="/dashboard/admin-support" />

      <Card padding="none">
        <div className="p-card pb-stack-md">
          <Tabs
            label="Support inbox"
            value={tab}
            onChange={setTab}
            items={[
              {
                id: "tickets",
                label: `Support Requests${openCount ? ` (${openCount})` : ""}`,
              },
              {
                id: "organizations",
                label: `Organization Requests${newRequests ? ` (${newRequests})` : ""}`,
              },
            ]}
          />
        </div>

        <TabPanel id="tickets" value={tab} className="px-card pb-card">
          <div className="mb-stack-md flex flex-wrap items-center justify-between gap-inline-md">
            <p className="text-body-sm text-fg-muted">
              From the Support tab on every dashboard.
            </p>
            <Select
              selectSize="small"
              aria-label="Show"
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
            >
              <option value="open">Open</option>
              <option value="answered">Answered</option>
              <option value="resolved">Resolved</option>
              <option value="all">All</option>
            </Select>
          </div>
          {tickets.length === 0 ? (
            <EmptyState
              variant="bare"
              icon={<LifeBuoy aria-hidden="true" />}
              title="Nothing here"
              description="Support requests from patients and offices appear here."
            />
          ) : (
            <ul className="divide-y divide-line-subtle">
              {tickets.map((ticket) => {
                const open = openId === ticket.id;
                return (
                  <li key={ticket.id} className="py-inset-sm first:pt-0">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : ticket.id)}
                      className="flex min-h-11 w-full cursor-pointer items-start justify-between gap-inline-lg rounded-control-small text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <span className="min-w-0">
                        <span className="block text-label-lg text-fg">
                          {ticket.subject}
                        </span>
                        <span className="block text-caption text-fg-muted">
                          {ticket.id} · {ticket.from.name} (
                          {ticket.from.dashboard}
                          {ticket.from.organization
                            ? ` · ${ticket.from.organization}`
                            : ""}
                          ) · {categoryLabel(ticket.category)} ·{" "}
                          {new Date(ticket.createdAt).toLocaleDateString(
                            "en-US",
                          )}
                        </span>
                      </span>
                      <Badge tone={STATUS_TONE[ticket.status]}>
                        {statusLabel(ticket.status)}
                      </Badge>
                    </button>
                    {open ? (
                      <div className="mt-stack-sm space-y-stack-sm">
                        <p className="text-caption text-fg-muted">
                          Reply to {ticket.from.email}
                        </p>
                        <TicketThread
                          ticket={ticket}
                          isEs={false}
                          replyAs="support"
                          onReply={(body) =>
                            support.reply(ticket.id, {
                              by: "support",
                              name: "NephroReach Support",
                              body,
                            })
                          }
                        />
                        <Button
                          size="small"
                          variant="neutral"
                          appearance="fill-stroke"
                          onClick={() =>
                            support.setStatus(
                              ticket.id,
                              ticket.status === "resolved"
                                ? "open"
                                : "resolved",
                            )
                          }
                        >
                          {ticket.status === "resolved"
                            ? "Reopen"
                            : "Mark Resolved"}
                        </Button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </TabPanel>

        <TabPanel id="organizations" value={tab} className="px-card pb-card">
          <p className="mb-stack-md text-body-sm text-fg-muted">
            Offices that received a secure share from a patient and pressed
            &ldquo;Request information for your organization&rdquo;. Follow up,
            then mark them contacted.
          </p>
          {requests.length === 0 ? (
            <EmptyState
              variant="bare"
              icon={<Building2 aria-hidden="true" />}
              title="No organization requests yet"
              description="They appear here as soon as an office sends one from a secure share page."
            />
          ) : (
            <ul className="divide-y divide-line-subtle">
              {requests.map(({ key, request, patientName, sharedWith }) => {
                const done = support.state.contacted.includes(key);
                return (
                  <li
                    key={key}
                    className="flex flex-wrap items-start justify-between gap-inline-lg py-inset-sm first:pt-0"
                  >
                    <span className="min-w-0">
                      <span className="block text-label-lg text-fg">
                        {request.organization || "Organization not given"}
                      </span>
                      <span className="block text-body-sm text-fg-secondary">
                        {request.name} · {request.email}
                        {request.phone ? ` · ${request.phone}` : ""}
                      </span>
                      <span className="block text-caption text-fg-muted">
                        {new Date(request.at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        · from a share by {patientName} to {sharedWith}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-inline-md">
                      <Badge tone={done ? "success" : "warning"}>
                        {done ? "Contacted" : "New"}
                      </Badge>
                      <Button
                        size="small"
                        variant="neutral"
                        appearance="fill-stroke"
                        onClick={() => support.toggleContacted(key)}
                      >
                        {done ? "Mark New" : "Mark Contacted"}
                      </Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </TabPanel>
      </Card>
    </div>
  );
}
