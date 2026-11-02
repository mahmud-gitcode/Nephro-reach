/* The API throttles per IP: login 10/min, register 5/min, google + nonce 10/min
   2FA challenge verify 10/min (auth-session.controller.ts,
   auth-two-factor.controller.ts; decorators are hard-coded, not env-driven).
   Every test runs from one IP, so the suite paces itself instead of asking
   for a weaker test API. Call before each such request.
   The send times live in a small file, not in memory: Playwright starts a
   new worker after a failed test, and a fresh in-memory count would let the
   next tests burst into 429s. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const WINDOW_MS = 60_000;
const LIMITS = { login: 9, register: 4, google: 9, twofa: 9 } as const; // one below the server's
type Kind = keyof typeof LIMITS;
type Sent = Record<Kind, number[]>;

function file(): string {
  const port = new URL(process.env.E2E_API_URL ?? "http://localhost:0").port;
  return (
    process.env.E2E_THROTTLE_FILE ??
    path.join(os.tmpdir(), `nr-e2e-throttle-${port}.json`)
  );
}

function load(): Sent {
  try {
    const raw = JSON.parse(fs.readFileSync(file(), "utf8")) as Partial<Sent>;
    return {
      login: raw.login ?? [],
      register: raw.register ?? [],
      google: raw.google ?? [],
      twofa: raw.twofa ?? [],
    };
  } catch {
    return { login: [], register: [], google: [], twofa: [] };
  }
}

function save(sent: Sent): void {
  fs.writeFileSync(file(), JSON.stringify(sent));
}

export async function pace(kind: Kind): Promise<void> {
  for (;;) {
    const now = Date.now();
    const sent = load();
    sent[kind] = sent[kind].filter((t) => now - t < WINDOW_MS);
    if (sent[kind].length < LIMITS[kind]) {
      sent[kind].push(now);
      save(sent);
      return;
    }
    await new Promise((r) =>
      setTimeout(r, sent[kind][0] + WINDOW_MS - now + 100),
    );
  }
}

/** After a test that exhausted a bucket on purpose. */
export async function drain(kind: Kind): Promise<void> {
  const sent = load();
  sent[kind] = Array(LIMITS[kind]).fill(Date.now());
  save(sent);
}
