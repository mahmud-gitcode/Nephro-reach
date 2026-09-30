"use client";

import React from "react";
import { PageTitle } from "@/components/layout/PageTitle";
import { useAuth } from "@/features/auth/AuthContext";
import { organizationFor } from "./staff";
import { StaffTeamCard } from "./StaffTeam";
import { RequirePermission } from "./RequirePermission";

/* An organisation's own people, from its own menu (Staff & Roles): its
   administrator adds staff and sets their roles. The same page for the
   dialysis clinic and the access center, each seeing only its staff. */
export default function StaffTeamPage({ href }: { href: string }) {
  const { user } = useAuth();
  const org = organizationFor(user);
  return (
    <div className="space-y-4">
      <PageTitle href={href} />
      <RequirePermission permission="staff.manage">
        {org ? <StaffTeamCard orgId={org.id} /> : null}
      </RequirePermission>
    </div>
  );
}
