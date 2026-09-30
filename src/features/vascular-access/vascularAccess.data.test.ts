import { describe, expect, it } from "vitest";
import { DEMO_MEMBER } from "@/features/messaging/messaging.seed";
import {
  TRANSPORT_COORDINATOR,
  acknowledgeTransport,
  activeTransport,
  addDays,
  canPost,
  canRead,
  cancelTransport,
  completeAppointment,
  confirmTransport,
  dayKey,
  formatDay,
  formatTime,
  markConversationRead,
  openConcerns,
  pendingTransport,
  recordFor,
  recordForMember,
  reportConcern,
  requestTransport,
  reviewConcern,
  scheduleAppointment,
  seedAccessState,
  sendAccessMessage,
  setDialysisCanPost,
  setMessagePrivate,
  upcomingAppointments,
} from "./vascularAccess.data";

const NOW = new Date(2026, 8, 27, 12).getTime();
const TODAY = dayKey(NOW);
const seed = seedAccessState(NOW);
const member = recordForMember(seed, DEMO_MEMBER)!;
const MRN = member.mrn;

describe("formatting", () => {
  it("formats days and times without a time-zone shift", () => {
    expect(formatDay("2026-10-05")).toBe("Oct 5, 2026");
    expect(formatTime("13:30")).toBe("1:30 PM");
    expect(formatTime("00:05")).toBe("12:05 AM");
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
  });
});

describe("appointments", () => {
  it("lists the member's upcoming visits soonest first", () => {
    const upcoming = upcomingAppointments(member, TODAY);
    expect(upcoming.length).toBe(3);
    expect(upcoming.map((a) => a.date)).toEqual(
      [...upcoming.map((a) => a.date)].sort(),
    );
  });

  it("a visit booked by the clinic lands on the member's list and timeline", () => {
    const next = scheduleAppointment(
      seed,
      MRN,
      {
        date: addDays(TODAY, 2),
        time: "09:00",
        title: "Fistulogram",
        place: "City Vascular Center",
        team: "vascular",
      },
      NOW,
    );
    const record = recordFor(next, MRN)!;
    expect(upcomingAppointments(record, TODAY)[0].title).toBe("Fistulogram");
    expect(record.updates.at(-1)?.title).toBe("Appointment Scheduled");
  });

  it("completing a visit moves it to history and sets the last assessment", () => {
    const appointment = upcomingAppointments(member, TODAY)[0];
    const next = completeAppointment(
      seed,
      MRN,
      appointment.id,
      "Normal flow",
      "Dr. Patel",
      NOW,
    );
    const record = recordFor(next, MRN)!;
    expect(upcomingAppointments(record, TODAY)).toHaveLength(2);
    expect(record.history.at(-1)?.result).toBe("Normal flow");
    expect(record.overview.lastAssessment).toBe(appointment.date);
  });
});

describe("concerns", () => {
  it("a report flags the access; reviewing the last one lowers it", () => {
    const reported = reportConcern(
      seed,
      MRN,
      { kinds: ["swelling"], detail: "Arm is swollen" },
      NOW,
    );
    const record = recordFor(reported, MRN)!;
    expect(record.overview.status).toBe("Problem Reported");
    expect(openConcerns(record)).toHaveLength(1);

    const reviewed = reviewConcern(reported, MRN, openConcerns(record)[0].id);
    const after = recordFor(reviewed, MRN)!;
    expect(openConcerns(after)).toHaveLength(0);
    expect(after.overview.status).toBe("Needs Review");
  });
});

describe("transport", () => {
  const appointment = upcomingAppointments(member, TODAY)[0];
  const ask = {
    appointmentId: appointment.id,
    pickupAddress: "  12 Elm St, Columbia  ",
    returnTrip: true,
    mobility: "wheelchair" as const,
    memberNote: "",
  };

  it("goes to the dialysis center's social worker, one per appointment", () => {
    let next = requestTransport(seed, MRN, ask, NOW);
    next = requestTransport(next, MRN, ask, NOW + 1);
    const record = recordFor(next, MRN)!;
    expect(pendingTransport(record)).toHaveLength(1);
    expect(record.transport[0]).toMatchObject({
      status: "Requested",
      handledBy: TRANSPORT_COORDINATOR,
      pickupAddress: "12 Elm St, Columbia",
    });
  });

  it("is acknowledged, then confirmed with details the patient sees", () => {
    const requested = requestTransport(seed, MRN, ask, NOW);
    const id = recordFor(requested, MRN)!.transport[0].id;
    const acknowledged = acknowledgeTransport(requested, MRN, id, NOW + 1);
    expect(recordFor(acknowledged, MRN)!.transport[0].status).toBe(
      "Acknowledged",
    );

    const confirmed = confirmTransport(
      acknowledged,
      MRN,
      id,
      {
        pickupTime: "08:15",
        returnPickupTime: "11:30",
        provider: " MetroRide ",
        phone: "(803) 555-0100",
        confirmationNumber: "MR-4471",
      },
      NOW + 2,
    );
    const record = recordFor(confirmed, MRN)!;
    expect(record.transport[0].status).toBe("Confirmed");
    expect(record.transport[0].confirmation).toMatchObject({
      provider: "MetroRide",
      returnPickupTime: "11:30",
    });
    expect(pendingTransport(record)).toHaveLength(0);
    expect(record.updates.at(-1)).toMatchObject({
      title: "Transportation Confirmed",
    });
    expect(record.updates.at(-1)?.detail).toContain("pickup 8:15 AM");
  });

  it("once cancelled, can be asked for again", () => {
    const requested = requestTransport(seed, MRN, ask, NOW);
    const id = recordFor(requested, MRN)!.transport[0].id;
    const cancelled = cancelTransport(requested, MRN, id, "member", NOW + 1);
    const record = recordFor(cancelled, MRN)!;
    expect(activeTransport(record)).toHaveLength(0);
    expect(record.transport[0].cancelledBy).toBe("member");

    const again = requestTransport(cancelled, MRN, ask, NOW + 2);
    expect(activeTransport(recordFor(again, MRN)!)).toHaveLength(1);
  });
});

describe("the three-way conversation", () => {
  const conversationOf = (state: typeof seed) =>
    recordFor(state, MRN)!.conversation;

  it("a patient message is unread for both centers until each opens it", () => {
    const base = markConversationRead(
      markConversationRead(seed, MRN, "access"),
      MRN,
      "dialysis",
    );
    const sent = sendAccessMessage(base, MRN, "member", DEMO_MEMBER, "Hi", NOW);
    expect(conversationOf(sent).unread).toMatchObject({
      access: 1,
      dialysis: 1,
    });
    const read = markConversationRead(sent, MRN, "dialysis");
    expect(conversationOf(read).unread).toMatchObject({
      access: 1,
      dialysis: 0,
    });
  });

  it("a private message never reaches the dialysis center", () => {
    const base = markConversationRead(seed, MRN, "dialysis");
    const sent = sendAccessMessage(
      base,
      MRN,
      "member",
      DEMO_MEMBER,
      "Just between us",
      NOW,
      { private: true },
    );
    const message = conversationOf(sent).messages.at(-1)!;
    expect(canRead(message, "access")).toBe(true);
    expect(canRead(message, "dialysis")).toBe(false);
    expect(conversationOf(sent).unread.dialysis).toBe(0);
  });

  it("only the patient and the access center manage privacy and posting", () => {
    const id = conversationOf(seed).messages[0].id;
    expect(setMessagePrivate(seed, MRN, id, true, "dialysis")).toBe(seed);
    const hidden = setMessagePrivate(seed, MRN, id, true, "access");
    expect(conversationOf(hidden).messages[0].private).toBe(true);

    expect(setDialysisCanPost(seed, MRN, false, "dialysis")).toBe(seed);
    const closed = setDialysisCanPost(seed, MRN, false, "member");
    expect(canPost(conversationOf(closed), "dialysis")).toBe(false);
    const ignored = sendAccessMessage(
      closed,
      MRN,
      "dialysis",
      "Nurse Wilson",
      "Hello",
      NOW,
    );
    expect(conversationOf(ignored).messages).toHaveLength(
      conversationOf(closed).messages.length,
    );
  });

  it("the dialysis center cannot send a private message", () => {
    const sent = sendAccessMessage(
      seed,
      MRN,
      "dialysis",
      "Nurse Wilson",
      "Noted",
      NOW,
      { private: true },
    );
    expect(conversationOf(sent).messages.at(-1)?.private).toBeUndefined();
  });

  it("a photo alone is a message; nothing at all is not", () => {
    expect(sendAccessMessage(seed, MRN, "member", DEMO_MEMBER, "  ", NOW)).toBe(
      seed,
    );
    const withPhoto = sendAccessMessage(
      seed,
      MRN,
      "member",
      DEMO_MEMBER,
      "",
      NOW,
      {
        imageUrl: "data:image/jpeg;base64,AAAA",
      },
    );
    expect(conversationOf(withPhoto).messages.at(-1)?.imageUrl).toContain(
      "data:image/jpeg",
    );
  });
});
