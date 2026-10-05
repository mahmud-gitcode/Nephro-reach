/* ==========================================================================
   Clinic labs — patient lab charts, and the CSV import
   --------------------------------------------------------------------------
   The client (2026-10-01): the dialysis center's administrator can upload
   labs by CSV to patient charts; nurses and the dietitian read them.

   One row per result. The CSV carries the MRN, so a file from the lab
   system can hold many patients; a row whose MRN is not on the clinic's
   roster is refused and reported, never guessed at.

     mrn,date,test,value,unit,reference
     123456,2026-09-28,Potassium,5.6,mEq/L,3.5-5.0

   Pure: state in, state out. Storage lives in useClinicLabs.ts.
   ========================================================================== */

export type LabResult = {
  id: string;
  mrn: string;
  /** YYYY-MM-DD, the draw date. */
  date: string;
  test: string;
  value: string;
  unit: string;
  /** "3.5-5.0", as the lab printed it. May be empty. */
  reference: string;
  /** ISO 8601 */
  uploadedAt: string;
  uploadedBy: string;
};

export type LabsState = { results: LabResult[] };

export const LAB_CSV_COLUMNS = [
  "mrn",
  "date",
  "test",
  "value",
  "unit",
  "reference",
] as const;

export const LAB_CSV_TEMPLATE =
  `${LAB_CSV_COLUMNS.join(",")}\n` +
  "123456,2026-09-28,Potassium,5.6,mEq/L,3.5-5.0\n" +
  "123456,2026-09-28,Phosphorus,6.1,mg/dL,2.5-4.5\n";

export type LabRow = Omit<LabResult, "id" | "uploadedAt" | "uploadedBy">;

export type ParsedLabs = {
  rows: LabRow[];
  /** One per refused line, with the line number as the file counts it. */
  errors: Array<{ line: number; message: string }>;
};

/** Splits one CSV line, honouring double quotes ("a, b" stays one cell). */
function cells(line: string): string[] {
  const out: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      out.push(cell.trim());
      cell = "";
    } else cell += ch;
  }
  out.push(cell.trim());
  return out;
}

/** "9/28/2026" or "2026-09-28" → "2026-09-28"; anything else → null. */
export function normalDate(value: string): string | null {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  const [y, m, d] = iso
    ? [iso[1], iso[2], iso[3]]
    : us
      ? [us[3], us[1], us[2]]
      : [];
  if (!y || !m || !d) return null;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) {
    return null;
  }
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/**
 * Reads a lab CSV. The header row names the columns, in any order; mrn,
 * date, test and value are required. Rows for patients not on the roster,
 * or with a bad date or a blank value, are refused with a reason.
 */
export function parseLabCsv(text: string, knownMrns: string[]): ParsedLabs {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const headerAt = lines.findIndex((line) => line.trim() !== "");
  if (headerAt === -1) {
    return { rows: [], errors: [{ line: 1, message: "The file is empty." }] };
  }
  const header = cells(lines[headerAt]).map((h) => h.toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const missing = ["mrn", "date", "test", "value"].filter(
    (name) => col(name) === -1,
  );
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        {
          line: headerAt + 1,
          message: `The header is missing: ${missing.join(", ")}.`,
        },
      ],
    };
  }

  const known = new Set(knownMrns);
  const rows: LabRow[] = [];
  const errors: ParsedLabs["errors"] = [];
  lines.slice(headerAt + 1).forEach((line, i) => {
    if (line.trim() === "") return;
    const lineNo = headerAt + i + 2;
    const c = cells(line);
    const get = (name: string) =>
      col(name) === -1 ? "" : (c[col(name)] ?? "");
    const mrn = get("mrn");
    const date = normalDate(get("date"));
    const test = get("test");
    const value = get("value");
    if (!known.has(mrn)) {
      errors.push({
        line: lineNo,
        message: `MRN "${mrn}" is not a clinic patient.`,
      });
    } else if (!date) {
      errors.push({ line: lineNo, message: `"${get("date")}" is not a date.` });
    } else if (!test || !value) {
      errors.push({
        line: lineNo,
        message: "The test name and value are required.",
      });
    } else {
      rows.push({
        mrn,
        date,
        test,
        value,
        unit: get("unit"),
        reference: get("reference"),
      });
    }
  });
  return { rows, errors };
}

/** Same patient, test and draw date: the newer upload replaces the older. */
function sameResult(a: LabRow, b: LabRow) {
  return (
    a.mrn === b.mrn &&
    a.date === b.date &&
    a.test.toLowerCase() === b.test.toLowerCase()
  );
}

export function importLabs(
  state: LabsState,
  rows: LabRow[],
  by: string,
  now: number,
): LabsState {
  const at = new Date(now).toISOString();
  const incoming: LabResult[] = rows.map((row, i) => ({
    ...row,
    id: `lab-${now}-${i}`,
    uploadedAt: at,
    uploadedBy: by,
  }));
  return {
    results: [
      ...state.results.filter(
        (old) => !incoming.some((row) => sameResult(old, row)),
      ),
      ...incoming,
    ],
  };
}

/** A patient's chart, newest draw first, then by test name. */
export function labsFor(state: LabsState, mrn: string): LabResult[] {
  return state.results
    .filter((r) => r.mrn === mrn)
    .sort(
      (a, b) => b.date.localeCompare(a.date) || a.test.localeCompare(b.test),
    );
}

/** Outside the printed range: "High", "Low", or null when in range or
 *  the range cannot be read. */
export function labFlag(result: Pick<LabResult, "value" | "reference">) {
  const range = /^\s*([\d.]+)\s*-\s*([\d.]+)\s*$/.exec(result.reference);
  const value = Number(result.value);
  if (!range || Number.isNaN(value)) return null;
  if (value > Number(range[2])) return "High" as const;
  if (value < Number(range[1])) return "Low" as const;
  return null;
}

export function seedLabs(now: number): LabsState {
  const day = (offset: number) => {
    const d = new Date(now + offset * 86_400_000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const rows: LabRow[] = [
    ["123456", day(-5), "Potassium", "5.6", "mEq/L", "3.5-5.0"],
    ["123456", day(-5), "Phosphorus", "6.1", "mg/dL", "2.5-4.5"],
    ["123456", day(-5), "Albumin", "3.9", "g/dL", "3.5-5.0"],
    ["123456", day(-5), "Hemoglobin", "10.4", "g/dL", "10.0-12.0"],
    ["789012", day(-12), "Potassium", "4.4", "mEq/L", "3.5-5.0"],
    ["789012", day(-12), "Kt/V", "1.3", "", "1.2-2.0"],
    ["901234", day(-3), "Phosphorus", "5.2", "mg/dL", "2.5-4.5"],
    ["901234", day(-3), "Albumin", "3.3", "g/dL", "3.5-5.0"],
    /* The demo patient, so their My Labs shows what the clinic uploaded. */
    ["223344", day(-6), "Potassium", "4.7", "mEq/L", "3.5-5.0"],
    ["223344", day(-6), "Phosphorus", "5.4", "mg/dL", "2.5-4.5"],
    ["223344", day(-6), "Albumin", "3.8", "g/dL", "3.5-5.0"],
    ["223344", day(-6), "Hemoglobin", "10.9", "g/dL", "10.0-12.0"],
  ].map(([mrn, date, test, value, unit, reference]) => ({
    mrn,
    date,
    test,
    value,
    unit,
    reference,
  }));
  return importLabs({ results: [] }, rows, "Lab interface", now - 86_400_000);
}
