import { describe, expect, it } from "vitest";
import { emptyCheckIn } from "./checkIn.rules";
import type { BetweenTreatmentCheckIn } from "./checkIn.types";
import {
  buildNotice,
  isClinicOpenOn,
  isDelivered,
  isHeldForClosure,
  nextClinicOpenDay,
  noticeReasons,
  noticeStatus,
  pendingNotices,
  removeNotice,
  shouldSuggestNotice,
  suggestedReasons,
  upsertNotice,
  withdrawNotice,
} from "./clinicNotice.rules";
import type { ClinicNotice } from "./clinicNotice.types";

/* Sep 2026: the 13th and 20th are Sundays, the 14th and 21st Mondays.
 * Everything below is about the two ways a notice can mislead a member:
 * telling them the clinic has it on a day the clinic is shut, or letting
 * them believe they took back something already read. */

const SUNDAY = "2026-09-20";
const MONDAY = "2026-09-21";
const TUESDAY = "2026-09-15";

const at = (iso: string, hour = 10) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day, hour, 0, 0);
};

function entry(patch: Partial<BetweenTreatmentCheckIn> = {}) {
  return { ...emptyCheckIn(TUESDAY), ...patch };
}

describe("when the clinic is open", () => {
  it("is shut on Sunday and open the rest of the week", () => {
    expect(isClinicOpenOn(SUNDAY)).toBe(false);
    expect(isClinicOpenOn(MONDAY)).toBe(true);
    expect(isClinicOpenOn("2026-09-19")).toBe(true); // Saturday
  });

  it("holds a Sunday until Monday", () => {
    expect(nextClinicOpenDay(SUNDAY)).toBe(MONDAY);
  });

  it("leaves an open day where it is", () => {
    expect(nextClinicOpenDay(TUESDAY)).toBe(TUESDAY);
    expect(nextClinicOpenDay("2026-09-19")).toBe("2026-09-19");
  });

  it("crosses a month boundary rather than landing on the 0th", () => {
    // Sun 31 Jan 2027 -> Mon 1 Feb.
    expect(nextClinicOpenDay("2027-01-31")).toBe("2027-02-01");
  });
});

describe("raising a notice", () => {
  it("delivers the same day when the clinic is open", () => {
    const notice = buildNotice(entry(), at(TUESDAY));
    expect(notice.deliverOn).toBe(TUESDAY);
    expect(isHeldForClosure(notice)).toBe(false);
    expect(noticeStatus(notice, at(TUESDAY))).toBe("delivered");
  });

  it("holds a Sunday send for Monday instead of dropping it", () => {
    const notice = buildNotice(entry({ feeling: "rough" }), at(SUNDAY));
    expect(notice.raisedOn).toBe(SUNDAY);
    expect(notice.deliverOn).toBe(MONDAY);
    expect(isHeldForClosure(notice)).toBe(true);
    expect(noticeStatus(notice, at(SUNDAY))).toBe("held");
  });

  it("keeps a held Sunday notice queued until Monday arrives", () => {
    const notice = buildNotice(entry(), at(SUNDAY));
    expect(isDelivered(notice, at(SUNDAY, 23))).toBe(false);
    expect(isDelivered(notice, at(MONDAY, 0))).toBe(true);
  });

  it("is about the logged day, not the day it is sent", () => {
    // A Saturday logged late on Sunday still reads as Saturday's day.
    const notice = buildNotice(entry({ date: "2026-09-19" }), at(SUNDAY));
    expect(notice.checkInDate).toBe("2026-09-19");
    expect(notice.deliverOn).toBe(MONDAY);
  });
});

describe("what the clinic is told", () => {
  it("leads with a missed treatment", () => {
    expect(suggestedReasons(entry({ missedTreatment: true }))).toEqual([
      "missed-treatment",
    ]);
  });

  it("flags severe symptoms and a rough day together", () => {
    expect(
      suggestedReasons(
        entry({ severity: "severe", symptoms: ["Cramping"], feeling: "rough" }),
      ),
    ).toEqual(["severe-symptoms", "rough-day"]);
  });

  it("does not flag a severe rating with nothing rated", () => {
    expect(suggestedReasons(entry({ severity: "severe" }))).toEqual([]);
    expect(shouldSuggestNotice(entry({ severity: "severe" }))).toBe(false);
  });

  it("marks a quiet day the member sent anyway as their own call", () => {
    expect(noticeReasons(entry())).toEqual(["member-requested"]);
  });
});

describe("the queue", () => {
  const held = buildNotice(entry({ date: "2026-09-19" }), at(SUNDAY));
  const sent = buildNotice(entry({ date: "2026-09-14" }), at("2026-09-14"));

  it("keeps one notice per day and updates the reasons", () => {
    const first = upsertNotice([], held, at(SUNDAY));
    const second = upsertNotice(
      first,
      buildNotice(
        entry({ date: "2026-09-19", missedTreatment: true }),
        at(SUNDAY, 18),
      ),
      at(SUNDAY, 18),
    );

    expect(second).toHaveLength(1);
    expect(second[0].reasons).toEqual(["missed-treatment"]);
    // The clinic's record of when it was first raised does not move.
    expect(second[0].raisedAt).toBe(held.raisedAt);
  });

  it("will not rewrite a notice the clinic has already read", () => {
    const next = upsertNotice(
      [sent],
      buildNotice(
        entry({ date: "2026-09-14", missedTreatment: true }),
        at(TUESDAY),
      ),
      at(TUESDAY),
    );
    expect(next).toEqual([sent]);
  });

  it("lets a member call back a send the clinic has not seen", () => {
    expect(withdrawNotice([held], "2026-09-19", at(SUNDAY))).toEqual([]);
  });

  it("will not pretend a delivered notice was never sent", () => {
    expect(withdrawNotice([sent], "2026-09-14", at(TUESDAY))).toEqual([sent]);
  });

  it("drops everything for a day the member deletes", () => {
    expect(removeNotice([sent], "2026-09-14")).toEqual([]);
  });

  it("lists what is still waiting, soonest first", () => {
    const later: ClinicNotice = {
      ...held,
      checkInDate: "x",
      deliverOn: "2026-09-22",
    };
    expect(pendingNotices([later, held, sent], at(SUNDAY))).toEqual([
      held,
      later,
    ]);
  });
});
