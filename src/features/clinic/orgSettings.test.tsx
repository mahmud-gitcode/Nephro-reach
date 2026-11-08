import React from "react";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import type { MeContext } from "@/features/auth/auth.types";
import {
  isRetiredKey,
  purgeLegacyStorage,
  STORAGE_VERSION,
} from "@/lib/data/legacyPurge";
import {
  apiError,
  memberContext,
  pageOf,
  stubApi,
  type StubCall,
  type StubHandler,
} from "@/features/profile/memberApiStub";
import ClinicSettings from "./ClinicSettings";
import {
  displayPhone,
  profilePatch,
  timeZoneLabel,
  TIME_ZONES,
  toE164,
  toSettings,
  validateProfile,
} from "./settings.data";
import { exportDocument } from "./settings.actions";

/* Phase 14 office settings against a stand-in API. Synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/clinic/settings",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const ORG = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const CONTEXT = {
  ...memberContext(),
  patient: null,
  memberships: [
    {
      organizationId: ORG,
      organizationName: "Synthetic Dialysis Center",
      organizationType: "DIALYSIS_CENTER",
      organizationStatus: "ACTIVE",
      role: "Office Manager",
      title: null,
      isOwner: false,
      permissions: { settings: 2, staff: 1 },
    },
  ],
} as MeContext;

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <AuthProvider>{children}</AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

class NoResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("ResizeObserver", NoResizeObserver);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

const org = (rest: string) => `/organizations/${ORG}${rest}`;

const PROFILE = {
  id: ORG,
  name: "Synthetic Dialysis Center",
  type: "DIALYSIS_CENTER",
  status: "ACTIVE",
  phone: "(803) 555-0187",
  email: "office@example.test",
  address: "1 Synthetic Way",
  timeZone: "America/New_York",
};

const SETTINGS = {
  opensAt: "08:00",
  closesAt: "17:00",
  closedWeekdays: ["sun"],
  onCallPhone: null,
  escalateAfterMinutes: 120,
  notifications: {
    enrollments: true,
    checkIns: true,
    liveClass: true,
    billing: true,
    announcements: true,
    support: true,
    weeklySummary: true,
    sms: false,
  },
  shareUsageAnalytics: false,
  shareOutcomes: false,
  shareResearch: false,
  landingPage: "/dashboard/clinic",
  itemsPerPage: 10,
  dateFormat: "MM/DD/YYYY",
};

function settingsApi(over: StubHandler = () => undefined) {
  let settings = { ...SETTINGS };
  let profile = { ...PROFILE };
  return stubApi((c: StubCall) => {
    const o = over(c);
    if (o) return o;
    if (c.path === org("") && c.method === "GET") return { data: profile };
    if (c.path === org("") && c.method === "PATCH") {
      profile = { ...profile, ...(c.body as object) };
      return { data: profile };
    }
    if (c.path === org("/settings") && c.method === "GET")
      return { data: settings };
    if (c.path === org("/settings") && c.method === "PATCH") {
      const body = c.body as Record<string, unknown>;
      settings = {
        ...settings,
        ...body,
        notifications: {
          ...settings.notifications,
          ...((body.notifications as object) ?? {}),
        },
      };
      return { data: settings };
    }
    if (c.path === org("/staff")) return pageOf([]);
    return undefined;
  }, CONTEXT);
}

describe("settings mapping", () => {
  it("time zone label <-> IANA; an unknown IANA id shows itself", () => {
    expect(timeZoneLabel("America/New_York")).toBe(
      "(GMT-05:00) Eastern Time (ET)",
    );
    expect(timeZoneLabel("Pacific/Honolulu")).toBe(
      "(GMT-10:00) Hawaii Time (HT)",
    );
    expect(timeZoneLabel("Europe/Lisbon")).toBe("Europe/Lisbon");
    expect(TIME_ZONES).toHaveLength(6);
  });

  it("on-call phone to E.164; blank clears; junk is refused", () => {
    expect(toE164("(702) 555-0122")).toBe("+17025550122");
    expect(toE164("1-702-555-0122")).toBe("+17025550122");
    expect(toE164("+44 20 7946 0000")).toBe("+442079460000");
    expect(toE164("  ")).toBeNull();
    expect(toE164("555")).toBeUndefined();
    expect(displayPhone("+17025550122")).toBe("(702) 555-0122");
  });

  it("a profile patch has only the changed fields; '' clears to null", () => {
    const saved = {
      name: "X",
      address: "1 Way",
      phone: "(803) 555-0187",
      email: "a@example.test",
      timeZone: "America/New_York",
    };
    expect(profilePatch(saved, saved)).toEqual({});
    expect(profilePatch(saved, { ...saved, address: "" })).toEqual({
      address: null,
    });
    expect(
      profilePatch(saved, { ...saved, timeZone: "America/Chicago" }),
    ).toEqual({ timeZone: "America/Chicago" });
    expect(profilePatch(saved, { ...saved, name: "Y" })).toEqual({});
    expect(validateProfile({ ...saved, phone: "abc" }).phone).toBeTruthy();
    expect(validateProfile({ ...saved, email: "" }).email).toBeTruthy();
  });

  it("sharing fields are renamed; the export holds no patient data", () => {
    const s = toSettings(
      {
        name: "X",
        address: "",
        phone: "",
        email: "a@example.test",
        timeZone: "America/New_York",
      },
      { ...SETTINGS, shareOutcomes: true },
    );
    expect(s.sharing).toEqual({
      analytics: false,
      outcomes: true,
      research: false,
    });
    const file = JSON.parse(
      exportDocument(s, new Date("2026-11-08T00:00:00Z"), [
        {
          name: "Staff A",
          email: "a@example.test",
          role: "Nurse",
          status: "Active",
        },
      ]),
    );
    expect(Object.keys(file)).toEqual([
      "exportedAt",
      "source",
      "profile",
      "notifications",
      "office",
      "sharing",
      "staff",
    ]);
  });
});

describe("office settings page", () => {
  it("reads from the API; name read-only; logo and password not available; axe", async () => {
    settingsApi();
    const { container } = render(<ClinicSettings />, { wrapper });
    expect(
      await screen.findByDisplayValue("Synthetic Dialysis Center"),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /Change Logo/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Change" })).toBeDisabled();
    expect(
      screen.getByRole("link", { name: /^(Manage|Enable)$/ }),
    ).toHaveAttribute(
      "href",
      "/setup/mfa?next=%2Fdashboard%2Fclinic%2Fsettings",
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("a switch sends only its own toggle", async () => {
    const { calls } = settingsApi();
    render(<ClinicSettings />, { wrapper });
    const label = await screen.findByText("SMS notifications");
    const row = label.closest("li")!;
    await userEvent.click(row.querySelector("[role=switch]")!);
    await waitFor(() =>
      expect(
        calls.find((c) => c.method === "PATCH" && c.path === org("/settings"))
          ?.body,
      ).toEqual({ notifications: { sms: true } }),
    );
    const patch = calls.find((c) => c.method === "PATCH")!;
    expect(patch.headers["x-organization-id"]).toBe(ORG);
  });

  it("the profile saves only the changed field; the time zone goes as IANA", async () => {
    const { calls } = settingsApi();
    render(<ClinicSettings />, { wrapper });
    await screen.findByDisplayValue("1 Synthetic Way");
    await userEvent.selectOptions(
      screen.getByLabelText("Time Zone"),
      "America/Chicago",
    );
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() =>
      expect(
        calls.find((c) => c.method === "PATCH" && c.path === org(""))?.body,
      ).toEqual({ timeZone: "America/Chicago" }),
    );
    expect(await screen.findByText("Changes saved.")).toBeInTheDocument();
  });

  it("the on-call phone is sent in E.164 when the field is left", async () => {
    const { calls } = settingsApi();
    render(<ClinicSettings />, { wrapper });
    const input = await screen.findByLabelText("On-Call Nurse Manager Phone");
    await userEvent.type(input, "(702) 555-0122");
    await userEvent.tab();
    await waitFor(() =>
      expect(
        calls.find((c) => c.method === "PATCH" && c.path === org("/settings"))
          ?.body,
      ).toEqual({ onCallPhone: "+17025550122" }),
    );
  });

  it("a 403 is the no-access state, never default settings", async () => {
    settingsApi((c) =>
      c.path === org("/settings")
        ? apiError(403, "access.permission_denied")
        : undefined,
    );
    render(<ClinicSettings />, { wrapper });
    expect(
      await screen.findByText("This has not been shared with you"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Notification Preferences")).toBeNull();
  });
});

describe("retired settings storage", () => {
  it("every settings key, the dynamic ones included, is purged and unread", () => {
    expect(STORAGE_VERSION).toBeGreaterThanOrEqual(14);
    const keys = [
      "nr:clinic-settings",
      "nr:clinic-settings-actions",
      "nr:org-settings-org-nephrology",
      "nr:org-settings-actions-org-nephrology",
      "nr:org-settings-3b1c4a2e-0000-4000-8000-000000000000",
    ];
    for (const key of keys) {
      expect(isRetiredKey(key)).toBe(true);
      window.localStorage.setItem(
        key,
        JSON.stringify({ profile: { name: "Old" }, security: {} }),
      );
    }
    window.localStorage.setItem("preferred_language", "EN");
    purgeLegacyStorage(window.localStorage);
    for (const key of keys) expect(window.localStorage.getItem(key)).toBeNull();
    expect(window.localStorage.getItem("preferred_language")).toBe("EN");
    for (const file of [
      "src/features/clinic/ClinicSettings.tsx",
      "src/features/clinic/SettingsModals.tsx",
      "src/features/clinic/settings.data.ts",
      "src/features/clinic/settings.actions.ts",
      "src/features/clinic/useClinicSettings.ts",
      "src/features/clinic/orgSettings.repository.ts",
    ]) {
      const text = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      expect(text, file).not.toMatch(
        /readJson|writeJson|storageKey|localStorage|sessionsFor|loginActivity/,
      );
    }
    expect(
      fs.existsSync(
        path.join(process.cwd(), "src/features/clinic/useSettingsActions.ts"),
      ),
    ).toBe(false);
  });
});
