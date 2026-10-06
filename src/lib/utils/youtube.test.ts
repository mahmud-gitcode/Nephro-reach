import { describe, expect, it } from "vitest";
import { youTubeEmbed } from "./youtube";

const EMBED = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0";

describe("youTubeEmbed", () => {
  it.each([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com/watch?v=dQw4w9WgXcQ&t=42",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "  https://youtu.be/dQw4w9WgXcQ?si=abc  ",
  ])("reads %s", (url) => {
    expect(youTubeEmbed(url)).toBe(EMBED);
  });

  it.each([
    "",
    "/videos/table-talk-access.mp4",
    "https://vimeo.com/123456",
    "https://www.youtube.com/watch",
    "https://evil.example/watch?v=dQw4w9WgXcQ",
    "not a url",
  ])("rejects %s", (url) => {
    expect(youTubeEmbed(url)).toBeNull();
  });
});
