import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { CheckInForm } from "./CheckInForm";
import { todayIso } from "./checkIn.rules";
import { LanguageProvider } from "@/context/LanguageContext";

/* Phase 16 (lane 16b crawl): tapping an unlogged earlier day in the
 * 14-day strip opened the form dated today, so "Save check-in" overwrote
 * today's check-in instead of writing the day that was tapped. */

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function renderForm(props: Partial<React.ComponentProps<typeof CheckInForm>>) {
  const onSave = vi.fn();
  /* The form's photo bar reads the patient's photos; with no signed-in
     patient that read stays off. */
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <CheckInForm onSave={onSave} onCancel={() => undefined} {...props} />
      </LanguageProvider>
    </QueryClientProvider>,
  );
  return { onSave, ...view };
}

describe("CheckInForm day", () => {
  it("opens on the day that was picked, not today", async () => {
    const user = userEvent.setup();
    const picked = daysAgo(3);
    const { onSave } = renderForm({ date: picked });

    expect(screen.getByLabelText("Which day are you logging?")).toHaveValue(
      picked,
    );
    await user.click(screen.getByRole("button", { name: "Save check-in" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].date).toBe(picked);
  });

  it("opens on today when no day is given", () => {
    renderForm({});
    expect(screen.getByLabelText("Which day are you logging?")).toHaveValue(
      todayIso(),
    );
  });

  it("keeps an existing entry's own day over the picked one", () => {
    const own = daysAgo(5);
    renderForm({
      date: daysAgo(1),
      entry: {
        id: "c1",
        date: own,
        treatmentDay: false,
        feeling: "okay",
        symptoms: [],
        severity: "mild",
        missedTreatment: false,
        notes: "",
        savedAt: new Date().toISOString(),
      },
    });
    expect(screen.getByLabelText("Which day are you logging?")).toHaveValue(
      own,
    );
  });

  it("has no axe violations", async () => {
    const { container } = renderForm({ date: daysAgo(2) });
    expect(await axe(container)).toHaveNoViolations();
  });
});
