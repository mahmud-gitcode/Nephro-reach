import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { ExtraTreatmentModal } from "./ExtraTreatmentModal";
import HomeVisitsSection from "./HomeVisitsSection";
import type { DialysisModalityLog } from "./useDialysisModality";

/* P16b QA round 2 crawl: over-long text in Add Visit (purpose) and in an
   extra treatment's notes was saved cut to the server's limit (the request
   body is sliced) with no word to the member. Each field now stops at the
   limit, so what is saved is what the member sees. Synthetic data only. */

vi.mock("./useHomeVisits", () => ({
  useHomeVisits: () => ({
    visits: [],
    ordered: [],
    next: null,
    today: "2026-11-11",
    hasMore: false,
    loadMore: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
    isPending: false,
    error: null,
    isError: false,
    isSaving: false,
    saveError: null,
    dismissSaveError: vi.fn(),
    refetch: vi.fn(),
  }),
}));

afterEach(cleanup);

describe("dialysis text fields stop at the server's limit", () => {
  it("Add Visit: the purpose stops at 300 characters", async () => {
    const modalityLog = {
      modality: "home-hd",
      isHome: true,
    } as unknown as DialysisModalityLog;
    render(
      <LanguageProvider>
        <HomeVisitsSection modalityLog={modalityLog} />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Add Visit/ }));
    const dialog = await screen.findByRole("dialog");
    expect(screen.getByLabelText("Purpose").getAttribute("maxlength")).toBe(
      "300",
    );
    expect(await axe(dialog)).toHaveNoViolations();
  });

  it("Extra treatment: the notes stop at 4,000 characters", async () => {
    render(
      <LanguageProvider>
        <ExtraTreatmentModal
          open
          onClose={vi.fn()}
          initialDate={new Date(2026, 10, 11)}
          sessionFor={() => ({
            intervalName: "Mon-Wed",
            intervalLabel: "Monday to Wednesday",
            extraIndex: 1,
          })}
          formatDayLabel={(d) => d.toDateString()}
          monthNames={Array.from({ length: 12 }, (_, i) => `Month ${i + 1}`)}
          weekdayLabels={["S", "M", "T", "W", "T", "F", "S"]}
          onSave={vi.fn()}
        />
      </LanguageProvider>,
    );
    const dialog = await screen.findByRole("dialog");
    const notes = dialog.querySelector("textarea");
    expect(notes?.getAttribute("maxlength")).toBe("4000");
  });
});
