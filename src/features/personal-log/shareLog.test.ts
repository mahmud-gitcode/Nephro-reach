import { describe, expect, it } from "vitest";
import {
  emailBody,
  isEmail,
  mailtoHref,
  outsideShareOf,
  toCsv,
} from "./shareLog";

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

describe("outsideShareOf", () => {
  const table = {
    header: ["Date", "Reading"],
    rows: Array.from({ length: 200 }, (_, i) => [`2026-10-${i}`, "120/80"]),
  };

  it("keeps the message short and attaches the whole log as CSV", () => {
    const share = outsideShareOf("Blood pressure log", "bp-log", table, false);
    expect(share.kind).toBe("log");
    expect(share.body.length).toBeLessThanOrEqual(1500);
    expect(share.body).toContain("The full log is attached as a CSV file.");
    expect(share.attachment.name).toBe("bp-log.csv");
    expect(
      decodeURIComponent(
        share.attachment.dataUrl.split(",").slice(1).join(","),
      ),
    ).toBe(toCsv(table));
  });
});
