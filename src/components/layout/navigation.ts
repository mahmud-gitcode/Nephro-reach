import type React from "react";
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
  Library,
  Notebook,
  MessageCircle,
  MessagesSquare,
  Palette,
  Settings,
  Star,
  Users,
  Video,
} from "lucide-react";
import { UserRole } from "@/features/auth/auth";
import { getJourneyDayBySlug } from "@/features/education/dialysisJourneyData";

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
    label: "Live Class",
    href: "/dashboard/live-class",
    icon: Video,
    roles: ["admin"],
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
];

export function getBreadcrumb(pathname: string, language?: string) {
  if (pathname === "/dashboard" || pathname === "/dashboard/")
    return language === "ES" ? "Panel" : "Dashboard";
  if (pathname.startsWith("/dashboard/design-system"))
    return language === "ES" ? "Sistema de Diseño" : "Design System";
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
        seizures: "Convulsiones",
        "dialysis-access-emergencies": "Emergencias del Acceso de Diálisis",
        "severe-bleeding": "Sangrado Intenso",
        "severe-hyperkalemia-symptoms": "Síntomas de Hiperpotasemia Grave",
        "fever-with-dialysis-catheter": "Fiebre con Catéter de Diálisis",
        "confusion-or-mental-status-changes":
          "Confusión o Cambios en el Estado Mental",
      };
      if (spanishTitles[slug]) return spanishTitles[slug];
    }
    const formatted = slug
      .replace(/-/g, " ")
      .replace(/%20/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return formatted || "Symptom Detail";
  }
  if (pathname.startsWith("/dashboard/before-the-er"))
    return language === "ES" ? "Antes de Urgencias" : "Before-the-ER";
  if (pathname.startsWith("/dashboard/my-health"))
    return language === "ES" ? "Mi Salud" : "MyHealth";
  if (pathname.startsWith("/dashboard/personal-log/blood-results/add"))
    return "Add Blood Results";
  if (pathname.startsWith("/dashboard/personal-log/blood-results"))
    return "Blood Results";
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
    "/dashboard/team-questions": "Preguntas al Equipo",
    "/dashboard/members": "Miembros",
    "/dashboard/manage-curriculum": "Gestión de Clases",
    "/dashboard/manage-library": "Gestión de Biblioteca",
    "/dashboard/my-classroom": "Mi Salón de Clases",
    "/dashboard/my-library": "Mi Biblioteca",
    "/dashboard/live-class": "Clases en Vivo",
    "/dashboard/community": "Comunidad",
    "/dashboard/sms-analytics": "Análisis de Notificaciones",
    "/dashboard/subscriptions": "Suscripciones",
    "/dashboard/reviews": "Reseñas",
    "/dashboard/admin-reviews": "Moderación de Reseñas",
    "/dashboard/admin-testimonials": "Moderación de Testimonios",
    "/dashboard/design-system": "Sistema de Diseño",
    "/dashboard/support": "Soporte",
    "/dashboard/settings": "Configuración",
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
  return [dashboardLabel, current];
}

export function isActiveRoute(href: string, pathname: string) {
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
