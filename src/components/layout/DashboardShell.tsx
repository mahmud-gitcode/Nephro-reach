"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { buttonStyles } from "@/components/ui";
import { getJourneyDayBySlug } from "@/features/education/dialysisJourneyData";
import EmergencyModal from "@/features/emergency/EmergencyModal";
import WheresMyRideModal from "@/features/travel/WheresMyRideModal";
import { ArrowLeft, LogOut, Menu, X } from "lucide-react";
import { LocalSvg } from "@/components/icons/LocalSvg";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";
import {
  getBreadcrumb,
  getBreadcrumbTrail,
  getNavLabel,
  isActiveRoute,
  sidebarItems,
  supportItems,
} from "./navigation";

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const role = user?.role ?? "user";
  const visibleItems = sidebarItems.filter((item) => item.roles.includes(role));
  const visibleSupport = supportItems.filter((item) =>
    item.roles.includes(role),
  );

  return (
    <aside className="flex h-full w-[272px] shrink-0 flex-col overflow-hidden bg-surface-nav px-inset-md py-inset-md text-fg-on-nav print:hidden">
      <div className="relative mb-stack-md flex shrink-0 items-center justify-center rounded-control-small bg-surface p-inset-sm">
        <Link
          href="/dashboard"
          className="flex w-full items-center justify-center"
        >
          <Image
            src="/images/logo.svg"
            alt="NephroReach"
            width={240}
            height={190}
            priority
            className="h-[190px] w-full shrink-0 object-contain"
          />
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 cursor-pointer rounded-control-small p-1 text-fg-muted transition-colors duration-150 ease-standard hover:bg-surface-sunken hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
            aria-label="Close dashboard menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        <div className="pt-2">
          <p className="mb-stack-sm px-inset-md text-overline text-fg-on-nav/80">
            {language === "ES" ? "Menú" : "Menu"}
          </p>
          <nav className="space-y-2">
            {visibleItems.map((item) => {
              const isActive = isActiveRoute(item.href, pathname);
              const label = getNavLabel(item.href, item.label, language);
              const content = (
                <>
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{label}</span>
                </>
              );

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex h-11 w-full items-center gap-inline-lg rounded-control px-inset-sm text-label-md transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg-on-nav ${
                    isActive
                      ? "bg-surface text-fg-secondary shadow-sm"
                      : "text-fg-on-nav hover:bg-fg-on-nav/10"
                  }`}
                >
                  {content}
                </Link>
              );
            })}
          </nav>
        </div>

        {visibleSupport.length > 0 ? (
          <div className="mt-stack-xl border-t border-fg-on-nav/30 py-inset-lg">
            <p className="mb-stack-sm px-inset-md text-overline text-fg-on-nav/80">
              {language === "ES" ? "Ayuda" : "Help"}
            </p>
            <div className="space-y-2">
              {visibleSupport.map((item) => {
                const isActive = isActiveRoute(item.href, pathname);
                const label = getNavLabel(item.href, item.label, language);
                const content = (
                  <>
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span>{label}</span>
                  </>
                );

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex h-11 w-full items-center gap-inline-lg rounded-control px-inset-sm text-label-md transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg-on-nav ${
                      isActive
                        ? "bg-surface text-fg-secondary shadow-sm"
                        : "text-fg-on-nav hover:bg-fg-on-nav/10"
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
        className="mt-stack-md flex h-14 shrink-0 cursor-pointer items-center justify-center gap-inline-lg rounded-control bg-surface text-label-md text-danger transition-colors duration-150 ease-standard hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg-on-nav"
      >
        <LogOut className="h-5 w-5" />
        {language === "ES" ? "Cerrar sesión" : "Log out"}
      </button>
    </aside>
  );
}

function HeaderIcon({
  src,
  className = "size-6",
}: {
  src: string;
  className?: string;
}) {
  return (
    <span className={`relative block shrink-0 overflow-clip ${className}`}>
      <LocalSvg src={src} alt="" className="size-full" />
    </span>
  );
}

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setLangOpen((open) => !open)}
        className="flex cursor-pointer items-center gap-inline-xs rounded-control border-b-2 border-line-strong bg-surface-sunken p-1.5 shadow-sm transition-colors duration-150 ease-standard hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:gap-inline-md sm:p-2.5"
        aria-label={language === "ES" ? "Cambiar idioma" : "Change language"}
      >
        <span className="relative h-4.5 w-6 shrink-0 overflow-clip rounded-[2px] sm:h-6 sm:w-[33px]">
          <LocalSvg
            src={
              language === "ES"
                ? "/images/dashboard-header/spain-flag.svg"
                : "/images/dashboard-header/usa-flag.svg"
            }
            alt=""
            className="size-full object-cover"
          />
        </span>
        <HeaderIcon
          src="/images/dashboard-header/arrow-down.svg"
          className="size-3 sm:size-4"
        />
      </button>
      {langOpen ? (
        <div className="absolute right-0 z-50 mt-stack-sm w-28 rounded-control border border-line bg-surface-raised py-inset-xs text-body-sm shadow-md">
          {(["EN", "ES"] as const).map((code) => (
            <button
              key={code}
              type="button"
              aria-current={language === code ? "true" : undefined}
              className={`block w-full cursor-pointer px-inset-sm py-1.5 text-left transition-colors duration-150 ease-standard hover:bg-surface-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${
                language === code
                  ? "text-label-md text-fg-brand"
                  : "text-fg-secondary"
              }`}
              onClick={() => {
                setLanguage(code);
                setLangOpen(false);
              }}
            >
              {code === "EN"
                ? language === "ES"
                  ? "Inglés"
                  : "English"
                : language === "ES"
                  ? "Español"
                  : "Spanish"}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Header for the distraction-free classroom view.
 *
 * The dashboard sidebar and breadcrumb bar are hidden while a lesson is open,
 * so this keeps the two things a learner still needs: the way back out, and
 * the language toggle the transcript follows.
 */
function ClassroomHeader() {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-inline-lg border-b border-line bg-surface px-inset-sm py-inset-xs sm:px-inset-md sm:py-2.5 md:px-inset-lg print:hidden">
      <Link
        href="/dashboard"
        className="flex shrink-0 items-center"
        aria-label="NephroReach"
      >
        <Image
          src="/images/logo.svg"
          alt="NephroReach"
          width={160}
          height={48}
          priority
          className="h-9 w-auto object-contain sm:h-11"
        />
      </Link>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <LanguageSwitcher />

        {/* Leaving a lesson drops back into the course, not the main dashboard. */}
        <Link
          href="/dashboard/my-classroom"
          className={buttonStyles({ size: "small" })}
        >
          <ArrowLeft className="size-4 shrink-0" />
          <span className="hidden min-[420px]:inline">
            {isEs ? "Volver a Mi Salón de Clases" : "Back to My Classroom"}
          </span>
          <span className="min-[420px]:hidden">
            {isEs ? "Salón" : "Classroom"}
          </span>
        </Link>
      </div>
    </header>
  );
}

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const isUser = user?.role === "user";
  const trail = getBreadcrumbTrail(pathname, language);
  const currentPage = getBreadcrumb(pathname, language);
  const avatarSrc = isUser
    ? "/images/dashboard-header/user-avatar.png"
    : "/images/dashboard-header/admin-avatar.png";
  const bellSrc = isUser
    ? "/images/dashboard-header/user-bell.svg"
    : "/images/dashboard-header/admin-bell.svg";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-inline-md border-b border-line bg-white px-inset-sm py-2.5 sm:px-inset-md sm:py-inset-sm md:px-inset-xl print:hidden">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="shrink-0 cursor-pointer rounded-control border border-line bg-surface p-1.5 text-fg-secondary shadow-sm transition-colors duration-150 ease-standard hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-2 lg:hidden"
          aria-label={
            language === "ES" ? "Abrir menú del panel" : "Open dashboard menu"
          }
        >
          <Menu className="h-5 w-5" />
        </button>
        <nav className="flex min-w-0 items-center gap-2 overflow-hidden text-xs font-medium tracking-[0.08px] sm:gap-4 sm:text-base">
          {isUser ? (
            <>
              {/* Mobile: concise active page title */}
              <span className="truncate text-label-md text-fg sm:hidden">
                {trail[trail.length - 1] ?? "Dashboard"}
              </span>
              {/* Tablet/Desktop: full breadcrumbs trail */}
              <div className="hidden items-center gap-3 truncate sm:flex md:gap-4">
                {trail.map((item, index) => {
                  const last = index === trail.length - 1;
                  let href: string | null = null;
                  if (item === "Dashboard" || item === "Panel")
                    href = "/dashboard";
                  else if (
                    item === "Before-the-ER" ||
                    item === "Antes de Urgencias"
                  )
                    href = "/dashboard/before-the-er";
                  else if (
                    item === "Personal Log" ||
                    item === "Registro Personal"
                  )
                    href = "/dashboard/personal-log";
                  else if (
                    item === "My Classroom" ||
                    item === "Mi Salón de Clases"
                  )
                    href = "/dashboard/my-classroom";
                  else if (item === "My Library" || item === "Mi Biblioteca")
                    href = "/dashboard/my-library";

                  return (
                    <span
                      key={`${item}-${index}`}
                      className="flex items-center gap-3 md:gap-4"
                    >
                      {index > 0 ? (
                        <span
                          aria-hidden="true"
                          className="text-body-sm text-fg-subtle"
                        >
                          /
                        </span>
                      ) : null}
                      {href && !last ? (
                        <Link
                          href={href}
                          className="rounded-control-small text-fg-muted transition-colors duration-150 ease-standard hover:text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          {item}
                        </Link>
                      ) : (
                        <span
                          aria-current={last ? "page" : undefined}
                          className={
                            last ? "text-label-md text-fg" : "text-fg-muted"
                          }
                        >
                          {item}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="hidden rounded-control-small text-fg-muted transition-colors duration-150 ease-standard hover:text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:inline"
              >
                {language === "ES" ? "Panel" : "Dashboard"}
              </Link>
              <span
                aria-hidden="true"
                className="hidden text-body-sm text-fg-subtle sm:inline"
              >
                /
              </span>
              <span
                aria-current="page"
                className="truncate text-label-md text-fg"
              >
                {currentPage}
              </span>
            </>
          )}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 lg:gap-4">
        {/* Language Switcher - Compact on mobile, full on desktop */}
        {isUser ? <LanguageSwitcher /> : null}

        {/* Notifications Button */}
        <button
          {...notBuiltYet("Notifications")}
          type="button"
          className="flex cursor-pointer items-center rounded-control border-b-2 border-line-strong bg-surface-sunken p-1.5 shadow-sm transition-all duration-150 ease-standard hover:bg-line hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-2"
          aria-label={language === "ES" ? "Notificaciones" : "Notifications"}
        >
          <HeaderIcon src={bellSrc} className="size-4 sm:size-5" />
        </button>

        <span aria-hidden="true" className="hidden h-6 w-px bg-line sm:block" />

        {/* Emergency Button - Compact on mobile, full on desktop */}
        {isUser ? (
          <button
            type="button"
            onClick={() => setEmergencyOpen(true)}
            className="flex shrink-0 cursor-pointer items-center gap-inline-xs rounded-control bg-danger-solid px-inset-xs py-1.5 text-label-md text-danger-on-solid shadow-sm transition-all duration-150 ease-standard hover:bg-danger-solid-hover hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:gap-inline-md sm:px-3.5 sm:py-inset-sm"
            title={language === "ES" ? "Emergencia" : "Emergency"}
          >
            <HeaderIcon
              src="/images/dashboard-header/danger.svg"
              className="size-3.5 sm:size-5"
            />
            <span className="hidden min-[440px]:inline">
              {language === "ES" ? "Emergencia" : "Emergency"}
            </span>
            <span className="min-[440px]:hidden">
              {language === "ES" ? "SOS" : "SOS"}
            </span>
          </button>
        ) : null}

        {/* Profile Avatar & Info - Compact avatar on mobile, name + role on desktop */}
        <div className="flex shrink-0 items-center gap-inline-sm rounded-control border-y border-line bg-surface-sunken p-1 shadow-sm sm:gap-inline-lg sm:px-inset-xs sm:py-1.5">
          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-pill bg-line sm:h-10 sm:w-[42px]">
            <Image
              src={avatarSrc}
              alt=""
              fill
              sizes="42px"
              className="object-cover"
            />
          </div>
          <div className="hidden w-[140px] min-w-0 lg:block xl:w-[174px]">
            <p className="truncate text-label-lg text-fg">
              {user?.name ?? (language === "ES" ? "Invitado" : "Guest")}
            </p>
            <p className="truncate text-caption text-fg-muted">
              {user?.role === "admin"
                ? language === "ES"
                  ? "Administrador"
                  : "Admin"
                : language === "ES"
                  ? "Usuario"
                  : "User"}
            </p>
          </div>
        </div>
      </div>

      <EmergencyModal
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
      />
    </header>
  );
}

/** A single journey lesson, e.g. /dashboard/my-classroom/day-03. */
function isClassroomRoute(pathname: string) {
  const slug = pathname.split("/").pop() || "";
  return (
    /^\/dashboard\/my-classroom\/[^/]+$/.test(pathname) &&
    Boolean(getJourneyDayBySlug(slug))
  );
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rideModalOpen, setRideModalOpen] = useState(false);

  if (isClassroomRoute(pathname)) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] font-sans text-fg">
        <ClassroomHeader />
        <main className="px-4 py-5 md:px-6">{children}</main>
      </div>
    );
  }

  return (
    /* The portal sits on one flat colour, #fcfcfd, behind every page. */
    <div className="min-h-screen bg-[#fcfcfd] font-sans text-fg">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-fg/50"
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

      <WheresMyRideModal
        isOpen={rideModalOpen}
        onClose={() => setRideModalOpen(false)}
      />
    </div>
  );
}
