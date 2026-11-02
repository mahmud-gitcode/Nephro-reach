import { describe, expect, it, vi } from "vitest";
import {
  CONSENT_SUPPORTED,
  consentFor,
  registrationConsent,
  type CurrentLegalDocument,
} from "./consent";
import { authErrorKind, authErrorPath } from "./authErrors";
import { ApiError } from "@/lib/api/client";

/* D6 (spec 030): the registration body carries the CURRENT Terms and
   Privacy versions read from the server at submit time, only when the box
   is ticked, and never a marketing choice bundled with sign-up. Synthetic
   documents only. */

const doc = (type: string, version: string): CurrentLegalDocument => ({
  type,
  version,
  title: `${type} (synthetic)`,
  effectiveAt: "2026-11-01T00:00:00.000Z",
  contentUrl: null,
});

describe("registration consent (D6)", () => {
  it("is switched on now that the backend contract is merged", () => {
    expect(CONSENT_SUPPORTED).toBe(true);
  });

  it("sends the current Terms and Privacy versions, nothing else", async () => {
    const read = vi.fn(async () => [doc("PRIVACY", "3"), doc("TERMS", "7")]);
    const consent = await registrationConsent(true, read);
    expect(consent).toEqual({ termsVersion: "7", privacyVersion: "3" });
    /* Marketing is a separate, optional choice (D6): never in this body. */
    expect(consent).not.toHaveProperty("marketingOptIn");
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("sends no consent when the box is not ticked, and reads nothing", async () => {
    const read = vi.fn(async () => [doc("TERMS", "1"), doc("PRIVACY", "1")]);
    expect(await registrationConsent(false, read)).toBeUndefined();
    expect(read).not.toHaveBeenCalled();
  });

  it("never guesses a version when a document is not published", () => {
    expect(consentFor([doc("TERMS", "1")])).toBeNull();
    expect(consentFor([doc("TERMS", " "), doc("PRIVACY", "1")])).toBeNull();
    expect(consentFor([])).toBeNull();
  });

  it("lets a failed read of the documents fail the sign-up (no account without consent)", async () => {
    const read = vi.fn(async () => {
      throw new ApiError(
        503,
        "unavailable",
        "legal.legal_documents_unavailable",
      );
    });
    await expect(registrationConsent(true, read)).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("maps the server's consent refusals to their own messages", () => {
    const required = new ApiError(400, "x", "auth.consent_required");
    const outdated = new ApiError(400, "x", "legal.consent_version_outdated");
    const none = new ApiError(503, "x", "legal.legal_documents_unavailable");
    expect(authErrorKind(required)).toBe("consent-required");
    expect(authErrorPath(required)).toBe("errors.consentRequired");
    expect(authErrorPath(outdated)).toBe("errors.consentOutdated");
    expect(authErrorPath(none)).toBe("errors.registrationUnavailable");
  });
});
