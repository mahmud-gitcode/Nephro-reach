/**
 * vitest-axe declares its matcher against the global `Vi` namespace, which
 * vitest 4 used. vitest 5 augments the `vitest` module instead, so the
 * matcher is declared here against the current signature.
 */
import "vitest";

declare module "vitest" {
  interface Assertion<R extends void | Promise<void> = void, T = unknown> {
    toHaveNoViolations: (expected?: T) => R;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations: () => void;
  }
}
