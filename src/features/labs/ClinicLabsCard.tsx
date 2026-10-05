"use client";

import React from "react";
import {
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import { DEMO_MEMBER_EMAIL, DEMO_MEMBER_MRN } from "@/lib/data/demoIdentity";
import { labFlag, labsFor } from "@/features/clinic/labs.data";
import { useClinicLabs } from "@/features/clinic/useClinicLabs";
import { usDate } from "@/features/clinic/ccm.data";
import { LabInfoButton } from "./LabInfoButton";

/* ==========================================================================
   Labs from the member's clinic
   --------------------------------------------------------------------------
   What the dialysis center uploaded to this member's chart by CSV (client,
   2026-10-05: "ensure clinics can upload via CSV bulk loading"). Shown
   only when there is something on the chart. With a server, the member's
   record carries their MRN; in the demo only the demo patient has one.
   ========================================================================== */

const ID_BY_NAME: Record<string, string> = {
  potassium: "potassium",
  phosphorus: "phosphorus",
  albumin: "albumin",
  hemoglobin: "hemoglobin",
  "kt/v": "ktv",
  bun: "bun",
  creatinine: "creatinine",
  calcium: "calcium",
  sodium: "sodium",
  ferritin: "ferritin",
  pth: "pth",
};

export function ClinicLabsCard({ isEs }: { isEs: boolean }) {
  const { user } = useAuth();
  const store = useClinicLabs();
  const mrn = user?.email === DEMO_MEMBER_EMAIL ? DEMO_MEMBER_MRN : null;
  const chart = mrn ? labsFor(store.state, mrn) : [];
  if (chart.length === 0) return null;

  return (
    <Card as="section" padding="none" className="min-w-0 overflow-hidden">
      <div className="p-card pb-stack-md">
        <h2 className="text-heading-4 text-fg">
          {isEs ? "Resultados de su Clínica" : "Results From Your Clinic"}
        </h2>
        <p className="mt-stack-xs text-body-sm text-fg-muted">
          {isEs
            ? "Subidos por su centro de diálisis a su expediente."
            : "Uploaded to your chart by your dialysis center."}
        </p>
      </div>
      <Table minWidth={560}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{isEs ? "Fecha" : "Date"}</TableHeaderCell>
            <TableHeaderCell>{isEs ? "Prueba" : "Test"}</TableHeaderCell>
            <TableHeaderCell>{isEs ? "Resultado" : "Result"}</TableHeaderCell>
            <TableHeaderCell>
              {isEs ? "Referencia" : "Reference"}
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {chart.map((result) => {
            const flag = labFlag(result);
            const id = ID_BY_NAME[result.test.toLowerCase()];
            return (
              <TableRow key={result.id}>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {usDate(result.date)}
                </TableCell>
                <TableCell emphasis>
                  <span className="inline-flex items-center gap-inline-xs">
                    {result.test}
                    {id ? (
                      <LabInfoButton id={id} name={result.test} isEs={isEs} />
                    ) : null}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {result.value} {result.unit}
                  {flag ? (
                    <Badge
                      tone={flag === "High" ? "danger" : "warning"}
                      className="ml-inline-sm"
                    >
                      {flag === "High"
                        ? isEs
                          ? "Alto"
                          : "High"
                        : isEs
                          ? "Bajo"
                          : "Low"}
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell className="tabular-nums">
                  {result.reference || "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
