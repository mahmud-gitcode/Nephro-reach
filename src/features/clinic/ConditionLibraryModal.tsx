"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  FormField,
  Input,
  Modal,
  SearchField,
  Select,
  Switch,
} from "@/components/ui";
import {
  CONDITION_GROUPS,
  conditionDraftError,
  conditionText,
  type ConditionDraft,
  type ConditionGroup,
} from "./ccmConditions";
import { useLanguage } from "@/context/LanguageContext";
import { actionErrorText } from "./officeContext";
import { useConditionLibrary } from "./useConditionLibrary";

/* ==========================================================================
   Condition library — the clinic Administrator's list
   --------------------------------------------------------------------------
   The client asked for the conditions to be managed, not hard-coded. The
   defaults can be switched off (a practice that never sees PKD need not
   scroll past it); the clinic's own can be added and deleted. Neither
   touches a patient who already has the condition.
   ========================================================================== */

const EMPTY_DRAFT: ConditionDraft = {
  label: "",
  short: "",
  group: "Other Chronic Conditions",
};

export function ConditionLibraryModal({ onClose }: { onClose: () => void }) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const store = useConditionLibrary();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<ConditionDraft>(EMPTY_DRAFT);
  const [tried, setTried] = useState(false);
  const error = conditionDraftError(draft, store.library, isEs);
  const q = query.trim().toLowerCase();
  /* Searches what the reader sees (the Spanish names in Spanish). */
  const shown = store.library.filter(
    (c) =>
      q === "" ||
      conditionText(c.label, isEs).toLowerCase().includes(q) ||
      conditionText(c.short, isEs).toLowerCase().includes(q),
  );
  const activeCount = store.library.filter((c) => c.active).length;

  return (
    <Modal
      open
      onClose={onClose}
      size="big"
      title={isEs ? "Biblioteca de afecciones" : "Condition Library"}
      description={
        isEs
          ? `${activeCount} de ${store.library.length} afecciones disponibles cuando el personal elige las afecciones de un paciente.`
          : `${activeCount} of ${store.library.length} conditions offered when staff choose a patient's conditions.`
      }
      footer={<Button onClick={onClose}>{isEs ? "Listo" : "Done"}</Button>}
    >
      <div className="space-y-stack-lg">
        {store.saveError ? (
          <Alert
            tone="danger"
            title={
              isEs ? "No se guardó ese cambio" : "That change was not saved"
            }
          >
            {actionErrorText(store.saveError, isEs)}
          </Alert>
        ) : null}
        {store.error ? (
          <Alert
            tone="danger"
            title={
              isEs
                ? "No se pudo cargar la biblioteca"
                : "The library could not be loaded"
            }
          >
            {actionErrorText(store.error, isEs)}
          </Alert>
        ) : null}

        <section className="rounded-card-nested border border-line p-inset-md">
          <h3 className="mb-stack-sm text-heading-5 text-fg">
            {isEs ? "Agregar una afección" : "Add a condition"}
          </h3>
          <div className="grid gap-stack-md sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <FormField
              label={isEs ? "Nombre" : "Name"}
              required
              error={tried && error ? error : undefined}
            >
              {(field) => (
                <Input
                  {...field}
                  value={draft.label}
                  placeholder={
                    isEs
                      ? "p. ej., enfermedad de células falciformes"
                      : "e.g. Sickle Cell Disease"
                  }
                  onChange={(e) =>
                    setDraft({ ...draft, label: e.target.value })
                  }
                />
              )}
            </FormField>
            <FormField
              label={isEs ? "Nombre corto" : "Short name"}
              hint={
                isEs
                  ? "Aún no se guarda: la lista de trabajo muestra el nombre completo"
                  : "Not saved yet: the worklist shows the full name"
              }
            >
              {(field) => (
                <Input
                  {...field}
                  value={draft.short}
                  maxLength={16}
                  disabled
                  placeholder={isEs ? "p. ej., SCD" : "e.g. SCD"}
                  onChange={(e) =>
                    setDraft({ ...draft, short: e.target.value })
                  }
                />
              )}
            </FormField>
          </div>
          <div className="mt-stack-md flex flex-wrap items-end gap-inline-md">
            <FormField
              label={isEs ? "Grupo" : "Group"}
              hint={
                isEs
                  ? "Aún no se guarda: las afecciones agregadas aparecen en Otras"
                  : "Not saved yet: added conditions are listed under Other"
              }
              className="min-w-56 flex-1"
            >
              {(field) => (
                <Select
                  {...field}
                  value={draft.group}
                  disabled
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      group: e.target.value as ConditionGroup,
                    })
                  }
                >
                  {CONDITION_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {conditionText(group, isEs)}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
            <Button
              leadingIcon={<Plus aria-hidden="true" />}
              disabled={store.isSaving}
              onClick={() => {
                setTried(true);
                if (error) return;
                store.add(draft);
                setDraft(EMPTY_DRAFT);
                setTried(false);
              }}
            >
              {isEs ? "Agregar afección" : "Add Condition"}
            </Button>
          </div>
        </section>

        <section>
          <SearchField
            label={isEs ? "Buscar en la biblioteca" : "Search the library"}
            placeholder={isEs ? "Buscar afecciones…" : "Search conditions…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="mt-stack-md space-y-stack-lg">
            {CONDITION_GROUPS.map((group) => {
              const items = shown.filter((c) => c.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group}>
                  <h3 className="mb-stack-xs text-label-md text-fg-muted">
                    {conditionText(group, isEs)}
                  </h3>
                  <ul className="divide-y divide-line-subtle rounded-card-nested border border-line">
                    {items.map((condition) => (
                      <li
                        key={condition.id}
                        className="flex min-h-12 items-center gap-inline-md px-inset-sm py-inset-xs"
                      >
                        <span className="min-w-0 flex-1">
                          <span
                            className={
                              condition.active
                                ? "text-body-sm text-fg"
                                : "text-body-sm text-fg-muted"
                            }
                          >
                            {conditionText(condition.label, isEs)}
                          </span>
                          <span className="block text-caption text-fg-muted">
                            {conditionText(condition.short, isEs)}
                            {condition.secondary
                              ? isEs
                                ? " · temporal"
                                : " · temporary"
                              : ""}
                          </span>
                        </span>
                        {condition.custom ? (
                          <Badge tone="info">
                            {isEs
                              ? "Agregada por la clínica"
                              : "Added by clinic"}
                          </Badge>
                        ) : null}
                        <Switch
                          checked={condition.active}
                          onChange={(on: boolean) =>
                            store.setActive(condition, on)
                          }
                          label={
                            isEs
                              ? `Ofrecer ${conditionText(condition.label, true)}`
                              : `Offer ${condition.label}`
                          }
                        />
                        {condition.custom ? (
                          <Button
                            size="small"
                            variant="danger"
                            appearance="ghost"
                            iconOnly
                            aria-label={
                              isEs
                                ? `Eliminar ${condition.label}`
                                : `Delete ${condition.label}`
                            }
                            onClick={() => store.remove(condition)}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </Modal>
  );
}
