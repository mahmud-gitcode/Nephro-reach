import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import {
  canRetry,
  combineReads,
  errorMessageFor,
  errorTitleFor,
  isNotShared,
} from "./asyncState";

/* ADR 0007 §5: error is not empty, and 403 is not "no data". */

const forbidden = new ApiError(403, "No", "dialysis.dialysis_not_shared");
const serverDown = new ApiError(500, "Boom");

describe("error copy", () => {
  it("gives a 403 the not-shared title and sentence, in both languages", () => {
    expect(isNotShared(forbidden)).toBe(true);
    expect(errorTitleFor(forbidden, "Your log could not be loaded")).toBe(
      "This has not been shared with you",
    );
    expect(errorTitleFor(forbidden, "x", "es")).toBe(
      "Esta información no se ha compartido contigo",
    );
    expect(errorMessageFor(forbidden, undefined)).toMatch(/do not have access/);
    expect(errorMessageFor(forbidden, undefined, "es")).toMatch(
      /No tienes acceso/,
    );
  });

  it("keeps the page's own copy for any other failure", () => {
    for (const error of [serverDown, new Error("offline"), null, undefined]) {
      expect(isNotShared(error)).toBe(false);
      expect(errorTitleFor(error, "Your log could not be loaded")).toBe(
        "Your log could not be loaded",
      );
      expect(errorMessageFor(error, undefined)).toBeUndefined();
    }
  });

  it("offers no retry for a 403, and a retry otherwise", () => {
    expect(canRetry(forbidden)).toBe(false);
    expect(canRetry(serverDown)).toBe(true);
    expect(canRetry(new Error("offline"))).toBe(true);
  });
});

describe("combineReads", () => {
  it("is pending while any read is, failed if any failed, and retries all", () => {
    const a = { isPending: false, refetch: vi.fn() };
    const b = { isPending: true, error: forbidden, refetch: vi.fn() };
    const state = combineReads(a, b);
    expect(state.pending).toBe(true);
    expect(state.isError).toBe(true);
    expect(state.error).toBe(forbidden);
    state.onRetry();
    expect(a.refetch).toHaveBeenCalledTimes(1);
    expect(b.refetch).toHaveBeenCalledTimes(1);
  });

  it("has no error when every read succeeded", () => {
    const state = combineReads({ isPending: false }, { isPending: false });
    expect(state).toMatchObject({
      pending: false,
      isError: false,
      error: null,
    });
  });
});
