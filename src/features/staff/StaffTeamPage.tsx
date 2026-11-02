"use client";

import React from "react";
import { PageTitle } from "@/components/layout/PageTitle";
import { StaffTeamCard } from "./StaffTeam";
import { RequirePermission } from "./RequirePermission";

/* An organisation's own people, from its own menu (Staff & Roles). The
   office is the one the user is working in (the portal context, Phase 3);
   the page opens with staff View on the server and each action checks its
   own level. */
export default function StaffTeamPage({ href }: { href: string }) {
  return (
    <div className="space-y-4">
      <PageTitle href={href} />
      <RequirePermission permission="staff.manage">
        <StaffTeamCard />
      </RequirePermission>
    </div>
  );
}
