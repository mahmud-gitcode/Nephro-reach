import { describe, expect, it } from "vitest";
import {
  addFluid,
  addFood,
  fluidOn,
  foodsOn,
  isFutureDay,
  removeFood,
  shiftDay,
  totalsFor,
} from "./nutrition.rules";
import type { FoodEntry } from "./nutrition.types";

const food = (id: string, date: string, sodium = 100): FoodEntry => ({
  id,
  date,
  meal: "lunch",
  name: id,
  portion: "",
  calories: 50,
  sodium,
  potassium: 10,
  phosphorus: 5,
  protein: 1,
  carbs: 2,
  fats: 0,
  fiber: 0,
});

describe("shiftDay", () => {
  it("steps across month and year ends", () => {
    expect(shiftDay("2026-09-30", 1)).toBe("2026-10-01");
    expect(shiftDay("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftDay("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("isFutureDay", () => {
  const now = new Date(2026, 8, 17, 23, 30);
  it("allows today and the past", () => {
    expect(isFutureDay("2026-09-17", now)).toBe(false);
    expect(isFutureDay("2026-09-01", now)).toBe(false);
  });
  it("refuses tomorrow", () => {
    expect(isFutureDay("2026-09-18", now)).toBe(true);
  });
});

describe("foods by day", () => {
  const foods = [food("a", "2026-09-16"), food("b", "2026-09-17", 250)];

  it("shows only the chosen day", () => {
    expect(foodsOn(foods, "2026-09-17").map((f) => f.id)).toEqual(["b"]);
    expect(foodsOn(foods, "2026-09-15")).toEqual([]);
  });

  it("totals only what it is given", () => {
    expect(totalsFor(foodsOn(foods, "2026-09-17")).sodium).toBe(250);
    expect(totalsFor([]).calories).toBe(0);
  });

  it("adds and removes by id", () => {
    const added = addFood(foods, food("c", "2026-09-17"));
    expect(added).toHaveLength(3);
    expect(removeFood(added, "a").map((f) => f.id)).toEqual(["b", "c"]);
  });
});

describe("fluids by day", () => {
  it("adds to the chosen day only", () => {
    let fluids = addFluid({}, "2026-09-17", 240);
    fluids = addFluid(fluids, "2026-09-17", 120);
    fluids = addFluid(fluids, "2026-09-16", 500);
    expect(fluidOn(fluids, "2026-09-17")).toBe(360);
    expect(fluidOn(fluids, "2026-09-16")).toBe(500);
    expect(fluidOn(fluids, "2026-09-15")).toBe(0);
  });

  it("ignores zero and negative amounts", () => {
    const fluids = { "2026-09-17": 100 };
    expect(addFluid(fluids, "2026-09-17", 0)).toBe(fluids);
    expect(addFluid(fluids, "2026-09-17", -50)).toBe(fluids);
  });
});
