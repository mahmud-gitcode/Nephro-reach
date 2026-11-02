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

/** The staff demo list's office names, by kind. The member screens pick
 *  from the API directory since Phase 4 (`directory.ts`); this stays only
 *  for Share Outside (COLLAB lane) until that screen moves. */
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

/* ---------------------------------------------------------------- API
   `GET /patients/:id/care-contacts` answers an array of the kinds that are
   saved; `PUT/DELETE …/care-contacts/:kind` writes one office. The screen
   keeps its object of four offices; a missing kind is an empty office. */

export type OfficeKind = keyof CareContacts;

export type ApiCareContact = {
  id: string;
  patientId: string;
  kind: "vascular" | "nephrology" | "transplant" | "primary-care";
  name: string;
  phone: string;
  address: string;
  updatedAt: string;
};

const API_KIND: Record<OfficeKind, ApiCareContact["kind"]> = {
  vascular: "vascular",
  nephrology: "nephrology",
  transplant: "transplant",
  primaryCare: "primary-care",
};

export function toApiKind(kind: OfficeKind): ApiCareContact["kind"] {
  return API_KIND[kind];
}

export function fromApiCareContacts(
  rows: readonly ApiCareContact[] | null,
): CareContacts {
  const contacts: CareContacts = { ...EMPTY_CONTACTS };
  for (const row of rows ?? []) {
    const kind = (Object.keys(API_KIND) as OfficeKind[]).find(
      (k) => API_KIND[k] === row.kind,
    );
    if (!kind) continue;
    contacts[kind] = {
      name: row.name ?? "",
      phone: row.phone ?? "",
      address: row.address ?? "",
    };
  }
  return contacts;
}

/** Saving one office: a PUT with a name, or a DELETE when it was cleared. */
export function careContactWrite(
  office: CareOffice,
):
  | { kind: "put"; body: { name: string; phone?: string; address?: string } }
  | { kind: "delete" } {
  const name = office.name.trim();
  if (!name) return { kind: "delete" };
  const phone = office.phone.trim();
  const address = office.address.trim();
  return {
    kind: "put",
    body: {
      name,
      ...(phone ? { phone } : {}),
      ...(address ? { address } : {}),
    },
  };
}
