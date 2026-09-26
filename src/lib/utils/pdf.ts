/* ==========================================================================
   A very small PDF writer
   --------------------------------------------------------------------------
   Enough PDF to put text and rules on one page, and no more.

   WHY NOT A LIBRARY
   -----------------
   jsPDF and pdf-lib are 300–400 KB, and this app ships five runtime
   dependencies in total behind a bundle budget. Paying that to lay out one
   invoice would be the most expensive thing in the bundle by some margin.
   A single-page text PDF is a genuinely simple format: a handful of objects,
   a content stream of drawing operators, and a table of byte offsets.

   THE FONTS
   ---------
   Courier and Helvetica-Bold, both of the fourteen fonts every reader has
   built in, so nothing is embedded. Courier because it is fixed-width at
   exactly 600/1000 em: that makes `textWidth` exact arithmetic rather than
   a table of per-glyph widths, and right-aligned money columns line up to
   the pixel. Headings take Helvetica-Bold, where alignment does not matter.

   THE ENCODING
   ------------
   WinAnsi, and every byte written is ASCII — escapes are emitted as octal
   so that a string's length in JavaScript equals its length in bytes. The
   xref table is a list of byte offsets; the moment one character occupies
   two bytes, every offset after it is wrong and the file will not open.
   ========================================================================== */

/** US Letter, in points. */
export const PAGE_WIDTH = 612;
export const PAGE_HEIGHT = 792;

export type PdfText = {
  text: string;
  /** Points from the left edge. */
  x: number;
  /** Points from the BOTTOM edge — PDF's y axis runs upwards. */
  y: number;
  size?: number;
  bold?: boolean;
};

export type PdfLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width?: number;
};

export type PdfPage = {
  texts: PdfText[];
  lines: PdfLine[];
};

/** Courier is 600/1000 em at every glyph, so this is exact, not an estimate. */
export function textWidth(text: string, size: number): number {
  return text.length * size * 0.6;
}

/**
 * Escape a string for a PDF literal, leaving only ASCII bytes behind.
 *
 * Backslash, and both parentheses, end or confuse a literal. Anything above
 * 126 becomes a three-digit octal escape: that keeps one character to one
 * byte, which the xref offsets depend on.
 */
export function escapePdfText(text: string): string {
  let out = "";

  for (const char of text) {
    const code = char.codePointAt(0) ?? 63;

    if (char === "\\" || char === "(" || char === ")") {
      out += `\\${char}`;
    } else if (code >= 32 && code <= 126) {
      out += char;
    } else if (code <= 255) {
      out += `\\${code.toString(8).padStart(3, "0")}`;
    } else {
      /* Outside WinAnsi. A question mark is a visible, honest failure;
         dropping it silently would lose a character from a document
         somebody may rely on. */
      out += "?";
    }
  }

  return out;
}

function contentStream(page: PdfPage): string {
  const parts: string[] = [];

  for (const line of page.lines) {
    parts.push(
      `${line.width ?? 0.75} w`,
      `${line.x1} ${line.y1} m ${line.x2} ${line.y2} l S`,
    );
  }

  for (const item of page.texts) {
    const size = item.size ?? 10;
    const font = item.bold ? "/F2" : "/F1";
    parts.push(
      "BT",
      `${font} ${size} Tf`,
      `1 0 0 1 ${item.x} ${item.y} Tm`,
      `(${escapePdfText(item.text)}) Tj`,
      "ET",
    );
  }

  return parts.join("\n");
}

/**
 * One page as a complete PDF file, as a binary string.
 *
 * Every character of the result is one byte — see the note on encoding
 * above — so `pdfBytes` can widen it to a Uint8Array with a plain charCode.
 */
export function buildPdf(page: PdfPage, title = "Document"): string {
  const stream = contentStream(page);

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Title (${escapePdfText(title)}) /Producer (NephroReach) >>`,
  ];

  let file = "%PDF-1.4\n";
  const offsets: number[] = [];

  objects.forEach((body, index) => {
    offsets.push(file.length);
    file += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  /* The cross-reference table. Entry zero is the head of the free list and
     is fixed by the spec; every other row is a 10-digit byte offset. Each
     row is exactly 20 bytes, trailing space included. */
  const xrefOffset = file.length;
  const count = objects.length + 1;

  file += `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    file += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }

  file +=
    `trailer\n<< /Size ${count} /Root 1 0 R /Info ${objects.length} 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;

  return file;
}

/**
 * Widen a binary string to bytes, ready for a Blob.
 *
 * Typed over a plain ArrayBuffer rather than the default ArrayBufferLike,
 * because a Blob will not accept a view that might sit on a SharedArrayBuffer.
 */
export function pdfBytes(file: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(file.length));
  for (let index = 0; index < file.length; index += 1) {
    bytes[index] = file.charCodeAt(index) & 0xff;
  }
  return bytes;
}
