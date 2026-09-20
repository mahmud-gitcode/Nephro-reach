/**
 * The square icon button used in a clinic table's action column.
 *
 * A row action is the same verb on every row, so the word is repetition —
 * eight rows of "View" tell the reader nothing the column header did not.
 * The glyph carries it instead and the verb moves to `aria-label`, which is
 * what a screen reader announces; `notBuiltYet` supplies the hover title.
 * The column costs 28px instead of 72, and the rows get shorter with it.
 *
 * On the size: `Button`'s own scale stops at 36px (`small`), and
 * `buttonStyles` says why — 44px is WCAG 2.5.5, and the member portal holds
 * that line because its users tap on a phone during or just after a
 * four-hour session. That reasoning is about members and still stands where
 * it was written. The clinic portal is a different room: staff at a desk
 * with a mouse, reading a dense roster where a 36px control on every row is
 * most of the row. So these are 28px, which still clears WCAG 2.5.8's 24px
 * minimum for a pointer target. It is a deliberate step from AAA to AA,
 * taken only here — nothing a member touches uses this class.
 *
 * Always pass `iconOnly` alongside it, and an `aria-label` that names the
 * row rather than just the verb: "Actions for John D. Smith", never
 * "Actions".
 */
export const tableIconButton =
  "h-7 w-7 min-h-0 min-w-0 shrink-0 aspect-square p-0 " +
  "rounded-control-small [&_svg]:h-4 [&_svg]:w-4";
