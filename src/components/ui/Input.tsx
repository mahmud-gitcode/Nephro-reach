"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   Input · Textarea · Select
   --------------------------------------------------------------------------
   Heights come from the same control tokens as Button, so an input and a
   button sitting side by side line up — they currently do not.

   Border is `border-field` (gray-500, 3.62:1), not the near-invisible
   gray-200 used today at 1.23:1. WCAG 1.4.11 asks for 3:1 on anything that
   identifies a control, and an input whose edge a low-vision member cannot
   see is a control they cannot find.

   Placeholder is `fg-muted` (4.92:1), never `fg-subtle` (2.60:1) —
   placeholders are not exempt from contrast the way disabled controls are.

   These are unlabelled on purpose. Wrap them in <FormField>, which supplies
   id, aria-describedby and aria-invalid.
   ========================================================================== */

export type ControlSize = "big" | "small";

const sizeClasses: Record<ControlSize, string> = {
  big: "h-control-big px-control-x-small rounded-field text-body-md",
  small: "h-control-small px-control-x-small rounded-field-small text-body-sm",
};

const shared =
  "w-full border bg-field-fill text-fg transition-colors duration-150 ease-standard " +
  // A filled field goes white while it is being typed in.
  "focus-visible:bg-surface " +
  "placeholder:text-fg-muted " +
  "border-line hover:border-line-strong " +
  /* Focus: the border turns brand blue (4.8:1 against white, so the change
     is plain to see) inside a soft 4px brand glow. It replaces a black 2px
     outline offset from a black border, which drew a harsh double ring on
     every click — text fields take :focus-visible on a mouse click too. */
  "focus-visible:outline-none focus-visible:border-action focus-visible:ring-4 focus-visible:ring-action/20 " +
  "aria-invalid:border-danger-edge aria-invalid:focus-visible:border-danger-edge aria-invalid:focus-visible:ring-danger-edge/20 " +
  "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-sunken disabled:text-fg-subtle";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  inputSize?: ControlSize;
  /** Rendered inside the field, before the text. Sized by the component. */
  leadingIcon?: React.ReactNode;
  /* React 19 passes `ref` as an ordinary prop; declared so a caller can
     focus the field (SearchField's ⌘K does). */
  ref?: React.Ref<HTMLInputElement>;
};

export function Input({
  inputSize = "big",
  leadingIcon,
  className,
  ...rest
}: InputProps) {
  const field = (
    <input
      className={cn(
        shared,
        sizeClasses[inputSize],
        leadingIcon ? "pl-10" : undefined,
        className,
      )}
      {...rest}
    />
  );

  if (!leadingIcon) return field;

  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-muted [&_svg]:h-icon-small [&_svg]:w-icon-small"
      >
        {leadingIcon}
      </span>
      {field}
    </div>
  );
}

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    /* React 19 passes `ref` as an ordinary prop, but the DOM attribute
       types do not include it. Declared so a caller can measure the field
       — an auto-growing composer has to read its own scrollHeight. */
    ref?: React.Ref<HTMLTextAreaElement>;
  };

export function Textarea({ className, rows = 3, ref, ...rest }: TextareaProps) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        shared,
        // Height is content-driven here, so pad rather than fix a height.
        "min-h-control-big rounded-field px-control-x-small py-inset-xs text-body-md",
        className,
      )}
      {...rest}
    />
  );
}

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  selectSize?: ControlSize;
};

/* Room for the chevron, and no more. The chevron sits 12px from the right
   edge and is 16px wide, so a `small` select needs 32px of right padding,
   not the 40px both sizes used to share. In a narrow table cell those
   eight pixels were the difference between reading "No" and seeing an
   empty box: 12px left + 40px right left the text almost no content box
   at all, and the selected value was clipped to nothing. */
const selectPadding: Record<ControlSize, string> = {
  big: "pr-10",
  small: "pr-8",
};

export function Select({
  selectSize = "big",
  className,
  children,
  ...rest
}: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          shared,
          sizeClasses[selectSize],
          "cursor-pointer appearance-none [&_option]:bg-surface [&_option]:text-fg",
          selectPadding[selectSize],
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 h-icon-small w-icon-small -translate-y-1/2 text-fg-muted"
      />
    </div>
  );
}

export default Input;
