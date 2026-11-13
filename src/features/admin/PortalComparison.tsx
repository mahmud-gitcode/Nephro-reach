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
import { useLanguage } from "@/context/LanguageContext";
import {
  CONTROL,
  PORTALS,
  SECTIONS,
  localize,
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
  const { language } = useLanguage();
  const isEs = language === "ES";
  if (typeof cell === "number") {
    return <span className="text-label-lg text-fg tabular-nums">{cell}</span>;
  }
  if (cell === "yes") {
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-pill bg-success-surface text-success">
        <Check aria-label={isEs ? "Sí" : "Yes"} className="size-4" />
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
      aria-label={
        isEs
          ? `Limitado: qué incluye para ${label}`
          : `Limited — what is included for ${label}`
      }
    >
      {isEs ? "Limitado" : "Limited"}
    </Button>
  );
}

export default function PortalComparison() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const tr = (text: string) => localize(text, isEs);
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
            onClick={() => downloadComparisonPdf(isEs)}
          >
            {isEs ? "Descargar PDF" : "Download PDF"}
          </Button>
        }
      />
      {isEs ? (
        <p className="measure text-body-md text-fg-muted">
          Lo que tiene el portal de cada organización, lado a lado. Haga clic en{" "}
          <span className="text-label-md text-fg">Limitado</span> para ver qué
          se incluye y qué no.
        </p>
      ) : (
        <p className="measure text-body-md text-fg-muted">
          What each organization&rsquo;s portal has, side by side. Click{" "}
          <span className="text-label-md text-fg">Limited</span> to see what is
          included and what is not.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-inline-lg text-body-sm text-fg-secondary">
        <span className="inline-flex items-center gap-inline-xs">
          <span className="inline-flex size-6 items-center justify-center rounded-pill bg-success-surface text-success">
            <Check aria-hidden="true" className="size-3.5" />
          </span>
          {isEs ? "Sí" : "Yes"}
        </span>
        <span className="inline-flex items-center gap-inline-xs">
          <span className="inline-flex size-6 items-center justify-center rounded-pill bg-surface-sunken text-fg-subtle">
            <Minus aria-hidden="true" className="size-3.5" />
          </span>
          No
        </span>
        <span className="inline-flex items-center gap-inline-xs">
          <Badge tone="neutral">{isEs ? "Limitado" : "Limited"}</Badge>{" "}
          {isEs ? "Haga clic para ver detalles" : "Click for details"}
        </span>
      </div>

      <Card padding="none" className="overflow-hidden">
        <Table minWidth={860}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{isEs ? "Función" : "Feature"}</TableHeaderCell>
              {PORTALS.map((p) => (
                <TableHeaderCell key={p.id} className="text-center">
                  {tr(p.name)}
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
                    {tr(section.title)}
                  </TableCell>
                </TableRow>
                {section.rows.map((row) => (
                  <TableRow key={row.feature}>
                    <TableCell emphasis>{tr(row.feature)}</TableCell>
                    {PORTALS.map((p) => {
                      const cell = row.cells[p.id];
                      return (
                        <TableCell key={p.id} className="text-center">
                          <CellMark
                            cell={cell}
                            label={`${tr(row.feature)} — ${tr(p.name)}`}
                            onLimited={() =>
                              typeof cell === "object"
                                ? setOpen({
                                    feature: tr(row.feature),
                                    portal: tr(p.name),
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
            {isEs
              ? "Quién controla el personal y los roles"
              : "Who controls staff and roles"}
          </h2>
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            {isEs
              ? "Los roles predefinidos son solo el punto de partida: cada organización puede crear sus propios roles y cambiar lo que puede hacer cualquier rol."
              : "Built-in roles are only the starting point: each organization can create its own roles and change what any role can do."}
          </p>
        </div>
        <Table minWidth={720}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>
                {isEs ? "Organización" : "Organization"}
              </TableHeaderCell>
              <TableHeaderCell>
                {isEs
                  ? "Crea roles y activa/desactiva funciones"
                  : "Creates roles & turns features on/off"}
              </TableHeaderCell>
              <TableHeaderCell>
                {isEs
                  ? "Agrega personal y asigna roles"
                  : "Adds staff & assigns roles"}
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {CONTROL.map((row) => (
              <TableRow key={row.portal}>
                <TableCell emphasis>{tr(row.portal)}</TableCell>
                <TableCell>{tr(row.roles)}</TableCell>
                <TableCell>{tr(row.staff)}</TableCell>
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
          description={
            isEs ? `${open.portal} — limitado` : `${open.portal} — limited`
          }
        >
          <div className="grid grid-cols-1 gap-inset-md md:grid-cols-2">
            <section className="space-y-stack-sm rounded-card-nested border border-success-line bg-success-surface p-inset-sm">
              <h3 className="text-label-lg text-fg">
                {isEs ? "Lo que tiene" : "What it has"}
              </h3>
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
                    {tr(item)}
                  </li>
                ))}
              </ul>
            </section>
            <section className="space-y-stack-sm rounded-card-nested border border-line p-inset-sm">
              <h3 className="text-label-lg text-fg">
                {isEs ? "Lo que no tiene" : "What it does not have"}
              </h3>
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
                    {tr(item)}
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
