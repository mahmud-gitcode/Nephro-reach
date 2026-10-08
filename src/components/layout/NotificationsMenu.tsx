"use client";

import { NEPHROLOGY_OFFICE } from "@/features/messaging/messaging.seed";
import React, { useCallback, useState } from "react";
import Link from "next/link";
import { Bell, MessageSquareText } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { userCan } from "@/features/staff/staff";
import { useLanguage } from "@/context/LanguageContext";
import {
  Button,
  buttonStyles,
  menuItemStyles,
  menuStyles,
  topBarMenuPlacement,
} from "@/components/ui";
import { useDismiss } from "@/lib/utils/useDismiss";
import { useNow } from "@/lib/utils/useNow";
import { useMessages } from "@/features/messaging/useMessages";
import * as messagingRules from "@/features/messaging/messaging.rules";
import type { Conversation } from "@/features/messaging/messaging.types";
import { useMemberName } from "@/features/auth/useMemberName";
import { useErVisits } from "@/features/emergency/useErVisits";
import { answerFor, weekOf } from "@/features/emergency/erVisits";
import { useMedications } from "@/features/medications/useMedications";
import { useReminders } from "@/features/medications/useReminders";
import { useMedicationLog } from "@/features/medications/useMedicationLog";
import { doseRows } from "@/features/medications/medicationList";
import { todayIso } from "@/features/medications/medicationLog.rules";
import { minutesOf } from "@/features/medications/reminders.time";
import { useAppointments } from "@/features/personal-log/appointments/useAppointments";
import { useBpReminders } from "@/features/personal-log/blood-pressure/useBpReminders";
import { useBloodPressure } from "@/features/personal-log/blood-pressure/useBloodPressure";
import { dueCheck } from "@/features/personal-log/blood-pressure/bpReminders";
import {
  remindersDue,
  timeRange,
} from "@/features/personal-log/appointments/appointments";

/* ==========================================================================
   Notifications
   --------------------------------------------------------------------------
   Unread messages in the signed-in person's own inbox slice: a member's
   threads, or the clinic's patient queue. Each opens the Messages page.
   Roles with no inbox see the empty state rather than a dead bell.

   A member also answers things here without opening a page (client,
   2026-10-05 — "people love auto logs"):
     · a medication reminder that is due: "Taken" logs the dose
     · an appointment whose reminder time has come
     · a blood pressure check: "Log reading" opens the form
     · once a week, "Have you been to the ER this week?": Yes or No logs
       it, dated, to ER Visit Tracking on Before the ER

   Member and staff bells are separate components so a staff session never
   loads a member's medication or ER records.
   ========================================================================== */

type Inbox = { href: string; threads: Conversation[] } | null;

function BellMenu({
  count,
  inbox,
  unread,
  fromOf,
  children,
  nothingElse,
  kind = "notifications",
}: {
  /** The bell, or the message button beside it (client, 2026-10-07): the
   *  same menu, its own icon and title. */
  kind?: "notifications" | "messages";
  count: number;
  inbox: Inbox;
  unread: Conversation[];
  fromOf: (conversation: Conversation) => string;
  /** Things to answer, above the messages. */
  children?: React.ReactNode;
  /** True when there is nothing to answer, so "all caught up" can show. */
  nothingElse: boolean;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const wrapRef = useDismiss<HTMLDivElement>(open, close);
  const title =
    kind === "messages"
      ? isEs
        ? "Mensajes"
        : "Messages"
      : isEs
        ? "Notificaciones"
        : "Notifications";
  const Icon = kind === "messages" ? MessageSquareText : Bell;

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <Button
        variant="neutral"
        appearance="fill-stroke"
        size="small"
        iconOnly
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          title +
          (count > 0 ? ` (${count} ${isEs ? "sin leer" : "unread"})` : "")
        }
      >
        <Icon aria-hidden="true" />
      </Button>
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-pill bg-danger-solid px-1 text-caption text-danger-on-solid tabular-nums"
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}

      {open ? (
        <div
          role="menu"
          aria-label={title}
          className={`${menuStyles} ${topBarMenuPlacement} sm:w-80`}
        >
          <p className="border-b border-line px-3 pt-1.5 pb-2.5 text-label-lg text-fg">
            {title}
          </p>
          {children}
          {unread.length === 0 && nothingElse ? (
            <p className="px-3 py-4 text-body-sm text-fg-muted">
              {kind === "messages"
                ? isEs
                  ? "No hay mensajes nuevos."
                  : "No new messages."
                : isEs
                  ? "Estás al día."
                  : "You're all caught up."}
            </p>
          ) : null}
          {unread.length > 0 ? (
            <div className="max-h-80 overflow-y-auto pt-1.5">
              {unread.slice(0, 6).map((conversation) => {
                const last = messagingRules.lastMessage(conversation);
                return (
                  <Link
                    key={conversation.id}
                    href={inbox!.href}
                    role="menuitem"
                    onClick={close}
                    className={`${menuItemStyles} items-start text-fg hover:bg-surface-sunken`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-label-sm text-fg">
                        {isEs ? "Mensaje de " : "Message from "}
                        {fromOf(conversation)}
                      </span>
                      {last ? (
                        <span className="block truncate text-caption text-fg-muted">
                          {last.body || last.attachment?.name}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : null}
          {inbox ? (
            <div className="border-t border-line pt-1.5">
              <Link
                href={inbox.href}
                role="menuitem"
                onClick={close}
                className={`${menuItemStyles} text-fg-brand hover:bg-surface-sunken`}
              >
                {isEs ? "Ver todos los mensajes" : "View all messages"}
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** A question answered in the bell, with its buttons. */
function AskRow({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-line px-3 py-2.5">
      <p className="text-label-sm text-fg">{question}</p>
      <div className="mt-2 flex flex-wrap gap-inline-sm">{children}</div>
    </div>
  );
}

function MemberNotifications() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const now = useNow();
  const erVisits = useErVisits();
  const meds = useMedications();
  const { reminders } = useReminders();
  const log = useMedicationLog();
  const appointments = useAppointments();
  const comingUp = remindersDue(appointments.appointments, now);
  const bpTimes = useBpReminders().times;
  const bp = useBloodPressure();
  const bpDue = dueCheck(bpTimes, bp.readings, new Date(now));

  /* This week's ER question, until the member answers it. */
  const askEr = !erVisits.isPending && !answerFor(erVisits.log, weekOf(now));

  /* Today's reminded doses whose time has come and that are not logged. */
  const today = todayIso(new Date(now));
  const clock = new Date(now);
  const minutesNow = clock.getHours() * 60 + clock.getMinutes();
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

  const count =
    (askEr ? 1 : 0) + due.length + comingUp.length + (bpDue ? 1 : 0);

  return (
    <BellMenu
      count={count}
      inbox={null}
      unread={[]}
      fromOf={(c) => c.contact.name}
      nothingElse={
        !askEr && due.length === 0 && comingUp.length === 0 && !bpDue
      }
    >
      {bpDue ? (
        <AskRow
          question={
            isEs
              ? `Hora de revisar su presión arterial (${bpDue})`
              : `Time to check your blood pressure (${bpDue})`
          }
        >
          <Link
            href="/dashboard/personal-log/blood-pressure/add"
            className={buttonStyles({ size: "small" })}
          >
            {isEs ? "Registrar lectura" : "Log reading"}
          </Link>
        </AskRow>
      ) : null}
      {comingUp.slice(0, 3).map((appointment) => (
        <AskRow
          key={appointment.id}
          question={`${isEs ? "Cita" : "Appointment"}: ${appointment.title} · ${appointment.date} ${timeRange(appointment)}`}
        >
          <Link
            href="/dashboard/personal-log/appointments"
            className="text-caption text-fg-brand hover:underline"
          >
            {isEs ? "Ver citas" : "View appointments"}
          </Link>
        </AskRow>
      ))}
      {due.slice(0, 4).map((dose) => (
        <AskRow
          key={`${dose.medication}-${dose.time}`}
          question={
            isEs
              ? `Hora de tomar ${dose.medication} (${dose.time})`
              : `Time to take ${dose.medication} (${dose.time})`
          }
        >
          <Button
            size="small"
            onClick={() =>
              log.setDoseStatus(today, dose.medication, dose.time, "taken")
            }
          >
            {isEs ? "Tomado" : "Taken"}
          </Button>
          <Link
            href="/dashboard/personal-log/medications"
            className="self-center text-caption text-fg-brand hover:underline"
          >
            {isEs ? "Abrir registro" : "Open log"}
          </Link>
        </AskRow>
      ))}
      {askEr ? (
        <AskRow
          question={
            isEs
              ? "¿Ha ido a la sala de emergencias esta semana?"
              : "Have you been to the ER this week?"
          }
        >
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            disabled={erVisits.isSaving}
            onClick={() => erVisits.answer("yes")}
          >
            {isEs ? "Sí" : "Yes"}
          </Button>
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            disabled={erVisits.isSaving}
            onClick={() => erVisits.answer("no")}
          >
            No
          </Button>
        </AskRow>
      ) : null}
    </BellMenu>
  );
}

/** The signed-in person's own inbox: a member's threads, or their
 *  office's patient queue. Null for a role with no Messages page. */
function useInbox(): { inbox: Inbox; fromOf: (c: Conversation) => string } {
  const { user } = useAuth();
  const memberName = useMemberName();
  const { conversations } = useMessages();
  if (user?.role === "user") {
    return {
      inbox: {
        href: "/dashboard/messages",
        threads: messagingRules.memberConversations(conversations, memberName),
      },
      fromOf: (c) => c.contact.name,
    };
  }
  const staff = (href: string, threads: Conversation[]) => ({
    inbox: { href, threads },
    fromOf: (c: Conversation) => c.memberName,
  });
  if (user?.role === "clinic" && userCan(user, "messages.view")) {
    return staff(
      "/dashboard/clinic/messages",
      messagingRules.clinicConversations(conversations),
    );
  }
  if (user?.role === "nephrology" && userCan(user, "messages.view")) {
    return staff(
      "/dashboard/nephrology/messages",
      messagingRules.clinicConversations(conversations, NEPHROLOGY_OFFICE.name),
    );
  }
  /* The access center's threads are with offices, on its own page. */
  if (user?.role === "access" && userCan(user, "access.messages")) {
    return staff("/dashboard/access-center/messages", []);
  }
  return { inbox: null, fromOf: (c) => c.memberName };
}

/** The message button beside the bell (client, 2026-10-07). */
export function MessagesMenu() {
  const { inbox, fromOf } = useInbox();
  if (!inbox) return null;
  const unread = messagingRules
    .sortByRecent(inbox.threads)
    .filter((c) => c.unread > 0 && !c.archived);
  return (
    <BellMenu
      kind="messages"
      count={messagingRules.totalUnread(unread)}
      inbox={inbox}
      unread={unread}
      fromOf={fromOf}
      nothingElse
    />
  );
}

function StaffNotifications() {
  return (
    <BellMenu
      count={0}
      inbox={null}
      unread={[]}
      fromOf={() => ""}
      nothingElse
    />
  );
}

export function NotificationsMenu() {
  const { user } = useAuth();
  return user?.role === "user" ? (
    <MemberNotifications />
  ) : (
    <StaffNotifications />
  );
}
