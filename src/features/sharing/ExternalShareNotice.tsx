"use client";

import React, { useCallback, useState } from "react";
import { Send } from "lucide-react";
import { Alert, Button, Modal } from "@/components/ui";

/* ==========================================================================
   External Sharing Notice (client, 2026-10-07)
   --------------------------------------------------------------------------
   Every place information can be exported or sent outside NephroReach —
   a download, a print, an email, a secure link — asks first, in the
   client's own words, and only goes ahead once the person ticks the
   acknowledgement and presses Confirm & Send.

   Usage:
     const share = useExternalShare(isEs);
     <Button onClick={() => share.guard(download)}>Download</Button>
     {share.notice}
   ========================================================================== */

const COPY: Record<"en" | "es", AckCopy> = {
  en: {
    title: "External Sharing Notice",
    body: [
      "You are about to send information to a person or organization outside of the NephroReach network.",
      "Once information is exported or sent outside of NephroReach, NephroReach cannot control how the recipient accesses, stores, uses, forwards, downloads, or further shares that information. The recipient may not be subject to NephroReach’s privacy, security, or confidentiality requirements.",
      "Before continuing, please confirm that you selected the correct recipient and that you are authorized to share the information included in this export. Do not include information that is not necessary for the intended purpose.",
      "By selecting “Confirm & Send,” you acknowledge that the information will leave the NephroReach environment and may no longer be protected by NephroReach’s security controls.",
    ],
    check:
      "I understand that I am sending information outside of NephroReach and have confirmed the recipient and information being shared.",
    cancel: "Cancel",
    confirm: "Confirm & Send",
  },
  es: {
    title: "Aviso de Compartir Fuera de NephroReach",
    body: [
      "Está a punto de enviar información a una persona u organización fuera de la red de NephroReach.",
      "Una vez que la información se exporta o se envía fuera de NephroReach, NephroReach no puede controlar cómo el destinatario accede, guarda, usa, reenvía, descarga o vuelve a compartir esa información. Es posible que el destinatario no esté sujeto a los requisitos de privacidad, seguridad o confidencialidad de NephroReach.",
      "Antes de continuar, confirme que seleccionó al destinatario correcto y que está autorizado para compartir la información incluida. No incluya información que no sea necesaria para el propósito previsto.",
      "Al seleccionar “Confirmar y Enviar”, usted reconoce que la información saldrá del entorno de NephroReach y es posible que ya no esté protegida por los controles de seguridad de NephroReach.",
    ],
    check:
      "Entiendo que estoy enviando información fuera de NephroReach y he confirmado el destinatario y la información que se comparte.",
    cancel: "Cancelar",
    confirm: "Confirmar y Enviar",
  },
};

export type AckCopy = {
  title: string;
  /** Shown above the paragraphs, e.g. a warning. */
  lead?: string;
  body: string[];
  check: string;
  cancel: string;
  confirm: string;
};

/** A notice that must be acknowledged: the box ticked, then the confirm
 *  button. Shared by the sharing and the safety notices. */
export function AcknowledgeNotice({
  open,
  copy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  copy: AckCopy;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const close = () => {
    setAgreed(false);
    onCancel();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={copy.title}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={close}>
            {copy.cancel}
          </Button>
          <Button
            disabled={!agreed}
            leadingIcon={<Send aria-hidden="true" />}
            onClick={() => {
              setAgreed(false);
              onConfirm();
            }}
          >
            {copy.confirm}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {copy.lead ? (
          <Alert tone="danger" live={false}>
            {copy.lead}
          </Alert>
        ) : null}
        {copy.body.map((paragraph) => (
          <p key={paragraph} className="text-body-sm text-fg-secondary">
            {paragraph}
          </p>
        ))}
        <label className="flex min-h-11 cursor-pointer items-start gap-inline-md rounded-control border border-line p-inset-sm select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded-chip border-field text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          <span className="text-label-md text-fg">{copy.check}</span>
        </label>
      </div>
    </Modal>
  );
}

/** Wraps an action so it runs only after the notice is acknowledged.
 *  Render `notice` once, anywhere in the component. */
export function useAcknowledge(copy: AckCopy) {
  const [pending, setPending] = useState<(() => void) | null>(null);
  const guard = useCallback((action: () => void) => {
    /* Stored as a thunk: a function handed to setState is called. */
    setPending(() => action);
  }, []);
  const notice = (
    <AcknowledgeNotice
      open={pending !== null}
      copy={copy}
      onCancel={() => setPending(null)}
      onConfirm={() => {
        const action = pending;
        setPending(null);
        /* After the dialog has closed, so a print does not capture it. */
        if (action) window.setTimeout(action, 50);
      }}
    />
  );
  return { guard, notice };
}

/** The External Sharing Notice around an export or share. */
export function useExternalShare(isEs = false) {
  return useAcknowledge(isEs ? COPY.es : COPY.en);
}
