"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  Button,
  Card,
  Chip,
  ChipGroup,
  SectionTitle,
  Select,
} from "@/components/ui";
import { useMessages } from "@/features/messaging/useMessages";
import * as rules from "@/features/messaging/messaging.rules";
import { DEMO_MEMBER } from "@/features/messaging/messaging.seed";

/* ==========================================================================
   Communication with the care team
   --------------------------------------------------------------------------
   A member at home cannot lean over and ask the nurse in the next chair, so
   the log itself has to be able to send a message.

   It writes into the existing messaging store rather than keeping its own.
   A second inbox would mean a member sending from here and a nurse replying
   in Messages, with neither able to see the other half of the conversation.

   The reason chips are a subject line, not a category: they get prefixed to
   the message so the nurse reading the thread knows what it is about
   without a taxonomy nobody maintains.
   ========================================================================== */

const REASONS: { id: string; en: string; es: string }[] = [
  { id: "question", en: "Question", es: "Pregunta" },
  { id: "symptom", en: "Symptom", es: "Síntoma" },
  { id: "supplies", en: "Supply issue", es: "Problema de insumos" },
  { id: "treatment", en: "Treatment issue", es: "Problema de tratamiento" },
  { id: "labs", en: "Lab results", es: "Resultados de laboratorio" },
];

const MAX_BODY = 500;

export default function CareTeamContactSection() {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const messaging = useMessages();
  const threads = useMemo(
    () => rules.memberConversations(messaging.conversations, DEMO_MEMBER),
    [messaging.conversations],
  );

  const [threadId, setThreadId] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  // Default to the first thread once they have loaded.
  const activeThread = threadId || threads[0]?.id || "";
  const canSend = !!activeThread && body.trim().length > 0;

  const toggleReason = (id: string) =>
    setReasons((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSend) return;

    const subject = reasons
      .map((id) => {
        const reason = REASONS.find((entry) => entry.id === id);
        return reason ? (isEs ? reason.es : reason.en) : id;
      })
      .join(", ");

    messaging.sendMessage(
      activeThread,
      subject ? `[${subject}] ${body.trim()}` : body.trim(),
      "member",
    );

    setBody("");
    setReasons([]);
    setSent(true);
  };

  return (
    <Card as="section" padding="small">
      <SectionTitle
        title={isEs ? "Contactar a tu Equipo" : "Contact Your Care Team"}
        action={
          <Link
            href="/dashboard/messages"
            className="text-body-sm font-semibold text-fg-brand hover:underline"
          >
            {isEs ? "Ver mensajes" : "All messages"}
          </Link>
        }
      />

      <form onSubmit={handleSend} className="space-y-stack-md">
        <div className="space-y-1.5">
          <label
            htmlFor="care-team-thread"
            className="block text-label-md text-fg-secondary"
          >
            {isEs ? "Para" : "To"}
          </label>
          <Select
            id="care-team-thread"
            selectSize="small"
            value={activeThread}
            onChange={(event) => setThreadId(event.target.value)}
            disabled={threads.length === 0}
          >
            {threads.map((thread) => (
              <option key={thread.id} value={thread.id}>
                {thread.contact.name} — {thread.contact.role}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <ChipGroup label={isEs ? "Motivo" : "Reason"}>
            {REASONS.map((reason) => (
              <Chip
                key={reason.id}
                selected={reasons.includes(reason.id)}
                onClick={() => toggleReason(reason.id)}
              >
                {isEs ? reason.es : reason.en}
              </Chip>
            ))}
          </ChipGroup>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="care-team-body"
            className="block text-label-md text-fg-secondary"
          >
            {isEs ? "Mensaje" : "Message"}
          </label>
          <textarea
            id="care-team-body"
            rows={3}
            maxLength={MAX_BODY}
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              setSent(false);
            }}
            placeholder={
              isEs ? "Escribe tu mensaje..." : "Type your message..."
            }
            className="w-full resize-none rounded-control border border-line bg-surface px-inset-sm py-inset-xs text-body-sm text-fg outline-none placeholder:text-fg-subtle focus:border-primary-soft-line focus:ring-2 focus:ring-ring/60"
          />
          <p className="text-right text-body-sm text-fg-muted tabular-nums">
            {body.length}/{MAX_BODY}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-inline-md">
          <Button type="submit" size="small" disabled={!canSend}>
            <Send />
            <span>{isEs ? "Enviar" : "Send"}</span>
          </Button>
        </div>
      </form>

      {messaging.writeError ? (
        <Alert tone="danger" className="mt-stack-md">
          {isEs
            ? "No se pudo enviar. Intenta de nuevo."
            : "That did not send. Try again."}
        </Alert>
      ) : sent ? (
        <Alert tone="success" className="mt-stack-md">
          {isEs ? "Mensaje enviado." : "Message sent."}
        </Alert>
      ) : null}
    </Card>
  );
}
