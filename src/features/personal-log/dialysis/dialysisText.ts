/* The `memberDialysis` namespace of the dictionaries: the copy added for the
   member's dialysis screens in Phase 7. Safe outside a LanguageProvider like
   portalText.ts (the sections take `isEs` from their page and are rendered
   on their own in tests). `{name}` placeholders are filled from `vars`; a
   missing Spanish key falls back to English, a missing key to its path. */

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

export type DialysisLang = "EN" | "ES" | "en" | "es" | boolean;

/** EN/ES, "en"/"es", or the sections' `isEs` flag. */
function toCode(language: DialysisLang): "EN" | "ES" {
  return language === true || language === "ES" || language === "es"
    ? "ES"
    : "EN";
}

export function dialysisText(
  language: DialysisLang,
  path: string,
  vars: Record<string, string> = {},
): string {
  const code = toCode(language);
  const raw =
    lookup(
      (code === "ES" ? es.memberDialysis : en.memberDialysis) as Node,
      path,
    ) ??
    lookup(en.memberDialysis as Node, path) ??
    path;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? "");
}

/** `t("equipment.title")` for the memberDialysis namespace. */
export function useDialysisText() {
  const language = useLanguageCode();
  return useCallback(
    (path: string, vars?: Record<string, string>) =>
      dialysisText(language, path, vars),
    [language],
  );
}
