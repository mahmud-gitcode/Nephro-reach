import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONDITIONS,
  EMPTY_LIBRARY,
  addLibraryCondition,
  chronicCount,
  conditionDraftError,
  conditionLabels,
  conditionSummary,
  hasCondition,
  libraryOf,
  removeLibraryCondition,
  resolveCondition,
  setConditionActive,
} from "./ccmConditions";
import {
  CCM_PATIENTS,
  filterWorklist,
  seedCcmState,
  worklist,
} from "./ccm.data";

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
  it("adds, switches off and deletes the clinic's own conditions", () => {
    let state = addLibraryCondition(EMPTY_LIBRARY, {
      label: "Sickle Cell Disease",
      short: "SCD",
      group: "Other Chronic Conditions",
    });
    let library = libraryOf(state);
    expect(library).toHaveLength(DEFAULT_CONDITIONS.length + 1);
    expect(resolveCondition("custom:Sickle Cell Disease", library).short).toBe(
      "SCD",
    );

    state = setConditionActive(state, "pkd", false);
    library = libraryOf(state);
    expect(library.find((c) => c.id === "pkd")?.active).toBe(false);

    state = removeLibraryCondition(state, "custom:Sickle Cell Disease");
    library = libraryOf(state);
    // A patient who had it still reads it by name.
    expect(resolveCondition("custom:Sickle Cell Disease", library).label).toBe(
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

describe("filtering the worklist by condition", () => {
  const rows = worklist(
    seedCcmState(Date.now()),
    CCM_PATIENTS,
    "2026-09",
    "2026-09-30",
  );

  it("keeps only patients with that condition", () => {
    const chf = filterWorklist(rows, {
      query: "",
      provider: "All",
      location: "All",
      careManager: "All",
      status: "All",
      condition: "chf",
    });
    expect(chf.length).toBeGreaterThan(0);
    expect(chf.every((row) => hasCondition(row.conditions, "chf"))).toBe(true);
    expect(chf.length).toBeLessThan(rows.length);
  });
});
