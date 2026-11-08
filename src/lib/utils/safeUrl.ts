/* ==========================================================================
   Safe URLs
   --------------------------------------------------------------------------
   Any URL that comes from stored data (a message attachment, a shared file,
   an admin-entered library link) is checked before it becomes an href or is
   opened. A `javascript:` link, or a data: URL that a browser would render
   as a page (HTML, SVG, XML), would otherwise run script inside NephroReach
   with the viewer's access to patient data. The API must apply the same
   rules when it stores these values; this is the second line of defence.
   ========================================================================== */

/* data: types a browser renders as a document that can run script. */
const ACTIVE_DATA_TYPE =
  /^data:(text\/html|image\/svg\+xml|application\/(xhtml\+xml|xml)|text\/xml)/i;

function parse(url: string): URL | null {
  try {
    return new URL(url, "https://nephroreach.invalid");
  } catch {
    return null;
  }
}

/** Links that leave the app or open a document: https, http, or this site. */
export function isSafeLinkUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  const parsed = parse(url.trim());
  return parsed !== null && ["https:", "http:"].includes(parsed.protocol);
}

/** Files and pictures the app holds: also data: and blob:, minus the types
 *  a browser would run as a page. */
export function isSafeFileUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  const trimmed = url.trim();
  const parsed = parse(trimmed);
  if (!parsed) return false;
  if (parsed.protocol === "data:") return !ACTIVE_DATA_TYPE.test(trimmed);
  return ["blob:", "https:", "http:"].includes(parsed.protocol);
}

function isLoopbackHost(url: URL): boolean {
  return (
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]"
  );
}

/** A presigned download link from the app's file storage (an invoice PDF).
 *  Only https, or http to a storage stand-in on this machine; never blob:,
 *  data: or javascript:. When NEXT_PUBLIC_STORAGE_ORIGIN is set the link
 *  must be on that origin, and a production build must set it, the same
 *  rule as presigned uploads (D18). */
export function isStorageDownloadUrl(
  url: string | null | undefined,
): url is string {
  if (!url) return false;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  if (parsed.protocol === "http:" && !isLoopbackHost(parsed)) return false;
  const storage = process.env.NEXT_PUBLIC_STORAGE_ORIGIN?.trim();
  if (!storage) return process.env.NODE_ENV !== "production";
  try {
    return parsed.origin === new URL(storage).origin;
  } catch {
    return false;
  }
}
