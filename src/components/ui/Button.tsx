"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  buttonStyles,
  type ButtonAppearance,
  type ButtonSize,
  type ButtonStyleOptions,
  type ButtonVariant,
} from "./buttonStyles";

export type { ButtonAppearance, ButtonSize, ButtonStyleOptions, ButtonVariant };
export { buttonStyles };

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
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          {!iconOnly && children}
        </>
      ) : (
        <>
          {leadingIcon}
          {children}
          {trailingIcon}
        </>
      )}
    </button>
  );
}

export default Button;
