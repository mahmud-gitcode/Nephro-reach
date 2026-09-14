import React from "react";

/* ==========================================================================
   LocalSvg
   --------------------------------------------------------------------------
   A small decorative SVG that ships with the app: a flag, a brand mark, a
   chevron exported from the design file.

   `next/image` is the right default for photographs — it resizes, picks a
   modern format and lazy-loads. It does none of that for SVG: the format is
   already vector and already tiny, so next/image passes the bytes straight
   through and adds a wrapper element and a layout pass for nothing. The
   rule that insists on it is still worth keeping on for every other image,
   which is why the exception lives here, once, instead of as a dozen
   eslint-disable comments spread through the pages.

   Decorative by default: `alt` is empty, so a screen reader skips it and
   reads the label beside it instead. Pass `alt` only when the image is the
   content — and if it is, ask whether it should be next/image after all.
   ========================================================================== */

export type LocalSvgProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt"
> & {
  src: string;
  alt?: string;
};

export function LocalSvg({ src, alt = "", ...rest }: LocalSvgProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- next/image cannot optimise SVG; see the note above.
    <img src={src} alt={alt} {...rest} />
  );
}

export default LocalSvg;
