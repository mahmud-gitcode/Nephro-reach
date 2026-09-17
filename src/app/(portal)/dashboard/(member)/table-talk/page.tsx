"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Mic, MessageCircleQuestion, Play, Search } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  categoryLabel,
  filterEpisodes,
  formatDate,
  formatDuration,
  hasSpanish,
  type EpisodeFilter,
} from "@/features/table-talk/tableTalk.rules";
import { useTableTalk } from "@/features/table-talk/useTableTalk";
import TableTalkDisclaimer from "@/features/table-talk/TableTalkDisclaimer";
import AboutTableTalk from "@/features/table-talk/AboutTableTalk";
import PopularTopics from "@/features/table-talk/PopularTopics";
import SuggestQuestionModal from "@/features/table-talk/SuggestQuestionModal";
import type {
  TableTalkCategory,
  TableTalkEpisode,
} from "@/features/table-talk/tableTalk.types";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  buttonStyles,
  Card,
  Chip,
  ChipGroup,
  EmptyState,
  Input,
  Skeleton,
} from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";

/* ==========================================================================
   Dialysis Table Talk
   --------------------------------------------------------------------------
   A conversation series: episodes with a host and a guest, not a course and
   not reference material. The page is laid out like My Library on purpose —
   search and filters on one row, then a grid — so a member who has used one
   already knows how to use the other.

   What it does not have is comments. That is deliberate and it is the brief:
   curated education here, member discussion in Community, clinical questions
   through the care team. Suggest a Question is the outlet.
   ========================================================================== */

function FavoriteButton({
  saved,
  label,
  onClick,
  className,
}: {
  saved: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={label}
      className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-pill bg-surface/90 text-fg-muted shadow-card transition-colors duration-150 ease-standard hover:text-fg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className ?? ""}`}
    >
      <Heart
        aria-hidden="true"
        className={saved ? "h-4 w-4 fill-current text-fg-brand" : "h-4 w-4"}
      />
    </button>
  );
}

/** Runtime and date — the line under every title, said the same way. */
function EpisodeMeta({
  episode,
  isEs,
}: {
  episode: TableTalkEpisode;
  isEs: boolean;
}) {
  const parts = [
    episode.durationSeconds ? formatDuration(episode.durationSeconds) : null,
    formatDate(episode.publishedAt, isEs),
  ].filter(Boolean);

  return (
    <p className="text-body-sm text-fg-muted">
      {parts.join(" · ")}
      {episode.captions.en || episode.captions.es ? (
        <>
          {" · "}
          <span className="rounded-control-small border border-line px-1 text-caption">
            CC
          </span>
        </>
      ) : null}
    </p>
  );
}

function FeaturedEpisode({
  episode,
  categories,
  saved,
  onToggleSaved,
}: {
  episode: TableTalkEpisode;
  categories: TableTalkCategory[];
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const title = isEs ? episode.titleEs || episode.titleEn : episode.titleEn;

  return (
    <Card as="section" className="grid gap-inset-lg lg:grid-cols-[1.1fr_1fr]">
      <Link
        href={`/dashboard/table-talk/${episode.slug}`}
        className="group relative block aspect-video overflow-hidden rounded-card bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label={title}
      >
        <Image
          src={episode.thumbnail}
          alt=""
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill bg-surface/90 text-fg-brand shadow-card transition-transform duration-150 ease-standard group-hover:scale-105"
        >
          <Play className="ml-1 h-6 w-6 fill-current" />
        </span>
      </Link>

      <div className="flex flex-col justify-center gap-stack-sm">
        <div className="flex flex-wrap items-center gap-inline-md">
          <Badge tone="accent">{isEs ? "Destacado" : "Featured"}</Badge>
          {episode.categoryIds.slice(0, 2).map((id) => (
            <Badge key={id} tone="neutral">
              {categoryLabel(categories, id, isEs)}
            </Badge>
          ))}
        </div>

        <h2 className="text-heading-2 text-fg">{title}</h2>
        <p className="measure text-body-md text-fg-muted">
          {isEs
            ? episode.descriptionEs || episode.descriptionEn
            : episode.descriptionEn}
        </p>

        {episode.speakers.length > 0 ? (
          <p className="text-body-sm text-fg-secondary">
            {episode.speakers
              .map((speaker) => `${speaker.name} · ${speaker.role}`)
              .join("  ·  ")}
          </p>
        ) : null}

        <EpisodeMeta episode={episode} isEs={isEs} />

        <div className="mt-stack-sm flex flex-wrap items-center gap-inline-md">
          <Link
            href={`/dashboard/table-talk/${episode.slug}`}
            className={buttonStyles()}
          >
            <Play aria-hidden="true" className="size-4 shrink-0 fill-current" />
            {isEs ? "Ver ahora" : "Watch Now"}
          </Link>
          <FavoriteButton
            saved={saved}
            onClick={onToggleSaved}
            label={
              saved
                ? isEs
                  ? "Quitar de favoritos"
                  : "Remove from favorites"
                : isEs
                  ? "Guardar en favoritos"
                  : "Save to favorites"
            }
            className="border border-line"
          />
        </div>
      </div>
    </Card>
  );
}

function EpisodeCard({
  episode,
  categories,
  saved,
  onToggleSaved,
}: {
  episode: TableTalkEpisode;
  categories: TableTalkCategory[];
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const title = isEs ? episode.titleEs || episode.titleEn : episode.titleEn;

  return (
    <div className="group relative flex flex-col rounded-card border border-line bg-surface p-inset-md shadow-card transition-shadow duration-150 ease-standard focus-within:shadow-raised hover:shadow-raised">
      <div className="relative aspect-video overflow-hidden rounded-card bg-surface-sunken">
        <Image
          src={episode.thumbnail}
          alt=""
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        {episode.durationSeconds ? (
          <span className="absolute right-2 bottom-2 rounded-control-small bg-surface-inverse px-inset-xs text-label-sm text-fg-inverse">
            {formatDuration(episode.durationSeconds)}
          </span>
        ) : null}

        {/* Outside the title link: saving is a second action on the card, and
            nesting it inside the link would swallow the tap. */}
        <FavoriteButton
          saved={saved}
          onClick={onToggleSaved}
          label={
            saved
              ? isEs
                ? "Quitar de favoritos"
                : "Remove from favorites"
              : isEs
                ? "Guardar en favoritos"
                : "Save to favorites"
          }
          className="absolute top-2 right-2"
        />
      </div>

      <h3 className="mt-stack-lg text-heading-5 text-fg">
        <Link
          href={`/dashboard/table-talk/${episode.slug}`}
          className="rounded-control-small focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="absolute inset-0" aria-hidden="true" />
          {title}
        </Link>
      </h3>

      <p className="mt-stack-xs line-clamp-2 text-body-sm text-fg-muted">
        {isEs
          ? episode.descriptionEs || episode.descriptionEn
          : episode.descriptionEn}
      </p>

      <div className="mt-stack-lg flex flex-wrap items-center justify-between gap-inline-md text-label-sm text-fg-muted">
        <span>
          {categoryLabel(categories, episode.categoryIds[0] ?? "", isEs)}
        </span>
        <span className="flex items-center gap-inline-sm">
          {episode.speakers[0]?.name}
          {hasSpanish(episode) ? (
            <span className="rounded-control-small border border-line px-1 text-caption">
              ES
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index} className="flex flex-col gap-stack-sm">
          <Skeleton height={140} />
          <Skeleton variant="text" width="75%" height={20} />
          <Skeleton variant="text" />
        </Card>
      ))}
    </div>
  );
}

export default function TableTalkPage() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const {
    episodes,
    categories,
    featured,
    isFavorite,
    toggleFavorite,
    favorites,
    submitQuestion,
    questionSaving,
    isPending,
    error,
    refetch,
    saveError,
  } = useTableTalk();

  const [filter, setFilter] = useState<EpisodeFilter>("all");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | "all">("all");
  const [asking, setAsking] = useState(false);

  const visible = useMemo(
    () =>
      filterEpisodes(episodes, {
        filter,
        search,
        categoryId,
        categories,
        favorites,
      }),
    [episodes, filter, search, categoryId, categories, favorites],
  );

  /* The featured episode leads the page, so it is not repeated in the grid
     below unless a filter or a search is narrowing things down. */
  const untouched = filter === "all" && categoryId === "all" && !search.trim();
  const grid = untouched
    ? visible.filter((episode) => episode.slug !== featured?.slug)
    : visible;

  const filters: { key: EpisodeFilter; label: string }[] = [
    { key: "all", label: isEs ? "Todos" : "All" },
    { key: "patients", label: isEs ? "Pacientes" : "For Patients" },
    { key: "caregivers", label: isEs ? "Cuidadores" : "For Caregivers" },
    { key: "expert", label: isEs ? "Pregunta al Experto" : "Ask the Expert" },
    { key: "short", label: isEs ? "Cortos" : "Short Videos" },
    { key: "live", label: isEs ? "En Vivo" : "Live Events" },
    { key: "spanish", label: isEs ? "Español" : "Spanish" },
  ];

  return (
    <div className="space-y-stack-xl">
      <PageTitle href="/dashboard/table-talk" />

      {/* Banner: the series masthead, nothing else competing with it.

        The artwork already carries the logo, the name and the tagline, so it
        stands in for the heading rather than sitting above a second copy of
        the same words — the `h1` wraps it and the alt text is the heading.

        It is an English asset, though, and its tagline is baked into the
        pixels. Spanish readers get that line back as text underneath rather
        than a wordmark they cannot read. */}
      <Card
        as="section"
        padding="none"
        className="overflow-hidden border-primary-soft-line"
      >
        <h2 className="m-0">
          {/* Intrinsic width and height rather than `fill`: the artwork is a
            fixed 1024x157 strip, so giving the real numbers lets the browser
            reserve the exact space before the bytes arrive, and the image
            does not depend on a parent resolving a height for it. */}
          <Image
            src="/images/table-talk/banner.jpg"
            alt={
              isEs
                ? "Dialysis Table Talk de NephroReach. Conversaciones reales. Respuestas reales. Un mañana mejor."
                : "NephroReach Dialysis Table Talk. Real Conversations. Real Answers. A Brighter Tomorrow."
            }
            width={1024}
            height={157}
            /* Top of the page and above the fold, so it is not lazy. */
            priority
            sizes="100vw"
            className="block h-auto w-full"
          />
        </h2>

        <div className="flex flex-wrap items-center justify-between gap-inline-lg p-inset-lg">
          <p className="measure text-body-lg text-fg-secondary">
            {isEs
              ? "Conversaciones reales. Respuestas reales. Un mañana mejor."
              : "Short conversations with a host and a guest about living on dialysis."}
          </p>

          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={() => setAsking(true)}
          >
            <MessageCircleQuestion
              aria-hidden="true"
              className="size-4 shrink-0"
            />
            {isEs ? "Sugerir una pregunta" : "Suggest a Question"}
          </Button>
        </div>
      </Card>

      {saveError ? (
        <Alert tone="warning">
          {isEs
            ? "No pudimos guardar ese favorito. Inténtalo de nuevo."
            : "We could not save that favorite. Please try again."}
        </Alert>
      ) : null}

      {/* Audience filters lead the shelf; search and topic moved to the
        sidebar, where a member browses rather than narrows. My Favorites is
        kept apart from the rest — it answers "what did I save", which is a
        different question from "what is this episode about". */}
      <Card as="section">
        <div className="flex flex-col gap-inline-md lg:flex-row lg:items-center lg:justify-between">
          <ChipGroup label={isEs ? "Filtros" : "Filters"} selection="single">
            {filters.map((entry) => (
              <Chip
                key={entry.key}
                selected={filter === entry.key}
                onClick={() => setFilter(entry.key)}
              >
                {entry.label}
              </Chip>
            ))}
          </ChipGroup>

          <Chip
            selected={filter === "favorites"}
            icon={<Heart aria-hidden="true" />}
            onClick={() =>
              setFilter((current) =>
                current === "favorites" ? "all" : "favorites",
              )
            }
          >
            {isEs ? "Mis Favoritos" : "My Favorites"}
          </Chip>
        </div>
      </Card>

      {/* Two columns from `xl` up: the shelf, and a rail carrying what the
        series is, what it is not, and the topics to browse by. Below `xl`
        the rail falls under the shelf rather than squeezing both. */}
      <div className="grid grid-cols-1 gap-inset-lg xl:grid-cols-[minmax(0,1fr)_320px]">
        <AsyncSection
          pending={isPending}
          error={error}
          onRetry={refetch}
          isEmpty={grid.length === 0 && !featured}
          errorTitle={
            isEs ? "Table Talk no se cargó" : "Table Talk did not load"
          }
          skeleton={<GridSkeleton />}
          empty={
            <EmptyState
              icon={<Mic aria-hidden="true" />}
              title={isEs ? "Aún no hay episodios" : "No episodes yet"}
              description={
                isEs
                  ? "Los episodios aparecerán aquí en cuanto NephroReach publique el primero."
                  : "Episodes appear here as soon as NephroReach publishes the first one."
              }
            />
          }
        >
          <div className="space-y-stack-xl">
            {untouched && featured ? (
              <FeaturedEpisode
                episode={featured}
                categories={categories}
                saved={isFavorite(featured.slug)}
                onToggleSaved={() => toggleFavorite(featured.slug)}
              />
            ) : null}

            <section className="space-y-stack-md">
              <h2 className="text-heading-4 text-fg">
                {untouched
                  ? isEs
                    ? "Últimos episodios"
                    : "Latest Episodes"
                  : isEs
                    ? `${grid.length} episodio(s)`
                    : `${grid.length} episode(s)`}
              </h2>

              {grid.length === 0 ? (
                <EmptyState
                  icon={<Search aria-hidden="true" />}
                  title={
                    isEs ? "Nada coincide con eso" : "Nothing matches that"
                  }
                  description={
                    isEs
                      ? "Prueba con otra palabra o quita los filtros."
                      : "Try another word, or clear the filters."
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {grid.map((episode) => (
                    <EpisodeCard
                      key={episode.id}
                      episode={episode}
                      categories={categories}
                      saved={isFavorite(episode.slug)}
                      onToggleSaved={() => toggleFavorite(episode.slug)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </AsyncSection>

        <aside className="space-y-stack-lg">
          <AboutTableTalk />

          <TableTalkDisclaimer />

          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={
              isEs ? "Buscar en Table Talk" : "Search Dialysis Table Talk"
            }
            aria-label={
              isEs ? "Buscar en Table Talk" : "Search Dialysis Table Talk"
            }
            leadingIcon={<Search aria-hidden="true" className="h-4 w-4" />}
          />

          <PopularTopics
            episodes={episodes}
            categories={categories}
            selectedId={categoryId}
            onSelect={setCategoryId}
          />
        </aside>
      </div>

      {asking ? (
        <SuggestQuestionModal
          onClose={() => setAsking(false)}
          onSubmit={submitQuestion}
          saving={questionSaving}
        />
      ) : null}
    </div>
  );
}
