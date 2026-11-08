"use client";

import React from "react";
import {
  BookOpen,
  Check,
  ClipboardCheck,
  FileText,
  Headphones,
  MonitorPlay,
  type LucideIcon,
} from "lucide-react";
import { Alert, Badge, Button, Card, Progress } from "@/components/ui";
import { useMyHospitalCourses } from "./useHospital";

/* ==========================================================================
   My hospital course — the patient's own side
   --------------------------------------------------------------------------
   A course the hospital enrolled the member in (client, 2026-10-13), taken
   in their own account: open while they are in the hospital and for the
   program's days after discharge. Everything is the server's: the
   enrollment (GET /patients/:pid/education/enrollments, with accessUntil
   and hasAccess), the day outline (the course's modules) and the learner
   record (which classes are done). Finishing a day completes its classes
   on the server, which is what the hospital's staff see as progress.
   ========================================================================== */

const KIND: Record<string, { icon: LucideIcon; en: string; es: string }> = {
  video: { icon: MonitorPlay, en: "Video", es: "Video" },
  audio: { icon: Headphones, en: "Audio", es: "Audio" },
  reading: { icon: BookOpen, en: "Reading", es: "Lectura" },
  exam: {
    icon: ClipboardCheck,
    en: "Knowledge check",
    es: "Prueba de conocimientos",
  },
};
const OTHER = { icon: FileText, en: "Lesson", es: "Lección" };

function longDay(iso: string, isEs: boolean): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(isEs ? "es-ES" : "en-US", {
    month: "long",
    day: "numeric",
  });
}

export function MyHospitalCourse({ isEs }: { isEs: boolean }) {
  const mine = useMyHospitalCourses();
  if (mine.isPending || mine.error || mine.courses.length === 0) return null;

  return (
    <>
      {mine.saveError ? (
        <Alert tone="danger">
          {isEs
            ? "No se pudo guardar. Termine las actividades del día e inténtelo de nuevo."
            : "That did not save. Finish the day's activities and try again."}
        </Alert>
      ) : null}
      {mine.courses.map(({ enrollment, status, outline, record }) => {
        const open = enrollment.hasAccess;
        const until = enrollment.accessUntil;
        const hospitalName =
          enrollment.organizationName ??
          (isEs ? "su hospital" : "your hospital");
        const done = new Set(
          (record?.progress ?? [])
            .filter((p) => p.status === "completed" || p.completedAt)
            .map((p) => p.classId),
        );
        const modules = (outline?.modules ?? [])
          .slice()
          .sort((a, b) => a.position - b.position);
        return (
          <Card key={enrollment.id} as="section" className="space-y-stack-md">
            <div className="flex flex-wrap items-start justify-between gap-inline-md">
              <div>
                <p className="text-overline text-fg-brand">
                  {isEs ? `De ${hospitalName}` : `From ${hospitalName}`}
                </p>
                <h2 className="mt-stack-xs text-heading-4 text-fg">
                  {isEs
                    ? enrollment.courseTitleEs || enrollment.courseTitleEn
                    : enrollment.courseTitleEn}
                </h2>
              </div>
              {open ? (
                <Badge tone="info">
                  {status === "admitted" || until === null
                    ? isEs
                      ? "Abierto durante su estancia"
                      : "Open during your stay"
                    : isEs
                      ? `Abierto hasta el ${longDay(until, true)}`
                      : `Open until ${longDay(until, false)}`}
                </Badge>
              ) : (
                <Badge tone="neutral">
                  {isEs ? "El acceso terminó" : "Access ended"}
                </Badge>
              )}
            </div>

            <Progress
              value={record?.percent ?? 0}
              label={isEs ? "Progreso del curso" : "Course progress"}
              showValue
            />

            <div className="grid grid-cols-1 gap-inset-sm md:grid-cols-3">
              {modules.map((module, index) => {
                const day = index + 1;
                const open_ = module.classes.filter((c) => !done.has(c.id));
                const finished =
                  module.classes.length > 0 && open_.length === 0;
                return (
                  <div
                    key={module.id}
                    className={`flex flex-col gap-stack-sm rounded-card-nested border p-inset-sm ${
                      finished
                        ? "border-success-line bg-success-surface"
                        : "border-line-subtle"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-inline-sm">
                      <p className="text-overline text-fg-brand">
                        {isEs ? `Día ${day}` : `Day ${day}`}
                      </p>
                      {finished ? (
                        <Badge tone="success">
                          {isEs ? "Completado" : "Done"}
                        </Badge>
                      ) : null}
                    </div>
                    <h3 className="text-heading-5 text-fg">
                      {isEs ? module.titleEs || module.titleEn : module.titleEn}
                    </h3>
                    <ul className="space-y-stack-xs">
                      {module.classes.map((c) => {
                        const kind = KIND[c.kind] ?? OTHER;
                        const Icon = kind.icon;
                        return (
                          <li
                            key={c.id}
                            className="flex items-center gap-inline-sm text-body-sm text-fg-secondary"
                          >
                            <Icon
                              aria-hidden="true"
                              className="size-4 shrink-0 text-fg-muted"
                            />
                            {isEs ? c.titleEs || c.titleEn : c.titleEn}
                          </li>
                        );
                      })}
                    </ul>
                    {!finished && open && module.classes.length > 0 ? (
                      <Button
                        size="small"
                        className="mt-auto"
                        leadingIcon={<Check />}
                        disabled={mine.isSaving}
                        onClick={() =>
                          mine.completeClasses(open_.map((c) => c.id))
                        }
                      >
                        {isEs
                          ? `Terminé el día ${day}`
                          : `I finished Day ${day}`}
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <p className="text-caption text-fg-muted">
              {isEs
                ? "Su hospital ve su progreso."
                : "Your hospital sees your progress."}
            </p>
          </Card>
        );
      })}
    </>
  );
}
