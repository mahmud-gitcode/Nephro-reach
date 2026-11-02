import { describe, expect, it } from "vitest";
import { displayableImage, isSitePath } from "./mediaDisplay";

/* QA Phase 12 L2: a content image is shown only from this site. Anything a
   browser would resolve to another host, or to a script, is refused. */
describe("isSitePath", () => {
  it("accepts a plain site path", () => {
    expect(isSitePath("/images/library/a.jpg")).toBe(true);
    expect(isSitePath("/images/table-talk/ep-1.png?v=2")).toBe(true);
  });

  it.each([
    ["protocol-relative", "//evil.example/x.png"],
    ["backslash host", "/\\evil.example/x.png"],
    ["double backslash host", "/\\\\evil.example/x.png"],
    ["backslash later in the path", "/images\\..\\x.png"],
    ["tab before the host", "/\t/evil.example/x.png"],
    ["newline before the host", "/\n/evil.example/x.png"],
    ["NUL in the path", "/images/\u0000x.png"],
    ["http scheme", "http://evil.example/x.png"],
    ["https scheme", "https://evil.example/x.png"],
    ["http: alone", "http:"],
    ["javascript scheme", "javascript:alert(1)"],
    ["data URL", "data:image/png;base64,AAAA"],
    ["relative path", "images/x.png"],
    ["empty", ""],
  ])("refuses a %s", (_label, url) => {
    expect(isSitePath(url)).toBe(false);
  });
});

describe("displayableImage", () => {
  it("shows the placeholder for anything that is not a site path", () => {
    expect(displayableImage("/\\evil.example/x.png", "/p.jpg")).toBe("/p.jpg");
    expect(displayableImage("//evil.example/x.png", "/p.jpg")).toBe("/p.jpg");
    expect(displayableImage("javascript:alert(1)", "/p.jpg")).toBe("/p.jpg");
    expect(displayableImage(null, "/p.jpg")).toBe("/p.jpg");
    expect(displayableImage("  /images/a.jpg  ", "/p.jpg")).toBe(
      "/images/a.jpg",
    );
  });
});
