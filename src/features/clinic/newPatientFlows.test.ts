import { describe, expect, it } from "vitest";
import {
  conversationIdFor,
  startConversation,
} from "@/features/messaging/messaging.rules";
import { FACILITY } from "@/features/messaging/messaging.seed";
import type { MessagingState } from "@/features/messaging/messaging.types";

/* A patient enrolled at the clinic reaches the other clinic screens:
   Messages starts them on request (CCM enrolment and access records are
   the API's: phase9.api.test.tsx, phase10 tests). */

const NOW = new Date(2026, 8, 30, 10).getTime();

describe("New Message", () => {
  const empty: MessagingState = { conversations: [] };
  const input = {
    memberName: "Ana Ruiz",
    contact: FACILITY,
    category: "care-team" as const,
    body: "Welcome to the clinic",
    author: "clinic" as const,
  };

  it("opens a thread with a patient who had none", () => {
    const next = startConversation(empty, input, NOW);
    expect(next.conversations).toHaveLength(1);
    expect(next.conversations[0].id).toBe(
      conversationIdFor("Ana Ruiz", FACILITY.name),
    );
    expect(next.conversations[0].messages[0].body).toBe(
      "Welcome to the clinic",
    );
  });

  it("writes into the existing thread instead of a second one", () => {
    const once = startConversation(empty, input, NOW);
    const archived = {
      conversations: once.conversations.map((c) => ({ ...c, archived: true })),
    };
    const twice = startConversation(
      archived,
      { ...input, body: "Follow-up", author: "member" },
      NOW + 1,
    );
    expect(twice.conversations).toHaveLength(1);
    expect(twice.conversations[0].messages).toHaveLength(2);
    expect(twice.conversations[0].archived).toBe(false);
  });

  it("an empty message is not sent", () => {
    expect(startConversation(empty, { ...input, body: "  " }, NOW)).toBe(empty);
  });
});
