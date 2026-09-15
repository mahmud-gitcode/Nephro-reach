#!/usr/bin/env node
/**
 * Prettier over every file, including the ones its own walk cannot reach.
 * See scripts/source-files.mjs for why the walk is ours.
 *
 *   npm run format        rewrite
 *   npm run format:check  report and fail
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import * as prettier from "prettier";
import { collectFiles, FORMAT_EXTENSIONS } from "./source-files.mjs";

const check = process.argv.includes("--check");
const files = await collectFiles(FORMAT_EXTENSIONS);

const offenders = [];
let written = 0;

for (const file of files) {
  const info = await prettier.getFileInfo(file, {
    ignorePath: ".prettierignore",
  });
  if (info.ignored || !info.inferredParser) continue;

  const source = await readFile(file, "utf8");
  /* Absolute, because prettier-plugin-tailwindcss resolves the stylesheet
     named in .prettierrc relative to the file it is formatting. Given a
     relative path it silently finds nothing and falls back to a different
     class order than `npx prettier` produces — two answers for the same
     file, which is how a formatting gate stops meaning anything. */
  const options = {
    ...(await prettier.resolveConfig(file)),
    filepath: resolve(file),
  };

  if (check) {
    if (!(await prettier.check(source, options))) offenders.push(file);
  } else {
    const formatted = await prettier.format(source, options);
    if (formatted !== source) {
      await writeFile(file, formatted, "utf8");
      written += 1;
    }
  }
}

if (check) {
  if (offenders.length > 0) {
    console.error("Not formatted:");
    for (const file of offenders) console.error("  " + file);
    console.error(
      `\n${files.length} files checked — ${offenders.length} need formatting. Run: npm run format`,
    );
    process.exit(1);
  }
  console.log(`${files.length} files checked — all formatted`);
} else {
  console.log(`${files.length} files checked — ${written} rewritten`);
}
