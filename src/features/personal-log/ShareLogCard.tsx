"use client";

import React, { useState } from "react";
import { Download, Mail, Printer, Share2 } from "lucide-react";
import { Button, Card, FormField, Input } from "@/components/ui";
import {
  emailBody,
  isEmail,
  mailtoHref,
  outsideShareOf,
  toCsv,
  type LogTable,
} from "./shareLog";
import { useExternalShare } from "@/features/sharing/ExternalShareNotice";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import { isMemberRole } from "@/features/auth/useMember";
import { LazyShareOutsideModal } from "@/features/secure-messages/LazyShareOutsideModal";
import { useHealthcareTeam } from "@/features/care-team/useHealthcareTeam";
import {
  OTHER_RECIPIENT,
  TeamRecipientSelect,
} from "@/features/care-team/TeamRecipientSelect";

/* ==========================================================================
   Share this log — download, print, or send it on
   --------------------------------------------------------------------------
   A member sends to someone on their healthcare team, or picks Other, which
   is Share Outside NephroReach (client, 2026-10-12: sharing stays inside the
   network, never a free-for-all). Staff still type the address.
   ========================================================================== */

export function ShareLogCard({
  title,
  description,
  fileName,
  table,
  isEs,
  footer,
}: {
  title: string;
  description?: string;
  /** Without the extension. */
  fileName: string;
  table: LogTable;
  isEs: boolean;
  /** The email's last line; the member's log by default. */
  footer?: string;
}) {
  const [to, setTo] = useState("");
  const [tried, setTried] = useState(false);
  const empty = table.rows.length === 0;
  /* Everything here leaves NephroReach: ask first (client, 2026-10-07). */
  const share = useExternalShare(isEs);
  /* Members can also send the log through Share Outside NephroReach, the
     same secure link as Messages (client, 2026-10-07). */
  const isMember = isMemberRole(useOptionalAuth()?.user?.role);
  const [outside, setOutside] = useState(false);
  const { recipients } = useHealthcareTeam();
  const [recipientId, setRecipientId] = useState("");
  const picked =
    recipients.find((member) => member.id === recipientId) ?? recipients[0];
  const chosen = picked ? picked.id : OTHER_RECIPIENT;
  const emailError = isEmail(to)
    ? undefined
    : isEs
      ? "Escriba un correo electrónico válido."
      : "Enter a valid email address.";

  function download() {
    const url = URL.createObjectURL(
      new Blob([toCsv(table)], { type: "text/csv" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card
      as="section"
      padding="small"
      className="space-y-stack-md print:hidden"
    >
      <div>
        <h2 className="text-heading-4 text-fg">
          {isEs ? "Exportar y Compartir" : "Export & Share"}
        </h2>
        <p className="mt-stack-xs text-body-sm text-fg-muted">
          {description ??
            (isMember
              ? isEs
                ? "Descargue su registro, imprímalo o envíelo a alguien de su equipo de salud."
                : "Download your log, print it, or send it to someone on your healthcare team."
              : isEs
                ? "Descargue su registro, imprímalo o envíelo por correo a quien usted elija."
                : "Download your log, print it, or email it to someone you choose.")}
        </p>
      </div>

      <div className="flex flex-wrap gap-inline-sm">
        <Button
          variant="neutral"
          appearance="fill-stroke"
          disabled={empty}
          leadingIcon={<Download aria-hidden="true" />}
          onClick={() => share.guard(download, "download")}
        >
          {isEs ? "Descargar CSV" : "Download CSV"}
        </Button>
        {isMember ? (
          <Button
            disabled={empty}
            leadingIcon={<Share2 aria-hidden="true" />}
            onClick={() => setOutside(true)}
          >
            {isEs
              ? "Compartir Fuera de NephroReach"
              : "Share Outside NephroReach"}
          </Button>
        ) : null}
        <Button
          variant="neutral"
          appearance="fill-stroke"
          disabled={empty}
          leadingIcon={<Printer aria-hidden="true" />}
          onClick={() => share.guard(() => window.print(), "print")}
        >
          {isEs ? "Imprimir / PDF" : "Print / PDF"}
        </Button>
      </div>

      {isMember ? (
        <form
          className="flex flex-col gap-inline-md sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            if (empty) return;
            if (chosen === OTHER_RECIPIENT || !picked) {
              setOutside(true);
              return;
            }
            share.guard(() => {
              window.location.href = mailtoHref(
                picked.email,
                title,
                emailBody(title, table, footer),
              );
            });
          }}
        >
          <TeamRecipientSelect
            recipients={recipients}
            value={chosen}
            onChange={setRecipientId}
            isEs={isEs}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={empty}
            leadingIcon={<Mail aria-hidden="true" />}
          >
            {isEs ? "Enviar" : "Send"}
          </Button>
        </form>
      ) : (
        <form
          className="flex flex-col gap-inline-md sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            setTried(true);
            if (emailError || empty) return;
            share.guard(() => {
              window.location.href = mailtoHref(
                to,
                title,
                emailBody(title, table, footer),
              );
            });
          }}
        >
          <FormField
            label={isEs ? "Enviar por correo a" : "Email to"}
            error={tried ? emailError : undefined}
            className="flex-1"
          >
            {(field) => (
              <Input
                {...field}
                type="email"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                placeholder={isEs ? "nombre@ejemplo.com" : "name@example.com"}
              />
            )}
          </FormField>
          <Button
            type="submit"
            disabled={empty}
            leadingIcon={<Mail aria-hidden="true" />}
          >
            {isEs ? "Enviar" : "Send"}
          </Button>
        </form>
      )}
      <p className="text-caption text-fg-muted">
        {empty
          ? isEs
            ? "Aún no hay entradas para compartir."
            : "There are no entries to share yet."
          : isEs
            ? "Se abre su aplicación de correo con el registro listo para enviar. Adjunte el CSV si lo desea."
            : "Your email app opens with the log ready to send. Attach the CSV if you like."}
      </p>
      {share.notice}
      {outside ? (
        <LazyShareOutsideModal
          isEs={isEs}
          initial={outsideShareOf(title, fileName, table, isEs)}
          onClose={() => setOutside(false)}
        />
      ) : null}
    </Card>
  );
}
