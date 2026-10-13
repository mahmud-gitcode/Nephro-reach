"use client";

import React from "react";
import {
  Check,
  ClipboardCheck,
  MonitorPlay,
  Presentation,
  Puzzle,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, Card, Progress } from "@/components/ui";
import { organization } from "@/features/staff/staff";
import { useMyHospitalCourses } from "./useHospital";
import {
  accessUntil,
  hasAccess,
  percentDone,
  programById,
  type LessonKind,
} from "./hospital.data";

/* ==========================================================================
   My hospital course — the patient's own side
   --------------------------------------------------------------------------
   A course the hospital enrolled the member in (client, 2026-10-13),
   taken in their own account: open while they are in the hospital and for
   the program's days after discharge. Finishing a day here is what the
   hospital's staff see as progress.
   ========================================================================== */

const KIND: Record<LessonKind, { icon: LucideIcon; en: string; es: string }> = {
  video: { icon: MonitorPlay, en: "Video", es: "Video" },
  presentation: { icon: Presentation, en: "Presentation", es: "Presentación" },
  activity: { icon: Puzzle, en: "Interactive activity", es: "Actividad" },
  "knowledge-check": {
    icon: ClipboardCheck,
    en: "Knowledge check",
    es: "Prueba de conocimientos",
  },
};

function longDay(iso: string, isEs: boolean): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(isEs ? "es-ES" : "en-US", {
    month: "long",
    day: "numeric",
  });
}

export function MyHospitalCourse({ isEs }: { isEs: boolean }) {
  const courses = useMyHospitalCourses();
  if (courses.isPending || courses.enrollments.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      {courses.enrollments.map((enrollment) => {
        const program = programById(enrollment.programId);
        if (!program) return null;
        const open = hasAccess(enrollment, today);
        const until = accessUntil(enrollment);
        const hospitalName =
          organization(enrollment.hospitalId)?.name ?? "your hospital";
        const pct = percentDone(enrollment);
        return (
          <Card key={enrollment.id} as="section" className="space-y-stack-md">
            <div className="flex flex-wrap items-start justify-between gap-inline-md">
              <div>
                <p className="text-overline text-fg-brand">
                  {isEs ? `De ${hospitalName}` : `From ${hospitalName}`}
                </p>
                <h2 className="mt-stack-xs text-heading-4 text-fg">
                  {isEs ? program.nameEs : program.nameEn}
                </h2>
              </div>
              {open ? (
                <Badge tone="info">
                  {until === null
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
              value={pct}
              label={isEs ? "Progreso del curso" : "Course progress"}
              showValue
            />

            <div className="grid grid-cols-1 gap-inset-sm md:grid-cols-3">
              {program.days.map((day) => {
                const done = Boolean(enrollment.progress[day.day]?.completedAt);
                return (
                  <div
                    key={day.day}
                    className={`flex flex-col gap-stack-sm rounded-card-nested border p-inset-sm ${
                      done
                        ? "border-success-line bg-success-surface"
                        : "border-line-subtle"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-inline-sm">
                      <p className="text-overline text-fg-brand">
                        {isEs ? `Día ${day.day}` : `Day ${day.day}`}
                      </p>
                      {done ? (
                        <Badge tone="success">
                          {isEs ? "Completado" : "Done"}
                        </Badge>
                      ) : null}
                    </div>
                    <h3 className="text-heading-5 text-fg">
                      {isEs ? day.titleEs : day.titleEn}
                    </h3>
                    <ul className="space-y-stack-xs">
                      {day.items.map((item) => {
                        const Icon = KIND[item.kind].icon;
                        return (
                          <li
                            key={item.kind}
                            className="flex items-center gap-inline-sm text-body-sm text-fg-secondary"
                          >
                            <Icon
                              aria-hidden="true"
                              className="size-4 shrink-0 text-fg-muted"
                            />
                            {isEs ? KIND[item.kind].es : KIND[item.kind].en}
                          </li>
                        );
                      })}
                    </ul>
                    {!done && open ? (
                      <Button
                        size="small"
                        className="mt-auto"
                        leadingIcon={<Check />}
                        onClick={() =>
                          courses.completeDay(enrollment.id, day.day)
                        }
                      >
                        {isEs
                          ? `Terminé el día ${day.day}`
                          : `I finished Day ${day.day}`}
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <p className="text-caption text-fg-muted">
              {isEs
                ? "Los videos, presentaciones y actividades de cada día se agregan pronto. Su hospital ve su progreso."
                : "Each day's videos, slides and activities are being added. Your hospital sees your progress."}
            </p>
          </Card>
        );
      })}
    </>
  );
}
