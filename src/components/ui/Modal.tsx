"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
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

   Placement: `center` (the default) is the dialog in the middle of the
   screen. `bottom` is a sheet that slides up from the bottom edge and
   overlaps the page (up to 900px wide, centred), which stays visible above it: for a record opened
   from a list (a CCM patient from the worklist), where the work needs the
   width of the page and the list behind it is still the context. It opens
   at half the screen; its handle drags it up to nearly full height, back
   down to half, or right down to close. The handle is also a button, so a
   tap, Enter or the arrow keys do the same without dragging. The height is
   set by the sheet, never its content, so switching tabs inside it does
   not make it jump; `size` does not apply to it.
   ========================================================================== */

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/* The bottom sheet's heights, as shares of the screen. */
const SHEET_HALF = 0.5;
const SHEET_FULL = 0.92;
/** Dragged below this, the sheet closes. */
const SHEET_CLOSE = 0.3;

/** The mounted check never changes after hydration, so it has no subscribers. */
const subscribeNoop = () => () => {};

export type ModalSize = "small" | "big" | "wide";
export type ModalPlacement = "center" | "bottom";

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
  /** `bottom` opens a sheet (max 900px wide) from the bottom of the screen. */
  placement?: ModalPlacement;
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
  placement = "center",
  closeOnBackdrop = true,
  hideCloseButton = false,
  className,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  /* The sheet's snap point, and its live height while being dragged. Reset
     to half each time the modal opens (state adjusted during render, not in
     an effect). */
  const [sheetState, setSheetState] = useState({ open, full: false });
  if (sheetState.open !== open) setSheetState({ open, full: false });
  const full = sheetState.full;
  const setFull = (next: boolean) => setSheetState({ open, full: next });
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const drag = useRef<{ startY: number; startH: number; moved: boolean }>(null);
  const suppressClick = useRef(false);

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
    /* Not the sheet's handle: focus starts on the dialog's own controls. */
    const first = Array.from(
      panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
    ).find((el) => !el.hasAttribute("data-sheet-handle"));
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

  const sheet = placement === "bottom";

  const onHandleDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const panel = panelRef.current;
    if (!panel) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = {
      startY: event.clientY,
      startH: panel.getBoundingClientRect().height,
      moved: false,
    };
  };
  const onHandleMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dy = event.clientY - d.startY;
    if (Math.abs(dy) > 4) d.moved = true;
    if (!d.moved) return;
    const vh = window.innerHeight;
    setDragHeight(Math.min(vh * SHEET_FULL, Math.max(vh * 0.2, d.startH - dy)));
  };
  const onHandleUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    /* A drag is not also a tap: the click that follows is ignored. */
    suppressClick.current = true;
    const vh = window.innerHeight;
    const h = dragHeight ?? d.startH;
    setDragHeight(null);
    if (h < vh * SHEET_CLOSE) onClose();
    else setFull(h > vh * ((SHEET_HALF + SHEET_FULL) / 2));
  };

  return createPortal(
    <div
      // The scrim is decoration, not a control: role="presentation" says so.
      // Clicking it is a mouse shortcut on top of the two affordances that
      // actually matter, Escape and the close button, both of which work
      // without it. It is deliberately not a <button> — a full-screen button
      // announces itself to a screen reader as something worth pressing.
      role="presentation"
      // Portalled to <body>, outside the canvas column, so it carries the
      // canvas tokens itself (tokens/canvas.css).
      data-canvas
      className={cn(
        "fixed inset-0 z-50 flex justify-center bg-fg/50 backdrop-blur-xs",
        sheet ? "items-end pt-inset-lg" : "items-center p-inset-md",
      )}
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
          "flex w-full flex-col border border-line bg-surface shadow-lg outline-none",
          sheet
            ? cn(
                "sheet-rise max-w-[900px] rounded-t-panel border-b-0",
                dragHeight === null &&
                  "transition-[height] duration-200 ease-standard",
              )
            : cn("max-h-[calc(100dvh-2rem)] rounded-panel", sizes[size]),
          className,
        )}
        style={
          sheet
            ? {
                height:
                  dragHeight ?? `${(full ? SHEET_FULL : SHEET_HALF) * 100}dvh`,
              }
            : undefined
        }
      >
        {/* The sheet's handle: drag it, tap it, or use the arrow keys. */}
        {sheet ? (
          <button
            type="button"
            data-sheet-handle
            aria-label={full ? "Collapse panel" : "Expand panel"}
            aria-expanded={full}
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
            onClick={() => {
              if (suppressClick.current) {
                suppressClick.current = false;
                return;
              }
              setFull(!full);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setFull(true);
              } else if (event.key === "ArrowDown") {
                event.preventDefault();
                setFull(false);
              }
            }}
            className="flex h-6 w-full shrink-0 cursor-grab touch-none items-center justify-center rounded-t-panel focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring active:cursor-grabbing"
          >
            <span
              aria-hidden="true"
              className="h-1 w-10 rounded-pill bg-line-strong"
            />
          </button>
        ) : null}
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
