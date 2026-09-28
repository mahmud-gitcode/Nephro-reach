"use client";

import React from "react";
import { Bell, Download, LayoutGrid, MoreHorizontal, Sun } from "lucide-react";
import { ClockSolid, MoreSolid, UsersSolid } from "@/components/icons/solid";
import {
  Badge,
  BarChart,
  Breakdown,
  Button,
  Card,
  CardBody,
  CardHeader,
  Composer,
  DateRangeFilter,
  FormField,
  Input,
  KeyCard,
  LineChart,
  SearchField,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableThumb,
} from "@/components/ui";

/* ==========================================================================
   Reference preview — the UI redesign's working page
   --------------------------------------------------------------------------
   Phase 1 measured the client's reference dashboard and agreed every value
   here. Phase 2 moved those values into tokens/canvas.css, which the whole
   canvas reads — this page included — so the tables below record them and
   the panels show them live.

   The left panel is the app's components as they are built today, on the
   new tokens. The right panel is the phase 3 layouts (stat card, breakdown,
   charts, top bar, filters, thumbnails) as prototypes, until each becomes a
   real component.
   ========================================================================== */

/* The swatch list: what each role becomes, next to what it is today. */
const PALETTE: {
  role: string;
  reference: string;
  current: string;
  note: string;
}[] = [
  {
    role: "Page background",
    reference: "#f5f7f9",
    current: "#fcfcfd",
    note: "Cool grey under white cards",
  },
  { role: "Card", reference: "#ffffff", current: "#ffffff", note: "Unchanged" },
  {
    role: "Card border",
    reference: "#e8eaec",
    current: "#eff1f6",
    note: "Hairline, neutral",
  },
  { role: "Text", reference: "#111317", current: "#10141c", note: "18.6:1" },
  {
    role: "Text, secondary",
    reference: "#313035",
    current: "#535b6b",
    note: "13.1:1 · neutral, darker",
  },
  {
    role: "Text, muted",
    reference: "#6b6c72",
    current: "#666e7f",
    note: "5.2:1 · neutral",
  },
  {
    role: "Table header",
    reference: "#595d60",
    current: "#666e7f",
    note: "6.7:1",
  },
  {
    role: "Primary blue",
    reference: "#2065ff",
    current: "#125cfe",
    note: "White on it 4.8:1",
  },
  {
    role: "Success tint / text",
    reference: "#e7f6ef",
    current: "#eef7f2",
    note: "Text #287c52, 4.5:1",
  },
  {
    role: "Danger tint / text",
    reference: "#fce7ec",
    current: "#fff2f0",
    note: "Text #c03660, 4.5:1",
  },
  {
    role: "Warning tint / text",
    reference: "#fef1e6",
    current: "#fbf4ec",
    note: "Text #b05408, 4.5:1",
  },
  {
    role: "Orange (icon, chart)",
    reference: "#ed710b",
    current: "#d97126",
    note: "Shape, 3:1",
  },
  {
    role: "Chart bar, inactive",
    reference: "#eef0f4",
    current: "—",
    note: "For phase 3 charts",
  },
];

/* The type list. `style` draws the specimen in the reference style, so the
   row shows the thing itself, not only its numbers. */
const TYPE_SCALE: {
  role: string;
  reference: string;
  current: string;
  sample: string;
  style: React.CSSProperties;
}[] = [
  {
    role: "Page title",
    reference: "24px · 600",
    current: "32px · 700",
    sample: "Dashboard",
    style: { fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em" },
  },
  {
    role: "Card title",
    reference: "16px · 500",
    current: "16px · 700",
    sample: "Total Profit",
    style: { fontSize: 16, fontWeight: 500 },
  },
  {
    role: "Big figure",
    reference: "32px · 600",
    current: "32px · 700",
    sample: "16,431",
    style: {
      fontSize: 32,
      fontWeight: 600,
      fontVariantNumeric: "tabular-nums",
    },
  },
  {
    role: "Button · tab · label",
    reference: "14–16px · 500",
    current: "14–16px · 700",
    sample: "Add widget",
    style: { fontSize: 14, fontWeight: 500 },
  },
  {
    role: "Table header",
    reference: "12px · 400 · CAPS · +0.06em",
    current: "14px · 700",
    sample: "REVENUE",
    style: { fontSize: 12, fontWeight: 400, letterSpacing: "0.06em" },
  },
  {
    role: "Table cell",
    reference: "14px · 400",
    current: "16px · 400",
    sample: "Hybrid Active Noise Cancelling",
    style: { fontSize: 14, fontWeight: 400 },
  },
  {
    role: "Table second line",
    reference: "12px · 400",
    current: "14px · 400",
    sample: "MRN 448120",
    style: { fontSize: 12, fontWeight: 400 },
  },
  {
    role: "Caption",
    reference: "12px · 400",
    current: "12px · 400",
    sample: "vs. 14,653 last period",
    style: { fontSize: 12, fontWeight: 400 },
  },
];

function TypeTable() {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-card pb-0">
        <CardHeader
          title="Reference typography"
          description="Measured from the reference image, set in Roboto. Applied to the canvas in phase 2."
        />
      </div>
      <div className="mt-stack-md">
        <Table minWidth={640}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Reference</TableHeaderCell>
              <TableHeaderCell>Before</TableHeaderCell>
              <TableHeaderCell>Sample</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {TYPE_SCALE.map((row) => (
              <TableRow key={row.role}>
                <TableCell emphasis>{row.role}</TableCell>
                <TableCell>{row.reference}</TableCell>
                <TableCell>{row.current}</TableCell>
                <TableCell>
                  <span className="text-fg" style={row.style}>
                    {row.sample}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function Swatch({ hex }: { hex: string }) {
  if (hex === "—") return <span className="text-caption text-fg-muted">—</span>;
  return (
    <span className="inline-flex items-center gap-inline-sm">
      <span
        className="h-6 w-6 shrink-0 rounded-chip border border-line"
        style={{ background: hex }}
      />
      <code className="text-label-sm text-fg">{hex}</code>
    </span>
  );
}

function PaletteTable() {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-card pb-0">
        <CardHeader
          title="Reference colours"
          description="Sampled from the reference image. Applied to the canvas in phase 2."
        />
      </div>
      <div className="mt-stack-md">
        <Table minWidth={640}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Reference</TableHeaderCell>
              <TableHeaderCell>Before</TableHeaderCell>
              <TableHeaderCell>Contrast / note</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {PALETTE.map((row) => (
              <TableRow key={row.role}>
                <TableCell emphasis>{row.role}</TableCell>
                <TableCell>
                  <Swatch hex={row.reference} />
                </TableCell>
                <TableCell>
                  <Swatch hex={row.current} />
                </TableCell>
                <TableCell>{row.note}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------------------
   Shapes, borders and icons — measured, then listed.
   --------------------------------------------------------------------------- */

const SHAPES: [string, string, string][] = [
  [
    "Card",
    "20px corners · 24px padding · 1px #e5e7ea · faint shadow",
    "12px · 24px · 1px #eff1f6 · no shadow",
  ],
  [
    "Box inside a card",
    "14px corners · same 1px hairline · white",
    "Mixed (12px, 14px, 16px)",
  ],
  [
    "Breakdown (e.g. Customers)",
    "One 8px bar split by share, 4px gaps, round ends · three columns under 1px dividers: dot + label, figure, share",
    "—",
  ],
  [
    "Status tag · trend chip",
    "8px corners · ~23px tall · tint fill, no border",
    "2px corners",
  ],
  [
    "Toolbar button",
    "Pill · 1px hairline · white; primary blue with a top sheen",
    "8px corners",
  ],
  [
    "Icon button",
    "40px circle · white · 1px #e5e7ea hairline · no shadow · near-black 16px outline glyph",
    "36px · 4px corners · grey-300 border · shadow",
  ],
  [
    "Card menu “⋯”",
    "Ghost: three grey dots only, no border or fill; light grey circle on hover",
    "36px box with a dark outline",
  ],
  [
    "Search box",
    "40px pill · light grey fill · 1px hairline · grey magnifier · white ⌘K key chip on the right",
    "4px corners, no key chip",
  ],
  [
    "Dropdown (toolbar)",
    "Joined to the date range in one 40px pill, hairline divider; light chevron",
    "Separate select, 4px corners",
  ],
  [
    "Form field",
    "44px · 12px corners · light grey fill (#f5f7f9), white while typing · 1px hairline · label above, hint below",
    "44px · 8px corners",
  ],
  [
    "Message box",
    "Grey pill · round attach and mic buttons · round blue send button",
    "—",
  ],
  [
    "Table thumbnail",
    "30px square · 6px corners · 1px hairline · #fafcfc",
    "—",
  ],
  ["Chart bar", "30px wide · 8px corners · #eef0f4, one blue", "—"],
  ["Tooltip", "White · ~8px corners · soft shadow", "—"],
];

const ICONS: [string, string, string][] = [
  [
    "Stat card",
    "Filled · 20px · brand blue · top right, no tile",
    "36px glyph on a 64px tinted tile",
  ],
  ["Segment · legend", "Filled · 16px · in the segment colour", "—"],
  ["Button · toolbar", "Outline · 16px · text colour", "Outline · 16–24px"],
  ["Top bar", "Outline · 20px · inside a 40px circle", "Outline"],
  ["Table · status", "Outline circle arrow · 14px · status colour", "—"],
  ["Sidebar", "Unchanged — the sidebar is not touched", "—"],
];

function SpecTable({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: [string, string, string][];
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-card pb-0">
        <CardHeader title={title} description={description} />
      </div>
      <div className="mt-stack-md">
        <Table minWidth={640}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Element</TableHeaderCell>
              <TableHeaderCell>Reference</TableHeaderCell>
              <TableHeaderCell>Before</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(([element, reference, today]) => (
              <TableRow key={element}>
                <TableCell emphasis>{element}</TableCell>
                <TableCell>{reference}</TableCell>
                <TableCell>{today}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------------------
   Inputs. The real Input / Select / FormField in both panels; on the right
   they take the reference tokens. The date-range pill and the composer are
   compositions the reference shows (toolbar filter, "Ask me anything…"),
   drawn here to agree on the look before phase 3 makes them components.
   --------------------------------------------------------------------------- */

/* The real DateRangeFilter and Composer, with state, for the preview. */
function PeriodFilter() {
  const [period, setPeriod] = React.useState("30");
  return (
    <DateRangeFilter
      rangeLabel="Jan 1, 2025 – Feb 1, 2025"
      period={period}
      onPeriodChange={setPeriod}
      periods={[
        { value: "7", label: "Last 7 days" },
        { value: "30", label: "Last 30 days" },
        { value: "90", label: "Last 90 days" },
      ]}
    />
  );
}

function ComposerDemo() {
  const [message, setMessage] = React.useState("");
  return (
    <Composer
      label="Message"
      placeholder="Ask me anything…"
      value={message}
      onChange={setMessage}
      onSend={() => setMessage("")}
      onAttach={() => {}}
      onDictate={() => {}}
    />
  );
}

function Inputs({ reference }: { reference: boolean }) {
  return (
    <Card>
      <CardHeader title="Inputs" />
      <CardBody className="space-y-stack-lg">
        <SearchField
          label="Search"
          placeholder="Search anything…"
          shortcut={reference}
        />
        {reference ? (
          <PeriodFilter />
        ) : (
          <Select selectSize="small" aria-label="Period" defaultValue="30">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </Select>
        )}
        <div className="grid gap-stack-lg sm:grid-cols-2">
          <FormField label="Full name" hint="As it appears on the chart.">
            {(field) => <Input {...field} placeholder="John Taylor" />}
          </FormField>
          <FormField label="Dialysis type">
            {(field) => (
              <Select {...field} defaultValue="hd">
                <option value="hd">In-centre haemodialysis</option>
                <option value="home">Home haemodialysis</option>
                <option value="pd">Peritoneal dialysis</option>
              </Select>
            )}
          </FormField>
        </div>
        {reference ? <ComposerDemo /> : null}
      </CardBody>
    </Card>
  );
}

/* ---------------------------------------------------------------------------
   Charts, as the reference draws them. Prototypes: phase 3 folds these
   looks into LineChart and BarChart. The left panel shows today's charts.
   --------------------------------------------------------------------------- */

const TREATMENTS_THIS = [42, 48, 45, 52, 60, 58, 66, 62, 70, 74, 72, 80];
const TREATMENTS_LAST = [38, 40, 44, 41, 47, 52, 50, 55, 53, 58, 61, 63];
const TREATMENT_DAYS = [
  "1 Jan",
  "4 Jan",
  "6 Jan",
  "8 Jan",
  "11 Jan",
  "13 Jan",
  "15 Jan",
  "18 Jan",
  "20 Jan",
  "22 Jan",
  "25 Jan",
  "29 Jan",
];

const WEEKDAYS = [
  { day: "Sun", value: 52 },
  { day: "Mon", value: 40 },
  { day: "Tue", value: 81 },
  { day: "Wed", value: 38 },
  { day: "Thu", value: 30 },
  { day: "Fri", value: 47 },
  { day: "Sat", value: 56 },
];

function MoreButton() {
  return (
    <Button
      variant="neutral"
      appearance="ghost"
      size="small"
      iconOnly
      aria-label="More"
      className="-my-[9px]"
    >
      <MoreSolid />
    </Button>
  );
}

function Charts({ reference }: { reference: boolean }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader
          title="Treatments completed"
          action={reference ? <MoreButton /> : undefined}
        />
        <CardBody>
          {reference ? (
            <LineChart
              label="Treatments completed per day in January"
              xLabels={TREATMENT_DAYS}
              yMin={0}
              yMax={100}
              series={[
                {
                  id: "this",
                  label: "This month",
                  tone: "brand",
                  points: TREATMENTS_THIS,
                },
                {
                  id: "last",
                  label: "Last month",
                  tone: "neutral",
                  points: TREATMENTS_LAST,
                  dashed: true,
                },
              ]}
            />
          ) : (
            <LineChart
              label="Treatments completed per day in January"
              xLabels={TREATMENT_DAYS}
              yMin={0}
              yMax={100}
              series={[
                {
                  id: "this",
                  label: "This month",
                  tone: "brand",
                  points: TREATMENTS_THIS,
                },
                {
                  id: "last",
                  label: "Last month",
                  tone: "neutral",
                  points: TREATMENTS_LAST,
                },
              ]}
            />
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          title="Most active day"
          action={reference ? <MoreButton /> : undefined}
        />
        <CardBody>
          {reference ? (
            <BarChart
              label="Check-ins by weekday"
              highlight="max"
              yMax={100}
              bars={WEEKDAYS.map(({ day, value }) => ({ label: day, value }))}
            />
          ) : (
            <BarChart
              label="Check-ins by weekday"
              bars={WEEKDAYS.map(({ day, value }) => ({ label: day, value }))}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}

/* The reference top bar: search on the left; theme, notifications and the
   avatar on the right; white, with a hairline under it. It bleeds to the
   panel's edges the way the real one spans the canvas. */
function TopBar() {
  return (
    <div className="-mx-inset-lg -mt-inset-lg mb-stack-xl flex items-center justify-between gap-inline-md rounded-t-panel border-b border-line bg-surface px-inset-lg py-inset-sm">
      <div className="w-full max-w-xs">
        <SearchField label="Search" placeholder="Search anything…" shortcut />
      </div>
      <div className="flex items-center gap-inline-md">
        <Button
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          iconOnly
          aria-label="Theme"
        >
          <Sun />
        </Button>
        <Button
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          iconOnly
          aria-label="Notifications"
        >
          <Bell />
        </Button>
        <span
          aria-label="Jenny Wilson"
          role="img"
          className="flex h-control-small w-control-small items-center justify-center rounded-pill border border-line bg-surface-brand-subtle text-label-sm text-fg-brand"
        >
          JW
        </span>
      </div>
    </div>
  );
}

const ROWS = [
  {
    name: "John Taylor",
    mrn: "448120",
    access: "AV Fistula",
    status: "Active",
  },
  { name: "Maria Lopez", mrn: "448121", access: "AV Graft", status: "Review" },
  { name: "David Chen", mrn: "448122", access: "Catheter", status: "Concern" },
] as const;

const statusTone = {
  Active: "success",
  Review: "warning",
  Concern: "danger",
} as const;

/** One set of real components. Rendered once per panel; `reference`
 *  swaps in the phase 3 shapes (stat card, segments) on the right. */
function Sample({ reference = false }: { reference?: boolean }) {
  return (
    <div className="space-y-stack-xl">
      {/* Reference: the top bar, then the title with its toolbar. */}
      {reference ? (
        <>
          <TopBar />
          <div className="flex flex-wrap items-center justify-between gap-inline-md">
            <h1 className="text-heading-1 text-fg">Dashboard</h1>
            <div className="flex flex-wrap items-center gap-inline-md">
              <PeriodFilter />
              <Button variant="neutral" appearance="fill-stroke" size="small">
                <LayoutGrid />
                Add widget
              </Button>
              <Button size="small">
                <Download />
                Export
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-inline-md">
          <h1 className="text-heading-1 text-fg">Dashboard</h1>
          <div className="flex flex-wrap items-center gap-inline-md">
            <Button
              variant="neutral"
              appearance="fill-stroke"
              size="small"
              iconOnly
              aria-label="Theme"
            >
              <Sun />
            </Button>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              size="small"
              iconOnly
              aria-label="Notifications"
            >
              <Bell />
            </Button>
            <Button variant="neutral" appearance="fill-stroke" size="small">
              Last 30 days
            </Button>
            <Button size="small">
              <Download />
              Export
            </Button>
          </div>
        </div>
      )}

      {/* Stat cards: the real KeyCard (phase 3). Right shows the trend chip. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <KeyCard
          icon={<UsersSolid />}
          value="2,884"
          label="Active Members"
          {...(reference
            ? {
                trend: {
                  direction: "up",
                  value: "15.5%",
                  suffix: "vs. 2,496 last period",
                } as const,
              }
            : { note: "77% of seats taken" })}
        />
        <KeyCard
          icon={<ClockSolid />}
          tone="warning"
          value="12"
          label="Need Follow-Up"
          {...(reference
            ? {
                trend: {
                  direction: "up",
                  value: "10.5%",
                  suffix: "vs. 11 last period",
                  good: false,
                } as const,
              }
            : { note: "13% of members" })}
        />
      </div>

      {/* A content card with a nested box. */}
      <Card>
        <CardHeader
          title="Customers"
          action={
            <Button
              variant="neutral"
              appearance={reference ? "ghost" : "stroke"}
              size="small"
              iconOnly
              aria-label="More"
              /* The 40px target overhangs the 22px title line equally above
                 and below, so the dots sit on the title's centre line. */
              className={reference ? "-my-[9px]" : undefined}
            >
              {reference ? <MoreSolid /> : <MoreHorizontal />}
            </Button>
          }
        />
        <CardBody>
          {reference ? (
            <Breakdown
              label="Customers"
              items={[
                { label: "Retailers", value: 2884, tone: "brand" },
                { label: "Distributors", value: 1432, tone: "success" },
                { label: "Wholesalers", value: 562, tone: "warning" },
              ]}
            />
          ) : (
            <div className="grid grid-cols-3 gap-inline-md rounded-card-nested border border-line p-inset-md">
              {[
                ["2,884", "Retailers"],
                ["1,432", "Distributors"],
                ["562", "Wholesalers"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="text-metric-sm text-fg">{value}</p>
                  <p className="text-caption text-fg-muted">{label}</p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Charts. */}
      <Charts reference={reference} />

      {/* Search, filters, form fields and the composer. */}
      <Inputs reference={reference} />

      {/* A table card with status tags. */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-card pb-0">
          <CardHeader title="Patients" />
        </div>
        <div className="mt-stack-md">
          <Table minWidth={0}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Patient</TableHeaderCell>
                <TableHeaderCell>Access</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ROWS.map((row) => (
                <TableRow key={row.mrn}>
                  <TableCell emphasis>
                    <span className="flex items-center gap-inline-md">
                      {reference ? <TableThumb name={row.name} /> : null}
                      <span>
                        {row.name}
                        <span className="block text-caption font-normal text-fg-muted tabular-nums">
                          MRN {row.mrn}
                        </span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>{row.access}</TableCell>
                  <TableCell>
                    <Badge tone={statusTone[row.status]}>{row.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function Panel({
  label,
  note,
  reference = false,
}: {
  label: string;
  note: string;
  reference?: boolean;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-stack-sm">
        <p className="text-label-md text-fg">{label}</p>
        <p className="text-caption text-fg-muted">{note}</p>
      </div>
      {/* The panel is drawn on --canvas, so each side shows its own page
          background behind the cards. */}
      <div className="rounded-panel border border-line bg-canvas p-inset-lg">
        <Sample reference={reference} />
      </div>
    </section>
  );
}

export function ReferencePreview() {
  return (
    <div className="space-y-stack-lg">
      <div className="max-w-3xl space-y-stack-xs">
        <h2 className="text-heading-4 text-fg">Reference style</h2>
        <p className="text-body-md text-fg-secondary">
          Every value below is live on the canvas since phase 2. Left: the
          components as built today. Right: the phase 3 layouts, still
          prototypes here.
        </p>
      </div>
      <PaletteTable />
      <TypeTable />
      <SpecTable
        title="Reference shapes and borders"
        description="Measured from the reference image. Applied to the canvas in phase 2."
        rows={SHAPES}
      />
      <SpecTable
        title="Reference icons"
        description="Filled for stat cards and legends, outline everywhere else."
        rows={ICONS}
      />
      <div className="grid gap-inset-lg xl:grid-cols-2">
        <Panel
          label="Components as built"
          note="Today's component layouts, on the new canvas tokens."
        />
        <Panel
          label="Phase 3 layouts"
          note="Phase 3 layouts: stat card, breakdown, charts, top bar, filters, thumbnails."
          reference
        />
      </div>
    </div>
  );
}

export default ReferencePreview;
