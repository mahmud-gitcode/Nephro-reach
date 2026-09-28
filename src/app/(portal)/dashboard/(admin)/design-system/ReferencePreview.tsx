"use client";

import React from "react";
import {
  ArrowUp,
  Bell,
  Calendar,
  ChevronDown,
  Download,
  LayoutGrid,
  Mic,
  MoreHorizontal,
  Paperclip,
  Search,
  Sun,
} from "lucide-react";
import { ClockSolid, MoreSolid, UsersSolid } from "@/components/icons/solid";
import {
  Badge,
  BarChart,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormField,
  Input,
  KeyCard,
  LineChart,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
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
   The reference stat card. Preview-only here; it replaces KeyCard's layout
   in phase 3. Measured: 24px padding; title top left (16px medium); a 20px
   filled brand-blue icon top right; the figure with a trend chip beside it;
   a 12px muted comparison line under it.
   --------------------------------------------------------------------------- */

function TrendChip({
  direction,
  value,
  good = direction === "up",
}: {
  direction: "up" | "down";
  value: string;
  good?: boolean;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-inline-xs rounded-status px-inset-xs py-0.5 text-label-sm " +
        (good
          ? "bg-success-surface text-success"
          : "bg-danger-surface text-danger")
      }
    >
      <svg
        viewBox="0 0 8 5"
        aria-hidden="true"
        className="h-[5px] w-2 fill-current"
      >
        <path d={direction === "up" ? "M4 0l4 5H0z" : "M4 5L0 0h8z"} />
      </svg>
      {value}
    </span>
  );
}

function RefKeyCard({
  title,
  icon,
  value,
  trend,
  note,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  trend: React.ComponentProps<typeof TrendChip>;
  note: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-inline-md">
        <h3 className="text-heading-5 text-fg">{title}</h3>
        <span
          aria-hidden="true"
          className="text-fg-brand [&_svg]:h-5 [&_svg]:w-5"
        >
          {icon}
        </span>
      </div>
      <div className="mt-stack-xl flex flex-wrap items-center gap-inline-lg">
        <p className="text-metric-lg text-fg">{value}</p>
        <TrendChip {...trend} />
      </div>
      <p className="mt-stack-sm text-caption text-fg-muted">{note}</p>
    </Card>
  );
}

/* A breakdown ("Customers"), redesigned after review: the reference's
   bracket segments (left line + wash + thick foot bar) read busy. Now one
   slim bar shows the split, and three columns under hairline dividers give
   each part a dot, its label, the figure and its share. No box inside the
   card. Colours are the contrast-safe shades from the palette above. */
const SEGMENTS = [
  { count: 2884, label: "Retailers", colour: "#2065ff" },
  { count: 1432, label: "Distributors", colour: "#3ea76d" },
  { count: 562, label: "Wholesalers", colour: "#ed710b" },
];

function Segments() {
  const total = SEGMENTS.reduce((sum, segment) => sum + segment.count, 0);
  const share = (count: number) => Math.round((count / total) * 100);

  return (
    <div className="space-y-stack-lg">
      {/* The split. Decorative: the columns below carry the same numbers
          as text, so a screen reader is not read a bar it cannot see. */}
      <div aria-hidden="true" className="flex h-2 gap-1">
        {SEGMENTS.map((segment) => (
          <span
            key={segment.label}
            className="rounded-pill"
            style={{
              width: `${(segment.count / total) * 100}%`,
              background: segment.colour,
            }}
          />
        ))}
      </div>

      <dl className="grid grid-cols-3 divide-x divide-line">
        {SEGMENTS.map((segment) => (
          <div key={segment.label} className="px-inset-md first:pl-0 last:pr-0">
            <dt className="flex items-center gap-inline-sm text-caption text-fg-muted">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-pill"
                style={{ background: segment.colour }}
              />
              {segment.label}
            </dt>
            <dd className="mt-stack-xs flex items-baseline gap-inline-sm">
              <span className="text-metric-md text-fg">
                {segment.count.toLocaleString("en-US")}
              </span>
              <span className="text-caption text-fg-muted">
                {share(segment.count)}%
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Inputs. The real Input / Select / FormField in both panels; on the right
   they take the reference tokens. The date-range pill and the composer are
   compositions the reference shows (toolbar filter, "Ask me anything…"),
   drawn here to agree on the look before phase 3 makes them components.
   --------------------------------------------------------------------------- */

function SearchField({ reference }: { reference: boolean }) {
  return (
    <div className="relative">
      <Input
        inputSize="small"
        leadingIcon={<Search />}
        placeholder="Search anything…"
        aria-label="Search"
      />
      {reference ? (
        <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded-status border border-line bg-surface px-1.5 font-sans text-label-sm text-fg-muted">
          ⌘K
        </kbd>
      ) : null}
    </div>
  );
}

/* The reference's toolbar filter: the date range and the period, joined in
   one pill with a hairline between them. */
function DateRangeFilter() {
  return (
    <div className="inline-flex h-control-small items-stretch overflow-hidden rounded-pill border border-line bg-surface text-body-sm text-fg">
      <button
        type="button"
        className="flex cursor-pointer items-center gap-inline-sm px-inset-sm hover:bg-surface-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <Calendar
          aria-hidden="true"
          className="h-icon-small w-icon-small text-fg-secondary"
        />
        Jan 1, 2025 – Feb 1, 2025
      </button>
      <span aria-hidden="true" className="w-px bg-line" />
      <button
        type="button"
        aria-haspopup="listbox"
        className="flex cursor-pointer items-center gap-inline-sm px-inset-sm hover:bg-surface-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        Last 30 days
        <ChevronDown
          aria-hidden="true"
          className="h-icon-small w-icon-small text-fg-icon-quiet"
        />
      </button>
    </div>
  );
}

/* The reference's "Ask me anything…" box: a grey pill holding round attach
   and mic buttons and a round primary send button. */
function Composer() {
  return (
    <div className="flex items-center gap-inline-sm rounded-pill border border-line bg-surface-sunken p-1.5">
      <Button
        variant="neutral"
        appearance="fill-stroke"
        size="small"
        iconOnly
        aria-label="Attach a file"
      >
        <Paperclip />
      </Button>
      <input
        aria-label="Message"
        placeholder="Ask me anything…"
        className="min-w-0 flex-1 bg-transparent text-body-md text-fg placeholder:text-fg-muted focus-visible:outline-none"
      />
      <Button
        variant="neutral"
        appearance="fill-stroke"
        size="small"
        iconOnly
        aria-label="Dictate"
      >
        <Mic />
      </Button>
      <Button size="small" iconOnly aria-label="Send">
        <ArrowUp />
      </Button>
    </div>
  );
}

function Inputs({ reference }: { reference: boolean }) {
  return (
    <Card>
      <CardHeader title="Inputs" />
      <CardBody className="space-y-stack-lg">
        <SearchField reference={reference} />
        {reference ? (
          <DateRangeFilter />
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
        {reference ? <Composer /> : null}
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

/* Area chart: the current period as a 2px brand line over a faint brand
   gradient, the previous period as a dashed grey line, dashed gridlines,
   and a white tooltip card that follows the pointer. */
function RefAreaChart() {
  const gradientId = React.useId();
  const [active, setActive] = React.useState(7);
  const W = 560;
  const H = 200;
  // Label text is 14 units: once the SVG scales into a card it renders at
  // ~12.7px, so the 12px floor holds.
  const left = 36;
  const right = 8;
  const top = 12;
  const bottom = 30;
  const n = TREATMENTS_THIS.length;
  const x = (i: number) => left + (i * (W - left - right)) / (n - 1);
  const y = (v: number) => top + (1 - v / 100) * (H - top - bottom);
  const line = (values: number[]) =>
    values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  const area = `${line(TREATMENTS_THIS)} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Treatments completed per day in January, this month against last month"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-brand-600)"
              stopOpacity="0.16"
            />
            <stop
              offset="100%"
              stopColor="var(--color-brand-600)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line
              x1={left}
              x2={W - right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--line)"
              strokeDasharray="4 4"
            />
            <text
              x={left - 8}
              y={y(tick) + 4}
              textAnchor="end"
              fontSize="14"
              fill="var(--fg-muted)"
            >
              {tick}
            </text>
          </g>
        ))}
        {[0, 3, 6, 9, 11].map((i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            // The end labels hug the plot's edges instead of spilling past.
            textAnchor={i === 0 ? "start" : i === 11 ? "end" : "middle"}
            fontSize="14"
            fill="var(--fg-muted)"
          >
            {TREATMENT_DAYS[i]}
          </text>
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line(TREATMENTS_LAST)}
          fill="none"
          stroke="#b9bdc4"
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />
        <path
          d={line(TREATMENTS_THIS)}
          fill="none"
          stroke="var(--color-brand-600)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <line
          x1={x(active)}
          x2={x(active)}
          y1={top}
          y2={y(0)}
          stroke="#9ca0a6"
          strokeDasharray="3 3"
        />
        <circle
          cx={x(active)}
          cy={y(TREATMENTS_THIS[active])}
          r="4.5"
          fill="var(--surface)"
          stroke="var(--color-brand-600)"
          strokeWidth="2"
        />
        {TREATMENTS_THIS.map((_, i) => (
          <rect
            key={i}
            x={x(i) - (W - left - right) / (n - 1) / 2}
            y={top}
            width={(W - left - right) / (n - 1)}
            height={y(0) - top}
            fill="transparent"
            onMouseEnter={() => setActive(i)}
          />
        ))}
      </svg>
      <div
        /* Beside the point, never on it, so the dot and the guide line stay
           visible: to its right, or to its left past the middle. */
        className={
          "pointer-events-none absolute top-2 w-44 rounded-[10px] border border-line bg-surface px-inset-sm py-inset-xs shadow-md " +
          (active > (n - 1) / 2
            ? "-translate-x-[calc(100%+12px)]"
            : "translate-x-3")
        }
        style={{ left: `${(x(active) / W) * 100}%` }}
      >
        <p className="text-label-sm text-fg">{TREATMENT_DAYS[active]}, 2025</p>
        <p className="mt-stack-xs flex items-center gap-inline-sm text-caption text-fg-muted">
          <span
            aria-hidden="true"
            className="h-0.5 w-3 rounded-pill bg-brand-600"
          />
          <span className="font-semibold text-fg">
            {TREATMENTS_THIS[active]}
          </span>{" "}
          this month
        </p>
        <p className="flex items-center gap-inline-sm text-caption text-fg-muted">
          <span
            aria-hidden="true"
            className="w-3 border-t-2 border-dashed border-[#b9bdc4]"
          />
          <span className="font-semibold text-fg">
            {TREATMENTS_LAST[active]}
          </span>{" "}
          last month
        </p>
      </div>
    </div>
  );
}

const WEEKDAYS = [
  { day: "Sun", value: 52 },
  { day: "Mon", value: 40 },
  { day: "Tue", value: 81 },
  { day: "Wed", value: 38 },
  { day: "Thu", value: 30 },
  { day: "Fri", value: 47 },
  { day: "Sat", value: 56 },
];

/* Bars: light grey rounded columns, the peak in a brand gradient with its
   value above it and its day label in brand blue. Dashed gridlines with a
   value scale on the left (the same treatment as the area chart) let each
   bar be read as a quantity, not only compared by height. */
const BAR_SCALE = 100;
const BAR_TICKS = [0, 25, 50, 75, 100];

function RefBarChart() {
  const max = Math.max(...WEEKDAYS.map((d) => d.value));
  const pct = (v: number) => `${(v / BAR_SCALE) * 100}%`;

  return (
    <div
      role="img"
      aria-label={`Check-ins by weekday: ${WEEKDAYS.map((d) => `${d.day} ${d.value}`).join(", ")}.`}
    >
      <div className="flex gap-inline-sm">
        {/* The scale. Each label is centred on its gridline. */}
        <div aria-hidden="true" className="relative h-44 w-7 shrink-0">
          {BAR_TICKS.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 translate-y-1/2 text-caption text-fg-muted tabular-nums"
              style={{ bottom: pct(tick) }}
            >
              {tick}
            </span>
          ))}
        </div>

        <div className="relative h-44 flex-1">
          {BAR_TICKS.map((tick) => (
            <span
              key={tick}
              aria-hidden="true"
              className="absolute inset-x-0 border-t border-dashed border-line"
              style={{ bottom: pct(tick) }}
            />
          ))}

          <div className="absolute inset-0 flex items-end justify-between gap-inline-md">
            {WEEKDAYS.map(({ day, value }) => {
              const peak = value === max;
              return (
                <div
                  key={day}
                  className="relative flex h-full flex-1 items-end justify-center"
                >
                  <span
                    className="relative w-full max-w-[30px] rounded-[8px] border"
                    style={{
                      height: pct(value),
                      background: peak
                        ? "linear-gradient(to bottom, #2065ff, #6a95ff)"
                        : "#eef0f4",
                      borderColor: peak ? "transparent" : "#e6e8ec",
                    }}
                  >
                    {peak ? (
                      <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 text-label-sm text-fg">
                        {value}
                      </span>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day labels, under the plot and clear of the scale column. */}
      <div
        aria-hidden="true"
        // 34px = the 28px scale column + its 6px gap.
        className="mt-stack-sm ml-8.5 flex justify-between gap-inline-md"
      >
        {WEEKDAYS.map(({ day, value }) => (
          <span
            key={day}
            className={
              "flex-1 text-center " +
              (value === max
                ? "text-label-sm text-fg-brand"
                : "text-caption text-fg-muted")
            }
          >
            {day}
          </span>
        ))}
      </div>
    </div>
  );
}

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
            <RefAreaChart />
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
            <RefBarChart />
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
        <SearchField reference />
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

/* A table thumbnail: 32px square, 6px corners, hairline, near-white fill.
   Patients have no product photo, so it holds their initials. */
function Thumb({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("");
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-line bg-[#fafcfc] text-label-sm text-fg-secondary"
    >
      {initials}
    </span>
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
              <DateRangeFilter />
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

      {/* Stat cards: today's KeyCard, or the reference layout. */}
      <div className="grid gap-4 sm:grid-cols-2">
        {reference ? (
          <>
            <RefKeyCard
              title="Active Members"
              icon={<UsersSolid />}
              value="2,884"
              trend={{ direction: "up", value: "15.5%" }}
              note="vs. 2,496 last period"
            />
            <RefKeyCard
              title="Need Follow-Up"
              icon={<ClockSolid />}
              value="12"
              trend={{ direction: "up", value: "10.5%", good: false }}
              note="vs. 11 last period"
            />
          </>
        ) : (
          <>
            <KeyCard
              icon={<UsersSolid />}
              value="2,884"
              label="Active Members"
            />
            <KeyCard
              icon={<ClockSolid />}
              tone="warning"
              value="12"
              label="Need Follow-Up"
            />
          </>
        )}
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
            <Segments />
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
                      {reference ? <Thumb name={row.name} /> : null}
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
