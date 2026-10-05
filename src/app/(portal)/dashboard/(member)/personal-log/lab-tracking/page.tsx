"use client";

import { ClinicLabsCard } from "@/features/labs/ClinicLabsCard";
import { LabInfoButton } from "@/features/labs/LabInfoButton";
import React, { useState } from "react";
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
  Badge,
  Button,
  buttonStyles,
  Card,
  CardHeader,
  KeyCard,
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
import { useCustomLabResult } from "@/features/labs/useCustomLabResult";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";

export default function MyLabsPage() {
  const { language, dictionary } = useLanguage();
  const l = dictionary?.labTracking;

  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "history">(
    "overview",
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [compareDateId, setCompareDateId] = useState<string>("2024-04-30");
  const {
    result: customData,
    isPending: labsPending,
    error: labsError,
    refetch: refetchLabs,
  } = useCustomLabResult();
  const [expandedHistoryIdx, setExpandedHistoryIdx] = useState<number | null>(
    0,
  );

  const pastDrawDates = [
    {
      id: "2024-04-30",
      label: language === "ES" ? "30 Abr, 2024" : "Apr 30, 2024",
      type: "draw",
    },
    {
      id: "2024-03-15",
      label: language === "ES" ? "15 Mar, 2024" : "Mar 15, 2024",
      type: "draw",
    },
    {
      id: "2024-02-01",
      label: language === "ES" ? "01 Feb, 2024" : "Feb 01, 2024",
      type: "draw",
    },
    {
      id: "2024-01-10",
      label: language === "ES" ? "10 Ene, 2024" : "Jan 10, 2024",
      type: "draw",
    },
    {
      id: "last-7-days",
      label: l?.overview?.compare?.last7Days || "Last 7 Days (1 Week)",
      type: "preset",
    },
    {
      id: "last-30-days",
      label: l?.overview?.compare?.last30Days || "Last 30 Days (1 Month)",
      type: "preset",
    },
    {
      id: "last-90-days",
      label: l?.overview?.compare?.last90Days || "Last 90 Days (3 Months)",
      type: "preset",
    },
    {
      id: "last-6-months",
      label: l?.overview?.compare?.last6Months || "Last 6 Months",
      type: "preset",
    },
    {
      id: "last-1-year",
      label: l?.overview?.compare?.last1Year || "Last 1 Year",
      type: "preset",
    },
  ];

  const latestDrawDate = customData?.date
    ? new Date(customData.date).toLocaleDateString(
        language === "ES" ? "es-ES" : "en-US",
        { month: "short", day: "numeric", year: "numeric" },
      )
    : language === "ES"
      ? "31 May, 2024"
      : "May 31, 2024";

  /* The stat card shows the day large and the year beneath it: a full date
     at figure size does not fit a fifth of the row. */
  const drawDate = customData?.date
    ? new Date(customData.date)
    : new Date(2024, 4, 31);
  const drawDay = drawDate.toLocaleDateString(
    language === "ES" ? "es-ES" : "en-US",
    { month: "short", day: "numeric" },
  );

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

  const getStatusLabel = (status: "In Range" | "High" | "Low") => {
    if (status === "In Range")
      return l?.overview?.statuses?.inRange || "In Range";
    if (status === "High") return l?.overview?.statuses?.high || "High";
    return l?.overview?.statuses?.low || "Low";
  };

  const mergedCategories = LAB_CATEGORIES.map((cat) => ({
    ...cat,
    displayName: getCategoryName(cat.id, cat.name),
    tests: cat.tests.map((test) => {
      const displayName = getTestDisplayName(test.id, test.name);
      if (customData?.values && customData.values[test.name]) {
        const rawVal = customData.values[test.name];
        const unitParts = test.latestResult.split(" ");
        const unit = unitParts.length > 1 ? unitParts.slice(1).join(" ") : "";
        const formatted =
          rawVal.includes(" ") || !unit ? rawVal : `${rawVal} ${unit}`;
        return {
          ...test,
          displayName,
          latestResult: formatted,
        };
      }
      return {
        ...test,
        displayName,
      };
    }),
  }));

  const filteredCategories =
    selectedCategory === "all"
      ? mergedCategories
      : mergedCategories.filter((cat) => cat.id === selectedCategory);

  const datesOverview =
    language === "ES"
      ? ["4 Feb", "1 Mar", "10 Abr", "15 May", "12 Jun"]
      : ["Feb 4", "Mar 1", "Apr 10", "May 15", "Jun 12"];

  return (
    <div className="w-full space-y-4" aria-busy={labsPending || undefined}>
      <PersonalLogDisclaimer />

      <ClinicLabsCard isEs={language === "ES"} />

      {/* Most of this page is reference data, which renders either way. Only
          the member's own entered draw comes from storage — so a failed read
          is a notice, not an error page. Saying nothing would leave the
          reference numbers looking like the member's complete record. */}
      {labsError ? (
        <Alert
          tone="warning"
          title={
            language === "ES"
              ? "No se pudieron cargar sus resultados"
              : "Your own entered results did not load"
          }
          action={
            <Button
              variant="neutral"
              appearance="fill-stroke"
              size="small"
              onClick={refetchLabs}
            >
              {language === "ES" ? "Reintentar" : "Try again"}
            </Button>
          }
        >
          {language === "ES"
            ? "Lo que se muestra abajo no incluye la extracción que usted ingresó."
            : "What is shown below does not include the draw you entered."}
        </Alert>
      ) : null}

      {/* 1. Stat cards — the shared KeyCard, as on every dashboard. */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KeyCard
          icon={<CalendarDays />}
          value={drawDay}
          label={l?.kpis?.latestDate || "Latest Lab Date"}
          note={String(drawDate.getFullYear())}
        />
        <KeyCard
          tone="success"
          icon={<CheckCircleSolid />}
          value={
            <>
              16
              <span className="text-heading-4 text-fg-muted"> / 25</span>
            </>
          }
          label={l?.kpis?.inRange || "In Range"}
          note={language === "ES" ? "64% de los resultados" : "64% of results"}
        />
        <KeyCard
          tone="warning"
          icon={<AlertTriangleSolid />}
          value={
            <>
              6<span className="text-heading-4 text-fg-muted"> / 25</span>
            </>
          }
          label={l?.kpis?.outOfRange || "Out of Range"}
          note={language === "ES" ? "24% de los resultados" : "24% of results"}
        />
        <KeyCard
          tone="success"
          icon={<TrendingUp />}
          value="7"
          label={l?.kpis?.trendingUp || "Trending Up"}
        />
        <KeyCard
          tone="danger"
          icon={<TrendingDown />}
          value="5"
          label={l?.kpis?.trendingDown || "Trending Down"}
        />
      </section>

      {/* 3. Main Grid Layout (Left Content + Right Sidebar) */}
      {/* The table needs ~930px for its seven columns, so it takes the full
          row (the showcase rule) and the side cards sit in a row beneath. */}
      <div className="space-y-4">
        <div className="space-y-4">
          {/* The view's toolbar: the tabs and the category filter on the
              left, the page's actions on the right, the primary one last. */}
          <div className="flex flex-wrap items-center justify-between gap-inline-md">
            <div className="flex flex-wrap items-center gap-inline-md">
              <Tabs
                label={
                  language === "ES" ? "Vista de laboratorios" : "Lab views"
                }
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
                  aria-label="Filter by category"
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
                onClick={() => window.print()}
              >
                <Download />
                {l?.actions?.exportPdf || "Export PDF"}
              </Button>
              <Link
                href="/dashboard/personal-log/lab-tracking/add"
                className={buttonStyles({ size: "small" })}
              >
                <Plus />
                {l?.actions?.addLabResult || "Add Lab Result"}
              </Link>
            </div>
          </div>

          {/* TAB 1: OVERVIEW & COMPARE VIEW — the shared Table, flush in its
              card, each category a sub-header row. */}
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
                          aria-label="Select comparison lab draw date"
                          value={compareDateId}
                          onChange={(e) => setCompareDateId(e.target.value)}
                          className="w-full cursor-pointer appearance-none rounded-control-small bg-transparent pr-5 text-label-sm text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <optgroup
                            label={
                              l?.overview?.compare?.pastDrawDatesGroup ||
                              "Past Lab Draw Dates"
                            }
                          >
                            {pastDrawDates
                              .filter((d) => d.type === "draw")
                              .map((date) => (
                                <option key={date.id} value={date.id}>
                                  {date.label}
                                </option>
                              ))}
                          </optgroup>
                          <optgroup
                            label={
                              l?.overview?.compare?.presetsGroup ||
                              "Timeframe Presets"
                            }
                          >
                            {pastDrawDates
                              .filter((d) => d.type === "preset")
                              .map((date) => (
                                <option key={date.id} value={date.id}>
                                  {date.label}
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
                      {/* The category, as a sub-header row. */}
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
                                isEs={language === "ES"}
                              />
                            </span>
                          </TableCell>
                          <TableCell emphasis>{test.latestResult}</TableCell>
                          <TableCell>{test.previousResult}</TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell className="text-fg-muted">
                            {test.refRange}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={test.status}
                              label={getStatusLabel(test.status)}
                            />
                          </TableCell>
                          <TableCell>
                            {/* The shared Sparkline: a screen reader gets its
                                label, and one reading does not divide by 0. */}
                            <Sparkline
                              points={test.sparkline}
                              tone={sparklineTone(test.status)}
                              label={`${getTestDisplayName(
                                test.id,
                                test.name,
                              )} trend`}
                              width={80}
                              height={24}
                            />
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

          {/* TAB 2: TRENDS VIEW */}
          <TabPanel id="trends" value={activeTab}>
            <div className="space-y-6">
              <div className="space-y-6">
                {filteredCategories.map((category) => (
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

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {category.tests.map((test) => {
                        let theme:
                          | "purple"
                          | "green"
                          | "orange"
                          | "blue"
                          | "rose"
                          | "teal" = "purple";
                        if (test.name.includes("Potassium")) theme = "purple";
                        else if (test.name.includes("Phosphorus"))
                          theme = "green";
                        else if (test.name.includes("Calcium"))
                          theme = "orange";
                        else if (test.name.includes("Creatinine"))
                          theme = "rose";
                        else if (test.name.includes("eGFR")) theme = "blue";
                        else if (test.name.includes("Sodium")) theme = "teal";
                        else if (test.name.includes("Hemoglobin"))
                          theme = "rose";
                        else if (test.name.includes("Kt/V")) theme = "green";
                        else if (test.name.includes("Albumin"))
                          theme = "orange";
                        else if (test.name.includes("BUN")) theme = "purple";
                        else theme = "blue";

                        const unitParts = test.latestResult.split(" ");
                        const unit = unitParts.slice(1).join(" ") || "";

                        return (
                          <TrendLineCard
                            key={test.id}
                            testName={test.displayName}
                            unit={unit}
                            data={test.sparkline}
                            dates={datesOverview}
                            colorTheme={theme}
                            refRange={test.refRange}
                            refRangeLabel={l?.trends?.refRange || "Ref Range"}
                            latestLabel={l?.trends?.latest || "Latest"}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabPanel>

          {/* TAB 3: DEDICATED HISTORY VIEW */}
          <TabPanel id="history" value={activeTab}>
            <div className="space-y-4">
              <div className="space-y-4">
                {[
                  {
                    date: latestDrawDate,
                    tag: l?.history?.latestDraw || "Latest Draw",
                    tagTone: "success" as const,
                    notes:
                      customData?.notes ||
                      l?.history?.sampleNotes?.draw1 ||
                      "Routine monthly blood draw. Discussed phosphorus binder dosage with care team.",
                    detailedTests:
                      customData?.values &&
                      Object.keys(customData.values).length > 0
                        ? LAB_CATEGORIES.map((cat) => {
                            const recordedForCat = cat.tests.filter(
                              (t) => customData.values?.[t.name],
                            );
                            if (recordedForCat.length === 0) return null;
                            return {
                              category: getCategoryName(cat.id, cat.name),
                              tests: recordedForCat.map((t) => {
                                const userVal =
                                  customData.values?.[t.name] || "";
                                const unitParts = t.latestResult.split(" ");
                                const unit = unitParts.slice(1).join(" ");
                                const formattedVal =
                                  userVal.includes(" ") || !unit
                                    ? userVal
                                    : `${userVal} ${unit}`;
                                return {
                                  name: getTestDisplayName(t.id, t.name),
                                  val: formattedVal,
                                  ref: t.refRange,
                                  status: t.status,
                                };
                              }),
                            };
                          })
                            // NonNullable<typeof g> keeps the mapped shape
                            // instead of restating it and drifting from it.
                            .filter(
                              (g): g is NonNullable<typeof g> => g !== null,
                            )
                        : [
                            {
                              category:
                                l?.categories?.kidneyFunction ||
                                "Kidney function",
                              tests: [
                                {
                                  name: getTestDisplayName("bun", "BUN"),
                                  val: "48 mg/dL",
                                  ref: "7 – 20 mg/dL",
                                  status: "High" as const,
                                },
                                {
                                  name: getTestDisplayName(
                                    "creatinine",
                                    "Creatinine",
                                  ),
                                  val: "6.48 mg/dL",
                                  ref: "0.6 – 1.3 mg/dL",
                                  status: "High" as const,
                                },
                                {
                                  name: getTestDisplayName(
                                    "egfr",
                                    "eGFR (CKD-EPI)",
                                  ),
                                  val: "9 mL/min",
                                  ref: "> 90 mL/min",
                                  status: "Low" as const,
                                },
                              ],
                            },
                            {
                              category:
                                l?.categories?.electrolytes || "Electrolytes",
                              tests: [
                                {
                                  name: getTestDisplayName(
                                    "potassium",
                                    "Potassium",
                                  ),
                                  val: "5.2 mEq/L",
                                  ref: "3.5 – 5.0 mEq/L",
                                  status: "High" as const,
                                },
                                {
                                  name: getTestDisplayName("sodium", "Sodium"),
                                  val: "138 mEq/L",
                                  ref: "135 – 145 mEq/L",
                                  status: "In Range" as const,
                                },
                              ],
                            },
                          ],
                  },
                  {
                    date: language === "ES" ? "30 Abr, 2024" : "Apr 30, 2024",
                    tag: l?.history?.previousDraw || "Previous Draw",
                    tagTone: "info" as const,
                    notes:
                      l?.history?.sampleNotes?.draw2 ||
                      "Pre-dialysis lab check. Fasting draw at 8:00 AM.",
                    detailedTests: [
                      {
                        category:
                          l?.categories?.kidneyFunction || "Kidney function",
                        tests: [
                          {
                            name: getTestDisplayName("bun", "BUN"),
                            val: "46 mg/dL",
                            ref: "7 – 20 mg/dL",
                            status: "High" as const,
                          },
                          {
                            name: getTestDisplayName(
                              "creatinine",
                              "Creatinine",
                            ),
                            val: "6.12 mg/dL",
                            ref: "0.6 – 1.3 mg/dL",
                            status: "High" as const,
                          },
                          {
                            name: getTestDisplayName("egfr", "eGFR (CKD-EPI)"),
                            val: "10 mL/min",
                            ref: "> 90 mL/min",
                            status: "Low" as const,
                          },
                        ],
                      },
                      {
                        category: l?.categories?.electrolytes || "Electrolytes",
                        tests: [
                          {
                            name: getTestDisplayName("sodium", "Sodium"),
                            val: "139 mEq/L",
                            ref: "135 – 145 mEq/L",
                            status: "In Range" as const,
                          },
                          {
                            name: getTestDisplayName("potassium", "Potassium"),
                            val: "5.0 mEq/L",
                            ref: "3.5 – 5.0 mEq/L",
                            status: "In Range" as const,
                          },
                        ],
                      },
                    ],
                  },
                  {
                    date: language === "ES" ? "15 Mar, 2024" : "Mar 15, 2024",
                    tag: l?.history?.twoMonthsAgo || "2 Months Ago",
                    tagTone: "neutral" as const,
                    notes:
                      l?.history?.sampleNotes?.draw3 ||
                      "Monthly nephrology review panel.",
                    detailedTests: [
                      {
                        category:
                          l?.categories?.kidneyFunction || "Kidney function",
                        tests: [
                          {
                            name: getTestDisplayName("bun", "BUN"),
                            val: "42 mg/dL",
                            ref: "7 – 20 mg/dL",
                            status: "High" as const,
                          },
                          {
                            name: getTestDisplayName(
                              "creatinine",
                              "Creatinine",
                            ),
                            val: "5.80 mg/dL",
                            ref: "0.6 – 1.3 mg/dL",
                            status: "High" as const,
                          },
                          {
                            name: getTestDisplayName("egfr", "eGFR (CKD-EPI)"),
                            val: "11 mL/min",
                            ref: "> 90 mL/min",
                            status: "Low" as const,
                          },
                        ],
                      },
                    ],
                  },
                  {
                    date: language === "ES" ? "01 Feb, 2024" : "Feb 01, 2024",
                    tag: l?.history?.threeMonthsAgo || "3 Months Ago",
                    tagTone: "neutral" as const,
                    notes:
                      l?.history?.sampleNotes?.draw4 ||
                      "Routine electrolyte & iron panel.",
                    detailedTests: [
                      {
                        category:
                          l?.categories?.kidneyFunction || "Kidney function",
                        tests: [
                          {
                            name: getTestDisplayName("bun", "BUN"),
                            val: "38 mg/dL",
                            ref: "7 – 20 mg/dL",
                            status: "High" as const,
                          },
                          {
                            name: getTestDisplayName(
                              "creatinine",
                              "Creatinine",
                            ),
                            val: "5.50 mg/dL",
                            ref: "0.6 – 1.3 mg/dL",
                            status: "High" as const,
                          },
                        ],
                      },
                    ],
                  },
                  {
                    date: language === "ES" ? "10 Ene, 2024" : "Jan 10, 2024",
                    tag: l?.history?.fourMonthsAgo || "4 Months Ago",
                    tagTone: "neutral" as const,
                    notes:
                      l?.history?.sampleNotes?.draw5 ||
                      "Initial Stage 5 CKD baseline laboratory evaluation.",
                    detailedTests: [
                      {
                        category:
                          l?.categories?.kidneyFunction || "Kidney function",
                        tests: [
                          {
                            name: getTestDisplayName("bun", "BUN"),
                            val: "35 mg/dL",
                            ref: "7 – 20 mg/dL",
                            status: "High" as const,
                          },
                          {
                            name: getTestDisplayName(
                              "creatinine",
                              "Creatinine",
                            ),
                            val: "5.20 mg/dL",
                            ref: "0.6 – 1.3 mg/dL",
                            status: "High" as const,
                          },
                        ],
                      },
                    ],
                  },
                ].map((draw, idx) => {
                  const isExpanded = expandedHistoryIdx === idx;
                  return (
                    <div
                      key={idx}
                      className={`overflow-hidden rounded-card border bg-surface shadow-(--card-shadow) transition-colors duration-150 ease-standard ${
                        isExpanded ? "border-action" : "border-line"
                      }`}
                    >
                      {/* The whole header is the control, so a keyboard user
                          can open a draw. */}
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
                            {draw.date}
                          </span>
                          <Badge
                            tone={draw.tagTone}
                            variant={
                              draw.tagTone === "neutral" ? "soft" : "solid"
                            }
                          >
                            {draw.tag}
                          </Badge>
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
                        {draw.detailedTests
                          .flatMap((g) => g.tests)
                          .map((t, tIdx) => (
                            <div key={tIdx} className="min-w-0">
                              <span className="block truncate text-caption text-fg-muted">
                                {t.name}
                              </span>
                              <span className="text-label-md text-fg">
                                {t.val}
                              </span>
                            </div>
                          ))}
                      </div>

                      {draw.notes && (
                        <p className="border-t border-line px-card py-inset-sm text-body-sm text-fg-muted">
                          <span className="text-label-md text-fg">
                            {l?.history?.noteLabel || "Note:"}
                          </span>{" "}
                          {draw.notes}
                        </p>
                      )}

                      {/* The draw's values, one table per category. */}
                      {isExpanded && (
                        <div className="space-y-4 border-t border-line p-card">
                          {draw.detailedTests.map((group, gIdx) => (
                            <div
                              key={gIdx}
                              className="overflow-hidden rounded-card-nested border border-line"
                            >
                              <p className="border-b border-line bg-surface-sunken px-(--table-edge) py-inset-xs text-label-md text-fg">
                                {group.category}
                              </p>
                              <Table minWidth={480}>
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
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {group.tests.map((t, tIdx) => (
                                    <TableRow key={tIdx}>
                                      <TableCell emphasis>{t.name}</TableCell>
                                      <TableCell emphasis>{t.val}</TableCell>
                                      <TableCell className="text-fg-muted">
                                        {t.ref}
                                      </TableCell>
                                      <TableCell>
                                        <StatusBadge
                                          status={
                                            t.status as
                                              "High" | "In Range" | "Low"
                                          }
                                          label={getStatusLabel(
                                            t.status as
                                              "High" | "In Range" | "Low",
                                          )}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
                  n: 16,
                  label: l?.sidebar?.latestSummary?.inRange || "In Range",
                  tone: "bg-success-surface text-success",
                },
                {
                  n: 6,
                  label: l?.sidebar?.latestSummary?.high || "High",
                  tone: "bg-warning-surface text-warning",
                },
                {
                  n: 3,
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
                  count: language === "ES" ? "25 Pruebas" : "25 Tests",
                  icon: Layers,
                  key: "all",
                },
                {
                  name: l?.categories?.kidneyFunction || "Kidney Function",
                  count: language === "ES" ? "3 Pruebas" : "3 Tests",
                  icon: Kidneys,
                  key: "kidney-function",
                },
                {
                  name: l?.categories?.electrolytes || "Electrolytes",
                  count: language === "ES" ? "4 Pruebas" : "4 Tests",
                  icon: FlaskConical,
                  key: "electrolytes",
                },
                {
                  name: l?.categories?.mineralBone || "Mineral & Bone",
                  count: language === "ES" ? "4 Pruebas" : "4 Tests",
                  icon: Bone,
                  key: "mineral-bone",
                },
                {
                  name: l?.categories?.bloodCounts || "Blood Counts",
                  count: language === "ES" ? "4 Pruebas" : "4 Tests",
                  icon: Droplet,
                  key: "blood-counts",
                },
                {
                  name: l?.categories?.nutrition || "Nutrition",
                  count: language === "ES" ? "2 Pruebas" : "2 Tests",
                  icon: Apple,
                  key: "nutrition",
                },
                {
                  name: l?.categories?.dialysisAdequacy || "Dialysis Adequacy",
                  count: language === "ES" ? "1 Prueba" : "1 Test",
                  icon: HeartPulse,
                  key: "dialysis-adequacy",
                },
              ].map((cat) => {
                const selected = selectedCategory === cat.key;
                return (
                  <li key={cat.key}>
                    {/* A filter list, so a pressed state, not a link. */}
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
                {l?.sidebar?.understanding?.title || "Understanding your labs"}
              </h2>
            </div>
            <p className="mt-stack-sm text-body-sm text-fg-muted">
              {l?.sidebar?.understanding?.desc ||
                "Learn what your lab numbers mean and how they affect your health."}
            </p>
            <Link
              href="/dashboard/my-library"
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
    </div>
  );
}
