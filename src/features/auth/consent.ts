/* ==========================================================================
   D6 registration consent (backend spec 030, legal documents spec 032)
   --------------------------------------------------------------------------
   Decision D6 (user, 2026-11-02): registration requires explicit acceptance
   of the current Terms of Service and Privacy Notice, recorded server-side
   with the document versions, the timestamp and the account. Marketing
   consent is optional and separate, and registration consent is never
   permission for any health-data disclosure.

   The contract (spec 030 §1, §4):
   - the versions are the ones the form showed, read from the public
     `GET /legal/documents/current` (never from a build-time variable, so a
     newly published version can't be accepted under an old number);
   - the body carries `consent: { termsVersion, privacyVersion }`. The
     existing registration form has one checkbox (Terms) and no marketing
     box, so no marketing choice is sent: left out, the server records none,
     which reads as opted out. A marketing opt-in is a separate, later choice
     (`PUT /me/consents/marketing`), never bundled with registration;
   - unticked means no consent object at all: the server refuses with
     `auth.consent_required` and creates no account.

   Server answers the page maps (authErrors.ts): `auth.consent_required`,
   `legal.consent_version_outdated` (reload and ask again), 503
   `legal.legal_documents_unavailable`.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { isSafeLinkUrl } from "@/lib/utils/safeUrl";

/** On since BE-AUTH-2 (spec 030) was merged into int/lead (15dedc3). */
export const CONSENT_SUPPORTED = true;

export type LegalDocumentType = "TERMS" | "PRIVACY";

/** One current document, as `GET /legal/documents/current` lists it. */
export type CurrentLegalDocument = {
  type: LegalDocumentType | string;
  version: string;
  title: string;
  effectiveAt: string;
  contentUrl: string | null;
};

export type RegistrationConsent = {
  termsVersion: string;
  privacyVersion: string;
};

/** `GET /legal/documents/current` (public, no office header). */
export function fetchCurrentLegalDocuments(): Promise<CurrentLegalDocument[]> {
  return api<CurrentLegalDocument[]>("/legal/documents/current", {
    organizationId: null,
  });
}

/** The consent body for the current documents, or null when Terms or
 *  Privacy is missing (the server would answer 503 anyway). Pure. */
export function consentFor(
  documents: readonly CurrentLegalDocument[],
): RegistrationConsent | null {
  const version = (type: LegalDocumentType) =>
    documents.find((d) => d.type === type)?.version?.trim() || null;
  const termsVersion = version("TERMS");
  const privacyVersion = version("PRIVACY");
  if (!termsVersion || !privacyVersion) return null;
  return { termsVersion, privacyVersion };
}

/** Where the registration text links each current document (D44). */
export type LegalDocumentLinks = {
  terms: string | null;
  privacy: string | null;
};

/** The current Terms and Privacy Notice links, from the same
 *  `GET /legal/documents/current` list the consent versions come from (no
 *  hardcoded version or address). A missing, empty or unsafe `contentUrl`
 *  (anything but http(s) or a path on this site) gives null, so the page
 *  never renders a `javascript:` or `data:` href from stored data. Pure. */
export function legalDocumentLinks(
  documents: readonly CurrentLegalDocument[],
): LegalDocumentLinks {
  const link = (type: LegalDocumentType) => {
    const url = documents.find((d) => d.type === type)?.contentUrl?.trim();
    return isSafeLinkUrl(url) ? url : null;
  };
  return { terms: link("TERMS"), privacy: link("PRIVACY") };
}

/**
 * The consent object to send with registration. `agreed` is the terms
 * checkbox: unticked sends nothing, so the server refuses the sign-up.
 * Reads the current versions at submit time; when no current Terms or
 * Privacy is published it sends nothing and the server answers with its
 * own refusal (shown by the page), never a guessed version.
 */
export async function registrationConsent(
  agreed: boolean,
  read: () => Promise<CurrentLegalDocument[]> = fetchCurrentLegalDocuments,
): Promise<RegistrationConsent | undefined> {
  if (!CONSENT_SUPPORTED || !agreed) return undefined;
  return consentFor(await read()) ?? undefined;
}
