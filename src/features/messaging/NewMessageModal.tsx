"use client";

import React, { useState } from "react";
import { Send } from "lucide-react";
import {
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
   One dialog for both ends: a member writes to someone on their care team,
   the clinic writes to one of its patients. Sending goes into the thread
   the two already share if there is one (messaging.rules startConversation).
   ========================================================================== */

export type Recipient = { value: string; label: string };

export function NewMessageModal({
  title,
  recipientLabel,
  recipients,
  withCategory = false,
  isEs = false,
  initialBody = "",
  initialCategory = "care-team",
  onSend,
  onClose,
  confirmSend,
}: {
  /** Runs before the send, e.g. the safety notice; it calls `send` when
   *  the member confirms, so a cancel keeps what they typed. */
  confirmSend?: (send: () => void) => void;
  /** Pre-filled text, e.g. a check-in reminder. */
  initialBody?: string;
  initialCategory?: MessageCategory;
  title: string;
  recipientLabel: string;
  recipients: Recipient[];
  /** The member files a thread as care team or appointments. */
  withCategory?: boolean;
  isEs?: boolean;
  onSend: (recipient: string, body: string, category: MessageCategory) => void;
  onClose: () => void;
}) {
  const [recipient, setRecipient] = useState(recipients[0]?.value ?? "");
  const [category, setCategory] = useState<MessageCategory>(initialCategory);
  const [body, setBody] = useState(initialBody);
  const [tried, setTried] = useState(false);
  const error = !body.trim()
    ? isEs
      ? "Escribe un mensaje"
      : "Write a message"
    : undefined;

  function send() {
    setTried(true);
    if (error || !recipient) return;
    const send = () => {
      onSend(recipient, body, category);
      onClose();
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
          <Button onClick={send} leadingIcon={<Send aria-hidden="true" />}>
            {isEs ? "Enviar" : "Send"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        <FormField label={recipientLabel} required>
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
