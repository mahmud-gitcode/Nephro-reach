import type { DialysisModality } from "./modality";

/* ==========================================================================
   Monthly supply checklist
   --------------------------------------------------------------------------
   A home member runs out of gauze on a Sunday and there is no store room
   down the corridor — so the checklist is not a to-do list, it is a stock
   count. Each line carries what the month needs and what is in the cupboard,
   and the status falls out of the two numbers rather than being a third
   thing to keep in step.

   In-center members get no checklist. The unit holds their stock, and
   showing them an empty cupboard to count would be inventing a chore.

   The catalogue is per modality because the two are not variants of one
   list: a PD member has never held a dialyzer, and a home haemo member has
   no Dianeal.
   ========================================================================== */

export type SupplyStatus = "ok" | "low" | "missing";

export interface SupplyItem {
  id: string;
  labelEn: string;
  labelEs: string;
  /** What a typical month takes. The member can change it. */
  needed: number;
}

export interface SupplyGroup {
  id: string;
  labelEn: string;
  labelEs: string;
  items: SupplyItem[];
}

/** What the member recorded this month, per item id. */
export interface SupplyCount {
  /** How many are in the cupboard. */
  have: number;
  /** Their own figure for the month, when it differs from the default. */
  needed?: number;
  /** Ticked once they have physically looked. */
  checked: boolean;
}

export interface SupplyMonth {
  /** yyyy-mm. One count per calendar month, as the client asked. */
  monthKey: string;
  counts: Record<string, SupplyCount>;
  notes: string;
  updatedAt: string;
}

/* --------------------------------------------------------------------------
   Catalogues
   -------------------------------------------------------------------------- */

const HOME_HD_GROUPS: SupplyGroup[] = [
  {
    id: "treatment",
    labelEn: "Treatment supplies",
    labelEs: "Insumos del tratamiento",
    items: [
      {
        id: "dialyzer",
        labelEn: "Dialyzer / cartridge",
        labelEs: "Dializador / cartucho",
        needed: 20,
      },
      {
        id: "tubing",
        labelEn: "Tubing set",
        labelEs: "Set de tubos",
        needed: 20,
      },
      {
        id: "dialysate",
        labelEn: "Dialysate bags",
        labelEs: "Bolsas de dializado",
        needed: 20,
      },
      { id: "needles", labelEn: "Needles", labelEs: "Agujas", needed: 40 },
      {
        id: "saline",
        labelEn: "Saline / flushes",
        labelEs: "Suero / lavados",
        needed: 20,
      },
      { id: "heparin", labelEn: "Heparin", labelEs: "Heparina", needed: 20 },
    ],
  },
  {
    id: "clean",
    labelEn: "Cleaning & protection",
    labelEs: "Limpieza y protección",
    items: [
      {
        id: "alcohol-wipes",
        labelEn: "Alcohol wipes",
        labelEs: "Toallitas de alcohol",
        needed: 2,
      },
      { id: "masks", labelEn: "Masks", labelEs: "Mascarillas", needed: 30 },
      { id: "gloves", labelEn: "Gloves", labelEs: "Guantes", needed: 60 },
      {
        id: "disinfectant",
        labelEn: "Disinfectant wipes",
        labelEs: "Toallitas desinfectantes",
        needed: 2,
      },
    ],
  },
  {
    id: "machine",
    labelEn: "Machine & water",
    labelEs: "Máquina y agua",
    items: [
      {
        id: "water-filters",
        labelEn: "Water filters",
        labelEs: "Filtros de agua",
        needed: 1,
      },
      {
        id: "sharps",
        labelEn: "Sharps container",
        labelEs: "Contenedor de punzantes",
        needed: 1,
      },
    ],
  },
];

const PD_GROUPS: SupplyGroup[] = [
  {
    id: "solutions",
    labelEn: "PD solutions",
    labelEs: "Soluciones de DP",
    items: [
      {
        id: "dianeal-15",
        labelEn: "1.5% Dianeal",
        labelEs: "Dianeal 1.5%",
        needed: 30,
      },
      {
        id: "dianeal-25",
        labelEn: "2.5% Dianeal",
        labelEs: "Dianeal 2.5%",
        needed: 30,
      },
      {
        id: "dianeal-425",
        labelEn: "4.25% Dianeal",
        labelEs: "Dianeal 4.25%",
        needed: 10,
      },
      {
        id: "icodextrin",
        labelEn: "Icodextrin",
        labelEs: "Icodextrina",
        needed: 7,
      },
    ],
  },
  {
    id: "transfer",
    labelEn: "Transfer sets & tubing",
    labelEs: "Sets de transferencia y tubos",
    items: [
      {
        id: "transfer-set",
        labelEn: "Transfer sets",
        labelEs: "Sets de transferencia",
        needed: 4,
      },
      {
        id: "tubing-set",
        labelEn: "Tubing sets",
        labelEs: "Sets de tubos",
        needed: 8,
      },
      { id: "mini-cap", labelEn: "Mini-cap", labelEs: "Mini-cap", needed: 4 },
      {
        id: "y-set",
        labelEn: "Y-set / extension set",
        labelEs: "Set en Y / extensión",
        needed: 2,
      },
    ],
  },
  {
    id: "exit-site",
    labelEn: "Exit site care",
    labelEs: "Cuidado del sitio de salida",
    items: [
      { id: "pd-masks", labelEn: "Masks", labelEs: "Mascarillas", needed: 30 },
      {
        id: "sterile-gloves",
        labelEn: "Sterile gloves",
        labelEs: "Guantes estériles",
        needed: 60,
      },
      {
        id: "antiseptic",
        labelEn: "Antiseptic solution",
        labelEs: "Solución antiséptica",
        needed: 2,
      },
      { id: "gauze", labelEn: "Gauze pads", labelEs: "Gasas", needed: 60 },
      {
        id: "dressings",
        labelEn: "Tape / dressings",
        labelEs: "Cinta / apósitos",
        needed: 30,
      },
      {
        id: "cleanser",
        labelEn: "Exit site cleanser",
        labelEs: "Limpiador del sitio",
        needed: 2,
      },
    ],
  },
  {
    id: "accessories",
    labelEn: "Accessories",
    labelEs: "Accesorios",
    items: [
      {
        id: "pd-disinfectant",
        labelEn: "Disinfectant wipes",
        labelEs: "Toallitas desinfectantes",
        needed: 2,
      },
      { id: "scale", labelEn: "Scale", labelEs: "Báscula", needed: 1 },
      {
        id: "bp-cuff",
        labelEn: "Blood pressure cuff",
        labelEs: "Tensiómetro",
        needed: 1,
      },
      {
        id: "thermometer",
        labelEn: "Thermometer",
        labelEs: "Termómetro",
        needed: 1,
      },
      {
        id: "pd-sharps",
        labelEn: "Sharps container",
        labelEs: "Contenedor de punzantes",
        needed: 1,
      },
      {
        id: "trash-bags",
        labelEn: "Trash bags",
        labelEs: "Bolsas de basura",
        needed: 1,
      },
    ],
  },
  {
    id: "backup",
    labelEn: "Emergency backup",
    labelEs: "Respaldo de emergencia",
    items: [
      {
        id: "extra-transfer",
        labelEn: "Extra transfer set",
        labelEs: "Set de transferencia extra",
        needed: 1,
      },
      {
        id: "extra-solution",
        labelEn: "Extra PD solution",
        labelEs: "Solución de DP extra",
        needed: 4,
      },
      {
        id: "care-kit",
        labelEn: "Exit site care kit",
        labelEs: "Kit de cuidado del sitio",
        needed: 1,
      },
      {
        id: "ppe",
        labelEn: "Protective items",
        labelEs: "Artículos de protección",
        needed: 1,
      },
    ],
  },
];

/**
 * The checklist for a modality, or none at all.
 *
 * In-center returns an empty list rather than a shared default: their unit
 * keeps the stock, so there is nothing at home for them to count.
 */
export function supplyGroupsFor(modality: DialysisModality): SupplyGroup[] {
  if (modality === "home-hd") return HOME_HD_GROUPS;
  if (modality === "pd") return PD_GROUPS;
  return [];
}

/** Every item of a modality, flattened — for counting, not for display. */
export function supplyItemsFor(modality: DialysisModality): SupplyItem[] {
  return supplyGroupsFor(modality).flatMap((group) => group.items);
}

/* --------------------------------------------------------------------------
   Rules
   -------------------------------------------------------------------------- */

/** What the member is working to this month: their figure, else the default. */
export function neededFor(
  item: SupplyItem,
  count: SupplyCount | undefined,
): number {
  const own = count?.needed;
  return typeof own === "number" && Number.isFinite(own) && own >= 0
    ? own
    : item.needed;
}

/**
 * Where an item stands.
 *
 * "Missing" is kept apart from "low" on purpose: none left is a phone call
 * today, while fewer than planned is an order this week. Collapsing them
 * into one warning is how a member ends up with no solution on a Sunday.
 */
export function supplyStatus(
  item: SupplyItem,
  count: SupplyCount | undefined,
): SupplyStatus {
  const needed = neededFor(item, count);
  const have = count?.have ?? 0;

  if (needed <= 0) return "ok";
  if (have <= 0) return "missing";
  return have < needed ? "low" : "ok";
}

export function statusLabel(status: SupplyStatus, isEs: boolean): string {
  if (status === "missing") return isEs ? "Falta" : "Missing";
  if (status === "low") return isEs ? "Bajo" : "Low";
  return isEs ? "Bien" : "OK";
}

export interface SupplySummary {
  checked: number;
  total: number;
  low: number;
  missing: number;
  /** True when nothing is low and nothing is missing. */
  stocked: boolean;
}

export function summarise(
  modality: DialysisModality,
  counts: Record<string, SupplyCount>,
): SupplySummary {
  const items = supplyItemsFor(modality);
  let checked = 0;
  let low = 0;
  let missing = 0;

  for (const item of items) {
    const count = counts[item.id];
    if (count?.checked) checked += 1;

    const status = supplyStatus(item, count);
    if (status === "low") low += 1;
    else if (status === "missing") missing += 1;
  }

  return {
    checked,
    total: items.length,
    low,
    missing,
    stocked: low === 0 && missing === 0,
  };
}

/** yyyy-mm for a date, which is how a month's count is keyed. */
export function monthKeyOf(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

export function emptyMonth(monthKey: string): SupplyMonth {
  return {
    monthKey,
    counts: {},
    notes: "",
    updatedAt: new Date().toISOString(),
  };
}

/** Read a stored month back, dropping anything that is not a usable count. */
export function normaliseMonth(stored: unknown, monthKey: string): SupplyMonth {
  const base = emptyMonth(monthKey);
  if (!stored || typeof stored !== "object") return base;

  const raw = stored as Partial<SupplyMonth>;
  const counts: Record<string, SupplyCount> = {};

  if (raw.counts && typeof raw.counts === "object") {
    for (const [id, value] of Object.entries(raw.counts)) {
      if (!value || typeof value !== "object") continue;
      const entry = value as Partial<SupplyCount>;
      counts[id] = {
        have: Number.isFinite(entry.have) ? Number(entry.have) : 0,
        needed: Number.isFinite(entry.needed)
          ? Number(entry.needed)
          : undefined,
        checked: entry.checked === true,
      };
    }
  }

  return {
    monthKey: typeof raw.monthKey === "string" ? raw.monthKey : monthKey,
    counts,
    notes: typeof raw.notes === "string" ? raw.notes : "",
    updatedAt:
      typeof raw.updatedAt === "string" ? raw.updatedAt : base.updatedAt,
  };
}
