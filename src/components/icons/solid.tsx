import React from "react";

/* ==========================================================================
   Filled icons
   --------------------------------------------------------------------------
   Lucide is a stroke set — it ships no filled variant of anything (one icon
   out of 3,994 has "solid" in its name). An outline glyph sitting inside a
   solid colour panel reads as a sticker stuck on the block rather than part
   of it, so `KeyCard` needs filled ones.

   Adding a second icon library for a dozen glyphs would be the largest
   thing in a bundle that ships five runtime dependencies, so they are drawn
   here — the same choice `Kidneys.tsx` and `FluidIcons.tsx` already made.

   Each is ONE path with `fill-rule: evenodd`, so the detail is a real hole
   punched through the glyph and the panel's own colour shows through it.
   Drawing the detail as a second filled shape would mean knowing the panel
   colour, and these sit on six different ones.

   They answer to `currentColor`, so the panel's `text-white` colours them.
   ========================================================================== */

export type SolidIconProps = React.SVGProps<SVGSVGElement>;

function Glyph({ d, ...rest }: SolidIconProps & { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path fillRule="evenodd" clipRule="evenodd" d={d} />
    </svg>
  );
}

/* ---------------------------------------------------------- status ---- */

/** A disc with a tick punched out. */
export function CheckCircleSolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm5.03 7.78-5.66 5.66a1 1 0 0 1-1.42 0l-2.83-2.83a1 1 0 0 1 1.42-1.41l2.12 2.12 4.95-4.95a1 1 0 1 1 1.42 1.41Z"
    />
  );
}

/** A disc with a cross punched out. */
export function XCircleSolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.54 5.05L12 10.59 8.46 7.05 7.05 8.46 10.59 12l-3.54 3.54 1.41 1.41L12 13.41l3.54 3.54 1.41-1.41L13.41 12l3.54-3.54-1.41-1.41Z"
    />
  );
}

/** A disc with clock hands punched out. */
export function ClockSolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 4.8v4.62l3.1 1.79a1 1 0 1 1-1 1.73l-3.6-2.08a1 1 0 0 1-.5-.87V6.8a1 1 0 0 1 2 0Z"
    />
  );
}

/** A triangle with the bar and dot punched out. */
export function AlertTriangleSolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M13.73 3.51a2 2 0 0 0-3.46 0L1.9 18.05A2 2 0 0 0 3.63 21h16.74a2 2 0 0 0 1.73-2.95L13.73 3.5ZM11 9.2a1 1 0 1 1 2 0v4.4a1 1 0 1 1-2 0V9.2Zm1 9.05a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z"
    />
  );
}

/**
 * A disc with a dash punched out.
 *
 * Lucide's `CircleDashed` is a dashed outline, which has nothing to fill. A
 * dash through a full disc says "nothing here yet" and keeps the weight of
 * the glyphs beside it.
 */
export function NotStartedSolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM8.5 11h7a1 1 0 1 1 0 2h-7a1 1 0 1 1 0-2Z"
    />
  );
}

/* ---------------------------------------------------------- people ---- */

export function UsersSolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M9 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm7.5 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM9 13c3.87 0 7 1.93 7 4.3V20a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2.7C2 14.93 5.13 13 9 13Zm8.2-.4c2.7.28 4.8 1.86 4.8 3.8V20a1 1 0 0 1-1 1h-3.2c.13-.31.2-.65.2-1v-2.7c0-1.7-.73-3.2-1.95-4.32.38-.16.77-.29 1.15-.38Z"
    />
  );
}

/** One person with a tick beside them. */
export function UserCheckSolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M9.5 3a4.25 4.25 0 1 1 0 8.5 4.25 4.25 0 0 1 0-8.5Zm0 10c4.14 0 7.5 2.02 7.5 4.5V20a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2.5C2 15.02 5.36 13 9.5 13Zm12.2-3.7a1 1 0 0 0-1.4-1.42l-2.72 2.71-1.08-1.08a1 1 0 1 0-1.42 1.42l1.8 1.79a1 1 0 0 0 1.4 0l3.42-3.42Z"
    />
  );
}

/** One person with a plus beside them. */
export function UserPlusSolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M9.5 3a4.25 4.25 0 1 1 0 8.5 4.25 4.25 0 0 1 0-8.5Zm0 10c4.14 0 7.5 2.02 7.5 4.5V20a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2.5C2 15.02 5.36 13 9.5 13ZM20 8a1 1 0 0 1 1 1v1.5h1.5a1 1 0 1 1 0 2H21V14a1 1 0 1 1-2 0v-1.5h-1.5a1 1 0 1 1 0-2H19V9a1 1 0 0 1 1-1Z"
    />
  );
}

/* ------------------------------------------------------- documents ---- */

/** A page with lines punched out. */
export function FileTextSolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.8V8h4.2L13 3.8ZM8 12h8a.9.9 0 1 1 0 1.8H8A.9.9 0 1 1 8 12Zm0 4h8a.9.9 0 1 1 0 1.8H8A.9.9 0 1 1 8 16Zm0-8h3a.9.9 0 1 1 0 1.8H8A.9.9 0 1 1 8 8Z"
    />
  );
}

/** A page with a signature line punched out — a contract. */
export function ContractSolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.8V8h4.2L13 3.8ZM8 11h8a.9.9 0 1 1 0 1.8H8A.9.9 0 1 1 8 11Zm0 4.2h3.4a.9.9 0 1 1 0 1.8H8a.9.9 0 1 1 0-1.8Zm5.6 1.9a.9.9 0 0 1 .3-1.3c.5-.3 1-.5 1.5-.5.6 0 1.2.5 1.6.5.2 0 .4-.1.6-.3a.9.9 0 0 1 1.2 1.3c-.5.5-1.1.8-1.8.8-.7 0-1.3-.5-1.6-.5-.2 0-.4.1-.6.2a.9.9 0 0 1-1.2-.2Z"
    />
  );
}

/** A coin with a currency stroke punched out. */
export function MoneySolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm.9 3.6v1.1c.7.1 1.4.4 1.9.8a1 1 0 0 1-1.2 1.6c-.4-.3-.9-.5-1.4-.5-.8 0-1.3.4-1.3.9 0 .5.4.8 1.6 1.1 1.7.5 2.8 1.2 2.8 2.8 0 1.4-1 2.4-2.4 2.7v1.2a1 1 0 1 1-1.8 0v-1.2c-.9-.1-1.7-.5-2.3-1a1 1 0 0 1 1.3-1.5c.5.4 1.1.7 1.8.7.9 0 1.4-.4 1.4-1 0-.5-.4-.8-1.7-1.2-1.6-.4-2.7-1.1-2.7-2.7 0-1.3 1-2.3 2.2-2.6V5.6a1 1 0 0 1 1.8 0Z"
    />
  );
}

/* ----------------------------------------------------------- other ---- */

/** A mortarboard. */
export function GraduationCapSolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M11.55 3.1a1 1 0 0 1 .9 0l9.5 4.75a1 1 0 0 1 0 1.79l-1.45.72V15a1 1 0 1 1-2 0v-3.64l-6.05 3.03a1 1 0 0 1-.9 0L2.05 9.64a1 1 0 0 1 0-1.79l9.5-4.75ZM6 12.11l5.55 2.78a1 1 0 0 0 .9 0L18 12.1v3.34c0 .7-.42 1.3-1.05 1.7-1.2.78-2.97 1.21-4.95 1.21s-3.74-.43-4.95-1.2c-.63-.4-1.05-1-1.05-1.71V12.1Z"
    />
  );
}

/** A screen with a play triangle punched out. */
export function VideoSolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M3 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm5.2 3.6v6.8l5-3.4-5-3.4ZM23 7.4v9.2a1 1 0 0 1-1.6.8L18 15V9l3.4-2.4a1 1 0 0 1 1.6.8Z"
    />
  );
}

/** A five-point star. */
export function StarSolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M12 2.4a1 1 0 0 1 .9.56l2.46 4.99 5.5.8a1 1 0 0 1 .56 1.71l-3.99 3.89.94 5.48a1 1 0 0 1-1.45 1.06L12 18.3l-4.92 2.59a1 1 0 0 1-1.45-1.06l.94-5.48-3.98-3.89a1 1 0 0 1 .55-1.7l5.5-.8L11.1 2.95a1 1 0 0 1 .9-.56Z"
    />
  );
}

/** A rounded square with a pulse line punched out. */
export function ActivitySolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm1.5 10.1h2.2l1.5-3.9a1 1 0 0 1 1.87.03l1.7 4.72.8-1.63a1 1 0 0 1 .9-.55h2.03a1 1 0 1 1 0 2h-1.41l-1.6 3.25a1 1 0 0 1-1.84-.1l-1.63-4.54-.86 2.23a1 1 0 0 1-.93.64H6.5a1 1 0 1 1 0-2Z"
    />
  );
}

/** A heart with a pulse line punched out. */
export function HeartPulseSolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M12 21.1a1 1 0 0 1-.64-.23C7.3 17.5 2 13.4 2 8.9 2 5.9 4.3 3.6 7.2 3.6c1.9 0 3.6 1 4.8 2.6 1.2-1.6 2.9-2.6 4.8-2.6 2.9 0 5.2 2.3 5.2 5.3 0 .6-.1 1.2-.3 1.8h-3.6l-1.4-2.5a1 1 0 0 0-1.8.1l-1.7 4.2-1.1-1.9a1 1 0 0 0-.87-.5H5.6c1.6 2.5 4.5 5.1 7 7.1a1 1 0 0 1-.6 3Z"
    />
  );
}

/** A clipboard with a tick punched out. */
export function ClipboardCheckSolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M9 2h6a1 1 0 0 1 1 1v1h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V3a1 1 0 0 1 1-1Zm1 2v1h4V4h-4Zm6.1 7.2a1 1 0 0 0-1.42-1.4l-3.53 3.52-1.42-1.41a1 1 0 0 0-1.41 1.41l2.12 2.12a1 1 0 0 0 1.42 0l4.24-4.24Z"
    />
  );
}

/** Concentric rings with the bullseye punched — a goal. */
export function TargetSolid(p: SolidIconProps) {
  return (
    <Glyph
      {...p}
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3.2a6.8 6.8 0 1 1 0 13.6 6.8 6.8 0 0 1 0-13.6Zm0 2.6a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4Zm0 2.6a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Z"
    />
  );
}
