# 6. A frontend security baseline before the API is connected

**Status:** accepted
**Date:** 2026-11-01

## Context

NephroReach handles patient health information. A three-part review on 2026-11-01 covered injection, auth and storage, and configuration and the supply chain. The backend's matching work is spec 018 in `Nephro-reach-backend/specs/`.

What the review found:

- **No script-injection sink exists today.** There is no `dangerouslySetInnerHTML`, no raw HTML, no eval and no open redirect, and React escapes everything it renders.
- **The real risks are elsewhere:**
  - a critical Next.js advisory that bypasses the proxy (`next` ≤ 16.4.0);
  - no security headers;
  - URLs from stored data used as links without a scheme check;
  - formula injection in CSV exports;
  - the prototype's own design: demo login with an unsigned, editable session cookie, and patient data in localStorage.

The prototype design can only be fixed by connecting the API, and the feature screens must not change before then.

## Decision

The baseline below is what every page keeps from now on.

1. **Headers (`next.config.ts`):**
   - an enforced CSP that lists only what the app uses (self, the API origin, `blob:`/`data:` media, the YouTube no-cookie and Vimeo players);
   - `frame-ancestors 'none'` plus `X-Frame-Options: DENY`, `nosniff`, `strict-origin-when-cross-origin`, a narrow `Permissions-Policy`, COOP, and HSTS in production;
   - no `X-Powered-By`;
   - portal, share and invite pages also get `private, no-store` and `noindex`; share and invite pages get `no-referrer`, because their URL holds a secret.

   Adding a new external origin means adding it to the CSP on purpose, and disclosing it under the agreement (§5/§9).

2. **URLs from data go through `@/lib/utils/safeUrl`.** Use `isSafeLinkUrl` for links and `isSafeFileUrl` for files. No `javascript:`, and no `data:` types a browser runs as a page.
3. **CSV goes through `csvCell` / `toCsv` (`@/lib/utils/download`).** Formula text gets a leading apostrophe; numbers stay numbers.
4. **Sign-out:**
   - clears the API client state;
   - tells the other tabs (`BroadcastChannel("nr-auth")`), and a portal tab that hears it reloads into the sign-in check;
   - a portal page restored from the back/forward cache reloads.
5. **The API client (`@/lib/api/client`):**
   - cookies only, so no token is visible to JavaScript;
   - one shared refresh, never on code or password routes;
   - `onSessionEnded` for the app to clear data and route to sign-in;
   - production requires `NEXT_PUBLIC_API_URL`.
6. **Dependencies:** `next` is pinned to a release with no known advisory, and `npm audit --omit=dev` must stay at 0. The dev-only `minimatch` advisory inside ESLint is accepted: the fix is a major ESLint change, and the tool reads only our own globs.

## Integration checklist (security, in order)

The demo mechanisms are replaced in this order. Each step removes a risk recorded in `PROJECT_AUDIT.md` §8 F.

1. Deploy the frontend and the API **same-site over HTTPS** (e.g. `app.` / `api.nephroreach.com`), with `FRONTEND_URL` exact. The cookies are `SameSite=Lax` and the API refuses cookie writes from any other origin.
2. **Login, register and Google** go to `POST /auth/login`, `/auth/register` and `/auth/oauth/google`. Delete `DEMO_ACCOUNTS`, the stored passwords (`nr-registered-users`, staff accounts) and the one-click "Google" demo login.
3. **Staff MFA screens** (challenge, enrolment, sudo): production refuses staff without MFA.
4. **Session source:** `GET /me/context` replaces the `nr-session` cookie. The proxy only checks that an API session cookie exists, as a UX hint; `DashboardGuard` routes by `/me/context`. The server decides every permission.
5. **Office context:** `setActiveOrganization` takes the membership the user picked, and patients and caregivers send none. `userCan` comes from membership role maps.
6. **Caregivers** switch patients from `caregiving[]`. Delete the localStorage grants and viewing keys.
7. **Repositories** call `api()`. Query keys include the patient and organization ids. Uploads go through `/files` (send every `upload.headers` on the PUT); no `data:` URLs. Use ids, not MRNs, in page URLs.
8. **Session end:** register `onSessionEnded`. It clears the query cache, broadcasts sign-out, and goes to `/login?reason=expired`. Add an idle warning before the staff limit (30 min idle, 12 h total).
9. **Sign-out** calls `POST /auth/logout` (offer "sign out everywhere"), clears `nr:*` storage and the cache, broadcasts, and does a full reload.
10. **Secure share and caregiver invite** pages use the public `/shared/:token` and `/invitations` API routes. Delete the client-side email "verification".
11. **Re-test the cross-user cases** with two accounts in one browser, plus the CSP crawl and the API's isolation probe.

## Consequences

- Any new third-party embed, font or script fails in the browser until it is added to the CSP. That is the point.
- `'unsafe-inline'` stays for scripts (Next's inline bootstrap on static pages; a nonce would make all 93 routes dynamic) and for styles (`style={}`). Revisit with a nonce for `/dashboard` only once the portal is server-rendered against the API.
- Until integration step 4, the UI's role checks are cosmetic: the session cookie can be edited. Only synthetic data may be used.
