"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { NoticeRailLayout } from "@/components/layout/NoticeRailLayout";
import { Badge, Card } from "@/components/ui";
import { topicBySlug } from "@/features/emergency/beforeTheEr.topics";
import {
  ContactClinic,
  EmergencyInformationCard,
} from "@/features/emergency/BeforeTheErParts";

/* ==========================================================================
   One Before the ER topic
   --------------------------------------------------------------------------
   The same three parts on every topic: education, questions to discuss,
   and Contact My Dialysis Clinic. Nothing here reads the member's symptoms
   or says what to do. Addresses of the old triage topics (chest-pain…)
   return to the library.
   ========================================================================== */

export default function BeforeTheErTopicPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const isEs = language === "ES";
  const slug = String(params?.slug ?? "");
  const topic = topicBySlug(slug);

  useEffect(() => {
    if (!topic) router.replace("/dashboard/before-the-er");
  }, [topic, router]);

  if (!topic) return null;

  /* The emergency information sits in the right-hand column, apart from
     the topic (above it on a phone). */
  return (
    <NoticeRailLayout
      title={
        <Link
          href="/dashboard/before-the-er"
          className="inline-flex items-center gap-inline-xs text-body-sm text-fg-brand hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {isEs ? "Todos los temas" : "All topics"}
        </Link>
      }
      notices={<EmergencyInformationCard isEs={isEs} />}
    >
      <Card as="article" padding="small" className="space-y-stack-lg">
        <header className="space-y-stack-xs">
          <h1 className="text-heading-2 text-fg">
            {isEs ? topic.titleEs : topic.titleEn}
          </h1>
          {!topic.reviewed ? (
            <Badge tone="neutral">
              {isEs
                ? "Borrador · pendiente de revisión clínica"
                : "Draft · pending clinical review"}
            </Badge>
          ) : null}
          {isEs ? (
            <p className="text-caption text-fg-muted">
              Este contenido está disponible en inglés mientras se revisa su
              traducción.
            </p>
          ) : null}
        </header>

        <div className="space-y-stack-sm">
          {topic.educationEn.map((paragraph) => (
            <p key={paragraph} className="text-body-md text-fg-secondary">
              {paragraph}
            </p>
          ))}
        </div>

        <section className="space-y-stack-sm">
          <h2 className="text-heading-4 text-fg">
            {isEs
              ? "Preguntas que puede hablar con su equipo de diálisis"
              : "Questions you may want to discuss with your dialysis team"}
          </h2>
          <ul className="list-disc space-y-stack-xs pl-5 text-body-md text-fg-secondary">
            {topic.questionsEn.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </section>

        <ContactClinic isEs={isEs} />
      </Card>
    </NoticeRailLayout>
  );
}
