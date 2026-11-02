/* The API throttles per IP: login 10/min, register 5/min, google + nonce 10/min
   (int/w2-be-auth auth-session.controller.ts:75,103,150,169; decorators are
   hard-coded, not env-driven). Every test runs from one IP, so the suite paces
   itself instead of asking for a weaker test API. Call before each such request.
   Tests that deliberately hit the limit (lockout) call reset() afterwards and
   wait a full window. */
const WINDOW_MS = 60_000;
const LIMITS = { login: 9, register: 4, google: 9 } as const; // one below the server's
const sent: Record<keyof typeof LIMITS, number[]> = {
  login: [],
  register: [],
  google: [],
};

export async function pace(kind: keyof typeof LIMITS): Promise<void> {
  for (;;) {
    const now = Date.now();
    sent[kind] = sent[kind].filter((t) => now - t < WINDOW_MS);
    if (sent[kind].length < LIMITS[kind]) {
      sent[kind].push(now);
      return;
    }
    await new Promise((r) =>
      setTimeout(r, sent[kind][0] + WINDOW_MS - now + 100),
    );
  }
}

/** After a test that exhausted a bucket on purpose. */
export async function drain(kind: keyof typeof LIMITS): Promise<void> {
  sent[kind] = Array(LIMITS[kind]).fill(Date.now());
}
