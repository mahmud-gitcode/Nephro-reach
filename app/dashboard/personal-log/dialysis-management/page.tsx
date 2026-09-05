"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Activity, Calendar, Clock, Plus, Settings } from "lucide-react";

export default function DialysisManagementPage() {
  return (
    <div className="w-full space-y-6">
      {/* Back button and page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/personal-log"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Personal Log
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
            Dialysis Management
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Manage your dialysis schedules, treatment plans, and daily care routines.
          </p>
        </div>
      </div>

      {/* Main Content Area / Placeholder */}
      <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 sm:p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] mb-4">
          <Activity className="h-8 w-8" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-[#0F172A]">
          Dialysis Management Workspace
        </h2>
        <p className="mt-2 max-w-md mx-auto text-sm text-[#64748B]">
          This section is ready for your dialysis management tools and details.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-xs font-medium text-[#475569]">
            <Calendar className="h-3.5 w-3.5 text-[#2563EB]" />
            Schedules & Sessions
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-xs font-medium text-[#475569]">
            <Clock className="h-3.5 w-3.5 text-[#16A34A]" />
            Treatment Logs
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-xs font-medium text-[#475569]">
            <Settings className="h-3.5 w-3.5 text-[#9333EA]" />
            Care Plan
          </div>
        </div>
      </div>
    </div>
  );
}
