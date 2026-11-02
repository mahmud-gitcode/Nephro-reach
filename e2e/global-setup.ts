/* Fails fast when the agent env is not up or is the wrong one. Never starts
   servers (integration-tools does that). */
import fs from "node:fs";
import { request } from "@playwright/test";

export default async function globalSetup() {
  const api = process.env.E2E_API_URL!.replace(/\/$/, "");
  const ctx = await request.newContext();
  try {
    const live = await ctx.get(`${api}/health/liveness`);
    if (!live.ok())
      throw new Error(`API not live at ${api} (${live.status()})`);
    const ready = await ctx.get(`${api}/health/readiness`);
    if (!ready.ok())
      throw new Error(`API not ready (DB/Redis) at ${api} (${ready.status()})`);
    const fe = await ctx
      .get(process.env.E2E_BASE_URL!, { maxRedirects: 0 })
      .catch(() => null);
    if (!fe)
      throw new Error(`frontend not reachable at ${process.env.E2E_BASE_URL}`);
  } finally {
    await ctx.dispose();
  }
  const mail = process.env.E2E_MAIL_DIR;
  if (mail && !fs.existsSync(mail)) {
    throw new Error(
      `E2E_MAIL_DIR ${mail} does not exist: start smtp-sink.mjs for this env first`,
    );
  }
}
