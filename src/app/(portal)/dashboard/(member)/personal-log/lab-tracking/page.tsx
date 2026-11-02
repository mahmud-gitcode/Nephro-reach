"use client";

import { PageTitle } from "@/components/layout/PageTitle";
import { useExternalShare } from "@/features/sharing/ExternalShareNotice";
import { usDate } from "@/features/clinic/ccm.data";
import { LabInfoButton } from "@/features/labs/LabInfoButton";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Apple,
  ArrowDown,
  ArrowUp,
  Bone,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Download,
  Droplet,
  FlaskConical,
  HeartPulse,
  Info,
  Layers,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Kidneys } from "@/components/icons/Kidneys";

import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  buttonStyles,
  Card,
  CardHeader,
  KeyCard,
  SkeletonText,
  Select,
  Sparkline,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TabPanel,
  Tabs,
} from "@/components/ui";
import { AlertTriangleSolid, CheckCircleSolid } from "@/components/icons/solid";
import { StatusBadge, sparklineTone } from "@/features/labs/StatusBadge";
import { TrendLineCard } from "@/features/labs/TrendLineCard";
import { LAB_CATEGORIES } from "@/features/labs/labs.panels.seed";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import { useMemberLabs } from "@/features/labs/useMemberLabs";
import {
  compareDays,
  drawsOf,
  kpisOf,
  panelView,
  unseenClinicRows,
  type LabStatus,
} from "@/features/labs/labs.view";
import {
  LabReportButton,
  LabResultActions,
} from "@/features/labs/LabResultActions";
import { LoadMore } from "@/features/profile/LoadMore";
import { todayIso } from "@/features/medications/medicationLog.rules";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";

/** "2026-10-01" → a short date in the member's language. */
function dayLabel(day: string, isEs: boolean, withYear = true): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(isEs ? "es-ES" : "en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

export default function MyLabsPage() {
  const { language, dictionary } = useLanguage();
  const isEs = language === "ES";
  /* Leaves NephroReach: ask first (client, 2026-10-07). */
  const share = useExternalShare(isEs);
  const l = dictionary?.labTracking;

  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "history">(
    "overview",
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  /* "" compares the latest with the draw before it. */
  const [compareDateId, setCompareDateId] = useState<string>("");
  const [expandedHistoryIdx, setExpandedHistoryIdx] = useState<number | null>(
    0,
  );

  /* The member's results for the last year, every source: their own typed
     draws and what their care team entered or imported. Charts read the
     server's trend series for the same window. */
  const labs = useMemberLabs();
  const today = todayIso();
  const view = useMemo(
    () => panelView(labs.rows, labs.trends, compareDateId, today),
    [labs.rows, labs.trends, compareDateId, today],
  );
  const kpis = useMemo(() => kpisOf(view, labs.rows), [view, labs.rows]);
  const draws = useMemo(() => drawsOf(labs.rows), [labs.rows]);
  const pastDraws = useMemo(() => compareDays(labs.rows), [labs.rows]);

  /* New results from the care team: said once, and opening this page counts
     as the patient seeing them (the patient only: a caregiver reading them
     is not the member seeing them). */
  const unseen = useMemo(() => unseenClinicRows(labs.rows), [labs.rows]);
  const clinicDate = unseen.length
    ? unseen
        .map((r) => r.collectedOn.slice(0, 10))
        .reduce((a, b) => (b > a ? b : a))
    : null;
  const { canMarkSeen, markSeen } = labs;
  useEffect(() => {
    if (clinicDate && canMarkSeen) markSeen();
  }, [clinicDate, canMarkSeen, markSeen]);

  const presets = [
    {
      id: "last-7-days",
      label: l?.overview?.compare?.last7Days || "Last 7 Days (1 Week)",
    },
    {
      id: "last-30-days",
      label: l?.overview?.compare?.last30Days || "Last 30 Days (1 Month)",
    },
    {
      id: "last-90-days",
      label: l?.overview?.compare?.last90Days || "Last 90 Days (3 Months)",
    },
    {
      id: "last-6-months",
      label: l?.overview?.compare?.last6Months || "Last 6 Months",
    },
    {
      id: "last-1-year",
      label: l?.overview?.compare?.last1Year || "Last 1 Year",
    },
  ];

  const latestDrawDate = kpis.latestDate
    ? dayLabel(kpis.latestDate, isEs)
    : "—";
  /* The stat card shows the day large and the year beneath it. */
  const drawDay = kpis.latestDate
    ? dayLabel(kpis.latestDate, isEs, false)
    : "—";
  const drawYear = kpis.latestDate ? kpis.latestDate.slice(0, 4) : undefined;
  const pct = (n: number) =>
    kpis.withResult === 0 ? 0 : Math.round((n * 100) / kpis.withResult);

  const getCategoryName = (catId: string, fallback: string) => {
    if (catId === "kidney-function")
      return l?.categories?.kidneyFunction || fallback;
    if (catId === "electrolytes")
      return l?.categories?.electrolytes || fallback;
    if (catId === "mineral-bone") return l?.categories?.mineralBone || fallback;
    if (catId === "blood-counts") return l?.categories?.bloodCounts || fallback;
    if (catId === "nutrition") return l?.categories?.nutrition || fallback;
    if (catId === "dialysis-adequacy")
      return l?.categories?.dialysisAdequacy || fallback;
    if (catId === "other") return isEs ? "Otras pruebas" : "Other tests";
    return fallback;
  };

  const getTestDisplayName = (testId: string, fallback: string) => {
    const testsDict = l?.tests;
    if (!testsDict) return fallback;
    if (testId === "bun") return testsDict.bun || fallback;
    if (testId === "creatinine") return testsDict.creatinine || fallback;
    if (testId === "egfr") return testsDict.egfr || fallback;
    if (testId === "sodium") return testsDict.sodium || fallback;
    if (testId === "potassium") return testsDict.potassium || fallback;
    if (testId === "chloride") return testsDict.chloride || fallback;
    if (testId === "co2") return testsDict.co2 || fallback;
    if (testId === "calcium") return testsDict.calcium || fallback;
    if (testId === "phosphorus") return testsDict.phosphorus || fallback;
    if (testId === "pth") return testsDict.pth || fallback;
    if (testId === "vitamind") return testsDict.vitaminD || fallback;
    if (testId === "hemoglobin") return testsDict.hemoglobin || fallback;
    if (testId === "hematocrit") return testsDict.hematocrit || fallback;
    if (testId === "ferritin") return testsDict.ferritin || fallback;
    if (testId === "tsat") return testsDict.tsat || fallback;
    if (testId === "albumin") return testsDict.albumin || fallback;
    if (testId === "bicarbonate") return testsDict.bicarbonate || fallback;
    if (testId === "ktv") return testsDict.ktv || fallback;
    return fallback;
  };

  const getStatusLabel = (status: LabStatus) => {
    if (status === "In Range")
      return l?.overview?.statuses?.inRange || "In Range";
    if (status === "High") return l?.overview?.statuses?.high || "High";
    return l?.overview?.statuses?.low || "Low";
  };

  const mergedCategories = view.map((cat) => ({
    ...cat,
    displayName: getCategoryName(cat.id, cat.name),
    tests: cat.tests.map((test) => ({
      ...test,
      displayName: getTestDisplayName(test.id, test.name),
    })),
  }));

  const filteredCategories =
    selectedCategory === "all"
      ? mergedCategories
      : mergedCategories.filter((cat) => cat.id === selectedCategory);

  const categoryIcons: Record<string, (typeof LAB_CATEGORIES)[number]["icon"]> =
    {
      "kidney-function": Kidneys,
      electrolytes: FlaskConical,
      "mineral-bone": Bone,
      "blood-counts": Droplet,
      nutrition: Apple,
      "dialysis-adequacy": HeartPulse,
    };
  const testsLabel = (n: number) =>
    isEs
      ? `${n} ${n === 1 ? "Prueba" : "Pruebas"}`
      : `${n} ${n === 1 ? "Test" : "Tests"}`;
  const totalTests = LAB_CATEGORIES.reduce((n, c) => n + c.tests.length, 0);

  const reportLink = labs.reportLink;

  return (
    <div className="w-full space-y-4" aria-busy={labs.isPending || undefined}>
      {/* The page named on screen: on a phone the top bar's breadcrumb is
          hidden (client review, 2026-10-08). */}
      <PageTitle
        href="/dashboard/personal-log/lab-tracking"
        title={isEs ? "Mis Laboratorios" : "My Labs"}
      />
      <PersonalLogDisclaimer />

      {clinicDate ? (
        <Alert
          tone="info"
          title={
            isEs
              ? "Resultados nuevos de su clínica"
              : "New results from your clinic"
          }
        >
          {isEs
            ? `Su centro de diálisis subió resultados del ${usDate(clinicDate)}. Ya aparecen abajo como sus resultados más recientes.`
            : `Your dialysis center uploaded results from ${usDate(clinicDate)}. They show below as your latest results.`}
        </Alert>
      ) : null}

      {/* The panels show the member's own results only. If the read fails,
          the page says so rather than showing an empty or sample table
          (INT-10); a 403 says it was not shared, with no retry. */}
      <AsyncSection
        pending={labs.isPending}
        error={labs.error}
        onRetry={canRetry(labs.error) ? labs.refetch : undefined}
        errorTitle={errorTitleFor(
          labs.error,
          isEs
            ? "No se pudieron cargar sus resultados"
            : "Your lab results could not be loaded",
          isEs ? "es" : "en",
        )}
        errorMessage={errorMessageFor(
          labs.error,
          undefined,
          isEs ? "es" : "en",
        )}
        skeleton={<SkeletonText lines={6} />}
      >
        {/* 1. Stat cards — the shared KeyCard, as on every dashboard. */}
        <section className="grid grid-cols-2 gap-inset-sm sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
          <KeyCard
            className="col-span-2 sm:col-span-1"
            icon={<CalendarDays />}
            value={drawDay}
            label={l?.kpis?.latestDate || "Latest Lab Date"}
            note={drawYear}
          />
          <KeyCard
            tone="success"
            icon={<CheckCircleSolid />}
            value={
              <>
                {kpis.inRange}
                <span className="text-heading-4 text-fg-muted">
                  {" "}
                  / {kpis.withResult}
                </span>
              </>
            }
            label={l?.kpis?.inRange || "In Range"}
            note={
              isEs
                ? `${pct(kpis.inRange)}% de los resultados`
                : `${pct(kpis.inRange)}% of results`
            }
          />
          <KeyCard
            tone="warning"
            icon={<AlertTriangleSolid />}
            value={
              <>
                {kpis.high + kpis.low}
                <span className="text-heading-4 text-fg-muted">
                  {" "}
                  / {kpis.withResult}
                </span>
              </>
            }
            label={l?.kpis?.outOfRange || "Out of Range"}
            note={
              isEs
                ? `${pct(kpis.high + kpis.low)}% de los resultados`
                : `${pct(kpis.high + kpis.low)}% of results`
            }
          />
          <KeyCard
            tone="success"
            icon={<TrendingUp />}
            value={String(kpis.trendingUp)}
            label={l?.kpis?.trendingUp || "Trending Up"}
          />
          <KeyCard
            tone="danger"
            icon={<TrendingDown />}
            value={String(kpis.trendingDown)}
            label={l?.kpis?.trendingDown || "Trending Down"}
          />
        </section>

        {/* 3. Main Grid Layout (Left Content + Right Sidebar) */}
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-inline-md">
              <div className="flex max-w-full min-w-0 flex-wrap items-center gap-inline-md">
                <Tabs
                  label={isEs ? "Vista de laboratorios" : "Lab views"}
                  value={activeTab}
                  onChange={setActiveTab}
                  items={[
                    {
                      id: "overview",
                      label: l?.tabs?.overview || "Lab Overview",
                    },
                    { id: "trends", label: l?.tabs?.trends || "Trends" },
                    { id: "history", label: l?.tabs?.history || "History" },
                  ]}
                />
                {activeTab !== "history" && (
                  <Select
                    selectSize="small"
                    aria-label={
                      isEs ? "Filtrar por categoría" : "Filter by category"
                    }
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">
                      {l?.categories?.all || "All Categories"}
                    </option>
                    <option value="kidney-function">
                      {l?.categories?.kidneyFunction || "Kidney Function"}
                    </option>
                    <option value="electrolytes">
                      {l?.categories?.electrolytes || "Electrolytes"}
                    </option>
                    <option value="mineral-bone">
                      {l?.categories?.mineralBone || "Mineral & Bone"}
                    </option>
                    <option value="blood-counts">
                      {l?.categories?.bloodCounts || "Blood Counts"}
                    </option>
                    <option value="nutrition">
                      {l?.categories?.nutrition || "Nutrition"}
                    </option>
                    <option value="dialysis-adequacy">
                      {l?.categories?.dialysisAdequacy || "Dialysis Adequacy"}
                    </option>
                  </Select>
                )}
              </div>

              <div className="flex items-center gap-inline-md print:hidden">
                <Button
                  variant="neutral"
                  appearance="fill-stroke"
                  size="small"
                  onClick={() => share.guard(() => window.print(), "print")}
                >
                  <Download />
                  {l?.actions?.exportPdf || "Export PDF"}
                </Button>
                {share.notice}
                <Link
                  href="/dashboard/personal-log/lab-tracking/add"
                  className={buttonStyles({ size: "small" })}
                >
                  <Plus />
                  {l?.actions?.addLabResult || "Add Lab Result"}
                </Link>
              </div>
            </div>

            {/* TAB 1: OVERVIEW & COMPARE VIEW */}
            <TabPanel id="overview" value={activeTab}>
              <Card padding="none" className="overflow-hidden">
                <Table minWidth={960}>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>
                        {l?.overview?.headers?.test || "Test"}
                      </TableHeaderCell>
                      <TableHeaderCell>
                        {l?.overview?.headers?.latestResult || "Latest Result"}
                        <span className="block tracking-normal normal-case">
                          {latestDrawDate}
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        {l?.overview?.headers?.previousResult ||
                          "Previous Result"}
                        <span className="relative mt-0.5 flex items-center tracking-normal normal-case">
                          <select
                            aria-label={
                              isEs
                                ? "Elegir la fecha de laboratorio para comparar"
                                : "Select comparison lab draw date"
                            }
                            value={compareDateId}
                            onChange={(e) => setCompareDateId(e.target.value)}
                            className="w-full cursor-pointer appearance-none rounded-control-small bg-transparent pr-5 text-label-sm text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          >
                            <option value="">
                              {isEs ? "Extracción anterior" : "Previous draw"}
                            </option>
                            {pastDraws.length > 0 ? (
                              <optgroup
                                label={
                                  l?.overview?.compare?.pastDrawDatesGroup ||
                                  "Past Lab Draw Dates"
                                }
                              >
                                {pastDraws.map((day) => (
                                  <option key={day} value={day}>
                                    {dayLabel(day, isEs)}
                                  </option>
                                ))}
                              </optgroup>
                            ) : null}
                            <optgroup
                              label={
                                l?.overview?.compare?.presetsGroup ||
                                "Timeframe Presets"
                              }
                            >
                              {presets.map((preset) => (
                                <option key={preset.id} value={preset.id}>
                                  {preset.label}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                          <ChevronDown
                            aria-hidden="true"
                            className="pointer-events-none absolute right-0 h-3.5 w-3.5 text-fg-brand"
                          />
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        {l?.overview?.headers?.change || "Change"}
                      </TableHeaderCell>
                      <TableHeaderCell>
                        {l?.overview?.headers?.refRange || "Reference Range"}
                      </TableHeaderCell>
                      <TableHeaderCell>
                        {l?.overview?.headers?.status || "Status"}
                      </TableHeaderCell>
                      <TableHeaderCell>
                        {l?.overview?.headers?.trend || "Trend"}
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <React.Fragment key={category.id}>
                        <TableRow className="bg-surface-sunken">
                          <TableCell colSpan={7} className="py-inset-xs">
                            <span className="flex items-center gap-inline-sm text-label-md text-fg">
                              <category.icon
                                aria-hidden="true"
                                className="h-4 w-4 shrink-0 fill-current text-fg-brand"
                              />
                              {category.displayName}
                            </span>
                          </TableCell>
                        </TableRow>

                        {category.tests.map((test) => (
                          <TableRow key={test.id}>
                            <TableCell emphasis>
                              <span className="inline-flex items-center gap-inline-xs">
                                {test.displayName}
                                <LabInfoButton
                                  id={test.id}
                                  name={test.displayName}
                                  isEs={isEs}
                                />
                              </span>
                            </TableCell>
                            <TableCell emphasis>{test.latestResult}</TableCell>
                            <TableCell>{test.previousResult}</TableCell>
                            <TableCell>
                              {test.change === null ? (
                                <span className="text-fg-muted">—</span>
                              ) : (
                                <span
                                  className={`inline-flex items-center gap-0.5 text-label-sm ${
                                    test.changeColor === "red"
                                      ? "text-danger"
                                      : test.changeColor === "orange"
                                        ? "text-warning"
                                        : "text-success"
                                  }`}
                                >
                                  {test.changeDirection === "up" ? (
                                    <ArrowUp
                                      aria-hidden="true"
                                      className="h-3.5 w-3.5"
                                    />
                                  ) : (
                                    <ArrowDown
                                      aria-hidden="true"
                                      className="h-3.5 w-3.5"
                                    />
                                  )}
                                  {test.change}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-fg-muted">
                              {test.refRange}
                            </TableCell>
                            <TableCell>
                              {test.status ? (
                                <StatusBadge
                                  status={test.status}
                                  label={getStatusLabel(test.status)}
                                />
                              ) : (
                                <span className="text-fg-muted">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {test.sparkline.length > 0 ? (
                                <Sparkline
                                  points={test.sparkline}
                                  tone={sparklineTone(
                                    test.status ?? "In Range",
                                  )}
                                  label={`${test.displayName} ${isEs ? "tendencia" : "trend"}`}
                                  width={80}
                                  height={24}
                                />
                              ) : (
                                <span className="text-fg-muted">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
                <p className="border-t border-line px-(--table-edge) py-inset-sm text-caption text-fg-muted">
                  {l?.overview?.footnote ||
                    "* Reference ranges may vary slightly by lab. Always follow your healthcare team's guidance."}
                </p>
              </Card>
            </TabPanel>

            {/* TAB 2: TRENDS VIEW — the server's trend series. */}
            <TabPanel id="trends" value={activeTab}>
              <div className="space-y-6">
                {filteredCategories.map((category) => {
                  const charted = category.tests.filter(
                    (test) => test.sparkline.length > 0,
                  );
                  return (
                    <div key={category.id} className="space-y-3">
                      <div className="flex items-center gap-inline-sm border-b border-line pb-stack-sm">
                        <category.icon
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 fill-current text-fg-brand"
                        />
                        <h3 className="text-label-md text-fg">
                          {category.displayName} ({category.tests.length}{" "}
                          {l?.trends?.testsCount || "tests"})
                        </h3>
                      </div>

                      {charted.length === 0 ? (
                        <p className="text-body-sm text-fg-muted">
                          {isEs
                            ? "Aún no hay resultados para graficar en esta categoría."
                            : "No results to chart in this category yet."}
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {charted.map((test) => {
                            let theme:
                              | "purple"
                              | "green"
                              | "orange"
                              | "blue"
                              | "rose"
                              | "teal" = "purple";
                            if (test.name.includes("Potassium"))
                              theme = "purple";
                            else if (test.name.includes("Phosphorus"))
                              theme = "green";
                            else if (test.name.includes("Calcium"))
                              theme = "orange";
                            else if (test.name.includes("Creatinine"))
                              theme = "rose";
                            else if (test.name.includes("eGFR")) theme = "blue";
                            else if (test.name.includes("Sodium"))
                              theme = "teal";
                            else if (test.name.includes("Hemoglobin"))
                              theme = "rose";
                            else if (test.name.includes("Kt/V"))
                              theme = "green";
                            else if (test.name.includes("Albumin"))
                              theme = "orange";
                            else if (test.name.includes("BUN"))
                              theme = "purple";
                            else theme = "blue";

                            return (
                              <TrendLineCard
                                key={test.id}
                                testName={test.displayName}
                                unit={test.unit}
                                data={test.sparkline}
                                dates={test.trendDates.map((d) =>
                                  dayLabel(d, isEs, false),
                                )}
                                colorTheme={theme}
                                refRange={test.refRange}
                                refRangeLabel={
                                  l?.trends?.refRange || "Ref Range"
                                }
                                latestLabel={l?.trends?.latest || "Latest"}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabPanel>

            {/* TAB 3: HISTORY — one entry per draw day, newest first. */}
            <TabPanel id="history" value={activeTab}>
              <div className="space-y-4">
                {draws.length === 0 ? (
                  <Card>
                    <p className="text-body-md text-fg">
                      {isEs
                        ? "Aún no hay resultados de laboratorio."
                        : "No lab results yet."}
                    </p>
                    <p className="mt-stack-xs text-body-sm text-fg-muted">
                      {isEs
                        ? "Agregue los resultados de su informe con «Agregar resultado». Los resultados que suba su clínica también aparecen aquí."
                        : "Add the results from your report with Add Lab Result. Results your clinic uploads show here too."}
                    </p>
                  </Card>
                ) : null}
                {draws.map((draw, idx) => {
                  const isExpanded = expandedHistoryIdx === idx;
                  const tag =
                    idx === 0
                      ? l?.history?.latestDraw || "Latest Draw"
                      : idx === 1
                        ? l?.history?.previousDraw || "Previous Draw"
                        : isEs
                          ? "Extracción anterior"
                          : "Earlier Draw";
                  const tagTone =
                    idx === 0
                      ? ("success" as const)
                      : idx === 1
                        ? ("info" as const)
                        : ("neutral" as const);
                  const allTests = draw.groups.flatMap((g) => g.tests);
                  return (
                    <div
                      key={draw.date}
                      className={`overflow-hidden rounded-card border bg-surface shadow-(--card-shadow) transition-colors duration-150 ease-standard ${
                        isExpanded ? "border-action" : "border-line"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedHistoryIdx(isExpanded ? null : idx)
                        }
                        aria-expanded={isExpanded}
                        aria-controls={`draw-${idx}-values`}
                        className="flex w-full flex-wrap items-center justify-between gap-inline-md p-card text-left transition-colors duration-150 ease-standard hover:bg-surface-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                      >
                        <span className="flex items-center gap-inline-md">
                          <span className="text-heading-5 text-fg">
                            {dayLabel(draw.date, isEs)}
                          </span>
                          <Badge
                            tone={tagTone}
                            variant={tagTone === "neutral" ? "soft" : "solid"}
                          >
                            {tag}
                          </Badge>
                          {draw.fromClinic ? (
                            <Badge tone="info" variant="soft">
                              {isEs ? "De su clínica" : "From your clinic"}
                            </Badge>
                          ) : null}
                        </span>
                        <span
                          className={buttonStyles({
                            variant: isExpanded ? "primary" : "neutral",
                            appearance: "fill-stroke",
                            size: "small",
                          })}
                        >
                          {isExpanded
                            ? l?.history?.hideValues || "Hide Values"
                            : l?.history?.viewValues || "View Values"}
                          <ChevronDown
                            aria-hidden="true"
                            className={isExpanded ? "rotate-180" : undefined}
                          />
                        </span>
                      </button>

                      {/* Key readings */}
                      <div
                        id={`draw-${idx}-values`}
                        className="grid grid-cols-2 gap-inline-md border-t border-line bg-surface-sunken px-card py-inset-sm sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
                      >
                        {allTests.map((t) => (
                          <div key={t.row.id} className="min-w-0">
                            <span className="block truncate text-caption text-fg-muted">
                              {getTestDisplayName(t.row.testCode, t.name)}
                            </span>
                            <span className="text-label-md text-fg">
                              {t.val}
                            </span>
                          </div>
                        ))}
                      </div>

                      {draw.notes || draw.withReport ? (
                        <div className="flex flex-wrap items-center justify-between gap-inline-md border-t border-line px-card py-inset-sm">
                          {draw.notes ? (
                            <p className="text-body-sm text-fg-muted">
                              <span className="text-label-md text-fg">
                                {l?.history?.noteLabel || "Note:"}
                              </span>{" "}
                              {draw.notes}
                            </p>
                          ) : (
                            <span />
                          )}
                          {draw.withReport ? (
                            <LabReportButton
                              isEs={isEs}
                              load={() => reportLink(draw.withReport!.id)}
                            />
                          ) : null}
                        </div>
                      ) : null}

                      {isExpanded && (
                        <div className="space-y-4 border-t border-line p-card">
                          {draw.groups.map((group) => (
                            <div
                              key={group.categoryId}
                              className="overflow-hidden rounded-card-nested border border-line"
                            >
                              <p className="border-b border-line bg-surface-sunken px-(--table-edge) py-inset-xs text-label-md text-fg">
                                {getCategoryName(
                                  group.categoryId,
                                  group.categoryId,
                                )}
                              </p>
                              <Table minWidth={560}>
                                <TableHead>
                                  <TableRow>
                                    <TableHeaderCell>
                                      {l?.history?.tableHeaders?.test || "Test"}
                                    </TableHeaderCell>
                                    <TableHeaderCell>
                                      {l?.history?.tableHeaders
                                        ?.recordedValue || "Recorded Value"}
                                    </TableHeaderCell>
                                    <TableHeaderCell>
                                      {l?.history?.tableHeaders?.refRange ||
                                        "Reference Range"}
                                    </TableHeaderCell>
                                    <TableHeaderCell>
                                      {l?.history?.tableHeaders?.status ||
                                        "Status"}
                                    </TableHeaderCell>
                                    <TableHeaderCell className="text-right">
                                      {isEs ? "Acciones" : "Actions"}
                                    </TableHeaderCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {group.tests.map((t) => {
                                    const name = getTestDisplayName(
                                      t.row.testCode,
                                      t.name,
                                    );
                                    return (
                                      <TableRow key={t.row.id}>
                                        <TableCell emphasis>{name}</TableCell>
                                        <TableCell emphasis>{t.val}</TableCell>
                                        <TableCell className="text-fg-muted">
                                          {t.ref}
                                        </TableCell>
                                        <TableCell>
                                          {t.status ? (
                                            <StatusBadge
                                              status={t.status}
                                              label={getStatusLabel(t.status)}
                                            />
                                          ) : (
                                            <span className="text-fg-muted">
                                              —
                                            </span>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {/* The care team's results are
                                              read-only: no controls. */}
                                          {t.editable ? (
                                            <LabResultActions
                                              name={name}
                                              value={t.row.value}
                                              isEs={isEs}
                                              onSave={(value) =>
                                                labs.updateResult(t.row.id, {
                                                  value,
                                                })
                                              }
                                              onRemove={() =>
                                                labs.removeResult(t.row.id)
                                              }
                                            />
                                          ) : (
                                            <span className="text-caption text-fg-muted">
                                              {isEs
                                                ? "De su clínica"
                                                : "From your clinic"}
                                            </span>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <LoadMore read={labs.list} />
              </div>
            </TabPanel>
          </div>

          {/* The summary, the category list, the library — a row of three. */}
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader
                title={l?.sidebar?.latestSummary?.title || "Latest lab summary"}
                action={
                  <Info
                    aria-hidden="true"
                    className="h-4 w-4 text-fg-icon-quiet"
                  />
                }
              />
              <div className="mt-stack-lg grid grid-cols-3 gap-inline-md">
                {[
                  {
                    n: kpis.inRange,
                    label: l?.sidebar?.latestSummary?.inRange || "In Range",
                    tone: "bg-success-surface text-success",
                  },
                  {
                    n: kpis.high,
                    label: l?.sidebar?.latestSummary?.high || "High",
                    tone: "bg-warning-surface text-warning",
                  },
                  {
                    n: kpis.low,
                    label: l?.sidebar?.latestSummary?.low || "Low",
                    tone: "bg-danger-surface text-danger",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-card-nested p-inset-sm text-center ${stat.tone}`}
                  >
                    <p className="text-metric-md">{stat.n}</p>
                    <p className="text-label-sm">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-stack-lg space-y-stack-sm rounded-card-nested border border-line bg-surface-sunken p-inset-md">
                <p className="text-label-md text-fg">
                  {l?.sidebar?.latestSummary?.keepUpTitle ||
                    "Keep up the good work!"}
                </p>
                <p className="text-body-sm text-fg-muted">
                  {l?.sidebar?.latestSummary?.keepUpDesc ||
                    "Continue following your care plan and attend your dialysis treatments."}
                </p>
                <Button
                  variant="neutral"
                  appearance="fill-stroke"
                  size="small"
                  fullWidth
                  onClick={() => setActiveTab("trends")}
                >
                  {l?.sidebar?.latestSummary?.viewTrends || "View Trends"}
                </Button>
              </div>
            </Card>

            <Card>
              <CardHeader
                title={l?.sidebar?.categories?.title || "Lab categories"}
              />
              <ul className="mt-stack-md space-y-stack-xs">
                {[
                  {
                    name: l?.categories?.all || "All Categories",
                    count: testsLabel(totalTests),
                    icon: Layers,
                    key: "all",
                  },
                  ...LAB_CATEGORIES.map((cat) => ({
                    name: getCategoryName(cat.id, cat.name),
                    count: testsLabel(cat.tests.length),
                    icon: categoryIcons[cat.id] ?? cat.icon,
                    key: cat.id,
                  })),
                ].map((cat) => {
                  const selected = selectedCategory === cat.key;
                  return (
                    <li key={cat.key}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSelectedCategory(cat.key)}
                        className={`flex w-full cursor-pointer items-center justify-between gap-inline-md rounded-control px-inset-sm py-inset-xs text-left text-body-sm transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                          selected
                            ? "bg-primary-soft text-fg-brand"
                            : "text-fg-secondary hover:bg-surface-sunken"
                        }`}
                      >
                        <span className="flex items-center gap-inline-sm">
                          <cat.icon
                            aria-hidden="true"
                            className={`h-4 w-4 shrink-0 fill-current ${selected ? "text-fg-brand" : "text-fg-muted"}`}
                          />
                          {cat.name}
                        </span>
                        <span className="text-caption text-fg-muted">
                          {cat.count}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Button
                variant="neutral"
                appearance="fill-stroke"
                size="small"
                fullWidth
                className="mt-stack-md"
                onClick={() => setSelectedCategory("all")}
              >
                {l?.sidebar?.categories?.viewAllTrends || "View All Trends"}
              </Button>
            </Card>

            <Card>
              <div className="flex items-center gap-inline-md">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-surface-brand-subtle text-fg-brand"
                >
                  <BookOpen className="h-4 w-4" />
                </span>
                <h2 className="text-heading-4 text-fg">
                  {l?.sidebar?.understanding?.title ||
                    "Understanding your labs"}
                </h2>
              </div>
              <p className="mt-stack-sm text-body-sm text-fg-muted">
                {l?.sidebar?.understanding?.desc ||
                  "Learn what your lab numbers mean and how they affect your health."}
              </p>
              <Link
                href="/dashboard/my-library?from=labs"
                className={
                  buttonStyles({
                    variant: "neutral",
                    appearance: "fill-stroke",
                    size: "small",
                    fullWidth: true,
                  }) + " mt-stack-md"
                }
              >
                {l?.sidebar?.understanding?.visitCenter || "Visit My Library"}
              </Link>
            </Card>
          </div>
        </div>
      </AsyncSection>
    </div>
  );
}
