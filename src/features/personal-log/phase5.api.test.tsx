import React from "react";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import {
  isRetiredKey,
  purgeLegacyStorage,
  RETIRED_STORES,
} from "@/lib/data/legacyPurge";
import {
  apiError,
  JOHN_ID,
  pageOf,
  stubApi,
} from "@/features/profile/memberApiStub";
import { uploadFile } from "@/lib/api/upload";
import { useCheckIns } from "./check-in/useCheckIns";
import { useBloodPressure } from "./blood-pressure/useBloodPressure";
import { useNutritionLog } from "./nutrition/useNutritionLog";
import { useWeightLog } from "./fluid/useWeightLog";
import { BpPhotoButton } from "./blood-pressure/BpPhotoButton";

/* Phase 5 against a stand-in API. Synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

vi.mock("@/lib/api/upload", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/upload")>()),
  uploadFile: vi.fn(async () => "file-9"),
}));

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

const checkIn = {
  id: "c1",
  patientId: JOHN_ID,
  checkInDate: "2026-10-30",
  treatmentDay: false,
  feeling: "okay",
  recoveryWindow: null,
  backToNormalAt: null,
  energyLevel: null,
  resumedActivities: null,
  symptoms: [],
  severity: "mild",
  bloodPressure: null,
  weight: null,
  urineOutputMl: null,
  appetite: null,
  missedTreatment: false,
  notes: "",
  clinicNotice: null,
  createdAt: "2026-10-30T10:00:00.000Z",
  updatedAt: "2026-10-30T10:00:00.000Z",
};

describe("check-ins on the API", () => {
  /* Another device wrote the day after this tab loaded: the POST is 409
     `check_ins.check_in_exists`; the day is re-read and saved as a PUT,
     once, so the member never meets the 409. */
  it("recovers from 409 on an existing day with one PUT", async () => {
    const { calls } = stubApi((call) => {
      if (call.path.endsWith("/check-ins") && call.method === "POST")
        return apiError(409, "check_ins.check_in_exists");
      if (call.path.endsWith("/check-ins") && call.method === "GET")
        return call.query.get("from") === "2026-10-30" &&
          call.query.get("to") === "2026-10-30"
          ? pageOf([checkIn])
          : pageOf([]);
      if (call.method === "PUT") return { data: checkIn };
      return undefined;
    });
    const { result } = renderHook(() => useCheckIns(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    let saved = false;
    await act(async () => {
      result.current.saveCheckIn(
        {
          date: "2026-10-30",
          treatmentDay: false,
          feeling: "okay",
          symptoms: [],
          severity: "mild",
          missedTreatment: false,
          notes: "",
          savedAt: "",
        },
        false,
        () => (saved = true),
      );
    });
    await waitFor(() => expect(saved).toBe(true));
    const writes = calls.filter((c) => c.method !== "GET");
    expect(writes.map((c) => `${c.method} ${c.path}`)).toEqual([
      `POST /patients/${JOHN_ID}/check-ins`,
      `PUT /patients/${JOHN_ID}/check-ins/c1`,
    ]);
    expect(result.current.saveError).toBeNull();
  });

  it("re-saving a day already loaded is a PUT by id, never a POST", async () => {
    const { calls } = stubApi((call) =>
      call.path.endsWith("/check-ins")
        ? pageOf([checkIn])
        : call.method === "PUT"
          ? { data: checkIn }
          : undefined,
    );
    const { result } = renderHook(() => useCheckIns(), { wrapper });
    await waitFor(() => expect(result.current.entries).toHaveLength(1));
    await act(async () => {
      result.current.saveCheckIn(result.current.entries[0], true);
    });
    await waitFor(() =>
      expect(calls.some((c) => c.method === "PUT")).toBe(true),
    );
    expect(calls.some((c) => c.method === "POST")).toBe(false);
    expect(calls.find((c) => c.method === "PUT")?.body).toMatchObject({
      notifyClinic: true,
    });
  });

  it("deleting a day with a delivered notice hands back the server's sentence", async () => {
    const kept =
      "Check-in deleted. Your clinic keeps the notice it already received.";
    stubApi((call) => {
      if (call.method === "DELETE")
        return {
          body: { success: true, message: kept, statusCode: 200, data: null },
        };
      return call.path.endsWith("/check-ins") ? pageOf([checkIn]) : undefined;
    });
    const { result } = renderHook(() => useCheckIns(), { wrapper });
    await waitFor(() => expect(result.current.entries).toHaveLength(1));
    let message = "";
    await act(async () => {
      result.current.deleteCheckIn("2026-10-30", (m) => (message = m));
    });
    await waitFor(() => expect(message).toBe(kept));
  });
});

describe("blood pressure on the API", () => {
  it("uploads a photo through /files first and sends only its id", async () => {
    const { calls } = stubApi((call) => {
      if (call.method === "POST") return { status: 201, data: { id: "r1" } };
      if (call.path.endsWith("/summary"))
        return {
          data: {
            from: "x",
            to: "y",
            readingCount: 0,
            latest: null,
            averages: { systolic: null, diastolic: null, pulse: null },
            categories: [],
            trend: [],
          },
        };
      return call.path.includes("/blood-pressure") ? pageOf([]) : undefined;
    });
    const { result } = renderHook(() => useBloodPressure(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    const photo = new File(["x"], "cuff.jpg", { type: "image/jpeg" });
    await act(async () => {
      await result.current.add(
        {
          date: "2026-10-30",
          time: "08:15",
          systolic: 130,
          diastolic: 80,
          pulse: 70,
          position: "Sitting",
          symptoms: "None",
          medication: "Taken",
          notes: "",
        },
        photo,
      );
    });
    expect(vi.mocked(uploadFile)).toHaveBeenCalledWith(photo);
    const post = calls.find((c) => c.method === "POST");
    expect(post?.path).toBe(`/patients/${JOHN_ID}/blood-pressure`);
    expect(post?.body).toMatchObject({ photoFileId: "file-9" });
    expect(JSON.stringify(post?.body)).not.toContain("data:");
  });

  /* The chart and averages come from /summary over the 90-day window,
     never from paging through raw rows (default limit 10). */
  it("reads the chart from /summary over 90 days and lists a full page", async () => {
    const { calls } = stubApi((call) =>
      call.path.endsWith("/summary")
        ? { data: { trend: [], categories: [], averages: {} } }
        : call.path.includes("/blood-pressure")
          ? pageOf([])
          : undefined,
    );
    const { result } = renderHook(() => useBloodPressure(), { wrapper });
    await waitFor(() => expect(result.current.summaryPending).toBe(false));
    const summary = calls.find((c) => c.path.endsWith("/summary"));
    const from = new Date(`${summary?.query.get("from")}T00:00:00`);
    const to = new Date(`${summary?.query.get("to")}T00:00:00`);
    expect(Math.round((+to - +from) / 86_400_000) + 1).toBeGreaterThanOrEqual(
      90,
    );
    const list = calls.find(
      (c) => c.path.endsWith("/blood-pressure") && c.method === "GET",
    );
    expect(list?.query.get("limit")).toBe("150");
  });

  it("never shows a legacy reading or its data: photo", async () => {
    window.localStorage.setItem(
      "nr:blood-pressure-readings",
      JSON.stringify([
        {
          id: "legacy",
          date: "2026-10-01",
          time: "08:00",
          systolic: 199,
          diastolic: 99,
          pulse: 70,
          position: "Sitting",
          symptoms: "None",
          medication: "Taken",
          notes: "legacy",
          photo: "data:image/png;base64,AAAA",
        },
      ]),
    );
    stubApi((call) =>
      call.path.includes("/patients/") && !call.path.endsWith("/summary")
        ? pageOf([])
        : undefined,
    );
    const { default: Page } =
      await import("@/app/(portal)/dashboard/(member)/personal-log/blood-pressure/page");
    const { container } = render(<Page />, { wrapper });
    expect(await screen.findByText("No readings yet")).toBeInTheDocument();
    expect(screen.queryByText("199")).not.toBeInTheDocument();
    expect(container.querySelector('img[src^="data:"]')).toBeNull();
  });

  it("the photo button opens the photo through the reading's link (axe)", async () => {
    const load = vi.fn(async () => ({
      url: "http://127.0.0.1:5906/bucket/key?sig=1",
    }));
    const { container } = render(
      <LanguageProvider>
        <BpPhotoButton
          isEs={false}
          label="Photo with the 08:15 reading"
          load={load}
        />
      </LanguageProvider>,
    );
    expect(await axe(container)).toHaveNoViolations();
    screen
      .getByRole("button", { name: "Photo with the 08:15 reading" })
      .click();
    expect(
      await screen.findByRole("img", { name: "Photo with the 08:15 reading" }),
    ).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(1);
  });
});

describe("nutrition on the API", () => {
  /* Two taps of "+8 oz" are two POSTs in ounces; the server adds them and
     its amountMl is the one conversion. */
  it("adds fluid in the unit tapped, once per tap", async () => {
    const { calls } = stubApi((call) =>
      call.method === "POST"
        ? { status: 201, data: { amountMl: 237, amount: 8, unit: "oz" } }
        : call.path.endsWith("/foods")
          ? pageOf([])
          : undefined,
    );
    const { result } = renderHook(() => useNutritionLog("2026-10-30"), {
      wrapper,
    });
    /* The session loads first: no write can go out without a patient. */
    await waitFor(() => expect(result.current.isPending).toBe(false));
    await act(async () => {
      result.current.addWater(8, "oz");
      result.current.addWater(8, "oz");
    });
    await waitFor(() =>
      expect(calls.filter((c) => c.method === "POST")).toHaveLength(2),
    );
    for (const post of calls.filter((c) => c.method === "POST"))
      expect(post.body).toEqual({
        entryDate: "2026-10-30",
        amount: 8,
        unit: "oz",
      });
  });

  it("a failed goals read is an error, never default goals", async () => {
    stubApi((call) =>
      call.path.endsWith("/goals")
        ? { status: 500 }
        : call.path.endsWith("/foods")
          ? pageOf([])
          : undefined,
    );
    const { result } = renderHook(() => useNutritionLog("2026-10-30"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.goals.sodium).toBe(0);
    expect(result.current.goalsAreDefault).toBe(false);
  });
});

describe("weight and fluid on the API", () => {
  it("saves a day with PUT by its date, so a second save updates it", async () => {
    const { calls } = stubApi((call) =>
      call.method === "PUT"
        ? { data: {} }
        : call.path.includes("/weight-fluid")
          ? pageOf([])
          : undefined,
    );
    const { result } = renderHook(() => useWeightLog(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    const entry = {
      id: "",
      date: "2026-10-30",
      dateEn: "",
      dateEs: "",
      morning: "160",
      evening: "--",
      uo: "",
      intake: "40",
      goal: "Goal Met",
      swelling: "NO",
      sob: "NO",
      weakness: "NO",
      notes: "--",
      noteKey: null,
    };
    await act(async () => {
      result.current.save(entry, "lbs");
    });
    await act(async () => {
      result.current.save({ ...entry, morning: "161" }, "lbs");
    });
    await waitFor(() =>
      expect(calls.filter((c) => c.method === "PUT")).toHaveLength(2),
    );
    for (const put of calls.filter((c) => c.method === "PUT"))
      expect(put.path).toBe(`/patients/${JOHN_ID}/weight-fluid/2026-10-30`);
    expect(calls.some((c) => c.method === "POST")).toBe(false);
  });
});

const PHASE_5_RETIRED = [
  "exercise-log",
  "care-team-questions",
  "er-visits",
  "blood-pressure-readings",
  "bp-reminders",
  "nutrition-foods",
  "nutrition-fluids",
  "nutrition-goals",
  "weight-fluid-log",
  "between-treatment-check-ins",
  "clinic-notices",
];

const PHASE_5_DATA_FILES = [
  "src/features/personal-log/exercise/exercise.repository.ts",
  "src/features/personal-log/exercise/useExerciseLog.ts",
  "src/features/care-team/questions.repository.ts",
  "src/features/care-team/useCareTeamQuestions.ts",
  "src/features/emergency/useErVisits.ts",
  "src/features/personal-log/blood-pressure/bloodPressure.repository.ts",
  "src/features/personal-log/blood-pressure/useBloodPressure.ts",
  "src/features/personal-log/blood-pressure/useBpReminders.ts",
  "src/features/personal-log/nutrition/nutrition.repository.ts",
  "src/features/personal-log/nutrition/useNutritionLog.ts",
  "src/features/personal-log/fluid/useWeightLog.ts",
  "src/features/personal-log/check-in/checkIn.repository.ts",
  "src/features/personal-log/check-in/useCheckIns.ts",
  "src/features/personal-log/check-in/useClinicNotices.ts",
];

describe("Phase 5 retired stores", () => {
  it.each(PHASE_5_RETIRED)(
    "%s is purged in every variant and cannot come back",
    (name) => {
      expect(RETIRED_STORES.some((store) => store.name === name)).toBe(true);
      const keys = [
        `nr:${name}`,
        `nr:member:someone@example.test:${name}`,
        `nr:caregiver-none:${name}`,
      ];
      for (const key of keys) {
        expect(isRetiredKey(key)).toBe(true);
        window.localStorage.setItem(key, "[]");
      }
      purgeLegacyStorage(window.localStorage);
      for (const key of keys)
        expect(window.localStorage.getItem(key)).toBeNull();
    },
  );

  it.each(PHASE_5_DATA_FILES)("%s does not touch browser storage", (file) => {
    const text = fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
    expect(text).not.toMatch(/@\/lib\/data\/storage/);
    expect(text).not.toMatch(/localStorage|sessionStorage/);
  });
});
