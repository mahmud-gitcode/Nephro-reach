# 7. A per-record data layer for the API (amends ADR 0001)

**Status:** accepted
**Date:** 2026-11-02
**Amends:** [0001](./0001-async-data-layer-before-the-backend.md). The async boundary and `AsyncSection` stay. This ADR changes what goes through that boundary now that the API is connected.

## Context

ADR 0001 put an async boundary in front of `localStorage` so that screens would have loading and error states before the API arrived. It did that. But almost every hook was written as one pattern: read the whole array, transform it, save the whole array (INT-8; e.g. `useBloodPressure`, `useTrips`, `useWeightLog`). That pattern fits a single browser's storage. It does not fit the API:

- **The API is per record.** `POST /patients/:id/blood-pressure`, `PATCH …/:readingId`, `DELETE …/:readingId`. There is no "save my whole log".
- **Several writers.** An office and the member can both write the same patient's records. A whole-array write from a stale copy overwrites the other side's changes. It also loses the server's revision history (a lab correction is a new revision, not an overwrite).
- **Diffing arrays in a repository** to turn them back into per-record calls is fragile and unsafe. A missed delete becomes a resurrected record, and a reordered list becomes a burst of updates.

The review also found four ways the current screens would show the wrong thing once data comes over the network:

- errors that look like empty data (INT-10);
- defaults (`DEFAULT_SCHEDULE`, `DEFAULT_GOALS`) shown when the read failed;
- cache keys that don't say whose data or which context (INT-6);
- lists read whole, with no paging.

## Decision

### 1. Per-record mutations

Every feature repository exposes one function per server operation, and hooks call them one record at a time:

```ts
// repository
export const addReading = (scope: PatientScope, draft: BpDraft) =>
  api<BpReading>(`/patients/${scope.patientId}/blood-pressure`, {
    method: "POST",
    body: draft,
  });
export const updateReading = (scope, id, patch) => api(…, { method: "PATCH", body: patch });
export const removeReading = (scope, id) => api(…, { method: "DELETE" });

// hook
useMutation({
  mutationFn: (draft) => addReading(scope, draft),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: patientKey(scope, "blood-pressure") }),
});
```

- **No whole-array writes.** A `save*(all)` function that takes a full list is not allowed in a repository that talks to the API.
- **Rules stay pure.** Functions like `bloodPressure.ts` `addReading(current, draft)` remain for validation and for display. They don't decide what is stored.
- After a write, the hook **invalidates** the affected queries. It doesn't write the cache by hand, so the server's answer (ids, revisions, who entered it) is what shows. An optimistic update is allowed only when its rollback is written and tested.

### 2. Query keys

Every patient-data query key holds both the patient id and the organization context. Use `@/lib/data/queryKeys`:

- `patientKey({ patientId, organizationId }, feature, …rest)` gives `["patient", patientId, "org", organizationId | "self", feature, …]`;
- `orgKey(organizationId, feature, …rest)` gives `["org", organizationId, feature, …]`.

`organizationId` is `null` (the key shows `"self"`) for the patient and for caregivers. The helpers throw on an empty id, so a key can't silently drop it. Switching office or patient goes through `switchPortalContext`, which also clears the cache.

### 3. Paging and windows

The API pages every list: `page`/`limit` or `cursor`/`limit`, default 10, maximum 150. Dated logs also take `from`/`to` (inclusive, `YYYY-MM-DD`). A screen asks for a page or a window of days, never "everything". Use `@/lib/api/paging`:

- `pageQuery()` shapes the query: never `page` together with `cursor`, the limit clamped to 1–150, and the day window checked;
- `fetchPage()` returns `{ items, pagination }`;
- `nextPageParams()` is the `getNextPageParam` for `useInfiniteQuery`;
- `lastDays(n)` gives the usual window for charts and logs.

A chart reads the API's `summary`/`trends` routes where they exist, rather than paging through raw rows.

### 4. Uploads

All uploads go through `uploadFile(file, { visibility? })` in `@/lib/api/upload`:

1. `POST /files/upload-url`;
2. a PUT to `upload.url` with **every** header from `upload.headers`, and without cookies;
3. `POST /files/:id/complete`.

`uploadFile` returns the file id, and only the id is kept.

- **The storage key** is never read or stored.
- **The client checks** mirror the server's allowlist (no SVG or HTML) and its 10 MB cap. The server checks again.
- **PUBLIC** is requested only from content-team pages.
- **The storage host** must be in the CSP (`NEXT_PUBLIC_STORAGE_ORIGIN`). `uploadFile` refuses a presigned URL for any other host. The production storage host is decision D18.

### 5. Error is not empty, and 403 is not "no data"

- **Hooks expose** `isPending`, `error`, `isError` and `refetch`. Pages render through `AsyncSection` (error, then loading, then empty, then content), or through `combineReads(...)` when a page needs several reads.
- **A default** (a typical schedule, default goals, sample data) may stand in only when the read _succeeded_ and returned nothing. It never stands in for a failed read.
- **`ApiError` carries** `status` and the server's `code` (spec 019 §4). A 403 (`isForbidden`) shows "not shared with you / no access". It never shows cached or placeholder data, and the 403 is not retried (`QueryProvider` doesn't retry 4xx). Screens branch on `code` where it exists and on the status otherwise.

### 6. Session end and storage

- **The API client sends `X-Organization-Id` only in office mode.** That is `setActiveOrganization(id)`, through `switchPortalContext`. A patient or caregiver call never carries the header.
- **When the session ends** (401 `auth.session_no_longer_active`, or a failed refresh), the app calls `onSessionEnded` once. It clears the query caches, purges retired storage, broadcasts on `nr-auth`, and goes to `/login?reason=expired`.
- **Sign-out** calls `POST /auth/logout` (best effort, 3 s cap), then does the same clean-up and a full reload.
- **The legacy storage purge** (`@/lib/data/legacyPurge`) runs on boot, sign-in and sign-out. It is **staged**: it removes only keys in its retired registry and writes the `nr:storage-version` marker. Each phase that moves a feature to the API adds that feature's keys to the registry in the same change. The end state is only `preferred_language` plus the marker.

## What this rules out

- `save*(wholeArray)` functions in API repositories, and diffing arrays to recover per-record calls.
- Query keys without the patient and organization.
- Reading an unbounded list.
- Any upload path other than `uploadFile`, and `data:` URLs of uploaded files.
- Showing defaults, samples or cached data after a failed read or a 403.

## Consequences

- Each feature's move to the API rewrites its repository and hook (Phases 4–14). The pure rules functions and the pages mostly stay.
- Pages show a skeleton for the moment a read is in flight, and an error state when it fails. That's the only visible change Phase 1 brings.
- Until a feature moves, its `localStorage` key is still its data, so the purge leaves it alone.

## Revisit when

- the API offers batch endpoints for a feature, which would make a multi-record write one server operation; or
- the portal is server-rendered against the API, where query keys and cache clearing move to the server boundary.
