import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * The gate. Everything here is an error, not a warning.
 *
 * A warning that nobody has to clear is a warning nobody clears — the repo
 * carried 29 of them before this config went in. CI runs `eslint` with no
 * `--max-warnings` escape hatch, so the only passing state is zero.
 *
 * Turning a rule off is a real decision: do it here, with a comment saying
 * why, rather than sprinkling eslint-disable through the source.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      /* Unused code is either a mistake or a leftover. Both should be
         removed. `_`-prefixed names are the documented way to say "this
         argument exists to reach the one after it". */
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      /* `any` switches off the type checker for everything it touches. */
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": "allow-with-description" },
      ],

      /* Hooks. These catch real bugs, not style. */
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/set-state-in-effect": "error",

      /* next/image handles sizing, lazy-loading and format negotiation.
         Where a raw <img> is genuinely right (a small decorative local SVG,
         which next/image cannot optimise) the line carries a disable comment
         explaining it. */
      "@next/next/no-img-element": "error",

      /* Accessibility. eslint-config-next ships jsx-a11y but leaves most of
         it off; these are the ones this codebase has actually got wrong. */
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/label-has-associated-control": [
        "error",
        { assert: "either", depth: 3 },
      ],
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/no-redundant-roles": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
    },
  },

  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Parked code. Excluded from tsconfig for the same reason.
    "trash/**",
  ]),
]);

export default eslintConfig;
