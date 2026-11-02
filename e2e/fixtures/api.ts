/* API helpers for SETUP and server-side assertions (never the journey under
   test). Bearer transport (`X-Auth-Transport: bearer`) returns the tokens at
   the response root and sets no cookie, so the browser context stays clean.
   The 2FA challenge also sits at the root: { challengeId, methods }. */
import {
  request,
  type APIRequestContext,
  type APIResponse,
} from "@playwright/test";
import { appOrigin, env, type Account } from "./env";
import { pace } from "./throttle";

export type MeContext = {
  user: {
    id: string;
    email: string | null;
    isAccountVerified: boolean;
    mfaEnabled: boolean;
    mfaSetupRequired: boolean;
  };
  patient: { id: string; firstName: string; lastName: string } | null;
  caregiving: Array<{ grantId: string; patientId: string }>;
  memberships: Array<{
    organizationId: string;
    organizationName: string;
    organizationType: string;
    role: string;
    isOwner: boolean;
  }>;
  platform: unknown;
};

type Json = Record<string, unknown>;

/** A token from the bearer token DTO, whatever it names it. */
function tokenOf(tokens: Json | undefined, kind: "access" | "refresh") {
  if (!tokens) return null;
  for (const key of [`${kind}Token`, `${kind}_token`]) {
    if (typeof tokens[key] === "string") return tokens[key] as string;
  }
  const nested = tokens[kind] as { token?: string } | undefined;
  return nested?.token ?? null;
}

export class ApiClient {
  private constructor(
    readonly ctx: APIRequestContext,
    private access: string | null,
    private refresh: string | null,
    readonly account: Account | null,
  ) {}

  static async anonymous(): Promise<ApiClient> {
    return new ApiClient(await request.newContext(), null, null, null);
  }

  /** Password login with bearer transport; finishes a TOTP challenge. */
  static async login(
    account: Account,
    opts: { totp?: () => Promise<string> } = {},
  ): Promise<ApiClient> {
    const ctx = await request.newContext();
    await pace("login");
    const res = await ctx.post(`${env.apiURL}/auth/login`, {
      headers: { "X-Auth-Transport": "bearer" },
      data: { email: account.email, password: account.password },
    });
    const body = await json(res, `login ${account.email}`);
    let tokens = body.tokens as Json | undefined;
    if (!tokens && body.challengeId) {
      if (!opts.totp) throw new Error(`${account.email} needs 2FA`);
      const v = await ctx.post(`${env.apiURL}/auth/2fa/challenge/verify`, {
        headers: { "X-Auth-Transport": "bearer" },
        data: {
          challengeId: body.challengeId,
          type: "TOTP",
          code: await opts.totp(),
        },
      });
      tokens = (await json(v, "2fa verify")).tokens as Json | undefined;
    }
    const access = tokenOf(tokens, "access");
    if (!access) throw new Error(`no bearer tokens for ${account.email}`);
    return new ApiClient(ctx, access, tokenOf(tokens, "refresh"), account);
  }

  headers(orgId?: string): Record<string, string> {
    const h: Record<string, string> = { Origin: appOrigin };
    if (this.access) h.Authorization = `Bearer ${this.access}`;
    if (orgId) h["X-Organization-Id"] = orgId;
    return h;
  }

  get(path: string, orgId?: string) {
    return this.ctx.get(`${env.apiURL}${path}`, {
      headers: this.headers(orgId),
    });
  }

  post(path: string, data?: unknown, orgId?: string) {
    return this.ctx.post(`${env.apiURL}${path}`, {
      headers: this.headers(orgId),
      data,
    });
  }

  delete(path: string, orgId?: string) {
    return this.ctx.delete(`${env.apiURL}${path}`, {
      headers: this.headers(orgId),
    });
  }

  async context(): Promise<MeContext> {
    return (await json(await this.get("/me/context"), "me/context"))
      .data as MeContext;
  }

  async logout(): Promise<void> {
    if (!this.access) return;
    await this.post(
      "/auth/logout",
      this.refresh ? { refreshToken: this.refresh } : undefined,
    );
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose();
  }
}

/** The JSON body of a successful response. Errors report the status only:
 *  a body could carry a token. */
export async function json(res: APIResponse, what: string): Promise<Json> {
  if (!res.ok()) throw new Error(`${what}: HTTP ${res.status()}`);
  return (await res.json()) as Json;
}
