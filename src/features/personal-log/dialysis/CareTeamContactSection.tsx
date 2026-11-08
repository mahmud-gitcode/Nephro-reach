"use client";

import { useSafetyNotice } from "@/features/messaging/useSafetyNotice";
import React, { useState } from "react";
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
import {
  useMemberMessaging,
  useMessageRecipients,
} from "@/features/messaging/useConversations";
import { saveErrorText } from "@/features/profile/saveError";
import { useAccessPhotos } from "./useAccessPhotos";
import { photoAttachment, type AccessPhoto } from "./accessPhotos";
import { PhotoPicker } from "./PhotoPicker";

/* ==========================================================================
   Communication with the care team
   --------------------------------------------------------------------------
   A member at home cannot lean over and ask the nurse in the next chair, so
   the log itself has to be able to send a message.

   It writes into the member's own thread with the office (Phase 11: the
   server's `/patients/:id/conversations`, which reuses the thread already
   shared with that office), never a second inbox: a member sending from
   here and a nurse replying in Messages see the same conversation. The
   after-hours reply is the server's.

   The reason chips are a subject line, not a category: they get prefixed to
   the message so the nurse reading the thread knows what it is about
   without a taxonomy nobody maintains.

   A photo from the Photos card beside this one is referenced in the
   message by its record (Phase 7: the picture stays on the server as the
   access photo; it is never copied into the message as a data: image).
   ========================================================================== */

/** The line naming an access photo in the message: its subject, when it
 *  was taken and its record id, never the picture itself. */
function photoReference(photo: AccessPhoto, isEs: boolean): string {
  const { name } = photoAttachment(photo, isEs);
  const taken = photo.takenAt.slice(0, 10);
  return isEs
    ? `Foto de acceso: ${name} (${taken}, registro ${photo.id})`
    : `Access photo: ${name} (${taken}, record ${photo.id})`;
}

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
  const safety = useSafetyNotice(isEs);
  const REASONS = reasonsFor(isHome);
  const photoLog = useAccessPhotos();

  const messaging = useMemberMessaging();
  const recipients = useMessageRecipients(messaging.scope);
  /* The offices caring for the member: each is one thread on the server. */
  const threads = recipients.offices;

  const [threadId, setThreadId] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [body, setBody] = useState("");
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Default to the first thread once they have loaded.
  const activeThread = threadId || threads[0]?.organizationId || "";
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

    const words = body.trim();
    const text = photo
      ? [words, photoReference(photo, isEs)].filter(Boolean).join(" · ")
      : words;
    safety.guard(() => {
      setSent(false);
      messaging.start
        .mutateAsync({
          organizationId: activeThread,
          category: "care-team",
          body: subject ? `[${subject}] ${text}`.trim() : text,
        })
        .then(
          () => {
            if (photo) photoLog.markSent(photo.id);
            setBody("");
            setReasons([]);
            setPhotoId(null);
            setSent(true);
          },
          () => {
            /* The error shows below; what was typed stays. */
          },
        );
    });
  };

  return (
    <Card as="section" padding="small">
      {safety.notice}
      <SectionTitle
        title={isEs ? "Enviar Mensaje a mi Equipo" : "Message My Care Team"}
        action={
          <Link
            href="/dashboard/messages"
            className="-my-2.5 inline-flex min-h-11 items-center text-body-sm font-semibold text-fg-brand hover:underline"
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
            {threads.map((office) => (
              <option key={office.organizationId} value={office.organizationId}>
                {office.name} — {office.role}
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
          <Button
            type="submit"
            size="small"
            disabled={!canSend}
            loading={messaging.start.isPending}
          >
            <Send />
            <span>{isEs ? "Enviar" : "Send"}</span>
          </Button>
        </div>
      </form>

      {messaging.start.error ? (
        <Alert tone="danger" className="mt-stack-md">
          {isEs
            ? "No se pudo enviar. Intenta de nuevo."
            : "That did not send. Try again."}{" "}
          {saveErrorText(messaging.start.error, isEs ? "es" : "en")}
        </Alert>
      ) : recipients.error ? (
        <Alert tone="danger" className="mt-stack-md">
          {saveErrorText(recipients.error, isEs ? "es" : "en")}
        </Alert>
      ) : sent ? (
        <Alert tone="success" className="mt-stack-md">
          {isEs ? "Mensaje enviado." : "Message sent."}
        </Alert>
      ) : null}
    </Card>
  );
}
