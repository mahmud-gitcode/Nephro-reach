/* ==========================================================================
   Dialysis treatment intervals — the shapes
   --------------------------------------------------------------------------
   An interval is the span between two treatments; a record is what the
   member logged inside one. Both were declared inside the page that drew
   them, which meant nothing else could refer to them by name.
   ========================================================================== */

import type { TreatmentStatus } from "./schedule";

export interface TreatmentInterval {
  id: string;
  name: string; // e.g. "Between Treatment 2"
  label: string; // e.g. "Treatment 2 ➔ Treatment 3"
  startDate: string;
  endDate: string;
  previousTxPostWeight: number;
  previousTxPostBp: string;
  targetDryWeight: number;
}

export interface IntervalRecord {
  id: string;
  intervalId: string;
  date: string;
  dayLabel: string;
  morningWeight?: number;
  fluidGainedKg?: number;
  homeBp?: string;
  pulse?: number;
  fluidOz?: number;
  symptoms?: string[];
  notes?: string;
  isExtraTreatment?: boolean;
  extraTreatmentNumber?: string; // e.g. "2.1"
  extraReason?: string;
}

export interface TreatmentCardItem {
  id: string;
  intervalId: string;
  orderKey: number;
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  startKey: string; // yyyy-mm-dd
  endKey: string;
  status: TreatmentStatus;
  isExtra?: boolean;
  extraReason?: string;
  notes?: string;
}
