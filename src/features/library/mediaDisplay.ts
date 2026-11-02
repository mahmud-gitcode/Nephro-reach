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

/** A site path (`/images/…`), not a protocol-relative `//host`. */
export function isSitePath(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

/** The URL when the page can show it, the placeholder otherwise. */
export function displayableImage(
  url: string | null | undefined,
  placeholder: string,
): string {
  const value = url?.trim();
  return value && isSitePath(value) ? value : placeholder;
}
