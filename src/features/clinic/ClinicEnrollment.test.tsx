import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/context/LanguageContext";

/* The whole enrollment path, end to end in the browser layer: the real
 * query, the real store over localStorage, the real form. Only the router
 * is stood in for, so the address bar can be read back. */

const replace = vi.fn();
let search = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
  useRouter: () => ({ replace }),
  usePathname: () => "/dashboard/clinic/enroll-patients",
}));

const { default: ClinicEnrollment } = await import("./ClinicEnrollment");

function renderPage(url = "") {
  search = new URLSearchParams(url);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <ClinicEnrollment />
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  replace.mockReset();
});

const showing = () => screen.findByText(/^Showing \d+–\d+ of \d+ patients$/);

describe("enrolling a patient", () => {
  it("explains what is missing before saving anything", async () => {
    renderPage();
    await userEvent.click(
      (await screen.findAllByRole("button", { name: /Enroll New Patient/ }))[0],
    );
    const dialog = screen.getByRole("dialog", { name: "Enroll New Patient" });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Enroll Patient" }),
    );
    expect(
      within(dialog).getByText("Enter the patient's full name."),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("An MRN is 6 digits.")).toBeInTheDocument();
  });

  it("adds them to the list, the counts and the seats", async () => {
    renderPage();
    expect(await showing()).toHaveTextContent("of 23 patients");

    await userEvent.click(
      (await screen.findAllByRole("button", { name: /Enroll New Patient/ }))[0],
    );
    const dialog = screen.getByRole("dialog", { name: "Enroll New Patient" });
    await userEvent.type(
      within(dialog).getByRole("textbox", { name: /Full name/ }),
      "Maria L. Gomez",
    );
    await userEvent.type(
      within(dialog).getByRole("textbox", { name: /MRN/ }),
      "700001",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Enroll Patient" }),
    );

    expect(
      await screen.findByText("Maria L. Gomez is enrolled."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await showing()).toHaveTextContent("of 24 patients");
    expect(screen.getByText("24 of 30 enrolled")).toBeInTheDocument();
    expect(screen.getByText("6 slots remaining")).toBeInTheDocument();
  });

  it("refuses an MRN that is already on the roster", async () => {
    renderPage();
    await userEvent.click(
      (await screen.findAllByRole("button", { name: /Enroll New Patient/ }))[0],
    );
    const dialog = screen.getByRole("dialog");
    await userEvent.type(
      within(dialog).getByRole("textbox", { name: /Full name/ }),
      "Copy Of John",
    );
    await userEvent.type(
      within(dialog).getByRole("textbox", { name: /MRN/ }),
      "123456",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Enroll Patient" }),
    );
    expect(
      within(dialog).getByText("A patient with this MRN is already enrolled."),
    ).toBeInTheDocument();
  });
});

describe("filtering from the panels", () => {
  it("narrows the table by referral source, and writes it to the URL", async () => {
    renderPage();
    await showing();
    await userEvent.click(screen.getByRole("button", { name: /^Self-Pay/ }));
    expect(await showing()).toHaveTextContent("of 2 patients");
    expect(replace).toHaveBeenLastCalledWith(
      "/dashboard/clinic/enroll-patients?source=Self-Pay",
      { scroll: false },
    );
  });

  it("starts filtered when the link says so", async () => {
    renderPage("status=Pending+Start");
    expect(await showing()).toHaveTextContent("of 3 patients");
  });
});
