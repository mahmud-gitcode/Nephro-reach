"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Download, Edit3, Eye, Plus, ScanLine, Trash2 } from "lucide-react";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import {
  Button,
  buttonStyles,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TablePagination,
  TableRow,
} from "@/components/ui";

const latestResults = [
  { label: "CREATININE", value: "0.9", unit: "umol/L", normal: "Normal: 60-110" },
  { label: "HEMOGLOBIN", value: "13.5", unit: "g/L", normal: "Normal: 115-165" },
  { label: "ALBUMIN", value: "4.5", unit: "g/L", normal: "Normal: 35-50" },
  { label: "UREA", value: "29.0", unit: "mmol/L", normal: "Normal: 2.5-7.8" },
];

const labGoals = [
  { lab: "Potassium", goal: "3.5-5.5", current: "3.5-5.5", status: "success" },
  { lab: "Phosphorus", goal: "<5.5", current: "<4.5", status: "danger" },
  { lab: "Albumin", goal: ">4.0", current: ">4.0", status: "success" },
  { lab: "Hemoglobin", goal: "10-12", current: "13.5", status: "warning" },
  { lab: "Calcium", goal: "8.5-10.5", current: "9.6", status: "success" },
  { lab: "PTH", goal: "150-600", current: "410", status: "success" },
];

const history = [
  { date: "05/06/2026", label: "Abcd 123 Week12" },
  { date: "04/06/2026", label: "Abcd 123 Week12" },
  { date: "03/06/2026", label: "Abcd 123 Week12" },
  { date: "02/06/2026", label: "Abcd 123 Week12" },
  { date: "01/06/2026", label: "Abcd 123 Week12" },
];

function ResultCard({ result }: { result: (typeof latestResults)[number] }) {
  return (
    <Card as="article" tone="flat">
      <p className="text-overline text-fg-muted">{result.label}</p>
      <div className="mt-stack-xs flex items-baseline gap-inline-xs">
        <p className="text-metric-md text-fg">{result.value}</p>
        <p className="text-body-sm text-fg-muted">{result.unit}</p>
      </div>
      <p className="mt-stack-xs text-caption text-fg-muted">{result.normal}</p>
    </Card>
  );
}

function LabGoalsCard() {
  return (
    <Card as="section">
      <div className="flex flex-col gap-inline-md sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-inline-md">
            <h2 className="text-heading-4 text-fg">My Lab Goal</h2>
            <p className="text-caption text-fg-muted">June 1, 2026</p>
          </div>
          <p className="mt-stack-sm text-body-sm text-fg-secondary">
            Allow members to enter provider recommended goals:
          </p>
        </div>
        <Button
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          leadingIcon={<Edit3 />}
        >
          Edit
        </Button>
      </div>

      <Card padding="none" className="mt-stack-md overflow-hidden">
        <Table minWidth={420}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Lab</TableHeaderCell>
              <TableHeaderCell numeric>My Goal</TableHeaderCell>
              <TableHeaderCell numeric>Current</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {labGoals.map((goal) => (
              <TableRow key={goal.lab}>
                <TableCell emphasis>{goal.lab}</TableCell>
                <TableCell numeric>{goal.goal}</TableCell>
                <TableCell
                  numeric
                  className={
                    goal.status === "danger"
                      ? "text-danger"
                      : goal.status === "warning"
                        ? "text-warning"
                        : "text-success"
                  }
                >
                  {goal.current}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Card>
  );
}

function TestHistoryCard() {
  // The chevrons here used to be bare icons with no handler — pagination
  // that looked real and did nothing.
  const [page, setPage] = useState(1);

  return (
    <Card as="section">
      <h2 className="text-heading-4 text-fg">Test History</h2>

      <Card padding="none" className="mt-stack-md overflow-hidden">
        <Table minWidth={420}>
          <TableHead>
            <TableRow>
              <TableHeaderCell numeric>Date</TableHeaderCell>
              <TableHeaderCell>Label</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((item) => (
              <TableRow key={item.date}>
                <TableCell numeric>{item.date}</TableCell>
                <TableCell emphasis>{item.label}</TableCell>
                <TableCell>
                  <span className="flex gap-inline-md">
                    <Button
                      iconOnly
                      size="small"
                      variant="neutral"
                      appearance="fill-stroke"
                      aria-label={`Edit result from ${item.date}`}
                    >
                      <Edit3 />
                    </Button>
                    <Button
                      iconOnly
                      size="small"
                      variant="danger"
                      appearance="fill-stroke"
                      aria-label={`Delete result from ${item.date}`}
                    >
                      <Trash2 />
                    </Button>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          page={page}
          pageCount={2}
          onPageChange={setPage}
          summary="1-10 of 20"
        />
      </Card>
    </Card>
  );
}

export default function BloodResultsPage() {
  return (
    <div className="space-y-stack-xl">
      <PersonalLogDisclaimer />

      <header className="flex flex-col gap-inline-lg sm:flex-row sm:items-center sm:justify-between">
        <Button variant="neutral" appearance="fill-stroke" leadingIcon={<ScanLine />}>
          Scan Results
        </Button>
        <Link
          href="/dashboard/personal-log/blood-results/add"
          className={buttonStyles()}
        >
          <Plus />
          Add Results
        </Link>
      </header>

      <Card as="section" tone="sunken" padding="big">
        <div className="flex flex-col gap-inline-md sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-heading-4 text-fg">Latest Results</h1>
          <div className="flex flex-wrap items-center gap-inline-md">
            <p className="text-caption text-fg-muted">June 1, 2026</p>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              size="small"
              leadingIcon={<Eye />}
            >
              View
            </Button>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              size="small"
              leadingIcon={<Download />}
            >
              Download PDF
            </Button>
          </div>
        </div>

        <div className="mt-stack-md grid grid-cols-1 gap-inline-lg sm:grid-cols-2 xl:grid-cols-4">
          {latestResults.map((result) => (
            <ResultCard key={result.label} result={result} />
          ))}
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-inline-lg xl:grid-cols-2">
        <LabGoalsCard />
        <TestHistoryCard />
      </section>

      <Button variant="primary" appearance="stroke" fullWidth>
        View All Results
      </Button>
    </div>
  );
}
