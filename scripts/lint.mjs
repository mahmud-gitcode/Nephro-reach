#!/usr/bin/env node
/**
 * Lint every source file.
 *
 * Why this exists: `eslint .` looked at 42 of 110 files here and reported
 * "0 problems" — a gate that says yes without looking, which is worse than
 * no gate.
 *
 * The cause is the checkout, not ESLint's config — see
 * scripts/source-files.mjs for the full story.
 *
 * Run through `npm run lint`. Pass --fix to apply fixable rules.
 */
import { ESLint } from "eslint";
import { collectFiles, CODE_EXTENSIONS } from "./source-files.mjs";

const fix = process.argv.includes("--fix");
const files = await collectFiles(CODE_EXTENSIONS);

const eslint = new ESLint({
  fix,
  globInputPaths: false,
  // next-env.d.ts is in the ignore list; asking about it is not an error.
  warnIgnored: false,
});
const results = await eslint.lintFiles(files);
if (fix) await ESLint.outputFixes(results);

const formatter = await eslint.loadFormatter("stylish");
const output = await formatter.format(results);
if (output) process.stdout.write(output);

const errors = results.reduce((n, r) => n + r.errorCount, 0);
const warnings = results.reduce((n, r) => n + r.warningCount, 0);

console.log(
  `${files.length} files checked — ${errors} error(s), ${warnings} warning(s)`,
);

// Warnings fail too. The config has none by design; one appearing means a
// rule was downgraded somewhere, and that belongs in review.
process.exit(errors + warnings > 0 ? 1 : 0);
