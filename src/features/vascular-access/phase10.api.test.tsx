import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import {
  isRetiredKey,
  purgeLegacyStorage,
  RETIRED_STORES,
  STORAGE_VERSION,
  STORAGE_VERSION_KEY,
} from "@/lib/data/legacyPurge";
import {
  apiError,
  JOHN_ID,
  pageOf,
  stubApi,
  type StubCall,
  type StubReply,
} from "@/features/profile/memberApiStub";
import { uploadFile } from "@/lib/api/upload";
import VascularAccess from "./VascularAccess";
import { AccessConversationView } from "./AccessUi";
import { toRecord } from "./access.mapper";
import type {
  ApiAccessConcern,
  ApiAccessMessage,
  ApiAccessProfile,
} from "./access.repository";

/* Phase 10, the member's side, against a stand-in API. Synthetic ids and
   names only (memberApiStub's John). */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/vascular-access",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

vi.mock("@/lib/api/upload", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/upload")>()),
  uploadFile: vi.fn(async () => "file-77"),
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

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(uploadFile).mockClear();
  /* jsdom has no object URLs: the photo preview is a local blob: URL. */
  Object.assign(URL, {
    createObjectURL: vi.fn(() => "blob:preview"),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

const BASE = `/patients/${JOHN_ID}/access-profiles`;

const profile = (over: Partial<ApiAccessProfile> = {}): ApiAccessProfile => ({
  id: "prof-metro",
  patientId: JOHN_ID,
  accessCenter: { id: "org-metro", name: "Metro Test Access Center" },
  dialysisCenter: { id: "org-river", name: "Riverside Test Dialysis" },
  type: "AV Fistula",
  location: "Left Forearm",
  createdOn: "2026-01-10",
  status: "No Active Concern",
  lastAssessmentOn: "2026-10-01",
  dialysisCanPost: false,
  party: "member",
  unread: 0,
  createdAt: "2026-01-10T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
  ...over,
});

const METRO = profile();
const LAKE = profile({
  id: "prof-lake",
  accessCenter: { id: "org-lake", name: "Lakeside Test Access Center" },
  type: "AV Graft",
});

const message = (over: Partial<ApiAccessMessage>): ApiAccessMessage => ({
  id: "m-1",
  profileId: METRO.id,
  party: "member",
  authorName: "John Test",
  mine: false,
  body: "Hello",
  hasImage: false,
  isPrivate: false,
  hidden: false,
  sentAt: "2026-11-01T10:00:00.000Z",
  ...over,
});

/** The member routes for the given profiles; `extra` answers first. */
function memberApi(
  profiles: ApiAccessProfile[],
  extra?: (c: StubCall) => StubReply | undefined,
) {
  return stubApi((call) => {
    const hit = extra?.(call);
    if (hit) return hit;
    if (call.path === BASE) return pageOf(profiles);
    const one = profiles.find((p) => call.path === `${BASE}/${p.id}`);
    if (one) return { data: one };
    if (call.path.startsWith(`${BASE}/`) && call.method === "GET")
      return pageOf([]);
    return undefined;
  });
}

describe("several access profiles", () => {
  it("2 profiles: the selector lists both access centers and switches record", async () => {
    const { calls } = memberApi([METRO, LAKE]);
    render(<VascularAccess />, { wrapper });
    const select = await screen.findByLabelText("Access center");
    const options = within(select).getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual([
      expect.stringContaining("Metro Test Access Center"),
      expect.stringContaining("Lakeside Test Access Center"),
    ]);
    fireEvent.change(select, { target: { value: LAKE.id } });
    await waitFor(() =>
      expect(
        calls.some((c) => c.path === `${BASE}/${LAKE.id}/appointments`),
      ).toBe(true),
    );
    /* No office header on the member's own routes. */
    expect(calls.every((c) => !("x-organization-id" in c.headers))).toBe(true);
  });

  it("one profile: no selector, the record as before", async () => {
    memberApi([METRO]);
    render(<VascularAccess />, { wrapper });
    expect(await screen.findByText("Left Forearm")).toBeTruthy();
    expect(screen.queryByLabelText("Access center")).toBeNull();
  });

  it("no profile: the empty state, not an error", async () => {
    memberApi([]);
    render(<VascularAccess />, { wrapper });
    expect(await screen.findByText("No access on file")).toBeTruthy();
  });

  it("a 403 is the not-shared state, with no retry and no record", async () => {
    stubApi((call) =>
      call.path === BASE ? apiError(403, "access.forbidden") : undefined,
    );
    render(<VascularAccess />, { wrapper });
    expect(
      await screen.findByText("This has not been shared with you"),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
    expect(screen.queryByText("No access on file")).toBeNull();
  });

  it("a failed part read is an error, never an empty record", async () => {
    memberApi([METRO], (call) =>
      call.path === `${BASE}/${METRO.id}/concerns`
        ? apiError(500, null)
        : undefined,
    );
    render(<VascularAccess />, { wrapper });
    expect(
      await screen.findByText("Your access could not be loaded"),
    ).toBeTruthy();
    expect(screen.queryByText("Left Forearm")).toBeNull();
  });
});

describe("a concern with a photo", () => {
  it("uploads the photo first, then sends only its file id (no data: URL)", async () => {
    const readAsDataURL = vi.spyOn(FileReader.prototype, "readAsDataURL");
    const created: ApiAccessConcern = {
      id: "c-new",
      profileId: METRO.id,
      kinds: ["swelling"],
      detail: "Arm is puffy",
      hasImage: true,
      sendTo: ["access"],
      status: "Open",
      reportedAt: "2026-11-08T10:00:00.000Z",
      editedAt: null,
      resentAt: null,
      reviewedAt: null,
    };
    const { calls } = memberApi([METRO], (call) =>
      call.method === "POST" && call.path === `${BASE}/${METRO.id}/concerns`
        ? { status: 201, data: created }
        : undefined,
    );
    render(<VascularAccess />, { wrapper });
    fireEvent.click(
      await screen.findByRole("button", { name: /report a concern/i }),
    );
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Swelling" }));
    fireEvent.change(within(dialog).getByLabelText(/details/i), {
      target: { value: "Arm is puffy" },
    });
    /* Send to the access center only. */
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Dialysis center" }),
    );
    const input = dialog.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const photo = new File([new Uint8Array([1, 2, 3])], "arm.png", {
      type: "image/png",
    });
    fireEvent.change(input, { target: { files: [photo] } });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Send Report" }),
    );
    /* The safety notice comes first (client, 2026-10-07). */
    const notice = await screen.findByRole("dialog", {
      name: /health & safety notice/i,
    });
    fireEvent.click(within(notice).getByRole("checkbox"));
    fireEvent.click(
      within(notice).getByRole("button", { name: "Submit Secure Message" }),
    );
    await waitFor(() =>
      expect(
        calls.some(
          (c) =>
            c.method === "POST" && c.path === `${BASE}/${METRO.id}/concerns`,
        ),
      ).toBe(true),
    );
    expect(uploadFile).toHaveBeenCalledTimes(1);
    const post = calls.find(
      (c) => c.method === "POST" && c.path === `${BASE}/${METRO.id}/concerns`,
    )!;
    expect(post.body).toEqual({
      kinds: ["swelling"],
      detail: "Arm is puffy",
      sendTo: ["access"],
      imageFileId: "file-77",
    });
    expect(JSON.stringify(post.body)).not.toContain("data:");
    expect(readAsDataURL).not.toHaveBeenCalled();
  });

  it("the dialysis option is not offered when the record names no dialysis center", async () => {
    memberApi([profile({ dialysisCenter: null })]);
    render(<VascularAccess />, { wrapper });
    fireEvent.click(
      await screen.findByRole("button", { name: /report a concern/i }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).queryByRole("button", { name: "Dialysis center" }),
    ).toBeNull();
    expect(
      within(dialog).getByRole("button", { name: "Vascular access center" }),
    ).toBeTruthy();
  });
});

describe("the three-way conversation", () => {
  const record = (party: string, messages: ApiAccessMessage[]) =>
    toRecord(profile({ party }), {
      memberName: "John Test",
      mrn: null,
      appointments: [],
      updates: [],
      history: [],
      concerns: [],
      transport: [],
      messages,
    });

  it("a hidden message is a placeholder: no body, no author, no image request", async () => {
    const { calls } = stubApi();
    const hidden = message({
      id: "m-hidden",
      party: "member",
      authorName: null,
      body: null,
      hasImage: false,
      isPrivate: true,
      hidden: true,
    });
    const shared = message({
      id: "m-shared",
      party: "access",
      authorName: "Pat Access",
      body: "See you Tuesday",
      sentAt: "2026-11-02T10:00:00.000Z",
    });
    const { container } = render(
      <AccessConversationView
        record={record("dialysis", [shared, hidden])}
        party="dialysis"
        target={{ kind: "office", organizationId: "org-river" }}
        myName="Riverside Test"
        onSend={vi.fn()}
        onSetPrivate={vi.fn()}
        onSetDialysisCanPost={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getByText(
        /Private message between the patient and the access center/,
      ),
    ).toBeTruthy();
    expect(screen.getByText("See you Tuesday")).toBeTruthy();
    /* The dialysis center cannot change privacy. */
    expect(screen.queryByRole("button", { name: /make private/i })).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(calls.some((c) => c.path.endsWith("/image"))).toBe(false);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("alignment follows the server's `mine`, never a name match", () => {
    stubApi();
    render(
      <AccessConversationView
        record={record("member", [
          message({
            id: "m-other",
            party: "access",
            authorName: "John Test",
            mine: false,
            body: "Same name, not mine",
          }),
          message({ id: "m-mine", mine: true, body: "Mine" }),
        ])}
        party="member"
        target={{ kind: "patient", patientId: JOHN_ID }}
        myName="John Test"
        onSend={vi.fn()}
        onSetPrivate={vi.fn()}
        onSetDialysisCanPost={vi.fn()}
      />,
      { wrapper },
    );
    const mine = screen.getByText("Mine").closest("li")!;
    const other = screen.getByText("Same name, not mine").closest("li")!;
    expect(mine.className).toContain("items-end");
    expect(other.className).toContain("items-start");
  });

  it("a message picture opens through the record link only", async () => {
    const { calls } = stubApi((call) =>
      call.path === `${BASE}/${METRO.id}/messages/m-pic/image`
        ? { data: { url: "https://files.example.test/x.jpg", expiresIn: 300 } }
        : undefined,
    );
    const { container } = render(
      <AccessConversationView
        record={record("member", [
          message({ id: "m-pic", hasImage: true, body: null, mine: true }),
        ])}
        party="member"
        target={{ kind: "patient", patientId: JOHN_ID }}
        myName="John Test"
        onSend={vi.fn()}
        onSetPrivate={vi.fn()}
        onSetDialysisCanPost={vi.fn()}
      />,
      { wrapper },
    );
    /* A camera icon stands in until the link arrives. */
    await waitFor(() =>
      expect(container.querySelector("img")?.getAttribute("src")).toBe(
        "https://files.example.test/x.jpg",
      ),
    );
    expect(container.querySelector("img")?.getAttribute("alt")).toBe(
      "Attached photo",
    );
    expect(
      calls.some((c) => c.path === `${BASE}/${METRO.id}/messages/m-pic/image`),
    ).toBe(true);
  });

  it("an unsafe link from the server is never used as an image source", async () => {
    stubApi((call) =>
      call.path.endsWith("/image")
        ? { data: { url: "javascript:alert(1)", expiresIn: 300 } }
        : undefined,
    );
    const { container } = render(
      <AccessConversationView
        record={record("member", [
          message({ id: "m-bad", hasImage: true, body: null }),
        ])}
        party="member"
        target={{ kind: "patient", patientId: JOHN_ID }}
        myName="John Test"
        onSend={vi.fn()}
        onSetPrivate={vi.fn()}
        onSetDialysisCanPost={vi.fn()}
      />,
      { wrapper },
    );
    await screen.findByRole("img", { name: "Attached photo" });
    expect(container.querySelector("img")).toBeNull();
  });
});

describe("Phase 10 retired store", () => {
  const LEGACY = JSON.stringify({
    version: 5,
    records: [
      {
        mrn: "999999",
        memberName: "Test Person",
        concerns: [
          {
            id: "legacy-c",
            imageUrl: "data:image/jpeg;base64,AAAA",
            detail: "Legacy concern",
          },
        ],
      },
    ],
    referrals: [],
  });

  it("nr:vascular-access is retired since storage version 11", () => {
    expect(STORAGE_VERSION).toBeGreaterThanOrEqual(11);
    const store = RETIRED_STORES.find((s) => s.name === "vascular-access");
    expect(store?.since).toBe(11);
    expect(isRetiredKey("nr:vascular-access")).toBe(true);
  });

  it("legacy data is purged and never restored: the page shows only the API", async () => {
    window.localStorage.setItem("nr:vascular-access", LEGACY);
    purgeLegacyStorage(window.localStorage);
    expect(window.localStorage.getItem("nr:vascular-access")).toBeNull();
    expect(window.localStorage.getItem(STORAGE_VERSION_KEY)).toBe(
      String(STORAGE_VERSION),
    );
    /* Put back by an old tab after the purge: still never read. */
    window.localStorage.setItem("nr:vascular-access", LEGACY);
    memberApi([]);
    const { container } = render(<VascularAccess />, { wrapper });
    expect(await screen.findByText("No access on file")).toBeTruthy();
    expect(screen.queryByText(/Test Person/)).toBeNull();
    expect(container.innerHTML).not.toContain("data:");
    /* The page itself never writes the old key again. */
    purgeLegacyStorage(window.localStorage);
    expect(window.localStorage.getItem("nr:vascular-access")).toBeNull();
  });
});
