/**
 * Joins class names, dropping anything that is not a non-empty string.
 *
 * The parameter type deliberately accepts `number` and `bigint` as well as
 * the usual falsy values. Without them, the very common
 *
 *     cn(base, someReactNode && "mt-2")
 *
 * fails to typecheck, because a ReactNode can be `0` or `0n` and so the
 * `&&` widens to include them. Filtering by type here is safer than making
 * every call site write a ternary and forgetting one.
 *
 * Deliberately dependency-free. The usual pairing for this is
 * clsx + tailwind-merge, where tailwind-merge resolves conflicts such as a
 * caller passing `bg-danger` to a component whose variant already sets
 * `bg-action`. We do not have that here, so the rule is:
 *
 *   variant classes go FIRST, the caller's `className` goes LAST.
 *
 * That gives the caller the win on equal specificity in most cases. If real
 * conflicts start appearing, add tailwind-merge then — not before.
 */
export function cn(
  ...parts: Array<string | number | bigint | false | null | undefined>
): string {
  return parts
    .filter((part): part is string => typeof part === "string" && part !== "")
    .join(" ");
}
