import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import type { ProviderOrder } from "../record/record.types";

/* ==========================================================================
   Provider orders — storage
   --------------------------------------------------------------------------
   Orders used to live in per-interval component state seeded from demo data,
   which meant ticking one off was forgotten on the next render and an order
   belonged to a numbered gap between treatments rather than to the member.

   They belong to Dialysis Management now: an instruction from a provider is
   something planned and prescribed, not something that happened in a chair.
   ========================================================================== */

const KEY = storageKey("provider-orders");

export async function listOrders(): Promise<ProviderOrder[]> {
  const stored = await readJson<ProviderOrder[] | null>(KEY, null);
  return Array.isArray(stored) ? stored : [];
}

export async function saveOrders(
  orders: ProviderOrder[],
): Promise<ProviderOrder[]> {
  return writeJson(KEY, orders);
}
