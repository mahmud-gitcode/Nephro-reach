"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { canCall } from "./emergencyContact";
import type { ProfileEmergencyContact } from "./emergencyContact";
import { useEmergencyContact } from "./useEmergencyContact";
import {
  Alert,
  AsyncSection,
  Button,
  FormField,
  Input,
  Skeleton,
} from "@/components/ui";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
  isNotShared,
} from "@/lib/data/asyncState";

/* ==========================================================================
   Emergency contact — the form
   --------------------------------------------------------------------------
   The one place this is entered, and the reason the Before-the-ER screen has
   a number to dial.

   Kept next to the rest of the profile because that is where a member looks
   for "things about me", and because asking for it on the screen that needs
   it would mean asking somebody to fill in a form during an emergency.
   ========================================================================== */

/**
 * The fields, seeded once from what is stored.
 *
 * Its parent remounts it with a `key` when the stored value arrives rather
 * than syncing state from props in an effect — an effect would also fire on
 * every refetch and overwrite whatever the member was in the middle of
 * typing.
 */
function EmergencyContactForm({
  initial,
}: {
  initial: ProfileEmergencyContact;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const { save, isSaving, saveError } = useEmergencyContact();

  const [draft, setDraft] = useState<ProfileEmergencyContact>(initial);
  const [saved, setSaved] = useState(false);

  const set = (patch: Partial<ProfileEmergencyContact>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (isSaving) return;
        setSaved(false);
        /* "Saved" only once the server kept it. */
        save(draft, () => setSaved(true));
      }}
    >
      {saveError ? (
        <Alert tone="danger" className="mb-stack-lg">
          {/* A refusal (403: a caregiver whose grant does not let them
              change the profile) says so; trying again cannot help. */}
          {isNotShared(saveError)
            ? isEs
              ? "No tiene permiso para cambiar este contacto de emergencia."
              : "You don't have permission to change this emergency contact."
            : isEs
              ? "No pudimos guardar tu contacto de emergencia. Inténtalo de nuevo."
              : "We could not save your emergency contact. Please try again."}
        </Alert>
      ) : null}

      {saved && !saveError ? (
        <Alert tone="success" className="mb-stack-lg">
          {isEs
            ? "Contacto de emergencia guardado."
            : "Emergency contact saved."}
        </Alert>
      ) : null}

      <p className="mb-stack-lg measure text-body-sm text-fg-muted">
        {isEs
          ? "Es la persona a la que NephroReach ofrecerá llamar desde la pantalla de emergencia. Guárdala ahora: nadie rellena un formulario en una emergencia."
          : "This is the person NephroReach will offer to call from the emergency screen. Save it now — nobody fills in a form during an emergency."}
      </p>

      <div className="space-y-stack-lg">
        <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-2">
          <FormField label={isEs ? "Nombre" : "Name"}>
            {(props) => (
              <Input
                {...props}
                value={draft.name}
                onChange={(event) => set({ name: event.target.value })}
                placeholder={isEs ? "Denise Park" : "Denise Park"}
              />
            )}
          </FormField>

          <FormField
            label={isEs ? "Parentesco" : "Relationship"}
            optionalLabel={isEs ? "opcional" : "optional"}
          >
            {(props) => (
              <Input
                {...props}
                value={draft.relationship}
                onChange={(event) => set({ relationship: event.target.value })}
                placeholder={isEs ? "Hija, vecino…" : "Daughter, neighbor…"}
              />
            )}
          </FormField>
        </div>

        {/* The number is the field that matters: a name with no number looks
          answered on the emergency screen and cannot be dialled. */}
        <FormField
          label={isEs ? "Número de teléfono" : "Phone number"}
          hint={
            isEs
              ? "Sin esto, el botón de emergencia no tiene a quién llamar."
              : "Without this, the emergency button has nobody to call."
          }
        >
          {(props) => (
            <Input
              {...props}
              type="tel"
              value={draft.phone}
              onChange={(event) => set({ phone: event.target.value })}
              placeholder="(555) 010-9920"
            />
          )}
        </FormField>

        <div className="flex flex-wrap items-center justify-between gap-inline-md">
          <p className="text-body-sm text-fg-muted">
            {canCall(draft)
              ? isEs
                ? "El botón de emergencia llamará a este número."
                : "The emergency button will call this number."
              : isEs
                ? "Aún no hay número guardado."
                : "No number saved yet."}
          </p>
          <Button type="submit" disabled={isSaving}>
            {isSaving
              ? isEs
                ? "Guardando…"
                : "Saving…"
              : isEs
                ? "Guardar contacto"
                : "Save contact"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function EmergencyContactSection() {
  const { language } = useLanguage();
  const lang = language === "ES" ? "es" : "en";
  const { contact, isPending, error, refetch } = useEmergencyContact();

  /* Nothing to seed the fields with yet. Rendering them empty and filling
     them a moment later is how a member starts typing into a box that is
     about to be replaced. A failed read is worse: an empty form saved over
     a contact that is really there (INT-10). */
  return (
    <AsyncSection
      pending={isPending}
      error={error}
      onRetry={canRetry(error) ? refetch : undefined}
      errorTitle={errorTitleFor(
        error,
        language === "ES"
          ? "No se pudo cargar su contacto de emergencia"
          : "Your emergency contact could not be loaded",
        lang,
      )}
      errorMessage={errorMessageFor(error, undefined, lang)}
      skeleton={<Skeleton height={220} />}
    >
      <EmergencyContactForm
        key={`${contact.name}|${contact.phone}|${contact.relationship}`}
        initial={contact}
      />
    </AsyncSection>
  );
}

export default EmergencyContactSection;
