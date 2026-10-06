/**
 * The embeddable player URL for a YouTube link, or null when the link is
 * not a YouTube video. Accepts watch, youtu.be, shorts, live and embed
 * links. Uses youtube-nocookie so a member is not tracked until they press
 * play (client, 2026-10-06: a YouTube video that still plays on the
 * platform).
 */
export function youTubeEmbed(url: string | undefined | null): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^(www\.|m\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = parsed.pathname.slice(1).split("/")[0] || null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (parsed.pathname === "/watch") id = parsed.searchParams.get("v");
    else {
      const match = /^\/(?:embed|shorts|live)\/([^/?]+)/.exec(parsed.pathname);
      id = match?.[1] ?? null;
    }
  }
  if (!id || !/^[\w-]{6,20}$/.test(id)) return null;
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
}
