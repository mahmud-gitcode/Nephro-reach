"use client";

import React, { useState } from "react";
import { CircleAlert, Phone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { createId, questionError } from "./tableTalk.rules";
import { Alert, Button, FormField, Modal, Textarea } from "@/components/ui";

/* ==========================================================================
   Suggest a Table Talk Question
   --------------------------------------------------------------------------
   A member says what they would like a future episode to cover. It is not
   clinical messaging and nothing here reaches a clinician, which is why the
   form says so before the send button rather than in the confirmation.

   The urgent-words check is the part that matters. Someone typing "chest
   pain" into a suggestion box is a person who needs help now, and quietly
   filing that as a topic idea would be the worst thing this screen could do.
   ========================================================================== */

export function SuggestQuestionModal({
  onClose,
  onSubmit,
  saving = false,
}: {
  onClose: () => void;
  onSubmit: (question: {
    id: string;
    body: string;
    askedByName: string;
    askedByEmail: string;
    submittedAt: string;
    status: "new";
    adminNote: string;
  }) => void;
  saving?: boolean;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { user } = useAuth();

  const [body, setBody] = useState("");
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);

  const error = questionError(body);
  const urgent = touched && error === "urgent";

  const send = () => {
    setTouched(true);
    if (error) return;

    onSubmit({
      id: createId("q"),
      body: body.trim(),
      askedByName: user?.name ?? "",
      askedByEmail: user?.email ?? "",
      submittedAt: new Date().toISOString(),
      status: "new",
      adminNote: "",
    });
    setSent(true);
  };

  return (
    <Modal
      open
      size="big"
      onClose={onClose}
      title={isEs ? "Sugerir una pregunta" : "Suggest a Table Talk Question"}
      description={
        isEs
          ? "Dinos qué te gustaría que cubriéramos en un próximo episodio."
          : "Tell us what you would like a future episode to cover."
      }
      footer={
        sent ? (
          <Button onClick={onClose}>{isEs ? "Cerrar" : "Close"}</Button>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-inline-md">
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={onClose}
            >
              {isEs ? "Cancelar" : "Cancel"}
            </Button>
            <Button onClick={send} disabled={saving}>
              {saving
                ? isEs
                  ? "Enviando…"
                  : "Sending…"
                : isEs
                  ? "Enviar pregunta"
                  : "Send question"}
            </Button>
          </div>
        )
      }
    >
      {sent ? (
        <Alert tone="success" title={isEs ? "Recibida" : "Question received"}>
          {isEs
            ? "Gracias. Un administrador de NephroReach la leerá. Tu pregunta no se publica automáticamente y nunca aparece con tu nombre."
            : "Thank you. A NephroReach admin will read it. Your question is not published automatically and never appears with your name on it."}
        </Alert>
      ) : (
        <div className="space-y-stack-md">
          {/* Said before they type, not after they send. */}
          <Alert tone="warning" icon={<CircleAlert aria-hidden="true" />}>
            {isEs
              ? "No envíes emergencias, síntomas urgentes ni solicitudes de consejo médico personal por este formulario."
              : "Do not submit emergencies, urgent symptoms, or requests for individualized medical advice through this form."}
          </Alert>

          <FormField
            label={isEs ? "Tu pregunta o tema" : "Your question or topic"}
            required
            hint={
              isEs
                ? "Por ejemplo: ¿por qué es tan importante el fósforo?"
                : "For example: why is phosphorus so important?"
            }
            error={
              touched && error === "too-short"
                ? isEs
                  ? "Escribe un poco más para que se entienda."
                  : "Write a little more so we understand the question."
                : undefined
            }
          >
            {(props) => (
              <Textarea
                {...props}
                rows={5}
                value={body}
                onChange={(event) => {
                  setBody(event.target.value);
                  if (touched) setTouched(false);
                }}
                placeholder={
                  isEs
                    ? "¿Qué te gustaría que explicáramos?"
                    : "What would you like us to explain?"
                }
              />
            )}
          </FormField>

          {/* Stops the send and points them somewhere that can help. */}
          {urgent ? (
            <Alert
              tone="danger"
              title={
                isEs
                  ? "Esto necesita atención ahora, no un episodio"
                  : "This needs attention now, not an episode"
              }
              icon={<Phone aria-hidden="true" />}
            >
              {isEs
                ? "Lo que escribiste menciona algo urgente. Llama al 911 o a tu clínica de diálisis ahora mismo. Nadie revisa este formulario en tiempo real."
                : "What you wrote mentions something urgent. Call 911 or your dialysis clinic now. Nobody reads this form in real time."}
            </Alert>
          ) : null}
        </div>
      )}
    </Modal>
  );
}

export default SuggestQuestionModal;
