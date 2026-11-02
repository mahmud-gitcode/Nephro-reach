"use client";

import React, { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { Alert, Button, Modal } from "@/components/ui";
import { isSafeFileUrl } from "@/lib/utils/safeUrl";

/* ==========================================================================
   A reading's photo, opened through the reading's own link (Phase 5)
   --------------------------------------------------------------------------
   The list never holds image data or a stored URL. Opening the photo asks
   the API for a short-lived link (`GET …/blood-pressure/:id/photo`, which
   checks the caller may read this patient), shows it, and forgets it when
   the dialog closes.
   ========================================================================== */

export function BpPhotoButton({
  label,
  isEs,
  load,
}: {
  /** e.g. "Photo with the 08:15 AM reading". */
  label: string;
  isEs: boolean;
  load: () => Promise<{ url: string }>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

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

  const close = () => {
    setOpen(false);
    setUrl(null);
  };

  return (
    <>
      <Button
        iconOnly
        size="small"
        variant="neutral"
        appearance="ghost"
        aria-label={label}
        loading={loading}
        onClick={() => void show()}
      >
        <ImageIcon />
      </Button>
      {open ? (
        <Modal open onClose={close} title={label}>
          {failed ? (
            <Alert tone="danger">
              {isEs
                ? "No se pudo abrir la foto."
                : "The photo could not be opened."}
            </Alert>
          ) : url ? (
            /* eslint-disable-next-line @next/next/no-img-element -- a short-lived private link, never cached */
            <img
              src={url}
              alt={label}
              referrerPolicy="no-referrer"
              className="max-h-[60vh] w-full rounded-card-nested object-contain"
            />
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
