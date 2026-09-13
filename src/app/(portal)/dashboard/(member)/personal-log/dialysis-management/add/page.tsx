"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";

function LoadingNotice({ label }: { label: string }) {
  return (
    <div
      role="status"
      className="flex min-h-[50vh] items-center justify-center text-body-md text-fg-muted"
    >
      {label}
    </div>
  );
}

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

  return <LoadingNotice label="Loading view details…" />;
}

export default function AddDialysisRecordPage() {
  return (
    <>
      <PersonalLogDisclaimer />

      <Suspense fallback={<LoadingNotice label="Loading…" />}>
        <AddRedirectHandler />
      </Suspense>
    </>
  );
}
