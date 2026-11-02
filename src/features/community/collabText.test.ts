import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { collabText } from "./collabText";
import { videoFileError } from "@/features/testimonials/testimonials.rules";

type Tree = { [key: string]: string | Tree };

function leaves(tree: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === "string") out[prefix + key] = value;
    else Object.assign(out, leaves(value, `${prefix}${key}.`));
  }
  return out;
}

describe("collab dictionary namespace", () => {
  const enLeaves = leaves(en.collab as Tree);
  const esLeaves = leaves(es.collab as Tree);

  it("has a Spanish text for every English key, and no extra ones", () => {
    expect(Object.keys(esLeaves).sort()).toEqual(Object.keys(enLeaves).sort());
    for (const [key, text] of Object.entries(esLeaves)) {
      expect(text.trim(), key).not.toBe("");
      expect(text, key).not.toBe(enLeaves[key]);
    }
  });

  it("keeps the same placeholders in both languages", () => {
    const holes = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(enLeaves))
      expect(holes(esLeaves[key]), key).toEqual(holes(enLeaves[key]));
  });

  it("reads by language and fills placeholders; an unknown key shows its path", () => {
    expect(collabText(false, "notAvailable.communityRecord")).toBe(
      "Deleting a decided record is not available yet.",
    );
    expect(collabText("ES", "video.loadFailed")).toBe(
      "Este video no se pudo cargar. Inténtelo de nuevo más tarde.",
    );
    expect(
      collabText("en", "testimonials.videoTooBig", { size: "15", limit: "10" }),
    ).toBe("That file is 15 MB. The limit is 10 MB.");
    expect(collabText(true, "nope.missing")).toBe("nope.missing");
  });

  it("the testimonial file check speaks the member's language", () => {
    const MB = 1024 * 1024;
    expect(videoFileError({ type: "video/mp4", size: 0 }, "ES")).toBe(
      "Ese archivo está vacío.",
    );
    expect(videoFileError({ type: "image/png", size: MB }, "ES")).toMatch(
      /MP4, WebM o MOV/,
    );
    expect(videoFileError({ type: "video/mp4", size: 15 * MB }, "ES")).toBe(
      "Ese archivo pesa 15 MB. El límite es 10 MB.",
    );
  });
});
