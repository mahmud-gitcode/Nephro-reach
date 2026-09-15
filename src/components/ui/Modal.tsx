"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   Modal
   --------------------------------------------------------------------------
   Replaces 24 hand-written `fixed inset-0` overlays in the member portal
   alone. Of those, 16 set no role="dialog", 17 ignore the Escape key, and
   NONE trap focus — which means a keyboard user tabs out of an open dialog,
   lands on the page behind it, and cannot get back or close it.

   What this component guarantees, every time:
     · focus moves into the dialog on open and returns to the trigger on close
     · Tab and Shift+Tab cycle inside the dialog and cannot leave it
     · Escape closes
     · the page behind cannot scroll
     · role="dialog" + aria-modal + aria-labelledby are always wired
     · the dialog is rendered in a portal, so no parent's overflow or
       z-index can clip it

   Composition: <Modal> owns the shell. Pass `title` for the header, and
   `footer` for the action row. Body is children.
   ========================================================================== */

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/** The mounted check never changes after hydration, so it has no subscribers. */
const subscribeNoop = () => () => {};

export type ModalSize = "small" | "big" | "wide";

/* 700px is the ceiling for every dialog. Wider than that and a form's
   two-column rows stretch into fields nobody can scan across; narrower than
   these, and those same rows squeeze into columns too tight to type in.

   Tailwind's `sm:` breakpoints inside a modal measure the viewport, not the
   dialog, so a two-column form laid out at `sm:grid-cols-2` gets its columns
   on any desktop — which is why a narrow dialog holding one is cramped
   rather than stacked. */
const sizes: Record<ModalSize, string> = {
  /** Confirmations and one-field prompts. */
  small: "max-w-[420px]",
  /** Ordinary forms — a handful of single-column fields. */
  big: "max-w-[560px]",
  /** Anything with two-column rows or a media preview. */
  wide: "max-w-[700px]",
};

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Rendered as the dialog's accessible name. */
  title: React.ReactNode;
  /** Optional line under the title. */
  description?: React.ReactNode;
  /** Action row, pinned to the bottom of the dialog. */
  footer?: React.ReactNode;
  size?: ModalSize;
  /** Clicking the backdrop closes. Turn off for destructive confirmations. */
  closeOnBackdrop?: boolean;
  /** Hides the X. The dialog must then have a close action in the footer. */
  hideCloseButton?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = "big",
  closeOnBackdrop = true,
  hideCloseButton = false,
  className,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Portals need a DOM target, which does not exist during SSR.
  // useSyncExternalStore returns the server snapshot (false) during render on
  // the server and the client snapshot (true) once hydrated — the same result
  // as a useState/useEffect pair, without setting state inside an effect.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  /* Remember what had focus, move focus inside, and put it back on close. */
  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    // Fall back to the panel itself so focus is never left behind the dialog.
    (first ?? panel)?.focus();

    return () => {
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  /* The page behind a modal must not scroll. */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

      if (focusable.length === 0) {
        // Nothing to tab to — keep focus on the panel rather than letting it
        // escape to the page behind.
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  if (!mounted || !open) return null;

  return createPortal(
    <div
      // The scrim is decoration, not a control: role="presentation" says so.
      // Clicking it is a mouse shortcut on top of the two affordances that
      // actually matter, Escape and the close button, both of which work
      // without it. It is deliberately not a <button> — a full-screen button
      // announces itself to a screen reader as something worth pressing.
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-fg/50 p-inset-md backdrop-blur-xs"
      onMouseDown={(e) => {
        // mousedown, not click: a drag that starts inside the panel and ends
        // on the backdrop should not close the dialog.
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      {/* A focus trap has to watch Tab on the dialog container — that is what
          makes it a trap. The rule is right in general and wrong here. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the focus trap needs the key handler */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-panel border border-line",
          "bg-surface shadow-lg outline-none",
          sizes[size],
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-inline-lg border-b border-line-subtle p-inset-lg pb-inset-md">
          <div className="min-w-0">
            <h2 id={titleId} className="text-heading-4 text-fg">
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-stack-xs text-body-sm text-fg-muted"
              >
                {description}
              </p>
            ) : null}
          </div>

          {!hideCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-control-small p-1 text-fg-muted transition-colors duration-150 hover:bg-surface-sunken hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-edge"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {/* Body — scrolls on its own so the header and footer stay put. */}
        <div className="min-h-0 flex-1 overflow-y-auto p-inset-lg text-body-md text-fg-secondary">
          {children}
        </div>

        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-inline-md border-t border-line-subtle p-inset-lg pt-inset-md">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
