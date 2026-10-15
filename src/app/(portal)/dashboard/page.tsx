"use client";

import React from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { isMemberRole } from "@/features/auth/useMember";
import AdminDashboard from "@/features/dashboard/AdminDashboard";
import UserDashboard from "@/features/dashboard/UserDashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  /* A caregiver sees the dashboard of the patient they act for. */
  if (isMemberRole(user?.role)) {
    return <UserDashboard />;
  }

  return <AdminDashboard />;
}
