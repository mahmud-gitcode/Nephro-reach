"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Award, CheckCircle2, Circle, Printer } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  AsyncSection,
  Button,
  buttonStyles,
  Card,
  Progress,
  SectionTitle,
  Skeleton,
} from "@/components/ui";
import { useClassroom } from "@/features/education/classroom";
import { EDU_CODES, hasCode } from "@/features/education/useLearnerCourse";
import { useLearnerRecord } from "@/features/education/useLearnerRecord";
import type { Certificate } from "@/features/education/questions.types";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";

/* ==========================================================================
   Certificate of completion
   --------------------------------------------------------------------------
   Shows what is left until the certificate unlocks (the server's
   certificateStatus), asks the server for it (POST, no body: the server
   checks eligibility and prints the name on the patient's NephroReach
   record, Q-EDU-2), and prints — or saves as PDF — from the browser.
   Asking again returns the same certificate and code.
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
          {certificate.nameOnCertificate}
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
              {certificate.code}
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
  const classroom = useClassroom();
  const { course } = classroom;
  const learner = useLearnerRecord();

  const existing = learner.certificate;
  const pending = classroom.isPending || learner.isPending;
  const readError = classroom.error ?? learner.error;
  const pageTitle = isEs
    ? "Tu certificado no cargó"
    : "Your certificate did not load";
  const courseTitle = course
    ? isEs
      ? course.titleEs || course.titleEn
      : course.titleEn
    : "";

  const issue = async () => {
    try {
      await learner.issueCertificate();
    } catch {
      /* Shown below from certificateError. */
    }
  };
  const notEligible = hasCode(learner.certificateError, EDU_CODES.notEligible);

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-stack-lg">
      <style>{PRINT_CSS}</style>
      {/* Named on screen; on a phone the breadcrumb is hidden. */}
      <h1 className="text-heading-2 text-fg print:hidden">
        {isEs ? "Mi certificado" : "My Certificate"}
      </h1>

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
        error={readError}
        errorTitle={errorTitleFor(readError, pageTitle, isEs ? "es" : "en")}
        errorMessage={errorMessageFor(readError, undefined, isEs ? "es" : "en")}
        onRetry={canRetry(readError) ? learner.refetch : undefined}
        skeleton={<Skeleton height={420} />}
      >
        {course
          ? (() => {
              /* The server's reckoning, never the browser's. */
              const status = learner.certificateStatus;

              if (!course.certificateEnabled) {
                return (
                  <Alert tone="info" live={false}>
                    {isEs
                      ? "Este curso no emite certificado."
                      : "This course does not issue a certificate."}
                  </Alert>
                );
              }

              if (!status.eligible && !existing) {
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

              if (!existing) {
                return (
                  <Card as="section" aria-labelledby="certificate-name">
                    <SectionTitle
                      id="certificate-name"
                      title={isEs ? "¡Felicidades!" : "Congratulations!"}
                      subtitle={
                        isEs
                          ? "Tu certificado lleva el nombre de tu registro de NephroReach."
                          : "Your certificate carries the name on your NephroReach record."
                      }
                    />
                    {learner.certificateError ? (
                      <Alert tone="danger">
                        {notEligible
                          ? isEs
                            ? "Aún no cumples los requisitos del certificado."
                            : "You are not yet eligible for the certificate."
                          : isEs
                            ? "No pudimos emitir tu certificado. Inténtalo de nuevo."
                            : "Your certificate could not be issued. Please try again."}
                      </Alert>
                    ) : null}
                    <div className="mt-6 flex flex-wrap gap-inline-md">
                      <Button
                        onClick={issue}
                        disabled={!status.eligible || !learner.canWrite}
                        loading={learner.isSaving}
                      >
                        <Award aria-hidden="true" />
                        {isEs ? "Obtener mi certificado" : "Get my certificate"}
                      </Button>
                    </div>
                  </Card>
                );
              }

              return (
                <div className="space-y-stack-lg">
                  <div className="flex flex-wrap items-center justify-end gap-inline-md">
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
