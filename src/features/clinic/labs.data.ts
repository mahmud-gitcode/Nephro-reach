/* ==========================================================================
   Clinic labs: the CSV template the office downloads
   --------------------------------------------------------------------------
   The client (2026-10-01): the dialysis center's administrator can upload
   labs by CSV to patient charts; nurses and the dietitian read them.

   Phase 9: the file goes to the API as text and the SERVER reads it (one
   parser, the server's): it matches each row to a linked patient, flags
   duplicates and refused rows, and imports only what staff confirm
   (labImports.repository.ts). Nothing is parsed, matched, overwritten or
   stored in the browser any more; the demo charts are gone.

     mrn,date,test,value,unit,reference
     123456,2026-09-28,Potassium,5.6,mEq/L,3.5-5.0
   ========================================================================== */

export const LAB_CSV_COLUMNS = [
  "mrn",
  "date",
  "test",
  "value",
  "unit",
  "reference",
] as const;

/* Synthetic example rows only (a made-up MRN). */
export const LAB_CSV_TEMPLATE =
  `${LAB_CSV_COLUMNS.join(",")}\n` +
  "123456,2026-09-28,Potassium,5.6,mEq/L,3.5-5.0\n" +
  "123456,2026-09-28,Phosphorus,6.1,mg/dL,2.5-4.5\n";

/** For one patient chosen first: no MRN column needed. */
export const PATIENT_CSV_TEMPLATE =
  "date,test,value,unit,reference\n" +
  "2026-09-28,Potassium,5.6,mEq/L,3.5-5.0\n" +
  "2026-09-28,Phosphorus,6.1,mg/dL,2.5-4.5\n";

/** The columns a file needs, for the upload hint. */
export function csvColumns(forOnePatient: boolean): string[] {
  return LAB_CSV_COLUMNS.filter((c) => !forOnePatient || c !== "mrn");
}
