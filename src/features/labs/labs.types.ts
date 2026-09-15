/* ==========================================================================
   Lab results the member entered themselves
   --------------------------------------------------------------------------
   One draw, as typed from a paper report: a date, a value per test, and the
   member's own notes. The values map is keyed by test name and every value
   is a string, because that is what was on the page — parsing happens where
   it is displayed, not on the way in, so nothing is silently lost.
   ========================================================================== */

export interface CustomLabResult {
  date?: string;
  values?: Record<string, string>;
  notes?: string;
}
