import type React from "react";
import {
  Activity,
  Armchair,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Car,
  CreditCard,
  FileText,
  FlaskConical,
  GraduationCap,
  HelpCircle,
  HeartPulse,
  Hospital,
  LayoutDashboard,
  Layers,
  Library,
  Mic,
  Notebook,
  MessageCircle,
  MessagesSquare,
  MessageSquareText,
  Palette,
  Plane,
  Settings,
  ShieldAlert,
  Star,
  Stethoscope,
  UserPlus,
  UserCog,
  Users,
  Video,
} from "lucide-react";
import { UserRole } from "@/features/auth/auth";
import type { Permission } from "@/features/staff/staff";
import { getJourneyDayBySlug } from "@/features/education/dialysisJourneyData";
import { topicBySlug } from "@/features/emergency/beforeTheEr.topics";

/* ==========================================================================
   Dashboard navigation — routes, labels and breadcrumbs
   --------------------------------------------------------------------------
   Which nav items a role sees, what a route is called in each language, and
   the trail shown above the page. Pure: a pathname in, strings out.

   Pulled out of the 876-line shell because it is the part that decides
   whether a member can find where they are, and it had never been tested —
   `isActiveRoute` in particular, which has to mark /dashboard active on
   /dashboard and not on every route beneath it.
   ========================================================================== */

export type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export type NavItem = {
  label: string;
  href: string;
  icon: IconType;
  roles: UserRole[];
  /** For staff: the role permission the page needs (features/staff). */
  permission?: Permission;
};

export const sidebarItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "user"],
  },
  {
    label: "Where's My Ride",
    href: "/dashboard/my-rides",
    icon: Car,
    roles: ["user"],
  },
  {
    label: "Before-the-ER",
    href: "/dashboard/before-the-er",
    icon: Hospital,
    roles: ["user"],
  },
  {
    label: "MyHealth",
    href: "/dashboard/my-health",
    icon: HeartPulse,
    roles: ["user"],
  },
  {
    label: "Personal Log",
    href: "/dashboard/personal-log",
    icon: Layers,
    roles: ["user"],
  },
  {
    label: "Dialysis Journal",
    href: "/dashboard/personal-log/dialysis-journal",
    icon: Notebook,
    roles: ["user"],
  },
  {
    label: "Daily Check-in",
    href: "/dashboard/beyond-the-chair",
    icon: Armchair,
    roles: ["user"],
  },
  {
    label: "Dialysis Management",
    href: "/dashboard/personal-log/dialysis-management",
    icon: Hospital,
    roles: ["user"],
  },
  {
    label: "Vascular Access",
    href: "/dashboard/vascular-access",
    icon: Activity,
    roles: ["user"],
  },
  {
    label: "Dialysis Travel Log",
    href: "/dashboard/travel-log",
    icon: Plane,
    roles: ["user"],
  },
  {
    label: "Member",
    href: "/dashboard/members",
    icon: Users,
    roles: ["admin"],
  },
  {
    label: "Class Management",
    href: "/dashboard/manage-curriculum",
    icon: FlaskConical,
    roles: ["admin"],
  },
  {
    label: "Library Management",
    href: "/dashboard/manage-library",
    icon: Library,
    roles: ["admin"],
  },
  {
    label: "Table Talk Management",
    href: "/dashboard/manage-table-talk",
    icon: Mic,
    roles: ["admin"],
  },
  {
    label: "My Classroom",
    href: "/dashboard/my-classroom",
    icon: BookOpen,
    roles: ["user"],
  },
  {
    label: "My Library",
    href: "/dashboard/my-library",
    icon: Library,
    roles: ["user"],
  },
  {
    label: "Dialysis Table Talk",
    href: "/dashboard/table-talk",
    icon: Mic,
    roles: ["user"],
  },
  {
    label: "Live Class",
    href: "/dashboard/live-class",
    icon: Video,
    roles: ["admin"],
  },
  {
    label: "Messages",
    href: "/dashboard/messages",
    icon: MessageSquareText,
    roles: ["user"],
  },
  {
    label: "Community",
    href: "/dashboard/community",
    icon: MessagesSquare,
    roles: ["user"],
  },
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
  { label: "Reviews", href: "/dashboard/reviews", icon: Star, roles: ["user"] },
  {
    label: "Reviews Moderation",
    href: "/dashboard/admin-reviews",
    icon: Star,
    roles: ["admin"],
  },
  {
    label: "Community Moderation",
    href: "/dashboard/admin-community",
    icon: ShieldAlert,
    roles: ["admin"],
  },
  {
    label: "Testimonials Moderation",
    href: "/dashboard/admin-testimonials",
    icon: Video,
    roles: ["admin"],
  },
  {
    label: "Design System",
    href: "/dashboard/design-system",
    icon: Palette,
    roles: ["admin"],
  },

  /* Clinic portal. Every clinic route is namespaced under /dashboard/clinic
     so the role's pages can never collide with a member or admin route of
     the same name — "live-class" and "settings" already exist for both. */
  {
    label: "Dashboard",
    href: "/dashboard/clinic",
    icon: LayoutDashboard,
    roles: ["clinic", "nephrology"],
    permission: "dashboard.view",
  },
  {
    label: "Member",
    href: "/dashboard/clinic/members",
    icon: Users,
    roles: ["clinic", "nephrology"],
    permission: "dashboard.view",
  },
  {
    label: "Enroll Patients",
    href: "/dashboard/clinic/enroll-patients",
    icon: UserPlus,
    roles: ["clinic", "nephrology"],
    permission: "patients.enroll",
  },
  {
    label: "Curriculum Progress",
    href: "/dashboard/clinic/curriculum-progress",
    icon: GraduationCap,
    roles: ["clinic", "nephrology"],
    permission: "programs.view",
  },
  {
    label: "Live Class",
    href: "/dashboard/clinic/live-class",
    icon: Video,
    roles: ["clinic", "nephrology"],
    permission: "programs.view",
  },
  {
    label: "Check-ins",
    href: "/dashboard/clinic/checkins",
    icon: ClipboardCheck,
    roles: ["clinic", "nephrology"],
    permission: "checkins.view",
  },
  {
    label: "Vascular Access",
    href: "/dashboard/clinic/vascular-access",
    icon: Activity,
    roles: ["clinic", "nephrology"],
    permission: "access.view",
  },
  /* Patients' travel dialysis requests. Moved here from the admin menu
     (2026-09-29): arranging the chair away from home is the clinic's job. */
  {
    label: "Travel Requests",
    href: "/dashboard/clinic/travel",
    icon: Plane,
    roles: ["clinic"],
    permission: "travel.view",
  },
  /* The nephrology office (client, 2026-10-05): everything the clinic has
     except Travel Requests, plus CCM, which is its own. Its Messages are
     its threads with the access center; patient messaging stays with the
     dialysis center. */
  {
    label: "Chronic Care Management",
    href: "/dashboard/nephrology",
    icon: Stethoscope,
    roles: ["nephrology"],
  },
  /* Patients' lab charts; the administrator uploads by CSV (2026-10-01). */
  {
    label: "Labs",
    href: "/dashboard/clinic/labs",
    icon: FlaskConical,
    roles: ["clinic", "nephrology"],
    permission: "labs.view",
  },
  /* Patients' messages, like the clinic's (client, 2026-10-06); the
     threads with the access center have their own page. */
  {
    label: "Messages",
    href: "/dashboard/nephrology/messages",
    icon: MessageSquareText,
    roles: ["nephrology"],
    permission: "messages.view",
  },
  {
    label: "Access Center Messages",
    href: "/dashboard/nephrology/access-messages",
    icon: MessageSquareText,
    roles: ["nephrology"],
    permission: "messages.view",
  },
  {
    label: "Messages",
    href: "/dashboard/clinic/messages",
    icon: MessageSquareText,
    roles: ["clinic"],
    permission: "messages.view",
  },
  /* Vascular Access Center portal (2026-09-30): its own organisation and
     its access patients. Listed before Reports and Contract & Billing,
     which it shares with the other offices (2026-10-06), so its own pages
     come first in its menu. */
  {
    label: "Access Patients",
    href: "/dashboard/access-center",
    icon: Activity,
    roles: ["access"],
    permission: "access.workspace",
  },
  /* Its line to the dialysis center and the nephrology office (client,
     2026-10-01). */
  {
    label: "Messages",
    href: "/dashboard/access-center/messages",
    icon: MessageSquareText,
    roles: ["access"],
    permission: "access.messages",
  },
  {
    label: "Reports",
    href: "/dashboard/clinic/reports",
    icon: BarChart3,
    roles: ["clinic", "nephrology"],
    permission: "reports.view",
  },
  {
    label: "Contract & Billing",
    href: "/dashboard/clinic/billing",
    icon: FileText,
    roles: ["clinic", "nephrology", "access"],
    permission: "billing.view",
  },
];

export const supportItems: NavItem[] = [
  {
    label: "Support",
    href: "/dashboard/support",
    icon: HelpCircle,
    roles: ["user"],
  },
  {
    label: "Setting",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["user"],
  },
  /* Each organisation manages its own people (2026-09-30). */
  {
    label: "Staff & Roles",
    href: "/dashboard/clinic/team",
    icon: UserCog,
    roles: ["clinic"],
    permission: "staff.manage",
  },
  {
    label: "Settings",
    href: "/dashboard/clinic/settings",
    icon: Settings,
    roles: ["clinic"],
    permission: "settings.manage",
  },
  /* A Support tab on every dashboard (client, 2026-10-07). */
  {
    label: "Support",
    href: "/dashboard/clinic/support",
    icon: HelpCircle,
    roles: ["clinic", "nephrology"],
  },
  {
    label: "Support",
    href: "/dashboard/access-center/support",
    icon: HelpCircle,
    roles: ["access"],
  },
  /* Where every dashboard's support requests, and organizations asking
     about NephroReach from a secure share, arrive. */
  {
    label: "Support Inbox",
    href: "/dashboard/admin-support",
    icon: HelpCircle,
    roles: ["admin"],
  },
  {
    label: "Staff & Roles",
    href: "/dashboard/access-center/team",
    icon: UserCog,
    roles: ["access"],
    permission: "staff.manage",
  },
  {
    label: "Staff & Roles",
    href: "/dashboard/nephrology/team",
    icon: UserCog,
    roles: ["nephrology"],
    permission: "staff.manage",
  },
];

export function getBreadcrumb(pathname: string, language?: string) {
  if (pathname === "/dashboard" || pathname === "/dashboard/")
    return language === "ES" ? "Panel" : "Dashboard";
  if (pathname.startsWith("/dashboard/design-system"))
    return language === "ES" ? "Sistema de Diseño" : "Design System";
  if (pathname.startsWith("/dashboard/access-center/team"))
    return language === "ES" ? "Personal y Roles" : "Staff & Roles";
  if (pathname.startsWith("/dashboard/access-center/support"))
    return language === "ES" ? "Soporte" : "Support";
  if (pathname.startsWith("/dashboard/admin-support"))
    return language === "ES" ? "Bandeja de Soporte" : "Support Inbox";
  if (pathname.startsWith("/dashboard/access-center/messages"))
    return language === "ES" ? "Mensajes" : "Messages";
  if (pathname.startsWith("/dashboard/nephrology/team"))
    return language === "ES" ? "Personal y Roles" : "Staff & Roles";
  if (pathname.startsWith("/dashboard/nephrology/messages"))
    return language === "ES" ? "Mensajes" : "Messages";
  if (pathname.startsWith("/dashboard/nephrology/access-messages"))
    return language === "ES"
      ? "Mensajes del Centro de Acceso"
      : "Access Center Messages";
  if (pathname.startsWith("/dashboard/nephrology"))
    return language === "ES"
      ? "Gestión de Atención Crónica"
      : "Chronic Care Management";
  if (pathname.startsWith("/dashboard/access-center"))
    return language === "ES" ? "Pacientes de Acceso" : "Access Patients";
  /* Clinic routes are matched before the member and admin rules below,
     which would otherwise swallow names the two roles share. */
  if (pathname.startsWith("/dashboard/clinic/team"))
    return language === "ES" ? "Personal y Roles" : "Staff & Roles";
  if (pathname.startsWith("/dashboard/clinic/members"))
    return language === "ES" ? "Miembros" : "Member";
  if (pathname.startsWith("/dashboard/clinic/enroll-patients"))
    return language === "ES" ? "Inscribir Pacientes" : "Enroll Patients";
  if (pathname.startsWith("/dashboard/clinic/curriculum-progress"))
    return language === "ES"
      ? "Progreso del Plan de Estudios"
      : "Curriculum Progress";
  if (pathname.startsWith("/dashboard/clinic/live-class"))
    return language === "ES" ? "Clases en Vivo" : "Live Class";
  if (pathname.startsWith("/dashboard/clinic/checkins"))
    return language === "ES" ? "Registros" : "Check-ins";
  if (pathname.startsWith("/dashboard/clinic/vascular-access"))
    return language === "ES" ? "Acceso Vascular" : "Vascular Access";
  if (pathname.startsWith("/dashboard/clinic/travel"))
    return language === "ES" ? "Solicitudes de Viaje" : "Travel Requests";
  if (pathname.startsWith("/dashboard/clinic/labs"))
    return language === "ES" ? "Laboratorios" : "Labs";
  if (pathname.startsWith("/dashboard/clinic/messages"))
    return language === "ES" ? "Mensajes" : "Messages";
  if (pathname.startsWith("/dashboard/clinic/reports"))
    return language === "ES" ? "Informes" : "Reports";
  if (pathname.startsWith("/dashboard/clinic/billing"))
    return language === "ES" ? "Contrato y Facturación" : "Contract & Billing";
  if (pathname.startsWith("/dashboard/clinic/settings"))
    return language === "ES" ? "Configuración" : "Settings";
  if (pathname.startsWith("/dashboard/clinic/support"))
    return language === "ES" ? "Soporte" : "Support";
  if (pathname === "/dashboard/clinic" || pathname === "/dashboard/clinic/")
    return language === "ES" ? "Panel" : "Dashboard";
  if (pathname.startsWith("/dashboard/before-the-er/")) {
    const topic = topicBySlug(pathname.split("/").pop() || "");
    if (topic) return language === "ES" ? topic.titleEs : topic.titleEn;
  }
  if (pathname.startsWith("/dashboard/before-the-er"))
    return language === "ES" ? "Antes de Urgencias" : "Before-the-ER";
  if (pathname.startsWith("/dashboard/my-health"))
    return language === "ES" ? "Mi Salud" : "MyHealth";
  if (pathname.startsWith("/dashboard/my-rides"))
    return language === "ES" ? "¿Dónde está mi conductor?" : "Where's My Ride";
  if (pathname.startsWith("/dashboard/personal-log/blood-pressure/add"))
    return language === "ES"
      ? "Agregar Presión Arterial"
      : "Add Blood Pressure";
  if (pathname.startsWith("/dashboard/personal-log/blood-pressure"))
    return language === "ES"
      ? "Registro de Presión Arterial"
      : "Blood Pressure Log";
  if (pathname.startsWith("/dashboard/personal-log/lab-tracking/add"))
    return language === "ES"
      ? "Agregar Resultado de Laboratorio"
      : "Add Lab Result";
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
    return language === "ES"
      ? "Registrar Tratamiento de Diálisis"
      : "Log Dialysis Treatment";
  if (pathname.startsWith("/dashboard/personal-log/dialysis-treatment/view"))
    return language === "ES" ? "Detalles del Tratamiento" : "Treatment Details";
  if (pathname.startsWith("/dashboard/personal-log/dialysis-treatment"))
    return language === "ES" ? "Tratamiento de Diálisis" : "Dialysis Treatment";
  if (pathname.startsWith("/dashboard/personal-log/fluid-tracker"))
    return language === "ES"
      ? "Control de Peso y Líquidos"
      : "Weight & Fluid Tracker";
  if (pathname.startsWith("/dashboard/personal-log/dialysis-journal"))
    return language === "ES" ? "Diario de Diálisis" : "Dialysis Journal";
  if (pathname.startsWith("/dashboard/personal-log/dialysis-management"))
    return language === "ES" ? "Gestión de Diálisis" : "Dialysis Management";
  if (pathname.startsWith("/dashboard/vascular-access"))
    return language === "ES" ? "Acceso Vascular" : "Vascular Access";
  if (pathname.startsWith("/dashboard/messages"))
    return language === "ES" ? "Mensajes" : "Messages";
  if (pathname.startsWith("/dashboard/team-questions"))
    return language === "ES" ? "Preguntas al Equipo" : "Care Team Questions";
  if (pathname.startsWith("/dashboard/personal-log"))
    return language === "ES" ? "Registro Personal" : "Personal Log";
  if (pathname.startsWith("/dashboard/members"))
    return language === "ES" ? "Miembros" : "Member";
  if (pathname.startsWith("/dashboard/manage-library"))
    return language === "ES" ? "Gestión de Biblioteca" : "Library Management";
  if (pathname.startsWith("/dashboard/manage-curriculum"))
    return language === "ES" ? "Gestión de Clases" : "Class Management";
  if (pathname.startsWith("/dashboard/beyond-the-chair"))
    return language === "ES" ? "Registro Diario" : "Daily Check-in";
  /* A trip's own page, before the section prefix below can swallow it. */
  if (/^\/dashboard\/travel-log\/[^/]+$/.test(pathname))
    return language === "ES" ? "Viaje" : "Trip";
  if (pathname.startsWith("/dashboard/travel-log"))
    return language === "ES"
      ? "Registro de Diálisis en Viaje"
      : "Dialysis Travel Log";
  if (pathname.startsWith("/dashboard/manage-table-talk"))
    return language === "ES"
      ? "Gestión de Table Talk"
      : "Table Talk Management";
  if (pathname.startsWith("/dashboard/table-talk/")) {
    return language === "ES" ? "Episodio" : "Episode";
  }
  if (pathname.startsWith("/dashboard/table-talk"))
    return "Dialysis Table Talk";
  if (pathname.startsWith("/dashboard/my-library/")) {
    return language === "ES" ? "Recurso" : "Resource";
  }
  if (pathname.startsWith("/dashboard/my-library"))
    return language === "ES" ? "Mi Biblioteca" : "My Library";
  if (pathname.startsWith("/dashboard/my-classroom/details"))
    return language === "ES" ? "Detalles del Programa" : "Program Details";
  if (pathname.startsWith("/dashboard/my-classroom/")) {
    const journeyDay = getJourneyDayBySlug(pathname.split("/").pop() || "");
    if (journeyDay) {
      return language === "ES"
        ? `Día ${journeyDay.day} · ${journeyDay.titleEs}`
        : `Day ${journeyDay.day} · ${journeyDay.titleEn}`;
    }
  }
  if (pathname.startsWith("/dashboard/my-classroom"))
    return language === "ES" ? "Mi Salón de Clases" : "My Classroom";
  if (pathname.startsWith("/dashboard/live-class"))
    return language === "ES" ? "Clases en Vivo" : "Live Class";
  if (pathname.startsWith("/dashboard/community"))
    return language === "ES" ? "Comunidad" : "Community";
  if (pathname.startsWith("/dashboard/sms-analytics"))
    return language === "ES"
      ? "Análisis de Notificaciones"
      : "Notification Analytics";
  if (pathname.startsWith("/dashboard/subscriptions"))
    return language === "ES" ? "Suscripciones" : "Subscriptions";
  if (pathname.startsWith("/dashboard/admin-testimonials"))
    return language === "ES"
      ? "Moderación de Testimonios"
      : "Testimonials Moderation";
  if (pathname.startsWith("/dashboard/admin-community"))
    return language === "ES"
      ? "Moderación de la Comunidad"
      : "Community Moderation";
  if (pathname.startsWith("/dashboard/admin-reviews"))
    return language === "ES" ? "Moderación de Reseñas" : "Reviews Moderation";
  if (pathname.startsWith("/dashboard/reviews"))
    return language === "ES" ? "Reseñas" : "Reviews";
  if (pathname.startsWith("/dashboard/support"))
    return language === "ES" ? "Soporte" : "Support";
  if (pathname.startsWith("/dashboard/settings"))
    return language === "ES" ? "Configuración" : "Setting";
  return language === "ES" ? "Panel" : "Breadcrumb";
}

export function getNavLabel(
  href: string,
  defaultLabel: string,
  language?: string,
): string {
  if (language !== "ES") return defaultLabel;
  const spanishLabels: Record<string, string> = {
    "/dashboard": "Panel",
    "/dashboard/my-rides": "¿Dónde está mi conductor?",
    "/dashboard/before-the-er": "Antes de Urgencias",
    "/dashboard/my-health": "Mi Salud",
    "/dashboard/personal-log": "Registro Personal",
    "/dashboard/personal-log/dialysis-journal": "Diario de Diálisis",
    "/dashboard/messages": "Mensajes",
    "/dashboard/team-questions": "Preguntas al Equipo",
    "/dashboard/members": "Miembros",
    "/dashboard/manage-curriculum": "Gestión de Clases",
    "/dashboard/manage-library": "Gestión de Biblioteca",
    "/dashboard/my-classroom": "Mi Salón de Clases",
    "/dashboard/my-library": "Mi Biblioteca",
    "/dashboard/table-talk": "Dialysis Table Talk",
    "/dashboard/manage-table-talk": "Gestión de Table Talk",
    "/dashboard/travel-log": "Registro de Diálisis en Viaje",
    "/dashboard/beyond-the-chair": "Registro Diario",
    "/dashboard/personal-log/dialysis-management": "Gestión de Diálisis",
    "/dashboard/vascular-access": "Acceso Vascular",
    "/dashboard/live-class": "Clases en Vivo",
    "/dashboard/community": "Comunidad",
    "/dashboard/sms-analytics": "Análisis de Notificaciones",
    "/dashboard/subscriptions": "Suscripciones",
    "/dashboard/reviews": "Reseñas",
    "/dashboard/admin-reviews": "Moderación de Reseñas",
    "/dashboard/admin-community": "Moderación de la Comunidad",
    "/dashboard/admin-testimonials": "Moderación de Testimonios",
    "/dashboard/design-system": "Sistema de Diseño",
    "/dashboard/support": "Soporte",
    "/dashboard/settings": "Configuración",
    "/dashboard/clinic": "Panel",
    "/dashboard/clinic/members": "Miembros",
    "/dashboard/clinic/enroll-patients": "Inscribir Pacientes",
    "/dashboard/clinic/curriculum-progress": "Progreso del Plan de Estudios",
    "/dashboard/clinic/live-class": "Clases en Vivo",
    "/dashboard/clinic/checkins": "Registros",
    "/dashboard/clinic/vascular-access": "Acceso Vascular",
    "/dashboard/clinic/travel": "Solicitudes de Viaje",
    "/dashboard/clinic/messages": "Mensajes",
    "/dashboard/clinic/labs": "Laboratorios",
    "/dashboard/clinic/reports": "Informes",
    "/dashboard/clinic/billing": "Contrato y Facturación",
    "/dashboard/access-center": "Pacientes de Acceso",
    "/dashboard/access-center/team": "Personal y Roles",
    "/dashboard/access-center/messages": "Mensajes",
    "/dashboard/nephrology": "Gestión de Atención Crónica",
    "/dashboard/nephrology/messages": "Mensajes",
    "/dashboard/nephrology/access-messages": "Mensajes del Centro de Acceso",
    "/dashboard/nephrology/team": "Personal y Roles",
    "/dashboard/clinic/team": "Personal y Roles",
    "/dashboard/clinic/settings": "Configuración",
    "/dashboard/clinic/support": "Soporte",
    "/dashboard/access-center/support": "Soporte",
    "/dashboard/admin-support": "Bandeja de Soporte",
  };
  return spanishLabels[href] || defaultLabel;
}

export function getBreadcrumbTrail(pathname: string, language?: string) {
  const current = getBreadcrumb(pathname, language);
  const dashboardLabel = language === "ES" ? "Panel" : "Dashboard";
  const beforeTheErLabel =
    language === "ES" ? "Antes de Urgencias" : "Before-the-ER";
  const personalLogLabel =
    language === "ES" ? "Registro Personal" : "Personal Log";
  const classroomLabel =
    language === "ES" ? "Mi Salón de Clases" : "My Classroom";
  const libraryLabel = language === "ES" ? "Mi Biblioteca" : "My Library";

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return [dashboardLabel];
  }
  if (pathname === "/dashboard/clinic" || pathname === "/dashboard/clinic/") {
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
  if (pathname.startsWith("/dashboard/my-classroom/details")) {
    return [dashboardLabel, classroomLabel, current];
  }
  if (pathname.startsWith("/dashboard/my-library/")) {
    return [dashboardLabel, libraryLabel, current];
  }
  if (pathname.startsWith("/dashboard/table-talk/")) {
    return [dashboardLabel, "Dialysis Table Talk", current];
  }
  return [dashboardLabel, current];
}

/**
 * Routes that live under /dashboard/personal-log but have their own sidebar
 * item. Personal Log must not also light up for these, or two items in the
 * sidebar claim to be the page the member is looking at.
 */
const OWN_TAB_UNDER_PERSONAL_LOG = [
  "/dashboard/personal-log/dialysis-journal",
  "/dashboard/personal-log/dialysis-management",
];

export function isActiveRoute(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/clinic") return pathname === "/dashboard/clinic";
  if (href === "/dashboard/personal-log") {
    return (
      pathname === "/dashboard/personal-log" ||
      (pathname.startsWith("/dashboard/personal-log/") &&
        !OWN_TAB_UNDER_PERSONAL_LOG.some((route) => pathname.startsWith(route)))
    );
  }
  return href !== "#" && pathname.startsWith(href);
}

/**
 * Where a signed-in user should land: their role's home, or — when their
 * staff role cannot see that page (a dietitian has no dashboard) — the
 * first menu entry they can. Null when the page they asked for is fine.
 */
export function redirectFor(
  role: UserRole,
  pathname: string,
  can: (permission: Permission) => boolean,
): string | null {
  const items = [...sidebarItems, ...supportItems].filter(
    (item) => item.roles.includes(role) && item.href !== "#",
  );
  const here = items.find((item) => item.href === pathname);
  if (!here?.permission || can(here.permission)) return null;
  const first = items.find((item) => !item.permission || can(item.permission));
  return first && first.href !== pathname ? first.href : null;
}
