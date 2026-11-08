import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONDITIONS,
  chronicCount,
  conditionDraftError,
  conditionLabels,
  conditionSummary,
  hasCondition,
  libraryFromServer,
  resolveCondition,
} from "./ccmConditions";

describe("the worklist line", () => {
  it("shows the two most important conditions, then how many more", () => {
    const summary = conditionSummary(["gout", "chf", "htn", "ckd-4", "t2dm"]);
    expect(summary.text).toBe("CKD 4 · CHF");
    expect(summary.more).toBe(3);
    expect(summary.full).toBe(
      "CKD Stage 4, Congestive Heart Failure / Heart Failure (CHF/HF), Hypertension (HTN), Type 2 Diabetes, Gout",
    );
  });

  it("has no +N with two or fewer", () => {
    expect(conditionSummary(["htn", "ckd-3b"])).toMatchObject({
      text: "CKD 3b · HTN",
      more: 0,
    });
  });
});

describe("reading a stored condition", () => {
  it("knows ids, short names, full names and old free text", () => {
    expect(resolveCondition("ckd-4").short).toBe("CKD 4");
    expect(resolveCondition("HTN").label).toBe("Hypertension (HTN)");
    expect(resolveCondition("DM").short).toBe("T2DM");
    expect(resolveCondition("Anemia").label).toBe("Anemia of CKD");
  });

  it("keeps anything else as an Other entry, ranked last", () => {
    const other = resolveCondition("Sarcoidosis");
    expect(other).toMatchObject({ other: true, label: "Sarcoidosis" });
    expect(conditionLabels(["Sarcoidosis", "htn"])).toEqual([
      "Hypertension (HTN)",
      "Sarcoidosis",
    ]);
  });

  it("does not count AKI toward CCM's two chronic conditions", () => {
    expect(chronicCount(["aki", "htn"])).toBe(1);
    expect(chronicCount(["ckd-4", "htn", "Sarcoidosis"])).toBe(3);
  });
});

describe("the clinic's library", () => {
  it("reads the server's library: defaults, offered or not, and the clinic's own", () => {
    const library = libraryFromServer([
      {
        id: "pkd",
        entryId: null,
        label: "Polycystic Kidney Disease",
        short: "PKD",
        group: "Kidney / Renal",
        secondary: false,
        isDefault: true,
        active: false,
      },
      {
        id: "custom:Sickle Cell Disease",
        entryId: "00000000-0000-4000-8000-000000000001",
        label: "Sickle Cell Disease",
        short: "Sickle Cell Disease",
        group: null,
        secondary: false,
        isDefault: false,
        active: true,
      },
    ]);
    expect(library[0]).toMatchObject({ id: "pkd", active: false });
    expect(library[0].custom).toBeUndefined();
    expect(library[1]).toMatchObject({
      custom: true,
      entryId: "00000000-0000-4000-8000-000000000001",
      group: "Other Chronic Conditions",
    });
    // A patient who has it reads it by name, even after it is deleted.
    expect(resolveCondition("custom:Sickle Cell Disease", []).label).toBe(
      "Sickle Cell Disease",
    );
  });

  it("refuses a blank or duplicate condition", () => {
    const draft = { label: "", short: "", group: "Cardiovascular" as const };
    expect(conditionDraftError(draft, DEFAULT_CONDITIONS)).toBe(
      "Enter the condition's name.",
    );
    expect(
      conditionDraftError({ ...draft, label: "gout" }, DEFAULT_CONDITIONS),
    ).toBe("That condition is already in the library.");
  });
});

describe("matching a patient's conditions to a library id", () => {
  it("finds a condition however it was stored", () => {
    expect(hasCondition(["CHF", "ckd-4"], "chf")).toBe(true);
    expect(hasCondition(["hf"], "chf")).toBe(true);
    expect(hasCondition(["Sarcoidosis"], "chf")).toBe(false);
  });
});
