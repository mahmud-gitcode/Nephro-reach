import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  api,
  activeOrganization,
  hasSessionEndedHandler,
  onSessionEnded,
  resetApiClientState,
  setActiveOrganization,
} from "@/lib/api/client";
import { registerQueryClient } from "./queryCache";
import { STORAGE_VERSION_KEY } from "./legacyPurge";
import {
  __resetSessionForTests,
  AUTH_CHANNEL,
  browser,
  EXPIRED_LOGIN_PATH,
  listenForSignOut,
  registerSessionEnd,
  SIGNED_OUT_MESSAGE,
  signOut,
} from "./session";

/* Sign-out and session end. There is no browser driver in this repo, so
   the cross-tab part is tested with a fake BroadcastChannel; the two-tab
   check in a real browser is a manual item (integration-evidence/phase-1). */

class FakeChannel {
  static all: FakeChannel[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  closed = false;
  constructor(readonly name: string) {
    FakeChannel.all.push(this);
  }
  postMessage(data: unknown) {
    for (const other of FakeChannel.all) {
      if (other !== this && !other.closed && other.name === this.name)
        other.onmessage?.({ data } as MessageEvent);
    }
  }
  close() {
    this.closed = true;
  }
}

let assign: ReturnType<typeof vi.spyOn>;
let reload: ReturnType<typeof vi.spyOn>;
let client: QueryClient;
let unregisterClient: () => void;

function setPath(path: string) {
  window.history.replaceState(null, "", path);
}

beforeEach(() => {
  FakeChannel.all = [];
  vi.stubGlobal("BroadcastChannel", FakeChannel);
  assign = vi.spyOn(browser, "assign").mockImplementation(() => {});
  reload = vi.spyOn(browser, "reload").mockImplementation(() => {});
  client = new QueryClient();
  client.setQueryData(["patient", "p1", "org", "self", "labs"], ["potassium"]);
  unregisterClient = registerQueryClient(client);
  window.localStorage.clear();
  resetApiClientState();
  onSessionEnded(null);
  __resetSessionForTests();
  setPath("/dashboard/personal-log");
});

afterEach(() => {
  unregisterClient();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("signOut", () => {
  it("logs out on the server, clears cache and storage, broadcasts, reloads", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            success: true,
            statusCode: 200,
            message: "",
            data: null,
          }),
          {
            status: 200,
          },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const otherTab = new FakeChannel(AUTH_CHANNEL);
    const heard = vi.fn();
    otherTab.onmessage = (e) => heard(e.data);
    const clearDemoSession = vi.fn();
    window.localStorage.setItem("nr:medication-mood", "[]");
    window.localStorage.setItem("preferred_language", "EN");
    setActiveOrganization("org-1");

    await signOut({ clearDemoSession });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(new URL(url).pathname).toBe("/api/v1/auth/logout");
    expect(init.method).toBe("POST");
    expect(
      (init.headers as Record<string, string>)["X-Organization-Id"],
    ).toBeUndefined();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(window.localStorage.getItem("nr:medication-mood")).toBeNull();
    expect(window.localStorage.getItem("preferred_language")).toBe("EN");
    expect(window.localStorage.getItem(STORAGE_VERSION_KEY)).not.toBeNull();
    expect(activeOrganization()).toBeNull();
    expect(clearDemoSession).toHaveBeenCalled();
    expect(heard).toHaveBeenCalledWith(SIGNED_OUT_MESSAGE);
    expect(assign).toHaveBeenCalledWith("/");
  });

  it("still signs out when the API is down", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new TypeError("offline"))),
    );
    await signOut();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(assign).toHaveBeenCalledWith("/");
  });
});

describe("onSessionEnded", () => {
  it("is registered, and on a failed refresh clears everything and goes to /login?reason=expired", async () => {
    const clearDemoSession = vi.fn();
    const unregister = registerSessionEnd(clearDemoSession);
    expect(hasSessionEndedHandler()).toBe(true);
    const otherTab = new FakeChannel(AUTH_CHANNEL);
    const heard = vi.fn();
    otherTab.onmessage = (e) => heard(e.data);
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: false,
              statusCode: 401,
              message: "Unauthorized",
            }),
            {
              status: 401,
            },
          ),
      ),
    );

    await Promise.allSettled([api("/me/context"), api("/patients/p1/labs")]);

    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith(EXPIRED_LOGIN_PATH);
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(clearDemoSession).toHaveBeenCalledTimes(1);
    expect(heard).toHaveBeenCalledWith(SIGNED_OUT_MESSAGE);
    unregister();
    expect(hasSessionEndedHandler()).toBe(false);
  });
});

describe("other tabs", () => {
  it("a portal tab that hears sign-out drops its cache and reloads", () => {
    const stop = listenForSignOut();
    new FakeChannel(AUTH_CHANNEL).postMessage(SIGNED_OUT_MESSAGE);
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(reload).toHaveBeenCalledTimes(1);
    stop();
  });

  it("a public tab drops its cache but does not reload", () => {
    setPath("/about-us");
    const stop = listenForSignOut();
    new FakeChannel(AUTH_CHANNEL).postMessage(SIGNED_OUT_MESSAGE);
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(reload).not.toHaveBeenCalled();
    stop();
  });

  it("ignores other messages", () => {
    const stop = listenForSignOut();
    new FakeChannel(AUTH_CHANNEL).postMessage("hello");
    expect(reload).not.toHaveBeenCalled();
    expect(client.getQueryCache().getAll()).toHaveLength(1);
    stop();
  });

  it("stops listening after cleanup", () => {
    const stop = listenForSignOut();
    stop();
    new FakeChannel(AUTH_CHANNEL).postMessage(SIGNED_OUT_MESSAGE);
    expect(reload).not.toHaveBeenCalled();
  });
});

describe("back/forward cache", () => {
  function pageshow(persisted: boolean) {
    const event = new Event("pageshow") as PageTransitionEvent;
    Object.defineProperty(event, "persisted", { value: persisted });
    window.dispatchEvent(event);
  }

  it("a restored portal page reloads", () => {
    const stop = listenForSignOut();
    pageshow(true);
    expect(reload).toHaveBeenCalledTimes(1);
    stop();
  });

  it("a normal load does not", () => {
    const stop = listenForSignOut();
    pageshow(false);
    expect(reload).not.toHaveBeenCalled();
    stop();
  });
});
