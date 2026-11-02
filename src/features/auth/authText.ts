/* The auth namespace of the dictionaries, safe outside a LanguageProvider
   (the idle warning renders inside AuthProvider; component tests render
   pieces on their own). `{name}` placeholders are filled from `vars`. */

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

export function authText(
  language: "EN" | "ES",
  path: string,
  vars: Record<string, string> = {},
): string {
  const raw =
    lookup((language === "ES" ? es.auth : en.auth) as Node, path) ??
    lookup(en.auth as Node, path) ??
    path;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? "");
}

/** `t("twoFactor.title")` for the auth namespace. */
export function useAuthText() {
  const language = useLanguageCode();
  return useCallback(
    (path: string, vars?: Record<string, string>) =>
      authText(language, path, vars),
    [language],
  );
}
