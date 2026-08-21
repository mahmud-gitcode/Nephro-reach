"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CreditCard,
  FlaskConical,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Settings,
  Users,
  Video,
  X,
} from "lucide-react";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const sidebarItems: Array<{ label: string; href: string; icon: IconType }> = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Member", href: "/dashboard/members", icon: Users },
  { label: "Class Management", href: "#", icon: FlaskConical },
  { label: "Live Class", href: "#", icon: Video },
  { label: "SMS Analytics", href: "#", icon: MessageCircle },
  { label: "Subscriptions", href: "#", icon: CreditCard },
];

const supportItems: Array<{ label: string; icon: IconType }> = [
  { label: "Support", icon: HelpCircle },
  { label: "Setting", icon: Settings },
];

function getBreadcrumb(pathname: string) {
  if (pathname === "/dashboard") return "Breadcrumb";
  if (pathname.startsWith("/dashboard/members")) return "Member";
  return "Breadcrumb";
}

function isActiveRoute(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return href !== "#" && pathname.startsWith(href);
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[272px] shrink-0 flex-col bg-[#06265B] px-4 py-4 text-white">
      <div className="mb-3 flex items-start justify-between gap-3 rounded bg-white p-3">
        <Image
          src="/images/logo.svg"
          alt="NephroReach"
          width={216}
          height={171}
          priority
          className="h-auto w-full object-contain"
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

      <label className="relative mb-8 block">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          placeholder="Search..."
          className="h-10 w-full rounded-lg border border-white/20 bg-white pl-10 pr-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-blue-300"
        />
      </label>

      <div className="border-t border-white/80 pt-5">
        <p className="mb-2 px-4 text-xs font-medium text-white/80">Menu</p>
        <nav className="space-y-2">
          {sidebarItems.map((item) => {
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

      <div className="mt-auto border-y border-white/80 py-5">
        <p className="mb-2 px-4 text-xs font-medium text-white/80">Help</p>
        <div className="space-y-2">
          {supportItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="mt-5 flex h-16 items-center justify-center gap-3 rounded-lg border-8 border-blue-200 bg-slate-100 text-sm font-bold text-red-500 transition-colors hover:bg-white"
      >
        <LogOut className="h-5 w-5" />
        Log out
      </button>
    </aside>
  );
}

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();

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
              alt="Jenny Wilson"
              fill
              className="object-cover object-top"
            />
          </div>
          <div className="pr-6">
            <p className="text-sm font-bold text-indigo-900">Jenny Wilson</p>
            <p className="text-xs font-medium text-slate-500">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
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
