import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { NewMessageModal } from "./NewMessageModal";
import { MessagingWriteUnavailableError, useMessages } from "./useMessages";

/* QA round 1 (M1): the deprecated read-only adapter must never let a write
   look done. Every write throws, and the New Message dialog (the Check-In
   Reminder uses it) shows that the message was not sent and stays open.
   Synthetic data only. */

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(() => new Promise<Response>(() => undefined));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <LanguageProvider>{children}</LanguageProvider>
    </QueryClientProvider>
  );
}

describe("useMessages (deprecated read-only adapter)", () => {
  it("throws on every write and sends nothing", () => {
    const { result } = renderHook(() => useMessages(), { wrapper });
    const hook = result.current;
    const writes: Array<[string, () => void]> = [
      ["sendMessage", () => hook.sendMessage("c-1", "Hello")],
      [
        "startConversation",
        () =>
          hook.startConversation({
            memberName: "Synthetic Patient",
            contact: { name: "Synthetic Office", role: "", kind: "facility" },
            category: "care-team",
            body: "Reminder",
            author: "clinic",
          }),
      ],
      ["markRead", () => hook.markRead("c-1")],
      ["markUnread", () => hook.markUnread("c-1")],
      ["toggleFlag", () => hook.toggleFlag("c-1")],
      ["setArchived", () => hook.setArchived("c-1", true)],
      ["setPatientNotes", () => hook.setPatientNotes("c-1", "note")],
    ];
    for (const [name, write] of writes) {
      expect(write, name).toThrow(MessagingWriteUnavailableError);
    }
    const writeCalls = fetchMock.mock.calls.filter(
      ([, init]) =>
        ((init as RequestInit | undefined)?.method ?? "GET") !== "GET",
    );
    expect(writeCalls).toEqual([]);
  });
});

describe("New Message dialog when the send throws (Check-In Reminder)", () => {
  function renderReminder(onSend: () => void) {
    const onClose = vi.fn();
    const view = render(
      <NewMessageModal
        title="Send a Check-In Reminder"
        recipientLabel="Patient"
        recipients={[{ value: "MRN-0001", label: "Synthetic Patient" }]}
        initialBody="Please complete your check-in."
        onSend={onSend}
        onClose={onClose}
      />,
    );
    return { ...view, onClose };
  }

  it("shows that the message was not sent and stays open", async () => {
    const { result } = renderHook(() => useMessages(), { wrapper });
    const { container, onClose } = renderReminder(() =>
      result.current.startConversation({
        memberName: "Synthetic Patient",
        contact: { name: "Synthetic Office", role: "", kind: "facility" },
        category: "care-team",
        body: "Please complete your check-in.",
        author: "clinic",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(
      await screen.findByText(/this message was not sent/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: /check-in reminder/i }),
    ).toBeInTheDocument();
    /* What was typed is kept. */
    expect(screen.getByRole("textbox")).toHaveValue(
      "Please complete your check-in.",
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows a plain 'not sent' for any other thrown error", async () => {
    const { onClose } = renderReminder(() => {
      throw new Error("boom");
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(
      await screen.findByText("This message was not sent."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("still closes after a send that returns normally", () => {
    const { onClose } = renderReminder(() => undefined);
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
