"use client";

import React, { useEffect, useRef, useState } from "react";
import { FileText, Paperclip, Trash2, Upload } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  TRAVEL_DOCUMENTS,
  describeDocumentFile,
  filesForDocument,
  formatFileSize,
} from "./trip.rules";
import type {
  TravelDocumentFile,
  TravelDocumentKey,
  TripRequest,
} from "./trip.types";
import { Alert, Button, Card } from "@/components/ui";

/* ==========================================================================
   My Travel Documents
   --------------------------------------------------------------------------
   Where the files go. The Travel Checklist says whether each document is
   ready; this is where the document itself is attached, and attaching one
   ticks that checklist row — so the two can never disagree about the same
   document, which is exactly what went wrong when both panels carried
   checkboxes.

   The bytes are not stored. `attachedFiles` below holds an object URL for
   as long as the tab is open, so a member can open what they just picked;
   the record that persists is the name, size and type. `TravelDocumentFile`
   explains why, and the note at the foot of the panel says the same thing
   to the member rather than letting them discover it after a refresh.
   ========================================================================== */

function DocumentRow({
  document,
  files,
  previews,
  onAttach,
  onRemove,
}: {
  document: (typeof TRAVEL_DOCUMENTS)[number];
  files: TravelDocumentFile[];
  previews: Record<string, string>;
  onAttach: (file: File) => void;
  onRemove: (fileId: string) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const input = useRef<HTMLInputElement>(null);

  return (
    <li className="border-t border-line-subtle py-stack-sm first:border-0 first:pt-0">
      <div className="flex flex-wrap items-start justify-between gap-inline-md">
        <div className="min-w-0">
          <p className="text-body-sm text-fg">
            {isEs ? document.labelEs : document.labelEn}
          </p>
          <p className="mt-stack-xs text-caption text-fg-muted">
            {isEs ? document.hintEs : document.hintEn}
          </p>
        </div>

        <input
          ref={input}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(event) => {
            const picked = event.target.files?.[0];
            if (picked) onAttach(picked);
            /* Cleared so picking the same file twice still fires. */
            event.target.value = "";
          }}
        />

        <Button
          size="small"
          variant="neutral"
          appearance="fill-stroke"
          onClick={() => input.current?.click()}
        >
          <Upload aria-hidden="true" className="size-4 shrink-0" />
          {files.length > 0
            ? isEs
              ? "Añadir otro"
              : "Add another"
            : isEs
              ? "Adjuntar"
              : "Attach"}
        </Button>
      </div>

      {files.length > 0 ? (
        <ul className="mt-stack-sm space-y-stack-xs">
          {files.map((file) => {
            const preview = previews[file.id];

            return (
              <li
                key={file.id}
                className="flex items-center gap-inline-md rounded-control border border-line bg-surface-sunken px-inset-sm py-stack-xs"
              >
                <Paperclip
                  aria-hidden="true"
                  className="size-4 shrink-0 text-fg-subtle"
                />

                {/* A link only while the file is still in the tab. After a
                  reload there is nothing to open, and a dead link would be
                  worse than plain text. */}
                {preview ? (
                  <a
                    href={preview}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate text-body-sm text-fg-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {file.fileName}
                  </a>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-body-sm text-fg-secondary">
                    {file.fileName}
                  </span>
                )}

                <span className="shrink-0 text-caption text-fg-muted tabular-nums">
                  {formatFileSize(file.sizeBytes)}
                </span>

                <Button
                  size="small"
                  variant="danger"
                  appearance="stroke"
                  onClick={() => onRemove(file.id)}
                  aria-label={
                    isEs ? `Quitar ${file.fileName}` : `Remove ${file.fileName}`
                  }
                >
                  <Trash2 aria-hidden="true" className="size-4 shrink-0" />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

export function TravelDocumentsPanel({
  trip,
  onAttach,
  onRemoveFile,
}: {
  trip: TripRequest;
  onAttach: (file: TravelDocumentFile) => void;
  onRemoveFile: (fileId: string) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  /* Object URLs for files picked in this tab, by file id. Revoked on
     unmount, because a URL that is never released holds the whole file in
     memory for the life of the page. */
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => {
      for (const url of Object.values(previews)) URL.revokeObjectURL(url);
    };
    /* Deliberately on unmount only: listing `previews` here would revoke the
       URL of every earlier file each time a new one is added. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attach = (key: TravelDocumentKey, picked: File) => {
    const record = describeDocumentFile(key, picked);

    /* Created outside the updater: a state updater can run more than once
       for the same update, and each extra call would leak an object URL
       that nothing ever revokes. */
    const url = URL.createObjectURL(picked);
    setPreviews((current) => ({ ...current, [record.id]: url }));

    onAttach(record);
  };

  const attachedCount = trip.documentFiles.length;

  return (
    <Card as="section" aria-labelledby="travel-documents">
      <div className="flex flex-wrap items-start justify-between gap-inline-md">
        <div className="flex items-start gap-inline-md">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card border border-primary-soft-line bg-primary-soft text-fg-brand"
          >
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h3 id="travel-documents" className="text-heading-5 text-fg">
              {isEs ? "Mis Documentos de Viaje" : "My Travel Documents"}
            </h3>
            <p className="mt-stack-xs text-body-sm text-fg-muted">
              {isEs
                ? "Adjunta lo que te pidieron. Marcar aquí también marca tu lista."
                : "Attach what you were asked for. Attaching also ticks your checklist."}
            </p>
          </div>
        </div>

        {attachedCount > 0 ? (
          <p className="text-body-sm text-fg-muted tabular-nums">
            {isEs ? `${attachedCount} adjunto(s)` : `${attachedCount} attached`}
          </p>
        ) : null}
      </div>

      <ul className="mt-stack-md">
        {TRAVEL_DOCUMENTS.map((document) => (
          <DocumentRow
            key={document.key}
            document={document}
            files={filesForDocument(trip, document.key)}
            previews={previews}
            onAttach={(picked) => attach(document.key, picked)}
            onRemove={onRemoveFile}
          />
        ))}
      </ul>

      {/* Said before a refresh loses it, not after. */}
      <Alert tone="info" className="mt-stack-md">
        {isEs
          ? "Por ahora solo se guarda el nombre del archivo. El archivo en sí se abre mientras esta pestaña esté abierta, y se enviará a tu clínica cuando la subida esté conectada."
          : "For now only the file name is saved. The file itself opens while this tab is open, and will reach your clinic once uploading is connected."}
      </Alert>
    </Card>
  );
}

export default TravelDocumentsPanel;
