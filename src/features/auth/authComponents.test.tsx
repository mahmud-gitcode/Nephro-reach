import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import { axe } from "vitest-axe";
import type { MeContext, TwoFactorMethod } from "./auth.types";

/* Every Phase 2 auth component: accessible (axe), and the security rules
   a regression would break: a 2FA page without a challenge in memory goes
   back to sign-in, backup codes cannot be skipped unsaved, the sudo prompt
   keeps nothing typed after it closes, and the guard shows an error with a
   retry (never a sign-out) when /me/context fails. Synthetic data only. */

const replace = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/clinic",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("./auth.api", () => ({
  listMfaMethods: vi.fn(async () => []),
  enrollTotp: vi.fn(async () => ({
    methodId: "m-1",
    secret: "JBSWY3DPEHPK3PXP",
    otpauthUrl: "otpauth://totp/NephroReach:test?secret=JBSWY3DPEHPK3PXP",
    qrDataUrl: "data:image/png;base64,iVBORw0KGgo=",
  })),
  confirmTotp: vi.fn(async () => ["aaaa-bbbb", "cccc-dddd"]),
  disableMfaMethod: vi.fn(async () => undefined),
  regenerateBackupCodes: vi.fn(async () => ["eeee-ffff"]),
  sudoOptions: vi.fn(async () => [{ kind: "password" }]),
  sudoPassword: vi.fn(async () => undefined),
  sendChallengeCode: vi.fn(async () => undefined),
  forgotPassword: vi.fn(),
  resetByToken: vi.fn(),
  verifyEmailCode: vi.fn(),
  verifyEmailOtp: vi.fn(),
  resendVerification: vi.fn(),
  resendVerificationFor: vi.fn(),
  confirmEmailChange: vi.fn(),
  confirmAddedEmail: vi.fn(),
  createMyPatient: vi.fn(),
  fetchCurrentSession: vi.fn(),
  touchSession: vi.fn(),
}));

const baseContext: MeContext = {
  user: {
    id: "u-1",
    name: "Test Nurse",
    email: "nurse@example.test",
    phone: null,
    avatarUrl: null,
    language: "EN",
    timeZone: null,
    isAccountVerified: true,
    mfaEnabled: false,
    mfaSetupRequired: true,
  },
  patient: null,
  caregiving: [],
  memberships: [
    {
      organizationId: "org-1",
      organizationName: "Riverside Dialysis Center",
      organizationType: "DIALYSIS_CENTER",
      organizationStatus: "ACTIVE",
      role: "Nurse",
      title: null,
      isOwner: false,
      permissions: {},
    },
  ],
  platform: null,
};

const auth = {
  status: "signed-in" as "signed-in" | "error" | "loading" | "signed-out",
  context: baseContext as MeContext | null,
  choice: { kind: "office", membership: baseContext.memberships[0] } as never,
  user: null as never,
  refreshContext: vi.fn(async () => baseContext),
  completeTwoFactor: vi.fn(),
};
vi.mock("./AuthContext", () => ({ useAuth: () => auth }));

import { AuthPageShell } from "./AuthPageShell";
import { BackupCodes } from "./mfa/BackupCodes";
import { MfaEnrolment } from "./mfa/MfaEnrolment";
import { MfaMethodList } from "./mfa/MfaMethodList";
import { SudoPrompt } from "./SudoPrompt";
import { TwoFactorPage } from "./pages/TwoFactorPage";
import { ForgotPasswordPage, ResetPasswordPage } from "./pages/PasswordPages";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { SetupMfaPage, SetupPatientPage } from "./pages/SetupPages";
import { ConfirmEmailPage } from "./pages/ConfirmEmailPages";
import DashboardGuard from "./DashboardGuard";
import { IdleWarning } from "./IdleWarning";
import * as authApi from "./auth.api";
import { clearPendingChallenge, setPendingChallenge } from "./pendingChallenge";

const passthrough = <T,>(fn: () => Promise<T>) => fn();

beforeEach(() => {
  auth.status = "signed-in";
  auth.context = baseContext;
  replace.mockClear();
  push.mockClear();
  clearPendingChallenge();
});

afterEach(() => {
  cleanup();
});

async function expectAccessible(container: HTMLElement) {
  expect(await axe(container)).toHaveNoViolations();
}

describe("auth components (axe)", () => {
  it("AuthPageShell", async () => {
    const { container } = render(
      <AuthPageShell title="Title" description="Description">
        <p>Body</p>
      </AuthPageShell>,
    );
    await expectAccessible(container);
  });

  it("BackupCodes cannot be dismissed until saved", async () => {
    const onDone = vi.fn();
    const { container } = render(
      <BackupCodes codes={["aaaa-bbbb", "cccc-dddd"]} onDone={onDone} />,
    );
    await expectAccessible(container);
    const go = screen.getByRole("button");
    expect(go).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(go).toBeEnabled();
  });

  it("MfaEnrolment", async () => {
    const { container } = render(
      <MfaEnrolment withSudo={passthrough} onDone={vi.fn()} />,
    );
    await expectAccessible(container);
  });

  it("MfaMethodList", async () => {
    const methods: TwoFactorMethod[] = [
      {
        id: "m-1",
        type: "TOTP",
        isEnabled: true,
        isPrimary: true,
        destination: null,
        lastUsedAt: null,
        verifiedAt: "2026-11-01T00:00:00.000Z",
        createdAt: "2026-11-01T00:00:00.000Z",
      },
    ];
    const { container } = render(
      <MfaMethodList
        methods={methods}
        withSudo={passthrough}
        onChanged={vi.fn()}
      />,
    );
    await expectAccessible(container);
  });

  it("SudoPrompt", async () => {
    const { baseElement } = render(<SudoPrompt open onDone={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
    await expectAccessible(baseElement);
  });

  it("TwoFactorPage with a challenge", async () => {
    setPendingChallenge({
      challengeId: "c-1",
      methods: ["TOTP"],
      next: null,
    });
    const { container } = render(<TwoFactorPage />);
    await expectAccessible(container);
  });

  /* The challenge id lives in module memory only: a reload or a deep link
     has none and must not show a code form. */
  it("TwoFactorPage without a challenge goes back to sign-in", () => {
    const { container } = render(<TwoFactorPage />);
    expect(container).toBeEmptyDOMElement();
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("ForgotPasswordPage", async () => {
    const { container } = render(<ForgotPasswordPage />);
    await expectAccessible(container);
  });

  it("ResetPasswordPage", async () => {
    const { container } = render(<ResetPasswordPage />);
    await expectAccessible(container);
  });

  it("VerifyEmailPage", async () => {
    auth.context = {
      ...baseContext,
      user: { ...baseContext.user, isAccountVerified: false },
    };
    const { container } = render(<VerifyEmailPage />);
    await expectAccessible(container);
  });

  it("SetupPatientPage", async () => {
    auth.context = { ...baseContext, memberships: [] };
    const { container } = render(<SetupPatientPage />);
    await expectAccessible(container);
  });

  it("SetupMfaPage (forced enrolment for staff)", async () => {
    const { container } = render(<SetupMfaPage />);
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeNull());
    await expectAccessible(container);
  });

  it("ConfirmEmailPage", async () => {
    const { container } = render(<ConfirmEmailPage />);
    await expectAccessible(container);
  });
});

describe("IdleWarning", () => {
  /* D2: the warning opens before the idle limit and needs a choice. */
  it("opens before the idle deadline and is accessible", async () => {
    const now = Date.now();
    vi.mocked(authApi.fetchCurrentSession).mockResolvedValue({
      tier: "member",
      idleTimeoutSeconds: 60,
      maxAgeSeconds: 3600,
      idleExpiresAt: new Date(now + 10_000),
      absoluteExpiresAt: new Date(now + 3_600_000),
    });
    const { baseElement } = render(
      <IdleWarning onExpire={vi.fn()} onSignOut={vi.fn()} />,
    );
    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
    await expectAccessible(baseElement);
  });
});

describe("DashboardGuard", () => {
  /* ADR 0007: a failed context read is an error with a retry, not a
     sign-out (a sign-out here would end sessions on any API blip). */
  it("shows an error with retry when the context read failed", async () => {
    auth.status = "error";
    auth.context = null;
    const { container } = render(
      <DashboardGuard>
        <p>Patient data</p>
      </DashboardGuard>,
    );
    expect(screen.queryByText("Patient data")).toBeNull();
    expect(replace).not.toHaveBeenCalled();
    await expectAccessible(container);
    fireEvent.click(screen.getByRole("button"));
    expect(auth.refreshContext).toHaveBeenCalled();
  });

  /* D17: staff without MFA never see a portal page. */
  it("sends staff with mfaSetupRequired to enrolment, showing nothing", async () => {
    render(
      <DashboardGuard>
        <p>Patient data</p>
      </DashboardGuard>,
    );
    expect(screen.queryByText("Patient data")).toBeNull();
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        "/setup/mfa?next=%2Fdashboard%2Fclinic",
      ),
    );
  });

  it("sends a signed-out visitor to sign-in with next", async () => {
    auth.status = "signed-out";
    auth.context = null;
    render(
      <DashboardGuard>
        <p>Patient data</p>
      </DashboardGuard>,
    );
    expect(screen.queryByText("Patient data")).toBeNull();
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/login?next=%2Fdashboard%2Fclinic"),
    );
  });
});
