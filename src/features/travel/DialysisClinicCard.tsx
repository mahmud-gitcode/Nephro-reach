"use client";

import React, { useState } from "react";
import { Building2, MapPin, Pencil, Phone } from "lucide-react";
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
  address,
  saving,
  error,
  onClose,
  onSave,
}: {
  name: string;
  phone: string;
  address: string;
  saving: boolean;
  error: unknown;
  onClose: () => void;
  onSave: (next: DialysisClinic) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [draftName, setDraftName] = useState(name);
  const [draftPhone, setDraftPhone] = useState(phone);
  const [draftAddress, setDraftAddress] = useState(address);

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
              onSave({
                name: draftName.trim(),
                phone: draftPhone.trim(),
                address: draftAddress.trim(),
              })
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

        {/* Optional, and said so. A member who knows their centre by sight
            should not be blocked from saving a phone number because they
            cannot remember the street. */}
        <FormField
          label={isEs ? "Dirección (opcional)" : "Address (optional)"}
          hint={
            isEs
              ? "Útil para dársela a un conductor o a un familiar."
              : "Useful for giving to a driver or a family member."
          }
        >
          {(props) => (
            <Input
              {...props}
              value={draftAddress}
              onChange={(event) => setDraftAddress(event.target.value)}
              placeholder={
                isEs
                  ? "ej. 1420 NW 12th Ave, Miami, FL 33136"
                  : "e.g. 1420 NW 12th Ave, Miami, FL 33136"
              }
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
        className="flex flex-wrap items-start gap-inline-lg sm:items-center"
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
          {/* Stacks on a phone, one row from `sm` up. It used to be a single
              wrapping row, but the name block carried `flex-1 min-w-0` — so
              on a narrow screen flexbox shrank the name towards nothing
              instead of wrapping the call button under it, and the centre's
              name truncated away rather than the layout reflowing. */}
          <div className="flex min-w-0 flex-1 flex-col gap-inline-md sm:flex-row sm:flex-wrap sm:items-center sm:gap-inline-lg">
            <div className="min-w-0 sm:flex-1">
              <p className="text-overline text-fg-muted">
                {isEs ? "Mi Centro de Diálisis" : "My Dialysis Center"}
              </p>
              {/* Wraps on a phone, where there is a full line for it;
                  truncates only once it is sharing a row. */}
              <p className="text-label-lg break-words text-fg sm:truncate">
                {clinic?.name || (isEs ? "Sin nombre" : "Not set")}
              </p>
              {/* Only when there is one. An empty line under the name would
                  read as a centre whose address the app has lost. */}
              {clinic?.address ? (
                <p className="mt-0.5 flex items-start gap-inline-xs text-body-sm text-fg-secondary">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-muted"
                  />
                  <span className="break-words">{clinic.address}</span>
                </p>
              ) : null}
            </div>

            {/* The number and the edit pencil travel together, so the pencil
                never orphans onto a line of its own. */}
            <div className="flex flex-wrap items-center gap-inline-md">
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
          </div>
        </AsyncSection>
      </Card>

      {editing && clinic && (
        <ClinicModal
          name={clinic.name}
          phone={clinic.phone}
          address={clinic.address}
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
