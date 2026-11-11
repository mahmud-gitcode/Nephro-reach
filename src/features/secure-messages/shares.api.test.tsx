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
import { purgeLegacyStorage, RETIRED_STORES } from "@/lib/data/legacyPurge";
import SecureSharePage from "./SecureSharePage";
import { OfficeShareOutside, ShareOutsideCard } from "./ShareOutsideCard";
import { attachmentFile, isShareToken } from "./shares";

/* Outside shares on the API (Phase 11): the sender's card and the
   recipient's /secure/<token> page. Synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/messages",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const TOKEN = "A".repeat(40) + "b_-";
const SESSION = "synthetic-share-session-value";
const ORG = "0aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";

const teaser = {
  kind: "document",
  sharedByName: "John",
  fromOrganization: false,
  subject: "My synthetic labs",
  sharedAt: "2026-11-02T10:00:00.000Z",
  expiresAt: null,
};

const content = (over: Record<string, unknown> = {}) => ({
  ...teaser,
  body: "Synthetic body text",
  recipientOrg: "Synthetic Clinic",
  attachment: null,
  replies: [],
  maxReplies: 2,
  repliesLeft: 2,
  verifiedName: "Test Recipient",
  verifiedOrg: null,
  ...over,
});

const share = (over: Record<string, unknown> = {}) => ({
  id: "s-1",
  kind: "message",
  patientId: JOHN_ID,
  recipientEmail: "outside@example.test",
  recipientOrg: "Synthetic Outside Office",
  subject: "Synthetic share",
  body: "Hello",
  attachment: null,
  maxReplies: 2,
  expiresAt: null,
  sharedAt: "2026-11-02T10:00:00.000Z",
  sharedById: "u-1",
  verifiedName: null,
  verifiedOrg: null,
  verifiedAt: null,
  revokedAt: null,
  revokedById: null,
  status: "sent",
  events: [
    { id: "e-1", event: "shared", by: "John", at: "2026-11-02T10:00:00.000Z" },
  ],
  replies: [],
  ...over,
});

function officeContext(): MeContext {
  return {
    ...memberContext(),
    patient: null,
    memberships: [
      {
        organizationId: ORG,
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

const quiet = (call: StubCall): StubReply | undefined =>
  call.method === "GET" ? pageOf([]) : undefined;

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("share helpers", () => {
  it("accepts only the server's token shape", () => {
    expect(isShareToken(TOKEN)).toBe(true);
    expect(isShareToken("abc")).toBe(false);
    expect(isShareToken(`${TOKEN}x`)).toBe(false);
    expect(isShareToken("../../me/context-and-some-more-padding-xx")).toBe(
      false,
    );
  });

  it("turns another page's in-memory data: URL into a File to upload", async () => {
    const file = attachmentFile({
      name: "log.csv",
      type: "text/csv",
      dataUrl: "data:text/csv;charset=utf-8,a%2Cb%0A1%2C2",
    });
    expect(file.name).toBe("log.csv");
    expect(file.type).toBe("text/csv");
    expect(await file.text()).toBe("a,b\n1,2");
    const b64 = attachmentFile({
      name: "x.txt",
      type: "text/plain",
      dataUrl: "data:text/plain;base64,aGk=",
    });
    expect(await b64.text()).toBe("hi");
  });
});

/** Walks the recipient through code and verification. */
async function verify() {
  fireEvent.click(
    await screen.findByRole("button", { name: "Email me a code" }),
  );
  await screen.findByText(/We sent a code to/);
  fireEvent.change(screen.getByLabelText(/Your full name/), {
    target: { value: "Test Recipient" },
  });
  fireEvent.change(screen.getByLabelText(/Code from the email/), {
    target: { value: "123456" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Verify and view" }));
}

describe("the recipient's /secure/<token> page", () => {
  it("refuses a malformed token without calling the server", async () => {
    const { calls } = stubApi(quiet, null);
    render(<SecureSharePage token="not-a-token" />, { wrapper });
    expect(screen.getByText("This link is not valid")).toBeTruthy();
    expect(calls.some((c) => c.path.startsWith("/shared/"))).toBe(false);
  });

  it("verifies with the emailed code, keeps the session in memory only and reads the content with the share-session header and no cookies", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { calls, fetchMock } = stubApi((call) => {
      const base = `/shared/${TOKEN}`;
      if (call.path === base) return { data: teaser };
      if (call.path === `${base}/verification-code`)
        return { data: { sentTo: "o***@example.test", expiresIn: 600 } };
      if (call.path === `${base}/verify`)
        return { data: { sessionToken: SESSION, expiresIn: 1800 } };
      if (call.path === `${base}/content`)
        return {
          data: content({
            repliesLeft: 1,
            replies: [
              {
                id: "r1",
                authorName: "Test Recipient",
                body: "First answer",
                at: "2026-11-02T11:00:00.000Z",
              },
            ],
          }),
        };
      return undefined;
    }, null);
    const { container } = render(<SecureSharePage token={TOKEN} />, {
      wrapper,
    });
    await verify();
    expect(await screen.findByText("Synthetic body text")).toBeTruthy();
    /* repliesLeft is the server's. */
    expect(screen.getByText("1 of 2 replies left")).toBeTruthy();

    const verifyCall = calls.find((c) => c.path.endsWith("/verify"))!;
    expect(verifyCall.body).toEqual({ code: "123456", name: "Test Recipient" });
    const read = calls.find((c) => c.path.endsWith("/content"))!;
    expect(read.headers["x-share-session"]).toBe(SESSION);
    expect(read.headers["x-organization-id"]).toBeUndefined();
    for (const [url, init] of fetchMock.mock.calls) {
      if (!String(url).includes("/shared/")) continue;
      expect(init?.credentials).toBe("omit");
      expect(init?.referrerPolicy).toBe("no-referrer");
    }
    /* Nothing about the share is stored. */
    for (const [, value] of setItem.mock.calls)
      expect(String(value)).not.toContain(SESSION);
    expect(JSON.stringify(window.localStorage)).not.toContain(TOKEN);
    expect(JSON.stringify(window.sessionStorage)).not.toContain(SESSION);
    expect(document.cookie).not.toContain(SESSION);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("goes back to the code when the session has ended", async () => {
    stubApi((call) => {
      const base = `/shared/${TOKEN}`;
      if (call.path === base) return { data: teaser };
      if (call.path === `${base}/verification-code`)
        return { data: { sentTo: "o***@example.test", expiresIn: 600 } };
      if (call.path === `${base}/verify`)
        return { data: { sessionToken: SESSION, expiresIn: 1800 } };
      if (call.path === `${base}/content`)
        return apiError(401, "sharing.verification_required", "Verify again.");
      return undefined;
    }, null);
    render(<SecureSharePage token={TOKEN} />, { wrapper });
    await verify();
    expect(await screen.findByText(/Your session ended/)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Email me a code" }),
    ).toBeTruthy();
  });

  it("shows the server's lock message after too many wrong codes", async () => {
    stubApi((call) => {
      const base = `/shared/${TOKEN}`;
      if (call.path === base) return { data: teaser };
      if (call.path === `${base}/verification-code`)
        return { data: { sentTo: "o***@example.test", expiresIn: 600 } };
      if (call.path === `${base}/verify`)
        return apiError(
          429,
          "sharing.verification_locked",
          "Too many wrong codes. Try again tomorrow.",
        );
      return undefined;
    }, null);
    render(<SecureSharePage token={TOKEN} />, { wrapper });
    await verify();
    expect(
      await screen.findByText("Too many wrong codes. Try again tomorrow."),
    ).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "Verify and view",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("shows the server's refusal of a reply beyond the limit", async () => {
    stubApi((call) => {
      const base = `/shared/${TOKEN}`;
      if (call.path === base) return { data: teaser };
      if (call.path === `${base}/verification-code`)
        return { data: { sentTo: "o***@example.test", expiresIn: 600 } };
      if (call.path === `${base}/verify`)
        return { data: { sessionToken: SESSION, expiresIn: 1800 } };
      if (call.path === `${base}/content`) return { data: content() };
      if (call.path === `${base}/replies`)
        return apiError(
          409,
          "sharing.replies_used_up",
          "You have used your replies.",
        );
      return undefined;
    }, null);
    render(<SecureSharePage token={TOKEN} />, { wrapper });
    await verify();
    fireEvent.change(await screen.findByLabelText(/Your reply/), {
      target: { value: "One more" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reply" }));
    expect(await screen.findByText("You have used your replies.")).toBeTruthy();
  });

  it("reads 'not valid' for a revoked link, also mid-session", async () => {
    let revoked = false;
    stubApi((call) => {
      const base = `/shared/${TOKEN}`;
      if (revoked) return apiError(404, "sharing.link_not_found");
      if (call.path === base) return { data: teaser };
      if (call.path === `${base}/verification-code`)
        return { data: { sentTo: "o***@example.test", expiresIn: 600 } };
      if (call.path === `${base}/verify`) {
        revoked = true;
        return { data: { sessionToken: SESSION, expiresIn: 1800 } };
      }
      return undefined;
    }, null);
    render(<SecureSharePage token={TOKEN} />, { wrapper });
    await verify();
    expect(await screen.findByText("This link is not valid")).toBeTruthy();
  });

  it("never restores a legacy browser share: the token goes to the server", async () => {
    window.localStorage.setItem(
      "nr:outside-shares",
      JSON.stringify({
        shares: [
          {
            id: "legacy",
            token: TOKEN,
            patientName: "Legacy Member",
            subject: "Legacy subject",
            body: "Legacy body",
            recipientEmail: "x@example.test",
          },
        ],
      }),
    );
    expect(RETIRED_STORES.find((s) => s.name === "outside-shares")?.since).toBe(
      12,
    );
    purgeLegacyStorage();
    expect(window.localStorage.getItem("nr:outside-shares")).toBeNull();
    window.localStorage.setItem(
      "nr:outside-shares",
      JSON.stringify({ shares: [{ id: "legacy", token: TOKEN }] }),
    );
    const { calls } = stubApi(
      (call) =>
        call.path === `/shared/${TOKEN}`
          ? apiError(404, "sharing.link_not_found")
          : undefined,
      null,
    );
    render(<SecureSharePage token={TOKEN} />, { wrapper });
    expect(await screen.findByText("This link is not valid")).toBeTruthy();
    expect(calls.some((c) => c.path === `/shared/${TOKEN}`)).toBe(true);
    expect(screen.queryByText("Legacy subject")).toBeNull();
  });
});

describe("the sender's card", () => {
  it("lists an outside office once when two care contacts share its name (no repeated React key)", async () => {
    const contact = (kind: string, id: string) => ({
      id,
      patientId: JOHN_ID,
      kind,
      name: "Synthetic Same Office",
      phone: "",
      address: "",
      updatedAt: "2026-11-02T10:00:00.000Z",
    });
    stubApi((call) =>
      call.path === `/patients/${JOHN_ID}/care-contacts`
        ? {
            body: {
              success: true,
              message: "Success",
              statusCode: 200,
              data: [
                contact("vascular", "c-1"),
                contact("primary-care", "c-2"),
              ],
            },
          }
        : quiet(call),
    );
    const errors = vi.mocked(console.error);
    const { container } = render(<ShareOutsideCard />, { wrapper });
    fireEvent.click(
      await screen.findByRole("button", { name: "Share Outside NephroReach" }),
    );
    const dialog = await screen.findByRole("dialog");
    const recipient = within(dialog).getByLabelText(
      /^Recipient$/,
    ) as HTMLSelectElement;
    await waitFor(() =>
      expect(
        within(recipient).getAllByRole("option", {
          name: "Synthetic Same Office",
        }),
      ).toHaveLength(1),
    );
    expect(
      errors.mock.calls.some((args) =>
        String(args[0]).includes("two children with the same key"),
      ),
    ).toBe(false);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sends one recipient field and shows the server's message, never a link to copy", async () => {
    const created: StubCall[] = [];
    stubApi((call) => {
      const base = `/patients/${JOHN_ID}/outside-shares`;
      if (call.path === base && call.method === "POST") {
        created.push(call);
        return {
          status: 201,
          body: {
            success: true,
            statusCode: 201,
            message:
              "A secure link was sent to the recipient. The notice does not include what you shared.",
            data: share(),
          },
        };
      }
      return quiet(call);
    });
    const { container } = render(<ShareOutsideCard />, { wrapper });
    fireEvent.click(
      await screen.findByRole("button", { name: "Share Outside NephroReach" }),
    );
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Recipient's email/), {
      target: { value: "outside@example.test" },
    });
    fireEvent.change(within(dialog).getByLabelText(/^Message/), {
      target: { value: "Hello" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Share" }));
    const notice = (await screen.findAllByRole("dialog")).find((d) =>
      within(d).queryByRole("button", { name: "Confirm & Share" }),
    )!;
    const boxes = within(notice).getAllByRole("checkbox");
    fireEvent.click(boxes[boxes.length - 1]);
    fireEvent.click(
      within(notice).getByRole("button", { name: "Confirm & Share" }),
    );
    expect(
      await screen.findByText(/A secure link was sent to the recipient/),
    ).toBeTruthy();
    expect(created).toHaveLength(1);
    expect(created[0].body).toMatchObject({
      kind: "message",
      recipientEmail: "outside@example.test",
      body: "Hello",
    });
    expect(created[0].body).not.toHaveProperty("careTeamContactId");
    expect(created[0].body).not.toHaveProperty("token");
    expect(created[0].headers["x-organization-id"]).toBeUndefined();
    expect(screen.queryByText(/Copy link/)).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("lists the server's shares and stops sharing through the revoke route", async () => {
    const revoked: StubCall[] = [];
    stubApi((call) => {
      const base = `/patients/${JOHN_ID}/outside-shares`;
      if (call.path === base) return pageOf([share()]);
      if (call.path === `${base}/s-1/revoke`) {
        revoked.push(call);
        return { data: share({ status: "revoked" }) };
      }
      return quiet(call);
    });
    render(<ShareOutsideCard />, { wrapper });
    fireEvent.click(
      await screen.findByRole("button", { name: "What I've shared (1)" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Stop sharing" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Yes, stop sharing" }),
    );
    await waitFor(() => expect(revoked).toHaveLength(1));
    expect(revoked[0].method).toBe("POST");
  });

  it("offers an office only the four office kinds, under its own header", async () => {
    const { calls } = stubApi(quiet, officeContext());
    render(<OfficeShareOutside sender="Synthetic Dialysis Center A" />, {
      wrapper,
    });
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Message Outside NephroReach",
      }),
    );
    const dialog = await screen.findByRole("dialog");
    const kinds = within(within(dialog).getByLabelText(/What to send/))
      .getAllByRole("option")
      .map((o) => o.getAttribute("value"));
    expect(kinds).toEqual(["message", "referral", "appointment", "document"]);
    await waitFor(() =>
      expect(
        calls.some((c) => c.path === `/organizations/${ORG}/outside-shares`),
      ).toBe(true),
    );
    const list = calls.find(
      (c) => c.path === `/organizations/${ORG}/outside-shares`,
    )!;
    expect(list.headers["x-organization-id"]).toBe(ORG);
  });
});
