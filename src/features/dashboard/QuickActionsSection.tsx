"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Apple,
  CalendarClock,
  ClipboardCheck,
  Droplet,
  FlaskConical,
  HeartPulse,
  Library,
  MessageSquareText,
  Pill,
  SlidersHorizontal,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Chip, ChipGroup, Modal } from "@/components/ui";
import { LocalSvg } from "@/components/icons/LocalSvg";
import {
  DEFAULT_QUICK_ACTIONS,
  MAX_QUICK_ACTIONS,
  QUICK_ACTIONS,
  readQuickActions,
  toggleChoice,
  writeQuickActions,
  type QuickActionId,
} from "./quickActions";

/* ==========================================================================
   Quick Actions — the member's top four, chosen by them (client, 2026-10-05)
   ========================================================================== */

const asset = (name: string) => `/images/user-dashboard/${name}`;

/* The four originals keep their drawn icons; the rest use line icons. */
const SVG: Partial<Record<QuickActionId, string>> = {
  rides: "quick-car.svg",
  classroom: "quick-book.svg",
  community: "quick-messages.svg",
  "before-the-er": "quick-info.svg",
};

const LUCIDE: Partial<Record<QuickActionId, typeof Activity>> = {
  messages: MessageSquareText,
  medications: Pill,
  "blood-pressure": HeartPulse,
  fluid: Droplet,
  nutrition: Apple,
  appointments: CalendarClock,
  labs: FlaskConical,
  "vascular-access": Activity,
  library: Library,
  "check-in": ClipboardCheck,
};

/* Category tints, one per slot. */
const TONES = [
  "bg-cat-6-soft",
  "bg-cat-7-soft",
  "bg-cat-4-soft",
  "bg-cat-1-soft",
];

const quickActionsKey = ["dashboard", "quick-actions"] as const;

export function QuickActionsSection({
  isEs,
  title,
}: {
  isEs: boolean;
  title: string;
}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: quickActionsKey,
    queryFn: readQuickActions,
  });
  const write = useMutation({
    mutationFn: writeQuickActions,
    onSuccess: (ids) => queryClient.setQueryData(quickActionsKey, ids),
  });
  const chosen = query.data ?? DEFAULT_QUICK_ACTIONS;
  const [draft, setDraft] = useState<QuickActionId[] | null>(null);

  const actions = chosen
    .map((id) => QUICK_ACTIONS.find((a) => a.id === id))
    .filter((a): a is (typeof QUICK_ACTIONS)[number] => !!a);

  return (
    <section className="space-y-stack-md">
      {/* "Customize" beside the heading at every width; on a phone it
          had dropped to a line of its own (client review, 2026-10-08). */}
      <div className="flex items-center justify-between gap-inline-md">
        <h2 className="text-heading-4 text-fg">{title}</h2>
        <Button
          size="small"
          variant="neutral"
          appearance="ghost"
          leadingIcon={<SlidersHorizontal aria-hidden="true" />}
          onClick={() => setDraft(chosen)}
        >
          {isEs ? "Personalizar" : "Customize"}
        </Button>
      </div>
      {/* Two across on a phone: one per row made four tall cards fill the
          whole screen. */}
      <div className="grid grid-cols-2 gap-inset-sm sm:gap-inset-md xl:grid-cols-4">
        {actions.map((action, index) => {
          const svg = SVG[action.id];
          const Glyph = LUCIDE[action.id];
          return (
            <Link
              key={action.id}
              href={action.href}
              className="flex min-h-[112px] flex-col gap-inline-md rounded-card border border-line bg-surface p-inset-md transition-colors duration-150 ease-standard hover:border-line-strong hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:min-h-[134px] sm:gap-inline-lg sm:p-inset-lg"
            >
              <span
                aria-hidden="true"
                className={`flex size-12 items-center justify-center rounded-card ${TONES[index % TONES.length]}`}
              >
                {svg ? (
                  <span className="relative block size-6 overflow-clip">
                    <LocalSvg src={asset(svg)} alt="" className="size-full" />
                  </span>
                ) : Glyph ? (
                  <Glyph className="size-6 text-fg" />
                ) : null}
              </span>
              <p className="text-body-md text-fg">
                {isEs ? action.es : action.en}
              </p>
            </Link>
          );
        })}
      </div>

      {draft ? (
        <Modal
          open
          onClose={() => setDraft(null)}
          title={isEs ? "Mis Acciones Rápidas" : "My Quick Actions"}
          description={
            isEs
              ? `Elija hasta ${MAX_QUICK_ACTIONS}, en el orden en que quiere verlas.`
              : `Pick up to ${MAX_QUICK_ACTIONS}, in the order you want to see them.`
          }
          footer={
            <>
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setDraft(DEFAULT_QUICK_ACTIONS)}
                className="mr-auto"
              >
                {isEs ? "Restablecer" : "Reset"}
              </Button>
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setDraft(null)}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                disabled={draft.length === 0}
                loading={write.isPending}
                onClick={() => {
                  write.mutate(draft);
                  setDraft(null);
                }}
              >
                {isEs ? "Guardar" : "Save"}
              </Button>
            </>
          }
        >
          <p
            className="mb-stack-sm text-caption text-fg-muted"
            aria-live="polite"
          >
            {isEs
              ? `${draft.length} de ${MAX_QUICK_ACTIONS} elegidas`
              : `${draft.length} of ${MAX_QUICK_ACTIONS} chosen`}
          </p>
          <ChipGroup
            label={isEs ? "Acciones rápidas" : "Quick actions"}
            selection="multiple"
          >
            {QUICK_ACTIONS.map((action) => {
              const on = draft.includes(action.id);
              return (
                <Chip
                  key={action.id}
                  selected={on}
                  disabled={!on && draft.length >= MAX_QUICK_ACTIONS}
                  onClick={() => setDraft(toggleChoice(draft, action.id))}
                >
                  {on ? `${draft.indexOf(action.id) + 1}. ` : ""}
                  {isEs ? action.es : action.en}
                </Chip>
              );
            })}
          </ChipGroup>
        </Modal>
      ) : null}
    </section>
  );
}
