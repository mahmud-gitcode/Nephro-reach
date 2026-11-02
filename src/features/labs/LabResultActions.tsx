"use client";

import React, { useState } from "react";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { Alert, Button, FormField, Input, Modal } from "@/components/ui";
import { isSafeFileUrl } from "@/lib/utils/safeUrl";
import { saveErrorText } from "@/features/profile/saveError";

/* ==========================================================================
   What a member can do with one lab result (Phase 6)
   --------------------------------------------------------------------------
   Their own typed result: change its value, or remove it (one call, by the
   row's id; the server keeps the revision). A result from the care team is
   read-only: no buttons are drawn for it (the server answers 403 anyway,
   labs.clinic_result_read_only). A report opens through the result's own
   short-lived link, asked for when the member opens it, never stored.
   ========================================================================== */

export function LabResultActions({
  name,
  value,
  isEs,
  onSave,
  onRemove,
}: {
  /** The test's name, for the controls' labels. */
  name: string;
  value: string;
  isEs: boolean;
  onSave: (value: string) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const lang = isEs ? "es" : "en";

  const run = async (action: () => Promise<unknown>, done: () => void) => {
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      await action();
      done();
    } catch (error) {
      setFailure(saveErrorText(error, lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-inline-xs">
      <Button
        iconOnly
        size="small"
        variant="neutral"
        appearance="ghost"
        aria-label={isEs ? `Editar ${name}` : `Edit ${name}`}
        onClick={() => {
          setDraft(value);
          setFailure(null);
          setEditing(true);
        }}
      >
        <Pencil />
      </Button>
      <Button
        iconOnly
        size="small"
        variant="neutral"
        appearance="ghost"
        aria-label={isEs ? `Eliminar ${name}` : `Delete ${name}`}
        onClick={() => {
          setFailure(null);
          setConfirming(true);
        }}
      >
        <Trash2 />
      </Button>
      {editing ? (
        <Modal
          open
          size="small"
          onClose={() => setEditing(false)}
          title={isEs ? `Editar ${name}` : `Edit ${name}`}
          footer={
            <>
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setEditing(false)}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                loading={busy}
                disabled={!draft.trim()}
                onClick={() =>
                  void run(
                    () => onSave(draft.trim()),
                    () => setEditing(false),
                  )
                }
              >
                {isEs ? "Guardar" : "Save"}
              </Button>
            </>
          }
        >
          <div className="space-y-stack-md">
            {failure ? <Alert tone="danger">{failure}</Alert> : null}
            <FormField label={isEs ? "Resultado" : "Result"} required>
              {(props) => (
                <Input
                  {...props}
                  value={draft}
                  maxLength={60}
                  onChange={(e) => setDraft(e.target.value)}
                />
              )}
            </FormField>
          </div>
        </Modal>
      ) : null}
      {confirming ? (
        <Modal
          open
          size="small"
          onClose={() => setConfirming(false)}
          title={isEs ? `¿Eliminar ${name}?` : `Delete ${name}?`}
          footer={
            <>
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setConfirming(false)}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                variant="danger"
                loading={busy}
                onClick={() => void run(onRemove, () => setConfirming(false))}
              >
                {isEs ? "Eliminar" : "Delete"}
              </Button>
            </>
          }
        >
          {failure ? (
            <Alert tone="danger">{failure}</Alert>
          ) : (
            <p className="text-body-sm text-fg-muted">
              {isEs
                ? "Se quita este resultado que usted escribió. Los demás resultados de la extracción se quedan."
                : "This removes the result you typed in. The other results of the draw stay."}
            </p>
          )}
        </Modal>
      ) : null}
    </span>
  );
}

/** Opens a result's report (a photo or PDF) through its own link. */
export function LabReportButton({
  isEs,
  load,
}: {
  isEs: boolean;
  load: () => Promise<{ url: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const label = isEs ? "Ver el informe" : "View report";

  const show = async () => {
    setOpen(true);
    setLoading(true);
    setFailed(false);
    try {
      const link = await load();
      if (!isSafeFileUrl(link.url)) throw new Error("Unexpected link");
      setUrl(link.url);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="small"
        variant="neutral"
        appearance="fill-stroke"
        leadingIcon={<FileText />}
        loading={loading}
        onClick={() => void show()}
      >
        {label}
      </Button>
      {open ? (
        <Modal
          open
          size="small"
          onClose={() => {
            setOpen(false);
            setUrl(null);
          }}
          title={label}
        >
          {failed ? (
            <Alert tone="danger">
              {isEs
                ? "No se pudo abrir el informe."
                : "The report could not be opened."}
            </Alert>
          ) : url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="text-label-md text-fg-brand underline"
            >
              {isEs
                ? "Abrir el informe (el enlace caduca pronto)"
                : "Open the report (the link expires soon)"}
            </a>
          ) : (
            <p className="text-body-sm text-fg-muted">
              {isEs ? "Cargando…" : "Loading…"}
            </p>
          )}
        </Modal>
      ) : null}
    </>
  );
}
