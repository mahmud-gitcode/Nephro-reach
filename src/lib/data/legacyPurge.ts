/* ==========================================================================
   Legacy storage purge (staged; ADR 0007, INTEGRATION_PROGRESS deviations)
   --------------------------------------------------------------------------
   The prototype kept patient data, demo passwords and a demo session in
   this browser. As each part moves to the API, its old keys must go, so no
   stale health data or credential lingers in a browser that used the
   prototype.

   It is staged on purpose. Until a feature moves to the API, its
   localStorage key IS its data, so purging every `nr:*` key now would break
   live screens. Instead:
   - a registry lists RETIRED keys; a phase adds its feature's keys in the
     same change that moves the feature to the API (Phase 2 added the demo
     credentials and the demo session cookie, and strips the demo passwords
     from the staff accounts that stay live until Phase 3);
   - the purge removes only retired keys, in every per-member and
     per-caregiver variant, and never a live one;
   - `preferred_language` and the version marker are always kept.
   The end state (Phase 15) is: only `preferred_language` and the marker.

   It runs on boot, sign-in and sign-out. It is cheap and idempotent, so it
   runs every time rather than only when the marker is old: an older tab can
   still write a retired key after this tab purged it.
   ========================================================================== */

/** Survives every purge. */
export const STORAGE_VERSION_KEY = "nr:storage-version";

/** Bumped whenever the registry below grows. */
export const STORAGE_VERSION = 13;

/** Never removed. */
export const KEPT_KEYS: readonly string[] = [
  "preferred_language",
  STORAGE_VERSION_KEY,
];

type RetiredStore = {
  /** The store name, as passed to storageKey() (without `nr:`). */
  name: string;
  /** STORAGE_VERSION that retired it. */
  since: number;
  /** Why it is safe to delete: the evidence it is dead. */
  why: string;
};

/**
 * Member stores no screen reads or writes any more. Each name removes
 * `nr:<name>`, the per-member copies `nr:member:<email>:<name>` and the
 * caregiver's empty view `nr:caregiver-none:<name>`.
 */
export const RETIRED_STORES: readonly RetiredStore[] = [
  {
    name: "medication-mood",
    since: 1,
    why: "Mood section removed from the medications page (PROJECT_AUDIT §14). No component reads moodEntries/moodOn or calls saveMoodEntry; whether mood returns is D8, and it would come from the API, never from this key.",
  },
  {
    name: "quick-actions",
    since: 3,
    why: "Phase 4: quick actions are saved on the account (GET/PUT /me/preferences quickActions). No screen reads this key.",
  },
  {
    name: "fluid-unit",
    since: 3,
    why: "Phase 4: the fluid unit is the account preference (GET/PUT /me/preferences fluidUnit). No screen reads this key.",
  },
  {
    name: "member-tour-done",
    since: 3,
    why: "Phase 4: the tour is finished on the account (POST /me/preferences/tour-completed, tourCompletedAt). No screen reads this key.",
  },
  {
    name: "my-health",
    since: 3,
    why: "Phase 4: allergies and medical history come from /patients/:id/allergies and /medical-conditions; the sample record (health.seed.ts) is deleted. No screen reads this key.",
  },
  {
    name: "profile-emergency-contact",
    since: 3,
    why: "Phase 4: the emergency contact is /patients/:id/emergency-contact (null = not set). No screen reads this key.",
  },
  {
    name: "care-contacts",
    since: 3,
    why: "Phase 4: care offices are /patients/:id/care-contacts (one per kind); the sample offices are deleted. No screen reads this key.",
  },
  {
    name: "dialysis-clinic",
    since: 3,
    why: "Phase 4: the home dialysis clinic is /patients/:id/home-dialysis-clinic (linked by organizationId, onNephroReach from the server). travel/useDialysisClinic delegates to the API hook; the demo clinic (clinic.seed.ts) is deleted. No screen reads this key.",
  },
  {
    name: "healthcare-team",
    since: 3,
    why: "Phase 4: the team is /patients/:id/care-team-contacts (invite and remove only; no member accept, INT-14). No screen reads this key.",
  },
  {
    name: "exercise-log",
    since: 4,
    why: "Phase 5: exercise notes are /patients/:id/exercise (one call per note). No screen reads this key.",
  },
  {
    name: "care-team-questions",
    since: 4,
    why: "Phase 5: questions are /patients/:id/care-team-questions; the sample questions (questions.seed.ts) are deleted. No screen reads this key.",
  },
  {
    name: "er-visits",
    since: 4,
    why: "Phase 5: weekly ER answers are /patients/:id/er-visits (the week from /summary, the server's calendar); the sample history is deleted. No screen reads this key.",
  },
  {
    name: "blood-pressure-readings",
    since: 4,
    why: "Phase 5: readings are /patients/:id/blood-pressure (photos by file id through /files, never data: URLs); SEED_READINGS is deleted. No screen reads this key.",
  },
  {
    name: "bp-reminders",
    since: 4,
    why: "Phase 5: check times are one BLOOD_PRESSURE reminder on /patients/:id/reminders. No screen reads this key.",
  },
  {
    name: "nutrition-foods",
    since: 4,
    why: "Phase 5: foods are /patients/:id/nutrition/foods. No screen reads this key.",
  },
  {
    name: "nutrition-fluids",
    since: 4,
    why: "Phase 5: fluids are /patients/:id/nutrition/fluids (sent in the unit tapped; the server's amountMl). No screen reads this key.",
  },
  {
    name: "nutrition-goals",
    since: 4,
    why: "Phase 5: goals are /patients/:id/nutrition/goals (the server owns the defaults). No screen reads this key.",
  },
  {
    name: "weight-fluid-log",
    since: 4,
    why: "Phase 5: one entry per day on /patients/:id/weight-fluid (PUT by date); the demo entries (fluid.seed.ts) are deleted. No screen reads this key.",
  },
  {
    name: "between-treatment-check-ins",
    since: 4,
    why: "Phase 5: check-ins are /patients/:id/check-ins (id-based; 409 on a written day recovered as a PUT). No screen reads this key.",
  },
  {
    name: "clinic-notices",
    since: 4,
    why: "Phase 5: the server builds each clinic notice from a check-in saved with notifyClinic and returns it on the check-in. No screen reads this key.",
  },
  {
    name: "member-medications",
    since: 5,
    why: "Phase 6: the list is /patients/:id/medications (server ids, status, refill flag, photo by file id, server change history); the sample list (medications.seed.ts) is deleted. No screen reads this key.",
  },
  {
    name: "medication-doses",
    since: 5,
    why: "Phase 6: dose statuses are PUT /patients/:id/medications/:medicationId/doses, keyed by (medication id, day, HH:mm). The old rows were keyed by medication NAME and a 12-hour time; they are never matched to an API medication. No screen reads this key.",
  },
  {
    name: "medication-refills",
    since: 5,
    why: "Phase 6: the refill flag is needsRefill on the medication (PATCH by id). No screen reads this key.",
  },
  {
    name: "medication-side-effects",
    since: 5,
    why: "Phase 6: side effects are PUT /patients/:id/medications/:medicationId/side-effects (null clears). No screen reads this key.",
  },
  {
    name: "medication-reminders",
    since: 5,
    why: "Phase 6: reminders are /patients/:id/reminders?kind=MEDICATION, one per medication id, times HH:mm; the sample reminders (reminders.seed.ts) are deleted. No screen reads this key.",
  },
  {
    name: "custom-lab-results",
    since: 5,
    why: "Phase 6: each typed draw is one POST /patients/:id/labs (rows; a new draw never overwrites the last). No screen reads this key.",
  },
  {
    name: "clinic-labs-seen",
    since: 5,
    why: "Phase 6: seen is seenByPatientAt on the care team results (POST /patients/:id/labs/seen, patient only). No screen reads this key.",
  },
  {
    name: "dialysis-modality",
    since: 7,
    why: "Phase 7: the dialysis type is the prescription (GET/POST/PATCH /patients/:id/dialysis/prescription; 404 = not set; memberCanEdit from the server). No screen reads this key.",
  },
  {
    name: "dialysis-schedule",
    since: 7,
    why: "Phase 7: schedule periods are /patients/:id/dialysis/schedule (POST appends a dated period). The typical week shows only after a successful empty read and is never saved. No screen reads this key.",
  },
  {
    name: "dialysis-treatments",
    since: 7,
    why: "Phase 7: treatments are /patients/:id/dialysis/treatments (HH:mm times, kg-only weights, post-symptoms saved); the sample sessions (mockDialysisEntries) are deleted. No screen reads this key.",
  },
  {
    name: "treatment-medications",
    since: 7,
    why: "Phase 7: medications given are /patients/:id/dialysis/treatment-medications (givenOn YYYY-MM-DD, linked by treatment id); the sample rows (treatmentMedications.seed.ts) are deleted and old display-date rows are not imported. No screen reads this key.",
  },
  {
    name: "dialysis-pd-exchanges",
    since: 7,
    why: "Phase 7: PD exchanges are /patients/:id/dialysis/pd-exchanges, read per day; ultrafiltration comes from the server. No screen reads this key.",
  },
  {
    name: "dialysis-home-system",
    since: 7,
    why: "Phase 7: the home system is /patients/:id/dialysis/home-system (PUT; the server's checks). No screen reads this key.",
  },
  {
    name: "dialysis-home-visits",
    since: 7,
    why: "Phase 7: home visits are /patients/:id/dialysis/home-visits. No screen reads this key.",
  },
  {
    name: "dialysis-supplies",
    since: 7,
    why: "Phase 7: supply months are /patients/:id/dialysis/supplies/{yyyy-mm} (PUT the month). No screen reads this key.",
  },
  {
    name: "provider-orders",
    since: 7,
    why: "Phase 7: provider orders are /patients/:id/dialysis/provider-orders (remindAt sent as an instant with an offset). No screen reads this key.",
  },
  {
    name: "dialysis-access-photos",
    since: 7,
    why: "Phase 7: access photos are uploaded through /files and kept by file id on /patients/:id/dialysis/access-photos, opened through a short-lived link. The old rows held data: URL images; nothing renders them. No screen reads this key.",
  },
  {
    name: "dialysis-urine-output",
    since: 7,
    why: "Phase 7: no screen reads or writes this key (the Urine Output section was removed 2026-10-05); urine output is /patients/:id/urine-output on the check-in. Removed so its old rows do not linger.",
  },
  /* Phase 12 (COLLAB, STORAGE_VERSION 8): community, reviews, Table Talk,
     library and testimonials are the API's (BE modules/content). */
  {
    name: "community-reviews",
    since: 8,
    why: "Phase 12: reviews are POST /reviews and GET /me/reviews (the author is the account, no email); moderators use /platform/content/reviews; the landing banner reads GET /public/reviews into memory. The sample reviews (reviews.seed.ts) are deleted. No screen reads this key.",
  },
  {
    name: "community-moderation-queue",
    since: 8,
    why: "Phase 12: posts are POST /community/posts (the server screens and holds every post) and the queue is /platform/content/community/posts; held photos were data: URLs and are gone. No screen reads this key.",
  },
  {
    name: "community-likes",
    since: 8,
    why: "Phase 12: likes are PUT/DELETE /me/community/likes/:postId; likedByMe and likeCount come with each post. Member-owned: the per-member copies go too. No screen reads this key.",
  },
  {
    name: "table-talk-episodes",
    since: 8,
    why: "Phase 12: episodes are /table-talk/episodes (live only) and /platform/content/table-talk/episodes; the sample episodes (tableTalk.seed.ts) are deleted. No screen reads this key.",
  },
  {
    name: "table-talk-categories",
    since: 8,
    why: "Phase 12: categories are /table-talk/categories (server uuids, episode counts) and /platform/content/table-talk/categories. No screen reads this key.",
  },
  {
    name: "table-talk-questions",
    since: 8,
    why: "Phase 12: questions are POST /table-talk/questions (no name or email sent) and /platform/content/table-talk/questions. Member-owned: the per-member copies go too. No screen reads this key.",
  },
  {
    name: "table-talk-favorites",
    since: 8,
    why: "Phase 12: favorites are PUT/DELETE /me/table-talk/favorites/:episodeId (by id, not slug); `favorite` comes with each episode. Member-owned: the per-member copies go too. No screen reads this key.",
  },
  {
    name: "library-resources",
    since: 8,
    why: "Phase 12: the shelf is /library (published only) and /platform/content/library; posters were data: URLs and the sample shelf (library.seed.ts) is deleted. No screen reads this key.",
  },
  {
    name: "library-saved",
    since: 8,
    why: "Phase 12: saves are PUT/DELETE /me/library/saves/:resourceId (by id, not slug); `saved` comes with each item. Member-owned: the per-member copies go too. No screen reads this key.",
  },
  {
    name: "video-testimonials",
    since: 8,
    why: "Phase 12: stories are GET /public/testimonials, GET /me/testimonials and POST /testimonials (video through /files by id); the stored entries held dead blob: URLs and member emails; the samples (testimonials.seed.ts) are deleted. No screen reads this key.",
  },
  /* Phase 13 (EDU-BIZ, STORAGE_VERSION 9): education and live classes are
     the API's. */
  {
    name: "classroom-learner",
    since: 9,
    why: "Phase 13: lesson answers, exam attempts and certificates are the learner record on /patients/:id/education/courses/:courseId (attempts scored by the server, certificates only from POST …/certificate). The old rows held client-scored attempts and self-issued certificates; nothing reads them. No screen reads this key.",
  },
  {
    name: "journey-progress",
    since: 9,
    why: "Phase 13: class progress is the learner record (open, watched, complete, reopen per class id). No screen reads this key.",
  },
  {
    name: "journey-notes",
    since: 9,
    why: "Phase 13: notes are PUT /patients/:id/education/classes/:classId/note, read from the learner record. No screen reads this key.",
  },
  /* Phase 8 (OFFICE, STORAGE_VERSION 13; the lane used 7, renumbered at
     merge): travel logs, reflections and ride contacts are the API's. */
  {
    name: "travel-treatments",
    since: 13,
    why: "Phase 8: the travel dialysis log is /patients/:id/trips/:tripId/treatments (one call per row, readings as typed); the sample rows (trip.seed.ts) are deleted. No screen reads this key.",
  },
  {
    name: "travel-reflections",
    since: 13,
    why: "Phase 8: the trip reflection is GET/PUT /patients/:id/trips/:tripId/reflection; the sample reflections (trip.seed.ts) are deleted. No screen reads this key.",
  },
  {
    name: "rides",
    since: 13,
    why: "Phase 8: ride contacts are /patients/:id/ride-contacts (the server keeps one primary); the sample contact (rides.seed.ts) is deleted. No screen reads this key.",
  },
  /* Phase 9 (OFFICE lane B, STORAGE_VERSION 10): office labs, CCM and the
     condition library are the API's (BE modules/labs, modules/ccm). */
  {
    name: "clinic-labs",
    since: 10,
    why: "Phase 9: office lab charts are GET /patients/:id/labs as the office (403 when labs are not shared); CSV uploads are POST /organizations/:orgId/lab-imports (text in a JSON body, reviewed server-side, confirm/cancel). The demo charts (labs.data.ts seedLabs) are deleted; the member side already reads its clinic results from the API (Phase 6). No screen reads this key.",
  },
  {
    name: "clinic-ccm",
    since: 10,
    why: "Phase 9: CCM enrolments, requirements, kidney care, activities and the inbox are /organizations/:orgId/ccm/* by patientId; the seeded patients, activities and inbox (ccm.data.ts seedCcmState) and the member feed folded into it (memberFeed.ts) are deleted. No screen reads this key.",
  },
  {
    name: "ccm-condition-library",
    since: 10,
    why: "Phase 9: the condition library is GET/POST/PUT/PATCH/DELETE /organizations/:orgId/ccm/conditions. No screen reads this key.",
  },
  /* Phase 11 (COLLAB, STORAGE_VERSION 12): messaging, outside shares and
     support are the API's. */
  {
    name: "support-tickets",
    since: 12,
    why: "Phase 11: tickets are /me/support-tickets (the requester) and /platform/support-tickets (the NephroReach team), with server uuids; organization requests are /platform/support-info-requests, so `contacted` is gone too. The stored tickets held requesters' names and emails. No screen reads this key.",
  },
  {
    name: "messaging",
    since: 12,
    why: "Phase 11: member and office conversations are /patients/:id/conversations and /organizations/:id/conversations (found by id, never by a member's name; read, flag and archive state per thread on the server; the after-hours reply is the server's). The stored threads held patients' messages, names, MRNs and data: attachments. No screen reads this key.",
  },
  {
    name: "outside-shares",
    since: 12,
    why: "Phase 11: outside shares are /patients/:id/outside-shares and /organizations/:id/outside-shares; the link is made and emailed by the server and opened through /shared/:token with an emailed code and a share session held in memory only. The stored shares held link tokens, recipients' emails and data: attachments. No screen reads this key.",
  },
  /* Phase 10 (OFFICE, STORAGE_VERSION 11): vascular access, rides and
     referrals are the API's (BE modules/vascular-access). */
  {
    name: "vascular-access",
    since: 11,
    why: "Phase 10: access records are /patients/:id/access-profiles and /organizations/:id/access-profiles (several per patient, the viewer's party from the server, private messages sent hidden), rides are …/transport and the office queue /organizations/:id/transport, referrals are /organizations/:id/referrals with directory ids. The old key held every patient's record in one browser, matched by MRN and name, with data: URL photos; the seed (seedAccessState) is deleted. No screen reads this key.",
  },
];

/** The prototype's demo session: an unsigned, editable JSON cookie that
 *  decided who was signed in. Retired in Phase 2 (`GET /me/context` is the
 *  session source); expired here and by the proxy. */
export const LEGACY_SESSION_COOKIE = "nr-session";

/** Exact keys (not member stores) that are retired. */
export const RETIRED_KEYS: readonly string[] = [
  /* Phase 2: the prototype's registered accounts, with plain-text
     passwords. Sign-up goes to POST /auth/register now. */
  "nr-registered-users",
  /* Phase 3 (STORAGE_VERSION 6): the client role matrix each organisation
     edited in this browser. Permissions are the server's membership levels
     (GET /me/context) and the role editor writes PUT /roles/permissions. */
  "nr:role-permissions",
  /* Phase 3: the staff list kept in this browser. Staff come from
     GET /organizations/:id/staff; people are invited (D3), never created
     here with a password. */
  "nr:staff-accounts",
  /* Phase 3: caregiver grants with their invite ids (link secrets). Grants
     come from /patients/:id/caregivers and /me/context caregiving[]. */
  "nr:caregiver-grants",
  /* Phase 13 (STORAGE_VERSION 9): the course catalogue every browser
     edited. Courses are GET /courses (published, blinded for members) and
     /platform/courses (the content team). */
  "nr:course-library",
  /* Phase 13: the live-class schedule, recording links and settings kept in
     this browser. They are /live-classes, /platform/live-classes and
     /platform/live-class-settings. */
  "nr:clinic-live-class",
  /* Phase 8 (STORAGE_VERSION 13): the office roster enrolled in this
     browser (names and MRNs). The roster is GET /organizations/:id/patients
     joined with its program enrollments; enrolling is two API calls. */
  "nr:clinic-enrollments",
  /* Phase 8: every patient's trip requests, shared by the member and office
     screens (addresses, insurance ids, emergency contacts). Trips are
     /patients/:id/trips and /organizations/:id/trips. */
  "nr:travel-trip-requests",
];

/** Key prefixes that are retired in every variant (one key per user). */
export const RETIRED_PREFIXES: readonly string[] = [
  /* Phase 3: the patient a caregiver had chosen, per caregiver email. The
     choice is the in-memory portal context now. */
  "nr:caregiver-viewing:",
];

/** Cookies to expire. */
export const RETIRED_COOKIES: readonly string[] = [LEGACY_SESSION_COOKIE];

/**
 * Stores that stay live but must lose fields. Each entry names the key and
 * the fields stripped from every object in its array. Empty since Phase 3:
 * `nr:staff-accounts` (whose demo passwords Phase 2 stripped) is retired
 * outright above.
 */
export const STRIPPED_FIELDS: readonly { key: string; fields: string[] }[] = [];

/** Whether a localStorage key belongs to a retired store or is retired. */
export function isRetiredKey(key: string): boolean {
  if (KEPT_KEYS.includes(key)) return false;
  if (RETIRED_KEYS.includes(key)) return true;
  if (RETIRED_PREFIXES.some((prefix) => key.startsWith(prefix))) return true;
  if (!key.startsWith("nr:")) return false;
  return RETIRED_STORES.some(
    ({ name }) =>
      key === `nr:${name}` ||
      key === `nr:caregiver-none:${name}` ||
      (key.startsWith("nr:member:") && key.endsWith(`:${name}`)),
  );
}

export type PurgeResult = { removed: string[]; version: number };

/** Removes `fields` from each object in the JSON array at `key`. Returns
 *  whether anything changed. Unreadable data is removed outright: it may
 *  hold a field this cannot see. */
function stripFields(storage: Storage, key: string, fields: string[]): boolean {
  const raw = storage.getItem(key);
  if (raw === null) return false;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    storage.removeItem(key);
    return true;
  }
  if (!Array.isArray(parsed)) {
    storage.removeItem(key);
    return true;
  }
  let changed = false;
  const cleaned = parsed.map((item: unknown) => {
    if (!item || typeof item !== "object") return item;
    const copy = { ...(item as Record<string, unknown>) };
    for (const field of fields) {
      if (field in copy) {
        delete copy[field];
        changed = true;
      }
    }
    return copy;
  });
  if (changed) storage.setItem(key, JSON.stringify(cleaned));
  return changed;
}

function storageOrNull(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Removes every retired key and cookie and writes the version marker.
 * Never throws: blocked storage simply has nothing to purge.
 */
export function purgeLegacyStorage(
  storage: Storage | null = storageOrNull(),
): PurgeResult {
  const removed: string[] = [];
  if (storage) {
    try {
      const keys: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key !== null) keys.push(key);
      }
      for (const key of keys) {
        if (isRetiredKey(key)) {
          storage.removeItem(key);
          removed.push(key);
        }
      }
      for (const { key, fields } of STRIPPED_FIELDS) {
        if (stripFields(storage, key, fields)) removed.push(`${key}#fields`);
      }
      storage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
    } catch {
      /* Blocked or full storage: nothing more we can do here. */
    }
  }
  if (typeof document !== "undefined") {
    for (const name of RETIRED_COOKIES) {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
  }
  return { removed, version: STORAGE_VERSION };
}
