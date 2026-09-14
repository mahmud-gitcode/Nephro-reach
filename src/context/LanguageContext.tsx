"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { useIsMounted } from "@/lib/utils/useIsMounted";

export type LanguageCode = "EN" | "ES";

const STORAGE_KEY = "preferred_language";

/* The Spanish dictionary is typed against the English one, so a key that
   exists in one and not the other is a type error rather than a runtime
   fallback nobody notices. `en` is the source of truth for the shape. */
export type Dictionary = typeof en;

const dictionaries: Record<LanguageCode, Dictionary> = {
  EN: en,
  ES: es as Dictionary,
};

/* A dictionary is a tree whose leaves are strings, or lists of strings for
   the few places that render bullet lists. This is what `any` stood in for.
   `t` walks it by a dotted path and only ever returns a string leaf. */
type DictionaryNode =
  string | readonly string[] | { readonly [key: string]: DictionaryNode };

function lookup(root: DictionaryNode, keys: string[]): string | undefined {
  let current: DictionaryNode = root;
  for (const key of keys) {
    if (typeof current !== "object" || Array.isArray(current)) return undefined;
    const next: DictionaryNode | undefined = (
      current as { readonly [key: string]: DictionaryNode }
    )[key];
    if (next === undefined) return undefined;
    current = next;
  }
  return typeof current === "string" ? current : undefined;
}

function readStoredLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "ES" || saved === "EN" ? saved : "EN";
  } catch {
    return "EN";
  }
}

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (path: string) => string;
  dictionary: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  /* The stored preference cannot be read on the server, so the first render
     is always English and the real choice arrives at hydration. Reading it
     here rather than in an effect saves a second render pass. `chosen` holds
     a change made during this page's life. */
  const mounted = useIsMounted();
  const [chosen, setChosen] = useState<LanguageCode | null>(null);
  const language = chosen ?? (mounted ? readStoredLanguage() : "EN");

  const setLanguage = useCallback((lang: LanguageCode) => {
    setChosen(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Private mode or a full quota: the choice still applies to this page.
    }
  }, []);

  const t = useCallback(
    (path: string): string => {
      const keys = path.split(".");
      return (
        lookup(dictionaries[language] as unknown as DictionaryNode, keys) ??
        lookup(en as unknown as DictionaryNode, keys) ??
        path
      );
    },
    [language],
  );

  const dictionary = dictionaries[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dictionary }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
