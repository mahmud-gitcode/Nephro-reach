/* ==========================================================================
   Which content image the page may show
   --------------------------------------------------------------------------
   Library posters and Table Talk thumbnails come from the API as an https
   URL or a site path, and the pages draw them with next/image. next/image
   refuses any remote host that is not declared in next.config (none is),
   which would break the whole page, and the CSP (ADR 0006 §1) would block
   most hosts anyway. Until a public media host is decided (D18) and
   declared, a remote image is shown as the local placeholder; the stored
   URL itself is untouched on the server.
   ========================================================================== */

/** A site path (`/images/…`): never a protocol-relative `//host`, nor a
 *  `/\host` (browsers read a backslash as a slash, so it is the same
 *  off-site link), nor one hiding either behind a tab or newline (the URL
 *  parser strips those). Any backslash or control character is refused;
 *  a site path never needs one. A scheme (`http:`, `javascript:`) does not
 *  start with "/" and is refused too. */
export function isSitePath(url: string): boolean {
  if (!url.startsWith("/")) return false;
  if (url.includes("\\")) return false;
  if (/[\u0000-\u001f\u007f]/.test(url)) return false;
  return !url.startsWith("//");
}

/** The URL when the page can show it, the placeholder otherwise. */
export function displayableImage(
  url: string | null | undefined,
  placeholder: string,
): string {
  const value = url?.trim();
  return value && isSitePath(value) ? value : placeholder;
}
