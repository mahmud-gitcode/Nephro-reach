import { describe, expect, it } from "vitest";
import { emailBody, isEmail, mailtoHref, toCsv } from "./shareLog";

describe("sharing a log", () => {
  it("writes CSV with quoting", () => {
    expect(
      toCsv({ header: ["Date", "Notes"], rows: [["2026-10-05", 'a, "b"']] }),
    ).toBe('Date,Notes\n2026-10-05,"a, ""b"""');
  });

  it("checks an email address", () => {
    expect(isEmail("nurse@clinic.org")).toBe(true);
    expect(isEmail("nurse at clinic")).toBe(false);
  });

  it("keeps the email body short and points to the download", () => {
    const rows = Array.from({ length: 200 }, (_, i) => [`2026-01-${i}`, "x"]);
    const body = emailBody("My log", { header: ["Date", "Value"], rows });
    expect(body.length).toBeLessThan(2100);
    expect(body).toContain("more entries in the attached CSV");
  });

  it("encodes the mail draft", () => {
    expect(mailtoHref("a@b.co", "BP log", "1 & 2")).toBe(
      "mailto:a%40b.co?subject=BP%20log&body=1%20%26%202",
    );
  });
});
