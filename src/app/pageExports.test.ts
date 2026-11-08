import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/* A Next.js page or layout module may export only the names Next.js knows.
   Another export (a helper such as kindLabel, or a shared component) makes
   the generated route types fail the typecheck once `next dev` has compiled
   that route (P15a QA L1). Shared helpers belong in src/features. The
   portal pages are checked here; the protected landing pages are not edited
   by the integration lanes. */

const ALLOWED = new Set([
  "default",
  "metadata",
  "generateMetadata",
  "generateStaticParams",
  "viewport",
  "generateViewport",
  "dynamic",
  "dynamicParams",
  "revalidate",
  "fetchCache",
  "runtime",
  "preferredRegion",
  "maxDuration",
]);

const ROOT = path.join(process.cwd(), "src", "app", "(portal)");

function routeModules(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return routeModules(full);
    return /^(page|layout)\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

function exportedNames(source: string): string[] {
  const names: string[] = [];
  const declared =
    /^export\s+(?:async\s+)?(?:function\*?|const|let|var|class|enum)\s+([A-Za-z_$][\w$]*)/gm;
  for (const match of source.matchAll(declared)) names.push(match[1]);
  const listed = /^export\s*\{([^}]*)\}/gm;
  for (const match of source.matchAll(listed)) {
    for (const part of match[1].split(",")) {
      const name = part
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name && !name.startsWith("type ")) names.push(name);
    }
  }
  return names;
}

describe("portal route modules", () => {
  const files = routeModules(ROOT);

  it("finds the portal pages", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("export only the names Next.js allows", () => {
    const offenders = files.flatMap((file) =>
      exportedNames(fs.readFileSync(file, "utf8"))
        .filter((name) => !ALLOWED.has(name))
        .map((name) => `${path.relative(ROOT, file)}: ${name}`),
    );
    expect(offenders).toEqual([]);
  });
});
