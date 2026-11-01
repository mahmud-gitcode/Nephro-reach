import { describe, expect, it } from "vitest";
import { isSafeFileUrl, isSafeLinkUrl } from "./safeUrl";

describe("isSafeLinkUrl", () => {
  it("allows web links and this site's own paths", () => {
    expect(isSafeLinkUrl("https://www.kidney.org/atoz")).toBe(true);
    expect(isSafeLinkUrl("http://example.org")).toBe(true);
    expect(isSafeLinkUrl("/documents/diet-guide.pdf")).toBe(true);
  });

  it("refuses script and data links", () => {
    expect(isSafeLinkUrl("javascript:alert(document.cookie)")).toBe(false);
    expect(isSafeLinkUrl(" JavaScript:alert(1)")).toBe(false);
    expect(isSafeLinkUrl("data:text/html,<script>alert(1)</script>")).toBe(
      false,
    );
    expect(isSafeLinkUrl("vbscript:msgbox(1)")).toBe(false);
  });

  it("refuses nothing at all", () => {
    expect(isSafeLinkUrl("")).toBe(false);
    expect(isSafeLinkUrl(null)).toBe(false);
    expect(isSafeLinkUrl(undefined)).toBe(false);
  });
});

describe("isSafeFileUrl", () => {
  it("allows stored pictures, files and blobs", () => {
    expect(isSafeFileUrl("data:image/jpeg;base64,/9j/4AAQ")).toBe(true);
    expect(isSafeFileUrl("data:application/pdf;base64,JVBERi0")).toBe(true);
    expect(isSafeFileUrl("blob:http://localhost:4000/6f1c")).toBe(true);
    expect(isSafeFileUrl("/images/sample.png")).toBe(true);
  });

  it("refuses data URLs a browser would run as a page", () => {
    expect(isSafeFileUrl("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
    expect(isSafeFileUrl("data:image/svg+xml,<svg onload=alert(1)>")).toBe(
      false,
    );
    expect(isSafeFileUrl("DATA:TEXT/HTML,x")).toBe(false);
    expect(isSafeFileUrl("data:application/xhtml+xml,x")).toBe(false);
  });

  it("refuses script links", () => {
    expect(isSafeFileUrl("javascript:alert(1)")).toBe(false);
  });
});
