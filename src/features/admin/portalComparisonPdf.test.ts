import { describe, expect, it } from "vitest";
import { comparisonPdf } from "./portalComparisonPdf";

const text = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => String.fromCharCode(b)).join("");

describe("the portal comparison PDF", () => {
  it("is a complete, multi-page PDF with the table and the notes", () => {
    const pdf = text(comparisonPdf(new Date(2026, 9, 13)));
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(Number(/\/Count (\d+)/.exec(pdf)?.[1])).toBeGreaterThan(1);
    expect(pdf).toContain("(Limited*)");
    expect(pdf).toContain("Who controls staff and roles");
    /* Every byte is one character: the xref offsets depend on it. */
    expect(/[^\x00-\xff]/.test(pdf)).toBe(false);
  });
});
