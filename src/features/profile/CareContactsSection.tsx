"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  FormField,
  Input,
  Select,
  Skeleton,
} from "@/components/ui";
import { useDialysisClinic } from "@/features/travel/useDialysisClinic";
import { isNetworkClinic } from "./clinicEnrollment";
import {
  networkOffices,
  type CareContactKind,
  type CareOffice,
} from "./careContacts";
import { useCareContacts } from "./useCareContacts";

/* ==========================================================================
   My Care Offices — Member Settings
   --------------------------------------------------------------------------
   Four offices, each saved on its own. Picking an office that is on
   NephroReach links the member to it (for the dialysis center, that turns
   on Message My Care Team); any other office is typed in.
   ========================================================================== */

const OTHER = "__other__";

const LABEL: Record<CareContactKind, { en: string; es: string }> = {
  dialysis: { en: "Dialysis Center", es: "Centro de Diálisis" },
  vascular: { en: "Vascular Access Center", es: "Centro de Acceso Vascular" },
  nephrology: { en: "Nephrology Office", es: "Consultorio de Nefrología" },
  primaryCare: {
    en: "Primary Care Office",
    es: "Consultorio de Atención Primaria",
  },
};

function OfficeForm({
  kind,
  saved,
  onSave,
  isEs,
}: {
  kind: CareContactKind;
  saved: CareOffice;
  onSave: (office: CareOffice) => Promise<unknown>;
  isEs: boolean;
}) {
  const network = networkOffices(kind);
  const [draft, setDraft] = useState<CareOffice>(saved);
  const [choice, setChoice] = useState(
    network.includes(saved.name) ? saved.name : OTHER,
  );
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const set = (change: Partial<CareOffice>) => {
    setDraft((d) => ({ ...d, ...change }));
    setState("idle");
  };
  const onNetwork =
    kind === "dialysis"
      ? isNetworkClinic(draft.name)
      : network.includes(draft.name);
  const label = isEs ? LABEL[kind].es : LABEL[kind].en;

  return (
    <form
      className="space-y-stack-md rounded-card-nested border border-line p-inset-md"
      onSubmit={async (event) => {
        event.preventDefault();
        setState("saving");
        try {
          await onSave(draft);
          setState("saved");
        } catch {
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
                setChoice(e.target.value);
                set({ name: e.target.value === OTHER ? "" : e.target.value });
              }}
            >
              {network.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              <option value={OTHER}>
                {isEs ? "Otra oficina…" : "Another office…"}
              </option>
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

      {state === "error" ? (
        <Alert tone="danger">
          {isEs
            ? "No se guardó. Inténtelo de nuevo."
            : "That did not save. Try again."}
        </Alert>
      ) : null}

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
  const dialysis = useDialysisClinic();
  const care = useCareContacts();

  if (dialysis.isPending || care.isPending || !dialysis.clinic) {
    return <Skeleton height={320} />;
  }

  const saveOther =
    (kind: "vascular" | "nephrology" | "primaryCare") => (office: CareOffice) =>
      care.save({ ...care.contacts, [kind]: office });

  return (
    <div className="space-y-stack-md">
      <p className="text-body-sm text-fg-muted">
        {isEs
          ? "Sus oficinas aparecen en las pestañas que las usan: viajes, acceso vascular, Antes de Urgencias y mensajes."
          : "Your offices show up on the tabs that use them: travel, vascular access, Before the ER and messages."}
      </p>
      <OfficeForm
        kind="dialysis"
        isEs={isEs}
        saved={dialysis.clinic}
        onSave={(office) => dialysis.save.mutateAsync(office)}
      />
      <OfficeForm
        kind="vascular"
        isEs={isEs}
        saved={care.contacts.vascular}
        onSave={saveOther("vascular")}
      />
      <OfficeForm
        kind="nephrology"
        isEs={isEs}
        saved={care.contacts.nephrology}
        onSave={saveOther("nephrology")}
      />
      <OfficeForm
        kind="primaryCare"
        isEs={isEs}
        saved={care.contacts.primaryCare}
        onSave={saveOther("primaryCare")}
      />
    </div>
  );
}
