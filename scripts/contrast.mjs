/**
 * Contrast gate for the colour tokens.
 *
 * The ramps in styles/tokens/color.css carry their contrast ratios in
 * comments. Comments do not fail a build, so a "make it brighter" pass can
 * quietly push muted text under 4.5:1 and nothing notices until somebody
 * with reduced vision cannot read a label.
 *
 * This resolves every semantic token to a hex value and asserts the pairs
 * that actually appear on screen. It reads the same file the app ships, so
 * it cannot drift from it.
 *
 * WCAG 2.2: 4.5:1 normal text, 3:1 large text and UI boundaries (1.4.11).
 * `--fg-subtle` is disabled-only and WCAG-exempt, so it is not asserted.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const CSS = join(here, "..", "src", "styles", "tokens", "color.css");

/* -------------------------------------------------------------------- read */

const source = readFileSync(CSS, "utf8");

/** Every `--name: value;` in the file, last declaration winning per block. */
function declarations(block) {
  const out = new Map();
  for (const match of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    out.set(match[1], match[2].trim());
  }
  return out;
}

function blockAfter(marker) {
  const start = source.indexOf(marker);
  if (start === -1) return "";
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open, i);
    }
  }
  return "";
}

const primitives = declarations(blockAfter("@theme {"));
const light = declarations(blockAfter(":root {"));
const dark = declarations(blockAfter('[data-theme="dark"] {'));

/** Follow `var(--x)` chains down to a literal colour. */
function resolve(value, scope) {
  let current = value;
  for (let hops = 0; hops < 12; hops += 1) {
    const ref = current.match(/^var\(\s*(--[\w-]+)\s*\)$/);
    if (!ref) return current;
    const next = scope.get(ref[1]) ?? primitives.get(ref[1]);
    if (!next) return null;
    current = next.trim();
  }
  return null;
}

/* ------------------------------------------------------------------- maths */

function toRgb(hex) {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function luminance(hex) {
  const rgb = toRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((channel) => {
    const v = channel / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* ------------------------------------------------------------------ checks */

/** [foreground token, background token, minimum, what it is]. */
const PAIRS = [
  ["--fg", "--canvas", 4.5, "body text on the page"],
  ["--fg", "--surface", 4.5, "body text on a card"],
  ["--fg-secondary", "--surface", 4.5, "supporting copy"],
  ["--fg-muted", "--surface", 4.5, "labels and captions"],
  ["--fg-muted", "--surface-sunken", 4.5, "labels in a well"],
  ["--fg-brand", "--surface", 4.5, "brand text and links"],
  ["--fg-on-brand", "--surface-brand", 4.5, "text on a brand fill"],
  ["--fg-on-nav", "--surface-nav", 4.5, "the sidebar rail"],

  ["--success", "--success-surface", 4.5, "success text on its tint"],
  ["--warning", "--warning-surface", 4.5, "warning text on its tint"],
  ["--danger", "--danger-surface", 4.5, "danger text on its tint"],
  ["--info", "--info-surface", 4.5, "info text on its tint"],
  ["--success", "--surface", 4.5, "success text on a card"],
  ["--warning", "--surface", 4.5, "warning text on a card"],
  ["--danger", "--danger-surface", 4.5, "danger text on its tint"],

  ["--tone-primary-on-solid", "--tone-primary-solid", 4.5, "primary button"],
  ["--tone-danger-on-solid", "--tone-danger-solid", 4.5, "danger button"],

  /* UI boundaries, WCAG 1.4.11 — 3:1 is the bar, not 4.5. */
  ["--ring", "--surface", 3, "the focus ring"],
];

let failures = 0;
let checked = 0;

/* Dark mode is opt-in and its migration is unfinished (see the header of
   color.css), so it is measured and reported but does not gate the build
   yet. Flip its `gates` to true once that migration lands. */
for (const [theme, scope, gates] of [
  ["light", light, true],
  ["dark", dark, false],
]) {
  if (scope.size === 0) continue;

  for (const [fgToken, bgToken, min, what] of PAIRS) {
    const fg = resolve(scope.get(fgToken) ?? light.get(fgToken) ?? "", scope);
    const bg = resolve(scope.get(bgToken) ?? light.get(bgToken) ?? "", scope);
    if (!fg || !bg) continue;

    const ratio = contrast(fg, bg);
    if (ratio === null) continue;

    checked += 1;
    if (ratio < min) {
      if (gates) failures += 1;
      console.error(
        `  ${gates ? "FAIL" : "warn"}  ${theme.padEnd(5)} ${what}\n` +
          `        ${fgToken} (${fg}) on ${bgToken} (${bg})\n` +
          `        ${ratio.toFixed(2)}:1, needs ${min}:1`,
      );
    } else if (process.argv.includes("--verbose")) {
      console.log(`  ok    ${theme.padEnd(5)} ${ratio.toFixed(2)}:1  ${what}`);
    }
  }
}

if (failures > 0) {
  console.error(
    `\ncontrast: ${failures} of ${checked} pair(s) below the WCAG floor.`,
  );
  process.exit(1);
}

console.log(`contrast: ${checked} pair(s) checked — all above the WCAG floor.`);
