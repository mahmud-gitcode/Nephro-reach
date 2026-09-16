import { readJson, storageKey, writeJson } from "@/lib/data/storage";

/* ==========================================================================
   The member's emergency contact
   --------------------------------------------------------------------------
   One person, kept on the profile rather than on any single record.

   Before this, the Before-the-ER screen showed an "Emergency contact" button
   that was permanently disabled, with a comment in the source saying it had
   nowhere to read a number from. A member reaching that screen is having the
   worst moment this app will ever be present for, and the one button that
   would help them did nothing.

   A travel request also collects an emergency contact, but that one belongs
   to a trip: it is who the receiving unit calls while the member is away.
   This is who gets called at home, and the two can legitimately differ.
   ========================================================================== */

export interface ProfileEmergencyContact {
  name: string;
  phone: string;
  /** "Daughter", "Neighbour" — who they are to the member. */
  relationship: string;
}

export const emptyEmergencyContact = (): ProfileEmergencyContact => ({
  name: "",
  phone: "",
  relationship: "",
});

/**
 * Usable means there is a number to ring.
 *
 * A name with no number is worse than nothing on this screen: it looks
 * answered, and it cannot be dialled.
 */
export function canCall(contact: ProfileEmergencyContact): boolean {
  return contact.phone.trim().length > 0;
}

/** Strips a number down to what a `tel:` link can dial. */
export function dialable(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

/** "Denise Park · Daughter" — who is about to be called. */
export function describeContact(contact: ProfileEmergencyContact): string {
  return [contact.name.trim(), contact.relationship.trim()]
    .filter(Boolean)
    .join(" · ");
}

const KEY = storageKey("profile-emergency-contact");

export async function readEmergencyContact(): Promise<ProfileEmergencyContact> {
  const stored = await readJson<Partial<ProfileEmergencyContact> | null>(
    KEY,
    null,
  );
  return { ...emptyEmergencyContact(), ...(stored ?? {}) };
}

export async function writeEmergencyContact(
  contact: ProfileEmergencyContact,
): Promise<ProfileEmergencyContact> {
  return writeJson(KEY, contact);
}
