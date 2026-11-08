"use client";

import React, { useState } from "react";
import { Send } from "lucide-react";
import {
  Alert,
  Button,
  FormField,
  Modal,
  SegmentedChoice,
  Select,
  Textarea,
} from "@/components/ui";
import type { MessageCategory } from "./messaging.types";

/* ==========================================================================
   New Message
   --------------------------------------------------------------------------
   One dialog for both ends: a member writes to an office caring for them,
   an office writes to one of its patients. The server puts the message in
   the thread the two already share, if there is one. Recipients are ids
   (an organization id, a patient id), never names.
   ========================================================================== */

export type Recipient = { value: string; label: string };

export function NewMessageModal({
  title,
  recipientLabel,
  recipients,
  withCategory = false,
  isEs = false,
  initialBody = "",
  initialRecipient,
  initialCategory = "care-team",
  onSend,
  onClose,
  confirmSend,
  recipientsPending = false,
  recipientsError,
  sending = false,
  sendError,
}: {
  /** The recipient list is still loading. */
  recipientsPending?: boolean;
  /** Why there is no one to write to (a failed read, or none). */
  recipientsError?: string;
  sending?: boolean;
  /** The server's refusal of the last send; the dialog stays open. */
  sendError?: string;
  /** Runs before the send, e.g. the safety notice; it calls `send` when
   *  the member confirms, so a cancel keeps what they typed. */
  confirmSend?: (send: () => void) => void;
  /** Pre-filled text, e.g. a check-in reminder. */
  initialBody?: string;
  /** The recipient already chosen, e.g. "Message" on a member's row. */
  initialRecipient?: string;
  initialCategory?: MessageCategory;
  title: string;
  recipientLabel: string;
  recipients: Recipient[];
  /** The member files a thread as care team or appointments. */
  withCategory?: boolean;
  isEs?: boolean;
  /** When it returns a promise, the dialog closes only once it resolves,
   *  so a refused send keeps what was typed. */
  onSend: (
    recipient: string,
    body: string,
    category: MessageCategory,
  ) => void | Promise<unknown>;
  onClose: () => void;
}) {
  const [picked, setRecipient] = useState<string | null>(
    initialRecipient ?? null,
  );
  /* The list can arrive after the dialog opens: keep a valid pick, else
     the first recipient. */
  const recipient =
    picked && recipients.some((r) => r.value === picked)
      ? picked
      : (recipients[0]?.value ?? "");
  const [category, setCategory] = useState<MessageCategory>(initialCategory);
  const [body, setBody] = useState(initialBody);
  const [tried, setTried] = useState(false);
  /* A send that throws at once (a screen whose sending is not connected
     yet) keeps the dialog open with this, never closes as if sent. */
  const [thrown, setThrown] = useState<string | null>(null);
  const error = !body.trim()
    ? isEs
      ? "Escribe un mensaje"
      : "Write a message"
    : undefined;

  function send() {
    setTried(true);
    if (error || !recipient) return;
    const send = () => {
      let result: void | Promise<unknown>;
      setThrown(null);
      try {
        result = onSend(recipient, body, category);
      } catch (cause) {
        const unavailable =
          (cause as { code?: unknown } | null)?.code ===
          "messaging.write_unavailable";
        setThrown(
          unavailable
            ? isEs
              ? "El mensaje no se envió: enviar desde esta pantalla aún no está disponible. Escriba al paciente desde Mensajes."
              : "This message was not sent: sending from this screen is not available yet. Write to the patient from Messages."
            : isEs
              ? "El mensaje no se envió."
              : "This message was not sent.",
        );
        return;
      }
      if (result && typeof (result as Promise<unknown>).then === "function")
        (result as Promise<unknown>).then(onClose, () => {
          /* The page passes the server's refusal as sendError. */
        });
      else onClose();
    };
    if (confirmSend) confirmSend(send);
    else send();
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="big"
      title={title}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            onClick={send}
            loading={sending}
            disabled={!recipient || recipientsPending}
            leadingIcon={<Send aria-hidden="true" />}
          >
            {isEs ? "Enviar" : "Send"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {sendError || thrown ? (
          <Alert tone="danger">{sendError ?? thrown}</Alert>
        ) : null}
        <FormField
          label={recipientLabel}
          required
          error={recipientsPending ? undefined : recipientsError}
        >
          {(field) => (
            <Select
              {...field}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            >
              {recipients.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        {withCategory ? (
          <SegmentedChoice
            label={isEs ? "Sobre" : "About"}
            value={category}
            onChange={(next: MessageCategory) => setCategory(next)}
            options={[
              {
                value: "care-team",
                label: isEs ? "Mi cuidado" : "My care",
              },
              {
                value: "appointments",
                label: isEs ? "Citas" : "Appointments",
              },
            ]}
          />
        ) : null}
        <FormField
          label={isEs ? "Mensaje" : "Message"}
          required
          error={tried ? error : undefined}
        >
          {(field) => (
            <Textarea
              {...field}
              rows={5}
              maxLength={2000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          )}
        </FormField>
      </div>
    </Modal>
  );
}
