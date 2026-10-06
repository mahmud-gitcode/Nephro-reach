import { readJson, sampleOr, storageKey, writeJson } from "@/lib/data/storage";
import { ORGANIZATIONS } from "@/features/staff/staff";

/* ==========================================================================
   The member's care offices — Member Settings
   --------------------------------------------------------------------------
   The client (2026-10-05): Settings carries the member's Dialysis Center,
   Vascular Access Center, Nephrology Office and Primary Care Office, and
   each feeds back to the tabs that use it.

   The dialysis center is the record the app already used (travel planner,
   Contact My Dialysis Clinic, the enrolled-clinic check), so it is edited
   in place there; the other three are kept here. Offices on NephroReach
   can be picked from a list; any other office is typed in.
   ========================================================================== */

export type CareOffice = {
  /** "" when not set. */
  name: string;
  phone: string;
  address: string;
};

export type CareContacts = {
  vascular: CareOffice;
  nephrology: CareOffice;
  /** Added 2026-10-06 with secure messages to outside offices. */
  transplant: CareOffice;
  primaryCare: CareOffice;
};

export type CareContactKind = keyof CareContacts | "dialysis";

const EMPTY_OFFICE: CareOffice = { name: "", phone: "", address: "" };

export const EMPTY_CONTACTS: CareContacts = {
  vascular: EMPTY_OFFICE,
  nephrology: EMPTY_OFFICE,
  transplant: EMPTY_OFFICE,
  primaryCare: EMPTY_OFFICE,
};

/** The NephroReach offices a member can pick, by kind. */
export function networkOffices(kind: CareContactKind): string[] {
  const portal =
    kind === "dialysis"
      ? "clinic"
      : kind === "vascular"
        ? "access"
        : kind === "nephrology"
          ? "nephrology"
          : null;
  return portal
    ? ORGANIZATIONS.filter((o) => o.portal === portal).map((o) => o.name)
    : [];
}

/** The demo patient's offices, so the sample account is filled in. */
const SAMPLE: CareContacts = {
  vascular: {
    name: "Metro Vascular Access Center",
    phone: "(803) 555-0142",
    address: "450 Vein Way, Columbia, SC 29203",
  },
  nephrology: {
    name: "Riverside Nephrology Associates",
    phone: "(803) 555-0119",
    address: "88 Kidney Court, Columbia, SC 29204",
  },
  /* Not on NephroReach: the demo's Free Recipient office. */
  transplant: {
    name: "Lakeside Transplant Center",
    phone: "(803) 555-0166",
    address: "12 Harbor View Drive, Columbia, SC 29205",
  },
  primaryCare: EMPTY_OFFICE,
};

const KEY = storageKey("care-contacts");

function office(value: unknown): CareOffice {
  const raw = (value ?? {}) as Partial<CareOffice>;
  return {
    name: typeof raw.name === "string" ? raw.name : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    address: typeof raw.address === "string" ? raw.address : "",
  };
}

export async function readCareContacts(): Promise<CareContacts> {
  const stored = await readJson<Partial<CareContacts> | null>(KEY, null);
  if (!stored) return sampleOr(KEY, SAMPLE, EMPTY_CONTACTS);
  return {
    vascular: office(stored.vascular),
    nephrology: office(stored.nephrology),
    /* Saved before this office existed: the demo patient gets the sample. */
    transplant: stored.transplant
      ? office(stored.transplant)
      : sampleOr(KEY, SAMPLE.transplant, EMPTY_OFFICE),
    primaryCare: office(stored.primaryCare),
  };
}

export async function writeCareContacts(
  contacts: CareContacts,
): Promise<CareContacts> {
  const clean = (o: CareOffice) => ({
    name: o.name.trim(),
    phone: o.phone.trim(),
    address: o.address.trim(),
  });
  return writeJson(KEY, {
    vascular: clean(contacts.vascular),
    nephrology: clean(contacts.nephrology),
    transplant: clean(contacts.transplant),
    primaryCare: clean(contacts.primaryCare),
  });
}
