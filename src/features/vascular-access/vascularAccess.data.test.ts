import { describe, expect, it } from "vitest";
import { DEMO_MEMBER } from "@/features/messaging/messaging.seed";
import {
  addDays,
  arrangeTransport,
  completeAppointment,
  dayKey,
  formatDay,
  formatTime,
  markThreadRead,
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
  it("one request per appointment, and the clinic can arrange it", () => {
    const appointment = upcomingAppointments(member, TODAY)[0];
    let next = requestTransport(seed, MRN, appointment.id, NOW);
    next = requestTransport(next, MRN, appointment.id, NOW + 1);
    const record = recordFor(next, MRN)!;
    expect(pendingTransport(record)).toHaveLength(1);

    const arranged = arrangeTransport(next, MRN, record.transport[0].id);
    expect(pendingTransport(recordFor(arranged, MRN)!)).toHaveLength(0);
  });
});

describe("messages", () => {
  it("a member message is unread for the team until the team opens it", () => {
    const sent = sendAccessMessage(seed, MRN, "dialysis", "member", "Hi", NOW);
    const thread = recordFor(sent, MRN)!.threads.find(
      (t) => t.team === "dialysis",
    )!;
    expect(thread.unreadByTeam).toBe(1);
    expect(thread.messages.at(-1)?.body).toBe("Hi");

    const read = markThreadRead(sent, MRN, "dialysis", "team");
    expect(
      recordFor(read, MRN)!.threads.find((t) => t.team === "dialysis")!
        .unreadByTeam,
    ).toBe(0);
  });

  it("a photo alone is a message; nothing at all is not", () => {
    expect(sendAccessMessage(seed, MRN, "vascular", "member", "  ", NOW)).toBe(
      seed,
    );
    const withPhoto = sendAccessMessage(
      seed,
      MRN,
      "vascular",
      "member",
      "",
      NOW,
      "data:image/jpeg;base64,AAAA",
    );
    const thread = recordFor(withPhoto, MRN)!.threads.find(
      (t) => t.team === "vascular",
    )!;
    expect(thread.messages.at(-1)?.imageUrl).toContain("data:image/jpeg");
  });
});
