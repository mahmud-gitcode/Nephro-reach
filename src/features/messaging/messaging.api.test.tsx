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
import type { MeContext } from "@/features/auth/auth.types";
import {
  JOHN_ID,
  apiError,
  memberContext,
  pageOf,
  stubApi,
  type StubCall,
  type StubReply,
} from "@/features/profile/memberApiStub";
import {
  purgeLegacyStorage,
  RETIRED_STORES,
  STORAGE_VERSION,
} from "@/lib/data/legacyPurge";
import * as storage from "@/lib/data/storage";
import ClinicMessages from "@/features/clinic/ClinicMessages";
import MemberMessages from "./MemberMessages";
import {
  fromApiMessage,
  fromMemberConversation,
  fromOfficeConversation,
  messageableOffices,
  organizationRole,
} from "./messaging.mappers";
import type { ApiMessage } from "./messaging.api";

/* Messaging on the API (Phase 11): the member's inbox and the office's.
   Synthetic ids and names only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/messages",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const ORG_A = "0aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const ORG_B = "0bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2";
const PATIENT = "33333333-3333-4333-8333-333333333333";

const message = (over: Partial<ApiMessage> = {}): ApiMessage => ({
  id: "m-1",
  conversationId: "c-a",
  side: "OFFICE",
  authorKind: "STAFF",
  authorId: "s-1",
  body: "Synthetic reply from the office",
  automated: false,
  sentAt: "2026-11-02T10:00:00.000Z",
  attachment: null,
  ...over,
});

const memberRow = (id: string, organizationId: string, name: string) => ({
  id,
  patientId: JOHN_ID,
  organizationId,
  organizationName: name,
  organizationType:
    organizationId === ORG_A ? "DIALYSIS_CENTER" : "NEPHROLOGY_OFFICE",
  category: "care-team",
  subject: null,
  unread: 1,
  archived: false,
  lastMessageAt: "2026-11-02T10:00:00.000Z",
  lastMessage: message({ conversationId: id, body: `Hello from ${name}` }),
  createdAt: "2026-11-01T10:00:00.000Z",
});

const officeRow = (over: Record<string, unknown> = {}) => ({
  id: "c-office",
  patientId: PATIENT,
  firstName: "Test",
  lastName: "Patient",
  mrn: "SYN-001",
  category: "care-team",
  subject: null,
  assignedToId: null,
  unread: 0,
  flagged: false,
  archived: false,
  lastReadAt: null,
  escalatedAt: null,
  lastMessageAt: "2026-11-02T10:00:00.000Z",
  lastMessage: message({ side: "MEMBER", body: "Synthetic patient question" }),
  createdAt: "2026-11-01T10:00:00.000Z",
  ...over,
});

function officeContext(organizationId = ORG_A): MeContext {
  return {
    ...memberContext(),
    patient: null,
    memberships: [
      {
        organizationId,
        organizationName: "Synthetic Dialysis Center A",
        organizationType: "DIALYSIS_CENTER",
        organizationStatus: "ACTIVE",
        role: "Owner",
        title: null,
        isOwner: true,
        permissions: { messages: 2 },
      } as MeContext["memberships"][number],
    ],
  };
}

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

/** Any list the screens read that a test does not care about is empty. */
function emptyListFor(call: StubCall): StubReply | undefined {
  if (call.method === "GET") return pageOf([]);
  return undefined;
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
  vi.spyOn(console, "error").mockImplementation(() => {});
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("messaging mappers", () => {
  it("maps the side to the author and keeps the automated flag", () => {
    expect(fromApiMessage(message({ side: "MEMBER" })).author).toBe("member");
    expect(fromApiMessage(message({ automated: true })).automated).toBe(true);
  });

  it("marks a caregiver's message as the caregiver's (D1)", () => {
    const m = fromApiMessage(
      message({ side: "MEMBER", authorKind: "CAREGIVER" }),
    );
    expect(m.byCaregiver).toBe(true);
  });

  it("carries an attachment as a file record, never a data: URL", () => {
    const m = fromApiMessage(
      message({
        attachment: {
          id: "f-1",
          name: "lab.pdf",
          contentType: "application/pdf",
          size: 2048,
        },
      }),
    );
    expect(m.attachment).toEqual({
      id: "f-1",
      name: "lab.pdf",
      sizeLabel: "2 KB",
      contentType: "application/pdf",
    });
    expect(JSON.stringify(m)).not.toMatch(/data:/);
  });

  it("names the office's role in English and Spanish", () => {
    expect(organizationRole("NEPHROLOGY_OFFICE")).toBe(
      "Your Nephrology Office",
    );
    expect(organizationRole("NEPHROLOGY_OFFICE", true)).toBe(
      "Tu consultorio de nefrología",
    );
    expect(organizationRole("UNKNOWN")).toBe("Your Care Team");
  });

  it("maps a member row to the office it is with, by id", () => {
    const row = fromMemberConversation(memberRow("c-a", ORG_A, "Office A"));
    expect(row.contact.name).toBe("Office A");
    expect(row.organizationId).toBe(ORG_A);
    expect(row.memberName).toBe("");
  });

  it("maps an office row to the patient's name and MRN", () => {
    const row = fromOfficeConversation(officeRow(), {
      name: "A",
      role: "",
      kind: "facility",
    });
    expect(row.memberName).toBe("Test Patient");
    expect(row.patient?.mrn).toBe("SYN-001");
    expect(row.patientId).toBe(PATIENT);
  });

  it("offers only ACTIVE offices, once each", () => {
    const offices = messageableOffices([
      {
        organizationId: ORG_A,
        organizationName: "A",
        organizationType: "DIALYSIS_CENTER",
        status: "ACTIVE",
      },
      {
        organizationId: ORG_A,
        organizationName: "A",
        organizationType: "DIALYSIS_CENTER",
        status: "ACTIVE",
      },
      {
        organizationId: ORG_B,
        organizationName: "B",
        organizationType: "NEPHROLOGY_OFFICE",
        status: "ENDED",
      },
    ]);
    expect(offices.map((o) => o.organizationId)).toEqual([ORG_A]);
  });
});

describe("the member's inbox", () => {
  it("lists the patient's threads with two offices by name, from the patient's path, with no office header", async () => {
    const { calls } = stubApi((call) => {
      if (call.path === `/patients/${JOHN_ID}/conversations`)
        return pageOf([
          memberRow("c-a", ORG_A, "Synthetic Dialysis Center A"),
          memberRow("c-b", ORG_B, "Synthetic Nephrology Office B"),
        ]);
      return emptyListFor(call);
    });
    const { container } = render(<MemberMessages />, { wrapper });
    expect(await screen.findByText("Synthetic Dialysis Center A")).toBeTruthy();
    expect(screen.getByText("Synthetic Nephrology Office B")).toBeTruthy();
    /* No seeded thread of the prototype appears. */
    expect(screen.queryByText(/Nurse Wilson|Riverside/)).toBeNull();
    const list = calls.find(
      (c) => c.path === `/patients/${JOHN_ID}/conversations`,
    )!;
    expect(list.headers["x-organization-id"]).toBeUndefined();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sends a reply as body and file id only, and shows the server's after-hours reply", async () => {
    const sent: StubCall[] = [];
    let replied = false;
    stubApi((call) => {
      const base = `/patients/${JOHN_ID}/conversations`;
      if (call.path === base)
        return pageOf([memberRow("c-a", ORG_A, "Synthetic Dialysis Center A")]);
      if (call.path === `${base}/c-a/messages` && call.method === "POST") {
        sent.push(call);
        replied = true;
        return {
          status: 201,
          data: {
            message: message({ id: "m-2", side: "MEMBER", body: "Hi" }),
            automatedReply: message({
              id: "m-3",
              automated: true,
              body: "Synthetic: the office is closed",
            }),
          },
        };
      }
      if (call.path === `${base}/c-a/messages`)
        return pageOf(
          replied
            ? [
                message({
                  id: "m-3",
                  automated: true,
                  body: "Synthetic: the office is closed",
                  sentAt: "2026-11-02T10:02:00.000Z",
                }),
                message({
                  id: "m-2",
                  side: "MEMBER",
                  body: "Hi",
                  sentAt: "2026-11-02T10:01:00.000Z",
                }),
                message(),
              ]
            : [message()],
        );
      return emptyListFor(call);
    });
    render(<MemberMessages />, { wrapper });
    fireEvent.click(await screen.findByText("Synthetic Dialysis Center A"));
    expect(
      await screen.findByText("Synthetic reply from the office"),
    ).toBeTruthy();
    const box = screen.getByLabelText(/Message Synthetic Dialysis Center A/);
    fireEvent.change(box, { target: { value: "Hi" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    /* The safety notice asks first. */
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("checkbox"));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Submit Secure Message" }),
    );
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0].body).toEqual({ body: "Hi" });
    expect(
      await screen.findByText("Synthetic: the office is closed"),
    ).toBeTruthy();
  });

  it("shows the not-shared state on a 403, never an empty inbox", async () => {
    stubApi((call) => {
      if (call.path === `/patients/${JOHN_ID}/conversations`)
        return apiError(403, "access.forbidden");
      return emptyListFor(call);
    });
    render(<MemberMessages />, { wrapper });
    expect(
      await screen.findByText("This has not been shared with you"),
    ).toBeTruthy();
    expect(screen.queryByText("No messages yet")).toBeNull();
    expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
  });

  it("shows an error, not an empty inbox, when the read fails", async () => {
    stubApi((call) => {
      if (call.path === `/patients/${JOHN_ID}/conversations`)
        return apiError(500, null);
      return emptyListFor(call);
    });
    render(<MemberMessages />, { wrapper });
    expect(await screen.findByText("Your messages did not load")).toBeTruthy();
    expect(screen.queryByText(/No messages yet/)).toBeNull();
  });
});

describe("the office's inbox", () => {
  it("reads its own inbox under the office header and filters on the server", async () => {
    const { calls } = stubApi((call) => {
      if (call.path === `/organizations/${ORG_A}/conversations`)
        return pageOf([officeRow()]);
      return emptyListFor(call);
    }, officeContext());
    const { container } = render(<ClinicMessages showRides={false} />, {
      wrapper,
    });
    expect(await screen.findByText("Test Patient")).toBeTruthy();
    const read = calls.find(
      (c) => c.path === `/organizations/${ORG_A}/conversations`,
    )!;
    expect(read.headers["x-organization-id"]).toBe(ORG_A);
    expect(read.query.get("inbox")).toBe("all");
    fireEvent.click(screen.getByRole("button", { name: /^Flagged/ }));
    await waitFor(() =>
      expect(
        calls.some(
          (c) =>
            c.path === `/organizations/${ORG_A}/conversations` &&
            c.query.get("inbox") === "flagged" &&
            c.query.get("limit") !== "1",
        ),
      ).toBe(true),
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("flags a thread with the explicit value, never a toggle", async () => {
    const patched: StubCall[] = [];
    stubApi((call) => {
      const base = `/organizations/${ORG_A}/conversations`;
      if (call.path === base) return pageOf([officeRow()]);
      if (call.path === `${base}/c-office` && call.method === "PATCH") {
        patched.push(call);
        return { data: officeRow({ flagged: true }) };
      }
      if (call.path.endsWith("/clinic-note")) return { data: null };
      return emptyListFor(call);
    }, officeContext());
    render(<ClinicMessages showRides={false} />, { wrapper });
    fireEvent.click(await screen.findByText("Test Patient"));
    fireEvent.click(
      await screen.findByRole("button", { name: /Flag Conversation/ }),
    );
    await waitFor(() => expect(patched).toHaveLength(1));
    expect(patched[0].body).toEqual({ flagged: true });
  });

  it("opens New Message for ?patient=<id> and ignores an MRN in the URL", async () => {
    window.history.replaceState(
      null,
      "",
      `/dashboard/clinic/messages?patient=${PATIENT}&to=SYN-001`,
    );
    const { calls } = stubApi((call) => {
      if (call.path === `/organizations/${ORG_A}/conversations`)
        return pageOf([]);
      if (call.path === `/organizations/${ORG_A}/patients`)
        return pageOf([
          {
            patientId: PATIENT,
            firstName: "Test",
            lastName: "Patient",
            dateOfBirth: null,
            mrn: "SYN-001",
            status: "ACTIVE",
            startedOn: "2026-01-01",
          },
        ]);
      return emptyListFor(call);
    }, officeContext());
    render(<ClinicMessages showRides={false} />, { wrapper });
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("New Message")).toBeTruthy();
    expect(
      calls.some(
        (c) =>
          c.path === `/organizations/${ORG_A}/conversations` &&
          c.query.get("patientId") === PATIENT,
      ),
    ).toBe(true);
    expect(calls.some((c) => c.query.toString().includes("SYN-001"))).toBe(
      false,
    );
  });

  it("refuses a patient link that is not a server id", async () => {
    window.history.replaceState(
      null,
      "",
      "/dashboard/clinic/messages?patient=SYN-001",
    );
    const { calls } = stubApi(emptyListFor, officeContext());
    render(<ClinicMessages showRides={false} />, { wrapper });
    await screen.findByText("No conversations yet");
    expect(calls.some((c) => c.query.has("patientId"))).toBe(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows an error, not an empty inbox, when the read fails", async () => {
    stubApi((call) => {
      if (call.path === `/organizations/${ORG_A}/conversations`)
        return apiError(500, null);
      return emptyListFor(call);
    }, officeContext());
    render(<ClinicMessages showRides={false} />, { wrapper });
    expect(await screen.findByText("Your inbox did not load")).toBeTruthy();
    expect(screen.queryByText("No conversations yet")).toBeNull();
  });
});

describe("the prototype's message store (retired)", () => {
  it("is in the purge registry and is removed", () => {
    expect(RETIRED_STORES.find((s) => s.name === "messaging")?.since).toBe(12);
    expect(STORAGE_VERSION).toBeGreaterThanOrEqual(12);
    window.localStorage.setItem(
      "nr:messaging",
      JSON.stringify({
        version: 4,
        data: {
          conversations: [{ id: "legacy", memberName: "Legacy Name" }],
        },
      }),
    );
    purgeLegacyStorage();
    expect(window.localStorage.getItem("nr:messaging")).toBeNull();
  });

  it("cannot be restored: the inbox never reads it and shows the server's threads", async () => {
    window.localStorage.setItem(
      "nr:messaging",
      JSON.stringify({
        version: 4,
        data: {
          conversations: [
            {
              id: "legacy-thread",
              memberName: "John Test",
              contact: {
                name: "Legacy Seeded Office",
                role: "x",
                kind: "facility",
              },
              category: "care-team",
              unread: 3,
              flagged: false,
              archived: false,
              messages: [],
            },
          ],
        },
      }),
    );
    const read = vi.spyOn(storage, "readJson");
    stubApi((call) => {
      if (call.path === `/patients/${JOHN_ID}/conversations`)
        return pageOf([memberRow("c-a", ORG_A, "Synthetic Dialysis Center A")]);
      return emptyListFor(call);
    });
    render(<MemberMessages />, { wrapper });
    expect(await screen.findByText("Synthetic Dialysis Center A")).toBeTruthy();
    expect(screen.queryByText("Legacy Seeded Office")).toBeNull();
    expect(
      read.mock.calls.some(([key]) => String(key).includes("messaging")),
    ).toBe(false);
  });
});
