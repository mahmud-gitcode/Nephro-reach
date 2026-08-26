"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/auth";
import {
  Bell,
  BookOpen,
  CreditCard,
  FlaskConical,
  HelpCircle,
  HeartPulse,
  Hospital,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Notebook,
  MessageCircle,
  MessagesSquare,
  Search,
  Settings,
  Users,
  Video,
  X,
} from "lucide-react";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type NavItem = { label: string; href: string; icon: IconType; roles: UserRole[] };

const sidebarItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "user"] },
  { label: "Before-the-ER", href: "/dashboard/before-the-er", icon: Hospital, roles: ["user"] },
  { label: "MyHealth", href: "/dashboard/my-health", icon: HeartPulse, roles: ["user"] },
  { label: "Personal Log", href: "/dashboard/personal-log", icon: Layers, roles: ["user"] },
  {
    label: "Dialysis Journal",
    href: "/dashboard/personal-log/dialysis-journal",
    icon: Notebook,
    roles: ["user"],
  },
  { label: "Member", href: "/dashboard/members", icon: Users, roles: ["admin"] },
  {
    label: "Class Management",
    href: "/dashboard/manage-curriculum",
    icon: FlaskConical,
    roles: ["admin"],
  },
  {
    label: "Education Center",
    href: "/dashboard/education-center",
    icon: BookOpen,
    roles: ["user"],
  },
  { label: "Live Class", href: "/dashboard/live-class", icon: Video, roles: ["admin"] },
  { label: "Community", href: "/dashboard/community", icon: MessagesSquare, roles: ["user"] },
  {
    label: "SMS Analytics",
    href: "/dashboard/sms-analytics",
    icon: MessageCircle,
    roles: ["admin"],
  },
  {
    label: "Subscriptions",
    href: "/dashboard/subscriptions",
    icon: CreditCard,
    roles: ["admin"],
  },
];

const supportItems: NavItem[] = [
  { label: "Support", href: "/dashboard/support", icon: HelpCircle, roles: ["user"] },
  { label: "Setting", href: "/dashboard/settings", icon: Settings, roles: ["user"] },
];

function getBreadcrumb(pathname: string) {
  if (pathname === "/dashboard") return "Breadcrumb";
  if (pathname.startsWith("/dashboard/before-the-er")) return "Before-the-ER";
  if (pathname.startsWith("/dashboard/my-health")) return "MyHealth";
  if (pathname.startsWith("/dashboard/personal-log/blood-results/add"))
    return "Add Blood Results";
  if (pathname.startsWith("/dashboard/personal-log/blood-results"))
    return "Blood Results";
  if (pathname.startsWith("/dashboard/personal-log/blood-pressure/add"))
    return "Add Blood Pressure";
  if (pathname.startsWith("/dashboard/personal-log/blood-pressure"))
    return "Blood Pressure Log";
  if (pathname.startsWith("/dashboard/personal-log/lab-tracking/add"))
    return "Add Lab Result";
  if (pathname.startsWith("/dashboard/personal-log/lab-tracking"))
    return "Lab Tracking";
  if (pathname.startsWith("/dashboard/personal-log/medications/add"))
    return "Add Medication";
  if (pathname.startsWith("/dashboard/personal-log/medications"))
    return "Medication Log";
  if (pathname.startsWith("/dashboard/personal-log/appointments"))
    return "Appointments";
  if (pathname.startsWith("/dashboard/personal-log/nutrition"))
    return "Nutrition";
  if (pathname.startsWith("/dashboard/personal-log/dialysis-treatment"))
    return "Dialysis Treatment";
  if (pathname.startsWith("/dashboard/personal-log/fluid-tracker"))
    return "Fluid Tracker";
  if (pathname.startsWith("/dashboard/personal-log/dialysis-journal"))
    return "Dialysis Journal";
  if (pathname.startsWith("/dashboard/personal-log")) return "Personal Log";
  if (pathname.startsWith("/dashboard/members")) return "Member";
  if (pathname.startsWith("/dashboard/manage-curriculum"))
    return "Manage curriculum";
  if (pathname.startsWith("/dashboard/education-center"))
    return "Education Center";
  if (pathname.startsWith("/dashboard/live-class")) return "Live Class";
  if (pathname.startsWith("/dashboard/community")) return "Community";
  if (pathname.startsWith("/dashboard/sms-analytics")) return "SMS Analytics";
  if (pathname.startsWith("/dashboard/subscriptions")) return "Subscriptions";
  if (pathname.startsWith("/dashboard/support")) return "Support";
  if (pathname.startsWith("/dashboard/settings")) return "Setting";
  return "Breadcrumb";
}

function isActiveRoute(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/personal-log") {
    return (
      pathname === "/dashboard/personal-log" ||
      (pathname.startsWith("/dashboard/personal-log/") &&
        !pathname.startsWith("/dashboard/personal-log/dialysis-journal"))
    );
  }
  return href !== "#" && pathname.startsWith(href);
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const role = user?.role ?? "user";
  const visibleItems = sidebarItems.filter((item) => item.roles.includes(role));
  const visibleSupport = supportItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="flex h-full w-[272px] shrink-0 flex-col overflow-hidden bg-[#06265B] px-4 py-4 text-white">
      <div className="mb-3 flex shrink-0 items-start justify-between gap-3 rounded bg-white p-3">
        <Image
          src="/images/logo.svg"
          alt="NephroReach"
          width={216}
          height={171}
          priority
          className="h-auto max-h-[92px] w-full object-contain"
        />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close dashboard menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <label className="relative mb-4 block shrink-0">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          placeholder="Search..."
          className="h-10 w-full rounded-lg border border-white/20 bg-white pl-10 pr-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-blue-300"
        />
      </label>

      <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        <div className="border-t border-white/80 pt-5">
          <p className="mb-2 px-4 text-xs font-medium text-white/80">Menu</p>
          <nav className="space-y-2">
            {visibleItems.map((item) => {
              const isActive = isActiveRoute(item.href, pathname);
              const content = (
                <>
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </>
              );

              if (item.href === "#") {
                return (
                  <button
                    key={item.label}
                    type="button"
                    className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-white text-slate-700 shadow-sm"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {content}
                </Link>
              );
            })}
          </nav>
        </div>

        {visibleSupport.length > 0 ? (
        <div className="mt-5 border-t border-white/80 py-5">
          <p className="mb-2 px-4 text-xs font-medium text-white/80">Help</p>
          <div className="space-y-2">
            {visibleSupport.map((item) => {
              const isActive = isActiveRoute(item.href, pathname);
              const content = (
                <>
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </>
              );

              if (item.href === "#") {
                return (
                  <button
                    key={item.label}
                    type="button"
                    className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-white text-slate-700 shadow-sm"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => {
          logout();
          router.push("/");
        }}
        className="mt-3 flex h-14 shrink-0 items-center justify-center gap-3 rounded-lg border-8 border-blue-200 bg-slate-100 text-sm font-bold text-red-500 transition-colors hover:bg-white"
      >
        <LogOut className="h-5 w-5" />
        Log out
      </button>
    </aside>
  );
}

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-[#F8FAFC]/95 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm lg:hidden"
          aria-label="Open dashboard menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="text-slate-500">Dashboard</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900">{getBreadcrumb(pathname)}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
        <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-200">
            <Image
              src="/images/aboutImage.png"
              alt={user?.name ?? "Account"}
              fill
              className="object-cover object-top"
            />
          </div>
          <div className="pr-6">
            <p className="text-sm font-bold text-indigo-900">{user?.name ?? "Guest"}</p>
            <p className="text-xs font-medium capitalize text-slate-500">
              {user?.role ?? "user"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close dashboard menu overlay"
          />
          <div className="relative h-full">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-[272px]">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="px-4 py-5 md:px-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
