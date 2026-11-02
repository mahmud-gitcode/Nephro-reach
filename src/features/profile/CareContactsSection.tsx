"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  FormField,
  Input,
  Select,
  Skeleton,
} from "@/components/ui";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import {
  type CareContactKind,
  type CareOffice,
  type OfficeKind,
} from "./careContacts";
import { officesOfKind, useDirectory, type DirectoryOffice } from "./directory";
import { EMPTY_CLINIC } from "./homeDialysisClinic";
import { saveErrorText } from "./saveError";
import { useCareContacts } from "./useCareContacts";
import { useHomeDialysisClinic } from "./useHomeDialysisClinic";

/* ==========================================================================
   My Care Offices — Member Settings
   --------------------------------------------------------------------------
   Five offices, each saved on its own (Phase 4: the API). The pick list is
   the NephroReach directory. Picking a dialysis center links the clinic by
   its id (the server checks the patient is cared for there and sets
   `onNephroReach`, which turns on Message My Care Team); any other office
   is typed in.
   ========================================================================== */

const OTHER = "__other__";

const LABEL: Record<CareContactKind, { en: string; es: string }> = {
  dialysis: { en: "Dialysis Center", es: "Centro de Diálisis" },
  vascular: { en: "Vascular Access Center", es: "Centro de Acceso Vascular" },
  nephrology: { en: "Nephrology Office", es: "Consultorio de Nefrología" },
  transplant: { en: "Transplant Center", es: "Centro de Trasplantes" },
  primaryCare: {
    en: "Primary Care Office",
    es: "Consultorio de Atención Primaria",
  },
};

type OfficeDraft = CareOffice & { organizationId?: string | null };

function OfficeForm({
  kind,
  saved,
  savedOnNephroReach = false,
  network,
  onSave,
  isEs,
}: {
  kind: CareContactKind;
  saved: OfficeDraft;
  /** The server's `onNephroReach` for the saved dialysis clinic. */
  savedOnNephroReach?: boolean;
  network: DirectoryOffice[];
  onSave: (office: OfficeDraft) => Promise<unknown>;
  isEs: boolean;
}) {
  const linkByCenter = kind === "dialysis";
  const savedChoice = linkByCenter
    ? (saved.organizationId ?? null)
    : (network.find((o) => o.name === saved.name)?.id ?? null);
  const [draft, setDraft] = useState<OfficeDraft>(saved);
  const [choice, setChoice] = useState(savedChoice ?? OTHER);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [errorText, setErrorText] = useState("");
  const set = (change: Partial<OfficeDraft>) => {
    setDraft((d) => ({ ...d, ...change }));
    setState("idle");
  };
  const onNetwork = linkByCenter
    ? choice !== OTHER &&
      (choice === saved.organizationId ? savedOnNephroReach : true)
    : network.some((o) => o.name === draft.name);
  const label = isEs ? LABEL[kind].es : LABEL[kind].en;

  return (
    <form
      className="space-y-stack-md rounded-card-nested border border-line p-inset-md max-sm:p-inset-sm"
      onSubmit={async (event) => {
        event.preventDefault();
        if (state === "saving") return;
        setState("saving");
        try {
          await onSave(draft);
          setState("saved");
        } catch (error) {
          setErrorText(saveErrorText(error, isEs ? "es" : "en"));
          setState("error");
        }
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-inline-md">
        <h3 className="text-heading-5 text-fg">{label}</h3>
        {draft.name ? (
          <Badge tone={onNetwork ? "success" : "neutral"}>
            {onNetwork
              ? isEs
                ? "En NephroReach"
                : "On NephroReach"
              : isEs
                ? "Fuera de NephroReach"
                : "Not on NephroReach"}
          </Badge>
        ) : null}
      </div>

      {network.length > 0 ? (
        <FormField label={isEs ? "Oficina" : "Office"}>
          {(field) => (
            <Select
              {...field}
              value={choice}
              onChange={(e) => {
                const picked = network.find((o) => o.id === e.target.value);
                setChoice(e.target.value);
                set(
                  picked
                    ? {
                        name: picked.name,
                        address: draft.address || picked.address || "",
                        organizationId: linkByCenter ? picked.id : null,
                      }
                    : { name: "", organizationId: null },
                );
              }}
            >
              {network.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
              <option value={OTHER}>{isEs ? "Otro…" : "Other…"}</option>
            </Select>
          )}
        </FormField>
      ) : null}

      <div className="grid gap-stack-md sm:grid-cols-2">
        {choice === OTHER || network.length === 0 ? (
          <FormField label={isEs ? "Nombre" : "Name"}>
            {(field) => (
              <Input
                {...field}
                value={draft.name}
                onChange={(e) => set({ name: e.target.value })}
              />
            )}
          </FormField>
        ) : null}
        <FormField label={isEs ? "Teléfono" : "Phone"}>
          {(field) => (
            <Input
              {...field}
              type="tel"
              value={draft.phone}
              onChange={(e) => set({ phone: e.target.value })}
            />
          )}
        </FormField>
        <FormField
          label={isEs ? "Dirección" : "Address"}
          className="sm:col-span-2"
        >
          {(field) => (
            <Input
              {...field}
              value={draft.address}
              onChange={(e) => set({ address: e.target.value })}
            />
          )}
        </FormField>
      </div>

      {state === "error" ? <Alert tone="danger">{errorText}</Alert> : null}

      <div className="flex items-center justify-end gap-inline-md">
        {state === "saved" ? (
          <span
            role="status"
            className="inline-flex items-center gap-inline-xs text-body-sm text-success"
          >
            <Check aria-hidden="true" className="size-4" />
            {isEs ? "Guardado" : "Saved"}
          </span>
        ) : null}
        <Button type="submit" loading={state === "saving"}>
          {isEs ? "Guardar" : "Save"}
        </Button>
      </div>
    </form>
  );
}

export function CareContactsSection({ isEs }: { isEs: boolean }) {
  const dialysis = useHomeDialysisClinic();
  const care = useCareContacts();
  const directory = useDirectory();
  const lang = isEs ? "es" : "en";

  /* error → loading → content: a failed read must not leave a skeleton
     forever, nor show empty forms that would save over real offices. */
  const error = dialysis.error ?? care.error ?? directory.error;
  if (
    error ||
    dialysis.isPending ||
    care.isPending ||
    directory.isPending ||
    dialysis.clinic === undefined
  ) {
    return (
      <AsyncSection
        pending
        error={error}
        onRetry={
          canRetry(error)
            ? () => {
                dialysis.refetch();
                care.refetch();
                directory.refetch();
              }
            : undefined
        }
        errorTitle={errorTitleFor(
          error,
          isEs
            ? "No se pudieron cargar sus oficinas de atención"
            : "Your care offices could not be loaded",
          lang,
        )}
        errorMessage={errorMessageFor(error, undefined, lang)}
        skeleton={<Skeleton height={320} />}
      >
        {null}
      </AsyncSection>
    );
  }

  const clinic = dialysis.clinic ?? EMPTY_CLINIC;
  const saveOther = (kind: OfficeKind) => (office: CareOffice) =>
    care.save(kind, office);
  const form = (kind: OfficeKind) => (
    <OfficeForm
      key={`${kind}|${care.contacts[kind].name}`}
      kind={kind}
      isEs={isEs}
      saved={care.contacts[kind]}
      network={officesOfKind(directory.offices, kind)}
      onSave={saveOther(kind)}
    />
  );

  return (
    <div className="space-y-stack-md">
      <p className="text-body-sm text-fg-muted">
        {isEs
          ? "Sus oficinas aparecen en las pestañas que las usan: viajes, acceso vascular, Antes de Urgencias y mensajes."
          : "Your offices show up on the tabs that use them: travel, vascular access, Before the ER and messages."}
      </p>
      <OfficeForm
        key={`dialysis|${clinic.organizationId ?? ""}|${clinic.name}`}
        kind="dialysis"
        isEs={isEs}
        saved={clinic}
        savedOnNephroReach={clinic.onNephroReach}
        network={officesOfKind(directory.offices, "dialysis")}
        onSave={(office) => dialysis.save.mutateAsync(office)}
      />
      {form("vascular")}
      {form("nephrology")}
      {form("transplant")}
      {form("primaryCare")}
    </div>
  );
}
