import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import type { CurrentLegalDocument } from "@/features/auth/consent";
import RegistrationPage from "./page";

/* D44 (user, 2026-11-09): the registration consent text names the Terms &
   Conditions AND the Privacy Notice, each linked to its current version
   from GET /legal/documents/current. Only the text and the two links
   changed: the same checkbox, the same validation, and the same consent
   payload (register(form, agreed); the versions are read at submit time by
   registrationConsent, spec 030). Synthetic documents only. */

const register = vi.fn();
vi.mock("@/features/auth/AuthContext", () => ({
  useAuth: () => ({ register, loginWithGoogle: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@/features/auth/providers", () => ({
  useAuthProviders: () => ({ google: false, apple: false }),
}));

const documents: CurrentLegalDocument[] = [
  {
    type: "TERMS",
    version: "9",
    title: "Terms (synthetic v9)",
    effectiveAt: "2026-11-01T00:00:00.000Z",
    contentUrl: "https://example.test/legal/terms-v9",
  },
  {
    type: "PRIVACY",
    version: "4",
    title: "Privacy (synthetic v4)",
    effectiveAt: "2026-11-01T00:00:00.000Z",
    contentUrl: "https://example.test/legal/privacy-v4",
  },
];
const fetchCurrentLegalDocuments = vi.fn(async () => documents);
vi.mock("@/features/auth/consent", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/auth/consent")>()),
  fetchCurrentLegalDocuments: () => fetchCurrentLegalDocuments(),
}));

function renderPage() {
  return render(
    <LanguageProvider>
      <RegistrationPage />
    </LanguageProvider>,
  );
}

afterEach(() => {
  cleanup();
  register.mockReset();
  fetchCurrentLegalDocuments.mockReset();
  fetchCurrentLegalDocuments.mockImplementation(async () => documents);
});

describe("registration consent text (D44)", () => {
  it("names both documents, each linked to its current version", async () => {
    const { container } = renderPage();
    expect(container.textContent).toContain(
      "I am 18 years or older and have read and agree to the Terms & Conditions and the Privacy Notice.",
    );
    const terms = screen.getByRole("link", { name: "Terms & Conditions" });
    const privacy = screen.getByRole("link", { name: "Privacy Notice" });
    await waitFor(() =>
      expect(terms).toHaveAttribute(
        "href",
        "https://example.test/legal/terms-v9",
      ),
    );
    expect(privacy).toHaveAttribute(
      "href",
      "https://example.test/legal/privacy-v4",
    );
    for (const link of [terms, privacy]) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(fetchCurrentLegalDocuments).toHaveBeenCalledTimes(1);
  });

  it("keeps both links inert when the list cannot be read", async () => {
    fetchCurrentLegalDocuments.mockImplementation(async () => {
      throw new Error("unavailable");
    });
    renderPage();
    await waitFor(() =>
      expect(fetchCurrentLegalDocuments).toHaveBeenCalledTimes(1),
    );
    for (const name of ["Terms & Conditions", "Privacy Notice"]) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("href", "#");
      expect(link).not.toHaveAttribute("target");
    }
  });

  it("keeps the same checkbox and validation: unticked does not register", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "Test Member" },
    });
    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "member@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "synthetic-pass-1" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "synthetic-pass-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(
      await screen.findByText("Please agree to the terms to continue."),
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();

    /* Ticked: the payload is unchanged, the form plus the checkbox state. */
    const box = screen.getByRole("checkbox", {
      name: "Agree to terms and conditions",
    });
    fireEvent.click(box);
    expect(box).toHaveAttribute("aria-checked", "true");
    register.mockImplementation(() => new Promise(() => undefined));
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    await waitFor(() => expect(register).toHaveBeenCalledTimes(1));
    expect(register).toHaveBeenCalledWith(
      {
        name: "Test Member",
        email: "member@example.test",
        password: "synthetic-pass-1",
      },
      true,
    );
  });

  it("has no axe violations in the consent text", async () => {
    const { container } = renderPage();
    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: "Privacy Notice" }),
      ).toHaveAttribute("href", "https://example.test/legal/privacy-v4"),
    );
    const consent = screen.getByRole("link", {
      name: "Terms & Conditions",
    }).parentElement as HTMLElement;
    expect(await axe(consent)).toHaveNoViolations();
    expect(container).toBeTruthy();
  });
});
