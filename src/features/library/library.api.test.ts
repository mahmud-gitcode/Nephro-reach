import { describe, expect, it } from "vitest";
import {
  fromApiLibraryItem,
  fromApiPlatformResource,
  LIBRARY_PLACEHOLDER,
  mediaUrl,
  toLibraryBody,
  toLibraryPatch,
  type ApiLibraryItem,
} from "./library.api";
import { displayableImage } from "./mediaDisplay";
import type { LibraryResource } from "./library.types";

/* The library against the API (Phase 12): the media fields are renamed here
   both ways, the slug is the server's, and no data: URL or made-up upload
   path ever reaches it. Synthetic content only. */

const row: ApiLibraryItem = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "protecting-your-fistula",
  kind: "video",
  category: "access-care",
  titleEn: "Protecting your fistula",
  titleEs: "Proteger su fístula",
  summaryEn: "s",
  summaryEs: "s",
  posterUrl: "/images/Class.jpg",
  videoUrl: "https://www.youtube.com/watch?v=abcdefghijk",
  durationSeconds: 95,
  fileUrl: null,
  fileMetaEn: null,
  fileMetaEs: null,
  bodyEn: [],
  bodyEs: [],
  readMinutes: null,
  publishedOn: "2026-10-02T00:00:00.000Z",
  saved: true,
};

const resource = (over: Partial<LibraryResource> = {}): LibraryResource => ({
  ...fromApiLibraryItem(row),
  ...over,
});

describe("reading the library", () => {
  it("renames posterUrl/videoUrl/fileUrl/publishedOn to the screen's names", () => {
    expect(fromApiLibraryItem(row)).toMatchObject({
      poster: "/images/Class.jpg",
      videoSrc: "https://www.youtube.com/watch?v=abcdefghijk",
      fileSrc: undefined,
      durationSeconds: 95,
      // A @db.Date is cut to its day, never shifted through local time.
      publishedAt: "2026-10-02",
      published: true,
      saved: true,
    });
  });

  it("shows a remote poster as the placeholder (next/image and the CSP allow site paths only)", () => {
    expect(
      fromApiLibraryItem({
        ...row,
        posterUrl: "https://example.com/nephroreach-demo/library/x.jpg",
      }).poster,
    ).toBe(LIBRARY_PLACEHOLDER);
    expect(displayableImage("//evil.example/x.png", "/p.jpg")).toBe("/p.jpg");
    expect(displayableImage("/images/a.jpg", "/p.jpg")).toBe("/images/a.jpg");
  });

  it("keeps an admin's draft a draft", () => {
    expect(
      fromApiPlatformResource({
        ...row,
        published: false,
        publishedOn: null,
        createdAt: "2026-09-30T12:00:00.000Z",
        updatedAt: "2026-09-30T12:00:00.000Z",
      }),
    ).toMatchObject({ published: false, publishedAt: "2026-09-30" });
  });

  it("treats an unknown kind or topic as the safe default", () => {
    expect(
      fromApiLibraryItem({ ...row, kind: "podcast", category: "x" }),
    ).toMatchObject({ kind: "article", category: "general" });
  });
});

describe("writing the library", () => {
  it("never sends a data: URL or a non-https link", () => {
    // The composer used to keep covers as data: URLs; the DTO would refuse
    // them, and a short one would "succeed" as a broken link.
    expect(mediaUrl("data:image/jpeg;base64,AAAA")).toBeUndefined();
    expect(mediaUrl("http://plain.example/x.mp4")).toBeUndefined();
    expect(mediaUrl("javascript:alert(1)")).toBeUndefined();
    expect(mediaUrl("https://cdn.example/x.pdf")).toBe(
      "https://cdn.example/x.pdf",
    );
    const body = toLibraryBody(
      resource({ poster: "data:image/png;base64,AAAA", videoSrc: undefined }),
    );
    expect(JSON.stringify(body)).not.toMatch(/data:/);
    expect(body.posterUrl).toBeUndefined();
  });

  it("sends the server's names and no slug, id or read time", () => {
    const body = toLibraryBody(
      resource({
        kind: "article",
        bodyEn: ["One", "Two"],
        videoSrc: undefined,
      }),
    );
    expect(body).toMatchObject({
      kind: "article",
      category: "access-care",
      titleEn: "Protecting your fistula",
      posterUrl: "/images/Class.jpg",
      bodyEn: ["One", "Two"],
    });
    expect(body).not.toHaveProperty("slug");
    expect(body).not.toHaveProperty("id");
    expect(body).not.toHaveProperty("readMinutes");
    expect(body).not.toHaveProperty("poster");
  });

  it("patches only what changed, and clears a removed video with null", () => {
    const before = resource();
    expect(toLibraryPatch(before, { ...before })).toEqual({});
    expect(toLibraryPatch(before, { ...before, titleEn: "New title" })).toEqual(
      { titleEn: "New title" },
    );
    expect(
      toLibraryPatch(before, {
        ...before,
        kind: "article",
        videoSrc: undefined,
        durationSeconds: undefined,
      }),
    ).toEqual({ kind: "article", videoUrl: null, durationSeconds: null });
  });
});
