/* ==========================================================================
   My Labs, built from the API (Phase 6)
   --------------------------------------------------------------------------
   Pure: the page hands in the result rows of its window (`GET …/labs`,
   every source: the member's own typed draws and the care team's results)
   and the trend series (`GET …/labs/trends`, the server's numeric
   readings), and gets back what each section shows. The panels'
   (labs.panels.seed.ts) demo readings are never shown: a test nobody has
   a result for shows "—".
   ========================================================================== */

import { LAB_CATEGORIES } from "./labs.panels.seed";
import {
  isOwnEntry,
  type ApiLabResult,
  type ApiLabTrend,
  type LabSource,
} from "./labs.mapper";

export type LabStatus = "In Range" | "High" | "Low";

/** Newest first: the draw day, then the time the row was written. */
export function newestFirst(rows: readonly ApiLabResult[]): ApiLabResult[] {
  return [...rows].sort(
    (a, b) =>
      b.collectedOn.localeCompare(a.collectedOn) ||
      b.createdAt.localeCompare(a.createdAt),
  );
}

/** The result's status: the lab's own flag first, else its number against
 *  its range. Null when neither says (no badge rather than a guess). */
export function statusOf(
  row: Pick<
    ApiLabResult,
    "abnormalFlag" | "valueNumeric" | "referenceLow" | "referenceHigh"
  >,
): LabStatus | null {
  const flag = row.abnormalFlag?.toUpperCase();
  if (flag === "H" || flag === "HH") return "High";
  if (flag === "L" || flag === "LL") return "Low";
  const n = row.valueNumeric;
  if (n === null || n === undefined) return null;
  if (row.referenceHigh !== null && n > row.referenceHigh) return "High";
  if (row.referenceLow !== null && n < row.referenceLow) return "Low";
  if (row.referenceHigh === null && row.referenceLow === null) return null;
  return "In Range";
}

export function displayValue(row: Pick<ApiLabResult, "value" | "unit">) {
  const unit = row.unit.trim();
  return unit && !row.value.includes(" ") ? `${row.value} ${unit}` : row.value;
}

/** A preset window of the compare picker, in days. */
export const COMPARE_PRESETS: Record<string, number> = {
  "last-7-days": 7,
  "last-30-days": 30,
  "last-90-days": 90,
  "last-6-months": 182,
  "last-1-year": 365,
};

function minusDays(day: string, days: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

/**
 * The reading to compare the latest against: "" is the one before the
 * latest; a day is the reading of that draw; a preset is the oldest
 * reading in that many days before `today` (not the latest itself).
 */
export function previousReading(
  readings: readonly ApiLabResult[],
  compare: string,
  today: string,
): ApiLabResult | null {
  const [, ...older] = readings;
  if (!compare) return older[0] ?? null;
  const days = COMPARE_PRESETS[compare];
  if (days !== undefined) {
    const since = minusDays(today, days);
    const inWindow = older.filter((r) => r.collectedOn.slice(0, 10) >= since);
    return inWindow[inWindow.length - 1] ?? null;
  }
  return older.find((r) => r.collectedOn.slice(0, 10) === compare) ?? null;
}

function round(n: number): string {
  return String(Math.round(n * 100) / 100);
}

export type PanelTestView = {
  id: string;
  name: string;
  latestResult: string;
  previousResult: string;
  /** Absolute change, or null without two numbers to compare. */
  change: string | null;
  changeDirection: "up" | "down";
  changeColor: "red" | "green" | "orange";
  refRange: string;
  status: LabStatus | null;
  /** The latest reading's row (null when there is none). */
  latest: ApiLabResult | null;
  /** The server's trend for this test (numeric readings, oldest first). */
  sparkline: number[];
  trendDates: string[];
  unit: string;
  sources: LabSource[];
};

export type PanelCategoryView = {
  id: string;
  name: string;
  icon: (typeof LAB_CATEGORIES)[number]["icon"];
  tests: PanelTestView[];
};

export function panelView(
  rows: readonly ApiLabResult[],
  trends: readonly ApiLabTrend[],
  compare: string,
  today: string,
): PanelCategoryView[] {
  const byTest = new Map<string, ApiLabResult[]>();
  for (const row of newestFirst(rows)) {
    const list = byTest.get(row.testCode) ?? [];
    list.push(row);
    byTest.set(row.testCode, list);
  }
  const trendOf = new Map(trends.map((t) => [t.testCode, t]));

  return LAB_CATEGORIES.map((category) => ({
    id: category.id,
    name: category.name,
    icon: category.icon,
    tests: category.tests.map((test): PanelTestView => {
      const readings = byTest.get(test.id) ?? [];
      const latest = readings[0] ?? null;
      const previous = latest
        ? previousReading(readings, compare, today)
        : null;
      const trend = trendOf.get(test.id);
      const status = latest ? statusOf(latest) : null;
      const diff =
        latest?.valueNumeric != null && previous?.valueNumeric != null
          ? latest.valueNumeric - previous.valueNumeric
          : null;
      const unit = (latest?.unit || trend?.unit || "").trim();
      const range = (
        latest?.referenceRange ||
        trend?.referenceRange ||
        ""
      ).trim();
      return {
        id: test.id,
        name: test.name,
        latestResult: latest ? displayValue(latest) : "—",
        previousResult: previous ? displayValue(previous) : "—",
        change: diff === null ? null : round(Math.abs(diff)),
        changeDirection: diff !== null && diff < 0 ? "down" : "up",
        changeColor:
          status === null ? "orange" : status === "In Range" ? "green" : "red",
        refRange: range ? (unit ? `${range} ${unit}` : range) : test.refRange,
        status,
        latest,
        sparkline: trend?.points.map((p) => p.value) ?? [],
        trendDates: trend?.points.map((p) => p.collectedOn) ?? [],
        unit,
        sources: trend?.sources ?? [],
      };
    }),
  }));
}

export type LabKpis = {
  /** yyyy-mm-dd of the newest draw, or null. */
  latestDate: string | null;
  /** Panel tests with a latest result. */
  withResult: number;
  inRange: number;
  high: number;
  low: number;
  trendingUp: number;
  trendingDown: number;
};

export function kpisOf(
  view: readonly PanelCategoryView[],
  rows: readonly ApiLabResult[],
): LabKpis {
  const tests = view.flatMap((c) => c.tests).filter((t) => t.latest);
  const count = (s: LabStatus) => tests.filter((t) => t.status === s).length;
  const latestDate = rows.reduce<string | null>((max, r) => {
    const day = r.collectedOn.slice(0, 10);
    return !max || day > max ? day : max;
  }, null);
  return {
    latestDate,
    withResult: tests.length,
    inRange: count("In Range"),
    high: count("High"),
    low: count("Low"),
    trendingUp: tests.filter(
      (t) =>
        t.change !== null && t.change !== "0" && t.changeDirection === "up",
    ).length,
    trendingDown: tests.filter(
      (t) =>
        t.change !== null && t.change !== "0" && t.changeDirection === "down",
    ).length,
  };
}

/** The draw days the compare picker offers: every day but the newest. */
export function compareDays(rows: readonly ApiLabResult[]): string[] {
  const days = [...new Set(rows.map((r) => r.collectedOn.slice(0, 10)))];
  days.sort((a, b) => b.localeCompare(a));
  return days.slice(1);
}

const CATEGORY_OF = new Map(
  LAB_CATEGORIES.flatMap((c) => c.tests.map((t) => [t.id, c.id] as const)),
);

export type DrawTest = {
  row: ApiLabResult;
  name: string;
  val: string;
  ref: string;
  status: LabStatus | null;
  /** The member's own typed row: they may change or remove it. */
  editable: boolean;
};

export type DrawView = {
  /** yyyy-mm-dd */
  date: string;
  notes: string;
  /** Rows of this draw with a report the member can open. */
  withReport: ApiLabResult | null;
  /** Any of it came from the care team. */
  fromClinic: boolean;
  groups: { categoryId: string; tests: DrawTest[] }[];
};

/** The history: one entry per draw day, newest first, its results grouped
 *  by panel ("other" for a custom test). */
export function drawsOf(rows: readonly ApiLabResult[]): DrawView[] {
  const byDay = new Map<string, ApiLabResult[]>();
  for (const row of newestFirst(rows)) {
    const day = row.collectedOn.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(row);
    byDay.set(day, list);
  }
  return [...byDay.entries()].map(([date, dayRows]) => {
    const groups = new Map<string, DrawTest[]>();
    for (const row of dayRows) {
      const categoryId = CATEGORY_OF.get(row.testCode) ?? "other";
      const list = groups.get(categoryId) ?? [];
      list.push({
        row,
        name: row.testName,
        val: displayValue(row),
        ref: row.referenceRange
          ? `${row.referenceRange}${row.unit ? ` ${row.unit}` : ""}`
          : "—",
        status: statusOf(row),
        editable: isOwnEntry(row),
      });
      groups.set(categoryId, list);
    }
    const notes = [
      ...new Set(dayRows.map((r) => r.notes?.trim()).filter(Boolean)),
    ].join(" · ");
    return {
      date,
      notes,
      withReport: dayRows.find((r) => r.hasReport) ?? null,
      fromClinic: dayRows.some((r) => !isOwnEntry(r)),
      groups: [...groups.entries()].map(([categoryId, tests]) => ({
        categoryId,
        tests,
      })),
    };
  });
}

/** Care-team results the member has not marked seen. */
export function unseenClinicRows(
  rows: readonly ApiLabResult[],
): ApiLabResult[] {
  return rows.filter((r) => !isOwnEntry(r) && r.seenByPatientAt === null);
}
