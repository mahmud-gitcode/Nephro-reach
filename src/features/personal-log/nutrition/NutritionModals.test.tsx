import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/context/LanguageContext";
import { AddFoodModal, AddWaterModal, GoalsModal } from "./NutritionModals";
import type { Goals, MealKey } from "./nutrition.types";

/* P16b crawl: a view-only caregiver's "Add Food" was refused (403) while
   the form stayed open, and the reason only showed on the page banner
   behind the modal. Each nutrition form now shows the save failure itself.
   Synthetic data only. */

afterEach(cleanup);

/* The fluid form reads the member's unit preference through React Query. */
function wrap(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <LanguageProvider>{ui}</LanguageProvider>
    </QueryClientProvider>
  );
}

const REFUSED =
  "You do not have access to this information. If you think you should, ask the person or office who manages it to share it with you.";

const mealLabels: Record<MealKey, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

const goals = {
  fluid: 1500,
  calories: 2000,
  sodium: 2000,
  potassium: 2500,
  phosphorus: 1000,
  protein: 80,
  carbs: 250,
  fats: 70,
  fiber: 25,
} as Goals;

const modals: [string, (saveError: string | null) => React.ReactElement][] = [
  [
    "Add Food",
    (saveError) => (
      <AddFoodModal
        defaultMeal="breakfast"
        dayLabel="Today"
        mealLabels={mealLabels}
        onClose={vi.fn()}
        onSave={vi.fn()}
        saveError={saveError}
      />
    ),
  ],
  [
    "Goals",
    (saveError) => (
      <GoalsModal
        goals={goals}
        onClose={vi.fn()}
        onSave={vi.fn()}
        saveError={saveError}
      />
    ),
  ],
  [
    "Add Fluid",
    (saveError) => (
      <AddWaterModal
        dayLabel="Today"
        onClose={vi.fn()}
        onSave={vi.fn()}
        saveError={saveError}
      />
    ),
  ],
];

describe("nutrition forms show why a save failed", () => {
  it.each(modals)(
    "%s: the refusal is an alert inside the dialog",
    async (_name, make) => {
      render(wrap(make(REFUSED)));
      const dialog = await screen.findByRole("dialog");
      const alert = screen.getByRole("alert");
      expect(dialog.contains(alert)).toBe(true);
      expect(alert.textContent).toContain("You do not have access");
      expect(await axe(document.body)).toHaveNoViolations();
    },
  );

  it.each(modals)("%s: no alert without a failure", async (_name, make) => {
    render(wrap(make(null)));
    await screen.findByRole("dialog");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("Add Food validation message", () => {
  it("clears 'Enter a food name.' once a valid food is submitted", async () => {
    const onSave = vi.fn();
    const { rerender } = render(
      wrap(
        <AddFoodModal
          defaultMeal="breakfast"
          dayLabel="Today"
          mealLabels={mealLabels}
          onClose={vi.fn()}
          onSave={onSave}
          saveError={null}
        />,
      ),
    );
    const dialog = await screen.findByRole("dialog");
    const form = dialog.querySelector("form");
    if (!form) throw new Error("no form");
    fireEvent.submit(form);
    expect(screen.getByText("Enter a food name.")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/^Food/), {
      target: { value: "Synthetic oatmeal" },
    });
    fireEvent.submit(form);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Enter a food name.")).toBeNull();

    /* The server then refuses the save: only its reason is shown. */
    rerender(
      wrap(
        <AddFoodModal
          defaultMeal="breakfast"
          dayLabel="Today"
          mealLabels={mealLabels}
          onClose={vi.fn()}
          onSave={onSave}
          saveError={REFUSED}
        />,
      ),
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "You do not have access",
    );
    expect(screen.queryByText("Enter a food name.")).toBeNull();
  });
});

/* P16b QA round 2: Set Goals with Calories "-5" sent a calorie goal of 0,
   got 200 and closed with no message. Invalid input now stays in the form
   with a field message, and nothing is sent. */
describe("nutrition forms refuse invalid amounts with a field message", () => {
  it("Goals: '-5' calories is not saved as 0", async () => {
    const onSave = vi.fn();
    render(
      wrap(<GoalsModal goals={goals} onClose={vi.fn()} onSave={onSave} />),
    );
    const dialog = await screen.findByRole("dialog");
    const calories = screen.getByLabelText(/^Calories/);
    fireEvent.change(calories, { target: { value: "-5" } });
    const form = dialog.querySelector("form");
    if (!form) throw new Error("no form");
    fireEvent.submit(form);
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain(
      "Enter a number of 0 or more.",
    );
    expect(calories.getAttribute("aria-invalid")).toBe("true");
    expect(await axe(document.body)).toHaveNoViolations();

    /* Fixing the field clears its message and saves the typed goal. */
    fireEvent.change(calories, { target: { value: "1,900" } });
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.submit(form);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].calories).toBe(1900);
  });

  it("Goals: a goal above the server's limit is named", async () => {
    const onSave = vi.fn();
    render(
      wrap(<GoalsModal goals={goals} onClose={vi.fn()} onSave={onSave} />),
    );
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(screen.getByLabelText(/^Fluids/), {
      target: { value: "20000" },
    });
    fireEvent.submit(dialog.querySelector("form") as HTMLFormElement);
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain(
      "Enter a number up to 10,000 ml.",
    );
  });

  it("Add Food: letters in an amount are not saved as 0", async () => {
    const onSave = vi.fn();
    render(
      wrap(
        <AddFoodModal
          defaultMeal="breakfast"
          dayLabel="Today"
          mealLabels={mealLabels}
          onClose={vi.fn()}
          onSave={onSave}
        />,
      ),
    );
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(screen.getByLabelText(/^Food/), {
      target: { value: "Synthetic oatmeal" },
    });
    fireEvent.change(screen.getByLabelText(/^Sodium/), {
      target: { value: "lots" },
    });
    fireEvent.submit(dialog.querySelector("form") as HTMLFormElement);
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Check the amounts marked below.")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain(
      "Enter a number of 0 or more.",
    );
  });

  it("Add Food: an over-long name is named, not sent", async () => {
    const onSave = vi.fn();
    render(
      wrap(
        <AddFoodModal
          defaultMeal="breakfast"
          dayLabel="Today"
          mealLabels={mealLabels}
          onClose={vi.fn()}
          onSave={onSave}
        />,
      ),
    );
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(screen.getByLabelText(/^Food/), {
      target: { value: "x".repeat(201) },
    });
    fireEvent.submit(dialog.querySelector("form") as HTMLFormElement);
    expect(onSave).not.toHaveBeenCalled();
    expect(
      screen.getByText("The food name can be up to 200 characters."),
    ).toBeTruthy();
  });

  it("Add Fluid: a negative amount says why instead of doing nothing", async () => {
    const onSave = vi.fn();
    render(
      wrap(
        <AddWaterModal dayLabel="Today" onClose={vi.fn()} onSave={onSave} />,
      ),
    );
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(screen.getByLabelText(/^Amount/), {
      target: { value: "-8" },
    });
    fireEvent.submit(dialog.querySelector("form") as HTMLFormElement);
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain(
      "Enter an amount greater than 0.",
    );
  });
});
