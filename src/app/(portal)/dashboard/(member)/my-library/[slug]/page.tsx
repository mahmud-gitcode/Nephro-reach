"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  Download,
  FileText,
  Library,
  Printer,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LIBRARY_CATEGORIES } from "@/features/library/library.seed";
import { formatPublished } from "@/features/library/library.rules";
import { useLibrary } from "@/features/library/useLibrary";
import { kindLabel, metaLabel } from "@/features/library/member/RelatedLibrary";
import type { LibraryResource } from "@/features/library/library.types";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  buttonStyles,
  Card,
  EmptyState,
  Skeleton,
} from "@/components/ui";

/* ==========================================================================
   My Library — one resource
   --------------------------------------------------------------------------
   Three layouts behind one route, because a member does not think of them as
   three things. A video plays, a document opens or prints, an article reads.
   Everything around them — the header, the save control, the related row —
   is the same.
   ========================================================================== */

function categoryLabel(category: string, isEs: boolean): string {
  const match = LIBRARY_CATEGORIES.find((entry) => entry.key === category);
  if (!match) return category;
  return isEs ? match.labelEs : match.labelEn;
}

function VideoStage({ resource }: { resource: LibraryResource }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-card bg-surface-inverse">
      {/* `key` on the source so switching resources reloads the element
          rather than leaving the previous video mounted. */}
      <video
        key={resource.slug}
        controls
        playsInline
        poster={resource.poster}
        className="h-full w-full object-contain"
      >
        {resource.videoSrc ? (
          <source src={resource.videoSrc} type="video/mp4" />
        ) : null}
      </video>
    </div>
  );
}

function DocumentStage({ resource }: { resource: LibraryResource }) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  return (
    <Card className="flex flex-col items-start gap-stack-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-inline-lg">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control border border-primary-soft-line bg-primary-soft text-fg-brand"
        >
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <p className="text-label-md text-fg">
            {isEs ? resource.titleEs : resource.titleEn}
          </p>
          <p className="mt-stack-xs text-body-sm text-fg-muted">
            {(isEs ? resource.fileMetaEs : resource.fileMetaEn) || "PDF"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-inline-md">
        <a
          href={resource.fileSrc}
          download
          className={buttonStyles({ size: "small" })}
        >
          <Download aria-hidden="true" className="size-4 shrink-0" />
          {isEs ? "Descargar" : "Download"}
        </a>
        <Button
          size="small"
          variant="neutral"
          appearance="fill-stroke"
          onClick={() => window.print()}
        >
          <Printer aria-hidden="true" className="size-4 shrink-0" />
          {isEs ? "Imprimir" : "Print"}
        </Button>
      </div>
    </Card>
  );
}

function ArticleStage({ resource }: { resource: LibraryResource }) {
  return (
    <Card as="article" className="space-y-stack-md">
      <div className="relative aspect-[1024/320] w-full overflow-hidden rounded-card bg-surface-sunken">
        <Image
          src={resource.poster}
          alt=""
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 66vw, 100vw"
        />
      </div>
      <PostBody resource={resource} />
    </Card>
  );
}

/**
 * The rest of what was written, under whatever was attached.
 *
 * These are posts: someone writing three paragraphs above a video expects
 * all three to appear. Rendering the body only for written posts would drop
 * everything past the first paragraph of every video and handout.
 */
function PostBody({ resource }: { resource: LibraryResource }) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  /* Falls back to English: a post without a Spanish version should still be
     readable, not blank. */
  const body =
    (isEs ? resource.bodyEs : resource.bodyEn) ?? resource.bodyEn ?? [];
  if (body.length === 0) return null;

  return (
    <>
      {body.map((paragraph, index) => (
        <p key={index} className="text-body-md text-fg-secondary">
          {paragraph}
        </p>
      ))}
    </>
  );
}

function RelatedRow({ resources }: { resources: LibraryResource[] }) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  if (resources.length === 0) return null;

  return (
    <section className="space-y-stack-md">
      {/* Same card as Table Talk's related episodes: picture, title, and
          what kind of thing it is. */}
      <h2 className="text-heading-4 text-fg">
        {isEs ? "Recursos relacionados" : "Related Resources"}
      </h2>
      <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-3">
        {resources.map((resource) => {
          const meta = metaLabel(resource, isEs);
          return (
            <Link
              key={resource.id}
              href={`/dashboard/my-library/${resource.slug}`}
              className="group rounded-card border border-line bg-surface p-6 transition-shadow duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <div className="relative aspect-video overflow-hidden rounded-card bg-surface-sunken">
                <Image
                  src={resource.poster}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 640px) 33vw, 100vw"
                />
              </div>
              <p className="mt-stack-sm text-label-md text-fg">
                {isEs ? resource.titleEs || resource.titleEn : resource.titleEn}
              </p>
              <p className="mt-stack-xs text-body-sm text-fg-muted">
                {kindLabel(resource.kind, isEs)}
                {meta ? ` · ${meta}` : ""}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function LibraryResourcePage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { language } = useLanguage();
  const isEs = language === "ES";

  const {
    getBySlug,
    getRelated,
    isSaved,
    toggleSaved,
    isPending,
    error,
    refetch,
    saveError,
  } = useLibrary();

  const resource = getBySlug(slug);
  const saved = isSaved(slug);

  const meta = resource
    ? [
        categoryLabel(resource.category, isEs),
        /* The kind reads as part of the length, not as a tag of its own. */
        [kindLabel(resource.kind, isEs), metaLabel(resource, isEs)]
          .filter(Boolean)
          .join(" · "),
        formatPublished(resource.publishedAt, isEs),
      ].filter(Boolean)
    : [];

  return (
    /* A reading column, centred. Full bleed suits a dashboard of tiles, but
       a post is prose, and prose past ~800px is hard to track from the end
       of one line to the start of the next. */
    <div className="mx-auto w-full max-w-[800px] space-y-stack-xl">
      <Link
        href="/dashboard/my-library"
        className={buttonStyles({
          size: "small",
          variant: "neutral",
          appearance: "fill-stroke",
        })}
      >
        <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
        {isEs ? "Volver a Mi Biblioteca" : "Back to My Library"}
      </Link>

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
        /* A slug that is not on the shelf is empty, not broken — the
           resource may simply have been unpublished. */
        isEmpty={!resource}
        errorTitle={
          isEs ? "Este recurso no se cargó" : "This resource did not load"
        }
        skeleton={
          <Card className="flex flex-col gap-stack-md">
            <Skeleton variant="text" width="50%" height={28} />
            <Skeleton variant="text" width="70%" />
            <Skeleton height={280} />
          </Card>
        }
        empty={
          <EmptyState
            icon={<Library aria-hidden="true" />}
            title={
              isEs ? "No encontramos ese recurso" : "We could not find that one"
            }
            description={
              isEs
                ? "Puede que ya no esté publicado. Vuelve a la biblioteca para ver lo que hay."
                : "It may no longer be published. Head back to the library to see what is there."
            }
            action={
              <Link href="/dashboard/my-library" className={buttonStyles()}>
                {isEs ? "Ir a Mi Biblioteca" : "Go to My Library"}
              </Link>
            }
          />
        }
      >
        {resource ? (
          <div className="space-y-stack-xl">
            <header className="space-y-stack-sm">
              <div className="flex flex-wrap items-start justify-between gap-inline-lg">
                <h1 className="text-heading-2 text-fg">
                  {isEs ? resource.titleEs : resource.titleEn}
                </h1>
                <Button
                  size="small"
                  variant="neutral"
                  appearance="fill-stroke"
                  aria-pressed={saved}
                  onClick={() => toggleSaved(resource.slug)}
                >
                  <Bookmark
                    aria-hidden="true"
                    className={
                      saved
                        ? "size-4 shrink-0 fill-current text-fg-brand"
                        : "size-4 shrink-0"
                    }
                  />
                  {saved
                    ? isEs
                      ? "Guardado"
                      : "Saved"
                    : isEs
                      ? "Guardar"
                      : "Save"}
                </Button>
              </div>

              <p className="text-body-md text-fg-muted">
                {isEs ? resource.summaryEs : resource.summaryEn}
              </p>

              <div className="flex flex-wrap items-center gap-inline-md">
                {meta.map((entry) => (
                  <Badge key={entry} tone="neutral">
                    {entry}
                  </Badge>
                ))}
              </div>
            </header>

            {resource.kind === "video" ? (
              <>
                <VideoStage resource={resource} />
                <div className="space-y-stack-md">
                  <PostBody resource={resource} />
                </div>
              </>
            ) : resource.kind === "document" ? (
              <>
                <DocumentStage resource={resource} />
                <div className="space-y-stack-md">
                  <PostBody resource={resource} />
                </div>
              </>
            ) : (
              <ArticleStage resource={resource} />
            )}

            <RelatedRow resources={getRelated(resource)} />
          </div>
        ) : null}
      </AsyncSection>
    </div>
  );
}
