import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import type { CurrentSession } from "./auth.types";
import { SessionTimer, timings } from "./sessionTimer";

/* The server is the clock (spec 025 §5). These tests drive the timer with
   fake timers and a fake server whose idle deadline moves only on
   "activity" (touch), never on the passive read. */

const IDLE = 900; // staff tier, seconds
const MAX = 28_800;

function fakeServer(start: number) {
  let idleEnd = start + IDLE * 1000;
  const absoluteEnd = start + MAX * 1000;
  let ended = false;
  const session = (): CurrentSession => ({
    tier: "staff",
    idleTimeoutSeconds: IDLE,
    maxAgeSeconds: MAX,
    idleExpiresAt: new Date(idleEnd),
    absoluteExpiresAt: new Date(absoluteEnd),
  });
  const over = () =>
    ended || Date.now() >= idleEnd || Date.now() >= absoluteEnd;
  return {
    read: vi.fn(async () => {
      if (over()) {
        ended = true;
        throw new ApiError(401, "x", "auth.session_no_longer_active");
      }
      return session();
    }),
    touch: vi.fn(async () => {
      if (over()) {
        ended = true;
        throw new ApiError(401, "x", "auth.session_no_longer_active");
      }
      idleEnd = Date.now() + IDLE * 1000;
    }),
  };
}

function makeTimer(server: ReturnType<typeof fakeServer>) {
  const events = {
    onWarn: vi.fn(),
    onClear: vi.fn(),
    onAbsoluteWarn: vi.fn(),
    onExpire: vi.fn(),
  };
  const timer = new SessionTimer({ ...server, ...events });
  return { timer, events };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-02T10:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SessionTimer", () => {
  it("warns before the idle limit, then expires at it", async () => {
    const server = fakeServer(Date.now());
    const { timer, events } = makeTimer(server);
    await timer.start();
    const { warnLead, skew } = timings(await server.read());

    await vi.advanceTimersByTimeAsync(IDLE * 1000 - warnLead - skew - 1000);
    expect(events.onWarn).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2000);
    expect(events.onWarn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(warnLead + skew + 5000);
    expect(events.onExpire).toHaveBeenCalledTimes(1);
    timer.stop();
  });

  /* The bug this guards against: polling GET /auth/session would count as
     activity and keep an idle tab alive forever. The read must not touch. */
  it("never sends activity from the passive read alone", async () => {
    const server = fakeServer(Date.now());
    const { timer } = makeTimer(server);
    await timer.start();
    await vi.advanceTimersByTimeAsync(IDLE * 1000 + 10_000);
    expect(server.touch).not.toHaveBeenCalled();
    expect(server.read).toHaveBeenCalled();
    timer.stop();
  });

  /* No false logout: local activity near the deadline keeps the session
     alive with one ordinary request per step, for longer than the limit. */
  it("keeps an active user signed in past the idle limit", async () => {
    const server = fakeServer(Date.now());
    const { timer, events } = makeTimer(server);
    await timer.start();
    for (let elapsed = 0; elapsed < IDLE * 2_500; elapsed += 30_000) {
      timer.noteActivity();
      await vi.advanceTimersByTimeAsync(30_000);
    }
    expect(events.onExpire).not.toHaveBeenCalled();
    expect(events.onWarn).not.toHaveBeenCalled();
    expect(server.touch).toHaveBeenCalled();
    /* At most one keep-alive per step, not one per event. */
    expect(server.touch.mock.calls.length).toBeLessThan(
      (IDLE * 2_500) / 60_000 + 2,
    );
    timer.stop();
  });

  it("'stay signed in' closes the warning and moves the deadline", async () => {
    const server = fakeServer(Date.now());
    const { timer, events } = makeTimer(server);
    await timer.start();
    await vi.advanceTimersByTimeAsync(IDLE * 1000 - 30_000);
    expect(timer.warningOpen).toBe(true);
    await timer.stayActive();
    expect(events.onClear).toHaveBeenCalled();
    expect(timer.warningOpen).toBe(false);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(events.onExpire).not.toHaveBeenCalled();
    timer.stop();
  });

  it("ends at once when the server says the session is over", async () => {
    const server = fakeServer(Date.now());
    server.read.mockRejectedValueOnce(
      new ApiError(401, "x", "auth.account_no_longer_available"),
    );
    const { timer, events } = makeTimer(server);
    await timer.start();
    expect(events.onExpire).toHaveBeenCalledTimes(1);
  });

  /* A bare 401 is an expired access cookie (the passive read does not
     refresh): not proof the session ended. */
  it("does not end on a bare 401 from the passive read", async () => {
    const server = fakeServer(Date.now());
    server.read.mockRejectedValueOnce(new ApiError(401, "x", null));
    const { timer, events } = makeTimer(server);
    await timer.start();
    expect(events.onExpire).not.toHaveBeenCalled();
    timer.stop();
  });
});
