/* ==========================================================================
   D6 registration consent: the adapter point (PENDING BACKEND SUPPORT)
   --------------------------------------------------------------------------
   Decision D6 (user, 2026-11-02): registration requires explicit acceptance
   of the current Terms of Service and Privacy Notice, recorded server-side
   with the document versions, the timestamp and the account. Marketing
   consent is optional and separate.

   The backend does not accept a consent field yet (BE-AUTH-2, spec 030). It
   refuses unknown fields (`forbidNonWhitelisted`), so until it does the
   registration page keeps its terms checkbox as a client-side gate and
   sends NO consent field. This file is the one place that changes when the
   contract lands:

   1. set `CONSENT_SUPPORTED` to true;
   2. return the versions from the agreed source (D6: "confirm with Joni"
      the document versioning source) in `registrationConsent()`;
   3. match the field names to spec 030.

   Pending acceptance item: "consent record written at registration".
   ========================================================================== */

/** Flip when BE-AUTH-2 (spec 030) is merged. */
export const CONSENT_SUPPORTED = false;

export type RegistrationConsent = {
  termsVersion: string;
  privacyVersion: string;
  marketingOptIn: boolean;
};

/** The consent object to send with registration, or undefined while the
 *  backend has no consent contract. `agreed` is the terms checkbox. */
export function registrationConsent(
  agreed: boolean,
): RegistrationConsent | undefined {
  if (!CONSENT_SUPPORTED || !agreed) return undefined;
  return {
    termsVersion: process.env.NEXT_PUBLIC_TERMS_VERSION ?? "",
    privacyVersion: process.env.NEXT_PUBLIC_PRIVACY_VERSION ?? "",
    marketingOptIn: false,
  };
}
