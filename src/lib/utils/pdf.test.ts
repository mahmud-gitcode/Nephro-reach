import { describe, expect, it } from "vitest";
import {
  PAGE_HEIGHT,
  PAGE_WIDTH,
  buildPdf,
  escapePdfText,
  pdfBytes,
  textWidth,
} from "./pdf";

const page = {
  texts: [
    { text: "NEPHROREACH", x: 56, y: 720, size: 18, bold: true },
    { text: "Invoice INV-2026-09", x: 56, y: 690 },
  ],
  lines: [{ x1: 56, y1: 680, x2: 556, y2: 680 }],
};

describe("the file a reader has to open", () => {
  const file = buildPdf(page, "Invoice INV-2026-09");

  it("starts and ends the way a PDF must", () => {
    expect(file.startsWith("%PDF-1.4")).toBe(true);
    expect(file.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("points every xref offset at the object it claims", () => {
    // This is the whole ballgame. A reader seeks to these byte offsets; one
    // wrong number and the file does not open at all, with no clue why.
    // Anchored on the newline: "startxref" ends in "xref" too.
    const xrefIndex = file.lastIndexOf("\nxref\n");
    const rows = file
      .slice(xrefIndex)
      .split("\n")
      .filter((row) => /^\d{10} \d{5} [nf] $/.test(row));

    // Seven objects plus the free-list head.
    expect(rows).toHaveLength(8);
    expect(rows[0]).toBe("0000000000 65535 f ");

    rows.slice(1).forEach((row, index) => {
      const offset = Number(row.slice(0, 10));
      expect(file.slice(offset)).toMatch(new RegExp(`^${index + 1} 0 obj`));
    });
  });

  it("puts startxref at the byte the xref table begins on", () => {
    const declared = Number(/startxref\n(\d+)/.exec(file)?.[1]);
    expect(file.slice(declared, declared + 4)).toBe("xref");
  });

  it("declares a stream length that matches the stream", () => {
    // A short or long /Length truncates the page or runs past it.
    const declared = Number(/\/Length (\d+)/.exec(file)?.[1]);
    const start = file.indexOf("stream\n") + "stream\n".length;
    const end = file.indexOf("\nendstream");

    expect(end - start).toBe(declared);
  });

  it("carries the page size and both built-in fonts", () => {
    expect(file).toContain(`/MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}]`);
    // Neither is embedded — every reader has all fourteen.
    expect(file).toContain("/BaseFont /Courier");
    expect(file).toContain("/BaseFont /Helvetica-Bold");
  });

  it("draws what it was given", () => {
    expect(file).toContain("(NEPHROREACH) Tj");
    expect(file).toContain("(Invoice INV-2026-09) Tj");
    expect(file).toContain("56 680 m 556 680 l S");
  });

  it("uses the bold font only where bold was asked for", () => {
    const heading = file.indexOf("(NEPHROREACH) Tj");
    const body = file.indexOf("(Invoice INV-2026-09) Tj");

    expect(file.slice(0, heading)).toMatch(/\/F2 18 Tf\n[^()]*$/);
    expect(file.slice(0, body)).toMatch(/\/F1 10 Tf\n[^()]*$/);
  });
});

describe("escaping, and why every byte must be one byte", () => {
  it("escapes what would otherwise end a literal", () => {
    expect(escapePdfText("a(b)c\\d")).toBe("a\\(b\\)c\\\\d");
  });

  it("leaves ordinary ASCII alone", () => {
    expect(escapePdfText("Invoice INV-2026-09 $1,995")).toBe(
      "Invoice INV-2026-09 $1,995",
    );
  });

  it("writes an accented character as octal, one byte wide", () => {
    // "Clínica" must not silently become two bytes: the xref offsets are
    // counted in JavaScript string length, so a wide character would shift
    // every object after it and break the file.
    const escaped = escapePdfText("Clínica");
    expect(escaped).toBe("Cl\\355nica");
    expect(escaped).toMatch(/^[\x20-\x7e]*$/);
  });

  it("keeps a name with an em dash openable", () => {
    // Beyond WinAnsi, so it cannot be represented — a visible "?" beats a
    // file that will not open.
    const escaped = escapePdfText("Sunshine — Dialysis");
    expect(escaped).toBe("Sunshine ? Dialysis");
  });

  it("produces a file of pure single-byte characters", () => {
    const file = buildPdf({
      texts: [{ text: "Clínica Señor (A)", x: 10, y: 10 }],
      lines: [],
    });
    expect(file).toMatch(/^[\x00-\xff]*$/);

    const bytes = pdfBytes(file);
    expect(bytes).toHaveLength(file.length);
    expect(bytes[0]).toBe("%".charCodeAt(0));
  });
});

describe("measuring text for a right-aligned column", () => {
  it("is exact, because Courier is fixed width", () => {
    expect(textWidth("$1,995", 10)).toBe(6 * 6);
    expect(textWidth("", 10)).toBe(0);
  });

  it("gives the same width to any two strings of equal length", () => {
    // What makes a money column line up rather than nearly line up.
    expect(textWidth("$1,995", 10)).toBe(textWidth("$9,111", 10));
  });
});
