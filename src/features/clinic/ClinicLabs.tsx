"use client";

import React, { useState } from "react";
import { Download, FileUp, Upload } from "lucide-react";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Modal,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRow,
  type BadgeTone,
} from "@/components/ui";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { downloadText } from "@/lib/utils/download";
import {
  LAB_CSV_TEMPLATE,
  PATIENT_CSV_TEMPLATE,
  csvColumns,
} from "./labs.data";
import {
  uploadDraftError,
  type LabImportRow,
  type LabImportRowStatus,
} from "./labImports.repository";
import { FLAG_LABEL, SOURCE_LABEL } from "./labsChart.repository";
import type { RosterPick } from "./ccm.repository";
import { usDate } from "./ccm.data";
import { actionErrorText, useOfficeOrg } from "./officeContext";
import {
  useLabImportActions,
  useLabImportBatch,
  usePatientLabChart,
  useRosterPicks,
} from "./useClinicLabs";
import { UpdatedBar } from "./UpdatedBar";

/* ==========================================================================
   Labs: patient lab charts, and the CSV upload (Phase 9: on the API)
   --------------------------------------------------------------------------
   The client (2026-10-01): nurses and the dietitian read labs; the
   administrator may upload them by CSV to patient charts. One patient at a
   time, newest draw first, values the lab flagged marked.

   The upload is a review, then a decision: the server reads the file and
   stages every row (matched, unmatched, not shared, invalid, duplicate);
   only "Import" adds the matched rows to charts. Nothing is replaced: a row
   already on the chart is reported as a duplicate. Closing the review
   without importing cancels the batch.
   ========================================================================== */

const HREF = "/dashboard/clinic/labs";

/* Uploading for several patients at once: the file's MRN column says
   whose each row is. */
const SEVERAL = "__several__";

const nameOf = (p: Pick<RosterPick, "firstName" | "lastName">) =>
  `${p.firstName} ${p.lastName}`.trim();

const ROW_STATUS: Record<
  LabImportRowStatus,
  { label: string; tone: BadgeTone }
> = {
  MATCHED: { label: "Ready to import", tone: "success" },
  UNMATCHED: { label: "No matching patient", tone: "warning" },
  NOT_OPTED_IN: { label: "Not shared with your office", tone: "neutral" },
  INVALID: { label: "Invalid", tone: "danger" },
  DUPLICATE: { label: "Already on the chart", tone: "neutral" },
  EXCLUDED: { label: "Excluded", tone: "neutral" },
  IMPORTED: { label: "Imported", tone: "success" },
};

function UploadModal({
  patients,
  initialPatientId,
  onDone,
  onClose,
}: {
  patients: RosterPick[];
  /** The patient on screen when Upload was pressed. */
  initialPatientId: string;
  onDone: (count: number) => void;
  onClose: () => void;
}) {
  const actions = useLabImportActions();
  /* The patient comes first, then the file (client, 2026-10-18). */
  const [patient, setPatient] = useState(initialPatientId || SEVERAL);
  /* The file text lives only here, and only until the modal closes. */
  const [fileText, setFileText] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [batchId, setBatchId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const forOne = patient !== SEVERAL;
  const review = useLabImportBatch(batchId, { page });
  const counts = review.batch.data?.rowCounts;
  const matched = counts?.matched ?? 0;
  const draft = {
    fileName,
    csv: fileText ?? "",
    ...(forOne ? { patientId: patient } : {}),
  };
  const draftError = fileText === null ? null : uploadDraftError(draft);

  async function read(file: File) {
    setFileName(file.name);
    setFileText(await file.text());
  }

  function close() {
    /* A batch staged but not imported is closed on the server (best
       effort; one left open shows as pending review). */
    if (batchId && review.batch.data?.status === "PENDING_REVIEW")
      actions.cancel.mutate(batchId);
    setFileText(null);
    onClose();
  }

  const failure =
    actions.upload.error ?? actions.confirm.error ?? actions.cancel.error;
  const rows = review.rows.data?.items ?? [];
  const pagination = review.rows.data?.pagination;
  const lastPage =
    pagination && pagination.mode === "offset" ? pagination.totalPages : 1;

  return (
    <Modal
      open
      onClose={close}
      size={batchId ? "big" : undefined}
      title="Upload Labs"
      description="Adds results to patient charts after you review them. A result already on a chart is never replaced."
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={close}>
            Cancel
          </Button>
          {batchId ? (
            <Button
              disabled={matched === 0 || actions.confirm.isPending}
              leadingIcon={<Upload aria-hidden="true" />}
              onClick={() =>
                actions.confirm.mutate(batchId, {
                  onSuccess: (batch) => {
                    setFileText(null);
                    onDone(batch.importedRows);
                    onClose();
                  },
                })
              }
            >
              {matched > 0
                ? `Import ${matched} result${matched === 1 ? "" : "s"}`
                : "Import"}
            </Button>
          ) : (
            <Button
              disabled={
                fileText === null ||
                draftError !== null ||
                actions.upload.isPending
              }
              leadingIcon={<Upload aria-hidden="true" />}
              onClick={() =>
                actions.upload.mutate(draft, {
                  onSuccess: (batch) => {
                    setPage(1);
                    setBatchId(batch.id);
                  },
                })
              }
            >
              Review file
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-stack-md">
        {failure ? (
          <Alert tone="danger" title="That did not work">
            {actionErrorText(failure)}
          </Alert>
        ) : null}
        {batchId ? null : (
          <>
            <FormField label="Patient" required>
              {(field) => (
                <Select
                  {...field}
                  value={patient}
                  onChange={(e) => setPatient(e.target.value)}
                >
                  {patients.map((p) => (
                    <option key={p.patientId} value={p.patientId}>
                      {nameOf(p)}
                      {p.mrn ? ` · MRN ${p.mrn}` : ""}
                    </option>
                  ))}
                  <option value={SEVERAL}>
                    Several patients (the file has an MRN column)
                  </option>
                </Select>
              )}
            </FormField>
            <p className="text-body-sm text-fg-secondary">
              A CSV file with a header row. Columns:{" "}
              <span className="text-label-md text-fg">
                {csvColumns(forOne).join(", ")}
              </span>
              . The first {forOne ? "three" : "four"} are required; dates are
              YYYY-MM-DD.
            </p>
            <div className="flex flex-wrap items-center gap-inline-md">
              <label className="inline-flex">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="peer sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void read(file);
                  }}
                />
                <span className="inline-flex min-h-10 cursor-pointer items-center gap-inline-sm rounded-button border border-line bg-surface px-inset-sm text-label-md text-fg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:bg-surface-sunken">
                  <FileUp aria-hidden="true" className="size-4" />
                  {fileName || "Choose CSV file"}
                </span>
              </label>
              <Button
                size="small"
                variant="neutral"
                appearance="ghost"
                leadingIcon={<Download aria-hidden="true" />}
                onClick={() =>
                  downloadText(
                    "lab-upload-template.csv",
                    forOne ? PATIENT_CSV_TEMPLATE : LAB_CSV_TEMPLATE,
                  )
                }
              >
                Download template
              </Button>
            </div>
            {draftError ? <Alert tone="warning">{draftError}</Alert> : null}
          </>
        )}

        {batchId ? (
          <AsyncSection
            pending={review.batch.isPending || review.rows.isPending}
            error={review.batch.error ?? review.rows.error}
            errorTitle={errorTitleFor(
              review.batch.error ?? review.rows.error,
              "The file could not be reviewed",
            )}
            errorMessage={errorMessageFor(
              review.batch.error ?? review.rows.error,
              undefined,
            )}
            onRetry={
              canRetry(review.batch.error ?? review.rows.error)
                ? () => {
                    void review.batch.refetch();
                    void review.rows.refetch();
                  }
                : undefined
            }
            skeleton={<Skeleton className="h-64 w-full" />}
          >
            <div className="space-y-stack-sm">
              {counts ? (
                <Alert tone={matched > 0 ? "success" : "warning"}>
                  {`${matched} result${matched === 1 ? "" : "s"} ready to import. `}
                  {[
                    counts.unmatched
                      ? `${counts.unmatched} with no matching patient`
                      : null,
                    counts.notOptedIn
                      ? `${counts.notOptedIn} not shared with your office`
                      : null,
                    counts.invalid ? `${counts.invalid} invalid` : null,
                    counts.duplicate
                      ? `${counts.duplicate} already on the chart`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Alert>
              ) : null}
              <ReviewTable rows={rows} />
              {lastPage > 1 ? (
                <div className="flex items-center justify-end gap-inline-md">
                  <Button
                    size="small"
                    variant="neutral"
                    appearance="fill-stroke"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-caption text-fg-muted tabular-nums">
                    Page {page} of {lastPage}
                  </span>
                  <Button
                    size="small"
                    variant="neutral"
                    appearance="fill-stroke"
                    disabled={page >= lastPage}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </div>
          </AsyncSection>
        ) : null}
      </div>
    </Modal>
  );
}

/** Each staged row as the server read it: its line, its status and why. */
function ReviewTable({ rows }: { rows: LabImportRow[] }) {
  return (
    <div className="overflow-hidden rounded-control border border-line">
      <Table minWidth={640}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Line</TableHeaderCell>
            <TableHeaderCell>MRN</TableHeaderCell>
            <TableHeaderCell>Test</TableHeaderCell>
            <TableHeaderCell>Result</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmptyRow colSpan={5}>The file has no rows.</TableEmptyRow>
          ) : (
            rows.map((row) => {
              const status = ROW_STATUS[row.status] ?? {
                label: row.status,
                tone: "neutral" as BadgeTone,
              };
              return (
                <TableRow key={row.id}>
                  <TableCell className="tabular-nums">
                    {row.rowNumber}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {row.data?.mrn || "—"}
                  </TableCell>
                  <TableCell>{row.data?.test || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {row.data ? `${row.data.value} ${row.data.unit}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge tone={status.tone}>{status.label}</Badge>
                    {row.message ? (
                      <span className="mt-stack-xs block text-caption text-fg-muted">
                        {row.message}
                      </span>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function LabChart({
  patientId,
  sharesLabs,
}: {
  patientId: string;
  /** From the roster row (server): whether the patient shares labs with
   *  this office. Without the share the server returns only results this
   *  office entered itself, so an empty chart says why. */
  sharesLabs: boolean;
}) {
  const chart = usePatientLabChart(patientId);
  return (
    <AsyncSection
      pending={chart.isPending}
      error={chart.error}
      errorTitle={errorTitleFor(chart.error, "Labs could not be loaded")}
      errorMessage={errorMessageFor(chart.error, undefined)}
      onRetry={canRetry(chart.error) ? chart.refetch : undefined}
      skeleton={<Skeleton className="m-card h-64" />}
    >
      <Table minWidth={640}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Test</TableHeaderCell>
            <TableHeaderCell>Result</TableHeaderCell>
            <TableHeaderCell>Reference</TableHeaderCell>
            <TableHeaderCell>Source</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {chart.results.length === 0 ? (
            <TableEmptyRow colSpan={5}>
              {sharesLabs
                ? "No lab results on this chart in the last year."
                : "This patient does not share labs with your office. Only results your office entered are shown."}
            </TableEmptyRow>
          ) : (
            chart.results.map((result) => {
              const flag = result.abnormalFlag
                ? FLAG_LABEL[result.abnormalFlag]
                : null;
              return (
                <TableRow key={result.id}>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {usDate(result.collectedOn.slice(0, 10))}
                  </TableCell>
                  <TableCell emphasis>{result.testName}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {result.value} {result.unit}
                    {flag ? (
                      <Badge
                        tone={
                          result.abnormalFlag === "L" ||
                          result.abnormalFlag === "A"
                            ? "warning"
                            : "danger"
                        }
                        className="ml-inline-sm"
                      >
                        {flag}
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {result.referenceRange || "—"}
                  </TableCell>
                  <TableCell className="text-fg-muted">
                    {SOURCE_LABEL[result.source] ?? result.source}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      {chart.hasMore ? (
        <div className="flex justify-center p-card">
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            onClick={chart.loadMore}
          >
            Show older results
          </Button>
        </div>
      ) : null}
    </AsyncSection>
  );
}

export default function ClinicLabs() {
  const office = useOfficeOrg();
  /* The server decides (lab-imports needs labs Edit); the button follows. */
  const canUpload = office.can("labs", 2);
  const roster = useRosterPicks();
  const patients = roster.patients;
  const [chosen, setChosen] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imported, setImported] = useState<number | null>(null);
  const selected = chosen || patients[0]?.patientId || "";
  const chart = usePatientLabChart(selected || null);

  return (
    <div className="space-y-4">
      <PageTitle
        href={HREF}
        action={
          <div className="flex flex-wrap items-center gap-inline-md">
            <UpdatedBar
              updatedAt={chart.updatedAt}
              isFetching={chart.isFetching}
              refetch={selected ? chart.refetch : roster.refetch}
            />
            {canUpload ? (
              <Button
                size="small"
                leadingIcon={<Upload aria-hidden="true" />}
                onClick={() => setUploading(true)}
                disabled={patients.length === 0}
              >
                Upload Labs (CSV)
              </Button>
            ) : null}
          </div>
        }
      />
      {imported !== null ? (
        <Alert tone="success" onDismiss={() => setImported(null)}>
          {imported} lab result{imported === 1 ? "" : "s"} added to patient
          charts.
        </Alert>
      ) : null}
      <AsyncSection
        pending={roster.isPending}
        error={roster.error}
        errorTitle={errorTitleFor(roster.error, "Labs could not be loaded")}
        errorMessage={errorMessageFor(roster.error, undefined)}
        onRetry={canRetry(roster.error) ? roster.refetch : undefined}
        isEmpty={patients.length === 0}
        empty={<EmptyState title="No patients yet" />}
        skeleton={<Skeleton className="h-96 w-full" />}
      >
        <Card as="section" padding="none" className="min-w-0 overflow-hidden">
          <div className="flex flex-col gap-inline-md p-card pb-stack-lg sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-heading-4 text-fg">Lab Results</h2>
            <Select
              selectSize="small"
              aria-label="Patient"
              value={selected}
              onChange={(e) => setChosen(e.target.value)}
              className="sm:w-72"
            >
              {patients.map((p) => (
                <option key={p.patientId} value={p.patientId}>
                  {nameOf(p)}
                  {p.mrn ? ` · MRN ${p.mrn}` : ""}
                </option>
              ))}
            </Select>
          </div>
          {selected ? (
            <LabChart
              key={selected}
              patientId={selected}
              sharesLabs={
                patients
                  .find((p) => p.patientId === selected)
                  ?.sharedAreas.includes("labs") ?? true
              }
            />
          ) : null}
        </Card>
      </AsyncSection>
      {uploading ? (
        <UploadModal
          patients={patients}
          initialPatientId={selected}
          onDone={setImported}
          onClose={() => setUploading(false)}
        />
      ) : null}
    </div>
  );
}
