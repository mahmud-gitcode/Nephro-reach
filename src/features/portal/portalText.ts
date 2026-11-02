/* The `portal` namespace of the dictionaries (picker, switch bar,
   invitation page), safe outside a LanguageProvider like authText.ts.
   `{name}` placeholders are filled from `vars`. */

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

export function portalText(
  language: "EN" | "ES",
  path: string,
  vars: Record<string, string> = {},
): string {
  const raw =
    lookup((language === "ES" ? es.portal : en.portal) as Node, path) ??
    lookup(en.portal as Node, path) ??
    path;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? "");
}

/** `t("pickerTitle")` for the portal namespace. */
export function usePortalText() {
  const language = useLanguageCode();
  return useCallback(
    (path: string, vars?: Record<string, string>) =>
      portalText(language, path, vars),
    [language],
  );
}
