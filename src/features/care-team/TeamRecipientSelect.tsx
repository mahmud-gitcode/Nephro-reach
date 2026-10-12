"use client";

import React from "react";
import Link from "next/link";
import { FormField, Select } from "@/components/ui";
import { recipientLabel, type TeamMember } from "./healthcareTeam";

/* ==========================================================================
   "Send to" — the member's healthcare team, then Other
   --------------------------------------------------------------------------
   Every export picks its recipient here (client, 2026-10-12): the people
   who accepted the member's invitation, and "Other" for anyone else, which
   goes through Share Outside NephroReach. No pharmacy, no fixed job titles
   the app could not actually reach.
   ========================================================================== */

export const OTHER_RECIPIENT = "__other__";

export function TeamRecipientSelect({
  recipients,
  value,
  onChange,
  isEs,
  className,
}: {
  recipients: TeamMember[];
  value: string;
  onChange: (value: string) => void;
  isEs: boolean;
  className?: string;
}) {
  return (
    <FormField
      label={isEs ? "Enviar a" : "Send to"}
      className={className}
      hint={
        recipients.length === 0 ? (
          <>
            {isEs ? "Agregue personas en " : "Add people to "}
            <Link
              href="/dashboard/personal-log#healthcare-team"
              className="text-fg-brand underline"
            >
              {isEs ? "Mi Equipo de Salud" : "My Healthcare Team"}
            </Link>
            {isEs
              ? " para enviarles directamente."
              : " to send to them directly."}
          </>
        ) : undefined
      }
    >
      {(props) => (
        <Select
          {...props}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {recipients.map((member) => (
            <option key={member.id} value={member.id}>
              {recipientLabel(member, isEs)}
            </option>
          ))}
          <option value={OTHER_RECIPIENT}>{isEs ? "Otro…" : "Other…"}</option>
        </Select>
      )}
    </FormField>
  );
}
