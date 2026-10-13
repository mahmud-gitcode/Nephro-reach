import React from "react";
import { CaregiverBanner } from "@/features/caregivers/CaregiverViews";

/* Every caregiver page says whose information it is (client spec,
   2026-10-13). */
export default function CaregiverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-stack-lg">
      <CaregiverBanner />
      {children}
    </div>
  );
}
