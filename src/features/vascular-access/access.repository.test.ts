import { afterEach, describe, expect, it, vi } from "vitest";
import { pageOf, stubApi } from "@/features/profile/memberApiStub";
import * as repo from "./access.repository";
import type { AccessTarget } from "./access.repository";
import { confirmBody } from "./useAccess";

/* Phase 10: one function per server route. The profile id is in every
   path; an MRN or a name never is. Synthetic ids only. */

afterEach(() => {
  vi.unstubAllGlobals();
});

const PATIENT = "p-111";
const ORG = "org-222";
const PROFILE = "prof-333";
const member: AccessTarget = { kind: "patient", patientId: PATIENT };
const office: AccessTarget = { kind: "office", organizationId: ORG };
const MRN = "MRN-777001";

function stub() {
  return stubApi((call) => (call.method === "GET" ? pageOf([]) : { data: {} }));
}

describe("URL shapes", () => {
  it("member reads go through /patients/:id, office reads through /organizations/:id", async () => {
    const { calls } = stub();
    await repo.listProfiles(member);
    await repo.listProfiles(office);
    await repo.getProfile(member, PROFILE);
    await repo.getProfile(office, PROFILE);
    const paths = calls
      .filter((c) => c.path !== "/me/context")
      .map((c) => c.path);
    expect(paths).toEqual([
      `/patients/${PATIENT}/access-profiles`,
      `/organizations/${ORG}/access-profiles`,
      `/patients/${PATIENT}/access-profiles/${PROFILE}`,
      `/organizations/${ORG}/access-profiles/${PROFILE}`,
    ]);
  });

  it("every part of a record carries the profile id, never an MRN", async () => {
    const { calls } = stub();
    await repo.listAppointments(member, PROFILE, { state: "upcoming" });
    await repo.listUpdates(office, PROFILE);
    await repo.listHistory(office, PROFILE);
    await repo.listConcerns(office, PROFILE, { status: "Open" });
    await repo.listTransport(member, PROFILE);
    await repo.listMessages(member, PROFILE, { limit: 50 });
    await repo.bookAppointment(ORG, PROFILE, {
      date: "2026-12-01",
      time: "14:30",
      title: "Access Check",
      place: "Center",
      team: "vascular",
    });
    await repo.completeAppointment(ORG, PROFILE, "appt-1", {
      result: "Fine",
      performedBy: "Dr Test",
    });
    await repo.reportConcern(PATIENT, PROFILE, {
      kinds: ["pain"],
      detail: "Sore",
      sendTo: ["access"],
      imageFileId: "file-1",
    });
    await repo.editConcern(PATIENT, PROFILE, "c-1", { imageFileId: null });
    await repo.deleteConcern(PATIENT, PROFILE, "c-1");
    await repo.resendConcern(PATIENT, PROFILE, "c-1");
    await repo.reviewConcern(ORG, PROFILE, "c-1");
    await repo.concernImageLink(office, PROFILE, "c-1");
    await repo.requestTransport(PATIENT, PROFILE, {
      appointmentId: "appt-1",
      pickupAddress: "1 Test Way",
      returnTrip: true,
      mobility: "wheelchair",
    });
    await repo.setUpTransport(ORG, PROFILE, {
      appointmentId: "appt-1",
      pickupAddress: "1 Test Way",
      returnTrip: false,
      mobility: "ambulatory",
    });
    await repo.acknowledgeTransport(ORG, PROFILE, "r-1");
    await repo.cancelTransport(member, PROFILE, "r-1");
    await repo.postMessage(office, PROFILE, { body: "Hi" });
    await repo.setMessagePrivacy(member, PROFILE, "m-1", true);
    await repo.setDialysisCanPost(member, PROFILE, true);
    await repo.markRead(office, PROFILE);
    await repo.messageImageLink(member, PROFILE, "m-1");
    const sent = calls.filter((c) => c.path !== "/me/context");
    expect(sent).toHaveLength(23);
    for (const call of sent) {
      expect(call.path).toContain(`/access-profiles/${PROFILE}`);
      expect(call.path).not.toContain(MRN);
      expect(JSON.stringify(call.body ?? {})).not.toMatch(/mrn/i);
      expect(call.query.toString()).not.toMatch(/mrn/i);
    }
    const find = (suffix: string, method: string) =>
      sent.find((c) => c.path.endsWith(suffix) && c.method === method);
    expect(find("/appointments", "GET")?.query.get("state")).toBe("upcoming");
    expect(find("/concerns", "GET")?.query.get("status")).toBe("Open");
    expect(find("/concerns", "POST")?.body).toMatchObject({
      imageFileId: "file-1",
      sendTo: ["access"],
    });
    expect(find("/concerns/c-1", "PATCH")?.body).toEqual({
      imageFileId: null,
    });
    expect(find("/transport/r-1/acknowledge", "POST")?.path).toBe(
      `/organizations/${ORG}/access-profiles/${PROFILE}/transport/r-1/acknowledge`,
    );
    expect(find("/transport/r-1/cancel", "POST")?.path).toBe(
      `/patients/${PATIENT}/access-profiles/${PROFILE}/transport/r-1/cancel`,
    );
    expect(find("/messages/settings", "PATCH")?.body).toEqual({
      dialysisCanPost: true,
    });
  });

  it("the office roster and the ride queue are paged and filtered on the server", async () => {
    const { calls } = stub();
    await repo.listRoster(ORG, { status: "Closed", search: "Ann", limit: 50 });
    await repo.listOrganizationTransport(ORG, { active: true, limit: 50 });
    const [roster, queue] = calls.filter((c) => c.path !== "/me/context");
    expect(roster.path).toBe(`/organizations/${ORG}/access-profiles`);
    expect(roster.query.get("status")).toBe("Closed");
    expect(roster.query.get("search")).toBe("Ann");
    expect(roster.query.get("limit")).toBe("50");
    expect(queue.path).toBe(`/organizations/${ORG}/transport`);
    expect(queue.query.get("active")).toBe("true");
  });
});

describe("confirm body", () => {
  it("sends 24-hour HH:mm times and leaves empty fields out", () => {
    expect(
      confirmBody({
        pickupTime: "9:05 AM",
        returnPickupTime: "",
        provider: " Test Rides ",
        phone: "555-0100",
        confirmationNumber: "C-1",
        note: "  ",
      }),
    ).toEqual({
      pickupTime: "09:05",
      provider: "Test Rides",
      phone: "555-0100",
      confirmationNumber: "C-1",
    });
    expect(
      confirmBody({
        pickupTime: "13:45",
        returnPickupTime: "4:30 PM",
        provider: "P",
        phone: "555-0100",
        confirmationNumber: "C-2",
        note: "Calls ahead",
      }),
    ).toMatchObject({
      pickupTime: "13:45",
      returnPickupTime: "16:30",
      note: "Calls ahead",
    });
  });
});

describe("toHhMm", () => {
  it("reads 24-hour and 12-hour times, refuses the rest", async () => {
    const { toHhMm } = await import("./vascularAccess.data");
    expect(toHhMm("07:05")).toBe("07:05");
    expect(toHhMm("14:30:00")).toBe("14:30");
    expect(toHhMm("12:15 AM")).toBe("00:15");
    expect(toHhMm("12:15 PM")).toBe("12:15");
    expect(toHhMm("4:30 pm")).toBe("16:30");
    expect(toHhMm("13:00 PM")).toBeNull();
    expect(toHhMm("24:00")).toBeNull();
    expect(toHhMm("soon")).toBeNull();
  });
});
