"use client";

import React, { useState } from "react";
import { LifeBuoy, Plus, Send } from "lucide-react";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
  type BadgeTone,
} from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { LoadMore } from "@/features/profile/LoadMore";
import { saveErrorText } from "@/features/profile/saveError";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import {
  SUPPORT_CATEGORIES,
  dashboardFor,
  ticketError,
  ticketOrganizationFor,
  type SupportCategory,
  type SupportStatus,
  type SupportTicket,
} from "./support.data";
import { useMyTickets, useTicket } from "./useSupport";

/* ==========================================================================
   Support tab — the same page on every dashboard (client, 2026-10-07)
   --------------------------------------------------------------------------
   Write to NephroReach support, see the answer, reply. Everything sent here
   reaches the NephroReach team's Support Inbox. Phase 11: the tickets are
   the server's (`/me/support-tickets`); the server knows who is writing, so
   no name or email is sent, and only the office the user works in.
   ========================================================================== */

export const STATUS_TONE: Record<SupportStatus, BadgeTone> = {
  open: "warning",
  answered: "info",
  resolved: "success",
};

export function statusLabel(status: SupportStatus, isEs = false): string {
  const en = { open: "Open", answered: "Answered", resolved: "Resolved" };
  const es = { open: "Abierto", answered: "Respondido", resolved: "Resuelto" };
  return (isEs ? es : en)[status];
}

export function categoryLabel(id: SupportCategory, isEs = false): string {
  const c = SUPPORT_CATEGORIES.find((x) => x.id === id);
  return c ? (isEs ? c.es : c.en) : id;
}

/** One ticket and its conversation, with a reply box. Shared by the
 *  Support tab and the admin's inbox. */
export function TicketThread({
  ticket,
  isEs,
  replyAs,
  onReply,
}: {
  ticket: SupportTicket;
  isEs: boolean;
  replyAs: "support" | "requester";
  /** Resolves once the server has the reply; the box keeps the text on a
   *  refusal so nothing typed is lost. */
  onReply?: (body: string) => Promise<unknown>;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  return (
    <div className="space-y-stack-sm">
      <p className="text-body-sm whitespace-pre-wrap text-fg">
        {ticket.message}
      </p>
      {ticket.replies.map((reply) => (
        <div
          key={reply.id}
          className={
            reply.by === "support"
              ? "rounded-card-nested bg-surface-brand-subtle p-inset-sm"
              : "rounded-card-nested bg-surface-sunken p-inset-sm"
          }
        >
          <p className="text-label-sm text-fg">
            {reply.by === "support"
              ? isEs
                ? "Soporte de NephroReach"
                : "NephroReach Support"
              : reply.name || (isEs ? "Usted" : "You")}
            <span className="ml-inline-sm text-caption text-fg-muted">
              {new Date(reply.at).toLocaleString(isEs ? "es-US" : "en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </p>
          <p className="mt-stack-xs text-body-sm whitespace-pre-wrap text-fg-secondary">
            {reply.body}
          </p>
        </div>
      ))}
      {onReply && ticket.status !== "resolved" ? (
        <form
          className="flex flex-col gap-inline-sm sm:flex-row sm:items-end"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!body.trim() || sending) return;
            setSending(true);
            try {
              await onReply(body);
              setBody("");
            } catch {
              /* Shown by the page from the mutation's error. */
            } finally {
              setSending(false);
            }
          }}
        >
          <FormField
            label={
              replyAs === "support"
                ? isEs
                  ? "Responder como soporte"
                  : "Reply as NephroReach Support"
                : isEs
                  ? "Responder"
                  : "Reply"
            }
            className="flex-1"
          >
            {(field) => (
              <Textarea
                {...field}
                rows={2}
                /* The server's limit, as on a new request (P16b QA round 2
                   crawl: a longer reply was refused with the reason only
                   in the banner at the top of the page). */
                maxLength={4000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            )}
          </FormField>
          <Button
            type="submit"
            size="small"
            disabled={!body.trim()}
            loading={sending}
            leadingIcon={<Send aria-hidden="true" />}
          >
            {isEs ? "Enviar" : "Send"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

/** A ticket opened from a list: its replies are read from the server when
 *  it opens (the list carries none). */
export function TicketDetail({
  side,
  ticket,
  isEs,
  onReply,
}: {
  side: "me" | "platform";
  ticket: SupportTicket;
  isEs: boolean;
  onReply?: (body: string) => Promise<unknown>;
}) {
  const detail = useTicket(side, ticket.id);
  const lang = isEs ? "es" : "en";
  return (
    <AsyncSection
      pending={detail.isPending}
      error={detail.error}
      onRetry={canRetry(detail.error) ? detail.refetch : undefined}
      errorTitle={errorTitleFor(
        detail.error,
        isEs ? "La conversación no se cargó" : "The conversation did not load",
        lang,
      )}
      errorMessage={errorMessageFor(detail.error, undefined, lang)}
      skeleton={<Skeleton height={96} />}
    >
      <TicketThread
        ticket={detail.ticket ?? ticket}
        isEs={isEs}
        replyAs={side === "platform" ? "support" : "requester"}
        onReply={onReply}
      />
    </AsyncSection>
  );
}

export default function SupportCenter({ href }: { href: string }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEs = language === "ES";
  const lang = isEs ? "es" : "en";
  const support = useMyTickets();
  const [writing, setWriting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const mine = support.tickets;

  return (
    <div className="space-y-stack-lg">
      <PageTitle
        href={href}
        action={
          <Button
            leadingIcon={<Plus aria-hidden="true" />}
            onClick={() => setWriting(true)}
          >
            {isEs ? "Nueva solicitud" : "New Request"}
          </Button>
        }
      />

      {sent ? (
        <Alert tone="success" onDismiss={() => setSent(false)}>
          {isEs
            ? "Recibimos su solicitud. El equipo de NephroReach le responderá aquí."
            : "We received your request. The NephroReach team will answer here."}
        </Alert>
      ) : null}
      {support.reply.error ? (
        <Alert tone="danger" onDismiss={() => support.reply.reset()}>
          {saveErrorText(support.reply.error, lang)}
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-inset-md xl:grid-cols-3">
        <Card as="section" padding="small" className="xl:col-span-2">
          <h2 className="text-heading-4 text-fg">
            {isEs ? "Mis solicitudes" : "My Requests"}
          </h2>
          <AsyncSection
            pending={support.isPending}
            error={support.error}
            onRetry={canRetry(support.error) ? support.list.refetch : undefined}
            errorTitle={errorTitleFor(
              support.error,
              isEs
                ? "Sus solicitudes no se cargaron"
                : "Your requests did not load",
              lang,
            )}
            errorMessage={errorMessageFor(support.error, undefined, lang)}
            isEmpty={mine.length === 0}
            skeleton={<Skeleton height={160} className="mt-stack-md" />}
            empty={
              <EmptyState
                variant="bare"
                icon={<LifeBuoy aria-hidden="true" />}
                title={isEs ? "Aún no hay solicitudes" : "No requests yet"}
                description={
                  isEs
                    ? "¿Necesita ayuda con NephroReach? Envíe una nueva solicitud."
                    : "Need help with NephroReach? Send a new request."
                }
              />
            }
          >
            <ul className="mt-stack-md divide-y divide-line-subtle">
              {mine.map((ticket) => {
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
                          {ticket.displayId} ·{" "}
                          {categoryLabel(ticket.category, isEs)} ·{" "}
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
                      <div className="mt-stack-sm">
                        <TicketDetail
                          side="me"
                          ticket={ticket}
                          isEs={isEs}
                          onReply={(body) =>
                            support.reply.mutateAsync({ id: ticket.id, body })
                          }
                        />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <LoadMore read={support.list} />
          </AsyncSection>
        </Card>

        <Card as="section" padding="small">
          <h2 className="text-heading-4 text-fg">
            {isEs ? "Cómo funciona" : "How support works"}
          </h2>
          <ul className="mt-stack-md list-disc space-y-stack-xs pl-5 text-body-sm text-fg-secondary">
            <li>
              {isEs
                ? "Su solicitud va al equipo de NephroReach."
                : "Your request goes to the NephroReach team."}
            </li>
            <li>
              {isEs
                ? "La respuesta aparece aquí, en Mis solicitudes."
                : "The answer appears here, under My Requests."}
            </li>
            <li>
              {isEs
                ? "Soporte es para la plataforma, no para preguntas médicas. En una emergencia, llame al 911."
                : "Support is for the platform, not medical questions. In an emergency, call 911."}
            </li>
          </ul>
        </Card>
      </div>

      {writing ? (
        <NewRequestModal
          isEs={isEs}
          saving={support.open.isPending}
          error={
            support.open.error
              ? saveErrorText(support.open.error, lang)
              : undefined
          }
          onClose={() => {
            support.open.reset();
            setWriting(false);
          }}
          onSend={(input) => {
            const organizationId = user
              ? ticketOrganizationFor(user)
              : undefined;
            support.open.mutate(
              {
                ...input,
                dashboard: dashboardFor(user?.role),
                ...(organizationId ? { organizationId } : {}),
              },
              {
                onSuccess: () => {
                  setWriting(false);
                  setSent(true);
                },
              },
            );
          }}
        />
      ) : null}
    </div>
  );
}

function NewRequestModal({
  isEs,
  saving,
  error: saveError,
  onSend,
  onClose,
}: {
  isEs: boolean;
  saving: boolean;
  /** The server's refusal, shown in the dialog so nothing typed is lost. */
  error?: string;
  onSend: (input: {
    subject: string;
    category: SupportCategory;
    message: string;
  }) => void;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportCategory>("technical");
  const [message, setMessage] = useState("");
  const [tried, setTried] = useState(false);
  const error = ticketError({ subject, message });
  return (
    <Modal
      open
      onClose={onClose}
      title={isEs ? "Nueva solicitud de soporte" : "New Support Request"}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            loading={saving}
            leadingIcon={<Send aria-hidden="true" />}
            onClick={() => {
              setTried(true);
              if (error) return;
              onSend({ subject, category, message });
            }}
          >
            {isEs ? "Enviar" : "Send"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {saveError ? <Alert tone="danger">{saveError}</Alert> : null}
        <FormField
          label={isEs ? "Asunto" : "Subject"}
          required
          error={
            tried && error === "subject"
              ? isEs
                ? "Escriba un asunto."
                : "Enter a subject."
              : undefined
          }
        >
          {(field) => (
            <Input
              {...field}
              value={subject}
              maxLength={150}
              onChange={(e) => setSubject(e.target.value)}
            />
          )}
        </FormField>
        <FormField label={isEs ? "Tema" : "Topic"}>
          {(field) => (
            <Select
              {...field}
              value={category}
              onChange={(e) => setCategory(e.target.value as SupportCategory)}
            >
              {SUPPORT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {isEs ? c.es : c.en}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField
          label={isEs ? "¿Cómo podemos ayudar?" : "How can we help?"}
          required
          error={
            tried && error === "message"
              ? isEs
                ? "Cuéntenos un poco más."
                : "Tell us a little more."
              : undefined
          }
        >
          {(field) => (
            <Textarea
              {...field}
              rows={5}
              maxLength={4000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          )}
        </FormField>
      </div>
    </Modal>
  );
}
