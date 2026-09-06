"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { UserRole } from "@/lib/auth";
import EmergencyModal from "@/components/dashboard/EmergencyModal";
import WheresMyRideModal from "@/components/dashboard/WheresMyRideModal";
import {
  BookOpen,
  Car,
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
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type NavItem = { label: string; href: string; icon: IconType; roles: UserRole[] };

const sidebarItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "user"] },
  { label: "Where's My Ride", href: "/dashboard/my-rides", icon: Car, roles: ["user"] },
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
    label: "Notification Analytics",
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
  { label: "Trash", href: "/dashboard/trash", icon: Trash2, roles: ["user"] },
];

function getBreadcrumb(pathname: string, language?: string) {
  if (pathname === "/dashboard" || pathname === "/dashboard/")
    return language === "ES" ? "Panel" : "Dashboard";
  if (pathname.startsWith("/dashboard/trash"))
    return language === "ES" ? "Papelera" : "Trash";
  if (pathname.startsWith("/dashboard/before-the-er/")) {
    const slug = pathname.split("/").pop() || "";
    if (language === "ES") {
      const spanishTitles: Record<string, string> = {
        "chest-pain": "Dolor en el Pecho",
        "severe-fluid-overload": "Sobrecarga Grave de Líquidos",
        "signs-of-stroke": "Signos de Accidente Cerebrovascular",
        "loss-of-consciousness": "Pérdida del Conocimiento",
        "severe-allergic-reactions": "Reacciones Alérgicas Graves",
        "severe-shortness-of-breath": "Dificultad Respiratoria Grave",
        "seizures": "Convulsiones",
        "dialysis-access-emergencies": "Emergencias del Acceso de Diálisis",
        "severe-bleeding": "Sangrado Intenso",
        "severe-hyperkalemia-symptoms": "Síntomas de Hiperpotasemia Grave",
        "fever-with-dialysis-catheter": "Fiebre con Catéter de Diálisis",
        "confusion-or-mental-status-changes": "Confusión o Cambios en el Estado Mental",
      };
      if (spanishTitles[slug]) return spanishTitles[slug];
    }
    const formatted = slug.replace(/-/g, " ").replace(/%20/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return formatted || "Symptom Detail";
  }
  if (pathname.startsWith("/dashboard/before-the-er")) return language === "ES" ? "Antes de Urgencias" : "Before-the-ER";
  if (pathname.startsWith("/dashboard/my-health")) return language === "ES" ? "Mi Salud" : "MyHealth";
  if (pathname.startsWith("/dashboard/personal-log/blood-results/add"))
    return "Add Blood Results";
  if (pathname.startsWith("/dashboard/personal-log/blood-results"))
    return "Blood Results";
  if (pathname.startsWith("/dashboard/my-rides")) return language === "ES" ? "¿Dónde está mi conductor?" : "Where's My Ride";
  if (pathname.startsWith("/dashboard/personal-log/blood-pressure/add"))
    return language === "ES" ? "Agregar Presión Arterial" : "Add Blood Pressure";
  if (pathname.startsWith("/dashboard/personal-log/blood-pressure"))
    return language === "ES" ? "Registro de Presión Arterial" : "Blood Pressure Log";
  if (pathname.startsWith("/dashboard/personal-log/lab-tracking/add"))
    return language === "ES" ? "Agregar Resultado de Laboratorio" : "Add Lab Result";
  if (pathname.startsWith("/dashboard/personal-log/lab-tracking"))
    return language === "ES" ? "Mis Laboratorios" : "My Labs";
  if (pathname.startsWith("/dashboard/personal-log/medications/add"))
    return language === "ES" ? "Agregar Medicamento" : "Add Medication";
  if (pathname.startsWith("/dashboard/personal-log/medications"))
    return language === "ES" ? "Registro de Medicamentos" : "Medication Log";
  if (pathname.startsWith("/dashboard/personal-log/appointments"))
    return language === "ES" ? "Citas" : "Appointments";
  if (pathname.startsWith("/dashboard/personal-log/nutrition"))
    return language === "ES" ? "Nutrición" : "Nutrition";
  if (pathname.startsWith("/dashboard/personal-log/dialysis-treatment/add"))
    return language === "ES" ? "Registrar Tratamiento de Diálisis" : "Log Dialysis Treatment";
  if (pathname.startsWith("/dashboard/personal-log/dialysis-treatment/view"))
    return language === "ES" ? "Detalles del Tratamiento" : "Treatment Details";
  if (pathname.startsWith("/dashboard/personal-log/dialysis-treatment"))
    return language === "ES" ? "Tratamiento de Diálisis" : "Dialysis Treatment";
  if (pathname.startsWith("/dashboard/personal-log/fluid-tracker"))
    return language === "ES" ? "Control de Peso y Líquidos" : "Weight & Fluid Tracker";
  if (pathname.startsWith("/dashboard/personal-log/dialysis-journal"))
    return language === "ES" ? "Diario de Diálisis" : "Dialysis Journal";
  if (pathname.startsWith("/dashboard/personal-log/dialysis-management"))
    return language === "ES" ? "Gestión de Diálisis" : "Dialysis Management";
  if (pathname.startsWith("/dashboard/personal-log"))
    return language === "ES" ? "Registro Personal" : "Personal Log";
  if (pathname.startsWith("/dashboard/members"))
    return language === "ES" ? "Miembros" : "Member";
  if (pathname.startsWith("/dashboard/manage-curriculum"))
    return language === "ES" ? "Gestión de Clases" : "Manage curriculum";
  if (pathname.startsWith("/dashboard/education-center"))
    return language === "ES" ? "Centro Educativo" : "Education Center";
  if (pathname.startsWith("/dashboard/live-class"))
    return language === "ES" ? "Clases en Vivo" : "Live Class";
  if (pathname.startsWith("/dashboard/community"))
    return language === "ES" ? "Comunidad" : "Community";
  if (pathname.startsWith("/dashboard/sms-analytics"))
    return language === "ES" ? "Análisis de Notificaciones" : "Notification Analytics";
  if (pathname.startsWith("/dashboard/subscriptions"))
    return language === "ES" ? "Suscripciones" : "Subscriptions";
  if (pathname.startsWith("/dashboard/support"))
    return language === "ES" ? "Soporte" : "Support";
  if (pathname.startsWith("/dashboard/settings"))
    return language === "ES" ? "Configuración" : "Setting";
  return language === "ES" ? "Panel" : "Breadcrumb";
}

function getNavLabel(href: string, defaultLabel: string, language?: string): string {
  if (language !== "ES") return defaultLabel;
  const spanishLabels: Record<string, string> = {
    "/dashboard": "Panel",
    "/dashboard/my-rides": "¿Dónde está mi conductor?",
    "/dashboard/before-the-er": "Antes de Urgencias",
    "/dashboard/my-health": "Mi Salud",
    "/dashboard/personal-log": "Registro Personal",
    "/dashboard/personal-log/dialysis-journal": "Diario de Diálisis",
    "/dashboard/members": "Miembros",
    "/dashboard/manage-curriculum": "Gestión de Clases",
    "/dashboard/education-center": "Centro Educativo",
    "/dashboard/live-class": "Clases en Vivo",
    "/dashboard/community": "Comunidad",
    "/dashboard/sms-analytics": "Análisis de Notificaciones",
    "/dashboard/subscriptions": "Suscripciones",
    "/dashboard/support": "Soporte",
    "/dashboard/settings": "Configuración",
    "/dashboard/trash": "Papelera",
  };
  return spanishLabels[href] || defaultLabel;
}

function getBreadcrumbTrail(pathname: string, language?: string) {
  const current = getBreadcrumb(pathname, language);
  const dashboardLabel = language === "ES" ? "Panel" : "Dashboard";
  const beforeTheErLabel = language === "ES" ? "Antes de Urgencias" : "Before-the-ER";
  const personalLogLabel = language === "ES" ? "Registro Personal" : "Personal Log";

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return [dashboardLabel];
  }
  if (pathname.startsWith("/dashboard/before-the-er/")) {
    return [dashboardLabel, beforeTheErLabel, current];
  }
  if (
    pathname.startsWith("/dashboard/personal-log/") &&
    !pathname.startsWith("/dashboard/personal-log/dialysis-journal")
  ) {
    return [dashboardLabel, personalLogLabel, current];
  }
  return [dashboardLabel, current];
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

function Sidebar({
  onClose,
  onOpenRideModal,
}: {
  onClose?: () => void;
  onOpenRideModal?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const role = user?.role ?? "user";
  const visibleItems = sidebarItems.filter((item) => item.roles.includes(role));
  const visibleSupport = supportItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="flex h-full w-[272px] shrink-0 flex-col overflow-hidden bg-[#06265B] px-4 py-4 text-white print:hidden">
      <div className="mb-3 flex shrink-0 items-start justify-between gap-3 rounded bg-white p-3">
        <Image
          src="/images/logo.svg"
          alt="NephroReach"
          width={240}
          height={190}
          priority
          className="h-[190px] w-[240px] shrink-0 object-contain"
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
          placeholder={language === "ES" ? "Buscar..." : "Search..."}
          className="h-10 w-full rounded-lg border border-white/20 bg-white pl-10 pr-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-blue-300"
        />
      </label>

      <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        <div className="border-t border-white/80 pt-5">
          <p className="mb-2 px-4 text-xs font-medium text-white/80">
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
          <p className="mb-2 px-4 text-xs font-medium text-white/80">
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
        className="mt-3 flex h-14 shrink-0 items-center justify-center gap-3 rounded-lg border-8 border-blue-200 bg-slate-100 text-sm font-bold text-red-500 transition-colors hover:bg-white cursor-pointer"
      >
        <LogOut className="h-5 w-5" />
        {language === "ES" ? "Cerrar sesión" : "Log out"}
      </button>
    </aside>
  );
}

function HeaderIcon({ src }: { src: string }) {
  return (
    <span className="relative block size-6 overflow-clip">
      <img src={src} alt="" className="size-full" />
    </span>
  );
}

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
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
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 md:px-8 print:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm lg:hidden cursor-pointer"
          aria-label={language === "ES" ? "Abrir menú del panel" : "Open dashboard menu"}
        >
          <Menu className="h-5 w-5" />
        </button>
        <nav className="flex min-w-0 flex-wrap items-center gap-4 text-base font-medium tracking-[0.08px]">
          {isUser
            ? trail.map((item, index) => {
                const last = index === trail.length - 1;
                let href: string | null = null;
                if (item === "Dashboard" || item === "Panel") href = "/dashboard";
                else if (item === "Before-the-ER" || item === "Antes de Urgencias") href = "/dashboard/before-the-er";
                else if (item === "Personal Log" || item === "Registro Personal") href = "/dashboard/personal-log";

                return (
                  <span key={`${item}-${index}`} className="flex items-center gap-4">
                    {index > 0 ? (
                      <span className="text-sm font-normal tracking-[0.22px] text-[#919EAB]">/</span>
                    ) : null}
                    {href && !last ? (
                      <Link
                        href={href}
                        className="text-[#64748B] hover:text-blue-600 hover:underline transition-colors"
                      >
                        {item}
                      </Link>
                    ) : (
                      <span className={last ? "text-[#141A21] font-semibold" : "text-[#64748B]"}>{item}</span>
                    )}
                  </span>
                );
              })
            : (
              <>
                <Link href="/dashboard" className="text-[#64748B] hover:text-blue-600 hover:underline transition-colors">
                  {language === "ES" ? "Panel" : "Dashboard"}
                </Link>
                <span className="text-sm font-normal tracking-[0.22px] text-[#919EAB]">/</span>
                <span className="text-[#0F172A] font-semibold">{currentPage}</span>
              </>
            )}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        {isUser ? (
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setLangOpen((open) => !open)}
              className="flex items-center gap-2.5 rounded-xl border-b-2 border-[#111827] bg-[#F1F5FA] p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-colors hover:bg-slate-100 cursor-pointer"
              aria-label={language === "ES" ? "Cambiar idioma" : "Change language"}
            >
              <span className="relative h-6 w-[33px] overflow-clip rounded-[2px]">
                <img
                  src={language === "ES" ? "/images/dashboard-header/spain-flag.svg" : "/images/dashboard-header/uk-flag.svg"}
                  alt=""
                  className="size-full"
                />
              </span>
              <HeaderIcon src="/images/dashboard-header/arrow-down.svg" />
            </button>
            {langOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-28 rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-md">
                {(["EN", "ES"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    className={`block w-full px-3 py-1.5 text-left cursor-pointer ${
                      language === code ? "font-semibold text-blue-700" : "text-slate-700"
                    }`}
                    onClick={() => {
                      setLanguage(code);
                      setLangOpen(false);
                    }}
                  >
                    {code === "EN" ? (language === "ES" ? "Inglés" : "English") : (language === "ES" ? "Español" : "Spanish")}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          className="flex items-center rounded-[20px] border-b-2 border-[#111827] bg-[#F1F5FA] p-2 shadow-[0_1px_2px_rgba(0,0,0,0.1)] cursor-pointer"
          aria-label={language === "ES" ? "Notificaciones" : "Notifications"}
        >
          <HeaderIcon src={bellSrc} />
        </button>

        <span className="hidden h-8 w-px bg-slate-300 sm:block" />

        {isUser ? (
          <button
            type="button"
            onClick={() => setEmergencyOpen(true)}
            className="hidden items-center gap-2 rounded bg-[#EF4444] px-3.5 py-3 text-base font-bold tracking-[0.08px] text-white transition-colors hover:bg-red-600 sm:flex cursor-pointer"
          >
            <HeaderIcon src="/images/dashboard-header/danger.svg" />
            {language === "ES" ? "Emergencia" : "Emergency"}
          </button>
        ) : null}

        <div className="hidden items-center gap-3 rounded-xl border-y border-[#E2E8F0] bg-[#F6FAFD] px-2 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.1)] sm:flex">
          <div className="relative h-10 w-[42px] overflow-hidden rounded-full bg-slate-200">
            <Image src={avatarSrc} alt="" fill sizes="42px" className="object-cover" />
          </div>
          <div className="w-[174px] min-w-0">
            <p className="truncate text-base font-medium leading-6 tracking-[0.08px] text-[#33358E]">
              {user?.name ?? (language === "ES" ? "Invitado" : "Guest")}
            </p>
            <p className="truncate text-xs leading-4 tracking-[0.06px] text-[#4A4A68]">
              {user?.role === "admin"
                ? (language === "ES" ? "Administrador" : "Admin")
                : (language === "ES" ? "Usuario" : "User")}
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

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rideModalOpen, setRideModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <Sidebar onOpenRideModal={() => setRideModalOpen(true)} />
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
            <Sidebar
              onClose={() => setSidebarOpen(false)}
              onOpenRideModal={() => setRideModalOpen(true)}
            />
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
