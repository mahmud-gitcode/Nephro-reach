"use client";

import React, { useState } from "react";
import { Building2, Pencil, Phone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  toTelHref,
  useDialysisClinic,
  type DialysisClinic,
} from "@/features/travel/useDialysisClinic";
import {
  Alert,
  AsyncSection,
  Button,
  buttonStyles,
  Card,
  FormField,
  Input,
  Modal,
  Skeleton,
} from "@/components/ui";

function ClinicModal({
  name,
  phone,
  saving,
  error,
  onClose,
  onSave,
}: {
  name: string;
  phone: string;
  saving: boolean;
  error: unknown;
  onClose: () => void;
  onSave: (next: DialysisClinic) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [draftName, setDraftName] = useState(name);
  const [draftPhone, setDraftPhone] = useState(phone);

  return (
    // The hand-rolled version moved focus to the close button on open but
    // never trapped it, so the next Tab left the dialog for the page behind.
    <Modal
      open
      onClose={onClose}
      title={isEs ? "Mi Centro de Diálisis" : "My Dialysis Center"}
      footer={
        <>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={onClose}
            disabled={saving}
          >
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            loading={saving}
            onClick={() =>
              onSave({ name: draftName.trim(), phone: draftPhone.trim() })
            }
          >
            {isEs ? "Guardar" : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-lg">
        {error ? (
          <Alert tone="danger" title={isEs ? "No se guardó" : "Not saved"}>
            {error instanceof Error
              ? error.message
              : isEs
                ? "Inténtelo de nuevo."
                : "Please try again."}
          </Alert>
        ) : null}

        <FormField label={isEs ? "Nombre del centro" : "Center name"}>
          {(props) => (
            <Input
              {...props}
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder={
                isEs ? "ej. Centro de Diálisis ABC" : "e.g. ABC Dialysis Center"
              }
            />
          )}
        </FormField>

        <FormField label={isEs ? "Número de teléfono" : "Phone number"}>
          {(props) => (
            <Input
              {...props}
              type="tel"
              value={draftPhone}
              onChange={(event) => setDraftPhone(event.target.value)}
              placeholder="(305) 555-0142"
            />
          )}
        </FormField>
      </div>
    </Modal>
  );
}

/**
 * Dialysis center name and the number to call, pinned to the top of Dialysis
 * Management so the number is one tap away before anything else on the page.
 */
export default function DialysisClinicCard() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { clinic, isPending, error, refetch, save, isSaving, saveError } =
    useDialysisClinic();
  const [editing, setEditing] = useState(false);

  return (
    <>
      <Card
        as="section"
        padding="small"
        className="flex flex-wrap items-center gap-inline-lg"
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-fg-brand"
        >
          <Building2 className="h-5 w-5" />
        </span>

        {/* The card is the error surface itself — a number a member calls in
            an emergency must not quietly render blank. */}
        <AsyncSection
          pending={isPending}
          error={error}
          onRetry={refetch}
          errorTitle={
            isEs
              ? "No se pudo cargar su centro"
              : "Your center details did not load"
          }
          skeleton={
            <div className="flex min-w-0 flex-1 flex-col gap-stack-xs">
              <Skeleton variant="text" width="35%" />
              <Skeleton variant="text" width="60%" />
            </div>
          }
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-inline-lg">
            <div className="min-w-0 flex-1">
              <p className="text-overline text-fg-muted">
                {isEs ? "Mi Centro de Diálisis" : "My Dialysis Center"}
              </p>
              <p className="truncate text-label-lg text-fg">
                {clinic?.name || (isEs ? "Sin nombre" : "Not set")}
              </p>
            </div>

            {clinic?.phone ? (
              <a href={toTelHref(clinic.phone)} className={buttonStyles()}>
                <Phone aria-hidden="true" className="shrink-0" />
                <span>{clinic.phone}</span>
              </a>
            ) : (
              <Button
                variant="neutral"
                appearance="stroke"
                onClick={() => setEditing(true)}
                className="border-dashed"
              >
                <Phone aria-hidden="true" className="shrink-0" />
                {isEs ? "Agregar número" : "Add phone number"}
              </Button>
            )}

            <Button
              variant="neutral"
              appearance="stroke"
              className="shrink-0 px-inset-xs"
              onClick={() => setEditing(true)}
              aria-label={isEs ? "Editar centro" : "Edit center"}
            >
              <Pencil aria-hidden="true" />
            </Button>
          </div>
        </AsyncSection>
      </Card>

      {editing && clinic && (
        <ClinicModal
          name={clinic.name}
          phone={clinic.phone}
          saving={isSaving}
          error={saveError}
          onClose={() => setEditing(false)}
          onSave={(next) =>
            save.mutate(next, { onSuccess: () => setEditing(false) })
          }
        />
      )}
    </>
  );
}
