"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeamQuestionsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/personal-log/dialysis-management?tab=questions");
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-5xl py-section-md text-center">
      <p className="text-body-md text-fg-muted">
        Redirecting to Dialysis Management…
      </p>
    </div>
  );
}
