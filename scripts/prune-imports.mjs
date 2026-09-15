#!/usr/bin/env node
/**
 * Removes import specifiers ESLint reports as unused.
 *
 * Splitting a large file leaves the original full of imports only the moved
 * code used. Doing that by hand is slow and easy to get wrong, so this reads
 * `no-unused-vars` from ESLint's own JSON output and deletes exactly the
 * names it names — nothing inferred, nothing guessed.
 *
 * Deliberately narrow: it only touches specifiers inside `import { ... }`
 * and default/namespace imports, and it re-runs until ESLint stops
 * reporting, because removing one name can leave the whole clause empty.
 *
 *   node scripts/prune-imports.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { ESLint } from "eslint";
import { collectFiles, CODE_EXTENSIONS } from "./source-files.mjs";

const files = await collectFiles(CODE_EXTENSIONS);
const eslint = new ESLint({ globInputPaths: false });

let round = 0;
let removedTotal = 0;

for (;;) {
  round += 1;
  const results = await eslint.lintFiles(files);
  const byFile = new Map();

  for (const result of results) {
    const names = result.messages
      .filter((m) => m.ruleId === "@typescript-eslint/no-unused-vars")
      .map(
        (m) =>
          /'([^']+)' is (?:defined|assigned a value) but never used/.exec(
            m.message,
          )?.[1],
      )
      .filter(Boolean);
    if (names.length > 0) byFile.set(result.filePath, new Set(names));
  }

  if (byFile.size === 0) break;

  let removedThisRound = 0;
  for (const [file, names] of byFile) {
    let source = await readFile(file, "utf8");
    const before = source;

    source = source.replace(
      /import\s+(type\s+)?\{([^}]*)\}\s+from\s+(["'][^"']+["']);?\n/g,
      (match, typeKeyword, body, from) => {
        const kept = body
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .filter((spec) => {
            const local = spec
              .split(/\s+as\s+/)
              .pop()
              .replace(/^type\s+/, "")
              .trim();
            return !names.has(local);
          });
        if (
          kept.length ===
          body
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean).length
        ) {
          return match;
        }
        removedThisRound += 1;
        if (kept.length === 0) return "";
        return `import ${typeKeyword ?? ""}{ ${kept.join(", ")} } from ${from};\n`;
      },
    );

    // Default and namespace imports, which have no braces to thin out.
    source = source.replace(
      /import\s+([A-Za-z_$][\w$]*)\s+from\s+["'][^"']+["'];?\n/g,
      (match, local) => {
        if (!names.has(local)) return match;
        removedThisRound += 1;
        return "";
      },
    );

    if (source !== before) await writeFile(file, source, "utf8");
  }

  removedTotal += removedThisRound;
  if (removedThisRound === 0) break;
  if (round > 10) break;
}

console.log(
  `pruned ${removedTotal} unused import specifier(s) in ${round} pass(es)`,
);
