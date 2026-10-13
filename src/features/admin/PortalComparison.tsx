"use client";

import React, { useState } from "react";
import { Check, Download, Info, Minus, X } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  CONTROL,
  PORTALS,
  SECTIONS,
  type Cell,
  type Limited,
} from "./portalComparison.data";
import { downloadComparisonPdf } from "./portalComparisonPdf";

/* ==========================================================================
   Portal Comparison — what each organisation's portal has
   --------------------------------------------------------------------------
   A reference for the team (2026-10-13): the four organisation portals side
   by side. A "Limited" cell opens what that portal does and does not have
   for the feature. Kept as plain data here so it is easy to correct as the
   portals change.
   ========================================================================== */

const HREF = "/dashboard/portal-comparison";

function CellMark({
  cell,
  onLimited,
  label,
}: {
  cell: Cell;
  onLimited: () => void;
  label: string;
}) {
  if (typeof cell === "number") {
    return <span className="text-label-lg text-fg tabular-nums">{cell}</span>;
  }
  if (cell === "yes") {
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-pill bg-success-surface text-success">
        <Check aria-label="Yes" className="size-4" />
      </span>
    );
  }
  if (cell === "no") {
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-pill bg-surface-sunken text-fg-subtle">
        <Minus aria-label="No" className="size-4" />
      </span>
    );
  }
  return (
    <Button
      size="small"
      variant="neutral"
      appearance="fill-stroke"
      leadingIcon={<Info aria-hidden="true" />}
      onClick={onLimited}
      aria-label={`Limited — what is included for ${label}`}
    >
      Limited
    </Button>
  );
}

export default function PortalComparison() {
  const [open, setOpen] = useState<{
    feature: string;
    portal: string;
    detail: Limited;
  } | null>(null);

  return (
    <div className="space-y-stack-xl">
      <PageTitle
        href={HREF}
        action={
          <Button
            leadingIcon={<Download aria-hidden="true" />}
            onClick={downloadComparisonPdf}
          >
            Download PDF
          </Button>
        }
      />
      <p className="measure text-body-md text-fg-muted">
        What each organization&rsquo;s portal has, side by side. Click{" "}
        <span className="text-label-md text-fg">Limited</span> to see what is
        included and what is not.
      </p>

      <div className="flex flex-wrap items-center gap-inline-lg text-body-sm text-fg-secondary">
        <span className="inline-flex items-center gap-inline-xs">
          <span className="inline-flex size-6 items-center justify-center rounded-pill bg-success-surface text-success">
            <Check aria-hidden="true" className="size-3.5" />
          </span>
          Yes
        </span>
        <span className="inline-flex items-center gap-inline-xs">
          <span className="inline-flex size-6 items-center justify-center rounded-pill bg-surface-sunken text-fg-subtle">
            <Minus aria-hidden="true" className="size-3.5" />
          </span>
          No
        </span>
        <span className="inline-flex items-center gap-inline-xs">
          <Badge tone="neutral">Limited</Badge> Click for details
        </span>
      </div>

      <Card padding="none" className="overflow-hidden">
        <Table minWidth={860}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Feature</TableHeaderCell>
              {PORTALS.map((p) => (
                <TableHeaderCell key={p.id} className="text-center">
                  {p.name}
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {SECTIONS.map((section) => (
              <React.Fragment key={section.title}>
                <TableRow>
                  <TableCell
                    emphasis
                    colSpan={PORTALS.length + 1}
                    className="bg-surface-sunken text-overline text-fg-brand"
                  >
                    {section.title}
                  </TableCell>
                </TableRow>
                {section.rows.map((row) => (
                  <TableRow key={row.feature}>
                    <TableCell emphasis>{row.feature}</TableCell>
                    {PORTALS.map((p) => {
                      const cell = row.cells[p.id];
                      return (
                        <TableCell key={p.id} className="text-center">
                          <CellMark
                            cell={cell}
                            label={`${row.feature} — ${p.name}`}
                            onLimited={() =>
                              typeof cell === "object"
                                ? setOpen({
                                    feature: row.feature,
                                    portal: p.name,
                                    detail: cell,
                                  })
                                : undefined
                            }
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card padding="none" className="overflow-hidden">
        <div className="p-card">
          <h2 className="text-heading-4 text-fg">
            Who controls staff and roles
          </h2>
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            Built-in roles are only the starting point: each organization can
            create its own roles and change what any role can do.
          </p>
        </div>
        <Table minWidth={720}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Organization</TableHeaderCell>
              <TableHeaderCell>
                Creates roles &amp; turns features on/off
              </TableHeaderCell>
              <TableHeaderCell>Adds staff &amp; assigns roles</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {CONTROL.map((row) => (
              <TableRow key={row.portal}>
                <TableCell emphasis>{row.portal}</TableCell>
                <TableCell>{row.roles}</TableCell>
                <TableCell>{row.staff}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {open ? (
        <Modal
          open
          onClose={() => setOpen(null)}
          size="wide"
          title={open.feature}
          description={`${open.portal} — limited`}
        >
          <div className="grid grid-cols-1 gap-inset-md md:grid-cols-2">
            <section className="space-y-stack-sm rounded-card-nested border border-success-line bg-success-surface p-inset-sm">
              <h3 className="text-label-lg text-fg">What it has</h3>
              <ul className="space-y-stack-xs">
                {open.detail.included.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-inline-sm text-body-sm text-fg"
                  >
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-success"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
            <section className="space-y-stack-sm rounded-card-nested border border-line p-inset-sm">
              <h3 className="text-label-lg text-fg">What it does not have</h3>
              <ul className="space-y-stack-xs">
                {open.detail.notIncluded.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-inline-sm text-body-sm text-fg-secondary"
                  >
                    <X
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-danger"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
