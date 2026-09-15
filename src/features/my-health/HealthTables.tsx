"use client";

import React from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Badge,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { severityBadge, statusBadge } from "./health.seed";
import type { AllergyRow, HistoryRow } from "./health.types";

/* The two tables and the pieces they share. */

export function RowActions({
  label,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: {
  label: string;
  editLabel?: string;
  deleteLabel?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-inline-md">
      <Button
        iconOnly
        size="small"
        variant="neutral"
        appearance="fill-stroke"
        onClick={onEdit}
        aria-label={`${editLabel || "Edit"} ${label}`}
      >
        <Edit3 aria-hidden="true" />
      </Button>
      <Button
        iconOnly
        size="small"
        variant="danger"
        appearance="fill-stroke"
        onClick={onDelete}
        aria-label={`${deleteLabel || "Delete"} ${label}`}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  buttonLabel,
  onAddClick,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  onAddClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-inset-md sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-heading-4 text-fg">{title}</h2>
        <p className="mt-stack-sm measure text-body-sm text-fg-secondary">
          {description}
        </p>
      </div>
      <Button
        onClick={onAddClick}
        leadingIcon={<Plus aria-hidden="true" />}
        className="shrink-0"
      >
        {buttonLabel}
      </Button>
    </div>
  );
}

export function AllergiesTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: AllergyRow[];
  onEdit: (row: AllergyRow) => void;
  onDelete: (id: string) => void;
}) {
  const { dictionary } = useLanguage();
  const h = dictionary?.myHealth;

  const getTypeName = (type: "Medication" | "Food" | "Environmental") => {
    if (type === "Medication")
      return h?.allergies?.types?.medication || "Medication";
    if (type === "Food") return h?.allergies?.types?.food || "Food";
    return h?.allergies?.types?.environmental || "Environmental";
  };

  const getSeverityName = (severity: "Severe" | "Moderate" | "Mild") => {
    if (severity === "Severe")
      return h?.allergies?.severities?.severe || "Severe";
    if (severity === "Moderate")
      return h?.allergies?.severities?.moderate || "Moderate";
    return h?.allergies?.severities?.mild || "Mild";
  };

  const getReaction = (key: string, fallback: string) => {
    const reactions = h?.allergies?.reactions;
    if (reactions && typeof reactions === "object" && key in reactions) {
      return (reactions as Record<string, string>)[key] || fallback;
    }
    return fallback;
  };

  const headers = [
    h?.allergies?.headers?.name || "Name",
    h?.allergies?.headers?.type || "Type",
    h?.allergies?.headers?.reaction || "Reaction",
    h?.allergies?.headers?.severity || "Severity",
    h?.allergies?.headers?.notes || "Notes",
    h?.allergies?.headers?.actions || "Actions",
  ];

  const sampleName = h?.allergies?.sampleName || "Introduction to Wellness";
  const weekPrefix = h?.allergies?.weekPrefix || "Week";

  return (
    <Card padding="none" className="overflow-hidden">
      <Table minWidth={1080}>
        <TableHead className="bg-surface-sunken">
          <TableRow>
            {headers.map((header, index) => (
              <TableHeaderCell
                key={header}
                className={`${index === 0 ? "w-[358px]" : ""} ${
                  index === 5 ? "text-center" : ""
                }`}
              >
                {header}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const reactionText = row.reactionKey
              ? getReaction(row.reactionKey, row.reactionDefault)
              : row.reactionDefault;
            const notesText = row.notes ?? `${weekPrefix} ${row.week}`;
            const nameText = row.name || sampleName;

            return (
              <TableRow key={row.id}>
                <TableCell emphasis className="max-w-[358px] truncate">
                  {nameText}
                </TableCell>
                <TableCell>{getTypeName(row.type)}</TableCell>
                <TableCell className="max-w-[160px] truncate">
                  {reactionText}
                </TableCell>
                <TableCell>
                  <Badge {...severityBadge[row.severity]} className="w-[92px]">
                    {getSeverityName(row.severity)}
                  </Badge>
                </TableCell>
                <TableCell>{notesText}</TableCell>
                <TableCell>
                  <RowActions
                    label={nameText}
                    editLabel={h?.actions?.edit}
                    deleteLabel={h?.actions?.delete}
                    onEdit={() => onEdit(row)}
                    onDelete={() => onDelete(row.id)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

export function MedicalHistoryTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: HistoryRow[];
  onEdit: (row: HistoryRow) => void;
  onDelete: (id: string) => void;
}) {
  const { dictionary } = useLanguage();
  const h = dictionary?.myHealth;

  const getConditionName = (key: string, fallback: string) => {
    const conditions = h?.history?.conditions;
    if (conditions && typeof conditions === "object" && key in conditions) {
      return (conditions as Record<string, string>)[key] || fallback;
    }
    return fallback;
  };

  const getStatusName = (status: "Current" | "Past") => {
    if (status === "Current") return h?.history?.statuses?.current || "Current";
    return h?.history?.statuses?.past || "Past";
  };

  const headers = [
    h?.history?.headers?.condition || "CONDITION / HISTORY",
    h?.history?.headers?.status || "Status",
    h?.history?.headers?.diagnosed || "Diagnosed",
    h?.history?.headers?.notes || "Notes",
    h?.history?.headers?.actions || "Actions",
  ];

  const weekPrefix = h?.allergies?.weekPrefix || "Week";

  return (
    <Card padding="none" className="overflow-hidden">
      <Table minWidth={1080}>
        <TableHead className="bg-surface-sunken">
          <TableRow>
            {headers.map((header, index) => (
              <TableHeaderCell
                key={header}
                className={`${index === 0 ? "w-[358px]" : ""} ${
                  index === 4 ? "text-center" : ""
                }`}
              >
                {header}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const conditionText = row.conditionKey
              ? getConditionName(row.conditionKey, row.conditionDefault)
              : row.conditionDefault;
            const notesText = row.notes ?? `${weekPrefix} ${row.week}`;

            return (
              <TableRow key={row.id}>
                <TableCell emphasis className="max-w-[358px] truncate">
                  {conditionText}
                </TableCell>
                <TableCell>
                  <Badge {...statusBadge[row.status]} className="w-[84px]">
                    {getStatusName(row.status)}
                  </Badge>
                </TableCell>
                <TableCell>{row.diagnosed}</TableCell>
                <TableCell>{notesText}</TableCell>
                <TableCell>
                  <RowActions
                    label={conditionText}
                    editLabel={h?.actions?.edit}
                    deleteLabel={h?.actions?.delete}
                    onEdit={() => onEdit(row)}
                    onDelete={() => onDelete(row.id)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
