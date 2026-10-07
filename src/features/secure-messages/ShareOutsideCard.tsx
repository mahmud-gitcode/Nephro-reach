"use client";

import { useExternalShare } from "@/features/sharing/ExternalShareNotice";
import React, { useState } from "react";
import { Copy, ExternalLink, Paperclip, Share2 } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  FormField,
  Input,
  Modal,
  Select,
  Textarea,
  type BadgeTone,
} from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { useMemberName } from "@/features/auth/useMemberName";
import { useDialysisClinic } from "@/features/travel/useDialysisClinic";
import { useCareContacts } from "@/features/profile/useCareContacts";
import { isNetworkClinic } from "@/features/profile/clinicEnrollment";
import { networkOffices } from "@/features/profile/careContacts";
import { downscaleToDataUrl } from "@/features/personal-log/dialysis/useAccessPhotos";
import {
  MAX_ATTACHMENT_BYTES,
  SHARE_KINDS,
  SHARE_LOG_LABEL,
  isEmail,
  shareLink,
  shareStatus,
  sharesForPatient,
  type ShareAttachment,
  type ShareKind,
  type ShareStatus,
} from "./shares";
import { useShares } from "./useShares";

/* ==========================================================================
   Share Outside NephroReach — the member's side, in the Messages rail
   --------------------------------------------------------------------------
   The member picks what to send and to whom; the recipient gets a secure
   link to that one item and nothing else (client, 2026-10-05). In this
   frontend phase the link is shown here to copy, rather than emailed.
   ========================================================================== */

const OTHER = "__other__";

const STATUS: Record<ShareStatus, { en: string; es: string; tone: BadgeTone }> =
  {
    sent: { en: "Sent", es: "Enviado", tone: "neutral" },
    opened: { en: "Link opened", es: "Enlace abierto", tone: "info" },
    viewed: { en: "Viewed", es: "Visto", tone: "success" },
  };

type Office = { name: string; kind: string };

/** The member's offices that are not on NephroReach. */
function useOutsideOffices(): Office[] {
  const dialysis = useDialysisClinic().clinic;
  const { contacts } = useCareContacts();
  const offices: Office[] = [];
  if (dialysis?.name && !isNetworkClinic(dialysis.name)) {
    offices.push({ name: dialysis.name, kind: "Dialysis Center" });
  }
  const others: Array<[keyof typeof contacts, string]> = [
    ["vascular", "Vascular Access Center"],
    ["nephrology", "Nephrology Office"],
    ["transplant", "Transplant Center"],
    ["primaryCare", "Primary Care Office"],
  ];
  for (const [kind, label] of others) {
    const name = contacts[kind].name;
    if (name && !networkOffices(kind).includes(name)) {
      offices.push({ name, kind: label });
    }
  }
  return offices;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function absoluteLink(token: string) {
  return typeof window === "undefined"
    ? shareLink(token)
    : `${window.location.origin}${shareLink(token)}`;
}

function LinkBox({ token, isEs }: { token: string; isEs: boolean }) {
  const [copied, setCopied] = useState(false);
  const link = absoluteLink(token);
  return (
    <div className="space-y-stack-xs">
      <Input
        value={link}
        readOnly
        aria-label={isEs ? "Enlace seguro" : "Secure link"}
      />
      <div className="flex flex-wrap gap-inline-sm">
        <Button
          size="small"
          variant="neutral"
          appearance="fill-stroke"
          leadingIcon={<Copy aria-hidden="true" />}
          onClick={async () => {
            await navigator.clipboard?.writeText(link);
            setCopied(true);
          }}
        >
          {copied
            ? isEs
              ? "Copiado"
              : "Copied"
            : isEs
              ? "Copiar enlace"
              : "Copy link"}
        </Button>
        <a
          href={shareLink(token)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-inline-xs text-body-sm text-fg-brand hover:underline"
        >
          <ExternalLink aria-hidden="true" className="size-4" />
          {isEs
            ? "Ver como destinatario (demo)"
            : "Open as the recipient (demo)"}
        </a>
      </div>
    </div>
  );
}

/** What a share starts with when another page opens it: a log, a travel
 *  request (client, 2026-10-07: anything a member can share goes out the
 *  same way as Share Outside NephroReach in Messages). */
export type ShareInitial = {
  kind?: ShareKind;
  subject?: string;
  body?: string;
  attachment?: ShareAttachment;
  email?: string;
  /** The office's name, when it is known. */
  office?: string;
};

function ShareModal({
  isEs,
  onClose,
  initial,
  onShared,
}: {
  isEs: boolean;
  onClose: () => void;
  initial?: ShareInitial;
  /** Told once the link is created. */
  onShared?: () => void;
}) {
  /* Leaves NephroReach: ask first (client, 2026-10-07). */
  const share = useExternalShare(isEs);
  const me = useMemberName();
  const store = useShares();
  const offices = useOutsideOffices();
  const [kind, setKind] = useState<ShareKind>(initial?.kind ?? "message");
  const [choice, setChoice] = useState(() =>
    initial?.office
      ? (offices.find((o) => o.name === initial.office)?.name ?? OTHER)
      : (offices[0]?.name ?? OTHER),
  );
  const [otherName, setOtherName] = useState(initial?.office ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [attachment, setAttachment] = useState<ShareAttachment | null>(
    initial?.attachment ?? null,
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const recipientOrg = choice === OTHER ? otherName.trim() : choice;
  const emailError = isEmail(email)
    ? undefined
    : isEs
      ? "Escriba un correo válido."
      : "Enter a valid email address.";
  const contentError =
    body.trim() || attachment
      ? undefined
      : isEs
        ? "Escriba un mensaje o adjunte un archivo."
        : "Write a message or attach a file.";

  if (token) {
    return (
      <Modal
        open
        onClose={onClose}
        title={isEs ? "Compartido" : "Shared"}
        footer={<Button onClick={onClose}>{isEs ? "Listo" : "Done"}</Button>}
      >
        <div className="space-y-stack-md">
          <Alert tone="success" live>
            {isEs
              ? `Se envió un enlace seguro a ${email.trim()}. El aviso no incluye su información.`
              : `A secure link was sent to ${email.trim()}. The notice does not include your information.`}
          </Alert>
          <p className="text-body-sm text-fg-secondary">
            {isEs
              ? "Demo: hasta que el correo esté conectado, puede copiar el enlace y enviarlo usted mismo."
              : "Demo: until email is connected, you can copy the link and send it yourself."}
          </p>
          <LinkBox token={token} isEs={isEs} />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={
        isEs ? "Compartir Fuera de NephroReach" : "Share Outside NephroReach"
      }
      description={
        isEs
          ? "Elija exactamente qué enviar. El destinatario ve solo esto."
          : "Choose exactly what to send. The recipient sees only this."
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            loading={store.isSaving}
            leadingIcon={<Share2 aria-hidden="true" />}
            onClick={() => {
              setTried(true);
              if (emailError || contentError) return;
              share.guard(async () => {
                onShared?.();
                setToken(
                  await store.create({
                    patientName: me,
                    kind,
                    recipientEmail: email,
                    recipientOrg,
                    subject:
                      subject.trim() ||
                      SHARE_KINDS.find((k) => k.id === kind)!.en,
                    body,
                    ...(attachment ? { attachment } : {}),
                  }),
                );
              });
            }}
          >
            {isEs ? "Compartir" : "Share"}
          </Button>
          {share.notice}
        </>
      }
    >
      <div className="space-y-stack-md">
        <FormField label={isEs ? "Qué enviar" : "What to send"} required>
          {(field) => (
            <Select
              {...field}
              value={kind}
              onChange={(e) => setKind(e.target.value as ShareKind)}
            >
              {SHARE_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {isEs ? k.es : k.en}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <div className="grid gap-stack-md sm:grid-cols-2">
          <FormField label={isEs ? "Oficina" : "Office"}>
            {(field) => (
              <Select
                {...field}
                value={choice}
                onChange={(e) => setChoice(e.target.value)}
              >
                {offices.map((o) => (
                  <option key={o.name} value={o.name}>
                    {o.name}
                  </option>
                ))}
                <option value={OTHER}>
                  {isEs ? "Otra oficina…" : "Another office…"}
                </option>
              </Select>
            )}
          </FormField>
          {choice === OTHER ? (
            <FormField label={isEs ? "Nombre de la oficina" : "Office name"}>
              {(field) => (
                <Input
                  {...field}
                  value={otherName}
                  onChange={(e) => setOtherName(e.target.value)}
                />
              )}
            </FormField>
          ) : null}
          <FormField
            label={isEs ? "Correo del destinatario" : "Recipient's email"}
            required
            error={tried ? emailError : undefined}
            className="sm:col-span-2"
          >
            {(field) => (
              <Input
                {...field}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coordinator@office.org"
              />
            )}
          </FormField>
        </div>
        <FormField label={isEs ? "Asunto" : "Subject"}>
          {(field) => (
            <Input
              {...field}
              value={subject}
              maxLength={120}
              onChange={(e) => setSubject(e.target.value)}
            />
          )}
        </FormField>
        <FormField
          label={isEs ? "Mensaje" : "Message"}
          error={tried ? contentError : undefined}
        >
          {(field) => (
            <Textarea
              {...field}
              rows={4}
              maxLength={1500}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          )}
        </FormField>
        <div className="flex flex-wrap items-center gap-inline-md">
          <label className="inline-flex">
            <input
              type="file"
              accept="image/*,application/pdf,.doc,.docx,.txt"
              className="peer sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setFileError(null);
                try {
                  const dataUrl = file.type.startsWith("image/")
                    ? await downscaleToDataUrl(file)
                    : file.size <= MAX_ATTACHMENT_BYTES
                      ? await fileToDataUrl(file)
                      : null;
                  if (!dataUrl) {
                    setFileError(
                      isEs
                        ? "El archivo es demasiado grande (máx. 1.5 MB)."
                        : "That file is too large (1.5 MB max).",
                    );
                    return;
                  }
                  setAttachment({
                    name: file.name,
                    type: file.type.startsWith("image/")
                      ? "image/jpeg"
                      : file.type,
                    dataUrl,
                  });
                } catch {
                  setFileError(
                    isEs
                      ? "No se pudo usar ese archivo."
                      : "That file could not be used.",
                  );
                }
              }}
            />
            <span className="inline-flex min-h-10 cursor-pointer items-center gap-inline-sm rounded-button border border-line bg-surface px-inset-sm text-label-md text-fg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:bg-surface-sunken">
              <Paperclip aria-hidden="true" className="size-4" />
              {attachment
                ? attachment.name
                : isEs
                  ? "Adjuntar documento o foto"
                  : "Attach document or photo"}
            </span>
          </label>
          {attachment ? (
            <Button
              size="small"
              variant="neutral"
              appearance="ghost"
              onClick={() => setAttachment(null)}
            >
              {isEs ? "Quitar" : "Remove"}
            </Button>
          ) : null}
          {fileError ? (
            <p role="alert" className="text-caption text-danger">
              {fileError}
            </p>
          ) : null}
        </div>
        <Alert tone="info" live={false}>
          {isEs
            ? "El destinatario recibe un enlace seguro, no acceso a NephroReach. Después de verificar, ve o descarga solo lo que usted envía aquí. No es para emergencias: llame al 911."
            : "The recipient gets a secure link, not access to NephroReach. After verifying, they can view or download only what you send here. Not for emergencies: call 911."}
        </Alert>
      </div>
    </Modal>
  );
}

function MySharesModal({
  isEs,
  onClose,
}: {
  isEs: boolean;
  onClose: () => void;
}) {
  const me = useMemberName();
  const store = useShares();
  const shares = sharesForPatient(store.state, me);
  const [openId, setOpenId] = useState<string | null>(null);
  const when = (iso: string) =>
    new Date(iso).toLocaleString(isEs ? "es-US" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <Modal
      open
      size="wide"
      onClose={onClose}
      title={isEs ? "Lo que compartí" : "What I've Shared"}
    >
      <ul className="divide-y divide-line-subtle">
        {shares.map((share) => {
          const status = STATUS[shareStatus(share)];
          const kind = SHARE_KINDS.find((k) => k.id === share.kind)!;
          const expanded = openId === share.id;
          return (
            <li key={share.id} className="space-y-stack-sm py-inset-sm">
              <div className="flex flex-wrap items-start justify-between gap-inline-md">
                <div className="min-w-0">
                  <p className="text-label-md text-fg">{share.subject}</p>
                  <p className="text-caption text-fg-muted">
                    {isEs ? kind.es : kind.en} ·{" "}
                    {share.recipientOrg || share.recipientEmail} ·{" "}
                    {when(share.sharedAt)}
                  </p>
                </div>
                <Badge tone={status.tone}>{isEs ? status.es : status.en}</Badge>
              </div>
              <Button
                size="small"
                variant="neutral"
                appearance="ghost"
                aria-expanded={expanded}
                onClick={() => setOpenId(expanded ? null : share.id)}
              >
                {expanded
                  ? isEs
                    ? "Ocultar detalles"
                    : "Hide details"
                  : isEs
                    ? "Ver enlace y registro"
                    : "Show link and activity"}
              </Button>
              {expanded ? (
                <div className="space-y-stack-sm">
                  <LinkBox token={share.token} isEs={isEs} />
                  <ol className="space-y-0.5">
                    {share.log.map((entry, i) => (
                      <li key={i} className="text-caption text-fg-secondary">
                        {SHARE_LOG_LABEL[entry.event]}
                        {entry.event === "verified"
                          ? ` (${entry.by})`
                          : ""} ·{" "}
                        <span className="text-fg-muted">{when(entry.at)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

/** The card in the Messages rail, beside "Need help now?". */
export function ShareOutsideCard() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const me = useMemberName();
  const store = useShares();
  const count = sharesForPatient(store.state, me).length;
  const [sharing, setSharing] = useState(false);
  const [viewing, setViewing] = useState(false);

  return (
    <section className="rounded-card-nested bg-surface-sunken p-inset-md">
      <div className="flex items-start gap-inline-md">
        <Share2 aria-hidden="true" className="size-5 shrink-0 text-fg-brand" />
        <div className="min-w-0">
          <h2 className="text-heading-5 text-fg">
            {isEs
              ? "Compartir Fuera de NephroReach"
              : "Share Outside NephroReach"}
          </h2>
          <p className="mt-0.5 text-body-sm text-fg-secondary">
            {isEs
              ? "Envíe un mensaje, una referencia, una solicitud de cita o un documento a una oficina que no está en NephroReach."
              : "Send a message, referral information, an appointment request or a document to an office not on NephroReach."}
          </p>
        </div>
      </div>
      <Button
        size="small"
        fullWidth
        className="mt-stack-md"
        leadingIcon={<Share2 aria-hidden="true" />}
        onClick={() => setSharing(true)}
      >
        {isEs ? "Compartir" : "Share Outside NephroReach"}
      </Button>
      {count > 0 ? (
        <Button
          size="small"
          variant="neutral"
          appearance="ghost"
          fullWidth
          className="mt-stack-xs"
          onClick={() => setViewing(true)}
        >
          {isEs ? `Lo que compartí (${count})` : `What I've shared (${count})`}
        </Button>
      ) : null}
      {sharing ? (
        <ShareModal isEs={isEs} onClose={() => setSharing(false)} />
      ) : null}
      {viewing ? (
        <MySharesModal isEs={isEs} onClose={() => setViewing(false)} />
      ) : null}
    </section>
  );
}

/** The Share Outside NephroReach form, for other pages to open. */
export const ShareOutsideModal = ShareModal;
