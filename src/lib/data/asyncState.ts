/* ==========================================================================
   Several reads, one AsyncSection (ADR 0007, INT-10)
   --------------------------------------------------------------------------
   A page that needs three reads before it can say anything true is pending
   while any of them is, and failed if any of them failed. The first error
   wins, and "try again" re-runs every read.
   ========================================================================== */

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
