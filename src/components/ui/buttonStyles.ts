/* ==========================================================================
   Button styles
   --------------------------------------------------------------------------
   Kept out of Button.tsx, which is a "use client" module. buttonStyles() is a
   pure string function and server components legitimately call it to render
   a <Link> that looks like a button — a client module cannot be called from
   the server, only rendered.
   ========================================================================== */

import { cn } from "@/lib/utils/cn";

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
const standardSizes: Record<ButtonSize, string> = {
  big:
    "h-control-big min-w-control-big px-control-x-big gap-inline-md " +
    "rounded-control text-button-lg [&_svg]:h-icon-big [&_svg]:w-icon-big",
  small:
    "h-control-small min-w-control-small px-control-x-small gap-inline-sm " +
    "rounded-control-small text-button-md [&_svg]:h-icon-small [&_svg]:w-icon-small",
};

const iconOnlySizes: Record<ButtonSize, string> = {
  big:
    "h-control-big w-control-big min-w-control-big aspect-square p-0 " +
    "rounded-control text-button-lg [&_svg]:h-icon-big [&_svg]:w-icon-big",
  small:
    "h-control-small w-control-small min-w-control-small aspect-square p-0 " +
    "rounded-control-small text-button-md [&_svg]:h-icon-small [&_svg]:w-icon-small",
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
    only ? iconOnlySizes[size] : standardSizes[size],
    fullWidth && !only && "w-full",
  );
}

