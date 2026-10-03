"use client";

import React, { useState } from "react";
import { Download, FileUp, Upload } from "lucide-react";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
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
} from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import { userCan } from "@/features/staff/staff";
import {
  LAB_CSV_COLUMNS,
  LAB_CSV_TEMPLATE,
  labFlag,
  labsFor,
  parseLabCsv,
  type ParsedLabs,
} from "./labs.data";
import { usDate } from "./ccm.data";
import { useClinicData } from "./useClinicData";
import { useClinicLabs, type ClinicLabsStore } from "./useClinicLabs";
import { UpdatedBar } from "./UpdatedBar";

/* ==========================================================================
   Labs — patient lab charts, and the administrator's CSV upload
   --------------------------------------------------------------------------
   The client (2026-10-01): nurses and the dietitian read labs; the
   administrator may upload them by CSV to patient charts. One patient at a
   time, newest draw first, values outside the printed range flagged.
   ========================================================================== */

const HREF = "/dashboard/clinic/labs";

function downloadTemplate() {
  const url = URL.createObjectURL(
    new Blob([LAB_CSV_TEMPLATE], { type: "text/csv" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "lab-upload-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function UploadModal({
  knownMrns,
  store,
  me,
  onDone,
  onClose,
}: {
  knownMrns: string[];
  store: ClinicLabsStore;
  me: string;
  onDone: (count: number) => void;
  onClose: () => void;
}) {
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedLabs | null>(null);

  async function read(file: File) {
    setFileName(file.name);
    setParsed(parseLabCsv(await file.text(), knownMrns));
  }

  const count = parsed?.rows.length ?? 0;
  const patients = new Set(parsed?.rows.map((r) => r.mrn)).size;

  return (
    <Modal
      open
      onClose={onClose}
      title="Upload Labs"
      description="Adds results to patient charts. A result for the same patient, test and date replaces the earlier one."
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={count === 0}
            leadingIcon={<Upload aria-hidden="true" />}
            onClick={() => {
              store.importLabs(parsed!.rows, me);
              onDone(count);
              onClose();
            }}
          >
            {count > 0
              ? `Import ${count} result${count === 1 ? "" : "s"}`
              : "Import"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        <p className="text-body-sm text-fg-secondary">
          A CSV file with a header row. Columns:{" "}
          <span className="text-label-md text-fg">
            {LAB_CSV_COLUMNS.join(", ")}
          </span>
          . The first four are required; dates may be YYYY-MM-DD or MM/DD/YYYY.
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
            onClick={downloadTemplate}
          >
            Download template
          </Button>
        </div>

        {parsed ? (
          <div className="space-y-stack-sm">
            {count > 0 ? (
              <Alert tone="success">
                {count} result{count === 1 ? "" : "s"} for {patients} patient
                {patients === 1 ? "" : "s"} ready to import.
              </Alert>
            ) : null}
            {parsed.errors.length > 0 ? (
              <Alert
                tone="warning"
                title={`${parsed.errors.length} line${parsed.errors.length === 1 ? "" : "s"} will be skipped`}
              >
                <ul className="mt-stack-xs space-y-0.5">
                  {parsed.errors.slice(0, 8).map((error) => (
                    <li key={error.line}>
                      Line {error.line}: {error.message}
                    </li>
                  ))}
                  {parsed.errors.length > 8 ? (
                    <li>…and {parsed.errors.length - 8} more.</li>
                  ) : null}
                </ul>
              </Alert>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

export default function ClinicLabs() {
  const { user } = useAuth();
  const me = user?.staffRole ? user.name : "Administrator";
  const canUpload = userCan(user, "labs.upload");
  const store = useClinicLabs();
  const clinicData = useClinicData();
  const patients = clinicData.data?.patients ?? [];
  const [mrn, setMrn] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imported, setImported] = useState<number | null>(null);

  /* With results first, so the list opens on a chart that has some. */
  const withLabs = new Set(store.state.results.map((r) => r.mrn));
  const ordered = [
    ...patients.filter((p) => withLabs.has(p.mrn)),
    ...patients.filter((p) => !withLabs.has(p.mrn)),
  ];
  const selected = mrn || ordered[0]?.mrn || "";
  const chart = labsFor(store.state, selected);

  let body: React.ReactNode;
  if (store.error) {
    body = (
      <ErrorState
        title="Labs could not be loaded"
        error={store.error}
        onRetry={store.refetch}
      />
    );
  } else if (store.isPending || clinicData.isPending) {
    body = <Skeleton className="h-96 w-full" />;
  } else if (patients.length === 0) {
    body = <EmptyState title="No patients yet" />;
  } else {
    body = (
      <Card as="section" padding="none" className="min-w-0 overflow-hidden">
        <div className="flex flex-col gap-inline-md p-card pb-stack-lg sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-heading-4 text-fg">Lab Results</h2>
          <Select
            selectSize="small"
            aria-label="Patient"
            value={selected}
            onChange={(e) => setMrn(e.target.value)}
            className="sm:w-72"
          >
            {ordered.map((p) => (
              <option key={p.mrn} value={p.mrn}>
                {p.name} · MRN {p.mrn}
                {withLabs.has(p.mrn) ? "" : " (no labs)"}
              </option>
            ))}
          </Select>
        </div>
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
            {chart.length === 0 ? (
              <TableEmptyRow colSpan={5}>
                No lab results on this chart yet.
              </TableEmptyRow>
            ) : (
              chart.map((result) => {
                const flag = labFlag(result);
                return (
                  <TableRow key={result.id}>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {usDate(result.date)}
                    </TableCell>
                    <TableCell emphasis>{result.test}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {result.value} {result.unit}
                      {flag ? (
                        <Badge
                          tone={flag === "High" ? "danger" : "warning"}
                          className="ml-inline-sm"
                        >
                          {flag}
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {result.reference || "—"}
                    </TableCell>
                    <TableCell className="text-fg-muted">
                      {result.uploadedBy}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <PageTitle
        href={HREF}
        action={
          <div className="flex flex-wrap items-center gap-inline-md">
            <UpdatedBar
              updatedAt={store.updatedAt}
              isFetching={store.isFetching}
              refetch={store.refetch}
            />
            {canUpload ? (
              <Button
                size="small"
                leadingIcon={<Upload aria-hidden="true" />}
                onClick={() => setUploading(true)}
              >
                Upload Labs (CSV)
              </Button>
            ) : null}
          </div>
        }
      />
      {store.writeError ? (
        <Alert tone="danger" onDismiss={store.clearWriteError}>
          The upload did not save. Try again.
        </Alert>
      ) : imported !== null ? (
        <Alert tone="success" onDismiss={() => setImported(null)}>
          {imported} lab result{imported === 1 ? "" : "s"} added to patient
          charts.
        </Alert>
      ) : null}
      {body}
      {uploading ? (
        <UploadModal
          knownMrns={patients.map((p) => p.mrn)}
          store={store}
          me={me}
          onDone={setImported}
          onClose={() => setUploading(false)}
        />
      ) : null}
    </div>
  );
}
