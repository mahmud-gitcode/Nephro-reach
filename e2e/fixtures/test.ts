/* The extended `test` every spec imports:
   - blocked: third-party requests attempted (the test fails if any);
   - api(account): a bearer ApiClient for setup, logged out afterwards;
   - asUser(account): a fresh, isolated browser context with a cookie session;
   - storageClean(page): the storage-dump assertion.
   Every context gets the third-party block (D18). */
import {
  test as base,
  expect,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { ApiClient } from "./api";
import type { Account } from "./env";
import { blockThirdParty, type BlockedLog } from "./network";
import { cookieSession } from "./session";
import { expectCleanStorage, type StorageRule } from "./storage";
import { freshTotp } from "./totp";

type Fixtures = {
  blocked: BlockedLog;
  api: (account: Account, opts?: { totpSecret?: string }) => Promise<ApiClient>;
  asUser: (
    account: Account,
    opts?: { totpSecret?: string },
  ) => Promise<{ context: BrowserContext; page: Page }>;
  storageClean: (page: Page, rule?: StorageRule) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  blocked: async ({}, provide) => {
    const log: BlockedLog = [];
    await provide(log);
    expect(log, `third-party requests attempted:\n${log.join("\n")}`).toEqual(
      [],
    );
  },

  context: async ({ context, blocked }, provide) => {
    await blockThirdParty(context, blocked);
    await provide(context);
  },

  api: async ({}, provide) => {
    const made: ApiClient[] = [];
    await provide(async (account, opts) => {
      const secret = opts?.totpSecret;
      const client = await ApiClient.login(
        account,
        secret ? { totp: () => freshTotp(secret) } : {},
      );
      made.push(client);
      return client;
    });
    for (const client of made) {
      await client.logout().catch(() => undefined);
      await client.dispose();
    }
  },

  asUser: async ({ browser, blocked }, provide) => {
    const contexts: BrowserContext[] = [];
    await provide(async (account, opts) => {
      const context = await browser.newContext();
      contexts.push(context);
      await blockThirdParty(context, blocked);
      await cookieSession(context, account, opts);
      const page = await context.newPage();
      return { context, page };
    });
    for (const context of contexts) await context.close();
  },

  storageClean: async ({}, provide) => {
    await provide((page, rule) =>
      expectCleanStorage(page, page.context(), rule),
    );
  },
});

export { expect };

/** Skip a test whose env need is not met, saying which. */
export function requireEnv(flag: boolean, why: string): void {
  test.skip(!flag, why);
}
