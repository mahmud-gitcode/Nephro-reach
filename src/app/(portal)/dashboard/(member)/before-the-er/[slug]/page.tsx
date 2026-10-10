"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, TriangleAlert } from "lucide-react";
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
          className="inline-flex min-h-11 items-center gap-inline-xs text-body-sm text-fg-brand hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {isEs ? "Todos los temas" : "All topics"}
        </Link>
      }
      notices={<EmergencyInformationCard isEs={isEs} />}
      railFrom="lg"
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

        {/* Term and explanation, as the client wrote them: the term leads so
            a member scanning for "Thrill or buzz" finds it. */}
        <section className="space-y-stack-sm">
          <h2 className="text-heading-4 text-fg">{topic.pointsTitleEn}</h2>
          <dl className="divide-y divide-line-subtle rounded-card-nested border border-line">
            {topic.pointsEn.map((point) => (
              <div
                key={point.term}
                className="grid gap-stack-xs px-inset-sm py-inset-sm sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-inline-lg"
              >
                <dt className="text-label-md text-fg">{point.term}</dt>
                <dd className="text-body-md text-fg-secondary">{point.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        {topic.questionsEn.length > 0 ? (
          <section className="space-y-stack-sm">
            <h2 className="text-heading-4 text-fg">
              {isEs
                ? "Temas para hablar con su equipo de diálisis"
                : "Things to discuss with your dialysis team"}
            </h2>
            <ul className="list-disc space-y-stack-xs pl-5 text-body-md text-fg-secondary">
              {topic.questionsEn.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {topic.questionGroupsEn?.map((group) => (
          <section key={group.title} className="space-y-stack-sm">
            <h2 className="text-heading-4 text-fg">{group.title}</h2>
            <ul className="list-disc space-y-stack-xs pl-5 text-body-md text-fg-secondary">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}

        {topic.noteEn ? (
          <section className="space-y-stack-xs rounded-card-nested bg-surface-sunken p-inset-md">
            <h2 className="text-heading-5 text-fg">{topic.noteEn.title}</h2>
            {topic.noteEn.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-body-md text-fg-secondary">
                {paragraph}
              </p>
            ))}
          </section>
        ) : null}

        {/* The topic's own safety text. The general emergency information
            stays in the card beside it. */}
        <section
          aria-labelledby="topic-safety"
          className="space-y-stack-xs rounded-card-nested border border-warning-line bg-warning-surface p-inset-md"
        >
          <h2
            id="topic-safety"
            className="flex items-center gap-inline-sm text-heading-5 text-fg"
          >
            <TriangleAlert
              aria-hidden="true"
              className="size-5 shrink-0 text-warning"
            />
            {isEs
              ? "Información importante de seguridad"
              : "Important safety information"}
          </h2>
          {topic.safetyEn.map((paragraph) => (
            <p key={paragraph} className="text-body-md text-fg-secondary">
              {paragraph}
            </p>
          ))}
        </section>

        <ContactClinic isEs={isEs} />
      </Card>
    </NoticeRailLayout>
  );
}
