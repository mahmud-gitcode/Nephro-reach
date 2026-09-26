import { describe, expect, it } from "vitest";
import {
  MAX_EDGE,
  MAX_PHOTOS,
  addPhoto,
  capPhotos,
  normalisePhotos,
  removePhoto,
  scaledSize,
  sortPhotos,
  subjectLabel,
  type AccessPhoto,
} from "./accessPhotos";

const PIXEL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAA=";

function photo(patch: Partial<AccessPhoto> & { id: string }): AccessPhoto {
  return {
    dataUrl: PIXEL,
    subject: "access",
    note: "",
    takenAt: "2026-09-11T08:00:00.000Z",
    sent: false,
    ...patch,
  };
}

describe("keeping a photo inside the storage budget", () => {
  it("shrinks the long edge and leaves the shape alone", () => {
    // A phone shot is 4000px wide; stored whole it would blow the origin's
    // whole quota on one picture.
    expect(scaledSize(4000, 3000)).toEqual({ width: MAX_EDGE, height: 768 });
    expect(scaledSize(3000, 4000)).toEqual({ width: 768, height: MAX_EDGE });
  });

  it("leaves a picture already small enough alone", () => {
    expect(scaledSize(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("never scales an edge away to nothing", () => {
    // A panorama would otherwise round its short side to zero, and a
    // zero-height canvas throws rather than encodes.
    const { height } = scaledSize(8000, 30);
    expect(height).toBeGreaterThanOrEqual(1);
  });

  it("does not divide by zero on an unreadable image", () => {
    expect(scaledSize(0, 0)).toEqual({ width: 0, height: 0 });
  });
});

describe("the cap on how many are kept", () => {
  const many = Array.from({ length: MAX_PHOTOS + 4 }, (_, index) =>
    photo({
      id: `p${index}`,
      takenAt: `2026-09-${`${index + 1}`.padStart(2, "0")}T08:00:00.000Z`,
    }),
  );

  it("keeps the newest and drops the oldest", () => {
    // A cap the member cannot exceed is kinder than a quota error at the
    // moment they are trying to show a nurse something that worries them.
    const kept = capPhotos(many);
    expect(kept).toHaveLength(MAX_PHOTOS);
    expect(kept.map((entry) => entry.id)).not.toContain("p0");
    expect(kept.map((entry) => entry.id)).toContain(`p${MAX_PHOTOS + 3}`);
  });

  it("leaves a list under the cap untouched", () => {
    const few = many.slice(0, 3);
    expect(capPhotos(few)).toHaveLength(3);
  });

  it("applies the cap as a new photo arrives, not later", () => {
    const next = addPhoto(capPhotos(many), photo({ id: "newest" }));
    expect(next).toHaveLength(MAX_PHOTOS);
    expect(next.some((entry) => entry.id === "newest")).toBe(true);
  });
});

describe("the list a care team reads", () => {
  it("shows the newest first", () => {
    const sorted = sortPhotos([
      photo({ id: "old", takenAt: "2026-09-01T08:00:00.000Z" }),
      photo({ id: "new", takenAt: "2026-09-20T08:00:00.000Z" }),
    ]);
    expect(sorted.map((entry) => entry.id)).toEqual(["new", "old"]);
  });

  it("removes only the photo asked for", () => {
    const next = removePhoto([photo({ id: "a" }), photo({ id: "b" })], "a");
    expect(next.map((entry) => entry.id)).toEqual(["b"]);
  });

  it("names each subject in both languages", () => {
    expect(subjectLabel("exit-site", false)).toBe("Exit site");
    expect(subjectLabel("equipment", true)).toBe("Equipo");
  });
});

describe("reading stored photos back", () => {
  it("drops a row with nothing to show", () => {
    // Without a usable data URL there is no picture, and an entry that
    // renders a broken image is worse than one that is not there.
    expect(normalisePhotos([{ id: "a" }])).toEqual([]);
    expect(
      normalisePhotos([{ id: "a", dataUrl: "https://example.com/x" }]),
    ).toEqual([]);
    expect(normalisePhotos(null)).toEqual([]);
  });

  it("keeps a row that carries an image", () => {
    const [read] = normalisePhotos([{ id: "a", dataUrl: PIXEL }]);
    expect(read.dataUrl).toBe(PIXEL);
    expect(read.subject).toBe("other");
    expect(read.sent).toBe(false);
  });

  it("refuses a subject it does not recognise", () => {
    const [read] = normalisePhotos([
      { id: "a", dataUrl: PIXEL, subject: "x-ray" },
    ]);
    expect(read.subject).toBe("other");
  });
});
