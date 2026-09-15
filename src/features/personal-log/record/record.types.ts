/* ==========================================================================
   One treatment record, as viewed
   --------------------------------------------------------------------------
   What a provider ordered, what the member felt, and the interval the
   record belongs to. Declared inside the page that drew them until now,
   which meant nothing else could name them.
   ========================================================================== */

export interface ProviderOrder {
  id: string;
  date: string;
  order: string;
  completed: boolean;
}

export interface LoggedSymptomEntry {
  id: string;
  date: string;
  dayLabel: string;
  symptoms: string[];
  severity: "Mild" | "Moderate" | "Severe";
  recoveryTime?: string;
  notes: string;
}

export interface TreatmentIntervalMeta {
  id: string;
  name: string;
  label: string;
  startDate: string;
  endDate: string;
  orders: ProviderOrder[];
  symptomEntries: LoggedSymptomEntry[];
  isExtra?: boolean;
  clinicalReason?: string;
  additionalNotes?: string;
}
