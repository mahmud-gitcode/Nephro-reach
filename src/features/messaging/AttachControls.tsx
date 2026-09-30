"use client";

import React, { useRef, useState } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui";
import { toAttachment } from "./attachments";
import type { Attachment } from "./messaging.types";

/** The composer's paperclip: picks one file and hands it back ready to
 *  send, or says why it cannot be attached. */
export function AttachButton({
  onAttach,
  onError,
  disabled,
  appearance = "fill-stroke",
}: {
  onAttach: (attachment: Attachment) => void;
  onError: (message: string) => void;
  disabled?: boolean;
  /** "ghost" inside a composer that already draws the field's border. */
  appearance?: "fill-stroke" | "ghost";
}) {
  const input = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);

  return (
    <>
      <input
        ref={input}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        accept="image/*,.pdf,.txt,.doc,.docx"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setReading(true);
          try {
            const result = await toAttachment(file);
            if ("error" in result) onError(result.error);
            else onAttach(result.attachment);
          } catch {
            onError("That file could not be read. Try another.");
          } finally {
            setReading(false);
          }
        }}
      />
      <Button
        variant="neutral"
        appearance={appearance}
        size="small"
        iconOnly
        loading={reading}
        disabled={disabled}
        aria-label="Attach a file"
        onClick={() => input.current?.click()}
      >
        <Paperclip aria-hidden="true" />
      </Button>
    </>
  );
}

/** The file waiting to go with the next message. */
export function PendingAttachment({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-inline-md rounded-control border border-line bg-surface p-inset-xs">
      {attachment.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- a data URL, nothing to optimise
        <img
          src={attachment.imageUrl}
          alt=""
          className="size-10 shrink-0 rounded-control-small object-cover"
        />
      ) : (
        <FileText
          aria-hidden="true"
          className="size-5 shrink-0 text-fg-muted"
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-label-sm text-fg">
          {attachment.name}
        </span>
        <span className="block text-caption text-fg-muted">
          {attachment.sizeLabel}
        </span>
      </span>
      <Button
        variant="neutral"
        appearance="ghost"
        size="small"
        iconOnly
        aria-label={`Remove ${attachment.name}`}
        onClick={onRemove}
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}
