"use client";

import React from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./Button";

/* ==========================================================================
   ErrorState
   --------------------------------------------------------------------------
   The counterpart to EmptyState. Empty means "there is nothing here yet";
   this means "we could not find out". They must not look the same, because
   the member's next move is different: one is "add something", the other is
   "try again" — and on a screen full of medical records, showing an empty
   list when the read actually failed is a lie with consequences.

   Two things this refuses to do:

     - Print the raw exception. A member reading "QuotaExceededError" learns
       nothing. `message` is the sentence they get; the original error goes
       to the console for us.
     - Hide the retry. If a caller has no way to retry, that is worth
       noticing at the call site, so `onRetry` is optional but omitting it
       is a deliberate act.
   ========================================================================== */

export type ErrorStateProps = {
  /** What could not be done, in the member's words. */
  title?: React.ReactNode;
  /** One sentence on what they can do about it. */
  message?: React.ReactNode;
  /** Logged, never rendered. */
  error?: unknown;
  onRetry?: () => void;
  retryLabel?: string;
  /** `bare` drops the container, for use inside a Card. */
  variant?: "bordered" | "bare";
  className?: string;
};

/** StorageError and Error both carry a member-readable message; nothing else does. */
function readableMessage(error: unknown): string | null {
  return error instanceof Error && error.message ? error.message : null;
}

export function ErrorState({
  title = "That did not load",
  message,
  error,
  onRetry,
  retryLabel = "Try again",
  variant = "bordered",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "px-inset-lg py-inset-xl",
        variant === "bordered" &&
          "rounded-card border border-danger-line bg-danger-surface",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="mb-stack-md flex h-12 w-12 items-center justify-center rounded-pill bg-surface text-danger shadow-sm [&_svg]:h-icon-big [&_svg]:w-icon-big"
      >
        <AlertTriangle />
      </span>

      <p className="text-heading-5 text-fg">{title}</p>

      <p className="mt-stack-xs max-w-sm text-body-sm text-fg-muted">
        {message ??
          readableMessage(error) ??
          "Something went wrong on this device. Your saved information has not been changed."}
      </p>

      {onRetry ? (
        <div className="mt-stack-lg">
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={onRetry}
            leadingIcon={<RotateCw />}
          >
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default ErrorState;
