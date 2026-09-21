"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useIsMounted } from "@/lib/utils/useIsMounted";

/**
 * "Last updated 12:43 PM" and a Refresh button, for a clinic page that reads
 * through `useClinicData`. The time is only drawn in the browser: the page
 * is prerendered, and a server clock baked into the HTML would disagree
 * with the reader's on hydration.
 */
export function UpdatedBar({
  updatedAt,
  isFetching,
  refetch,
}: {
  updatedAt: number;
  isFetching: boolean;
  refetch: () => void;
}) {
  const mounted = useIsMounted();
  const time =
    mounted && updatedAt > 0
      ? new Date(updatedAt).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
      : null;

  return (
    <div className="flex items-center justify-end gap-inline-md">
      <p role="status" className="text-caption text-fg-muted">
        {isFetching && time
          ? "Refreshing…"
          : time
            ? `Last updated ${time}`
            : ""}
      </p>
      <Button
        variant="neutral"
        appearance="fill-stroke"
        size="small"
        onClick={refetch}
        disabled={isFetching}
      >
        <RefreshCw
          aria-hidden="true"
          className={cn("h-4 w-4", isFetching && "animate-spin")}
        />
        Refresh
      </Button>
    </div>
  );
}

export default UpdatedBar;
