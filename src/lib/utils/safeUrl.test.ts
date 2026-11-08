import { afterEach, describe, expect, it, vi } from "vitest";
import { isSafeFileUrl, isSafeLinkUrl, isStorageDownloadUrl } from "./safeUrl";

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

describe("isStorageDownloadUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("allows a presigned link on the configured storage origin", () => {
    vi.stubEnv("NEXT_PUBLIC_STORAGE_ORIGIN", "https://files.example");
    expect(
      isStorageDownloadUrl("https://files.example/bucket/inv.pdf?sig=x"),
    ).toBe(true);
  });

  it("refuses any other host when the storage origin is set", () => {
    vi.stubEnv("NEXT_PUBLIC_STORAGE_ORIGIN", "https://files.example");
    expect(isStorageDownloadUrl("https://elsewhere.example/inv.pdf")).toBe(
      false,
    );
    expect(isStorageDownloadUrl("http://files.example/inv.pdf")).toBe(false);
  });

  it("refuses blob:, data:, script and plain-http links", () => {
    vi.stubEnv("NEXT_PUBLIC_STORAGE_ORIGIN", "");
    expect(isStorageDownloadUrl("blob:https://app.example/1234")).toBe(false);
    expect(isStorageDownloadUrl("data:application/pdf;base64,JVBERi0")).toBe(
      false,
    );
    expect(isStorageDownloadUrl("javascript:alert(1)")).toBe(false);
    expect(isStorageDownloadUrl("http://files.example/inv.pdf")).toBe(false);
    expect(isStorageDownloadUrl("/relative/inv.pdf")).toBe(false);
    expect(isStorageDownloadUrl("")).toBe(false);
    expect(isStorageDownloadUrl(null)).toBe(false);
  });

  it("allows https, or http to a stand-in on this machine, outside production when no origin is set", () => {
    vi.stubEnv("NEXT_PUBLIC_STORAGE_ORIGIN", "");
    expect(isStorageDownloadUrl("https://files.example/inv.pdf")).toBe(true);
    expect(isStorageDownloadUrl("http://localhost:5906/b/inv.pdf")).toBe(true);
    expect(isStorageDownloadUrl("http://127.0.0.1:5906/b/inv.pdf")).toBe(true);
  });

  it("a production build without a storage origin opens nothing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_STORAGE_ORIGIN", "");
    expect(isStorageDownloadUrl("https://files.example/inv.pdf")).toBe(false);
  });
});
