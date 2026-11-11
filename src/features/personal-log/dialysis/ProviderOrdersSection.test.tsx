import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { ProviderOrdersSection } from "./ProviderOrdersSection";

/* P16b QA round 2 crawl: a 5,001-character order was saved as its first
   2,000 characters (the request body is cut to the server's limit) with
   no word to the member. The field now stops at the limit, so what is
   saved is what the member sees. Synthetic data only. */

vi.mock("./useProviderOrders", () => ({
  useProviderOrders: () => ({
    orders: [],
    hasMore: false,
    loadMore: vi.fn(),
    isPending: false,
    error: null,
    isError: false,
    refetch: vi.fn(),
    isSaving: false,
    saveError: null,
    dismissSaveError: vi.fn(),
    add: vi.fn(() => Promise.resolve()),
    toggle: vi.fn(),
    remove: vi.fn(),
  }),
}));

afterEach(cleanup);

describe("Add Order", () => {
  it("the order field stops at the server's 2,000 characters", async () => {
    render(
      <LanguageProvider>
        <ProviderOrdersSection />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Add Order/ }));
    const dialog = await screen.findByRole("dialog");
    const field = screen.getByLabelText(/Order \/ Instruction/);
    expect(field.getAttribute("maxlength")).toBe("2000");
    expect(await axe(dialog)).toHaveNoViolations();
  });
});
