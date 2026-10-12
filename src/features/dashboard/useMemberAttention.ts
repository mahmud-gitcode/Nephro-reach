"use client";

import { useNow } from "@/lib/utils/useNow";
import { useErVisits } from "@/features/emergency/useErVisits";
import { answerFor, weekOf } from "@/features/emergency/erVisits";
import { useMedications } from "@/features/medications/useMedications";
import { useReminders } from "@/features/medications/useReminders";
import { useMedicationLog } from "@/features/medications/useMedicationLog";
import { doseRows } from "@/features/medications/medicationList";
import { todayIso } from "@/features/medications/medicationLog.rules";
import { minutesOf } from "@/features/medications/reminders.time";
import { useAppointments } from "@/features/personal-log/appointments/useAppointments";
import { needsReschedule } from "@/features/personal-log/appointments/appointments";
import { useMemberClinicLabs } from "@/features/labs/useMemberClinicLabs";
import { useHomeVisits } from "@/features/personal-log/dialysis/useHomeVisits";
import { visitRemindersDue } from "@/features/personal-log/dialysis/homeVisits";
import {
  ordersDue,
  useProviderOrders,
} from "@/features/personal-log/dialysis/useProviderOrders";
import { useHomeSystem } from "@/features/personal-log/dialysis/useHomeHd";
import { useDialysisModality } from "@/features/personal-log/dialysis/useDialysisModality";
import { useTreatmentLog } from "@/features/personal-log/dialysis/useTreatmentLog";
import { useDialysisSchedule } from "@/features/personal-log/dialysis/useDialysisSchedule";
import { uncharted } from "@/features/personal-log/dialysis/treatmentLog";

/* ==========================================================================
   "Needs your attention" — the member's open to-dos, in one list
   --------------------------------------------------------------------------
   The same things the bell asks about, read from the same stores, so the
   dashboard can show them without a click (Dashboard 2, 2026-10-12). Each
   item says what it is and where to go to deal with it.
   ========================================================================== */

/** "Fri, Oct 9" from yyyy-mm-dd. */
function day(iso: string, isEs: boolean): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(isEs ? "es-ES" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export type AttentionItem = {
  id: string;
  tone: "danger" | "warning" | "info";
  en: string;
  es: string;
  href: string;
  ctaEn: string;
  ctaEs: string;
};

export function useMemberAttention(): {
  items: AttentionItem[];
  isPending: boolean;
} {
  const now = useNow();
  const today = todayIso(new Date(now));
  const clock = new Date(now);
  const minutesNow = clock.getHours() * 60 + clock.getMinutes();

  const erVisits = useErVisits();
  const meds = useMedications();
  const { reminders } = useReminders();
  const log = useMedicationLog();
  const appointments = useAppointments();
  const clinicLabs = useMemberClinicLabs();
  const homeVisits = useHomeVisits();
  const orders = useProviderOrders();
  const homeSystem = useHomeSystem();
  const modality = useDialysisModality();
  const treatments = useTreatmentLog();
  const schedule = useDialysisSchedule();

  const items: AttentionItem[] = [];

  /* A scheduled treatment with nothing charted. */
  if (
    modality.modality !== "pd" &&
    !treatments.isPending &&
    !schedule.isPending
  ) {
    for (const s of uncharted(
      schedule.periods,
      treatments.entries,
      today,
    ).slice(0, 2)) {
      items.push({
        id: `tx-${s.date}`,
        tone: "warning",
        en: `Did you have your dialysis treatment on ${day(s.date, false)}?`,
        es: `¿Tuvo su tratamiento de diálisis el ${day(s.date, true)}?`,
        href: `/dashboard/personal-log/dialysis-treatment/add?date=${s.date}`,
        ctaEn: "Chart it",
        ctaEs: "Registrarlo",
      });
    }
  }

  /* Reminded doses whose time has come and that are not logged. */
  const due = doseRows(meds.medications, reminders).filter(
    (dose) =>
      reminders.some(
        (r) =>
          r.enabled &&
          r.medicationName.toLowerCase() === dose.medication.toLowerCase(),
      ) &&
      minutesOf(dose.time) <= minutesNow &&
      log.statusOf(today, dose.medication, dose.time) === "pending",
  );
  for (const dose of due.slice(0, 3)) {
    items.push({
      id: `dose-${dose.medication}-${dose.time}`,
      tone: "warning",
      en: `Time to take ${dose.medication} (${dose.time})`,
      es: `Hora de tomar ${dose.medication} (${dose.time})`,
      href: "/dashboard/personal-log/medications",
      ctaEn: "Log dose",
      ctaEs: "Registrar",
    });
  }

  const toReschedule = needsReschedule(appointments.appointments)[0];
  if (toReschedule) {
    items.push({
      id: `resched-${toReschedule.id}`,
      tone: "warning",
      en: `Remember to reschedule your ${toReschedule.title} appointment`,
      es: `Recuerde reprogramar su cita de ${toReschedule.title}`,
      href: "/dashboard/personal-log/appointments",
      ctaEn: "Reschedule",
      ctaEs: "Reprogramar",
    });
  }

  if (clinicLabs.unseen && clinicLabs.newest) {
    items.push({
      id: "labs",
      tone: "info",
      en: `New lab result from your clinic (${day(clinicLabs.newest.date, false)})`,
      es: `Nuevo resultado de laboratorio de su clínica (${day(clinicLabs.newest.date, true)})`,
      href: "/dashboard/personal-log/lab-tracking",
      ctaEn: "View labs",
      ctaEs: "Ver",
    });
  }

  for (const visit of visitRemindersDue(homeVisits.visits, homeVisits.today)) {
    items.push({
      id: `visit-${visit.id}`,
      tone: "info",
      en: `Home visit ${visit.date === homeVisits.today ? "today" : "tomorrow"}${visit.time ? ` at ${visit.time}` : ""}`,
      es: `Visita a domicilio ${visit.date === homeVisits.today ? "hoy" : "mañana"}${visit.time ? ` a las ${visit.time}` : ""}`,
      href: "/dashboard/personal-log/dialysis-management",
      ctaEn: "View",
      ctaEs: "Ver",
    });
  }

  for (const order of ordersDue(orders.orders, new Date(now)).slice(0, 2)) {
    items.push({
      id: `order-${order.id}`,
      tone: "info",
      en: `Reminder: ${order.order}`,
      es: `Recordatorio: ${order.order}`,
      href: "/dashboard/personal-log/dialysis-management",
      ctaEn: "Open",
      ctaEs: "Abrir",
    });
  }

  if (modality.modality === "home-hd") {
    for (const check of homeSystem.checks) {
      if (!check.dueIso || check.dueIso > homeSystem.today) continue;
      items.push({
        id: `maint-${check.id}`,
        tone: "danger",
        en:
          check.id === "disinfection"
            ? `Machine disinfection is due (${day(check.dueIso, false)})`
            : `Water filter change is due (${day(check.dueIso, false)})`,
        es:
          check.id === "disinfection"
            ? `Toca desinfectar la máquina (${day(check.dueIso, true)})`
            : `Toca cambiar el filtro de agua (${day(check.dueIso, true)})`,
        href: "/dashboard/personal-log/dialysis-treatment",
        ctaEn: "Update",
        ctaEs: "Actualizar",
      });
    }
  }

  if (!erVisits.isPending && !answerFor(erVisits.log, weekOf(now))) {
    items.push({
      id: "er-week",
      tone: "info",
      en: "Have you been to the ER this week?",
      es: "¿Ha ido a la sala de emergencias esta semana?",
      href: "/dashboard/before-the-er",
      ctaEn: "Answer",
      ctaEs: "Responder",
    });
  }

  const order = { danger: 0, warning: 1, info: 2 };
  items.sort((a, b) => order[a.tone] - order[b.tone]);

  return {
    items,
    isPending: treatments.isPending || meds.isPending || appointments.isPending,
  };
}
