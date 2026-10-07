#!/usr/bin/env node
/**
 * The performance budget.
 *
 * Next 16 with Turbopack does not print per-route sizes, so this measures
 * what actually ships: the JavaScript under .next/static, gzipped, which is
 * what a browser downloads.
 *
 * It is a gate, not a report. A number nobody fails is a number nobody
 * reads, so this exits non-zero when the budget is exceeded — and the
 * budget below is the measurement taken the day it was written, rounded up
 * a little. Raising it is allowed; raising it without saying why in the
 * commit message is not.
 *
 *   npm run budget
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";

/**
 * Gzipped kilobytes of JS under .next/static.
 *
 * 800 against a measured 728 — about 10% of headroom. Deliberately tight:
 * a budget with hundreds of kilobytes of slack is not a gate, it is a
 * number that will be discovered to have been exceeded some time after it
 * stopped mattering. At this margin, one heavy dependency fails the build
 * and somebody makes a decision about it on the day it arrives.
 *
 * Raised to 980 against a measured 888 (2026-09-21). No dependency was
 * added; the growth is 23 new routes (library, travel, table talk, admin,
 * exam, exercise, clinic) each shipping its own page chunk — the largest
 * is 21.7 KB. Same ~10% headroom rule as before. Note this sums every
 * route's JS, so it grows with every page even though no visitor downloads
 * more than a fraction of it.
 *
 * Raised to 1120 against a measured 1018 (2026-09-26). No dependency was
 * added; the growth is clinic treatment types, additional views, and
 * management pages each adding their own chunk. Same ~10% headroom rule.
 *
 * Raised to 1280 against a measured 1165 (2026-09-30). No dependency was
 * added; the largest chunks are still React/Next, the shared icons and
 * nav, and the course content. The growth is new frontend flows, each with
 * its own chunk: staff accounts and roles, CCM, messaging (attachments,
 * notifications, shared UI), reports, blood pressure, medications,
 * appointments and the live-class schedule. No single app chunk passes
 * 23 KB. Same ~10% headroom rule.
 *
 * Raised to 1480 against a measured 1341 (2026-10-07). No dependency was
 * added. First the weight that was waste: the Share Outside NephroReach
 * form had been copied into every page that offers it (logs, medications,
 * travel); it now loads on click (LazyShareOutsideModal), which took 13.5
 * KB off. The rest is the client's review rounds (2026-10-05 → 10-07):
 * a Support tab on every dashboard and the admin's Support Inbox, the
 * secure share page, medication editing, the CCM compliance filter and
 * checklist, after-hours messaging, safety and sharing notices, clinic
 * transportation, Before the ER and the vascular access rules. The
 * largest chunks are still React/Next; no app chunk passes 25 KB. This
 * total also counts lazy chunks Turbopack emits per route, which only
 * download when used. Same ~10% headroom rule.
 */
const BUDGET_KB = 1480;

const ROOT = ".next/static";

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const full = path.join(dir, name);
    const info = await stat(full);
    if (info.isDirectory()) out.push(...(await walk(full)));
    else if (name.endsWith(".js")) out.push(full);
  }
  return out;
}

let files;
try {
  files = await walk(ROOT);
} catch {
  console.error(`No build found at ${ROOT}. Run: npm run build`);
  process.exit(1);
}

const measured = [];
let totalRaw = 0;
let totalGzip = 0;

for (const file of files) {
  const source = await readFile(file);
  const gzip = gzipSync(source).length;
  totalRaw += source.length;
  totalGzip += gzip;
  measured.push({ file, raw: source.length, gzip });
}

measured.sort((a, b) => b.gzip - a.gzip);

const kb = (bytes) => (bytes / 1024).toFixed(1);

console.log(`${files.length} JS files under ${ROOT}`);
console.log(`  raw     ${kb(totalRaw)} KB`);
console.log(`  gzipped ${kb(totalGzip)} KB  (budget ${BUDGET_KB} KB)\n`);

console.log("largest, gzipped:");
for (const entry of measured.slice(0, 10)) {
  console.log(`  ${kb(entry.gzip).padStart(8)} KB  ${entry.file}`);
}

const totalKb = totalGzip / 1024;
if (totalKb > BUDGET_KB) {
  console.error(
    `\nOver budget by ${(totalKb - BUDGET_KB).toFixed(1)} KB.\n` +
      `Either find the weight, or raise BUDGET_KB in scripts/budget.mjs and say why.`,
  );
  process.exit(1);
}

console.log(
  `\nWithin budget, ${(BUDGET_KB - totalKb).toFixed(1)} KB to spare.`,
);
