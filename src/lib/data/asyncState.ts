/* ==========================================================================
   Several reads, one AsyncSection (ADR 0007, INT-10)
   --------------------------------------------------------------------------
   A page that needs three reads before it can say anything true is pending
   while any of them is, and failed if any of them failed. The first error
   wins, and "try again" re-runs every read.
   ========================================================================== */

import { isApiError } from "@/lib/api/client";

export type ReadState = {
  isPending: boolean;
  error?: unknown;
  refetch?: () => void;
};

export type CombinedReadState = {
  pending: boolean;
  error: unknown;
  isError: boolean;
  onRetry: () => void;
};

export function combineReads(...reads: ReadState[]): CombinedReadState {
  const error = reads.find((r) => r.error)?.error ?? null;
  return {
    pending: reads.some((r) => r.isPending),
    error,
    isError: error !== null,
    onRetry: () => {
      for (const r of reads) r.refetch?.();
    },
  };
}

/* ==========================================================================
   Error copy (ADR 0007 §5)
   --------------------------------------------------------------------------
   A 403 means "not shared with you, or no access", not "something broke".
   It gets its own words, no retry button (asking again changes nothing,
   and QueryProvider does not retry 4xx), and the page shows nothing else:
   AsyncSection's error branch already hides cached and placeholder data.
   Every other failure keeps the page's own copy.

     <AsyncSection
       error={reads.error}
       errorTitle={errorTitleFor(reads.error, pageTitle, lang)}
       errorMessage={errorMessageFor(reads.error, undefined, lang)}
       onRetry={canRetry(reads.error) ? reads.onRetry : undefined}
       ...
   ========================================================================== */

export type ErrorCopyLanguage = "en" | "es";

const NOT_SHARED = {
  en: {
    title: "This has not been shared with you",
    message:
      "You do not have access to this information. If you think you should, ask the person or office who manages it to share it with you.",
  },
  es: {
    title: "Esta información no se ha compartido contigo",
    message:
      "No tienes acceso a esta información. Si crees que deberías tenerlo, pide a la persona u oficina que la administra que la comparta contigo.",
  },
} as const;

/** True for a 403: not shared with this user, or no access. */
export function isNotShared(error: unknown): boolean {
  return isApiError(error, { status: 403 });
}

/** The error title: the not-shared title for a 403, the page's otherwise. */
export function errorTitleFor<T>(
  error: unknown,
  fallback: T,
  lang: ErrorCopyLanguage = "en",
): T | string {
  return isNotShared(error) ? NOT_SHARED[lang].title : fallback;
}

/** The error sentence: the not-shared sentence for a 403, the page's
 *  otherwise (undefined keeps ErrorState's own). */
export function errorMessageFor<T>(
  error: unknown,
  fallback: T,
  lang: ErrorCopyLanguage = "en",
): T | string {
  return isNotShared(error) ? NOT_SHARED[lang].message : fallback;
}

/** Whether "try again" can help. Never for a 403. */
export function canRetry(error: unknown): boolean {
  return !isNotShared(error);
}
