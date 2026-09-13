/**
 * Joins class names, dropping anything falsy.
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
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
