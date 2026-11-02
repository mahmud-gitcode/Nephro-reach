/* ==========================================================================
   The idle and absolute session limits, from the client's side (D2)
   --------------------------------------------------------------------------
   The server enforces the limits (spec 025): patient and caregiver 30 min
   idle / 12 h, staff 15 min / 8 h, platform 10 min / 4 h, all set by env.
   This timer only warns before them and notices when they have passed.

   The contract it keeps (spec 025 §5):
   - It reads the deadlines from `GET /auth/session`, the one passive route:
     reading it never extends the session, and the API client never
     refreshes on it (a refresh is activity). So an idle tab stays idle.
   - Local activity with no API call (typing a long form, scrolling) keeps
     the session alive with one ordinary authenticated request
     (`GET /auth/me`) once the deadline is near, at most once per step.
   - It re-reads before warning and before ending: another tab may have
     kept the session alive, and the server is the clock.
   - Nothing here polls on a short interval. One timer per deadline.

   Pure apart from the injected dependencies, so fake timers can test it.
   ========================================================================== */

import { isApiError, SESSION_ENDED_CODE } from "@/lib/api/client";
import type { CurrentSession } from "./auth.types";

const SECOND = 1000;

const END_CODES: readonly string[] = [
  SESSION_ENDED_CODE,
  "auth.account_no_longer_available",
];

/** Client constants derived from the server's limits (not business rules). */
export function timings(session: CurrentSession) {
  const idle = session.idleTimeoutSeconds * SECOND;
  const maxAge = session.maxAgeSeconds * SECOND;
  return {
    /** Show the warning this long before the idle deadline. */
    warnLead: Math.min(120 * SECOND, idle * 0.2),
    /** Clock skew allowance until the API sends its own time (B2). */
    skew: Math.min(30 * SECOND, idle * 0.05),
    /** Local activity this close to the deadline sends a keep-alive. */
    keepAliveWindow: idle / 3,
    /** At most one keep-alive per step (the server writes at most once per
     *  min(60 s, idle / 10)). */
    touchStep: Math.max(5 * SECOND, Math.min(60 * SECOND, idle / 10)),
    /** Warn this long before the absolute limit (nothing extends it). */
    absoluteLead: Math.min(5 * 60 * SECOND, maxAge * 0.1),
    /** Check a little after a deadline, so the server has passed it too. */
    grace: 2 * SECOND,
  };
}

export type SessionTimerDeps = {
  /** GET /auth/session (passive, never refreshes). */
  read: () => Promise<CurrentSession>;
  /** An ordinary authenticated request (activity; may refresh). */
  touch: () => Promise<unknown>;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
  /** Open the idle warning; `deadline` is the idle limit. */
  onWarn: (deadline: Date) => void;
  /** Close the idle warning (another tab or "stay signed in" extended it). */
  onClear: () => void;
  /** The non-blocking notice before the absolute limit. */
  onAbsoluteWarn: (deadline: Date) => void;
  /** The session is over: clear and go to /login?reason=expired. */
  onExpire: () => void;
};

type ReadResult = "ok" | "ended" | "unknown";

export class SessionTimer {
  private session: CurrentSession | null = null;
  private timers: unknown[] = [];
  private lastTouch = 0;
  private warning = false;
  private absoluteWarned = false;
  private stopped = false;
  private readonly now: () => number;
  private readonly setTimer: (fn: () => void, ms: number) => unknown;
  private readonly clearTimer: (handle: unknown) => void;

  constructor(private readonly deps: SessionTimerDeps) {
    this.now = deps.now ?? (() => Date.now());
    this.setTimer =
      deps.setTimer ?? ((fn, ms) => globalThis.setTimeout(fn, ms));
    this.clearTimer =
      deps.clearTimer ??
      ((handle) =>
        globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>));
  }

  /** Whether the idle warning is open. */
  get warningOpen(): boolean {
    return this.warning;
  }

  get current(): CurrentSession | null {
    return this.session;
  }

  async start(): Promise<void> {
    this.stopped = false;
    this.lastTouch = this.now();
    if ((await this.read()) === "ok") this.schedule();
  }

  stop(): void {
    this.stopped = true;
    this.clearAll();
  }

  /** Local activity in this tab (pointer, key, scroll), throttled by the
   *  caller. It never dismisses an open warning: that needs a choice. */
  noteActivity(): void {
    if (this.stopped || this.warning || !this.session) return;
    const t = this.now();
    const { keepAliveWindow, touchStep } = timings(this.session);
    const left = this.session.idleExpiresAt.getTime() - t;
    if (left > keepAliveWindow || t - this.lastTouch < touchStep) return;
    this.lastTouch = t;
    void this.keepAlive();
  }

  /** "Stay signed in". */
  async stayActive(): Promise<void> {
    this.lastTouch = this.now();
    await this.keepAlive();
  }

  /** The tab became visible again (a sleeping laptop): re-read. */
  async visible(): Promise<void> {
    if (this.stopped) return;
    const result = await this.read();
    if (result !== "ok") return;
    if (this.warning && !this.withinWarning()) {
      this.warning = false;
      this.deps.onClear();
    }
    this.schedule();
  }

  /* -------------------------------------------------------- internals */

  private async keepAlive(): Promise<void> {
    try {
      await this.deps.touch();
    } catch {
      /* A failed refresh ends the session through the API client; any other
         failure (offline) leaves the deadlines as they were. */
      return;
    }
    if ((await this.read()) !== "ok" || this.stopped) return;
    if (this.warning) {
      this.warning = false;
      this.deps.onClear();
    }
    this.schedule();
  }

  private async read(): Promise<ReadResult> {
    try {
      this.session = await this.deps.read();
      return "ok";
    } catch (error) {
      if (
        isApiError(error, { status: 401 }) &&
        error.code !== null &&
        END_CODES.includes(error.code)
      ) {
        this.end();
        return "ended";
      }
      /* A bare 401 (the access cookie expired and, by design, this read
         does not refresh it) or a network error: keep what we knew. */
      return "unknown";
    }
  }

  private end(): void {
    if (this.stopped) return;
    this.stop();
    this.deps.onExpire();
  }

  private withinWarning(): boolean {
    if (!this.session) return false;
    const { warnLead, skew } = timings(this.session);
    return this.session.idleExpiresAt.getTime() - this.now() <= warnLead + skew;
  }

  private clearAll(): void {
    for (const handle of this.timers) this.clearTimer(handle);
    this.timers = [];
  }

  private at(when: number, fn: () => void): void {
    this.timers.push(this.setTimer(fn, Math.max(0, when - this.now())));
  }

  private schedule(): void {
    this.clearAll();
    if (this.stopped || !this.session) return;
    const { warnLead, skew, absoluteLead, grace } = timings(this.session);
    const idleEnd = this.session.idleExpiresAt.getTime();
    const absoluteEnd = this.session.absoluteExpiresAt.getTime();
    if (!this.warning) this.at(idleEnd - warnLead - skew, () => this.warnDue());
    this.at(Math.min(idleEnd, absoluteEnd) + grace, () => this.endDue());
    if (!this.absoluteWarned)
      this.at(absoluteEnd - absoluteLead, () => this.absoluteDue());
  }

  private async warnDue(): Promise<void> {
    const result = await this.read();
    if (result === "ended" || this.stopped) return;
    if (result === "ok" && !this.withinWarning()) {
      this.schedule();
      return;
    }
    if (!this.session) return;
    this.warning = true;
    this.deps.onWarn(this.session.idleExpiresAt);
  }

  private absoluteDue(): void {
    if (this.stopped || !this.session) return;
    this.absoluteWarned = true;
    this.deps.onAbsoluteWarn(this.session.absoluteExpiresAt);
  }

  private async endDue(): Promise<void> {
    const result = await this.read();
    if (result === "ended" || this.stopped) return;
    if (
      result === "ok" &&
      this.session &&
      this.session.idleExpiresAt.getTime() > this.now()
    ) {
      /* Another tab kept the session alive. */
      if (this.warning && !this.withinWarning()) {
        this.warning = false;
        this.deps.onClear();
      }
      this.schedule();
      return;
    }
    /* The passive read could not say (the access cookie expired). Ask the
       server with an ordinary request: if the session is over, the refresh
       is refused and the API client ends the session; if another tab kept
       it alive, the refresh succeeds and the deadlines move. */
    try {
      await this.deps.touch();
    } catch {
      if (!this.stopped) this.at(this.now() + 15 * SECOND, () => this.endDue());
      return;
    }
    if ((await this.read()) === "ok" && !this.stopped) {
      if (this.warning) {
        this.warning = false;
        this.deps.onClear();
      }
      this.schedule();
    }
  }
}
