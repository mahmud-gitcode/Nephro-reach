/* ==========================================================================
   Home dialysis: wire shapes and transforms (Phase 7)
   --------------------------------------------------------------------------
   The member's own home-dialysis records (backend module home-dialysis,
   routes `/patients/:id/dialysis/...`): the home system and its checks,
   equipment events, home visits, supply months, provider orders and
   access photos. All date and time transforms live here.

   Time zones: a provider order's reminder is typed as a local wall-clock
   time ("2026-11-03T08:00"). It is sent as an ISO instant with an offset
   (`toISOString`, the browser's zone) and shown back in the browser's zone.
   The browser zone is used rather than the profile's `timeZone` because the
   reminder fires in the browser that shows it; a member who sets a time
   sees that same time again.
   ========================================================================== */

import type { ProviderOrder } from "../record/record.types";
import type { AccessPhoto, PhotoSubject } from "./accessPhotos";
import type { DueState, HomeSystem, MachineType, SystemCheck } from "./homeHd";
import type { HomeVisit, HomeVisitDraft } from "./homeVisits";
import type { SupplyCount, SupplyMonth } from "./supplies";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const day = (value: string | null | undefined) =>
  value && DAY.test(value.slice(0, 10)) ? value.slice(0, 10) : "";
const dayOrNull = (value: string) => (DAY.test(value) ? value : null);

/* Home system ------------------------------------------------------------- */

export type ApiSystemCheck = {
  id: "disinfection" | "filter";
  lastDoneOn: string | null;
  dueOn: string | null;
  state: DueState;
};

export type ApiHomeSystem = {
  patientId: string;
  machine: MachineType;
  serial: string;
  lastDisinfectionOn: string | null;
  lastFilterChangeOn: string | null;
  filterIntervalDays: number;
  disinfectionIntervalDays: number;
  updatedById: string | null;
  updatedAt: string;
  checks?: ApiSystemCheck[];
  needsAttention?: boolean;
};

export type HomeSystemBody = {
  machine: MachineType;
  serial: string;
  lastDisinfectionOn: string | null;
  lastFilterChangeOn: string | null;
  filterIntervalDays: number;
  disinfectionIntervalDays: number;
};

export function fromApiHomeSystem(raw: ApiHomeSystem): HomeSystem {
  return {
    machine: raw.machine,
    serial: raw.serial ?? "",
    lastDisinfection: day(raw.lastDisinfectionOn),
    lastFilterChange: day(raw.lastFilterChangeOn),
    filterIntervalDays: raw.filterIntervalDays,
    disinfectionIntervalDays: raw.disinfectionIntervalDays,
    updatedAt: raw.updatedAt,
  };
}

/** The server's checks in the UI's shape (dueIso "" when unknown). */
export function fromApiChecks(
  raw: ApiSystemCheck[] | undefined,
): SystemCheck[] {
  return (raw ?? []).map((check) => ({
    id: check.id,
    dueIso: day(check.dueOn),
    state: check.state,
  }));
}

const clampDays = (n: number) => Math.min(365, Math.max(1, Math.round(n)));

export function toHomeSystemBody(system: HomeSystem): HomeSystemBody {
  return {
    machine: system.machine,
    serial: system.serial.trim().slice(0, 100),
    lastDisinfectionOn: dayOrNull(system.lastDisinfection),
    lastFilterChangeOn: dayOrNull(system.lastFilterChange),
    filterIntervalDays: clampDays(system.filterIntervalDays),
    disinfectionIntervalDays: clampDays(system.disinfectionIntervalDays),
  };
}

/* Equipment events -------------------------------------------------------- */

export const EQUIPMENT_EVENT_KINDS = [
  "disinfection",
  "filter-change",
  "service",
  "alarm",
] as const;
export type EquipmentEventKind = (typeof EQUIPMENT_EVENT_KINDS)[number];

export type ApiEquipmentEvent = {
  id: string;
  patientId: string;
  kind: EquipmentEventKind;
  performedOn: string;
  notes: string;
  createdById: string | null;
  createdAt: string;
};

export type EquipmentEvent = {
  id: string;
  kind: EquipmentEventKind;
  /** YYYY-MM-DD. */
  performedOn: string;
  notes: string;
};

export type EquipmentEventBody = {
  kind: EquipmentEventKind;
  performedOn: string;
  notes?: string;
};

export function fromApiEquipmentEvent(raw: ApiEquipmentEvent): EquipmentEvent {
  return {
    id: raw.id,
    kind: raw.kind,
    performedOn: day(raw.performedOn),
    notes: raw.notes ?? "",
  };
}

export function toEquipmentEventBody(draft: {
  kind: EquipmentEventKind;
  performedOn: string;
  notes: string;
}): EquipmentEventBody {
  if (!DAY.test(draft.performedOn))
    throw new RangeError(`Not a day: ${draft.performedOn}`);
  const notes = draft.notes.trim();
  return {
    kind: draft.kind,
    performedOn: draft.performedOn,
    ...(notes ? { notes: notes.slice(0, 1000) } : {}),
  };
}

/* Home visits ------------------------------------------------------------- */

export type ApiHomeVisit = {
  id: string;
  patientId: string;
  visitDate: string;
  time: string;
  provider: HomeVisit["provider"];
  purpose: string;
  status: HomeVisit["status"];
  remind: boolean;
  modality: "home-hd" | "pd" | null;
  notes: string;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HomeVisitBody = {
  visitDate: string;
  time: string;
  provider: HomeVisit["provider"];
  purpose: string;
  status: HomeVisit["status"];
  remind: boolean;
  modality?: "home-hd" | "pd";
  notes: string;
};

export function fromApiHomeVisit(raw: ApiHomeVisit): HomeVisit {
  return {
    id: raw.id,
    date: day(raw.visitDate),
    time: raw.time ?? "",
    provider: raw.provider,
    purpose: raw.purpose ?? "",
    status: raw.status,
    remind: raw.remind,
    notes: raw.notes ?? "",
    ...(raw.modality ? { modality: raw.modality } : {}),
  };
}

const OPTIONAL_HH_MM = /^$|^([01]\d|2[0-3]):[0-5]\d$/;

export function toHomeVisitBody(draft: HomeVisitDraft): HomeVisitBody {
  if (!DAY.test(draft.date)) throw new RangeError(`Not a day: ${draft.date}`);
  const time = draft.time.trim();
  if (!OPTIONAL_HH_MM.test(time)) throw new RangeError(`Not HH:mm: ${time}`);
  return {
    visitDate: draft.date,
    time,
    provider: draft.provider,
    purpose: draft.purpose.trim().slice(0, 300),
    status: draft.status,
    remind: draft.remind,
    ...(draft.modality ? { modality: draft.modality } : {}),
    notes: draft.notes.trim().slice(0, 1000),
  };
}

/* Supply months ----------------------------------------------------------- */

export type ApiSupplyMonth = {
  patientId: string;
  monthKey: string;
  counts: Record<string, SupplyCount>;
  notes: string;
  updatedById: string | null;
  updatedAt: string;
};

export type SupplyMonthBody = {
  counts: Record<string, SupplyCount>;
  notes: string;
};

const quantity = (n: unknown) =>
  typeof n === "number" && Number.isFinite(n)
    ? Math.min(9999, Math.max(0, Math.round(n)))
    : 0;

export function fromApiSupplyMonth(raw: ApiSupplyMonth): SupplyMonth {
  return {
    monthKey: raw.monthKey,
    counts: { ...(raw.counts ?? {}) },
    notes: raw.notes ?? "",
    updatedAt: raw.updatedAt,
  };
}

/** The PUT body (it replaces the month). Each count keeps only the three
 *  fields the server accepts, as whole numbers 0–9999. */
export function toSupplyMonthBody(month: SupplyMonth): SupplyMonthBody {
  const counts: Record<string, SupplyCount> = {};
  for (const [id, count] of Object.entries(month.counts)) {
    counts[id] = {
      have: quantity(count.have),
      ...(count.needed === undefined ? {} : { needed: quantity(count.needed) }),
      checked: count.checked === true,
    };
  }
  return { counts, notes: month.notes.slice(0, 2000) };
}

/* Provider orders --------------------------------------------------------- */

export type ApiProviderOrder = {
  id: string;
  patientId: string;
  orderDate: string;
  order: string;
  completed: boolean;
  remindAt: string | null;
  reminderDoneAt: string | null;
  reminderDone: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProviderOrderBody = {
  orderDate?: string;
  order?: string;
  completed?: boolean;
  remindAt?: string | null;
  reminderDone?: boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** "yyyy-mm-ddTHH:MM" in the browser's zone for an instant. */
export function localStamp(at: Date): string {
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

const LOCAL_STAMP = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/;

/** A local "yyyy-mm-ddTHH:MM" as an ISO instant with an offset ("Z"). */
export function toZonedInstant(local: string): string {
  if (!LOCAL_STAMP.test(local))
    throw new RangeError(`Not a local time: ${local}`);
  const at = new Date(local);
  if (Number.isNaN(at.getTime())) throw new RangeError(`Not a time: ${local}`);
  return at.toISOString();
}

export function fromApiProviderOrder(raw: ApiProviderOrder): ProviderOrder {
  return {
    id: raw.id,
    date: day(raw.orderDate),
    order: raw.order,
    completed: raw.completed,
    ...(raw.remindAt ? { remindAt: localStamp(new Date(raw.remindAt)) } : {}),
    ...(raw.reminderDone ? { reminderDone: true } : {}),
  };
}

/** The server's limit on an order's text (CreateProviderOrderDto). The
 *  form stops typing there, so the slice below never cuts what the member
 *  wrote without telling them (P16b QA round 2 crawl). */
export const PROVIDER_ORDER_MAX_LENGTH = 2000;

export function toProviderOrderBody(draft: {
  date: string;
  order: string;
  completed?: boolean;
  remindAt?: string;
}): ProviderOrderBody {
  if (!DAY.test(draft.date)) throw new RangeError(`Not a day: ${draft.date}`);
  return {
    orderDate: draft.date,
    order: draft.order.trim().slice(0, PROVIDER_ORDER_MAX_LENGTH),
    ...(draft.completed === undefined ? {} : { completed: draft.completed }),
    ...(draft.remindAt ? { remindAt: toZonedInstant(draft.remindAt) } : {}),
  };
}

/* Access photos ----------------------------------------------------------- */

export type ApiAccessPhoto = {
  id: string;
  patientId: string;
  subject: PhotoSubject;
  note: string;
  takenAt: string;
  sentAt: string | null;
  sent: boolean;
  createdById: string | null;
  createdAt: string;
};

export type AccessPhotoBody = {
  fileId: string;
  subject: PhotoSubject;
  note?: string;
  takenAt: string;
};

export function fromApiAccessPhoto(raw: ApiAccessPhoto): AccessPhoto {
  return {
    id: raw.id,
    subject: raw.subject,
    note: raw.note ?? "",
    takenAt: raw.takenAt,
    sent: raw.sent,
  };
}

export function toAccessPhotoBody(
  fileId: string,
  subject: PhotoSubject,
  note: string,
  takenAt: Date = new Date(),
): AccessPhotoBody {
  const trimmed = note.trim();
  return {
    fileId,
    subject,
    ...(trimmed ? { note: trimmed.slice(0, 500) } : {}),
    /* An instant with an offset, as the server requires. */
    takenAt: takenAt.toISOString(),
  };
}
