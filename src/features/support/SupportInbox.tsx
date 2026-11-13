"use client";

import React, { useState } from "react";
import { Building2, LifeBuoy } from "lucide-react";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  Card,
  EmptyState,
  Select,
  Skeleton,
  TabPanel,
  Tabs,
} from "@/components/ui";
import { useLanguageCode } from "@/context/LanguageContext";
import { LoadMore } from "@/features/profile/LoadMore";
import { saveErrorText } from "@/features/profile/saveError";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import {
  useInfoRequests,
  usePlatformTickets,
  type InboxFilter,
} from "./useSupport";
import {
  STATUS_TONE,
  TicketDetail,
  categoryLabel,
  statusLabel,
} from "./SupportCenter";

/* ==========================================================================
   Support Inbox (NephroReach team) — client, 2026-10-07
   --------------------------------------------------------------------------
   Two things reach NephroReach here:
     · Support requests from every dashboard's Support tab.
     · "Request information for your organization", sent by an office that
       received a secure share from a patient. These are sales leads: an
       organization not yet on NephroReach asking to hear more.
   Phase 11: both come from the server's platform routes, which only a
   platform account with the support permission may read; nothing about a
   share is read in this browser.
   ========================================================================== */

type Tab = "tickets" | "organizations";

/** The server's `dashboard` values, as the Spanish screen names them. */
const DASHBOARD_ES: Record<string, string> = {
  Patient: "Paciente",
  "Dialysis Center": "Centro de diálisis",
  "Nephrology Office": "Consultorio de nefrología",
  "Vascular Access Center": "Centro de acceso vascular",
  Hospital: "Hospital",
  "NephroReach Admin": "Administrador de NephroReach",
};

function errorCopy({
  error,
  title,
  lang,
}: {
  error: unknown;
  title: string;
  lang: "en" | "es";
}) {
  return {
    title: errorTitleFor(error, title, lang),
    message: errorMessageFor(error, undefined, lang),
  };
}

export default function SupportInbox() {
  const isEs = useLanguageCode() === "ES";
  const lang = isEs ? "es" : "en";
  const [tab, setTab] = useState<Tab>("tickets");
  const [filter, setFilter] = useState<InboxFilter>("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const support = usePlatformTickets(filter);
  const info = useInfoRequests();
  const tickets = support.tickets;
  const requests = info.requests;
  const ticketsCopy = errorCopy({
    error: support.list.error,
    title: isEs
      ? "Las solicitudes de soporte no se cargaron"
      : "Support requests did not load",
    lang,
  });
  const requestsCopy = errorCopy({
    error: info.list.error,
    title: isEs
      ? "Las solicitudes de organizaciones no se cargaron"
      : "Organization requests did not load",
    lang,
  });

  return (
    <div className="space-y-stack-lg">
      <PageTitle href="/dashboard/admin-support" />

      {support.saveError ? (
        <Alert tone="danger" onDismiss={support.clearSaveError}>
          {saveErrorText(support.saveError, lang)}
        </Alert>
      ) : null}
      {info.toggle.error ? (
        <Alert tone="danger" onDismiss={() => info.toggle.reset()}>
          {saveErrorText(info.toggle.error, lang)}
        </Alert>
      ) : null}

      <Card padding="none">
        <div className="p-card pb-stack-md">
          <Tabs
            label={isEs ? "Bandeja de soporte" : "Support inbox"}
            value={tab}
            onChange={setTab}
            items={[
              {
                id: "tickets",
                label: `${isEs ? "Solicitudes de soporte" : "Support Requests"}${support.openCount ? ` (${support.openCount})` : ""}`,
              },
              {
                id: "organizations",
                label: `${isEs ? "Solicitudes de organizaciones" : "Organization Requests"}${info.newCount ? ` (${info.newCount})` : ""}`,
              },
            ]}
          />
        </div>

        <TabPanel id="tickets" value={tab} className="px-card pb-card">
          <div className="mb-stack-md flex flex-wrap items-center justify-between gap-inline-md">
            <p className="text-body-sm text-fg-muted">
              {isEs
                ? "Desde la pestaña Soporte de cada panel."
                : "From the Support tab on every dashboard."}
            </p>
            <Select
              selectSize="small"
              aria-label={isEs ? "Mostrar" : "Show"}
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as InboxFilter);
                setOpenId(null);
              }}
            >
              <option value="open">{statusLabel("open", isEs)}</option>
              <option value="answered">{statusLabel("answered", isEs)}</option>
              <option value="resolved">{statusLabel("resolved", isEs)}</option>
              <option value="all">{isEs ? "Todas" : "All"}</option>
            </Select>
          </div>
          <AsyncSection
            pending={support.list.isPending}
            error={support.list.error}
            onRetry={
              canRetry(support.list.error) ? support.list.refetch : undefined
            }
            errorTitle={ticketsCopy.title}
            errorMessage={ticketsCopy.message}
            isEmpty={tickets.length === 0}
            skeleton={<Skeleton height={160} />}
            empty={
              <EmptyState
                variant="bare"
                icon={<LifeBuoy aria-hidden="true" />}
                title={isEs ? "No hay nada aquí" : "Nothing here"}
                description={
                  isEs
                    ? "Aquí aparecen las solicitudes de soporte de pacientes y oficinas."
                    : "Support requests from patients and offices appear here."
                }
              />
            }
          >
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
                          {ticket.displayId} · {ticket.from.name || "—"} (
                          {isEs
                            ? (DASHBOARD_ES[ticket.from.dashboard] ??
                              ticket.from.dashboard)
                            : ticket.from.dashboard}
                          {ticket.from.organization
                            ? ` · ${ticket.from.organization}`
                            : ""}
                          ) · {categoryLabel(ticket.category, isEs)} ·{" "}
                          {new Date(ticket.createdAt).toLocaleDateString(
                            isEs ? "es-US" : "en-US",
                          )}
                        </span>
                      </span>
                      <Badge tone={STATUS_TONE[ticket.status]}>
                        {statusLabel(ticket.status, isEs)}
                      </Badge>
                    </button>
                    {open ? (
                      <div className="mt-stack-sm space-y-stack-sm">
                        {ticket.from.email ? (
                          <p className="text-caption text-fg-muted">
                            {isEs ? "Responder a" : "Reply to"}{" "}
                            {ticket.from.email}
                          </p>
                        ) : null}
                        <TicketDetail
                          side="platform"
                          ticket={ticket}
                          isEs={isEs}
                          onReply={(body) =>
                            support.reply.mutateAsync({ id: ticket.id, body })
                          }
                        />
                        <Button
                          size="small"
                          variant="neutral"
                          appearance="fill-stroke"
                          loading={support.setStatus.isPending}
                          onClick={() =>
                            support.setStatus.mutate({
                              id: ticket.id,
                              status:
                                ticket.status === "resolved"
                                  ? "open"
                                  : "resolved",
                            })
                          }
                        >
                          {ticket.status === "resolved"
                            ? isEs
                              ? "Reabrir"
                              : "Reopen"
                            : isEs
                              ? "Marcar como resuelta"
                              : "Mark Resolved"}
                        </Button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <LoadMore read={support.list} />
          </AsyncSection>
        </TabPanel>

        <TabPanel id="organizations" value={tab} className="px-card pb-card">
          <p className="mb-stack-md text-body-sm text-fg-muted">
            {isEs ? (
              <>
                Oficinas que recibieron contenido compartido de forma segura por
                un paciente y pulsaron &ldquo;Solicitar información para su
                organización&rdquo;. Haga el seguimiento y luego márquelas como
                contactadas.
              </>
            ) : (
              <>
                Offices that received a secure share from a patient and pressed
                &ldquo;Request information for your organization&rdquo;. Follow
                up, then mark them contacted.
              </>
            )}
          </p>
          <AsyncSection
            pending={info.list.isPending}
            error={info.list.error}
            onRetry={canRetry(info.list.error) ? info.list.refetch : undefined}
            errorTitle={requestsCopy.title}
            errorMessage={requestsCopy.message}
            isEmpty={requests.length === 0}
            skeleton={<Skeleton height={160} />}
            empty={
              <EmptyState
                variant="bare"
                icon={<Building2 aria-hidden="true" />}
                title={
                  isEs
                    ? "Aún no hay solicitudes de organizaciones"
                    : "No organization requests yet"
                }
                description={
                  isEs
                    ? "Aparecen aquí en cuanto una oficina envía una desde una página de contenido compartido seguro."
                    : "They appear here as soon as an office sends one from a secure share page."
                }
              />
            }
          >
            <ul className="divide-y divide-line-subtle">
              {requests.map((request) => (
                <li
                  key={request.id}
                  className="flex flex-wrap items-start justify-between gap-inline-lg py-inset-sm first:pt-0"
                >
                  <span className="min-w-0">
                    <span className="block text-label-lg text-fg">
                      {request.organization ||
                        (isEs
                          ? "Organización no indicada"
                          : "Organization not given")}
                    </span>
                    <span className="block text-body-sm text-fg-secondary">
                      {request.name} · {request.email}
                      {request.phone ? ` · ${request.phone}` : ""}
                    </span>
                    <span className="block text-caption text-fg-muted">
                      {new Date(request.at).toLocaleString(
                        isEs ? "es-US" : "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      )}{" "}
                      ·{" "}
                      {request.sharedByOrganization
                        ? isEs
                          ? `de contenido compartido por ${request.sharedByOrganization}`
                          : `from a share sent by ${request.sharedByOrganization}`
                        : isEs
                          ? "de contenido compartido por un miembro de NephroReach"
                          : "from a share sent by a NephroReach member"}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-inline-md">
                    <Badge tone={request.contacted ? "success" : "warning"}>
                      {request.contacted
                        ? isEs
                          ? "Contactada"
                          : "Contacted"
                        : isEs
                          ? "Nueva"
                          : "New"}
                    </Badge>
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="fill-stroke"
                      onClick={() =>
                        info.toggle.mutate({
                          id: request.id,
                          contacted: !request.contacted,
                        })
                      }
                    >
                      {request.contacted
                        ? isEs
                          ? "Marcar como nueva"
                          : "Mark New"
                        : isEs
                          ? "Marcar como contactada"
                          : "Mark Contacted"}
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
            <LoadMore read={info.list} />
          </AsyncSection>
        </TabPanel>
      </Card>
    </div>
  );
}
