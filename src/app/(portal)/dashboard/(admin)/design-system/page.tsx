"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  Circle,
  Copy,
  Droplet,
  Info,
  Pencil,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui";

/* ------------------------------------------------------------------ */
/*  Local presentation helpers — only used by this page               */
/* ------------------------------------------------------------------ */

type Status = "consistent" | "diverged" | "missing";

const statusMeta: Record<Status, { label: string; className: string }> = {
  consistent: {
    label: "Consistent",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  diverged: {
    label: "Diverged",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  missing: {
    label: "Not built",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Spec({
  name,
  uses,
  variants,
  status,
  note,
  children,
}: {
  name: string;
  uses?: string;
  variants?: string;
  status: Status;
  note?: string;
  children: React.ReactNode;
}) {
  const meta = statusMeta[status];
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900">{name}</h3>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}
          >
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
          {uses ? <span>{uses}</span> : null}
          {variants ? (
            <span className="text-amber-700">{variants}</span>
          ) : null}
        </div>
      </div>

      <div className="px-4 py-5">
        <div className="flex flex-wrap items-center gap-3">{children}</div>
      </div>

      {note ? (
        <p className="border-t border-slate-100 px-4 py-2.5 text-xs leading-5 text-slate-500">
          {note}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

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
    <div className="grid grid-cols-1 items-baseline gap-x-6 gap-y-1 border-t border-slate-100 py-3 sm:grid-cols-[168px_1fr]">
      <div>
        <code className="text-xs font-semibold text-[#2563EB]">{token}</code>
        <p className="mt-0.5 text-xs text-slate-500">{meta}</p>
      </div>
      <div className="min-w-0 text-slate-900">{children}</div>
    </div>
  );
}

function Ramp({ name, steps }: { name: string; steps: string[] }) {
  return (
    <div>
      <p className="text-overline mb-1.5 text-fg-muted">{name}</p>
      <div className="flex overflow-hidden rounded-card border border-line">
        {steps.map((s) => (
          <div key={s} className={`h-12 flex-1 ${s}`} />
        ))}
      </div>
    </div>
  );
}

function Token({
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

const sections = [
  { id: "color", label: "Color" },
  { id: "spacing", label: "Spacing" },
  { id: "typography", label: "Typography" },
  { id: "buttons", label: "Buttons" },
  { id: "forms", label: "Form controls" },
  { id: "display", label: "Display" },
  { id: "feedback", label: "Feedback" },
  { id: "overlay", label: "Overlay" },
  { id: "navigation", label: "Navigation" },
  { id: "missing", label: "Not yet built" },
];

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toggleOn, setToggleOn] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [checked, setChecked] = useState(true);

  return (
    <div className="space-y-8 pb-16">
      {/* ---------------- Page header ---------------- */}
      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-[28px]">
              Design System
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
              Every UI pattern currently in the NephroReach frontend, rendered
              live. This page is the reference for what exists, what has
              drifted, and what still needs building.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <Circle className="h-3 w-3 fill-blue-600 text-blue-600" />
            Admin only
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-4">
          {[
            { n: "0", l: "Component library used" },
            { n: "368", l: "Buttons, hand-written" },
            { n: "26", l: "Separate modal builds" },
            { n: "150", l: "Unique hex colors" },
          ].map((s) => (
            <div key={s.l} className="bg-white px-4 py-3">
              <span className="block text-xl font-bold tracking-tight text-slate-900">
                {s.n}
              </span>
              <span className="mt-0.5 block text-xs leading-4 text-slate-500">
                {s.l}
              </span>
            </div>
          ))}
        </div>
      </header>

      {/* ---------------- Section nav ---------------- */}
      <nav className="sticky top-0 z-10 -mx-1 flex gap-2 overflow-x-auto bg-slate-50/95 px-1 py-2 backdrop-blur-sm no-scrollbar">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-500 hover:text-blue-600"
          >
            {s.label}
          </a>
        ))}
      </nav>

      {/* ---------------- Color ---------------- */}
      <Section
        id="color"
        title="Color"
        description="Six ramps on one shared lightness curve. Step 500 is the minimum for UI boundaries (3:1); step 600 is the minimum for text (4.5:1) — in every ramp."
      >
        <div className="space-y-stack-lg rounded-card border border-line bg-surface p-inset-md shadow-card">
          <Ramp
            name="Brand · hue 262.9° · 600 anchored on #2563EB"
            steps={[
              "bg-brand-50", "bg-brand-100", "bg-brand-200", "bg-brand-300",
              "bg-brand-400", "bg-brand-500", "bg-brand-600", "bg-brand-700",
              "bg-brand-800", "bg-brand-900", "bg-brand-950",
            ]}
          />
          <Ramp
            name="Secondary · violet · hue 300°"
            steps={[
              "bg-accent-50", "bg-accent-100", "bg-accent-200", "bg-accent-300",
              "bg-accent-400", "bg-accent-500", "bg-accent-600", "bg-accent-700",
              "bg-accent-800", "bg-accent-900", "bg-accent-950",
            ]}
          />
          <Ramp
            name="Gray · blue-biased, hue 262.9°"
            steps={[
              "bg-gray-50", "bg-gray-100", "bg-gray-200", "bg-gray-300",
              "bg-gray-400", "bg-gray-500", "bg-gray-600", "bg-gray-700",
              "bg-gray-800", "bg-gray-900", "bg-gray-950",
            ]}
          />
          <Ramp
            name="Success · hue 150°"
            steps={[
              "bg-success-50", "bg-success-100", "bg-success-200", "bg-success-300",
              "bg-success-400", "bg-success-500", "bg-success-600", "bg-success-700",
              "bg-success-800", "bg-success-900", "bg-success-950",
            ]}
          />
          <Ramp
            name="Warning · hue 70°"
            steps={[
              "bg-warning-50", "bg-warning-100", "bg-warning-200", "bg-warning-300",
              "bg-warning-400", "bg-warning-500", "bg-warning-600", "bg-warning-700",
              "bg-warning-800", "bg-warning-900", "bg-warning-950",
            ]}
          />
          <Ramp
            name="Danger · hue 27°"
            steps={[
              "bg-danger-50", "bg-danger-100", "bg-danger-200", "bg-danger-300",
              "bg-danger-400", "bg-danger-500", "bg-danger-600", "bg-danger-700",
              "bg-danger-800", "bg-danger-900", "bg-danger-950",
            ]}
          />
        </div>

        <div className="rounded-card border border-line bg-surface p-inset-md shadow-card">
          <p className="text-overline mb-inset-sm text-fg-muted">
            Semantic tokens — the only names a component may use
          </p>
          <div className="grid gap-stack-md sm:grid-cols-2 lg:grid-cols-3">
            <Token name="bg-canvas" swatch="bg-canvas" note="Page background" />
            <Token name="bg-surface" swatch="bg-surface" note="Cards, inputs, modals" />
            <Token name="bg-surface-sunken" swatch="bg-surface-sunken" note="Table stripes, wells" />
            <Token name="text-fg" swatch="bg-fg" note="Headings, values, body" />
            <Token name="text-fg-secondary" swatch="bg-fg-secondary" note="Supporting copy" />
            <Token name="text-fg-muted" swatch="bg-fg-muted" note="Labels, captions, placeholders" />
            <Token name="border-line" swatch="bg-line" note="Card and panel edges" />
            <Token name="border-field" swatch="bg-field" note="Input borders — clears 3:1" />
            <Token name="ring-ring" swatch="bg-ring" note="Focus ring" />
            <Token name="bg-action" swatch="bg-action" note="Primary action" />
            <Token name="bg-action-danger" swatch="bg-action-danger" note="Destructive action" />
            <Token name="bg-action-accent" swatch="bg-action-accent" note="Secondary action" />
          </div>
        </div>

        <div className="flex flex-wrap gap-inline-md">
          <span className="inline-flex items-center gap-inline-xs rounded-pill border border-success-line bg-success-surface px-inset-sm py-1 text-label-sm text-success">
            <Check className="h-3 w-3" />
            At Target EDW
          </span>
          <span className="inline-flex items-center gap-inline-xs rounded-pill border border-warning-line bg-warning-surface px-inset-sm py-1 text-label-sm text-warning">
            <TriangleAlert className="h-3 w-3" />
            Above Goal
          </span>
          <span className="inline-flex items-center gap-inline-xs rounded-pill border border-danger-line bg-danger-surface px-inset-sm py-1 text-label-sm text-danger">
            <AlertTriangle className="h-3 w-3" />
            Below EDW
          </span>
          <span className="inline-flex items-center gap-inline-xs rounded-pill border border-info-line bg-info-surface px-inset-sm py-1 text-label-sm text-info">
            <Info className="h-3 w-3" />
            Automatic
          </span>
        </div>

        <div className="rounded-card border border-info-line bg-info-surface p-inset-md">
          <p className="text-body-sm text-fg-secondary">
            <strong className="font-semibold text-fg">Dark mode is opt-in, not automatic.</strong>{" "}
            The tokens above all have dark values behind{" "}
            <code className="rounded bg-surface px-1 text-caption">
              [data-theme=&quot;dark&quot;]
            </code>
            . It is deliberately not wired to{" "}
            <code className="rounded bg-surface px-1 text-caption">prefers-color-scheme</code>{" "}
            yet — roughly 864 hardcoded light colors remain in the app, so
            switching it on now would render part of the UI dark and most of it
            light. The old broken auto-dark block has been removed.
          </p>
        </div>
      </Section>

      {/* ---------------- Spacing ---------------- */}
      <Section
        id="spacing"
        title="Spacing &amp; Scale"
        description="Chosen by role, never by number. Controls are sized by height so vertical padding is not a decision — and 44px touch targets are guaranteed."
      >
        <div className="grid gap-stack-lg rounded-card border border-line bg-surface p-inset-md shadow-card lg:grid-cols-2">
          <div>
            <p className="text-overline mb-inset-sm text-fg-muted">
              Inline — gap on one line
            </p>
            <div className="space-y-stack-sm">
              {[
                ["inline-xs", "4px", "w-1"],
                ["inline-sm", "6px", "w-1.5"],
                ["inline-md", "8px", "w-2"],
                ["inline-lg", "12px", "w-3"],
              ].map(([n, px, w]) => (
                <div key={n} className="flex items-center gap-inline-lg">
                  <code className="w-24 shrink-0 text-label-sm text-fg-brand">{n}</code>
                  <span className="w-10 shrink-0 text-caption text-fg-muted">{px}</span>
                  <span className={`h-3 rounded-chip bg-action ${w}`} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-overline mb-inset-sm text-fg-muted">
              Stack — vertical rhythm
            </p>
            <div className="space-y-stack-sm">
              {[
                ["stack-xs", "4px", "w-1"],
                ["stack-sm", "8px", "w-2"],
                ["stack-md", "12px", "w-3"],
                ["stack-lg", "16px", "w-4"],
                ["stack-xl", "24px", "w-6"],
                ["stack-2xl", "32px", "w-8"],
              ].map(([n, px, w]) => (
                <div key={n} className="flex items-center gap-inline-lg">
                  <code className="w-24 shrink-0 text-label-sm text-fg-brand">{n}</code>
                  <span className="w-10 shrink-0 text-caption text-fg-muted">{px}</span>
                  <span className={`h-3 rounded-chip bg-action ${w}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-card border border-line bg-surface p-inset-md shadow-card">
          <p className="text-overline mb-inset-sm text-fg-muted">
            Control heights — the 44px default is the accessible minimum
          </p>
          <div className="flex flex-wrap items-end gap-inline-lg">
            <div className="flex flex-col items-center gap-stack-xs">
              <span className="flex h-control-sm items-center rounded-control bg-surface-sunken px-control-x-sm text-button-md text-fg-secondary">
                sm · 36
              </span>
              <code className="text-caption text-fg-muted">control-sm</code>
            </div>
            <div className="flex flex-col items-center gap-stack-xs">
              <span className="flex h-control-md items-center rounded-control bg-action px-control-x-md text-button-md text-fg-on-brand">
                md · 44
              </span>
              <code className="text-caption text-fg-muted">control-md</code>
            </div>
            <div className="flex flex-col items-center gap-stack-xs">
              <span className="flex h-control-lg items-center rounded-control bg-surface-sunken px-control-x-lg text-button-lg text-fg-secondary">
                lg · 52
              </span>
              <code className="text-caption text-fg-muted">control-lg</code>
            </div>
          </div>
        </div>

        <div className="grid gap-inline-lg sm:grid-cols-2">
          <div className="rounded-card border border-line bg-surface p-inset-md shadow-card">
            <p className="text-overline mb-inset-sm text-fg-muted">Radius</p>
            <div className="flex flex-wrap gap-inline-lg">
              {[
                ["chip", "6px", "rounded-chip"],
                ["control", "12px", "rounded-control"],
                ["card", "12px", "rounded-card"],
                ["panel", "16px", "rounded-panel"],
                ["pill", "full", "rounded-pill"],
              ].map(([n, px, cls]) => (
                <div key={n} className="flex flex-col items-center gap-stack-xs">
                  <span className={`h-12 w-12 border border-line bg-surface-sunken ${cls}`} />
                  <code className="text-caption text-fg-muted">{n}</code>
                  <span className="text-caption text-fg-subtle">{px}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-card border border-line bg-surface p-inset-md shadow-card">
            <p className="text-overline mb-inset-sm text-fg-muted">Elevation</p>
            <div className="flex flex-wrap gap-inline-lg">
              {[
                ["control", "shadow-control"],
                ["card", "shadow-card"],
                ["raised", "shadow-raised"],
                ["overlay", "shadow-overlay"],
              ].map(([n, cls]) => (
                <div key={n} className="flex flex-col items-center gap-stack-xs">
                  <span className={`h-12 w-12 rounded-card bg-surface ${cls}`} />
                  <code className="text-caption text-fg-muted">{n}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ---------------- Typography ---------------- */}
      <Section
        id="typography"
        title="Typography"
        description="22 named styles. One class sets size, line-height, weight and tracking together. Font sizes are always even; 12px is the floor."
      >
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-2xs">
          <h3 className="pt-3 pb-1 text-xs font-bold tracking-wide text-slate-400 uppercase">
            Display — landing page only
          </h3>
          <TypeSpec token="text-display-lg" meta="48 / 1.05 · 700 · −0.025em">
            <p className="text-display-lg">Understand your kidneys</p>
          </TypeSpec>
          <TypeSpec token="text-display-md" meta="40 / 1.10 · 700 · −0.02em">
            <p className="text-display-md">Membership that fits</p>
          </TypeSpec>

          <h3 className="pt-6 pb-1 text-xs font-bold tracking-wide text-slate-400 uppercase">
            Heading — 32 · 28 · 24 · 20 · 16
          </h3>
          <TypeSpec token="text-heading-1" meta="32 / 1.20 · 700 · <h1>">
            <p className="text-heading-1">My Health Overview</p>
          </TypeSpec>
          <TypeSpec token="text-heading-2" meta="28 / 1.25 · 700 · <h2>">
            <p className="text-heading-2">Alerts &amp; Insights</p>
          </TypeSpec>
          <TypeSpec token="text-heading-3" meta="24 / 1.30 · 600 · <h3>">
            <p className="text-heading-3">Avg. Fluid Intake</p>
          </TypeSpec>
          <TypeSpec token="text-heading-4" meta="20 / 1.35 · 600 · <h4>">
            <p className="text-heading-4">Interdialytic Weight Gain</p>
          </TypeSpec>
          <TypeSpec token="text-heading-5" meta="16 / 1.40 · 600 · <h5>">
            <p className="text-heading-5">Condition / History</p>
          </TypeSpec>

          <h3 className="pt-6 pb-1 text-xs font-bold tracking-wide text-slate-400 uppercase">
            Body — reading text
          </h3>
          <TypeSpec token="text-body-lg" meta="18 / 1.60 · 400 · long-form">
            <p className="text-body-lg measure">
              Record your pre- and post-treatment weight after each session so
              your care team can see the trend rather than a single reading.
            </p>
          </TypeSpec>
          <TypeSpec token="text-body-md" meta="16 / 1.55 · 400 · THE DEFAULT">
            <p className="text-body-md measure">
              Your nephrologist reviews these entries before each monthly
              visit. Target interdialytic weight gain is under 4% of dry
              weight.
            </p>
          </TypeSpec>
          <TypeSpec token="text-body-sm" meta="14 / 1.50 · 400 · dense UI">
            <p className="text-body-sm measure">
              Used in table cells and compact rows — not for passages a member
              has to read.
            </p>
          </TypeSpec>

          <h3 className="pt-6 pb-1 text-xs font-bold tracking-wide text-slate-400 uppercase">
            Label &amp; caption — fixed line-height
          </h3>
          <TypeSpec token="text-label-lg" meta="16 / 24px · 500 · form labels">
            <p className="text-label-lg">Pre-treatment weight</p>
          </TypeSpec>
          <TypeSpec token="text-label-md" meta="14 / 20px · 500 · nav, tabs, th">
            <p className="text-label-md">All Categories</p>
          </TypeSpec>
          <TypeSpec token="text-label-sm" meta="12 / 16px · 500 · badges">
            <p className="text-label-sm">At Target EDW</p>
          </TypeSpec>
          <TypeSpec token="text-overline" meta="12 / 16px · 600 · +0.08em">
            <p className="text-overline text-slate-500">Blood Counts</p>
          </TypeSpec>
          <TypeSpec token="text-caption" meta="12 / 18px · 400 · the floor">
            <p className="text-caption text-slate-500">
              Last synced 14 minutes ago · Session 3 of 3 this week
            </p>
          </TypeSpec>

          <h3 className="pt-6 pb-1 text-xs font-bold tracking-wide text-slate-400 uppercase">
            Metric — tabular-nums built in
          </h3>
          <TypeSpec token="text-metric-xl" meta="40 / 44px · 700 · hero number">
            <p className="text-metric-xl">72.4</p>
          </TypeSpec>
          <TypeSpec token="text-metric-lg" meta="32 / 36px · 700 · stat card">
            <p className="text-metric-lg">1,240</p>
          </TypeSpec>
          <TypeSpec token="text-metric-md" meta="24 / 28px · 600 · secondary">
            <p className="text-metric-md">138 / 86</p>
          </TypeSpec>
          <TypeSpec token="text-metric-sm" meta="16 / 20px · 600 · in tables">
            <p className="text-metric-sm">8.2 mg/dL</p>
          </TypeSpec>

          <h3 className="pt-6 pb-1 text-xs font-bold tracking-wide text-slate-400 uppercase">
            Interactive
          </h3>
          <TypeSpec token="text-button-lg" meta="16 / 24px · 600">
            <p className="text-button-lg">Log Treatment</p>
          </TypeSpec>
          <TypeSpec token="text-button-md" meta="14 / 20px · 600">
            <p className="text-button-md">Add appointment</p>
          </TypeSpec>
          <TypeSpec token="text-link" meta="inherits size · 500 · underlined">
            <p className="text-body-md">
              Read the{" "}
              <a href="#typography" className="text-link text-[#2563EB]">
                fluid intake guide
              </a>{" "}
              before your next session.
            </p>
          </TypeSpec>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-body-sm text-blue-900">
            <strong className="font-semibold">Why numbers get their own styles.</strong>{" "}
            The four <code className="rounded bg-white/70 px-1 text-xs">metric-*</code>{" "}
            styles carry <code className="rounded bg-white/70 px-1 text-xs">font-variant-numeric: tabular-nums</code>{" "}
            so digits keep equal width — a weight reading does not jump sideways
            going from 9.8 to 10.2, and a lab column stays aligned. Only 3 uses
            of tabular-nums existed in the entire codebase before these tokens.
          </p>
        </div>
      </Section>

      {/* ---------------- Buttons ---------------- */}
      <Section
        id="buttons"
        title="Buttons"
        description="Three independent axes: variant (which colour), appearance (how much emphasis), size. 4 x 3 x 2 = 24 combinations, all built from tone tokens."
      >
        <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
          <table className="w-full min-w-[620px] border-collapse">
            <thead>
              <tr>
                <th className="text-overline px-inset-md py-inset-sm text-left text-fg-muted">
                  variant
                </th>
                {(["fill", "fill-stroke", "stroke"] as const).map((a) => (
                  <th
                    key={a}
                    className="text-overline px-inset-md py-inset-sm text-left text-fg-muted"
                  >
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(["primary", "neutral", "danger", "accent"] as const).map((v) => (
                <tr key={v} className="border-t border-line-subtle">
                  <td className="px-inset-md py-inset-sm">
                    <code className="text-label-sm text-fg">{v}</code>
                  </td>
                  {(["fill", "fill-stroke", "stroke"] as const).map((a) => (
                    <td key={a} className="px-inset-md py-inset-sm">
                      <Button variant={v} appearance={a}>
                        Log Treatment
                      </Button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Spec
          name="Sizes — big 48 / small 36"
          status="consistent"
          uses="height tokens, never padding"
          note="Icons are sized by the component: 24px in a big button, 16px in a small one. A caller passes <Plus /> and never sets h-4 w-4."
        >
          <Button size="big" leadingIcon={<Plus />}>
            Big
          </Button>
          <Button size="small" leadingIcon={<Plus />}>
            Small
          </Button>
          <Button size="big" variant="neutral" appearance="fill-stroke" leadingIcon={<Pencil />}>
            Big
          </Button>
          <Button size="small" variant="neutral" appearance="fill-stroke" leadingIcon={<Pencil />}>
            Small
          </Button>
        </Spec>

        <Spec
          name="States"
          status="consistent"
          uses="default · hover · active · focus · disabled · loading"
          note="Tab to a button to see the focus ring — 2px at 2px offset, on every combination. Loading keeps the button width so the layout does not jump, and sets aria-busy."
        >
          <Button>Default</Button>
          <Button loading>Saving…</Button>
          <Button disabled>Disabled</Button>
          <Button variant="neutral" appearance="fill-stroke" loading>
            Saving…
          </Button>
          <Button variant="neutral" appearance="fill-stroke" disabled>
            Disabled
          </Button>
          <Button variant="danger" appearance="stroke" disabled>
            Disabled
          </Button>
        </Spec>

        <Spec
          name="Icon only"
          status="consistent"
          uses="width locked to height"
          note="iconOnly makes width equal height, so an icon button can never fall below its touch target — the thing most often got wrong when these were hand-written (the old ones were 28px)."
        >
          <Button iconOnly variant="neutral" appearance="fill-stroke" aria-label="Edit">
            <Pencil />
          </Button>
          <Button iconOnly variant="danger" aria-label="Delete">
            <Trash2 />
          </Button>
          <Button iconOnly variant="primary" appearance="stroke" aria-label="Copy">
            <Copy />
          </Button>
          <Button iconOnly size="small" variant="neutral" appearance="stroke" aria-label="Close">
            <X />
          </Button>
        </Spec>

        <Spec name="Full width" status="consistent" uses="fullWidth prop">
          <div className="w-full max-w-sm space-y-stack-md">
            <Button fullWidth leadingIcon={<Plus />}>
              Add appointment
            </Button>
            <Button fullWidth variant="neutral" appearance="fill-stroke">
              Cancel
            </Button>
          </div>
        </Spec>

        <div className="rounded-card border border-info-line bg-info-surface p-inset-md">
          <p className="text-body-sm text-fg-secondary">
            <strong className="font-semibold text-fg">
              Why the prop is called appearance, not type.
            </strong>{" "}
            <code className="rounded bg-surface px-1 text-caption">type</code> is a
            native button attribute — submit, reset, button. Shadowing it would
            silently stop forms from submitting, so the emphasis axis is called{" "}
            <code className="rounded bg-surface px-1 text-caption">appearance</code>{" "}
            instead. The values are unchanged.
          </p>
          <p className="mt-inset-sm text-body-sm text-fg-secondary">
            <strong className="font-semibold text-fg">
              And why neutral, not black.
            </strong>{" "}
            A button named for a colour breaks the moment the ground changes —
            a black button on a dark background is invisible. The neutral tone
            inverts to a light solid under{" "}
            <code className="rounded bg-surface px-1 text-caption">
              [data-theme=&quot;dark&quot;]
            </code>
            , so it stays the highest-contrast option in either theme.
          </p>
        </div>
      </Section>
      {/* ---------------- Forms ---------------- */}
      <Section
        id="forms"
        title="Form controls"
        description="85 inputs, 31 textareas, 26 selects and 107 labels — none of them share a wrapper."
      >
        <Spec
          name="Text input"
          uses="85 uses"
          variants="4 divergent class strings"
          status="diverged"
          note="Focus rings differ between call sites: focus:ring-1 focus:ring-blue-500 in some places, focus:ring-2 focus:ring-blue-100 in others."
        >
          <div className="w-full max-w-sm">
            <label
              htmlFor="ds-weight"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Pre-treatment weight
            </label>
            <input
              id="ds-weight"
              type="text"
              defaultValue="72.4"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-2 text-xs text-slate-500">Recorded in kilograms.</p>
          </div>
        </Spec>

        <Spec name="Select, date and search" uses="26 selects · 7 date inputs" status="diverged">
          <div className="relative w-full max-w-[220px]">
            <select
              aria-label="Category"
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option>All Categories</option>
              <option>Blood Counts</option>
              <option>Chemistry</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative w-full max-w-[200px]">
            <input
              type="date"
              aria-label="Apply date"
              defaultValue="2024-04-30"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="relative w-full max-w-[240px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              aria-label="Search"
              placeholder="Search members…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </Spec>

        <Spec name="Textarea" uses="31 uses" status="diverged">
          <div className="w-full max-w-md">
            <label
              htmlFor="ds-notes"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Session notes
            </label>
            <textarea
              id="ds-notes"
              rows={3}
              defaultValue="Mild cramping in the last hour. Resolved after the rate was lowered."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </Spec>

        <Spec
          name="Checkbox and toggle"
          uses="2 checkboxes · 0 radios"
          status="diverged"
          note="Only 2 checkboxes and no radio inputs exist in the whole app. The toggle below is rebuilt from scratch wherever it appears."
        >
          <label className="inline-flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-800">
              Send appointment reminders
            </span>
          </label>

          <button
            type="button"
            role="switch"
            aria-checked={toggleOn}
            aria-label="Notifications"
            onClick={() => setToggleOn((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              toggleOn ? "bg-[#2563EB]" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                toggleOn ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </Spec>
      </Section>

      {/* ---------------- Display ---------------- */}
      <Section
        id="display"
        title="Display"
        description="Containers, labels and data presentation."
      >
        <Spec
          name="Card"
          uses="rounded-xl used 371 times"
          variants="4 near-identical border greys"
          status="diverged"
          note="Card borders appear as #E2E8F0, #E3E6F0, #E9EEF4 and #E8EEF6 across the app — visually identical, four separate values."
        >
          <div className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
                <Droplet className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Avg. Fluid Intake
                </p>
                <p className="text-xs text-slate-500">Last 7 days</p>
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-[28px]">
              1,240 <span className="text-sm font-bold text-slate-400">mL</span>
            </p>
          </div>
        </Spec>

        <Spec
          name="Badge / status pill"
          uses="103 uses"
          variants="Multiple palettes"
          status="diverged"
          note="Status pills use rose / emerald / amber / purple / slate palettes inconsistently — the same meaning gets a different color depending on the page."
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <Check className="h-3 w-3" />
            At Target EDW
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            <TriangleAlert className="h-3 w-3" />
            Above Goal
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
            <AlertTriangle className="h-3 w-3" />
            Below EDW
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            Automatic
          </span>
        </Spec>

        <Spec name="Avatar" uses="12 uses" status="diverged">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            CX
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
            JW
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
            +4
          </span>
        </Spec>

        <Spec
          name="Table"
          uses="23 tables"
          variants="No shared header or empty state"
          status="diverged"
          note="23 tables exist, and none of them share a header style, sort control, pagination or loading state."
        >
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-left">
              <thead>
                <tr>
                  {["Test", "Result", "Range", "Status"].map((h) => (
                    <th
                      key={h}
                      className="border-b border-slate-200 pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Creatinine", "8.2 mg/dL", "0.7 – 1.3", "High"],
                  ["Albumin", "3.9 g/dL", "3.5 – 5.0", "Normal"],
                  ["Calcium", "9.1 mg/dL", "8.5 – 10.2", "Normal"],
                ].map((row) => (
                  <tr key={row[0]}>
                    <td className="border-b border-slate-100 py-2.5 pr-4 text-sm font-semibold text-slate-900">
                      {row[0]}
                    </td>
                    <td className="border-b border-slate-100 py-2.5 pr-4 text-sm text-slate-700 tabular-nums">
                      {row[1]}
                    </td>
                    <td className="border-b border-slate-100 py-2.5 pr-4 text-sm text-slate-500 tabular-nums">
                      {row[2]}
                    </td>
                    <td className="border-b border-slate-100 py-2.5 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          row[3] === "High"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {row[3]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Spec>

        <Spec name="Progress bar" uses="86 references" status="diverged">
          <div className="w-full max-w-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Journey progress</span>
              <span className="tabular-nums">12 of 30 days</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-[#2563EB]" style={{ width: "40%" }} />
            </div>
          </div>
        </Spec>
      </Section>

      {/* ---------------- Feedback ---------------- */}
      <Section
        id="feedback"
        title="Feedback"
        description="Telling the member what happened. This is the thinnest layer in the app."
      >
        <Spec
          name="Alert / inline message"
          uses="Appears as one-off markup"
          status="diverged"
          note="Alerts are rebuilt inline wherever needed. There is no shared component, so icon, padding and color vary."
        >
          <div className="flex w-full max-w-md items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <p className="text-sm text-blue-900">
              Your nephrologist reviews these entries before each monthly visit.
            </p>
          </div>
          <div className="flex w-full max-w-md items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <p className="text-sm text-rose-900">
              Weight gain is above your 4% target. Contact your care team.
            </p>
          </div>
        </Spec>

        <Spec
          name="Empty state"
          uses="11 references"
          status="diverged"
          note="Written inline each time — no shared illustration, heading or action pattern."
        >
          <div className="flex w-full max-w-sm flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-2xs">
              <Calendar className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-slate-900">
              No appointments yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Add your next clinic visit to see it here.
            </p>
            <button className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 text-xs font-bold text-white hover:bg-blue-700">
              <Plus className="h-3.5 w-3.5" />
              Add appointment
            </button>
          </div>
        </Spec>
      </Section>

      {/* ---------------- Overlay ---------------- */}
      <Section
        id="overlay"
        title="Overlay"
        description="The highest-risk area in the app."
      >
        <Spec
          name="Modal"
          uses="26 separate implementations"
          variants="16 missing dialog role"
          status="diverged"
          note="26 files build their own fixed inset-0 overlay. Only 10 set role=dialog or aria-modal, only 9 handle the Escape key, and none trap focus — which means a keyboard user can tab out of an open dialog and get stuck behind it."
        >
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2563EB] px-5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            Open example modal
          </button>
        </Spec>
      </Section>

      {/* ---------------- Navigation ---------------- */}
      <Section
        id="navigation"
        title="Navigation"
        description="Moving between views and filtering what's shown."
      >
        <Spec name="Tabs" uses="284 references" status="diverged">
          <div className="flex w-full gap-1 border-b border-slate-200">
            {[
              { id: "overview", label: "Overview" },
              { id: "history", label: "History" },
              { id: "trends", label: "Trends" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "border-[#2563EB] text-[#2563EB]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Spec>

        <Spec name="Filter chips" uses="140 filter references" status="diverged">
          {["All", "Blood Counts", "Chemistry", "Fluid"].map((f, i) => (
            <button
              key={f}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                i === 0
                  ? "border-[#2563EB] bg-[#2563EB] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
        </Spec>

        <Spec name="Breadcrumb" uses="9 references" status="consistent">
          <nav aria-label="Breadcrumb" className="text-sm">
            <ol className="flex items-center gap-2 text-slate-500">
              <li>Dashboard</li>
              <li aria-hidden="true">/</li>
              <li>Personal Log</li>
              <li aria-hidden="true">/</li>
              <li className="font-semibold text-slate-900">Lab Tracking</li>
            </ol>
          </nav>
        </Spec>
      </Section>

      {/* ---------------- Missing ---------------- */}
      <Section
        id="missing"
        title="Not yet built"
        description="Patterns the app needs but has no implementation of anywhere."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { n: "Toast", d: "27 forms, no success or failure feedback" },
            { n: "Skeleton", d: "0 loading placeholders in the app" },
            { n: "Spinner", d: "No pending state on any async action" },
            { n: "Pagination", d: "23 tables, none paginated" },
            { n: "Tooltip", d: "Only 3 references, no component" },
            { n: "Dropdown menu", d: "Rebuilt inline in 22 places" },
            { n: "Accordion", d: "2 references, no shared build" },
            { n: "Drawer", d: "11 references, no shared build" },
            { n: "Chart", d: "Hand-drawn SVG across 6 data pages" },
          ].map((c) => (
            <div
              key={c.n}
              className="rounded-xl border border-rose-200 bg-rose-50/50 p-4"
            >
              <div className="flex items-center gap-2">
                <X className="h-3.5 w-3.5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">{c.n}</h3>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-slate-600">{c.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------- Example modal ---------------- */}
      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ds-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-5 rounded-xl border border-slate-200 bg-white p-6 text-left shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3
                id="ds-modal-title"
                className="text-lg font-bold text-slate-900"
              >
                Example modal
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              This one sets <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">role=&quot;dialog&quot;</code> and{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">aria-modal</code>. Most modals in
              the app do not — and none of them trap focus.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="inline-flex h-11 items-center rounded-xl bg-[#2563EB] px-5 text-sm font-bold text-white hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
