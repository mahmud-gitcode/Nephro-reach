"use client";

import React from "react";
import { useAuth } from "@/features/auth/AuthContext";
import AdminDashboard from "@/features/dashboard/AdminDashboard";
import UserDashboard from "@/features/dashboard/UserDashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "user") {
    return <UserDashboard />;
  }

  return <AdminDashboard />;
}
