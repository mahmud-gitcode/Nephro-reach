import { describe, expect, it } from "vitest";
import {
  MAX_TESTIMONIAL_MB,
  MAX_TESTIMONIAL_SECONDS,
  formatClock,
  toDurationSeconds,
  videoFileError,
  videoLengthError,
} from "./testimonials.rules";
import {
  fromApiModerationTestimonial,
  fromApiMyTestimonial,
  fromApiPublicTestimonial,
  toSubmitBody,
} from "./testimonials.api";

const MB = 1024 * 1024;

describe("how long a testimonial may run", () => {
  it("accepts a clip inside the limit", () => {
    expect(videoLengthError(60)).toBeNull();
    expect(videoLengthError(MAX_TESTIMONIAL_SECONDS)).toBeNull();
  });

  it("rejects one past it, and says both numbers", () => {
    const message = videoLengthError(MAX_TESTIMONIAL_SECONDS + 1);
    expect(message).toContain("3:01");
    expect(message).toContain("3:00");
  });

  it("lets a length it cannot read through rather than blocking", () => {
    // Some MOV files report no duration until fully decoded. Refusing a
    // member's only recording because the browser could not measure it is
    // worse than letting the admin see it and decide.
    expect(videoLengthError(null)).toBeNull();
    expect(videoLengthError(NaN)).toBeNull();
    expect(videoLengthError(Infinity)).toBeNull();
    expect(videoLengthError(0)).toBeNull();
    expect(videoLengthError(-5)).toBeNull();
  });

  it("says a time the way somebody about to record would read it", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(9)).toBe("0:09");
    expect(formatClock(75)).toBe("1:15");
    expect(formatClock(180)).toBe("3:00");
    expect(formatClock(605)).toBe("10:05");
  });
});

describe("the measured length sent to the API (INT-19)", () => {
  it("sends whole seconds, the number the server caps at 180", () => {
    expect(toDurationSeconds(95.4)).toBe(95);
    expect(toDurationSeconds(0.4)).toBe(1);
    expect(toDurationSeconds(180)).toBe(180);
  });

  it("sends nothing when it could not be read, rather than a made-up 3:30", () => {
    // The old form stored "3:30" for any clip it could not measure.
    expect(toDurationSeconds(null)).toBeUndefined();
    expect(toDurationSeconds(NaN)).toBeUndefined();
    expect(toDurationSeconds(0)).toBeUndefined();
    expect(toDurationSeconds(181)).toBeUndefined();
  });
});

describe("which file can be a story", () => {
  it("caps the upload at the API's 10 MB, not the old 200 MB", () => {
    // The form used to accept 200 MB, which the server then refused.
    expect(MAX_TESTIMONIAL_MB).toBe(10);
    expect(videoFileError({ type: "video/mp4", size: 5 * MB })).toBeNull();
    const refused = videoFileError({ type: "video/mp4", size: 15 * MB });
    expect(refused).toContain("15 MB");
    expect(refused).toContain("10 MB");
  });

  it("takes only the video types the API takes", () => {
    expect(videoFileError({ type: "video/quicktime", size: MB })).toBeNull();
    expect(videoFileError({ type: "video/webm", size: MB })).toBeNull();
    expect(
      videoFileError({ type: "video/x-msvideo", size: MB }),
    ).not.toBeNull();
    expect(videoFileError({ type: "image/png", size: MB })).not.toBeNull();
    expect(videoFileError({ type: "video/mp4", size: 0 })).not.toBeNull();
  });
});

describe("the API mapping", () => {
  it("sends the file id and the measured seconds, never a URL or a name", () => {
    const body = toSubmitBody({
      title: "  My story ",
      role: "Dialysis Member",
      videoFileId: "file-1",
      durationSeconds: 95,
      summary: " Hope ",
    });
    expect(body).toEqual({
      title: "My story",
      role: "Dialysis Member",
      videoFileId: "file-1",
      durationSeconds: 95,
      summary: "Hope",
    });
    expect(JSON.stringify(body)).not.toMatch(/blob:|data:|\/videos\//);
  });

  it("sends Other with the typed role beside it", () => {
    expect(
      toSubmitBody({
        title: "",
        role: "Other",
        otherRole: " Kidney donor ",
        videoFileId: "f",
        summary: "s",
      }),
    ).toEqual({
      role: "Other",
      otherRole: "Kidney donor",
      videoFileId: "f",
      summary: "s",
    });
  });

  it("maps a published story without any email", () => {
    const story = fromApiPublicTestimonial({
      id: "t1",
      authorName: "Test M.",
      role: "Dialysis Member",
      title: "T",
      summary: "S",
      thumbnailUrl: null,
      duration: "2:45",
      videoUrl: null,
      hasUploadedVideo: true,
    });
    expect(story).toMatchObject({
      memberName: "Test M.",
      status: "approved",
      videoUrl: "",
      hasUploadedVideo: true,
      duration: "2:45",
    });
    expect(Object.keys(story)).not.toContain("memberEmail");
  });

  it("maps the member's own story and its status", () => {
    expect(
      fromApiMyTestimonial({
        id: "t2",
        title: "T",
        role: "Other role",
        hasVideo: true,
        duration: null,
        summary: "S",
        status: "declined",
        adminFeedback: "Please trim it",
        createdAt: "2026-11-01T10:00:00.000Z",
        approvedAt: null,
      }),
    ).toMatchObject({
      status: "declined",
      adminFeedback: "Please trim it",
      hasUploadedVideo: true,
    });
  });

  it("treats an unknown status as pending, never approved", () => {
    expect(
      fromApiModerationTestimonial({
        id: "t3",
        authorId: "u",
        authorName: null,
        title: "T",
        role: "R",
        hasVideo: false,
        videoUrl: "https://youtu.be/abcdefghijk",
        thumbnailUrl: null,
        duration: null,
        summary: "S",
        personalInfoDetected: true,
        status: "weird",
        adminFeedback: null,
        decidedById: null,
        createdAt: "",
        approvedAt: null,
      }),
    ).toMatchObject({
      status: "pending",
      memberName: "Member",
      personalInfoDetected: true,
    });
  });
});
