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
