"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Award, CheckCircle2, Circle, Printer } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import {
  Alert,
  AsyncSection,
  Button,
  buttonStyles,
  Card,
  FormField,
  Input,
  Progress,
  SectionTitle,
  Skeleton,
} from "@/components/ui";
import {
  certificateStatus,
  useClassroom,
} from "@/features/education/classroom";
import { useJourneyProgress } from "@/features/education/useJourneyProgress";
import { useLearnerRecord } from "@/features/education/useLearnerRecord";
import type { Certificate } from "@/features/education/questions.types";

/* ==========================================================================
   Certificate of completion
   --------------------------------------------------------------------------
   Shows what is left until the certificate unlocks, lets the member confirm
   the name to print, and prints — or saves as PDF — from the browser.
   ========================================================================== */

/* When printing, only the certificate is shown, on a landscape page. */
const PRINT_CSS = `
@media print {
  @page { size: landscape; margin: 12mm; }
  body * { visibility: hidden !important; }
  #nr-certificate, #nr-certificate * { visibility: visible !important; }
  #nr-certificate { position: absolute; inset: 0; margin: 0; box-shadow: none; }
}`;

function CertificateSheet({
  certificate,
  courseTitle,
}: {
  certificate: Certificate;
  courseTitle: string;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const date = new Date(certificate.issuedAt).toLocaleDateString(
    isEs ? "es-ES" : "en-US",
    { month: "long", day: "numeric", year: "numeric" },
  );

  return (
    <section
      id="nr-certificate"
      aria-label={isEs ? "Certificado" : "Certificate"}
      className="relative aspect-[1.414/1] w-full overflow-hidden rounded-card border border-line bg-surface"
    >
      {/* Double frame in the brand blue. */}
      <div className="absolute inset-3 rounded-card border-2 border-primary-solid sm:inset-4" />
      <div className="absolute inset-5 rounded-card border border-primary-soft-line sm:inset-7" />

      <div className="relative flex h-full flex-col items-center justify-center gap-2 px-8 text-center sm:gap-4 sm:px-16">
        <Image
          src="/images/logo.svg"
          alt="NephroReach"
          width={120}
          height={48}
          className="h-8 w-auto sm:h-12"
        />
        <p className="text-label-sm text-fg-brand sm:text-label-md">
          {isEs ? "Certificado de finalización" : "Certificate of Completion"}
        </p>
        <p className="text-body-sm text-fg-muted sm:text-body-md">
          {isEs ? "Se certifica que" : "This certifies that"}
        </p>
        <p className="text-heading-4 text-fg sm:text-heading-1">
          {certificate.name}
        </p>
        <p className="text-body-sm text-fg-muted sm:text-body-md">
          {isEs
            ? "completó con éxito el programa"
            : "has successfully completed the"}
        </p>
        <p className="text-label-lg text-fg sm:text-heading-4">{courseTitle}</p>

        <div className="mt-2 grid w-full max-w-lg grid-cols-2 gap-6 sm:mt-6">
          <div className="border-t border-line pt-2">
            <p className="text-label-sm text-fg">{date}</p>
            <p className="text-caption text-fg-muted">
              {isEs ? "Fecha" : "Date"}
            </p>
          </div>
          <div className="border-t border-line pt-2">
            <p className="text-label-sm text-fg tabular-nums">
              {certificate.id}
            </p>
            <p className="text-caption text-fg-muted">
              {isEs ? "N.º de certificado" : "Certificate ID"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({
  done,
  children,
}: {
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-inline-md rounded-card bg-surface-sunken p-inset-md">
      {done ? (
        <CheckCircle2
          aria-hidden="true"
          className="h-5 w-5 shrink-0 text-success"
        />
      ) : (
        <Circle
          aria-hidden="true"
          className="h-5 w-5 shrink-0 text-fg-subtle"
        />
      )}
      <span className="text-body-md text-fg">{children}</span>
    </li>
  );
}

export default function CertificatePage() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { user } = useAuth();
  const classroom = useClassroom();
  const { course, lessons } = classroom;
  const { progress, isPending: progressPending } = useJourneyProgress(lessons);
  const learner = useLearnerRecord();

  const existing = course ? learner.certificateFor(course.id) : undefined;
  const [name, setName] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const typedName = name ?? existing?.name ?? user?.name ?? "";

  const pending = classroom.isPending || progressPending || learner.isPending;
  const courseTitle = course
    ? isEs
      ? course.titleEs || course.titleEn
      : course.titleEn
    : "";

  const issue = async () => {
    if (!course || !typedName.trim()) return;
    await learner.issueCertificate(course.id, typedName);
    setEditing(false);
  };

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-stack-lg">
      <style>{PRINT_CSS}</style>

      <Link
        href="/dashboard/my-classroom"
        className={buttonStyles({
          variant: "neutral",
          appearance: "fill-stroke",
          size: "small",
        })}
      >
        <ArrowLeft aria-hidden="true" />
        {isEs ? "Volver a Mi Salón" : "Back to My Classroom"}
      </Link>

      <AsyncSection
        pending={pending}
        error={classroom.error ?? learner.error}
        onRetry={classroom.refetch}
        skeleton={<Skeleton height={420} />}
      >
        {course
          ? (() => {
              const status = certificateStatus(
                course,
                lessons,
                progress,
                learner.attempts,
              );

              if (!course.certificateEnabled) {
                return (
                  <Alert tone="info" live={false}>
                    {isEs
                      ? "Este curso no emite certificado."
                      : "This course does not issue a certificate."}
                  </Alert>
                );
              }

              if (!status.eligible) {
                return (
                  <Card as="section" aria-labelledby="certificate-steps">
                    <SectionTitle
                      id="certificate-steps"
                      title={isEs ? "Tu certificado" : "Your certificate"}
                      subtitle={
                        isEs
                          ? "Termina estos pasos para desbloquearlo."
                          : "Finish these steps to unlock it."
                      }
                    />
                    <ul className="space-y-4">
                      <Step done={status.allLessons}>
                        {isEs
                          ? `Completa todas las lecciones (${status.lessonsDone} de ${status.lessonsTotal})`
                          : `Complete every lesson (${status.lessonsDone} of ${status.lessonsTotal})`}
                      </Step>
                      {status.examNeeded ? (
                        <Step done={status.examPassed}>
                          {isEs
                            ? `Aprueba el examen final (${course.passMark}%)`
                            : `Pass the final exam (${course.passMark}%)`}
                        </Step>
                      ) : null}
                    </ul>
                    <Progress
                      value={
                        status.lessonsTotal === 0
                          ? 0
                          : (status.lessonsDone / status.lessonsTotal) * 100
                      }
                      label={
                        isEs ? "Lecciones completadas" : "Lessons completed"
                      }
                      className="mt-6"
                    />
                    <div className="mt-6 flex flex-wrap gap-inline-md">
                      <Link
                        href="/dashboard/my-classroom"
                        className={buttonStyles()}
                      >
                        {isEs ? "Seguir aprendiendo" : "Keep learning"}
                      </Link>
                      {status.examNeeded && status.allLessons ? (
                        <Link
                          href="/dashboard/my-classroom/exam"
                          className={buttonStyles({
                            variant: "neutral",
                            appearance: "fill-stroke",
                          })}
                        >
                          {isEs ? "Ir al examen final" : "Go to the final exam"}
                        </Link>
                      ) : null}
                    </div>
                  </Card>
                );
              }

              if (!existing || editing) {
                return (
                  <Card as="section" aria-labelledby="certificate-name">
                    <SectionTitle
                      id="certificate-name"
                      title={isEs ? "¡Felicidades!" : "Congratulations!"}
                      subtitle={
                        isEs
                          ? "Confirma el nombre que aparecerá en tu certificado."
                          : "Confirm the name to print on your certificate."
                      }
                    />
                    <FormField
                      label={isEs ? "Nombre completo" : "Full name"}
                      hint={
                        isEs
                          ? "Escríbelo como quieres que se lea."
                          : "Write it the way you want it to read."
                      }
                    >
                      {(props) => (
                        <Input
                          {...props}
                          value={typedName}
                          onChange={(event) => setName(event.target.value)}
                        />
                      )}
                    </FormField>
                    <div className="mt-6 flex flex-wrap gap-inline-md">
                      <Button
                        onClick={issue}
                        disabled={!typedName.trim()}
                        loading={learner.isSaving}
                      >
                        <Award aria-hidden="true" />
                        {existing
                          ? isEs
                            ? "Actualizar certificado"
                            : "Update certificate"
                          : isEs
                            ? "Obtener mi certificado"
                            : "Get my certificate"}
                      </Button>
                      {editing ? (
                        <Button
                          variant="neutral"
                          appearance="fill-stroke"
                          onClick={() => setEditing(false)}
                        >
                          {isEs ? "Cancelar" : "Cancel"}
                        </Button>
                      ) : null}
                    </div>
                  </Card>
                );
              }

              return (
                <div className="space-y-stack-lg">
                  <div className="flex flex-wrap items-center justify-end gap-inline-md">
                    <Button
                      variant="neutral"
                      appearance="fill-stroke"
                      onClick={() => setEditing(true)}
                    >
                      {isEs ? "Cambiar nombre" : "Change name"}
                    </Button>
                    <Button onClick={() => window.print()}>
                      <Printer aria-hidden="true" />
                      {isEs ? "Imprimir o guardar PDF" : "Print or save as PDF"}
                    </Button>
                  </div>
                  <CertificateSheet
                    certificate={existing}
                    courseTitle={courseTitle}
                  />
                </div>
              );
            })()
          : null}
      </AsyncSection>
    </div>
  );
}
