import { describe, expect, it } from "vitest";
import {
  conversationIdFor,
  startConversation,
} from "@/features/messaging/messaging.rules";
import { FACILITY } from "@/features/messaging/messaging.seed";
import type { MessagingState } from "@/features/messaging/messaging.types";
import { addAccessRecord } from "@/features/vascular-access/vascularAccess.data";
import { ccmPatientsOf, enrollInCcm, type CcmState } from "./ccm.data";

/* A patient enrolled at the clinic reaches the other clinic screens:
   Messages, CCM and Vascular Access each start them on request. */

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

describe("Add to CCM", () => {
  const state: CcmState = { activities: [], requirements: {}, inbox: [] };
  const patient = {
    mrn: "777001",
    name: "Ana Ruiz",
    dob: "1970-01-01",
    conditions: ["CKD 3", "HTN"],
    provider: "Dr. Chen",
    careManager: "Nurse Lisa",
    location: "Main Office",
  };

  it("adds the patient once, with the checklist still to do", () => {
    const next = enrollInCcm(enrollInCcm(state, patient), patient);
    expect(ccmPatientsOf(next).filter((p) => p.mrn === "777001")).toHaveLength(
      1,
    );
    expect(next.requirements["777001"]).toEqual({});
  });
});

describe("Add Access Patient", () => {
  it("starts an empty shared record, once", () => {
    const overview = {
      type: "AV Fistula",
      location: "Left Forearm",
      createdOn: "2026-09-01",
      status: "Needs Review" as const,
      lastAssessment: "",
    };
    const patient = { memberName: "Ana Ruiz", mrn: "777001" };
    const next = addAccessRecord(
      addAccessRecord({ records: [] }, patient, overview),
      patient,
      overview,
    );
    expect(next.records).toHaveLength(1);
    expect(next.records[0].conversation.messages).toEqual([]);
    expect(next.records[0].conversation.dialysisCanPost).toBe(false);
  });
});
