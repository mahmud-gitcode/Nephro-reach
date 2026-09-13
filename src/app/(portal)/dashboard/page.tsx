"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import UserDashboard from "@/components/dashboard/UserDashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "user") {
    return <UserDashboard />;
  }

  return <AdminDashboard />;
}
