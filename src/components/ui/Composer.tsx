"use client";

import React from "react";
import { ArrowUp, Mic, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./Button";

/* ==========================================================================
   Composer
   --------------------------------------------------------------------------
   The reference dashboard's "Ask me anything…" box: one grey pill holding
   round attach and dictate buttons, the text, and a round primary send.

     ( 📎  Ask me anything…                      🎤  ⬆ )

   Enter sends; Send is disabled while the text is blank, so an empty
   message cannot go. Attach and dictate appear only when the caller
   handles them — a button that does nothing is worse than no button.
   Single line by design: a long reply belongs in a Textarea.
   ========================================================================== */

export type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: (value: string) => void;
  /** The text field's accessible name. */
  label: string;
  placeholder?: string;
  onAttach?: () => void;
  onDictate?: () => void;
  /** While a send is in flight: the field stays, Send shows its spinner. */
  sending?: boolean;
  disabled?: boolean;
  className?: string;
};

export function Composer({
  value,
  onChange,
  onSend,
  label,
  placeholder = "Write a message…",
  onAttach,
  onDictate,
  sending = false,
  disabled = false,
  className,
}: ComposerProps) {
  const canSend = value.trim() !== "" && !disabled && !sending;
  const send = () => {
    if (canSend) onSend(value.trim());
  };

  return (
    <div
      className={cn(
        "flex items-center gap-inline-sm rounded-pill border border-line bg-surface-sunken p-1.5",
        "focus-within:border-action focus-within:ring-4 focus-within:ring-action/20",
        disabled && "opacity-60",
        className,
      )}
    >
      {onAttach ? (
        <Button
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          iconOnly
          aria-label="Attach a file"
          onClick={onAttach}
          disabled={disabled}
        >
          <Paperclip />
        </Button>
      ) : null}

      <input
        aria-label={label}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            send();
          }
        }}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-body-md text-fg placeholder:text-fg-muted focus-visible:outline-none",
          !onAttach && "pl-inset-sm",
        )}
      />

      {onDictate ? (
        <Button
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          iconOnly
          aria-label="Dictate"
          onClick={onDictate}
          disabled={disabled}
        >
          <Mic />
        </Button>
      ) : null}

      <Button
        size="small"
        iconOnly
        aria-label="Send"
        onClick={send}
        disabled={!canSend}
        loading={sending}
      >
        <ArrowUp />
      </Button>
    </div>
  );
}

export default Composer;
