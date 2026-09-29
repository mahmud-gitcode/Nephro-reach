#!/usr/bin/env node
/**
 * One-off codemod for phase 6 of the UI redesign: rewrites raw Tailwind
 * text sizes and radii to the design system's named styles, in the same
 * files `scripts/ui-rules.mjs` scans. Colours and raw tables are not
 * touched — they need judgement and were done by hand.
 *
 *   node scripts/ui-codemod.mjs          dry run: counts per file
 *   node scripts/ui-codemod.mjs --write  apply
 *
 * Mappings keep the rendered size as close as the scale allows:
 *   text-xs 12 → caption · sm 14 → body-sm · base 16 → body-md ·
 *   lg 18 → body-lg · xl 20 → heading-4 · 2xl 24 → heading-3 ·
 *   3xl 30 → heading-2 · 4xl+ → heading-1; text-[Npx] → nearest, never
 *   below 12px (a 10px label becomes 12).
 *   rounded-sm → control-small · md, lg → control · xl → card on a card
 *   container (border + surface fill + padding), else card-nested ·
 *   2xl, 3xl → card; rounded-[Npx] → nearest.
 * A size's weight classes (font-bold…) are left alone and still win, since
 * the named styles read weight through --tw-font-weight.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { collectFiles } from "./source-files.mjs";

const write = process.argv.includes("--write");

/* Same scope as ui-rules.mjs. */
const INCLUDE = ["src/app/(portal)", "src/features", "src/components"];
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

const TEXT = {
  xs: "caption",
  sm: "body-sm",
  base: "body-md",
  lg: "body-lg",
  xl: "heading-4",
  "2xl": "heading-3",
  "3xl": "heading-2",
  "4xl": "heading-1",
  "5xl": "heading-1",
  "6xl": "heading-1",
};

function textForPx(px) {
  if (px <= 13) return "caption";
  if (px <= 15) return "body-sm";
  if (px <= 17) return "body-md";
  if (px <= 19) return "body-lg";
  if (px <= 22) return "heading-4";
  if (px <= 26) return "heading-3";
  if (px <= 30) return "heading-2";
  return "heading-1";
}

function radiusForPx(px) {
  if (px <= 5) return "control-small";
  if (px <= 9) return "control";
  if (px <= 15) return "card-nested";
  return "card";
}

/** The class string a match sits in: from the quote before to the quote after. */
function enclosing(text, index) {
  const before = Math.max(
    text.lastIndexOf('"', index),
    text.lastIndexOf("`", index),
    text.lastIndexOf("'", index),
  );
  const quote = text[before];
  const after = text.indexOf(quote, index);
  return text.slice(before + 1, after === -1 ? index + 200 : after);
}

const isCardContainer = (classes) =>
  /\bborder\b/.test(classes) &&
  /\bbg-(?:surface|white)\b/.test(classes) &&
  /\bp(?:x|y)?-(?:\d|inset|card|\[)/.test(classes);

const files = (await collectFiles(new Set([".ts", ".tsx", ".js", ".jsx"])))
  .map(norm)
  .filter(inScope)
  .sort();

let total = 0;
for (const file of files) {
  const original = await readFile(file, "utf8");
  let changes = 0;

  let next = original.replace(
    /\btext-(xs|sm|base|lg|xl|[2-6]xl)\b(?![-\w])/g,
    (_, size) => {
      changes++;
      return `text-${TEXT[size]}`;
    },
  );
  next = next.replace(/\btext-\[(\d+(?:\.\d+)?)(px|rem)\]/g, (_, n, unit) => {
    changes++;
    const px = unit === "rem" ? Number(n) * 16 : Number(n);
    return `text-${textForPx(px)}`;
  });

  next = next.replace(
    /\brounded(-[trblse]{1,2})?-(sm|md|lg|xl|2xl|3xl)\b(?![-\w])/g,
    (match, side = "", size, offset, whole) => {
      changes++;
      let token;
      if (size === "sm") token = "control-small";
      else if (size === "md" || size === "lg") token = "control";
      else if (size === "xl")
        token = isCardContainer(enclosing(whole, offset))
          ? "card"
          : "card-nested";
      else token = "card";
      return `rounded${side}-${token}`;
    },
  );
  next = next.replace(
    /\brounded(-[trblse]{1,2})?-\[(\d+(?:\.\d+)?)px\]/g,
    (_, side = "", n) => {
      changes++;
      return `rounded${side}-${radiusForPx(Number(n))}`;
    },
  );

  if (changes) {
    total += changes;
    console.log(`${String(changes).padStart(4)}  ${file}`);
    if (write) await writeFile(file, next);
  }
}
console.log(
  `\n${total} replacement(s) ${write ? "written" : "found (dry run)"}.`,
);
