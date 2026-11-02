/* The `collab` namespace of the dictionaries: copy added for the Phase 12
   screens (community, reviews, testimonials, library, Table Talk) and the
   "not available yet" notes on controls that wait on a decision (D52).
   Safe outside a LanguageProvider, like dialysisText.ts: components rendered
   on their own in tests read English. `{name}` placeholders are filled from
   `vars`; a missing Spanish key falls back to English, a missing key to its
   path. */

import { useCallback } from "react";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { useLanguageCode } from "@/context/LanguageContext";

type Node = string | { readonly [key: string]: Node };

function lookup(root: Node, path: string): string | undefined {
  let current: Node | undefined = root;
  for (const key of path.split(".")) {
    if (!current || typeof current === "string") return undefined;
    current = current[key];
  }
  return typeof current === "string" ? current : undefined;
}

export type CollabLang = "EN" | "ES" | "en" | "es" | boolean;

function toCode(language: CollabLang): "EN" | "ES" {
  return language === true || language === "ES" || language === "es"
    ? "ES"
    : "EN";
}

export function collabText(
  language: CollabLang,
  path: string,
  vars: Record<string, string> = {},
): string {
  const code = toCode(language);
  const raw =
    lookup((code === "ES" ? es.collab : en.collab) as Node, path) ??
    lookup(en.collab as Node, path) ??
    path;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? "");
}

/** `t("notAvailable.reviewActions")` for the collab namespace. */
export function useCollabText() {
  const language = useLanguageCode();
  return useCallback(
    (path: string, vars?: Record<string, string>) =>
      collabText(language, path, vars),
    [language],
  );
}
