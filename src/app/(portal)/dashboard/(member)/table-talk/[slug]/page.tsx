"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Heart, Mic } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  categoryLabel,
  formatDate,
  formatDuration,
  hasSpanish,
} from "@/features/table-talk/tableTalk.rules";
import { useTableTalk } from "@/features/table-talk/useTableTalk";
import TableTalkDisclaimer from "@/features/table-talk/TableTalkDisclaimer";
import type { TableTalkEpisode } from "@/features/table-talk/tableTalk.types";
import {
  AsyncSection,
  Badge,
  Button,
  buttonStyles,
  Card,
  EmptyState,
  Skeleton,
} from "@/components/ui";

/* ==========================================================================
   One Table Talk episode
   --------------------------------------------------------------------------
   Player, who is speaking, what it covers, and the transcript when there is
   one. Captions are real <track> elements rather than a custom overlay, so
   they work with the browser's own controls and with a screen reader.
   ========================================================================== */

/** Captions are stored as VTT text; a <track> needs a URL, so make one. */
function useCaptionUrl(vtt: string | undefined): string | null {
  return useMemo(() => {
    if (!vtt?.trim() || typeof window === "undefined") return null;
    return URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
  }, [vtt]);
}

function Player({ episode }: { episode: TableTalkEpisode }) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const enTrack = useCaptionUrl(episode.captions.en);
  const esTrack = useCaptionUrl(episode.captions.es);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-card bg-surface-inverse">
      <video
        key={episode.slug}
        controls
        playsInline
        preload="metadata"
        poster={episode.thumbnail}
        className="h-full w-full object-contain"
      >
        {episode.videoSrc ? (
          <source src={episode.videoSrc} type="video/mp4" />
        ) : null}
        {enTrack ? (
          <track
            kind="captions"
            src={enTrack}
            srcLang="en"
            label="English"
            default={!isEs}
          />
        ) : null}
        {esTrack ? (
          <track
            kind="captions"
            src={esTrack}
            srcLang="es"
            label="Español"
            default={isEs}
          />
        ) : null}
      </video>
    </div>
  );
}

function Transcript({ episode }: { episode: TableTalkEpisode }) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  /* Falls back to English: a transcript in the other language is more use
     than no transcript at all. */
  const text = isEs
    ? episode.transcriptEs || episode.transcriptEn
    : episode.transcriptEn;

  if (!text?.trim()) return null;

  return (
    <Card as="section" className="space-y-stack-sm">
      <h2 className="text-heading-4 text-fg">
        {isEs ? "Transcripción" : "Transcript"}
      </h2>
      <div className="max-h-[420px] overflow-y-auto pr-2">
        {text
          .split(/\n\s*\n/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean)
          .map((paragraph, index) => (
            <p
              key={index}
              className="mb-stack-sm text-body-md text-fg-secondary"
            >
              {paragraph}
            </p>
          ))}
      </div>
    </Card>
  );
}

function RelatedRow({ episodes }: { episodes: TableTalkEpisode[] }) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  if (episodes.length === 0) return null;

  return (
    <section className="space-y-stack-md">
      <h2 className="text-heading-4 text-fg">
        {isEs ? "Episodios relacionados" : "Related Episodes"}
      </h2>
      <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-3">
        {episodes.map((episode) => (
          <Link
            key={episode.id}
            href={`/dashboard/table-talk/${episode.slug}`}
            className="group rounded-card border border-line bg-surface p-6 transition-shadow duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <div className="relative aspect-video overflow-hidden rounded-card bg-surface-sunken">
              <Image
                src={episode.thumbnail}
                alt=""
                fill
                className="object-cover"
                sizes="(min-width: 640px) 33vw, 100vw"
              />
            </div>
            <p className="mt-stack-sm text-label-md text-fg">
              {isEs ? episode.titleEs || episode.titleEn : episode.titleEn}
            </p>
            {episode.durationSeconds ? (
              <p className="mt-stack-xs text-body-sm text-fg-muted">
                {formatDuration(episode.durationSeconds)}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function EpisodePage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { language } = useLanguage();
  const isEs = language === "ES";

  const {
    getBySlug,
    getRelated,
    categories,
    isFavorite,
    toggleFavorite,
    isPending,
    error,
    refetch,
  } = useTableTalk();

  const episode = getBySlug(slug);
  const saved = isFavorite(slug);

  return (
    /* The video and title on the left; who is speaking, the transcript and
       the disclaimer in a side column. On a phone the side column follows
       the video, so the video is still the first thing on the page. */
    <div className="mx-auto w-full max-w-[1240px] space-y-stack-lg">
      <Link
        href="/dashboard/table-talk"
        className={buttonStyles({
          size: "small",
          variant: "neutral",
          appearance: "fill-stroke",
        })}
      >
        <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
        {isEs ? "Volver a Table Talk" : "Back to Table Talk"}
      </Link>

      <div className="grid grid-cols-1 items-start gap-stack-lg lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <AsyncSection
            pending={isPending}
            error={error}
            onRetry={refetch}
            /* A slug that is not on the shelf is empty, not broken — the episode
           may simply have been unpublished. */
            isEmpty={!episode}
            errorTitle={
              isEs ? "Este episodio no se cargó" : "This episode did not load"
            }
            skeleton={
              <Card className="flex flex-col gap-stack-md">
                <Skeleton height={320} />
                <Skeleton variant="text" width="60%" height={28} />
                <Skeleton variant="text" />
              </Card>
            }
            empty={
              <EmptyState
                icon={<Mic aria-hidden="true" />}
                title={
                  isEs
                    ? "No encontramos ese episodio"
                    : "We could not find that episode"
                }
                description={
                  isEs
                    ? "Puede que ya no esté publicado. Vuelve a Table Talk para ver los demás."
                    : "It may no longer be published. Head back to Table Talk to see the rest."
                }
                action={
                  <Link href="/dashboard/table-talk" className={buttonStyles()}>
                    {isEs ? "Ir a Table Talk" : "Go to Table Talk"}
                  </Link>
                }
              />
            }
          >
            {episode ? (
              <div className="space-y-stack-lg">
                <Player episode={episode} />

                <header className="space-y-stack-sm">
                  <div className="flex flex-wrap items-start justify-between gap-inline-lg">
                    <h1 className="text-heading-2 text-fg">
                      {isEs
                        ? episode.titleEs || episode.titleEn
                        : episode.titleEn}
                    </h1>
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="fill-stroke"
                      aria-pressed={saved}
                      onClick={() => toggleFavorite(episode.slug)}
                    >
                      <Heart
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

                  <p className="text-body-sm text-fg-muted">
                    {[
                      episode.durationSeconds
                        ? formatDuration(episode.durationSeconds)
                        : null,
                      formatDate(episode.publishedAt, isEs),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>

                  <div className="flex flex-wrap items-center gap-inline-md">
                    {episode.categoryIds.map((id) => (
                      <Badge key={id} tone="neutral">
                        {categoryLabel(categories, id, isEs)}
                      </Badge>
                    ))}
                    {episode.captions.en || episode.captions.es ? (
                      <Badge tone="info">
                        {isEs ? "Subtítulos" : "Captions"}
                      </Badge>
                    ) : null}
                    {hasSpanish(episode) ? (
                      <Badge tone="info">
                        {isEs ? "En español" : "Spanish available"}
                      </Badge>
                    ) : null}
                    {episode.isLiveEvent ? (
                      <Badge tone="accent">
                        {isEs ? "Evento en vivo" : "Live event"}
                      </Badge>
                    ) : null}
                  </div>

                  <p className="text-body-md text-fg-muted">
                    {isEs
                      ? episode.descriptionEs || episode.descriptionEn
                      : episode.descriptionEn}
                  </p>
                </header>

                <RelatedRow episodes={getRelated(episode)} />
              </div>
            ) : null}
          </AsyncSection>
        </div>

        <aside className="space-y-stack-lg">
          {episode ? (
            <>
              {episode.speakers.length > 0 ? (
                <Card as="section" className="space-y-stack-sm">
                  <h2 className="text-heading-4 text-fg">
                    {isEs ? "En este episodio" : "In this episode"}
                  </h2>
                  <ul className="space-y-stack-xs">
                    {episode.speakers.map((speaker) => (
                      <li key={speaker.id} className="text-body-md text-fg">
                        {speaker.name}
                        <span className="text-fg-muted"> · {speaker.role}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              <Transcript episode={episode} />
            </>
          ) : null}

          <TableTalkDisclaimer />
        </aside>
      </div>
    </div>
  );
}
