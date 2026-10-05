"use client";

import React, { useState } from "react";
import { Download, Mail, Printer } from "lucide-react";
import { Button, Card, FormField, Input } from "@/components/ui";
import {
  emailBody,
  isEmail,
  mailtoHref,
  toCsv,
  type LogTable,
} from "./shareLog";

/* ==========================================================================
   Share this log — download, print, or email to someone the member picks
   ========================================================================== */

export function ShareLogCard({
  title,
  description,
  fileName,
  table,
  isEs,
}: {
  title: string;
  description?: string;
  /** Without the extension. */
  fileName: string;
  table: LogTable;
  isEs: boolean;
}) {
  const [to, setTo] = useState("");
  const [tried, setTried] = useState(false);
  const empty = table.rows.length === 0;
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
            (isEs
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
          onClick={download}
        >
          {isEs ? "Descargar CSV" : "Download CSV"}
        </Button>
        <Button
          variant="neutral"
          appearance="fill-stroke"
          disabled={empty}
          leadingIcon={<Printer aria-hidden="true" />}
          onClick={() => window.print()}
        >
          {isEs ? "Imprimir / PDF" : "Print / PDF"}
        </Button>
      </div>

      <form
        className="flex flex-col gap-inline-md sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          setTried(true);
          if (emailError || empty) return;
          window.location.href = mailtoHref(to, title, emailBody(title, table));
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
      <p className="text-caption text-fg-muted">
        {empty
          ? isEs
            ? "Aún no hay entradas para compartir."
            : "There are no entries to share yet."
          : isEs
            ? "Se abre su aplicación de correo con el registro listo para enviar. Adjunte el CSV si lo desea."
            : "Your email app opens with the log ready to send. Attach the CSV if you like."}
      </p>
    </Card>
  );
}
