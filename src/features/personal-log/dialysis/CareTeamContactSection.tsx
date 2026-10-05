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
import { useMemberName } from "@/features/auth/useMemberName";
import { useAccessPhotos } from "./useAccessPhotos";
import { photoAttachment } from "./accessPhotos";
import { PhotoPicker } from "./PhotoPicker";

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

   A photo from the Photos card beside this one can ride along with the
   message, so the nurse sees the exit site the words are about.
   ========================================================================== */

type Reason = { id: string; en: string; es: string };

const QUESTION: Reason = { id: "question", en: "Question", es: "Pregunta" };
const SYMPTOM: Reason = { id: "symptom", en: "Symptom", es: "Síntoma" };
const ACCESS: Reason = {
  id: "access",
  en: "Access concern",
  es: "Problema con el acceso",
};
const SUPPLIES: Reason = {
  id: "supplies",
  en: "Supply issue",
  es: "Problema de insumos",
};
const TREATMENT: Reason = {
  id: "treatment",
  en: "Treatment issue",
  es: "Problema de tratamiento",
};
const LABS: Reason = {
  id: "labs",
  en: "Lab results",
  es: "Resultados de laboratorio",
};

/* An in-center member's supplies are the unit's problem, not theirs, so the
   chip would only invite messages about something they do not manage. Every
   modality has an access to worry about. */
function reasonsFor(isHome: boolean): Reason[] {
  return isHome
    ? [QUESTION, SYMPTOM, ACCESS, SUPPLIES, TREATMENT, LABS]
    : [QUESTION, SYMPTOM, ACCESS, TREATMENT, LABS];
}

const MAX_BODY = 500;

export default function CareTeamContactSection({
  isHome,
}: {
  /** Home HD and PD manage their own supplies; in-center does not. */
  isHome: boolean;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const REASONS = reasonsFor(isHome);
  const photoLog = useAccessPhotos();

  const messaging = useMessages();
  const memberName = useMemberName();
  const threads = useMemo(
    () => rules.memberConversations(messaging.conversations, memberName),
    [messaging.conversations, memberName],
  );

  const [threadId, setThreadId] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [body, setBody] = useState("");
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Default to the first thread once they have loaded.
  const activeThread = threadId || threads[0]?.id || "";
  // Deleted from the Photos card since it was picked: nothing to send.
  const photo = photoLog.photos.find((entry) => entry.id === photoId) ?? null;
  const canSend = !!activeThread && (body.trim().length > 0 || !!photo);

  const toggleReason = (id: string) =>
    setReasons((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSend) return;

    // A chip for a modality switched away from since it was picked is dropped.
    const subject = reasons
      .filter((id) => REASONS.some((entry) => entry.id === id))
      .map((id) => {
        const reason = REASONS.find((entry) => entry.id === id);
        return reason ? (isEs ? reason.es : reason.en) : id;
      })
      .join(", ");

    const text = body.trim();
    messaging.sendMessage(
      activeThread,
      subject ? `[${subject}] ${text}`.trim() : text,
      "member",
      photo ? photoAttachment(photo, isEs) : undefined,
    );
    if (photo) photoLog.markSent(photo.id);

    setBody("");
    setReasons([]);
    setPhotoId(null);
    setSent(true);
  };

  return (
    <Card as="section" padding="small">
      <SectionTitle
        title={isEs ? "Enviar Mensaje a mi Equipo" : "Message My Care Team"}
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

        <PhotoPicker
          photos={photoLog.photos}
          value={photoId}
          onChange={(id) => {
            setPhotoId(id);
            setSent(false);
          }}
          isEs={isEs}
        />

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
