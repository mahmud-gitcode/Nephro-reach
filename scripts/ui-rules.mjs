#!/usr/bin/env node
/**
 * UI rules — the design system, enforced.
 *
 * Why this exists: the redesign (phases 1–4, 2026-09-28) put every colour,
 * size, radius and shadow behind tokens and shared components. A page that
 * writes `text-sm`, `bg-[#fcfcfd]` or `rounded-xl` instead bypasses all of
 * it — the next AI prompt copies the nearest example, and the mess spreads.
 * This check finds those spots.
 *
 * It is a RATCHET, not a wall. Existing violations are recorded in
 * scripts/ui-rules.baseline.json; `--check` fails only when a file has MORE
 * of a kind than its baseline, or a new file has any. Old pages do not
 * block anyone, new mess cannot get in, and every cleanup (phase 6) lowers
 * the baseline with `--update`.
 *
 *   npm run ui:rules            report
 *   npm run ui:rules:check      fail on anything worse than the baseline
 *   npm run ui:rules:update     accept the current counts as the baseline
 *
 * Scope is the portal canvas. Not scanned: the landing page and its
 * Header/Footer (off-limits), the dashboard shell (it holds the sidebar,
 * the client's), components/ui and the tokens (the system itself), the
 * design-system page (it shows raw values on purpose), and tests.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { collectFiles } from "./source-files.mjs";

const BASELINE = "scripts/ui-rules.baseline.json";
const mode = process.argv.includes("--check")
  ? "check"
  : process.argv.includes("--update")
    ? "update"
    : "report";

/* ---- rules ------------------------------------------------------------
   Each is a regex over one line, and the fix to reach for instead. `gate`
   rules count toward --check; `advice` ones are listed but never fail. */
const PALETTES =
  "slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const COLOR_UTILITIES =
  "bg|text|border|ring|outline|divide|fill|stroke|from|via|to|shadow|decoration|accent|caret|placeholder";

const RULES = [
  {
    id: "hex-colour",
    kind: "gate",
    re: new RegExp(`\\b(?:${COLOR_UTILITIES})-\\[#[0-9a-fA-F]{3,8}\\]`, "g"),
    fix: "a colour token: bg-surface, text-fg-muted, border-line…",
  },
  {
    id: "palette-colour",
    kind: "gate",
    re: new RegExp(
      `\\b(?:${COLOR_UTILITIES})-(?:${PALETTES})-\\d{2,3}\\b`,
      "g",
    ),
    fix: "a semantic colour: text-danger, bg-success-surface, text-fg-brand…",
  },
  {
    id: "text-size",
    kind: "gate",
    re: /\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b|\btext-\[\d+(?:\.\d+)?(?:px|rem)\]/g,
    fix: "a type style: text-body-sm, text-label-md, text-caption, text-heading-4…",
  },
  {
    id: "radius",
    kind: "gate",
    re: /\brounded(?:-[trblse]{1,2})?-(?:sm|md|lg|xl|2xl|3xl)\b|\brounded(?:-[trblse]{1,2})?-\[\d/g,
    fix: "a radius token: rounded-card, rounded-card-nested, rounded-button, rounded-field, rounded-status, rounded-pill",
  },
  {
    id: "raw-table",
    kind: "gate",
    re: /<table\b/g,
    fix: "the shared Table (Table, TableHead, TableRow, TableCell…)",
  },
  {
    id: "raw-control",
    kind: "advice",
    re: /<(?:button|select)\b|<input\b(?![^>]*type="(?:hidden|file|checkbox|radio)")/g,
    fix: "Button, Select, Input, SearchField — unless it is a genuinely custom control",
  },
];

/* ---- scope ------------------------------------------------------------ */
const INCLUDE = [
  "src/app/(portal)",
  "src/app/(auth)",
  "src/features",
  "src/components",
];
const EXCLUDE = [
  "src/app/(landing-page)",
  "src/features/landing-page",
  "src/components/layout/Header",
  "src/components/layout/Footer",
  "src/components/layout/DashboardShell.tsx",
  "src/components/ui",
  "src/components/icons",
  "src/app/(portal)/dashboard/(admin)/design-system",
];

const norm = (p) => p.split(path.sep).join("/").replace(/^\.\//, "");
const inScope = (file) =>
  /\.(tsx?|jsx?)$/.test(file) &&
  !/\.test\.[jt]sx?$/.test(file) &&
  INCLUDE.some((dir) => file.startsWith(dir)) &&
  !EXCLUDE.some((dir) => file.startsWith(dir));

/* ---- scan ------------------------------------------------------------- */
const files = (await collectFiles(new Set([".ts", ".tsx", ".js", ".jsx"])))
  .map(norm)
  .filter(inScope)
  .sort();

/** { [file]: { [rule]: count } } for gate rules; advice counted apart. */
const counts = {};
const advice = {};
const samples = {};

for (const file of files) {
  const text = await readFile(file, "utf8");
  let inBlockComment = false;
  text.split("\n").forEach((line, index) => {
    // Comments explain; they do not style. Skip them.
    const trimmed = line.trim();
    if (inBlockComment) {
      if (trimmed.includes("*/")) inBlockComment = false;
      return;
    }
    if (trimmed.startsWith("/*") && !trimmed.includes("*/")) {
      inBlockComment = true;
      return;
    }
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;

    for (const rule of RULES) {
      const hits = line.match(rule.re);
      if (!hits) continue;
      const bucket = rule.kind === "gate" ? counts : advice;
      bucket[file] ??= {};
      bucket[file][rule.id] = (bucket[file][rule.id] ?? 0) + hits.length;
      samples[rule.id] ??= `${file}:${index + 1}  ${hits[0]}`;
    }
  });
}

/* ---- report ----------------------------------------------------------- */
const total = (bucket, id) =>
  Object.values(bucket).reduce((n, byRule) => n + (byRule[id] ?? 0), 0);

console.log(`UI rules — ${files.length} canvas files scanned\n`);
for (const rule of RULES) {
  const bucket = rule.kind === "gate" ? counts : advice;
  const n = total(bucket, rule.id);
  const fileCount = Object.values(bucket).filter((r) => r[rule.id]).length;
  console.log(
    `${rule.kind === "gate" ? "  " : "  (advice) "}${rule.id.padEnd(15)} ${String(n).padStart(4)} in ${fileCount} file(s)` +
      (n ? `\n      use ${rule.fix}\n      e.g. ${samples[rule.id]}` : ""),
  );
}

const byFile = Object.entries(counts)
  .map(([file, r]) => [file, Object.values(r).reduce((a, b) => a + b, 0)])
  .sort((a, b) => b[1] - a[1]);
if (byFile.length) {
  console.log("\nMost to clean up (phase 6):");
  for (const [file, n] of byFile.slice(0, 12)) {
    console.log(`  ${String(n).padStart(4)}  ${file}`);
  }
}

/* ---- baseline --------------------------------------------------------- */
if (mode === "update") {
  await writeFile(BASELINE, JSON.stringify(counts, null, 2) + "\n");
  console.log(`\nBaseline written: ${BASELINE}`);
} else if (mode === "check") {
  let baseline = {};
  try {
    baseline = JSON.parse(await readFile(BASELINE, "utf8"));
  } catch {
    console.error(`\nNo baseline at ${BASELINE}. Run: npm run ui:rules:update`);
    process.exit(1);
  }
  const worse = [];
  for (const [file, byRule] of Object.entries(counts)) {
    for (const [id, n] of Object.entries(byRule)) {
      const allowed = baseline[file]?.[id] ?? 0;
      if (n > allowed) worse.push(`${file}  ${id}: ${allowed} → ${n}`);
    }
  }
  if (worse.length) {
    console.error(
      "\n✖ UI rules: these files got worse than the baseline.\n" +
        "  Use the tokens and shared components named above instead.\n",
    );
    for (const line of worse) console.error(`  ${line}`);
    process.exit(1);
  }
  const better = Object.entries(baseline).some(([file, byRule]) =>
    Object.entries(byRule).some(([id, n]) => (counts[file]?.[id] ?? 0) < n),
  );
  console.log(
    "\n✔ No file is worse than the baseline." +
      (better
        ? " Some are better — run `npm run ui:rules:update` to lock that in."
        : ""),
  );
}
