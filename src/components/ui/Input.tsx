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
  big: "h-control-big px-control-x-small rounded-control text-body-md",
  small: "h-control-small px-control-x-small rounded-control-small text-body-sm",
};

const shared =
  "w-full border bg-surface text-fg transition-colors duration-150 ease-standard " +
  "placeholder:text-fg-muted " +
  "border-field hover:border-line-strong " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:border-primary-edge " +
  "aria-invalid:border-danger-edge aria-invalid:focus-visible:outline-danger-edge " +
  "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-sunken disabled:text-fg-subtle";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  inputSize?: ControlSize;
  /** Rendered inside the field, before the text. Sized by the component. */
  leadingIcon?: React.ReactNode;
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

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, rows = 3, ...rest }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        shared,
        // Height is content-driven here, so pad rather than fix a height.
        "min-h-control-big rounded-control px-control-x-small py-inset-xs text-body-md",
        className,
      )}
      {...rest}
    />
  );
}

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  selectSize?: ControlSize;
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
          "cursor-pointer appearance-none pr-10",
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
