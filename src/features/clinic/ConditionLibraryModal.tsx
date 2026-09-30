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
  type ConditionDraft,
  type ConditionGroup,
} from "./ccmConditions";
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
  const store = useConditionLibrary();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<ConditionDraft>(EMPTY_DRAFT);
  const [tried, setTried] = useState(false);
  const error = conditionDraftError(draft, store.library);
  const q = query.trim().toLowerCase();
  const shown = store.library.filter(
    (c) =>
      q === "" ||
      c.label.toLowerCase().includes(q) ||
      c.short.toLowerCase().includes(q),
  );
  const activeCount = store.library.filter((c) => c.active).length;

  return (
    <Modal
      open
      onClose={onClose}
      size="big"
      title="Condition Library"
      description={`${activeCount} of ${store.library.length} conditions offered when staff choose a patient's conditions.`}
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <div className="space-y-stack-lg">
        {store.saveError ? (
          <Alert tone="danger" title="That change was not saved">
            This browser refused to store it. Try again.
          </Alert>
        ) : null}

        <section className="rounded-card-nested border border-line p-inset-md">
          <h3 className="mb-stack-sm text-heading-5 text-fg">
            Add a condition
          </h3>
          <div className="grid gap-stack-md sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <FormField
              label="Name"
              required
              error={tried && error ? error : undefined}
            >
              {(field) => (
                <Input
                  {...field}
                  value={draft.label}
                  placeholder="e.g. Sickle Cell Disease"
                  onChange={(e) =>
                    setDraft({ ...draft, label: e.target.value })
                  }
                />
              )}
            </FormField>
            <FormField label="Short name" hint="Shown on the worklist">
              {(field) => (
                <Input
                  {...field}
                  value={draft.short}
                  maxLength={16}
                  placeholder="e.g. SCD"
                  onChange={(e) =>
                    setDraft({ ...draft, short: e.target.value })
                  }
                />
              )}
            </FormField>
          </div>
          <div className="mt-stack-md flex flex-wrap items-end gap-inline-md">
            <FormField label="Group" className="min-w-56 flex-1">
              {(field) => (
                <Select
                  {...field}
                  value={draft.group}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      group: e.target.value as ConditionGroup,
                    })
                  }
                >
                  {CONDITION_GROUPS.map((group) => (
                    <option key={group}>{group}</option>
                  ))}
                </Select>
              )}
            </FormField>
            <Button
              leadingIcon={<Plus aria-hidden="true" />}
              onClick={() => {
                setTried(true);
                if (error) return;
                store.add(draft);
                setDraft(EMPTY_DRAFT);
                setTried(false);
              }}
            >
              Add Condition
            </Button>
          </div>
        </section>

        <section>
          <SearchField
            label="Search the library"
            placeholder="Search conditions…"
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
                    {group}
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
                            {condition.label}
                          </span>
                          <span className="block text-caption text-fg-muted">
                            {condition.short}
                            {condition.secondary ? " · temporary" : ""}
                          </span>
                        </span>
                        {condition.custom ? (
                          <Badge tone="info">Added by clinic</Badge>
                        ) : null}
                        <Switch
                          checked={condition.active}
                          onChange={(on: boolean) =>
                            store.setActive(condition.id, on)
                          }
                          label={`Offer ${condition.label}`}
                        />
                        {condition.custom ? (
                          <Button
                            size="small"
                            variant="danger"
                            appearance="ghost"
                            iconOnly
                            aria-label={`Delete ${condition.label}`}
                            onClick={() => store.remove(condition.id)}
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
