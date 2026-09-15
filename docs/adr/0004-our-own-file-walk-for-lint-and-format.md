# 4. Our own file walk for lint and format

**Status:** accepted
**Date:** 2026-09-15

## Context

`eslint .` reported "0 problems" on this repository. `prettier --check .`
reported every file formatted.

Both were false. ESLint was looking at 42 of 110 source files; Prettier was
reporting on about 67 files it had never opened. The real debt was 84 lint
errors and 67 unformatted files.

The cause was not the tools. This repository lives inside a OneDrive
folder, and OneDrive's reparse points make `readdir(dir, { withFileTypes:
true })` report several source directories — `src/app`, `src/components`,
`src/context`, `src/dictionaries`, `src/styles` — as **files**. `lstat` on
the same paths correctly says directory. Any tool that walks the tree with
`Dirent.isDirectory()` skips them, silently, and exits 0.

(The first diagnosis was wrong: the route-group parentheses in
`app/(portal)` were blamed. A bare config with no parentheses in the path
missed files too, which is what pointed at the real cause.)

## Decision

`scripts/source-files.mjs` walks the tree with `stat`, and
`scripts/lint.mjs` and `scripts/format.mjs` hand the tools an explicit file
list with `globInputPaths: false`.

## Consequences

The gate looks at every file. `npm run lint` and `npm run format` must stay
the entry points — a bare `eslint .` will pass by looking at nothing, which
is the failure mode that hides itself.

One later bug came from the same area and is worth recording: `format.mjs`
originally passed Prettier a _relative_ filepath, which meant
`prettier-plugin-tailwindcss` could not resolve the stylesheet named in
`.prettierrc` and sorted arbitrary-property classes differently from
`npx prettier`. Two answers for the same file is how a formatting gate
stops meaning anything. It passes an absolute path now.

`.claude` and `graft` are skipped: they are tool-generated, and linting
their `.cjs` helpers broke the run outright, because the Next config
registers the react-hooks plugin only for ts/tsx/js/jsx.

## Revisit if

The repository moves off OneDrive. Then the custom walk is dead weight and
the standard invocations can come back — but check by deliberately
introducing an error in a deep directory and confirming the tool finds it,
rather than by trusting a "0 problems".
