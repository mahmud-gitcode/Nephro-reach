import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import { authErrorKind, authErrorPath } from "./authErrors";

describe("authErrorKind", () => {
  it.each([
    [new ApiError(401, "x", "auth.invalid_credentials"), "invalid-credentials"],
    [new ApiError(401, "x", null), "invalid-credentials"],
    [new ApiError(429, "x", null), "too-many"],
    [new ApiError(423, "x", "auth.two_factor_user_locked"), "locked"],
    [
      new ApiError(401, "x", "auth.two_factor_challenge_locked"),
      "challenge-ended",
    ],
    [
      new ApiError(400, "x", "auth.something_invalid_or_expired"),
      "link-invalid",
    ],
    [new ApiError(400, "x", "auth.oauth_not_configured"), "google-unavailable"],
    [new ApiError(500, "x", null), "generic"],
    [new TypeError("Failed to fetch"), "network"],
  ])("%s -> %s", (error, kind) => {
    expect(authErrorKind(error)).toBe(kind);
  });

  /* Server text is never echoed: every case maps to a dictionary path. */
  it("never returns the server message", () => {
    const error = new ApiError(400, "internal column users.password_hash");
    expect(authErrorPath(error)).toBe("errors.generic");
  });
});
