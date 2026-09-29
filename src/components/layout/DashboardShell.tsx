"use client";

import React, { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { canAccessPath } from "@/features/auth/auth";
import { useLanguage } from "@/context/LanguageContext";
import {
  Button,
  buttonStyles,
  menuItemStyles,
  menuStyles,
} from "@/components/ui";
import { getJourneyDayBySlug } from "@/features/education/dialysisJourneyData";
import EmergencyModal from "@/features/emergency/EmergencyModal";
import WheresMyRideModal from "@/features/travel/WheresMyRideModal";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  Settings,
  TriangleAlert,
  X,
} from "lucide-react";
import { LocalSvg } from "@/components/icons/LocalSvg";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";
import { useDismiss } from "@/lib/utils/useDismiss";
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
          {/* Width-driven, height auto. Pinning the height instead left the
            rendered height matching the `height` prop while the width did
            not match `width`, which is exactly the one-dimension-modified
            case next/image warns about. The sidebar is narrower than the
            logo's natural 240px at this height, so `object-contain` was
            already letterboxing it — filling the width at its own ratio
            draws the same logo without the dead space above and below. */}
          <Image
            src="/images/logo.svg"
            alt="NephroReach"
            width={240}
            height={190}
            priority
            className="h-auto w-full shrink-0"
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

/* ==========================================================================
   Top bar controls
   --------------------------------------------------------------------------
   Every control in the top bar is the same object: a 40px white pill with a
   hairline, the reference's round icon buttons stretched to fit a label.
   The menus they open use the shared menuStyles, the same floating card
   as a dropdown list (select.css), so a language menu, an account menu and a <select> all
   look like one family.
   ========================================================================== */
const topBarControl =
  "flex h-control-small min-w-control-small shrink-0 cursor-pointer items-center justify-center gap-inline-sm rounded-pill border border-line bg-surface px-3 text-fg transition-colors duration-150 ease-standard hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const close = useCallback(() => setLangOpen(false), []);
  const wrapRef = useDismiss<HTMLDivElement>(langOpen, close);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setLangOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={langOpen}
        className={topBarControl}
        aria-label={language === "ES" ? "Cambiar idioma" : "Change language"}
      >
        <span className="relative size-5 shrink-0 overflow-clip rounded-pill ring-1 ring-line">
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
        <span className="hidden text-label-md text-fg sm:inline">
          {language}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 text-fg-muted transition-transform duration-150 ease-standard ${
            langOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {langOpen ? (
        <div role="menu" className={`${menuStyles} right-0 w-40`}>
          {(["EN", "ES"] as const).map((code) => {
            const current = language === code;
            return (
              <button
                key={code}
                type="button"
                role="menuitemradio"
                aria-checked={current}
                className={`${menuItemStyles} ${
                  current
                    ? "bg-primary-soft text-label-md text-fg-brand"
                    : "text-fg hover:bg-surface-sunken"
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
                {current ? (
                  <Check aria-hidden="true" className="ml-auto size-4" />
                ) : null}
              </button>
            );
          })}
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
  const homeLabel = language === "ES" ? "Panel" : "Dashboard";
  const onHome = currentPage === homeLabel;
  const avatarSrc = isUser
    ? "/images/dashboard-header/user-avatar.png"
    : "/images/dashboard-header/admin-avatar.png";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-inline-md border-b border-line bg-surface px-inset-sm py-2.5 sm:px-inset-md sm:py-inset-sm md:px-inset-xl print:hidden">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className={`${topBarControl} px-0 lg:hidden`}
          aria-label={
            language === "ES" ? "Abrir menú del panel" : "Open dashboard menu"
          }
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
        <nav className="flex min-w-0 items-center gap-inline-sm overflow-hidden text-body-sm text-fg-muted">
          {isUser ? (
            <>
              {/* Mobile: concise active page title */}
              <span className="truncate text-label-md text-fg sm:hidden">
                {trail[trail.length - 1] ?? "Dashboard"}
              </span>
              {/* Tablet/Desktop: full breadcrumbs trail */}
              <div className="hidden items-center gap-inline-sm truncate sm:flex">
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
                      className="flex items-center gap-inline-sm"
                    >
                      {index > 0 ? (
                        <ChevronRight
                          aria-hidden="true"
                          className="size-4 shrink-0 text-fg-subtle"
                        />
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
              {/* On the dashboard itself the trail would read
                  "Dashboard > Dashboard"; the page's own name says it. */}
              {onHome ? null : (
                <>
                  <Link
                    href="/dashboard"
                    className="hidden rounded-control-small text-fg-muted transition-colors duration-150 ease-standard hover:text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:inline"
                  >
                    {homeLabel}
                  </Link>
                  <ChevronRight
                    aria-hidden="true"
                    className="hidden size-4 shrink-0 text-fg-subtle sm:block"
                  />
                </>
              )}
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

      <div className="flex shrink-0 items-center gap-inline-sm sm:gap-inline-md">
        {/* Language Switcher - Compact on mobile, full on desktop */}
        {isUser ? <LanguageSwitcher /> : null}

        <Button
          {...notBuiltYet("Notifications")}
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          iconOnly
          aria-label={language === "ES" ? "Notificaciones" : "Notifications"}
        >
          <Bell aria-hidden="true" />
        </Button>

        {/* The one loud thing in the bar, and only for members. */}
        {isUser ? (
          <Button
            variant="danger"
            size="small"
            onClick={() => setEmergencyOpen(true)}
            leadingIcon={<TriangleAlert aria-hidden="true" />}
            className="shrink-0"
          >
            <span className="hidden min-[440px]:inline">
              {language === "ES" ? "Emergencia" : "Emergency"}
            </span>
            <span className="min-[440px]:hidden">SOS</span>
          </Button>
        ) : null}

        <span aria-hidden="true" className="hidden h-6 w-px bg-line sm:block" />

        {/* Profile Avatar & Info - Compact avatar on mobile, name + role on desktop */}
        <ProfileMenu avatarSrc={avatarSrc} />
      </div>

      <EmergencyModal
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
      />
    </header>
  );
}

/* ==========================================================================
   Profile menu
   --------------------------------------------------------------------------
   The avatar was a plain <div>: bordered, shadowed and sitting between two
   real buttons, so it read as tappable and did nothing at all. It now opens
   the account menu it always looked like it would.

   The name and role are inside the panel as well as beside the avatar,
   because the text beside it is hidden below `lg` — on a phone the avatar
   was the only thing on screen identifying who was signed in, and tapping
   it is the obvious way to ask.
   ========================================================================== */

function ProfileMenu({ avatarSrc }: { avatarSrc: string }) {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const isEs = language === "ES";

  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const wrapRef = useDismiss<HTMLDivElement>(open, close);

  const name = user?.name ?? (isEs ? "Invitado" : "Guest");
  const roleLabel =
    user?.role === "admin"
      ? isEs
        ? "Administrador"
        : "Admin"
      : user?.role === "clinic"
        ? isEs
          ? "Clínica"
          : "Clinic"
        : isEs
          ? "Usuario"
          : "User";

  /* Settings is a member route, so an admin is not offered a link that
     would bounce them straight back out of it. */
  const canOpenSettings = canAccessPath(
    user?.role ?? "user",
    "/dashboard/settings",
  );

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={isEs ? `Cuenta de ${name}` : `Account menu for ${name}`}
        className={`${topBarControl} px-1 lg:pr-3`}
      >
        <span className="relative size-8 shrink-0 overflow-hidden rounded-pill bg-line">
          <Image
            src={avatarSrc}
            alt=""
            fill
            sizes="32px"
            className="object-cover"
          />
        </span>
        <span className="hidden max-w-44 min-w-0 text-left lg:block">
          <span className="block truncate text-label-md leading-tight text-fg">
            {name}
          </span>
          <span className="block truncate text-caption leading-tight text-fg-muted">
            {roleLabel}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`hidden h-4 w-4 shrink-0 text-fg-muted transition-transform duration-150 ease-standard lg:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={isEs ? "Cuenta" : "Account"}
          className={`${menuStyles} right-0 w-60 max-w-[calc(100vw-2rem)]`}
        >
          {/* Who is signed in. Below `lg` this is the only place it is said. */}
          <div className="border-b border-line px-3 pt-1.5 pb-2.5">
            <p className="truncate text-label-lg text-fg">{name}</p>
            <p className="truncate text-caption text-fg-muted">{roleLabel}</p>
          </div>

          <div className="pt-1.5">
            {canOpenSettings ? (
              <Link
                href="/dashboard/settings"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`${menuItemStyles} text-fg hover:bg-surface-sunken`}
              >
                <Settings aria-hidden="true" className="h-4 w-4 shrink-0" />
                {isEs ? "Configuración" : "Settings"}
              </Link>
            ) : null}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logout();
                router.push("/");
              }}
              className={`${menuItemStyles} text-danger hover:bg-danger-surface`}
            >
              <LogOut aria-hidden="true" className="h-4 w-4 shrink-0" />
              {isEs ? "Cerrar sesión" : "Log out"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
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
      /* No sidebar here, so the whole page is canvas (tokens/canvas.css). */
      <div data-canvas className="min-h-screen bg-canvas font-sans text-fg">
        <ClassroomHeader />
        <main className="px-4 py-5 md:px-6">{children}</main>
      </div>
    );
  }

  return (
    /* The portal sits on --canvas behind every page. It was a hardcoded
       #fcfcfd, which is why changing the token did nothing until now. */
    <div className="min-h-screen bg-canvas font-sans text-fg">
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

      {/* The canvas: top bar and page, never the sidebar. It takes the
          redesign's tokens (tokens/canvas.css), so it paints its own ground
          and text colour rather than inheriting the shell's. */}
      <div data-canvas className="min-h-screen bg-canvas text-fg lg:pl-[272px]">
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
