import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { dialysisText } from "./dialysisText";

type Tree = { [key: string]: string | Tree };

function leaves(tree: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === "string") out[prefix + key] = value;
    else Object.assign(out, leaves(value, `${prefix}${key}.`));
  }
  return out;
}

describe("memberDialysis dictionary namespace", () => {
  const enLeaves = leaves(en.memberDialysis as Tree);
  const esLeaves = leaves(es.memberDialysis as Tree);

  it("has a Spanish text for every English key, and no extra ones", () => {
    expect(Object.keys(esLeaves).sort()).toEqual(Object.keys(enLeaves).sort());
    for (const [key, text] of Object.entries(esLeaves)) {
      expect(text.trim(), key).not.toBe("");
      expect(enLeaves[key].trim(), key).not.toBe("");
    }
  });

  it("keeps the same placeholders in both languages", () => {
    const holes = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(enLeaves))
      expect(holes(esLeaves[key]), key).toEqual(holes(enLeaves[key]));
  });

  it("reads by language (EN/ES, en/es or isEs) and fills placeholders", () => {
    expect(dialysisText(false, "equipment.title")).toBe("Maintenance history");
    expect(dialysisText(true, "equipment.title")).toBe(
      "Historial de mantenimiento",
    );
    expect(dialysisText("es", "pd.loadFailed")).toBe(
      "Tus intercambios no se cargaron",
    );
    expect(dialysisText("EN", "pd.loadFailed")).toBe(
      "Your exchanges did not load",
    );
    expect(
      dialysisText("ES", "prescription.managedByNamed", {
        facility: "Synthetic Center",
      }),
    ).toBe(
      "Tu centro de diálisis (Synthetic Center) maneja tu receta y tu horario. Pídeles cualquier cambio.",
    );
  });

  it("an unknown key shows its path, never undefined", () => {
    expect(dialysisText("ES", "nope.missing")).toBe("nope.missing");
  });
});
