/* TOTP codes via the backend's own otplib (13.5.0, ESM functional API, same
   one the server verifies with: backend src/core/auth/services/totp.service.ts:8).
   Resolved from E2E_BACKEND_DIR so the frontend gains NO new dependency. */
import { createRequire } from "node:module";
import path from "node:path";
import { env } from "./env";

type Otplib = {
  generateSync?: (o: { secret: string; epoch?: number }) => string;
  generate?: (o: { secret: string; epoch?: number }) => Promise<string>;
};

let lib: Otplib | null = null;
function otplib(): Otplib {
  if (lib) return lib;
  if (!env.backendDir)
    throw new Error("E2E_BACKEND_DIR is required for TOTP tests");
  const req = createRequire(path.join(env.backendDir, "package.json"));
  lib = req("otplib") as Otplib; // package.json main = dist/index.cjs
  return lib;
}

const STEP = 30;

/** Code for the current 30 s step. */
export async function totpNow(
  secret: string,
  at: number = Date.now(),
): Promise<string> {
  const o = otplib();
  // Verified 2026-11-02 against backend node_modules/otplib 13.5.0:
  // generateSync({ secret, epoch }) with epoch in seconds.
  const epoch = Math.floor(at / 1000);
  if (o.generateSync) return o.generateSync({ secret, epoch });
  if (o.generate) return o.generate({ secret, epoch });
  throw new Error("otplib generate API not found");
}

/** A step not used before in this process: the server refuses a replayed
 *  step for 90 s (auth-lockout.constants.ts totpReplayTtlSeconds), so a second
 *  login with the same secret must wait for the next step. */
const usedSteps = new Map<string, number>();
export async function freshTotp(secret: string): Promise<string> {
  for (;;) {
    const step = Math.floor(Date.now() / 1000 / STEP);
    if ((usedSteps.get(secret) ?? -1) < step) {
      usedSteps.set(secret, step);
      return totpNow(secret);
    }
    const msLeft = (step + 1) * STEP * 1000 - Date.now() + 250;
    await new Promise((r) => setTimeout(r, msLeft));
  }
}

/** A code that is NOT valid now (outside the ±1 step window). */
export async function staleTotp(secret: string): Promise<string> {
  return totpNow(secret, Date.now() - 10 * STEP * 1000);
}
