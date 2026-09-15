/* ==========================================================================
   Weight and fluid log — the shape of one entry
   --------------------------------------------------------------------------
   A dialysis member weighs themselves morning and evening, records what they
   drank and passed, and notes the symptoms that go with it. Every field here
   is a string because it is transcribed from a home scale and a jug, not
   computed — parsing happens where a number is needed.
   ========================================================================== */

export interface WeightFluidEntry {
  id: string;
  dateEn: string;
  dateEs: string;
  morning: string;
  evening: string;
  uo: string;
  intake: string;
  goal: string;
  swelling: string;
  sob: string;
  weakness: string;
  notes: string;
  noteKey: string | null;
  rapidGain?: string;
  dizziness?: string;
  cramping?: string;
  nausea?: string;
  fluidStatus?: "Above EDW" | "Near EDW" | "Below EDW";
  fluidStatusMsg?: string;
}
