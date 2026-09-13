"use client";

import { useCallback, useState } from "react";

export interface DialysisClinic {
  name: string;
  phone: string;
}

const STORAGE_KEY = "nephroreach_dialysis_clinic";

const DEFAULT_CLINIC: DialysisClinic = {
  name: "ABC Dialysis Center",
  phone: "(305) 555-0142",
};

function readStoredClinic(): DialysisClinic {
  if (typeof window === "undefined") return DEFAULT_CLINIC;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CLINIC;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return DEFAULT_CLINIC;
    return {
      name: typeof parsed.name === "string" ? parsed.name : DEFAULT_CLINIC.name,
      phone:
        typeof parsed.phone === "string" ? parsed.phone : DEFAULT_CLINIC.phone,
    };
  } catch {
    return DEFAULT_CLINIC;
  }
}

/** The member's own dialysis center — the number they call when something is wrong. */
export function useDialysisClinic() {
  const [clinic, setClinicState] = useState<DialysisClinic>(readStoredClinic);

  const setClinic = useCallback((next: DialysisClinic) => {
    setClinicState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage can be unavailable (private window, blocked site data). The
      // details still apply for this session rather than breaking the page.
    }
  }, []);

  return { clinic, setClinic };
}

/** Strips formatting so the number works in a tel: link. */
export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
