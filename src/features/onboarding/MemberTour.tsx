"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  HeartPulse,
  MessageSquareText,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, buttonStyles, Modal, Progress } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { useAuth } from "@/features/auth/AuthContext";

/* ==========================================================================
   The guided tour — how the platform works, step by step
   --------------------------------------------------------------------------
   The client (2026-10-12): a new member should be shown, one step at a
   time, what each part of NephroReach does — with a way to skip. It opens
   once, on the first visit, and Settings can start it again.
   ========================================================================== */

type Step = {
  icon: LucideIcon;
  titleEn: string;
  titleEs: string;
  bodyEn: string;
  bodyEs: string;
  href?: string;
};

const STEPS: Step[] = [
  {
    icon: Sparkles,
    titleEn: "Welcome to NephroReach",
    titleEs: "Bienvenido a NephroReach",
    bodyEn:
      "A quick tour of where everything is. It takes a minute, and you can skip it at any time.",
    bodyEs:
      "Un recorrido rápido por la plataforma. Toma un minuto y puede saltarlo cuando quiera.",
  },
  {
    icon: ClipboardList,
    titleEn: "Personal Log",
    titleEs: "Registro Personal",
    bodyEn:
      "Keep your appointments, medications, blood pressure, labs, nutrition, fluids and dialysis treatments in one place.",
    bodyEs:
      "Guarde sus citas, medicamentos, presión arterial, laboratorios, nutrición, líquidos y tratamientos de diálisis en un solo lugar.",
    href: "/dashboard/personal-log",
  },
  {
    icon: CalendarCheck,
    titleEn: "Dialysis Management",
    titleEs: "Manejo de Diálisis",
    bodyEn:
      "Your dialysis schedule and reminders, your provider's orders, questions for your next treatment, and messages to your care team.",
    bodyEs:
      "Su horario de diálisis y recordatorios, las órdenes de su proveedor, preguntas para su próximo tratamiento y mensajes a su equipo.",
    href: "/dashboard/personal-log/dialysis-management",
  },
  {
    icon: BookOpen,
    titleEn: "Classroom and Library",
    titleEs: "Clases y Biblioteca",
    bodyEn:
      "The 21-day guided education, plus videos, handouts and articles to read whenever a question comes up.",
    bodyEs:
      "La educación guiada de 21 días, además de videos, folletos y artículos para cuando surja una pregunta.",
    href: "/dashboard/my-classroom",
  },
  {
    icon: MessageSquareText,
    titleEn: "Messages and sharing",
    titleEs: "Mensajes y compartir",
    bodyEn:
      "Message your care team securely. Add people to My Healthcare Team on the Personal Log to send them your logs.",
    bodyEs:
      "Escriba a su equipo de forma segura. Agregue personas a Mi Equipo de Salud en el Registro Personal para enviarles sus registros.",
    href: "/dashboard/messages",
  },
  {
    icon: HeartPulse,
    titleEn: "Before the ER and Emergency",
    titleEs: "Antes de Urgencias y Emergencia",
    bodyEn:
      "Before the ER explains when to call your dialysis center. The red Emergency button calls 911 — NephroReach is not an emergency service.",
    bodyEs:
      "Antes de Urgencias explica cuándo llamar a su centro de diálisis. El botón rojo de Emergencia llama al 911 — NephroReach no es un servicio de emergencia.",
    href: "/dashboard/before-the-er",
  },
  {
    icon: Bell,
    titleEn: "Notifications",
    titleEs: "Notificaciones",
    bodyEn:
      "The bell at the top holds your reminders: medicines, appointments, blood pressure checks, treatments and new lab results.",
    bodyEs:
      "La campana de arriba guarda sus recordatorios: medicamentos, citas, revisiones de presión, tratamientos y nuevos resultados.",
  },
];

const KEY = storageKey("member-tour-done");
const tourKey = ["onboarding", "tour-done"] as const;

/** Settings' "Take the tour again" sends this. */
export const START_TOUR_EVENT = "nr:start-tour";

export function MemberTour() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const queryClient = useQueryClient();
  const done = useQuery({
    queryKey: tourKey,
    queryFn: () => readJson<boolean>(KEY, false),
  });
  const finish = useMutation({
    mutationFn: () => writeJson(KEY, true),
    onSuccess: () => queryClient.setQueryData(tourKey, true),
  });
  const [step, setStep] = useState(0);
  const [restarted, setRestarted] = useState(false);

  useEffect(() => {
    const start = () => {
      setStep(0);
      setRestarted(true);
    };
    window.addEventListener(START_TOUR_EVENT, start);
    return () => window.removeEventListener(START_TOUR_EVENT, start);
  }, []);

  const open = restarted || (!done.isPending && done.data === false);
  if (!open) return null;

  const close = () => {
    setRestarted(false);
    finish.mutate();
  };
  const current = STEPS[step];
  const Icon = current.icon;
  const last = step === STEPS.length - 1;

  return (
    <Modal
      open
      onClose={close}
      title={isEs ? current.titleEs : current.titleEn}
      description={
        isEs
          ? `Paso ${step + 1} de ${STEPS.length}`
          : `Step ${step + 1} of ${STEPS.length}`
      }
      footer={
        <>
          <Button
            variant="neutral"
            appearance="ghost"
            className="mr-auto"
            onClick={close}
          >
            {isEs ? "Saltar el recorrido" : "Skip tour"}
          </Button>
          {step > 0 ? (
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setStep(step - 1)}
            >
              {isEs ? "Atrás" : "Back"}
            </Button>
          ) : null}
          <Button onClick={() => (last ? close() : setStep(step + 1))}>
            {last
              ? isEs
                ? "Empezar"
                : "Get started"
              : isEs
                ? "Siguiente"
                : "Next"}
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        <Progress
          value={step + 1}
          max={STEPS.length}
          label={isEs ? "Progreso del recorrido" : "Tour progress"}
          size="small"
        />
        <div className="flex items-start gap-inline-lg">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-card-nested bg-primary-soft text-fg-brand"
          >
            <Icon className="size-6" />
          </span>
          <p className="text-body-md text-fg-secondary">
            {isEs ? current.bodyEs : current.bodyEn}
          </p>
        </div>
        {current.href ? (
          <Link
            href={current.href}
            onClick={close}
            className={buttonStyles({
              variant: "neutral",
              appearance: "fill-stroke",
              size: "small",
            })}
          >
            {isEs ? "Ir allí ahora" : "Go there now"}
          </Link>
        ) : null}
      </div>
    </Modal>
  );
}

/** Members only: the admin and staff portals never see the tour. */
export function MemberTourGate() {
  const { user } = useAuth();
  return user?.role === "user" ? <MemberTour /> : null;
}
