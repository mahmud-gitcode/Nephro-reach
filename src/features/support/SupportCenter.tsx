"use client";

import React, { useState } from "react";
import { LifeBuoy, Plus, Send } from "lucide-react";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
  Select,
  Textarea,
  type BadgeTone,
} from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { organizationFor } from "@/features/staff/staff";
import {
  SUPPORT_CATEGORIES,
  ticketError,
  ticketsFrom,
  type SupportCategory,
  type SupportStatus,
  type SupportTicket,
} from "./support.data";
import { useSupport } from "./useSupport";

/* ==========================================================================
   Support tab — the same page on every dashboard (client, 2026-10-07)
   --------------------------------------------------------------------------
   Write to NephroReach support, see the answer, reply. Everything sent here
   reaches the admin's Support Inbox.
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

const DASHBOARD: Record<string, string> = {
  user: "Patient",
  clinic: "Dialysis Center",
  nephrology: "Nephrology Office",
  access: "Vascular Access Center",
  admin: "NephroReach Admin",
};

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
  onReply?: (body: string) => void;
}) {
  const [body, setBody] = useState("");
  return (
    <div className="space-y-stack-sm">
      <p className="text-body-sm whitespace-pre-wrap text-fg">
        {ticket.message}
      </p>
      {ticket.replies.map((reply, i) => (
        <div
          key={`${reply.at}-${i}`}
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
              : reply.name}
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
          onSubmit={(e) => {
            e.preventDefault();
            if (!body.trim()) return;
            onReply(body);
            setBody("");
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
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            )}
          </FormField>
          <Button
            type="submit"
            size="small"
            disabled={!body.trim()}
            leadingIcon={<Send aria-hidden="true" />}
          >
            {isEs ? "Enviar" : "Send"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

export default function SupportCenter({ href }: { href: string }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEs = language === "ES";
  const support = useSupport();
  const [writing, setWriting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const mine = user ? ticketsFrom(support.state, user.email) : [];

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

      <div className="grid grid-cols-1 gap-inset-md xl:grid-cols-3">
        <Card as="section" padding="small" className="xl:col-span-2">
          <h2 className="text-heading-4 text-fg">
            {isEs ? "Mis solicitudes" : "My Requests"}
          </h2>
          {mine.length === 0 ? (
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
          ) : (
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
                          {ticket.id} · {categoryLabel(ticket.category, isEs)} ·{" "}
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
                        <TicketThread
                          ticket={ticket}
                          isEs={isEs}
                          replyAs="requester"
                          onReply={(body) =>
                            support.reply(ticket.id, {
                              by: "requester",
                              name: user?.name ?? "",
                              body,
                            })
                          }
                        />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
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
          saving={support.isSaving}
          onClose={() => setWriting(false)}
          onSend={(input) => {
            support.open({
              ...input,
              from: {
                name: user?.name ?? "",
                email: user?.email ?? "",
                dashboard: DASHBOARD[user?.role ?? "user"] ?? "Patient",
                organization: organizationFor(user)?.name,
              },
            });
            setWriting(false);
            setSent(true);
          }}
        />
      ) : null}
    </div>
  );
}

function NewRequestModal({
  isEs,
  saving,
  onSend,
  onClose,
}: {
  isEs: boolean;
  saving: boolean;
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
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          )}
        </FormField>
      </div>
    </Modal>
  );
}
