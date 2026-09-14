"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  Copy,
  Droplet,
  Frown,
  Info,
  Meh,
  Pencil,
  Plus,
  Search,
  Smile,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Chip,
  ChipGroup,
  CardFooter,
  CardHeader,
  EmptyState,
  FormField,
  Input,
  Modal,
  BarChart,
  ChartLegend,
  DonutChart,
  LineChart,
  Progress,
  RadioCard,
  RadioGroup,
  Select,
  Switch,
  SwitchRow,
  TabPanel,
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TablePagination,
  TableRow,
  TableSkeleton,
  Tabs,
  Textarea,
  type SortDirection,
} from "@/components/ui";

/* ------------------------------------------------------------------ */
/*  Page-local helpers                                                 */
/* ------------------------------------------------------------------ */

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-stack-md">
      <h2 className="text-heading-4 text-fg">{title}</h2>
      {children}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <Card tone="flat" padding="big" className="space-y-stack-md">
      {label ? <p className="text-overline text-fg-muted">{label}</p> : null}
      <div className="flex flex-wrap items-center gap-inline-lg">
        {children}
      </div>
    </Card>
  );
}

function Ramp({ name, steps }: { name: string; steps: string[] }) {
  return (
    <div>
      <p className="mb-stack-xs text-overline text-fg-muted">{name}</p>
      <div className="flex overflow-hidden rounded-card border border-line">
        {steps.map((s) => (
          <div key={s} className={`h-12 flex-1 ${s}`} />
        ))}
      </div>
    </div>
  );
}

function TokenSwatch({
  name,
  swatch,
  note,
}: {
  name: string;
  swatch: string;
  note: string;
}) {
  return (
    <div className="flex items-center gap-inline-lg">
      <span
        className={`h-8 w-8 shrink-0 rounded-chip border border-line ${swatch}`}
      />
      <div className="min-w-0">
        <code className="text-label-sm text-fg">{name}</code>
        <p className="text-caption text-fg-muted">{note}</p>
      </div>
    </div>
  );
}

function TypeSpec({
  token,
  meta,
  children,
}: {
  token: string;
  meta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-baseline gap-x-6 gap-y-1 border-t border-line-subtle py-inset-sm sm:grid-cols-[180px_1fr]">
      <div>
        <code className="text-label-sm text-fg-brand">{token}</code>
        <p className="text-caption text-fg-muted">{meta}</p>
      </div>
      <div className="min-w-0 text-fg">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

type Tab = "color" | "typography" | "shadow" | "component";

const COMPONENTS = [
  { id: "all", label: "All" },
  { id: "button", label: "Button" },
  { id: "modal", label: "Modal" },
  { id: "card", label: "Card" },
  { id: "badge", label: "Badge" },
  { id: "input", label: "Input · Textarea · Select" },
  { id: "formfield", label: "FormField" },
  { id: "table", label: "Table" },
  { id: "emptystate", label: "EmptyState" },
  { id: "alert", label: "Alert" },
  { id: "tabs", label: "Tabs" },
  { id: "chip", label: "Chip" },
  { id: "switch", label: "Switch" },
  { id: "radiogroup", label: "RadioGroup" },
  { id: "progress", label: "Progress" },
  { id: "chart", label: "Charts" },
] as const;

type ComponentId = (typeof COMPONENTS)[number]["id"];

const LABS = [
  { test: "Creatinine", result: "8.2", range: "0.7 – 1.3", status: "High" },
  { test: "Albumin", result: "3.9", range: "3.5 – 5.0", status: "Normal" },
  { test: "Calcium", result: "9.1", range: "8.5 – 10.2", status: "Normal" },
  { test: "Potassium", result: "5.8", range: "3.5 – 5.1", status: "High" },
];

export default function DesignSystemPage() {
  const [tab, setTab] = useState<Tab>("color");
  const [component, setComponent] = useState<ComponentId>("all");

  const [modalSize, setModalSize] = useState<"small" | "big" | "wide" | null>(
    null,
  );
  const [sort, setSort] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [tableState, setTableState] = useState<"data" | "loading" | "empty">(
    "data",
  );
  const [demoTab, setDemoTab] = useState("overview");
  const [chips, setChips] = useState<string[]>(["counts"]);
  const [switchOn, setSwitchOn] = useState(true);
  const [notify, setNotify] = useState(true);
  const [mood, setMood] = useState("good");
  const [answer, setAnswer] = useState("yes");

  const show = (id: ComponentId) => component === "all" || component === id;

  return (
    <div className="space-y-stack-2xl pb-section-lg">
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-inline-lg">
        <h1 className="text-heading-2 text-fg">Design System</h1>
        <Badge tone="info" icon={<Info />}>
          Admin only
        </Badge>
      </div>

      {/* ---------------- Tabs ---------------- */}
      <div
        role="tablist"
        aria-label="Design system sections"
        className="flex gap-inline-md border-b border-line"
      >
        {(
          [
            ["color", "Color"],
            ["typography", "Typography"],
            ["shadow", "Shadow"],
            ["component", "Component"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`-mb-px cursor-pointer border-b-2 px-inset-sm pb-inset-xs text-label-lg transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              tab === id
                ? "border-primary-edge text-fg-brand"
                : "border-transparent text-fg-muted hover:text-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ================= COLOR ================= */}
      {tab === "color" ? (
        <div className="space-y-stack-2xl">
          <Block title="Ramps">
            <Card tone="flat" className="space-y-stack-lg">
              <Ramp
                name="Brand · hue 262.9° · 600 = #2563EB"
                steps={[
                  "bg-brand-50",
                  "bg-brand-100",
                  "bg-brand-200",
                  "bg-brand-300",
                  "bg-brand-400",
                  "bg-brand-500",
                  "bg-brand-600",
                  "bg-brand-700",
                  "bg-brand-800",
                  "bg-brand-900",
                  "bg-brand-950",
                ]}
              />
              <Ramp
                name="Accent · violet · hue 300°"
                steps={[
                  "bg-accent-50",
                  "bg-accent-100",
                  "bg-accent-200",
                  "bg-accent-300",
                  "bg-accent-400",
                  "bg-accent-500",
                  "bg-accent-600",
                  "bg-accent-700",
                  "bg-accent-800",
                  "bg-accent-900",
                  "bg-accent-950",
                ]}
              />
              <Ramp
                name="Gray · blue-biased · hue 262.9°"
                steps={[
                  "bg-gray-50",
                  "bg-gray-100",
                  "bg-gray-200",
                  "bg-gray-300",
                  "bg-gray-400",
                  "bg-gray-500",
                  "bg-gray-600",
                  "bg-gray-700",
                  "bg-gray-800",
                  "bg-gray-900",
                  "bg-gray-950",
                ]}
              />
              <Ramp
                name="Success · hue 150°"
                steps={[
                  "bg-success-50",
                  "bg-success-100",
                  "bg-success-200",
                  "bg-success-300",
                  "bg-success-400",
                  "bg-success-500",
                  "bg-success-600",
                  "bg-success-700",
                  "bg-success-800",
                  "bg-success-900",
                  "bg-success-950",
                ]}
              />
              <Ramp
                name="Warning · hue 70°"
                steps={[
                  "bg-warning-50",
                  "bg-warning-100",
                  "bg-warning-200",
                  "bg-warning-300",
                  "bg-warning-400",
                  "bg-warning-500",
                  "bg-warning-600",
                  "bg-warning-700",
                  "bg-warning-800",
                  "bg-warning-900",
                  "bg-warning-950",
                ]}
              />
              <Ramp
                name="Danger · hue 27°"
                steps={[
                  "bg-danger-50",
                  "bg-danger-100",
                  "bg-danger-200",
                  "bg-danger-300",
                  "bg-danger-400",
                  "bg-danger-500",
                  "bg-danger-600",
                  "bg-danger-700",
                  "bg-danger-800",
                  "bg-danger-900",
                  "bg-danger-950",
                ]}
              />
              <Ramp
                name="Categorical · 8 series · L 60% / C 0.13"
                steps={[
                  "bg-cat-1",
                  "bg-cat-2",
                  "bg-cat-3",
                  "bg-cat-4",
                  "bg-cat-5",
                  "bg-cat-6",
                  "bg-cat-7",
                  "bg-cat-8",
                ]}
              />
              <Ramp
                name="Categorical soft · tints for the same eight"
                steps={[
                  "bg-cat-1-soft",
                  "bg-cat-2-soft",
                  "bg-cat-3-soft",
                  "bg-cat-4-soft",
                  "bg-cat-5-soft",
                  "bg-cat-6-soft",
                  "bg-cat-7-soft",
                  "bg-cat-8-soft",
                ]}
              />
              <p className="text-caption text-fg-muted">
                Step 500 = minimum for UI boundaries (3:1). Step 600 = minimum
                for text (4.5:1). Holds in every ramp.
              </p>
              <p className="text-caption text-fg-muted">
                The categorical eight are for things that DIFFER — chart series,
                log types, legend keys — never for good or bad. They all sit at
                one lightness and a moderate chroma, so beside a status colour
                they read as data rather than as an alert. Every solid clears
                3:1 on white and on its own tint; none is rated for text, so
                labels beside a swatch take a fg token.
              </p>
            </Card>
          </Block>

          <Block title="Semantic tokens">
            <Card tone="flat">
              <div className="grid gap-stack-md sm:grid-cols-2 lg:grid-cols-3">
                <TokenSwatch
                  name="bg-canvas"
                  swatch="bg-canvas"
                  note="Page background"
                />
                <TokenSwatch
                  name="bg-surface"
                  swatch="bg-surface"
                  note="Cards, inputs, modals"
                />
                <TokenSwatch
                  name="bg-surface-sunken"
                  swatch="bg-surface-sunken"
                  note="Wells, stripes"
                />
                <TokenSwatch
                  name="text-fg"
                  swatch="bg-fg"
                  note="Headings, values"
                />
                <TokenSwatch
                  name="text-fg-secondary"
                  swatch="bg-fg-secondary"
                  note="Supporting copy"
                />
                <TokenSwatch
                  name="text-fg-muted"
                  swatch="bg-fg-muted"
                  note="Labels, placeholders"
                />
                <TokenSwatch
                  name="border-line"
                  swatch="bg-line"
                  note="Card edges"
                />
                <TokenSwatch
                  name="border-field"
                  swatch="bg-field"
                  note="Input borders · 3.62:1"
                />
                <TokenSwatch
                  name="ring-ring"
                  swatch="bg-ring"
                  note="Focus ring"
                />
              </div>
            </Card>
          </Block>

          <Block title="Tones">
            <Card tone="flat">
              <div className="grid gap-stack-md sm:grid-cols-2 lg:grid-cols-4">
                <TokenSwatch
                  name="primary"
                  swatch="bg-primary-solid"
                  note="Brand actions"
                />
                <TokenSwatch
                  name="neutral"
                  swatch="bg-neutral-solid"
                  note="Inverts in dark mode"
                />
                <TokenSwatch
                  name="danger"
                  swatch="bg-danger-solid"
                  note="Destructive"
                />
                <TokenSwatch
                  name="accent"
                  swatch="bg-accent-solid"
                  note="Secondary emphasis"
                />
              </div>
            </Card>
          </Block>

          <Block title="Status">
            <Row>
              <Badge tone="success" icon={<Check />}>
                At Target EDW
              </Badge>
              <Badge tone="warning" icon={<TriangleAlert />}>
                Above Goal
              </Badge>
              <Badge tone="danger" icon={<AlertTriangle />}>
                Below EDW
              </Badge>
              <Badge tone="info" icon={<Info />}>
                Automatic
              </Badge>
              <Badge tone="neutral">Draft</Badge>
            </Row>
          </Block>
        </div>
      ) : null}

      {/* ================= TYPOGRAPHY ================= */}
      {tab === "typography" ? (
        <Card tone="flat" className="px-inset-md py-inset-xs">
          <h3 className="pt-inset-sm pb-stack-xs text-overline text-fg-muted">
            Display
          </h3>
          <TypeSpec token="text-display-lg" meta="48 / 1.05 · 700">
            <p className="text-display-lg">Understand your kidneys</p>
          </TypeSpec>
          <TypeSpec token="text-display-md" meta="40 / 1.10 · 700">
            <p className="text-display-md">Membership that fits</p>
          </TypeSpec>

          <h3 className="pt-inset-lg pb-stack-xs text-overline text-fg-muted">
            Heading
          </h3>
          <TypeSpec token="text-heading-1" meta="32 / 1.20 · 700 · h1">
            <p className="text-heading-1">My Health Overview</p>
          </TypeSpec>
          <TypeSpec token="text-heading-2" meta="28 / 1.25 · 700 · h2">
            <p className="text-heading-2">Alerts &amp; Insights</p>
          </TypeSpec>
          <TypeSpec token="text-heading-3" meta="24 / 1.30 · 600 · h3">
            <p className="text-heading-3">Avg. Fluid Intake</p>
          </TypeSpec>
          <TypeSpec token="text-heading-4" meta="20 / 1.35 · 600 · h4">
            <p className="text-heading-4">Interdialytic Weight Gain</p>
          </TypeSpec>
          <TypeSpec token="text-heading-5" meta="16 / 1.40 · 600 · h5">
            <p className="text-heading-5">Condition / History</p>
          </TypeSpec>

          <h3 className="pt-inset-lg pb-stack-xs text-overline text-fg-muted">
            Body
          </h3>
          <TypeSpec token="text-body-lg" meta="18 / 1.60 · 400">
            <p className="measure text-body-lg">
              Record your pre- and post-treatment weight after each session so
              your care team sees the trend, not a single reading.
            </p>
          </TypeSpec>
          <TypeSpec token="text-body-md" meta="16 / 1.55 · 400 · default">
            <p className="measure text-body-md">
              Your nephrologist reviews these entries before each monthly visit.
              Target interdialytic weight gain is under 4% of dry weight.
            </p>
          </TypeSpec>
          <TypeSpec token="text-body-sm" meta="14 / 1.50 · 400 · dense UI">
            <p className="measure text-body-sm">
              Table cells and compact rows — not passages a member has to read.
            </p>
          </TypeSpec>

          <h3 className="pt-inset-lg pb-stack-xs text-overline text-fg-muted">
            Label &amp; caption
          </h3>
          <TypeSpec token="text-label-lg" meta="16 / 24 · 500">
            <p className="text-label-lg">Pre-treatment weight</p>
          </TypeSpec>
          <TypeSpec token="text-label-md" meta="14 / 20 · 500">
            <p className="text-label-md">All Categories</p>
          </TypeSpec>
          <TypeSpec token="text-label-sm" meta="12 / 16 · 500">
            <p className="text-label-sm">At Target EDW</p>
          </TypeSpec>
          <TypeSpec token="text-overline" meta="12 / 16 · 600 · +0.08em">
            <p className="text-overline text-fg-muted">Blood Counts</p>
          </TypeSpec>
          <TypeSpec token="text-caption" meta="12 / 18 · 400 · floor">
            <p className="text-caption text-fg-muted">
              Last synced 14 minutes ago
            </p>
          </TypeSpec>

          <h3 className="pt-inset-lg pb-stack-xs text-overline text-fg-muted">
            Metric · tabular-nums
          </h3>
          <TypeSpec token="text-metric-xl" meta="40 / 44 · 700">
            <p className="text-metric-xl">72.4</p>
          </TypeSpec>
          <TypeSpec token="text-metric-lg" meta="32 / 36 · 700">
            <p className="text-metric-lg">1,240</p>
          </TypeSpec>
          <TypeSpec token="text-metric-md" meta="24 / 28 · 600">
            <p className="text-metric-md">138 / 86</p>
          </TypeSpec>
          <TypeSpec token="text-metric-sm" meta="16 / 20 · 600">
            <p className="text-metric-sm">8.2 mg/dL</p>
          </TypeSpec>

          <h3 className="pt-inset-lg pb-stack-xs text-overline text-fg-muted">
            Interactive
          </h3>
          <TypeSpec token="text-button-lg" meta="16 / 24 · 600">
            <p className="text-button-lg">Log Treatment</p>
          </TypeSpec>
          <TypeSpec token="text-button-md" meta="14 / 20 · 600">
            <p className="text-button-md">Add appointment</p>
          </TypeSpec>
          <TypeSpec token="text-link" meta="inherits · 500 · underlined">
            <p className="text-body-md">
              Read the{" "}
              <a href="#top" className="text-link text-fg-brand">
                fluid intake guide
              </a>{" "}
              before your next session.
            </p>
          </TypeSpec>
        </Card>
      ) : null}

      {/* ================= SHADOW ================= */}
      {tab === "shadow" ? (
        <div className="space-y-stack-2xl">
          <Block title="3 Elevation Shadows">
            <Card tone="flat" className="space-y-stack-md">
              <p className="text-body-md text-fg-secondary">
                Our design system defines three primary levels of elevation.
                Unlike harsh pure-black drop shadows, every shadow uses our
                neutral gray-950 palette base (
                <code className="text-label-sm text-fg-brand">
                  rgb(16 20 28 / ...)
                </code>
                ) with a dual-layer approach: a focused key-light shadow paired
                with a soft ambient dispersion for natural, realistic depth.
              </p>
            </Card>

            <div className="grid gap-inline-lg lg:grid-cols-3">
              {/* Level 1: Low / Card */}
              <div className="flex flex-col justify-between rounded-card border border-line bg-surface p-inset-lg shadow-sm">
                <div className="space-y-stack-md">
                  <div className="flex items-center justify-between">
                    <span className="rounded-chip border border-line bg-surface-sunken px-inset-xs py-0.5 text-overline text-fg-muted">
                      Level 1
                    </span>
                    <Badge tone="neutral" variant="soft">
                      Resting
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-heading-4 text-fg">Shadow Small</h3>
                    <p className="text-caption text-fg-muted">
                      Low / Card Elevation
                    </p>
                  </div>
                  <p className="text-body-sm text-fg-secondary">
                    Designed for resting content containers, cards, tables, and
                    form panels that sit directly on the page canvas.
                  </p>
                </div>
                <div className="mt-stack-xl space-y-stack-xs border-t border-line-subtle pt-inset-sm">
                  <div className="flex items-center justify-between text-caption">
                    <span className="text-fg-muted">Tailwind Class</span>
                    <code className="text-label-sm text-fg-brand">
                      shadow-sm
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-caption">
                    <span className="text-fg-muted">Semantic Alias</span>
                    <code className="text-label-sm text-fg">shadow-card</code>
                  </div>
                </div>
              </div>

              {/* Level 2: Medium / Raised */}
              <div className="flex flex-col justify-between rounded-card border border-line bg-surface-raised p-inset-lg shadow-md">
                <div className="space-y-stack-md">
                  <div className="flex items-center justify-between">
                    <span className="rounded-chip border border-line bg-surface-sunken px-inset-xs py-0.5 text-overline text-fg-muted">
                      Level 2
                    </span>
                    <Badge tone="info" variant="soft">
                      Floating
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-heading-4 text-fg">Shadow Medium</h3>
                    <p className="text-caption text-fg-muted">
                      Medium / Raised Elevation
                    </p>
                  </div>
                  <p className="text-body-sm text-fg-secondary">
                    Designed for floating elements, dropdown menus, popovers,
                    hovering cards, and active navigation controls.
                  </p>
                </div>
                <div className="mt-stack-xl space-y-stack-xs border-t border-line-subtle pt-inset-sm">
                  <div className="flex items-center justify-between text-caption">
                    <span className="text-fg-muted">Tailwind Class</span>
                    <code className="text-label-sm text-fg-brand">
                      shadow-md
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-caption">
                    <span className="text-fg-muted">Semantic Alias</span>
                    <code className="text-label-sm text-fg">shadow-raised</code>
                  </div>
                </div>
              </div>

              {/* Level 3: High / Overlay */}
              <div className="flex flex-col justify-between rounded-panel border border-line bg-surface p-inset-lg shadow-lg">
                <div className="space-y-stack-md">
                  <div className="flex items-center justify-between">
                    <span className="rounded-chip border border-line bg-surface-sunken px-inset-xs py-0.5 text-overline text-fg-muted">
                      Level 3
                    </span>
                    <Badge tone="success" variant="soft">
                      Overlay
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-heading-4 text-fg">Shadow Large</h3>
                    <p className="text-caption text-fg-muted">
                      High / Overlay Elevation
                    </p>
                  </div>
                  <p className="text-body-sm text-fg-secondary">
                    Designed for high-elevation layers such as dialogs, modals,
                    bottom sheets, command palettes, and drawer panels.
                  </p>
                </div>
                <div className="mt-stack-xl space-y-stack-xs border-t border-line-subtle pt-inset-sm">
                  <div className="flex items-center justify-between text-caption">
                    <span className="text-fg-muted">Tailwind Class</span>
                    <code className="text-label-sm text-fg-brand">
                      shadow-lg
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-caption">
                    <span className="text-fg-muted">Semantic Alias</span>
                    <code className="text-label-sm text-fg">
                      shadow-overlay
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </Block>

          {/* Interactive Elevation Playground */}
          <Block title="Interactive Elevation & Hover Transitions">
            <Card tone="flat" className="space-y-stack-lg">
              <p className="text-body-sm text-fg-secondary">
                Hover over the cards below to see dynamic elevation transitions.
                Moving between Level 1 and Level 2 on hover provides tactile
                depth feedback without jarring motion.
              </p>

              <div className="grid gap-inline-lg sm:grid-cols-3">
                <div className="group cursor-pointer rounded-card border border-line bg-surface p-inset-md shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <p className="text-overline text-fg-muted">Hover to lift</p>
                  <h4 className="mt-stack-xs text-heading-5 text-fg">
                    Card Elevation
                  </h4>
                  <p className="mt-stack-xs text-body-sm text-fg-secondary">
                    Starts at <code className="text-label-sm">shadow-sm</code>,
                    elevates to <code className="text-label-sm">shadow-md</code>{" "}
                    on hover.
                  </p>
                </div>

                <div className="group cursor-pointer rounded-card border border-line bg-surface p-inset-md shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                  <p className="text-overline text-fg-muted">Hover to expand</p>
                  <h4 className="mt-stack-xs text-heading-5 text-fg">
                    Raised Elevation
                  </h4>
                  <p className="mt-stack-xs text-body-sm text-fg-secondary">
                    Starts at <code className="text-label-sm">shadow-md</code>,
                    elevates to <code className="text-label-sm">shadow-lg</code>{" "}
                    on hover.
                  </p>
                </div>

                <div className="rounded-panel border border-line bg-surface p-inset-md shadow-lg">
                  <p className="text-overline text-fg-muted">Deep Focus</p>
                  <h4 className="mt-stack-xs text-heading-5 text-fg">
                    Modal Elevation
                  </h4>
                  <p className="mt-stack-xs text-body-sm text-fg-secondary">
                    Full <code className="text-label-sm">shadow-lg</code> for
                    dialogs and prominent floating sheets.
                  </p>
                </div>
              </div>
            </Card>
          </Block>

          {/* Specs & Values */}
          <Block title="Elevation Token Specifications">
            <Card tone="flat" padding="none">
              <Table minWidth={600}>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Level</TableHeaderCell>
                    <TableHeaderCell>Tailwind Class</TableHeaderCell>
                    <TableHeaderCell>Semantic Alias</TableHeaderCell>
                    <TableHeaderCell>
                      Computed Dual-Layer Shadow
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell emphasis>Level 1 (Low)</TableCell>
                    <TableCell>
                      <code className="text-label-sm text-fg-brand">
                        shadow-sm
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-label-sm text-fg-muted">
                        shadow-card
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-caption text-fg-secondary">
                        0 1px 3px 0 rgb(16 20 28 / 0.08), 0 1px 2px -1px rgb(16
                        20 28 / 0.04)
                      </code>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell emphasis>Level 2 (Medium)</TableCell>
                    <TableCell>
                      <code className="text-label-sm text-fg-brand">
                        shadow-md
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-label-sm text-fg-muted">
                        shadow-raised
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-caption text-fg-secondary">
                        0 4px 12px -2px rgb(16 20 28 / 0.08), 0 2px 6px -1px
                        rgb(16 20 28 / 0.04)
                      </code>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell emphasis>Level 3 (High)</TableCell>
                    <TableCell>
                      <code className="text-label-sm text-fg-brand">
                        shadow-lg
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-label-sm text-fg-muted">
                        shadow-overlay
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-caption text-fg-secondary">
                        0 16px 36px -8px rgb(16 20 28 / 0.14), 0 6px 16px -4px
                        rgb(16 20 28 / 0.06)
                      </code>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </Block>
        </div>
      ) : null}

      {/* ================= COMPONENT ================= */}
      {tab === "component" ? (
        <div className="space-y-stack-2xl">
          <div className="max-w-xs">
            <Select
              aria-label="Choose a component"
              value={component}
              onChange={(e) => setComponent(e.target.value as ComponentId)}
            >
              {COMPONENTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>

          {/* -------- Button -------- */}
          {show("button") ? (
            <Block title="Button">
              <Card tone="flat" padding="none">
                <Table minWidth={620}>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>variant</TableHeaderCell>
                      <TableHeaderCell>fill</TableHeaderCell>
                      <TableHeaderCell>fill-stroke</TableHeaderCell>
                      <TableHeaderCell>stroke</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(["primary", "neutral", "danger", "accent"] as const).map(
                      (v) => (
                        <TableRow key={v}>
                          <TableCell emphasis>{v}</TableCell>
                          {(["fill", "fill-stroke", "stroke"] as const).map(
                            (a) => (
                              <TableCell key={a}>
                                <Button variant={v} appearance={a}>
                                  Log Treatment
                                </Button>
                              </TableCell>
                            ),
                          )}
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </Card>

              <Row label="Sizes · big 48 / small 36">
                <Button size="big" leadingIcon={<Plus />}>
                  Big
                </Button>
                <Button size="small" leadingIcon={<Plus />}>
                  Small
                </Button>
              </Row>

              <Row label="States">
                <Button>Default</Button>
                <Button loading>Saving…</Button>
                <Button disabled>Disabled</Button>
              </Row>

              <Row label="Icon only · width locked to height">
                <Button
                  iconOnly
                  variant="neutral"
                  appearance="fill-stroke"
                  aria-label="Edit"
                >
                  <Pencil />
                </Button>
                <Button iconOnly variant="danger" aria-label="Delete">
                  <Trash2 />
                </Button>
                <Button
                  iconOnly
                  variant="primary"
                  appearance="stroke"
                  aria-label="Copy"
                >
                  <Copy />
                </Button>
                <Button
                  iconOnly
                  size="small"
                  variant="neutral"
                  appearance="stroke"
                  aria-label="Close"
                >
                  <X />
                </Button>
              </Row>

              <Row label="Full width">
                <div className="w-full max-w-sm space-y-stack-md">
                  <Button fullWidth leadingIcon={<Plus />}>
                    Add appointment
                  </Button>
                  <Button fullWidth variant="neutral" appearance="fill-stroke">
                    Cancel
                  </Button>
                </div>
              </Row>
            </Block>
          ) : null}

          {/* -------- Modal -------- */}
          {show("modal") ? (
            <Block title="Modal">
              <Row label="Focus trap · Escape · scroll lock · focus restore">
                <Button onClick={() => setModalSize("small")}>Small</Button>
                <Button
                  variant="neutral"
                  appearance="fill-stroke"
                  onClick={() => setModalSize("big")}
                >
                  Big
                </Button>
                <Button
                  variant="neutral"
                  appearance="fill-stroke"
                  onClick={() => setModalSize("wide")}
                >
                  Wide
                </Button>
              </Row>

              <Modal
                open={modalSize !== null}
                onClose={() => setModalSize(null)}
                size={modalSize ?? "big"}
                title="Add a ride"
                description="Saved to your profile so the clinic can confirm pickup."
                footer={
                  <>
                    <Button
                      variant="neutral"
                      appearance="fill-stroke"
                      onClick={() => setModalSize(null)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => setModalSize(null)}>
                      Save ride
                    </Button>
                  </>
                }
              >
                <div className="space-y-stack-lg">
                  <FormField label="Driver name" required>
                    {(props) => (
                      <Input {...props} placeholder="e.g. Marcus Bell" />
                    )}
                  </FormField>
                  <FormField
                    label="Phone"
                    hint="Used only for pickup reminders."
                  >
                    {(props) => (
                      <Input
                        {...props}
                        type="tel"
                        placeholder="(555) 018-2244"
                      />
                    )}
                  </FormField>
                  <p className="text-body-sm text-fg-muted">
                    Press Tab — focus cycles inside this dialog and cannot reach
                    the page behind it. Escape closes and returns focus to the
                    button that opened it.
                  </p>
                </div>
              </Modal>
            </Block>
          ) : null}

          {/* -------- Card -------- */}
          {show("card") ? (
            <Block title="Card">
              <div className="grid gap-inline-lg sm:grid-cols-2 lg:grid-cols-4">
                <Card tone="default">
                  <p className="text-label-sm text-fg-muted">default</p>
                  <p className="mt-stack-xs text-body-sm text-fg-secondary">
                    A real object on the page.
                  </p>
                </Card>
                <Card tone="flat">
                  <p className="text-label-sm text-fg-muted">flat</p>
                  <p className="mt-stack-xs text-body-sm text-fg-secondary">
                    Grouping only, no elevation.
                  </p>
                </Card>
                <Card tone="sunken">
                  <p className="text-label-sm text-fg-muted">sunken</p>
                  <p className="mt-stack-xs text-body-sm text-fg-secondary">
                    A well inside another surface.
                  </p>
                </Card>
                <Card tone="raised">
                  <p className="text-label-sm text-fg-muted">raised</p>
                  <p className="mt-stack-xs text-body-sm text-fg-secondary">
                    Floats above: dropdowns, popovers.
                  </p>
                </Card>
              </div>

              <Card className="max-w-md">
                <CardHeader
                  title="Avg. Fluid Intake"
                  description="Last 7 days"
                  action={
                    <Badge tone="success" icon={<Check />}>
                      On target
                    </Badge>
                  }
                />
                <CardBody>
                  <p className="text-metric-lg text-fg">
                    1,240 <span className="text-body-sm text-fg-muted">mL</span>
                  </p>
                </CardBody>
                <CardFooter>
                  <Button
                    size="small"
                    variant="primary"
                    appearance="stroke"
                    leadingIcon={<Droplet />}
                  >
                    Log intake
                  </Button>
                </CardFooter>
              </Card>
            </Block>
          ) : null}

          {/* -------- Badge -------- */}
          {show("badge") ? (
            <Block title="Badge">
              {(["soft", "solid", "outline"] as const).map((v) => (
                <Row key={v} label={v}>
                  <Badge tone="neutral" variant={v}>
                    Draft
                  </Badge>
                  <Badge tone="info" variant={v} icon={<Info />}>
                    Automatic
                  </Badge>
                  <Badge tone="success" variant={v} icon={<Check />}>
                    At Target EDW
                  </Badge>
                  <Badge tone="warning" variant={v} icon={<TriangleAlert />}>
                    Above Goal
                  </Badge>
                  <Badge tone="danger" variant={v} icon={<AlertTriangle />}>
                    Below EDW
                  </Badge>
                  <Badge tone="accent" variant={v}>
                    Caregiver
                  </Badge>
                </Row>
              ))}
            </Block>
          ) : null}

          {/* -------- Input -------- */}
          {show("input") ? (
            <Block title="Input · Textarea · Select">
              {/* 1. Input States */}
              <div className="space-y-stack-lg">
                <h3 className="text-overline text-fg-muted">
                  Input Field States
                </h3>
                <div className="grid gap-inline-lg sm:grid-cols-2 lg:grid-cols-3">
                  {/* Default / Placeholder */}
                  <Card tone="flat" className="space-y-stack-sm">
                    <span className="text-label-sm font-semibold text-fg">
                      Default
                    </span>
                    <Input placeholder="Type member name…" />
                  </Card>

                  {/* Filled / With Value */}
                  <Card tone="flat" className="space-y-stack-sm">
                    <span className="text-label-sm font-semibold text-fg">
                      With Value
                    </span>
                    <Input defaultValue="Dr. Robert Chen, MD" />
                  </Card>

                  {/* With Leading Icon */}
                  <Card tone="flat" className="space-y-stack-sm">
                    <span className="text-label-sm font-semibold text-fg">
                      Leading Icon
                    </span>
                    <Input
                      leadingIcon={<Search />}
                      placeholder="Search records…"
                    />
                  </Card>

                  {/* Focus / Focus-Visible */}
                  <Card tone="flat" className="space-y-stack-sm">
                    <span className="text-label-sm font-semibold text-fg">
                      Focus
                    </span>
                    <Input defaultValue="Click or Tab here" />
                  </Card>

                  {/* Invalid / Error */}
                  <Card tone="flat" className="space-y-stack-sm">
                    <span className="text-label-sm font-semibold text-fg">
                      Error
                    </span>
                    <Input aria-invalid defaultValue="invalid-reading-999" />
                  </Card>

                  {/* Disabled */}
                  <Card tone="flat" className="space-y-stack-sm">
                    <span className="text-label-sm font-semibold text-fg">
                      Disabled
                    </span>
                    <Input
                      placeholder="System managed field"
                      disabled
                      defaultValue="Synchronized clinic ID"
                    />
                  </Card>

                  {/* Size: Small (36px) */}
                  <Card tone="flat" className="space-y-stack-sm">
                    <span className="text-label-sm font-semibold text-fg">
                      Small (36px)
                    </span>
                    <Input inputSize="small" placeholder="Small input (36px)" />
                  </Card>

                  {/* Date Input */}
                  <Card tone="flat" className="space-y-stack-sm">
                    <span className="text-label-sm font-semibold text-fg">
                      Date
                    </span>
                    <Input type="date" defaultValue="2026-09-14" />
                  </Card>
                </div>
              </div>

              {/* 2. Dropdown (Select) States */}
              <div className="space-y-stack-lg">
                <h3 className="text-overline text-fg-muted">
                  Dropdown (Select) States
                </h3>
                <div className="grid gap-inline-lg sm:grid-cols-2 lg:grid-cols-3">
                  {/* Select Default */}
                  <Card tone="flat" className="space-y-stack-sm">
                    <span className="text-label-sm font-semibold text-fg">
                      Default
                    </span>
                    <Select defaultValue="all">
                      <option value="all">All Categories</option>
                      <option value="counts">Blood Counts</option>
                      <option value="chem">Chemistry</option>
                    </Select>
                  </Card>

                  {/* Select Invalid / Error */}
                  <Card tone="flat" className="space-y-stack-sm">
                    <span className="text-label-sm font-semibold text-fg">
                      Error
                    </span>
                    <Select aria-invalid defaultValue="">
                      <option value="" disabled>
                        Select category…
                      </option>
                      <option value="counts">Blood Counts</option>
                    </Select>
                  </Card>

                  {/* Select Disabled */}
                  <Card tone="flat" className="space-y-stack-sm">
                    <span className="text-label-sm font-semibold text-fg">
                      Disabled
                    </span>
                    <Select disabled defaultValue="chem">
                      <option value="chem">Chemistry (Locked)</option>
                    </Select>
                  </Card>
                </div>
              </div>

              {/* 3. Textarea States */}
              <div className="space-y-stack-lg">
                <h3 className="text-overline text-fg-muted">Textarea States</h3>
                <div className="grid gap-inline-lg sm:grid-cols-2">
                  <Card tone="flat" className="space-y-stack-sm">
                    <span className="text-label-sm font-semibold text-fg">
                      Default
                    </span>
                    <Textarea
                      rows={3}
                      defaultValue="Mild cramping in the last hour of dialysis. Resolved after ultrafiltration rate was lowered."
                    />
                  </Card>

                  <Card tone="flat" className="space-y-stack-sm">
                    <span className="text-label-sm font-semibold text-fg">
                      Disabled
                    </span>
                    <Textarea
                      rows={3}
                      disabled
                      defaultValue="Archived physician notes from previous visit (Read-only)."
                    />
                  </Card>
                </div>
              </div>
            </Block>
          ) : null}

          {/* -------- FormField -------- */}
          {show("formfield") ? (
            <Block title="FormField">
              <div className="space-y-stack-lg">
                <h3 className="text-overline text-fg-muted">
                  FormField States
                </h3>
                <div className="grid gap-inline-lg sm:grid-cols-2">
                  {/* Required State */}
                  <Card tone="flat" className="space-y-stack-sm">
                    <span className="text-label-sm font-semibold text-fg">
                      Required
                    </span>
                    <FormField label="Pre-treatment weight" required>
                      {(props) => <Input {...props} defaultValue="72.4" />}
                    </FormField>
                  </Card>

                  {/* Error State */}
                  <Card tone="flat" className="space-y-stack-sm">
                    <span className="text-label-sm font-semibold text-fg">
                      Error
                    </span>
                    <FormField
                      label="Dry weight"
                      error="Enter a valid weight between 30 and 250 kg."
                    >
                      {(props) => <Input {...props} defaultValue="4" />}
                    </FormField>
                  </Card>

                  {/* Optional State */}
                  <Card tone="flat" className="space-y-stack-sm">
                    <span className="text-label-sm font-semibold text-fg">
                      Optional
                    </span>
                    <FormField label="Category" optionalLabel="optional">
                      {(props) => (
                        <Select {...props} defaultValue="chem">
                          <option value="counts">Blood Counts</option>
                          <option value="chem">Chemistry</option>
                        </Select>
                      )}
                    </FormField>
                  </Card>

                  {/* Hint State */}
                  <Card tone="flat" className="space-y-stack-sm">
                    <span className="text-label-sm font-semibold text-fg">
                      Helper Text
                    </span>
                    <FormField label="Session notes" hint="Helper text">
                      {(props) => <Textarea {...props} rows={2} />}
                    </FormField>
                  </Card>
                </div>
              </div>
            </Block>
          ) : null}

          {/* -------- Table -------- */}
          {show("table") ? (
            <Block title="Table">
              <Row label="State">
                <Button
                  size="small"
                  variant="neutral"
                  appearance={tableState === "data" ? "fill" : "fill-stroke"}
                  onClick={() => setTableState("data")}
                >
                  Data
                </Button>
                <Button
                  size="small"
                  variant="neutral"
                  appearance={tableState === "loading" ? "fill" : "fill-stroke"}
                  onClick={() => setTableState("loading")}
                >
                  Loading
                </Button>
                <Button
                  size="small"
                  variant="neutral"
                  appearance={tableState === "empty" ? "fill" : "fill-stroke"}
                  onClick={() => setTableState("empty")}
                >
                  Empty
                </Button>
              </Row>

              <Card tone="flat" padding="none">
                <Table minWidth={520}>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell
                        onSort={() => setSort(sort === "asc" ? "desc" : "asc")}
                        sortDirection={sort}
                      >
                        Test
                      </TableHeaderCell>
                      <TableHeaderCell numeric>Result</TableHeaderCell>
                      <TableHeaderCell numeric>Range</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                    </TableRow>
                  </TableHead>

                  {tableState === "loading" ? (
                    <TableSkeleton rows={4} columns={4} />
                  ) : (
                    <TableBody>
                      {tableState === "empty" ? (
                        <TableEmptyRow colSpan={4}>
                          <EmptyState
                            variant="bare"
                            icon={<Calendar />}
                            title="No lab results yet"
                            description="Results appear here once your clinic uploads them."
                            action={
                              <Button size="small" leadingIcon={<Plus />}>
                                Add result
                              </Button>
                            }
                          />
                        </TableEmptyRow>
                      ) : (
                        (sort === "asc" ? LABS : [...LABS].reverse()).map(
                          (r) => (
                            <TableRow key={r.test}>
                              <TableCell emphasis>{r.test}</TableCell>
                              <TableCell numeric>{r.result}</TableCell>
                              <TableCell numeric>{r.range}</TableCell>
                              <TableCell>
                                <Badge
                                  tone={
                                    r.status === "High" ? "danger" : "success"
                                  }
                                  icon={
                                    r.status === "High" ? (
                                      <AlertTriangle />
                                    ) : (
                                      <Check />
                                    )
                                  }
                                >
                                  {r.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ),
                        )
                      )}
                    </TableBody>
                  )}
                </Table>

                <TablePagination
                  page={page}
                  pageCount={4}
                  onPageChange={setPage}
                  summary="16 results"
                />
              </Card>
            </Block>
          ) : null}

          {/* -------- Alert -------- */}
          {show("alert") ? (
            <Block title="Alert">
              <div className="space-y-stack-md">
                <Alert tone="info">
                  Your nephrologist reviews these entries before each monthly
                  visit.
                </Alert>
                <Alert tone="success">Profile saved successfully.</Alert>
                <Alert tone="warning" title="Above your fluid goal">
                  You are 0.6 L over today&apos;s target. Check with your care
                  team before your next session.
                </Alert>
                <Alert
                  tone="danger"
                  title="Weight gain above target"
                  action={
                    <Button
                      size="small"
                      variant="danger"
                      appearance="fill-stroke"
                    >
                      Contact care team
                    </Button>
                  }
                  onDismiss={() => {}}
                >
                  Interdialytic weight gain is 5.2% of dry weight. Target is
                  under 4%.
                </Alert>
              </div>
              <Card tone="flat">
                <p className="text-body-sm text-fg-secondary">
                  <strong className="font-semibold text-fg">
                    Role follows tone.
                  </strong>{" "}
                  Warning and danger use role=&quot;alert&quot; and interrupt a
                  screen reader; info and success use role=&quot;status&quot;
                  and wait. A notice that is simply part of the page passes
                  live=
                  {"{false}"} so it is not announced at all.
                </p>
              </Card>
            </Block>
          ) : null}

          {/* -------- Tabs -------- */}
          {show("tabs") ? (
            <Block title="Tabs">
              <Row label="underline">
                <div className="w-full">
                  <Tabs
                    label="Demo sections"
                    value={demoTab}
                    onChange={setDemoTab}
                    items={[
                      { id: "overview", label: "Overview" },
                      { id: "history", label: "History" },
                      { id: "trends", label: "Trends" },
                      { id: "archive", label: "Archive", disabled: true },
                    ]}
                  />
                  <TabPanel
                    id="overview"
                    value={demoTab}
                    className="pt-inset-md"
                  >
                    <p className="text-body-md text-fg-secondary">
                      Overview panel.
                    </p>
                  </TabPanel>
                  <TabPanel
                    id="history"
                    value={demoTab}
                    className="pt-inset-md"
                  >
                    <p className="text-body-md text-fg-secondary">
                      History panel.
                    </p>
                  </TabPanel>
                  <TabPanel id="trends" value={demoTab} className="pt-inset-md">
                    <p className="text-body-md text-fg-secondary">
                      Trends panel.
                    </p>
                  </TabPanel>
                </div>
              </Row>

              <Row label="pill">
                <Tabs
                  variant="pill"
                  label="Demo sections, pill"
                  value={demoTab}
                  onChange={setDemoTab}
                  items={[
                    { id: "overview", label: "Overview" },
                    { id: "history", label: "History" },
                    { id: "trends", label: "Trends" },
                  ]}
                />
              </Row>

              <Row label="vertical">
                <div className="w-full max-w-xs">
                  <Tabs
                    variant="vertical"
                    label="Demo sections, vertical"
                    value={demoTab}
                    onChange={setDemoTab}
                    items={[
                      { id: "overview", label: "Overview", icon: <Info /> },
                      { id: "history", label: "History", icon: <Calendar /> },
                      { id: "trends", label: "Trends", icon: <Droplet /> },
                    ]}
                  />
                </div>
              </Row>

              <Card tone="flat">
                <p className="text-body-sm text-fg-secondary">
                  <strong className="font-semibold text-fg">
                    Try the arrow keys.
                  </strong>{" "}
                  A tab strip is one stop in the tab order, not one per tab: Tab
                  into it, then arrow keys to move, Home / End to jump. The nine
                  hand-written tab strips in this app made every tab its own tab
                  stop.
                </p>
              </Card>
            </Block>
          ) : null}

          {/* -------- Chip -------- */}
          {show("chip") ? (
            <Block title="Chip">
              <Row label="Multiple selection">
                <ChipGroup label="Lab categories" selection="multiple">
                  {[
                    { id: "counts", label: "Blood Counts" },
                    { id: "chem", label: "Chemistry" },
                    { id: "fluid", label: "Fluid" },
                    { id: "bone", label: "Bone" },
                  ].map((c) => (
                    <Chip
                      key={c.id}
                      selected={chips.includes(c.id)}
                      onClick={() =>
                        setChips((prev) =>
                          prev.includes(c.id)
                            ? prev.filter((x) => x !== c.id)
                            : [...prev, c.id],
                        )
                      }
                    >
                      {c.label}
                    </Chip>
                  ))}
                </ChipGroup>
              </Row>

              <Row label="Removable · with icon · disabled">
                <Chip selected icon={<Droplet />} onRemove={() => {}}>
                  Fluid tracker
                </Chip>
                <Chip onRemove={() => {}}>May 2026</Chip>
                <Chip disabled>Unavailable</Chip>
              </Row>

              <Card tone="flat">
                <p className="text-body-sm text-fg-secondary">
                  <strong className="font-semibold text-fg">
                    A Chip is not a Badge.
                  </strong>{" "}
                  Badge reports state and is a span; Chip is a control the
                  member operates and is a real button with aria-pressed. They
                  look alike, which is exactly why they drift together.
                </p>
              </Card>
            </Block>
          ) : null}

          {/* -------- Switch -------- */}
          {show("switch") ? (
            <Block title="Switch">
              <Row label="Standalone">
                <Switch
                  checked={switchOn}
                  onChange={setSwitchOn}
                  label="Demo switch"
                />
                <Switch
                  size="small"
                  checked={switchOn}
                  onChange={setSwitchOn}
                  label="Demo switch, small"
                />
                <Switch
                  checked={false}
                  onChange={() => {}}
                  label="Disabled"
                  disabled
                />
              </Row>

              <Row label="SwitchRow — the whole row is the control">
                <div className="w-full space-y-stack-md">
                  <SwitchRow
                    checked={notify}
                    onChange={setNotify}
                    title="Medication Reminders"
                    description="Daily notifications and alerts for scheduled medication times"
                  />
                  <SwitchRow
                    checked={!notify}
                    onChange={() => setNotify((v) => !v)}
                    title="Weekly Check-In Reminders"
                    description="Get reminded to complete your weekly check-in"
                  />
                </div>
              </Row>

              <Card tone="flat">
                <p className="text-body-sm text-fg-secondary">
                  <strong className="font-semibold text-fg">
                    This one exists because of a bug.
                  </strong>{" "}
                  The notification preferences in settings were a div with an
                  onClick and an aria-hidden indicator, so all six were
                  unreachable by keyboard and invisible to a screen reader. The
                  row target is full width rather than a 44px switch, which
                  matters for members with reduced fine motor control.
                </p>
              </Card>
            </Block>
          ) : null}

          {/* -------- RadioGroup -------- */}
          {show("radiogroup") ? (
            <Block title="RadioGroup">
              <Row label="Rich options — icon and description">
                <div className="w-full max-w-md">
                  <RadioGroup
                    label="How I feel"
                    value={mood}
                    onChange={setMood}
                  >
                    <RadioCard
                      value="great"
                      title="Great"
                      description="No symptoms today"
                      icon=":)"
                    />
                    <RadioCard
                      value="good"
                      title="Good"
                      description="Mild tiredness"
                      icon=":)"
                    />
                    <RadioCard
                      value="okay"
                      title="Okay"
                      description="Some cramping"
                      icon=":|"
                    />
                    <RadioCard
                      value="tired"
                      title="Tired"
                      description="Needed a long rest"
                      icon="-_-"
                    />
                  </RadioGroup>
                </div>
              </Row>

              <Row label="Tiles — a short set shown side by side">
                <div className="w-full max-w-md">
                  <RadioGroup
                    label="Mood"
                    orientation="horizontal"
                    value={mood}
                    onChange={setMood}
                    className="grid grid-cols-4 gap-inline-md"
                  >
                    <RadioCard
                      layout="tile"
                      value="great"
                      title="Great"
                      icon={<Smile />}
                    />
                    <RadioCard
                      layout="tile"
                      value="good"
                      title="Good"
                      icon={<Smile />}
                    />
                    <RadioCard
                      layout="tile"
                      value="okay"
                      title="Okay"
                      icon={<Meh />}
                    />
                    <RadioCard
                      layout="tile"
                      value="tired"
                      title="Tired"
                      icon={<Frown />}
                    />
                  </RadioGroup>
                </div>
              </Row>

              <Row label="Compact — title only, horizontal">
                <div className="w-full max-w-sm">
                  <RadioGroup
                    label="Medication taken"
                    orientation="horizontal"
                    value={answer}
                    onChange={setAnswer}
                  >
                    <RadioCard value="yes" title="Yes" />
                    <RadioCard value="no" title="No" />
                  </RadioGroup>
                </div>
              </Row>

              <Card tone="flat">
                <p className="text-body-sm text-fg-secondary">
                  <strong className="font-semibold text-fg">
                    Arrow keys, one tab stop.
                  </strong>{" "}
                  Selection follows focus, which is correct for radios. The
                  option order comes from the DOM at key-press time rather than
                  a ref written during render, so it stays right when options
                  are filtered. These lists were plain buttons before: a screen
                  reader heard unrelated controls, not one choice.
                </p>
              </Card>
            </Block>
          ) : null}

          {/* -------- Progress -------- */}
          {show("progress") ? (
            <Block title="Progress">
              <Row label="Tones and sizes">
                <div className="w-full max-w-md space-y-stack-lg">
                  <Progress value={25} label="Curriculum progress" showValue />
                  <Progress
                    value={72}
                    label="Fluid goal"
                    tone="success"
                    size="small"
                  />
                  <Progress
                    value={91}
                    label="Potassium against the safe range"
                    tone="warning"
                  />
                  <Progress
                    value={100}
                    label="Doses missed this week"
                    tone="danger"
                    size="large"
                  />
                </div>
              </Row>

              <Row label="Any scale, not only percentages">
                <div className="w-full max-w-md">
                  <Progress value={14} max={21} label="Day 14 of 21" />
                </div>
              </Row>

              <Card tone="flat">
                <p className="text-body-sm text-fg-secondary">
                  <strong className="font-semibold text-fg">
                    The label is required.
                  </strong>{" "}
                  Eight of these were hand-written before, and four told a
                  screen reader nothing at all: no role, no value, no name. A
                  progress bar without an accessible name is a decorative
                  stripe, so this one refuses to be one — pass{" "}
                  <code>label</code>, or <code>labelledBy</code> when visible
                  text already names it.
                </p>
              </Card>
            </Block>
          ) : null}

          {/* -------- Charts -------- */}
          {show("chart") ? (
            <Block title="Charts">
              <Row label="LineChart — trend over time">
                <Card className="w-full max-w-2xl">
                  <LineChart
                    label="Blood pressure, last 7 days"
                    xLabels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
                    yMin={60}
                    yMax={180}
                    unit="mmHg"
                    series={[
                      {
                        id: "systolic",
                        label: "Systolic",
                        tone: "cat-1",
                        points: [148, 132, 140, 128, 136, 124, 130],
                      },
                      {
                        id: "diastolic",
                        label: "Diastolic",
                        tone: "cat-6",
                        points: [92, 84, 88, 80, 86, 78, 82],
                      },
                    ]}
                  />
                </Card>
              </Row>

              <Row label="BarChart — one value per category">
                <Card className="w-full max-w-2xl">
                  <BarChart
                    label="Missed doses by day"
                    unit="doses"
                    yMax={10}
                    yTicks={6}
                    bars={[
                      { label: "Sun", value: 2 },
                      { label: "Mon", value: 1 },
                      { label: "Tue", value: 0 },
                      { label: "Wed", value: 2 },
                      { label: "Thu", value: 0 },
                      { label: "Fri", value: 2 },
                      { label: "Sat", value: 1 },
                    ]}
                  />
                </Card>
              </Row>

              <Row label="BarChart — categorical, a tone per bar">
                <Card className="w-full max-w-2xl">
                  <BarChart
                    label="Entries by log type"
                    colorBy="categorical"
                    bars={[
                      { label: "BP", value: 28 },
                      { label: "Weight", value: 31 },
                      { label: "Meds", value: 27 },
                      { label: "Labs", value: 33 },
                      { label: "Fluid", value: 24 },
                    ]}
                  />
                </Card>
              </Row>

              <Row label="DonutChart — parts of a whole">
                <Card className="w-full max-w-2xl">
                  <div className="flex flex-wrap items-center gap-inset-xl">
                    <DonutChart
                      label="Dose adherence"
                      centerValue="86%"
                      centerLabel="Overall"
                      segments={[
                        { label: "Taken", value: 50, tone: "success" },
                        { label: "Late", value: 30, tone: "warning" },
                        { label: "Missed", value: 20, tone: "danger" },
                      ]}
                    />
                    <ChartLegend
                      className="min-w-[160px]"
                      items={[
                        { label: "Taken", tone: "success", value: "50%" },
                        { label: "Late", tone: "warning", value: "30%" },
                        { label: "Missed", tone: "danger", value: "20%" },
                      ]}
                    />
                  </div>
                </Card>
              </Row>

              <Card tone="flat">
                <p className="text-body-sm text-fg-secondary">
                  <strong className="font-semibold text-fg">
                    Every chart carries its numbers twice.
                  </strong>{" "}
                  Once as the drawing, once as a visually-hidden table. On a
                  health log the numbers are the content, and a bare{" "}
                  <code>&lt;svg&gt;</code> or a ring of colour gives a screen
                  reader nothing. The donut takes values and works out the
                  degrees itself — the three hand-written rings had their degree
                  stops typed in by a person, which drifts the moment the data
                  changes.
                </p>
              </Card>

              <Card tone="flat">
                <p className="text-body-sm text-fg-secondary">
                  <strong className="font-semibold text-fg">
                    Status tones versus categorical tones.
                  </strong>{" "}
                  <code>success</code>, <code>warning</code> and{" "}
                  <code>danger</code> say something is good or bad — right for
                  adherence, wrong for a list of log types. Use{" "}
                  <code>cat-1</code> to <code>cat-8</code> when the series only
                  differ: they sit at one lightness so no line shouts louder
                  than another, and a green series does not read as the healthy
                  one.
                </p>
              </Card>
            </Block>
          ) : null}

          {/* -------- EmptyState -------- */}
          {show("emptystate") ? (
            <Block title="EmptyState">
              <div className="grid gap-inline-lg lg:grid-cols-2">
                <EmptyState
                  icon={<Calendar />}
                  title="No appointments yet"
                  description="Add your next clinic visit and it will show up here."
                  action={
                    <Button leadingIcon={<Plus />}>Add appointment</Button>
                  }
                />
                <Card tone="flat" padding="none">
                  <EmptyState
                    variant="bare"
                    icon={<Droplet />}
                    title="Nothing logged today"
                    description="Your fluid intake for today has not been recorded."
                    action={
                      <Button
                        variant="primary"
                        appearance="stroke"
                        leadingIcon={<Plus />}
                      >
                        Log intake
                      </Button>
                    }
                  />
                </Card>
              </div>
            </Block>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
