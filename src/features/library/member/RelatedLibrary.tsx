"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, ChevronRight, FileText, PlayCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { formatDuration, sortByNewest } from "../library.rules";
import { useLibrary } from "../useLibrary";
import type {
  LibraryCategory,
  LibraryKind,
  LibraryResource,
} from "../library.types";
import { Skeleton } from "@/components/ui";

/* ==========================================================================
   Related education, pulled from My Library
   --------------------------------------------------------------------------
   This replaces two hardcoded cards that appeared on every symptom page:
   the same title, the same logo placeholder, the same invented "8:30"
   runtime, both linking to the library index rather than to anything. It
   looked like education and led nowhere.

   Now it reads the real shelf. Which means it also has to handle the case
   the hardcoded version never could: a library with nothing in it yet. An
   empty section renders as nothing at all rather than as an empty promise.
   ========================================================================== */

const KIND_ICON: Record<LibraryKind, React.ElementType> = {
  video: PlayCircle,
  document: FileText,
  article: BookOpen,
};

export function kindLabel(kind: LibraryKind, isEs: boolean): string {
  if (kind === "document") return isEs ? "Documento" : "Document";
  if (kind === "article") return isEs ? "Artículo" : "Article";
  return "Video";
}

export function metaLabel(resource: LibraryResource, isEs: boolean): string {
  if (resource.kind === "video" && resource.durationSeconds)
    return `${formatDuration(resource.durationSeconds)} min`;
  if (resource.kind === "document")
    return (isEs ? resource.fileMetaEs : resource.fileMetaEn) || "PDF";
  if (resource.kind === "article" && resource.readMinutes)
    return `${resource.readMinutes} ${isEs ? "min de lectura" : "min read"}`;
  return "";
}

export function RelatedLibrary({
  category,
  limit = 2,
  title,
}: {
  /** Preferred topic. Falls back to the newest posts when it is thin. */
  category?: LibraryCategory;
  limit?: number;
  title: string;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const { resources, isPending, error } = useLibrary();

  /* Topic first, then anything else newest-first to fill the row. A member
     reading about chest pain is better served by two posts than by one post
     and a gap. */
  const preferred = category
    ? resources.filter((resource) => resource.category === category)
    : [];
  const rest = resources.filter((resource) => !preferred.includes(resource));
  const picks = [...sortByNewest(preferred), ...sortByNewest(rest)].slice(
    0,
    limit,
  );

  /* A failed read is not worth an error panel on a page about an emergency —
     this is a sidebar of suggestions, and the page works without it. */
  if (error || (!isPending && picks.length === 0)) return null;

  return (
    <section className="space-y-4 rounded-panel border border-line bg-surface p-6 shadow-control">
      <div className="flex items-center justify-between gap-inline-md">
        <h2 className="text-lg font-bold text-fg">{title}</h2>
        <Link
          href="/dashboard/my-library"
          className="flex shrink-0 items-center gap-1 rounded-control-small text-xs font-bold text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span>{isEs ? "Ver Mi Biblioteca" : "View My Library"}</span>
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {isPending
          ? Array.from({ length: limit }).map((_, index) => (
              <Skeleton key={index} height={80} />
            ))
          : picks.map((resource) => {
              const KindIcon = KIND_ICON[resource.kind];
              const meta = metaLabel(resource, isEs);

              return (
                <Link
                  key={resource.id}
                  href={`/dashboard/my-library/${resource.slug}`}
                  className="flex items-center gap-4 rounded-card border border-line-subtle bg-surface-sunken p-4 transition-colors duration-150 ease-standard hover:border-primary-soft-line hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-control border border-primary-soft-line bg-primary-soft">
                    <Image
                      src={resource.poster}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-sm font-bold text-fg">
                      {isEs
                        ? resource.titleEs || resource.titleEn
                        : resource.titleEn}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-fg-muted">
                      <KindIcon
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0 text-fg-brand"
                      />
                      {kindLabel(resource.kind, isEs)}
                      {meta ? ` • ${meta}` : ""}
                    </p>
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}

export default RelatedLibrary;
