"use client";

import React, { useState } from "react";
import { Check, Info, Minus, X } from "lucide-react";
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

/* ==========================================================================
   Portal Comparison — what each organisation's portal has
   --------------------------------------------------------------------------
   A reference for the team (2026-10-13): the four organisation portals side
   by side. A "Limited" cell opens what that portal does and does not have
   for the feature. Kept as plain data here so it is easy to correct as the
   portals change.
   ========================================================================== */

const HREF = "/dashboard/portal-comparison";

type Limited = { included: string[]; notIncluded: string[] };
type Cell = "yes" | "no" | Limited | number;
type Portal = "hospital" | "dialysis" | "access" | "nephrology";

const PORTALS: { id: Portal; name: string; login: string }[] = [
  { id: "hospital", name: "Hospital", login: "hospital@nephroreach.com" },
  { id: "dialysis", name: "Dialysis Center", login: "clinic@nephroreach.com" },
  {
    id: "access",
    name: "Vascular Access Center",
    login: "access@nephroreach.com",
  },
  {
    id: "nephrology",
    name: "Nephrology Office",
    login: "nephrology@nephroreach.com",
  },
];

/* The access work the dialysis center and nephrology office share in. */
const ACCESS_SIDE: Limited = {
  included: [
    "See each patient's access record and status",
    "See open concerns and photos the patient sent to them",
    "Send a referral to the access center",
    "Take part in the patient's three-way access conversation",
  ],
  notIncluded: [
    "Schedule, confirm or reschedule access appointments",
    "Update referral or coordination status",
    "Arrange transport for an access procedure",
    "See concerns the patient sent only to the access center",
  ],
};

type Row = { feature: string; cells: Record<Portal, Cell> };
type Section = { title: string; rows: Row[] };

const SECTIONS: Section[] = [
  {
    title: "Patients",
    rows: [
      {
        feature: "Dashboard / Overview",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
      {
        feature: "Patient list",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
      {
        feature: "Enroll patients",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature: "Mark patient as newly diagnosed / on dialysis",
        cells: {
          hospital: "yes",
          dialysis: "no",
          access: "no",
          nephrology: "no",
        },
      },
      {
        feature: "Update enrollment status (admitted / discharged / withdrawn)",
        cells: {
          hospital: "yes",
          dialysis: "no",
          access: "no",
          nephrology: "no",
        },
      },
    ],
  },
  {
    title: "Education",
    rows: [
      {
        feature: "3-Day Kidney Failure Crash Course",
        cells: {
          hospital: "yes",
          dialysis: "no",
          access: "no",
          nephrology: "no",
        },
      },
      {
        feature: "21-Day course progress",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature: "Assign an education program to a patient",
        cells: {
          hospital: "yes",
          dialysis: "no",
          access: "no",
          nephrology: "no",
        },
      },
      {
        feature: "Live classes",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
    ],
  },
  {
    title: "Care",
    rows: [
      {
        feature: "Patient check-ins",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature: "Labs (view / CSV upload)",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature: "CCM (Chronic Care Management) time log",
        cells: {
          hospital: "no",
          dialysis: "no",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature: "Vascular access: view",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
      {
        feature: "Vascular access: concerns, photos, appointments",
        cells: {
          hospital: "no",
          dialysis: ACCESS_SIDE,
          access: "yes",
          nephrology: ACCESS_SIDE,
        },
      },
      {
        feature: "Send referrals",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature: "Receive referrals",
        cells: {
          hospital: "no",
          dialysis: "no",
          access: "yes",
          nephrology: "no",
        },
      },
      {
        feature: "Travel dialysis",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "no",
          nephrology: "no",
        },
      },
      {
        feature: "Rides / transportation",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "yes",
          nephrology: "no",
        },
      },
      {
        feature: "ER visit reports",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
    ],
  },
  {
    title: "Messages",
    rows: [
      {
        feature: "Message patients",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
      {
        feature: "Message other organizations",
        cells: {
          hospital: {
            included: [
              "Message the patients the hospital enrolled — one thread each",
              "No message is copied to other organizations automatically",
            ],
            notIncluded: [
              "Message the patient's dialysis center (in the client's plan, not built yet)",
              "Message the patient's nephrology office (in the client's plan, not built yet)",
            ],
          },
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
      {
        feature: "Share outside NephroReach (secure link)",
        cells: {
          hospital: {
            included: [
              "Patients can still share their own records with any office by secure link",
            ],
            notIncluded: [
              "Hospital staff sending a secure link to an office not on NephroReach (in the client's plan, not built yet)",
            ],
          },
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
    ],
  },
  {
    title: "Office",
    rows: [
      {
        feature: "Reports",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: {
            included: [
              "Live counts on the Access Patients workspace (open referrals, concerns, appointments)",
              'The "See reports" permission exists for the administrator, office manager and billing staff',
            ],
            notIncluded: [
              "A separate Reports page",
              "Downloadable reports (CSV)",
            ],
          },
          nephrology: "yes",
        },
      },
      {
        feature: "Monthly education report + CSV download",
        cells: {
          hospital: "yes",
          dialysis: "no",
          access: "no",
          nephrology: "no",
        },
      },
      {
        feature: "Contract & billing",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
      {
        feature: "Settings",
        cells: {
          hospital: "no",
          dialysis: "yes",
          access: "no",
          nephrology: "yes",
        },
      },
      {
        feature: "Support (contact NephroReach)",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
    ],
  },
  {
    title: "Staff & roles",
    rows: [
      {
        feature: "Add / manage staff",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
      {
        feature: "Built-in staff roles",
        cells: { hospital: 6, dialysis: 9, access: 8, nephrology: 9 },
      },
      {
        feature: "Create new roles",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
      {
        feature: "Turn each role's features on / off",
        cells: {
          hospital: "yes",
          dialysis: "yes",
          access: "yes",
          nephrology: "yes",
        },
      },
    ],
  },
];

const CONTROL: {
  portal: string;
  roles: string;
  staff: string;
}[] = [
  {
    portal: "Hospital",
    roles: "Main login (hospital@)",
    staff: "Main login, Hospital Administrator",
  },
  {
    portal: "Dialysis Center",
    roles: "Main login (clinic@)",
    staff: "Main login, Office Manager",
  },
  {
    portal: "Vascular Access Center",
    roles: "Main login (access@)",
    staff: "Main login, Access Center Administrator, Office Manager",
  },
  {
    portal: "Nephrology Office",
    roles: "Main login (nephrology@)",
    staff: "Main login, Office Manager, Administrator",
  },
];

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
      <PageTitle href={HREF} />
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
