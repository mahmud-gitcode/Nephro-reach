/* ==========================================================================
   Office lab CSV import on the API (Phase 9; ADR 0007 §1)
   --------------------------------------------------------------------------
   One function per server operation under /organizations/{orgId}/lab-imports.
   The CSV goes up as TEXT in a JSON body ({ fileName, csv, patientId? }),
   never as a file upload: the server parses it (one parser, the server's),
   stages every row with a status and imports nothing until staff confirm.

   - MATCHED rows are imported on confirm; nothing else ever is.
   - DUPLICATE rows are already on the chart: the server never overwrites
     (INT-12); there is no client overwrite either.
   - UNMATCHED rows stay read-only: no manual re-match (no route sets it).
   - Cancel closes a batch that was never confirmed.
   The file text lives only in the upload modal's state and is cleared when
   it closes; it is never stored in the browser.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type Page } from "@/lib/api/paging";
import { asOffice, officePath } from "./officeContext";

/** The server's cap on CSV text (labs.constants LAB_IMPORT_MAX_CSV_LENGTH). */
export const LAB_IMPORT_MAX_CSV_CHARS = 1_000_000;
/** The server's cap on the file name (LAB_FIELD_MAX.fileName). */
export const LAB_IMPORT_MAX_FILE_NAME = 255;

export const LAB_IMPORT_ROW_STATUSES = [
  "MATCHED",
  "UNMATCHED",
  "NOT_OPTED_IN",
  "INVALID",
  "DUPLICATE",
  "EXCLUDED",
  "IMPORTED",
] as const;
export type LabImportRowStatus = (typeof LAB_IMPORT_ROW_STATUSES)[number];

export type LabImportStatus =
  "PENDING_REVIEW" | "IMPORTED" | "CANCELLED" | "FAILED";

/** LabImportBatchResponseDto. */
export type LabImportBatch = {
  id: string;
  organizationId: string;
  fileName: string;
  status: LabImportStatus;
  totalRows: number;
  matchedRows: number;
  unmatchedRows: number;
  invalidRows: number;
  duplicateRows: number;
  importedRows: number;
  uploadedById: string;
  confirmedById: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LabImportRowCounts = {
  matched: number;
  unmatched: number;
  notOptedIn: number;
  invalid: number;
  duplicate: number;
  excluded: number;
  imported: number;
};

/** GetLabImportResponseDto: the batch with its counts per row status. */
export type LabImportDetail = LabImportBatch & {
  rowCounts: LabImportRowCounts;
};

/** ListLabImportRowsResponseDto. `data` is null for an unreadable row. */
export type LabImportRow = {
  id: string;
  /** The record's position in the file; the header is 1. */
  rowNumber: number;
  status: LabImportRowStatus;
  patientId: string | null;
  matchedBy: string | null;
  message: string | null;
  data: {
    mrn: string;
    patientId: string;
    date: string;
    collectedOn: string | null;
    test: string;
    testCode: string;
    value: string;
    unit: string;
    reference: string;
    flag: string;
  } | null;
};

export type UploadDraft = {
  fileName: string;
  csv: string;
  /** Only when staff chose one patient first (the file may lack an MRN). */
  patientId?: string;
};

/** Why an upload cannot be sent, or null. The server checks again. */
export function uploadDraftError(draft: UploadDraft): string | null {
  if (!draft.fileName.trim()) return "Choose a CSV file.";
  if (draft.fileName.length > LAB_IMPORT_MAX_FILE_NAME)
    return "The file name is too long. Rename the file and try again.";
  if (!draft.csv.trim()) return "The file is empty.";
  if (draft.csv.length > LAB_IMPORT_MAX_CSV_CHARS)
    return "The file is too large. Split it into smaller files of up to 1,000,000 characters.";
  return null;
}

const imports = (orgId: string, rest = "") =>
  officePath(orgId, `/lab-imports${rest}`);
const batchPath = (orgId: string, batchId: string, rest = "") =>
  imports(orgId, `/${encodeURIComponent(batchId)}${rest}`);

/** POST the CSV text; the server stages every row. Refuses an invalid
 *  draft before any request is made. */
export async function uploadImport(
  orgId: string,
  draft: UploadDraft,
): Promise<LabImportBatch> {
  const error = uploadDraftError(draft);
  if (error) throw new RangeError(error);
  return api<LabImportBatch>(imports(orgId), {
    method: "POST",
    body: {
      fileName: draft.fileName.trim(),
      csv: draft.csv,
      ...(draft.patientId ? { patientId: draft.patientId } : {}),
    },
    ...asOffice(orgId),
  });
}

export function listImports(
  orgId: string,
  params: { status?: LabImportStatus; page?: number; limit?: number } = {},
): Promise<Page<LabImportBatch>> {
  return fetchPage<LabImportBatch>(
    imports(orgId),
    { page: params.page ?? 1, limit: params.limit ?? 10 },
    { query: { status: params.status }, ...asOffice(orgId) },
  );
}

export function getImport(
  orgId: string,
  batchId: string,
): Promise<LabImportDetail> {
  return api<LabImportDetail>(batchPath(orgId, batchId), asOffice(orgId));
}

export function listImportRows(
  orgId: string,
  batchId: string,
  params: { status?: LabImportRowStatus; page?: number; limit?: number } = {},
): Promise<Page<LabImportRow>> {
  return fetchPage<LabImportRow>(
    batchPath(orgId, batchId, "/rows"),
    { page: params.page ?? 1, limit: params.limit ?? 50 },
    { query: { status: params.status }, ...asOffice(orgId) },
  );
}

/** Imports the batch's MATCHED rows. The server records who confirmed. */
export function confirmImport(
  orgId: string,
  batchId: string,
): Promise<LabImportBatch> {
  return api<LabImportBatch>(batchPath(orgId, batchId, "/confirm"), {
    method: "POST",
    ...asOffice(orgId),
  });
}

export function cancelImport(
  orgId: string,
  batchId: string,
): Promise<LabImportBatch> {
  return api<LabImportBatch>(batchPath(orgId, batchId, "/cancel"), {
    method: "POST",
    ...asOffice(orgId),
  });
}
