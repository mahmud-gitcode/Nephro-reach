"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  BookOpen,
  FileText,
  Library,
  PlayCircle,
  Search,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LIBRARY_CATEGORIES } from "@/features/library/library.seed";
import {
  filterResources,
  formatDuration,
  sortByNewest,
  type LibraryFilter,
} from "@/features/library/library.rules";
import { useLibrary } from "@/features/library/useLibrary";
import type {
  LibraryKind,
  LibraryResource,
} from "@/features/library/library.types";
import {
  Alert,
  AsyncSection,
  Card,
  Chip,
  ChipGroup,
  EmptyState,
  Input,
  Skeleton,
} from "@/components/ui";

/* ==========================================================================
   My Library
   --------------------------------------------------------------------------
   The Classroom is a course; this is the shelf beside it. Nothing here is
   sequenced and nothing is scored — a member arrives with a question, finds
   the one thing that answers it, and leaves. So the screen is built around
   finding rather than around progress: search, kind, topic, saved.
   ========================================================================== */

export const KIND_ICON: Record<LibraryKind, React.ElementType> = {
  video: PlayCircle,
  document: FileText,
  article: BookOpen,
};

function kindLabel(kind: LibraryKind, isEs: boolean): string {
  if (kind === "document") return isEs ? "Documento" : "Document";
  if (kind === "article") return isEs ? "Artículo" : "Article";
  return isEs ? "Video" : "Video";
}

/** Runtime for a video, page count for a document, read time for an article. */
function metaLabel(resource: LibraryResource, isEs: boolean): string {
  if (resource.kind === "video" && resource.durationSeconds)
    return formatDuration(resource.durationSeconds);
  if (resource.kind === "document")
    return (isEs ? resource.fileMetaEs : resource.fileMetaEn) || "PDF";
  if (resource.kind === "article" && resource.readMinutes)
    return `${resource.readMinutes} ${isEs ? "min de lectura" : "min read"}`;
  return "";
}

function ResourceCard({
  resource,
  saved,
  onToggleSaved,
}: {
  resource: LibraryResource;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const KindIcon = KIND_ICON[resource.kind];

  return (
    <div className="group relative flex flex-col rounded-card border border-line bg-surface p-inset-md shadow-card transition-shadow duration-150 ease-standard focus-within:shadow-raised hover:shadow-raised">
      <div className="relative aspect-[324/182] max-w-full overflow-hidden rounded-card bg-surface-sunken">
        <Image
          src={resource.poster}
          alt=""
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        <span className="absolute top-2 left-2 inline-flex h-7 items-center gap-inline-xs rounded-control-small bg-surface-inverse px-inset-xs text-label-sm text-fg-inverse">
          <KindIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {kindLabel(resource.kind, isEs)}
        </span>

        {/* Outside the title link on purpose: saving is a second action on
            the card, and nesting it inside the link would swallow the tap. */}
        <button
          type="button"
          onClick={onToggleSaved}
          aria-pressed={saved}
          aria-label={
            saved
              ? isEs
                ? "Quitar de guardados"
                : "Remove from saved"
              : isEs
                ? "Guardar en mi biblioteca"
                : "Save to my library"
          }
          className="absolute top-2 right-2 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-pill bg-surface/90 text-fg-muted shadow-card transition-colors duration-150 ease-standard hover:text-fg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Bookmark
            aria-hidden="true"
            className={saved ? "h-4 w-4 fill-current text-fg-brand" : "h-4 w-4"}
          />
        </button>
      </div>

      <h3 className="mt-stack-lg text-heading-5 text-fg">
        <Link
          href={`/dashboard/my-library/${resource.slug}`}
          className="rounded-control-small focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {/* Stretches the link over the whole card without nesting the
              save button inside it. */}
          <span className="absolute inset-0" aria-hidden="true" />
          {isEs ? resource.titleEs : resource.titleEn}
        </Link>
      </h3>

      <p className="mt-stack-xs line-clamp-2 text-body-sm text-fg-muted">
        {isEs ? resource.summaryEs : resource.summaryEn}
      </p>

      <div className="mt-stack-lg flex flex-wrap items-center justify-between gap-inline-md text-label-sm text-fg-muted">
        <span>{categoryLabel(resource.category, isEs)}</span>
        <span>{metaLabel(resource, isEs)}</span>
      </div>
    </div>
  );
}

function categoryLabel(category: string, isEs: boolean): string {
  const match = LIBRARY_CATEGORIES.find((entry) => entry.key === category);
  if (!match) return category;
  return isEs ? match.labelEs : match.labelEn;
}

function LibraryGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="flex flex-col gap-stack-sm">
          <Skeleton height={160} />
          <Skeleton variant="text" width="70%" height={20} />
          <Skeleton variant="text" />
          <Skeleton variant="text" width="40%" />
        </Card>
      ))}
    </div>
  );
}

export default function MyLibraryPage() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const {
    resources,
    saved,
    isSaved,
    toggleSaved,
    isPending,
    error,
    refetch,
    saveError,
  } = useLibrary();

  const [filter, setFilter] = useState<LibraryFilter>({
    search: "",
    kind: "all",
    category: "all",
    savedOnly: false,
  });

  const visible = useMemo(
    () => sortByNewest(filterResources(resources, filter, saved)),
    [resources, filter, saved],
  );

  const kinds: { key: LibraryKind | "all"; label: string }[] = [
    { key: "all", label: isEs ? "Todo" : "All" },
    { key: "video", label: isEs ? "Videos" : "Videos" },
    { key: "document", label: isEs ? "Documentos" : "Documents" },
    { key: "article", label: isEs ? "Artículos" : "Articles" },
  ];

  return (
    <div className="space-y-stack-xl">
      <Card as="section" padding="none" className="overflow-hidden p-inset-lg">
        <h1 className="text-heading-2 text-fg">
          {isEs ? "Mi Biblioteca" : "My Library"}
        </h1>
        <div className="mt-stack-lg flex flex-col gap-inline-md sm:flex-row sm:items-center sm:justify-between">
          <Input
            type="search"
            value={filter.search}
            onChange={(event) =>
              setFilter((current) => ({
                ...current,
                search: event.target.value,
              }))
            }
            placeholder={
              isEs ? "Buscar en la biblioteca" : "Search the library"
            }
            aria-label={isEs ? "Buscar en la biblioteca" : "Search the library"}
            leadingIcon={<Search aria-hidden="true" className="h-4 w-4" />}
            className="sm:w-[280px]"
          />

          {/* Beside the search rather than under it: one row of controls, and
              on a phone they stack without either one shrinking. */}
          <ChipGroup
            label={isEs ? "Tipo de recurso" : "Resource type"}
            selection="single"
          >
            {kinds.map((entry) => (
              <Chip
                key={entry.key}
                selected={filter.kind === entry.key}
                onClick={() =>
                  setFilter((current) => ({ ...current, kind: entry.key }))
                }
              >
                {entry.label}
              </Chip>
            ))}
            <Chip
              selected={filter.savedOnly}
              icon={<Bookmark aria-hidden="true" />}
              onClick={() =>
                setFilter((current) => ({
                  ...current,
                  savedOnly: !current.savedOnly,
                }))
              }
            >
              {isEs ? "Guardados" : "Saved"}
            </Chip>
          </ChipGroup>
        </div>
      </Card>

      {/* A bookmark that did not save is worth saying out loud — the icon
          would otherwise snap back with no explanation. */}
      {saveError ? (
        <Alert tone="warning">
          {isEs
            ? "No pudimos guardar ese recurso. Inténtalo de nuevo."
            : "We could not save that item. Please try again."}
        </Alert>
      ) : null}

      <AsyncSection
        pending={isPending}
        error={error}
        onRetry={refetch}
        isEmpty={visible.length === 0}
        errorTitle={
          isEs ? "Tu biblioteca no se cargó" : "Your library did not load"
        }
        skeleton={<LibraryGridSkeleton />}
        empty={
          <EmptyState
            icon={<Library aria-hidden="true" />}
            title={
              isEs ? "Nada coincide con tu búsqueda" : "Nothing matches yet"
            }
            description={
              isEs
                ? "Prueba con otra palabra o borra los filtros para ver toda la biblioteca."
                : "Try another word, or clear the filters to see the whole library."
            }
          />
        }
      >
        <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              saved={isSaved(resource.slug)}
              onToggleSaved={() => toggleSaved(resource.slug)}
            />
          ))}
        </div>
      </AsyncSection>
    </div>
  );
}
