"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AddRedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tx = searchParams.get("treatment") || "tx-4";
    const extra = searchParams.get("extra");
    const target = extra
      ? `/dashboard/personal-log/dialysis-management/view?treatment=${encodeURIComponent(tx)}&extra=${encodeURIComponent(extra)}`
      : `/dashboard/personal-log/dialysis-management/view?treatment=${encodeURIComponent(tx)}`;

    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm font-medium text-slate-500">
      Loading view details...
    </div>
  );
}

export default function AddDialysisRecordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <AddRedirectHandler />
    </Suspense>
  );
}
