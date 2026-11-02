"use client";

import { useEffect, useState } from "react";

/**
 * Reads `?token=` once and removes it from the address bar at once, so the
 * secret does not stay in history, in a screenshot or in a Referer (the
 * pages also send `Referrer-Policy: no-referrer`). Undefined until read;
 * null when the URL had none. Never logged or stored.
 */
export function useOneTimeToken(): string | null | undefined {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const url = new URL(window.location.href);
    const value = url.searchParams.get("token");
    if (value !== null) {
      url.searchParams.delete("token");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    }
    /* One read on mount, from the address bar React does not track. */
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is an external system read once
    setToken(value);
  }, []);
  return token;
}
