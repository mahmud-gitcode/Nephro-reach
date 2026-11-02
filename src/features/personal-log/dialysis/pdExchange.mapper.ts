/* ==========================================================================
   PD exchanges: wire shapes and transforms (Phase 7)
   --------------------------------------------------------------------------
   `/patients/:id/dialysis/pd-exchanges`. `date` → `exchangeDate`; the start
   time comes from a time input and is already HH:mm (checked here). The
   server computes `ultrafiltrationMl` and `urgentClarity`; those are shown
   rather than worked out again.
   ========================================================================== */

import type {
  DextroseStrength,
  EffluentClarity,
  PdExchange,
  PdExchangeDraft,
} from "./pdExchange";

export type ApiPdExchange = {
  id: string;
  patientId: string;
  exchangeDate: string;
  startTime: string;
  dextrose: DextroseStrength;
  fillMl: number;
  drainMl: number;
  ultrafiltrationMl: number;
  dwellMinutes: number;
  clarity: EffluentClarity;
  urgentClarity: boolean;
  exitSiteOk: boolean;
  notes: string;
  createdById: string | null;
  createdAt: string;
};

export type PdExchangeBody = {
  exchangeDate: string;
  startTime: string;
  dextrose: DextroseStrength;
  fillMl: number;
  drainMl: number;
  dwellMinutes: number;
  clarity: EffluentClarity;
  exitSiteOk: boolean;
  notes?: string;
};

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** "7:05" → "07:05"; throws for anything that is not a 24-hour clock. */
export function toHhMm(value: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  const padded = match ? `${match[1].padStart(2, "0")}:${match[2]}` : "";
  if (!HH_MM.test(padded)) throw new RangeError(`Not HH:mm: ${value}`);
  return padded;
}

export function toPdExchangeBody(draft: PdExchangeDraft): PdExchangeBody {
  const notes = draft.notes.trim();
  return {
    exchangeDate: draft.date,
    startTime: toHhMm(draft.startTime),
    dextrose: draft.dextrose,
    fillMl: Math.round(draft.fillMl),
    drainMl: Math.round(draft.drainMl),
    dwellMinutes: Math.round(draft.dwellMinutes),
    clarity: draft.clarity,
    exitSiteOk: draft.exitSiteOk,
    ...(notes ? { notes: notes.slice(0, 4000) } : {}),
  };
}

/** The server's row, with its ultrafiltration and urgency. */
export type PdExchangeRow = PdExchange & {
  ultrafiltrationMl: number;
  urgentClarity: boolean;
};

export function fromApiPdExchange(raw: ApiPdExchange): PdExchangeRow {
  return {
    id: raw.id,
    date: raw.exchangeDate.slice(0, 10),
    startTime: raw.startTime,
    dextrose: raw.dextrose,
    fillMl: raw.fillMl,
    drainMl: raw.drainMl,
    dwellMinutes: raw.dwellMinutes,
    clarity: raw.clarity,
    exitSiteOk: raw.exitSiteOk,
    notes: raw.notes ?? "",
    savedAt: raw.createdAt,
    ultrafiltrationMl: raw.ultrafiltrationMl,
    urgentClarity: raw.urgentClarity,
  };
}
