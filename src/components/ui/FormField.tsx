"use client";

import React, { useId } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   FormField
   --------------------------------------------------------------------------
   The member portal has 84 <label> elements and 56 inputs, written
   separately every time. Nothing guarantees a label is actually associated
   with its control, that an error is announced, or that helper text is
   reachable by a screen reader.

   FormField owns the wiring: it generates the id, binds htmlFor,
   aria-describedby and aria-invalid, and renders label / control / helper /
   error in one fixed order. A control gets those props through a render
   function, so the binding cannot be forgotten.

       <FormField label="Pre-treatment weight" hint="In kilograms.">
         {(props) => <Input {...props} defaultValue="72.4" />}
       </FormField>

   Error replaces hint rather than stacking, so the member is never asked to
   read two competing instructions.

   NOTE: the render-prop means FormField can only be used from a client
   component - React cannot pass a function from a server component to a
   client one. Form pages are interactive anyway, so this costs nothing in
   practice, but it is why a page using FormField needs "use client".
   ========================================================================== */

export type FieldControlProps = {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": boolean | undefined;
  required: boolean | undefined;
};

export type FormFieldProps = {
  label: React.ReactNode;
  /** Helper text under the control. Hidden while an error is showing. */
  hint?: React.ReactNode;
  /** Presence of an error switches the control to its invalid styling. */
  error?: React.ReactNode;
  required?: boolean;
  /** Shown next to the label when a field is genuinely optional. */
  optionalLabel?: string;
  className?: string;
  children: (props: FieldControlProps) => React.ReactNode;
};

export function FormField({
  label,
  hint,
  error,
  required,
  optionalLabel,
  className,
  children,
}: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={cn("flex flex-col gap-stack-xs", className)}>
      <label htmlFor={id} className="text-label-lg text-fg">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        ) : optionalLabel ? (
          <span className="text-fg-muted"> ({optionalLabel})</span>
        ) : null}
      </label>

      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        required: required || undefined,
      })}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-inline-xs text-caption text-danger"
        >
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-caption text-fg-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default FormField;
