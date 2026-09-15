"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCustomLabResult, saveCustomLabResult } from "./labs.repository";
import type { CustomLabResult } from "./labs.types";

export type { CustomLabResult } from "./labs.types";

export const customLabResultKey = ["labs", "custom-result"] as const;

/**
 * The most recent draw the member typed in themselves. Null until they have
 * entered one, which the screens read as "show the reference data only".
 */
export function useCustomLabResult() {
  const query = useQuery({
    queryKey: customLabResultKey,
    queryFn: getCustomLabResult,
  });

  return {
    result: query.data ?? null,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

/** The entry form's half: write, and nothing else. */
export function useSaveCustomLabResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (result: CustomLabResult) => saveCustomLabResult(result),
    onSuccess: (result) => queryClient.setQueryData(customLabResultKey, result),
  });
}
