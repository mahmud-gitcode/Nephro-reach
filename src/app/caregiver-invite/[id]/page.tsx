import React from "react";
import CaregiverInvitePage from "@/features/caregivers/CaregiverInvitePage";
import { QueryProvider } from "@/lib/data/QueryProvider";

/* The link a patient sends their caregiver. No login yet: the caregiver
   makes their own here, then accepts (client spec, 2026-10-13). */
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div data-typeface="portal" data-canvas className="min-h-screen bg-canvas">
      <QueryProvider>
        <CaregiverInvitePage id={id} />
      </QueryProvider>
    </div>
  );
}
