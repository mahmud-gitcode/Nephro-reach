import React from "react";

/* ==========================================================================
   Kidneys
   --------------------------------------------------------------------------
   The one icon this product needs that no general icon set ships. It was the
   only reason `react-icons` stayed installed — a second icon library, pulled
   in for a single glyph, alongside lucide's 56 files.

   Drawn on lucide's grid and to lucide's conventions so it drops in beside
   the others: 24x24 viewBox, `currentColor` stroke, 2px width, round caps,
   no fill. Size it the same way — `className="h-5 w-5"` — and colour it with
   a text token.
   ========================================================================== */

export type KidneysProps = React.SVGProps<SVGSVGElement>;

export function Kidneys({
  strokeWidth = 2,
  ...rest
}: KidneysProps & { strokeWidth?: number | string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {/* Left kidney: outer curve down, then the concave hilum facing in. */}
      <path d="M9.5 4C6.5 4 5 6.4 5 9.6c0 3.6 1.4 6.6 3 8.2 1.2 1.2 3 1 3.4-.8.3-1.4-.6-2.3-1.3-3.1-.6-.7-.6-1.6 0-2.3.7-.8 1.6-1.7 1.3-3.1C11 6.7 10.7 4 9.5 4Z" />
      {/* Right kidney: the same shape mirrored about the vertical centre. */}
      <path d="M14.5 4c3 0 4.5 2.4 4.5 5.6 0 3.6-1.4 6.6-3 8.2-1.2 1.2-3 1-3.4-.8-.3-1.4.6-2.3 1.3-3.1.6-.7.6-1.6 0-2.3-.7-.8-1.6-1.7-1.3-3.1C13 6.7 13.3 4 14.5 4Z" />
    </svg>
  );
}

export default Kidneys;
