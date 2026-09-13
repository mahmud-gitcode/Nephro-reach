"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   Button
   --------------------------------------------------------------------------
   Three independent axes:

     variant    which colour        primary · neutral · danger · accent
     appearance how much emphasis   fill · fill-stroke · stroke
     size       how big             big · small

   Keeping colour and emphasis on separate axes is what makes the matrix
   readable: a "secondary" button is primary + stroke, not a colour of its
   own. Mixing them produces questions with no answer — is "secondary fill"
   louder than "primary stroke"?

   The prop is `appearance`, not `type`: `type` is a native button attribute
   (submit / reset / button) and shadowing it would silently break forms.

   Sizing is by HEIGHT, never padding, so the touch target is guaranteed
   rather than remembered. Icons are sized by the component — a caller
   passes <Pencil /> and gets 24px in a big button, 16px in a small one.
   ========================================================================== */

export type ButtonVariant = "primary" | "neutral" | "danger" | "accent";
export type ButtonAppearance = "fill" | "fill-stroke" | "stroke";
export type ButtonSize = "big" | "small";

const base =
  "inline-flex items-center justify-center shrink-0 border " +
  "whitespace-nowrap cursor-pointer select-none " +
  "transition-colors duration-150 ease-standard " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
  "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-sunken " +
  "disabled:text-fg-subtle disabled:shadow-none";

/* Colour is resolved from tone tokens, so every combination below also has a
   dark-theme answer without a single extra class. */
const tone: Record<ButtonVariant, Record<ButtonAppearance, string>> = {
  primary: {
    fill: "bg-primary-solid border-transparent text-primary-on-solid shadow-control hover:bg-primary-solid-hover",
    "fill-stroke":
      "bg-primary-soft border-primary-soft-line text-primary-fg hover:bg-primary-soft-hover",
    stroke:
      "bg-transparent border-primary-edge text-primary-edge hover:bg-primary-edge-hover",
  },
  neutral: {
    fill: "bg-neutral-solid border-transparent text-neutral-on-solid shadow-control hover:bg-neutral-solid-hover",
    "fill-stroke":
      "bg-neutral-soft border-neutral-soft-line text-neutral-fg shadow-control hover:bg-neutral-soft-hover",
    stroke:
      "bg-transparent border-neutral-edge text-neutral-edge hover:bg-neutral-edge-hover",
  },
  danger: {
    fill: "bg-danger-solid border-transparent text-danger-on-solid shadow-control hover:bg-danger-solid-hover",
    "fill-stroke":
      "bg-danger-soft border-danger-soft-line text-danger-fg hover:bg-danger-soft-hover",
    stroke:
      "bg-transparent border-danger-edge text-danger-edge hover:bg-danger-edge-hover",
  },
  accent: {
    fill: "bg-accent-solid border-transparent text-accent-on-solid shadow-control hover:bg-accent-solid-hover",
    "fill-stroke":
      "bg-accent-soft border-accent-soft-line text-accent-fg hover:bg-accent-soft-hover",
    stroke:
      "bg-transparent border-accent-edge text-accent-edge hover:bg-accent-edge-hover",
  },
};

/* `[&_svg]` sizes any icon the caller passes, including the spinner. */
const sizes: Record<ButtonSize, string> = {
  big:
    "h-control-big min-w-control-big px-control-x-big gap-inline-md " +
    "rounded-control text-button-lg [&_svg]:h-icon-big [&_svg]:w-icon-big",
  small:
    "h-control-small min-w-control-small px-control-x-small gap-inline-sm " +
    "rounded-control-small text-button-md [&_svg]:h-icon-small [&_svg]:w-icon-small",
};

const iconOnly: Record<ButtonSize, string> = {
  big: "w-control-big px-0",
  small: "w-control-small px-0",
};

export type ButtonStyleOptions = {
  variant?: ButtonVariant;
  appearance?: ButtonAppearance;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
};

/**
 * The class string alone, so a `<Link>` can be styled as a button without
 * this component needing to know about routing.
 *
 *   <Link href="/pricing" className={buttonStyles({ variant: "primary" })}>
 */
export function buttonStyles({
  variant = "primary",
  appearance = "fill",
  size = "big",
  fullWidth = false,
  iconOnly: only = false,
}: ButtonStyleOptions = {}): string {
  return cn(
    base,
    tone[variant][appearance],
    sizes[size],
    only && iconOnly[size],
    fullWidth && "w-full",
  );
}

export type ButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> &
  ButtonStyleOptions & {
    /** Shows a spinner and blocks interaction. Width is preserved. */
    loading?: boolean;
    /** Rendered before the label. Sized by the component. */
    leadingIcon?: React.ReactNode;
    /** Rendered after the label. Sized by the component. */
    trailingIcon?: React.ReactNode;
    children?: React.ReactNode;
  };

export function Button({
  variant = "primary",
  appearance = "fill",
  size = "big",
  fullWidth = false,
  iconOnly = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  disabled,
  className,
  children,
  // Defaults to "button". An unspecified button inside a form submits it,
  // which is a bug this component should not let through.
  type = "button",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        buttonStyles({ variant, appearance, size, fullWidth, iconOnly }),
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        leadingIcon
      )}
      {children}
      {!loading && trailingIcon}
    </button>
  );
}

export default Button;
