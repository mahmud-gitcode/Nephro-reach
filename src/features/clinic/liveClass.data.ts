import type { BadgeTone } from "@/components/ui";

/* ==========================================================================
   Live classes — shapes, the settings cards, and calendar helpers
   --------------------------------------------------------------------------
   Phase 13: the schedule, recordings and settings come from the API
   (useLiveClasses). The sample figures that stood in for them (the summary,
   recent classes, registration sources and attendance trend) are gone: the
   page shows the server rows, or "No data yet" where the API has no figure.

   `upcomingClasses` below is the prototype schedule. No live-class screen
   reads it any more; it stays only because the office dashboard
   (OFFICE lane, useClinicData) still imports it until that lane moves its
   card to the API. Remove it with that change.
   ========================================================================== */

export type RegistrationStatus = "Open" | "Not Yet Open";

export const registrationTone: Record<RegistrationStatus, BadgeTone> = {
  Open: "success",
  "Not Yet Open": "neutral",
};

export type UpcomingClass = {
  /** ISO date, so the calendar can find it. */
  date: string;
  time: string;
  topic: string;
  educator: string;
  program: string;
  registered: number;
  capacity: number;
  status: RegistrationStatus;
};

export const upcomingClasses: UpcomingClass[] = [
  {
    date: "2026-09-12",
    time: "6:00 PM",
    topic: "Renal Diet Basics",
    educator: "Renal Dietitian",
    program: "Journey to Dialysis",
    registered: 45,
    capacity: 50,
    status: "Open",
  },
  {
    date: "2026-09-19",
    time: "6:00 PM",
    topic: "Medications in Dialysis",
    educator: "The Dialysis NP",
    program: "Crash Dialysis",
    registered: 38,
    capacity: 50,
    status: "Open",
  },
  {
    date: "2026-09-26",
    time: "6:00 PM",
    topic: "Q&A Session",
    educator: "Panel Discussion",
    program: "All Programs",
    registered: 62,
    capacity: 100,
    status: "Open",
  },
  {
    date: "2026-10-03",
    time: "6:00 PM",
    topic: "Access Care & Troubleshooting",
    educator: "Access Coordinator",
    program: "Journey to Dialysis",
    registered: 45,
    capacity: 50,
    status: "Open",
  },
  {
    date: "2026-10-10",
    time: "6:00 PM",
    topic: "Life on Dialysis",
    educator: "Dialysis Patient Panel",
    program: "All Programs",
    registered: 0,
    capacity: 50,
    status: "Not Yet Open",
  },
  /* The schedule continues past the client's mockup, so the table is not
     empty once those dates have gone by (client, 2026-10-18). */
  {
    date: "2026-10-24",
    time: "6:00 PM",
    topic: "Fluid & Sodium Limits",
    educator: "Renal Dietitian",
    program: "Journey to Dialysis",
    registered: 34,
    capacity: 50,
    status: "Open",
  },
  {
    date: "2026-10-31",
    time: "6:00 PM",
    topic: "Home Dialysis Options",
    educator: "Home Dialysis Nurse",
    program: "All Programs",
    registered: 29,
    capacity: 60,
    status: "Open",
  },
  {
    date: "2026-11-07",
    time: "6:00 PM",
    topic: "Understanding Your Labs",
    educator: "The Dialysis NP",
    program: "Crash Dialysis",
    registered: 18,
    capacity: 50,
    status: "Open",
  },
  {
    date: "2026-11-14",
    time: "6:00 PM",
    topic: "Coping & Emotional Health",
    educator: "Social Worker",
    program: "All Programs",
    registered: 12,
    capacity: 50,
    status: "Open",
  },
  {
    date: "2026-11-21",
    time: "6:00 PM",
    topic: "Holiday Eating on Dialysis",
    educator: "Renal Dietitian",
    program: "All Programs",
    registered: 0,
    capacity: 100,
    status: "Not Yet Open",
  },
  {
    date: "2026-12-05",
    time: "6:00 PM",
    topic: "Transplant: First Steps",
    educator: "Transplant Coordinator",
    program: "All Programs",
    registered: 0,
    capacity: 50,
    status: "Not Yet Open",
  },
];

/** Parsed as a local date: `new Date("2026-09-12")` is UTC midnight,
    which is the 11th anywhere west of Greenwich. */
export function classDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** "Sep 12, 2026" */
export function formatClassDate(iso: string, isEs = false): string {
  return classDate(iso).toLocaleDateString(isEs ? "es-US" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function classesOn(year: number, month: number, day: number) {
  return upcomingClasses.filter((item) => {
    const date = classDate(item.date);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    );
  });
}

/** A class that has taken place. `attended` is null where the reader may
 *  not see it (an office reads the public schedule). */
export type RecentClass = {
  id: string;
  title: string;
  date: string;
  attended: number | null;
  rating: number;
};

export const settings = [
  {
    id: "zoom",
    title: "Zoom Integration",
    description: "Manage meeting settings",
    titleEs: "Integración con Zoom",
    descriptionEs: "Administrar la configuración de reuniones",
  },
  {
    id: "reminders",
    title: "Email & SMS Reminders",
    description: "Automate notifications",
    titleEs: "Recordatorios por correo y SMS",
    descriptionEs: "Automatizar las notificaciones",
  },
  {
    id: "limits",
    title: "Registration Limits",
    description: "Set capacity per class",
    titleEs: "Límites de inscripción",
    descriptionEs: "Fijar el cupo de cada clase",
  },
  {
    id: "resources",
    title: "Class Resources",
    description: "Upload handouts & links",
    titleEs: "Recursos de la clase",
    descriptionEs: "Subir materiales y enlaces",
  },
  {
    id: "surveys",
    title: "Post-Class Surveys",
    description: "Collect feedback",
    titleEs: "Encuestas después de la clase",
    descriptionEs: "Recoger comentarios",
  },
  {
    id: "certificates",
    title: "Certificates",
    description: "Enable certificates of completion",
    titleEs: "Certificados",
    descriptionEs: "Activar certificados de finalización",
  },
] as const;
