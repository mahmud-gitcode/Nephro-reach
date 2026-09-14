/**
 * The list of files the gates run on.
 *
 * Neither ESLint nor Prettier can find them on their own here. This project
 * lives under OneDrive, which turns folders into reparse points, and
 * `readdir(dir, { withFileTypes: true })` reads the type bits off the
 * directory entry — for a reparse point those bits do not say "directory".
 * Any walk that trusts `Dirent.isDirectory()` therefore stops dead at
 * src/app, src/components, src/context, src/dictionaries and src/styles.
 *
 * The symptom is quiet and dangerous: `eslint .` reported 0 problems across
 * 42 of 110 files, and `prettier --check .` said "All matched files use
 * Prettier code style" about files it never opened. Both tools handle
 * explicit paths correctly — only the walking is broken — so we do the
 * walking with `stat` and hand them the result.
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

export const SKIP_DIRS = new Set([
  ".git",
  ".next",
  ".husky",
  ".vscode",
  "node_modules",
  "out",
  "build",
  "public",
  "trash",
  "Clicnic and Ceargiver concept",
]);

export const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

export const FORMAT_EXTENSIONS = new Set([
  ...CODE_EXTENSIONS,
  ".css",
  ".json",
  ".md",
  ".yml",
  ".yaml",
]);

/** Every file under `dir` whose extension is in `extensions`. */
export async function collectFiles(extensions, dir = ".", found = []) {
  for (const name of await readdir(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    // stat, not dirent.isDirectory() — see the note above.
    const info = await stat(full).catch(() => null);
    if (!info) continue;
    if (info.isDirectory()) await collectFiles(extensions, full, found);
    else if (extensions.has(path.extname(name))) found.push(full);
  }
  return found;
}
