"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeamQuestionsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/personal-log/dialysis-management?tab=questions");
  }, [router]);

  return (
    <div className="w-full max-w-5xl mx-auto py-16 text-center text-slate-500">
      <p className="text-sm font-medium">Redirecting to Dialysis Management...</p>
    </div>
  );
}
