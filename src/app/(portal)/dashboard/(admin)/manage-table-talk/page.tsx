"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  Mic,
  MessageCircleQuestion,
  Pencil,
  Plus,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import {
  categoryLabel,
  formatDate,
  formatDuration,
  isLive,
} from "@/features/table-talk/tableTalk.rules";
import { useTableTalkAdmin } from "@/features/table-talk/useTableTalk";
import EpisodeEditor from "@/features/table-talk/admin/EpisodeEditor";
import CategoryManager from "@/features/table-talk/admin/CategoryManager";
import type {
  EpisodeStatus,
  QuestionStatus,
  TableTalkEpisode,
  TableTalkQuestion,
} from "@/features/table-talk/tableTalk.types";
import {
  Alert,
  AsyncSection,
  Badge,
  buttonStyles,
  Button,
  Card,
  EmptyState,
  Modal,
  Select,
  Skeleton,
} from "@/components/ui";
import { useCollabText } from "@/features/community/collabText";
import { useLanguageCode } from "@/context/LanguageContext";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";

/* ==========================================================================
   Table Talk Management
   --------------------------------------------------------------------------
   The admin side of the conversation series: publish episodes, manage the
   topics members browse by, and read the questions they send in.

   The brief's real requirement is that none of this needs a developer, so
   everything here writes content rather than code.
   ========================================================================== */

const STATUS_TONE: Record<EpisodeStatus, "success" | "info" | "neutral"> = {
  published: "success",
  scheduled: "info",
  draft: "neutral",
  archived: "neutral",
};

const QUESTION_STATUSES: {
  value: QuestionStatus;
  label: string;
  labelEs: string;
}[] = [
  { value: "new", label: "New", labelEs: "Nueva" },
  { value: "reviewed", label: "Reviewed", labelEs: "Revisada" },
  {
    value: "planned",
    label: "Planned for an episode",
    labelEs: "Planeada para un episodio",
  },
  { value: "answered", label: "Answered", labelEs: "Respondida" },
  { value: "declined", label: "Not suitable", labelEs: "No adecuada" },
];

const EPISODE_STATUS_ES: Record<EpisodeStatus, string> = {
  draft: "Borrador",
  scheduled: "Programado",
  published: "Publicado",
  archived: "Archivado",
};

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  iconTone,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tone: string;
  iconTone: string;
}) {
  return (
    <Card padding="small">
      <div className="flex items-start gap-inline-lg">
        <span
          aria-hidden="true"
          className={`flex size-11 shrink-0 items-center justify-center rounded-card ${tone}`}
        >
          <Icon className={`h-5 w-5 ${iconTone}`} />
        </span>
        <div className="min-w-0">
          <p className="text-body-sm text-fg-muted">{label}</p>
          <p className="mt-stack-xs text-heading-3 text-fg">{value}</p>
          <p className="mt-stack-xs text-body-sm text-fg-muted">{detail}</p>
        </div>
      </div>
    </Card>
  );
}

function EpisodeRow({
  episode,
  categoryNames,
  onEdit,
  onDelete,
  onFeature,
  onStatus,
  onMove,
}: {
  episode: TableTalkEpisode;
  categoryNames: string;
  onEdit: () => void;
  onDelete: () => void;
  onFeature: () => void;
  onStatus: (status: EpisodeStatus) => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const live = isLive(episode);
  const isEs = useLanguageCode() === "ES";

  return (
    <li className="flex flex-col gap-inset-sm rounded-card border border-line bg-surface p-inset-md lg:flex-row lg:items-start">
      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-control bg-surface-sunken">
        <Image
          src={episode.thumbnail}
          alt=""
          fill
          className="object-cover"
          sizes="112px"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-inline-md">
          <p className="text-label-md text-fg">
            {episode.titleEn ||
              (isEs ? "Episodio sin título" : "Untitled episode")}
          </p>
          <Badge tone={STATUS_TONE[episode.status]}>
            {episode.status === "scheduled" && episode.publishAt
              ? isEs
                ? `Programado · ${episode.publishAt}`
                : `Scheduled · ${episode.publishAt}`
              : isEs
                ? EPISODE_STATUS_ES[episode.status]
                : episode.status.charAt(0).toUpperCase() +
                  episode.status.slice(1)}
          </Badge>
          {episode.featured ? (
            <Badge tone="accent">{isEs ? "Destacado" : "Featured"}</Badge>
          ) : null}
          {/* The two reasons an episode a member expects to see is not there. */}
          {!episode.videoSrc ? (
            <Badge tone="warning">
              {isEs ? "Sin archivo de video" : "No video file"}
            </Badge>
          ) : null}
          {!episode.titleEs.trim() ? (
            <Badge tone="warning">{isEs ? "Sin español" : "No Spanish"}</Badge>
          ) : null}
        </div>

        <p className="mt-stack-xs line-clamp-1 text-body-sm text-fg-muted">
          {episode.descriptionEn ||
            (isEs ? "Aún no hay descripción." : "No description yet.")}
        </p>

        <p className="mt-stack-xs flex flex-wrap items-center gap-inline-md text-body-sm text-fg-muted">
          <span>
            {episode.speakers[0]?.name ||
              (isEs ? "Sin presentador" : "No speaker")}
          </span>
          <span aria-hidden="true">·</span>
          <span>{categoryNames || (isEs ? "Sin tema" : "No topic")}</span>
          <span aria-hidden="true">·</span>
          <span>
            {episode.durationSeconds
              ? formatDuration(episode.durationSeconds)
              : isEs
                ? "Sin duración"
                : "No runtime"}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(episode.publishedAt, isEs)}</span>
          <span aria-hidden="true">·</span>
          <span className={live ? "text-success" : undefined}>
            {live
              ? isEs
                ? "Visible para los miembros"
                : "Visible to members"
              : isEs
                ? "No visible"
                : "Not visible"}
          </span>
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-inline-md">
        <div className="flex items-center gap-inline-sm">
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            onClick={() => onMove(-1)}
            aria-label={
              isEs ? `Subir ${episode.titleEn}` : `Move ${episode.titleEn} up`
            }
          >
            <ChevronUp aria-hidden="true" className="size-4 shrink-0" />
          </Button>
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            onClick={() => onMove(1)}
            aria-label={
              isEs ? `Bajar ${episode.titleEn}` : `Move ${episode.titleEn} down`
            }
          >
            <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
          </Button>
        </div>

        <Select
          selectSize="small"
          value={episode.status}
          aria-label={
            isEs
              ? `Estado de ${episode.titleEn}`
              : `Status for ${episode.titleEn}`
          }
          onChange={(event) => onStatus(event.target.value as EpisodeStatus)}
          className="w-[128px]"
        >
          <option value="draft">{isEs ? "Borrador" : "Draft"}</option>
          <option value="scheduled">{isEs ? "Programado" : "Scheduled"}</option>
          <option value="published">{isEs ? "Publicado" : "Published"}</option>
          <option value="archived">{isEs ? "Archivado" : "Archived"}</option>
        </Select>

        <Button
          size="small"
          variant="neutral"
          appearance={episode.featured ? "fill" : "fill-stroke"}
          onClick={onFeature}
          aria-label={
            isEs ? `Destacar ${episode.titleEn}` : `Feature ${episode.titleEn}`
          }
        >
          <Star
            aria-hidden="true"
            className={
              episode.featured
                ? "size-4 shrink-0 fill-current"
                : "size-4 shrink-0"
            }
          />
        </Button>

        <Button
          size="small"
          variant="neutral"
          appearance="fill-stroke"
          onClick={onEdit}
        >
          <Pencil aria-hidden="true" className="size-4 shrink-0" />
          {isEs ? "Editar" : "Edit"}
        </Button>

        <Button
          size="small"
          variant="danger"
          appearance="stroke"
          onClick={onDelete}
          aria-label={
            isEs ? `Eliminar ${episode.titleEn}` : `Delete ${episode.titleEn}`
          }
        >
          <Trash2 aria-hidden="true" className="size-4 shrink-0" />
        </Button>
      </div>
    </li>
  );
}

function QuestionRow({
  question,
  onStatus,
}: {
  question: TableTalkQuestion;
  onStatus: (status: QuestionStatus) => void;
}) {
  const isEs = useLanguageCode() === "ES";
  return (
    <li className="flex flex-col gap-inset-sm rounded-card border border-line bg-surface p-inset-md sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <p className="text-body-md text-fg">{question.body}</p>
        <p className="mt-stack-xs text-body-sm text-fg-muted">
          {question.askedByName || (isEs ? "Un miembro" : "A member")}
          {" · "}
          {new Date(question.submittedAt).toLocaleDateString(
            isEs ? "es-US" : undefined,
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-inline-md">
        {question.status === "new" ? (
          <Badge tone="info">{isEs ? "Nueva" : "New"}</Badge>
        ) : null}
        <Select
          selectSize="small"
          value={question.status}
          aria-label={isEs ? "Estado de la pregunta" : "Question status"}
          onChange={(event) => onStatus(event.target.value as QuestionStatus)}
          className="w-[190px]"
        >
          {QUESTION_STATUSES.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {isEs ? entry.labelEs : entry.label}
            </option>
          ))}
        </Select>
      </div>
    </li>
  );
}

export default function ManageTableTalkPage() {
  const t = useCollabText();
  const isEs = useLanguageCode() === "ES";
  const {
    episodes,
    categories,
    questions,
    newQuestionCount,
    saveEpisode,
    openEpisode,
    deleteEpisode,
    setStatus,
    setFeatured,
    move,
    addCategory,
    renameCategory,
    archiveCategory,
    setQuestionStatus,
    isPending,
    error,
    refetch,
    saveError,
    dismissSaveError,
    isSaving,
  } = useTableTalkAdmin();

  const [editing, setEditing] = useState<TableTalkEpisode | null>(null);
  const [openError, setOpenError] = useState<unknown>(null);
  const [creating, setCreating] = useState(false);
  const [managingTopics, setManagingTopics] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TableTalkEpisode | null>(
    null,
  );

  const liveCount = useMemo(
    () => episodes.filter((episode) => isLive(episode)).length,
    [episodes],
  );

  const closeEditor = () => {
    setCreating(false);
    setEditing(null);
  };

  return (
    <>
      <div className="mb-stack-lg flex flex-wrap items-start justify-between gap-inline-md">
        <div>
          <h1 className="text-heading-1 text-fg">
            {isEs ? "Gestión de Table Talk" : "Table Talk Management"}
          </h1>
          <p className="mt-stack-xs measure text-body-md text-fg-muted">
            {isEs
              ? "Publique episodios, administre los temas que exploran los miembros y lea las preguntas que envían."
              : "Publish episodes, manage the topics members browse by, and read the questions they send in."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-inline-md">
          {/* Straight to the members' questions: they sat below every
              episode and the admin could not find them (client, 2026-10-12). */}
          <a
            href="#suggested-questions"
            className={buttonStyles({
              variant: "neutral",
              appearance: "fill-stroke",
            })}
          >
            <MessageCircleQuestion
              aria-hidden="true"
              className="size-4 shrink-0"
            />
            {isEs ? "Preguntas sugeridas" : "Suggested questions"}
            {newQuestionCount > 0 ? (
              <Badge tone="warning">
                {isEs ? (
                  `${newQuestionCount} nuevas`
                ) : (
                  <>{newQuestionCount} new</>
                )}
              </Badge>
            ) : null}
          </a>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={() => setManagingTopics(true)}
          >
            <Tag aria-hidden="true" className="size-4 shrink-0" />
            {isEs ? "Temas" : "Topics"}
          </Button>
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden="true" className="size-4 shrink-0" />
            {isEs ? "Agregar episodio" : "Add episode"}
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-inset-md sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={isEs ? "Episodios" : "Episodes"}
          value={episodes.length}
          detail={
            isEs
              ? `${episodes.length - liveCount} no visibles`
              : `${episodes.length - liveCount} not visible`
          }
          icon={Mic}
          tone="bg-brand-100"
          iconTone="text-fg-brand"
        />
        <SummaryCard
          label={isEs ? "Visibles ahora" : "Live now"}
          value={liveCount}
          detail={
            isEs ? "Los miembros pueden verlos" : "Members can watch these"
          }
          icon={Star}
          tone="bg-success-100"
          iconTone="text-success"
        />
        <SummaryCard
          label={isEs ? "Temas" : "Topics"}
          value={categories.filter((entry) => !entry.archived).length}
          detail={isEs ? "Filtros para explorar" : "Browsable filters"}
          icon={Tag}
          tone="bg-accent-100"
          iconTone="text-accent-fg"
        />
        <SummaryCard
          label={isEs ? "Preguntas" : "Questions"}
          value={questions.length}
          detail={
            isEs
              ? `${newQuestionCount} sin leer`
              : `${newQuestionCount} not read yet`
          }
          icon={MessageCircleQuestion}
          tone="bg-warning-100"
          iconTone="text-warning"
        />
      </section>

      {saveError ? (
        <Alert
          tone="danger"
          title={isEs ? "Ese cambio no se guardó" : "That change did not save"}
          onDismiss={dismissSaveError}
          className="mt-stack-lg"
        >
          {saveError instanceof Error && saveError.message
            ? saveError.message
            : t("tableTalk.saveFailed")}
        </Alert>
      ) : null}

      {openError ? (
        <Alert
          tone="danger"
          title={t("tableTalk.openFailedTitle")}
          onDismiss={() => setOpenError(null)}
          className="mt-stack-lg"
        >
          {openError instanceof Error && openError.message
            ? openError.message
            : t("common.tryAgain")}
        </Alert>
      ) : null}

      <Card as="section" className="mt-stack-lg">
        <h2 className="text-heading-4 text-fg">
          {isEs ? "Episodios" : "Episodes"}
        </h2>
        <p className="mt-0.5 text-body-md text-fg-muted">
          {isEs
            ? "Los borradores y los episodios programados aparecen arriba. Solo un episodio con archivo de video puede llegar a los miembros."
            : "Drafts and scheduled episodes sit at the top. Only an episode with a video file can reach members."}
        </p>

        <AsyncSection
          pending={isPending}
          error={error}
          onRetry={canRetry(error) ? refetch : undefined}
          isEmpty={episodes.length === 0}
          errorTitle={errorTitleFor(
            error,
            isEs ? "Table Talk no se cargó" : "Table Talk did not load",
            isEs ? "es" : "en",
          )}
          errorMessage={errorMessageFor(error, undefined, isEs ? "es" : "en")}
          skeleton={
            <div className="mt-6 space-y-stack-sm">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} height={104} />
              ))}
            </div>
          }
          empty={
            <EmptyState
              className="mt-stack-lg"
              icon={<Mic aria-hidden="true" />}
              title={isEs ? "Aún no hay episodios" : "No episodes yet"}
              description={
                isEs
                  ? "Suba la primera conversación: un video, un título, quién habla y los temas que trata."
                  : "Upload the first conversation — a video, a title, who is speaking, and the topics it covers."
              }
              action={
                <Button onClick={() => setCreating(true)}>
                  <Plus aria-hidden="true" className="size-4 shrink-0" />
                  {isEs ? "Agregar episodio" : "Add episode"}
                </Button>
              }
            />
          }
        >
          <ul className="mt-stack-lg space-y-stack-sm">
            {episodes.map((episode) => (
              <EpisodeRow
                key={episode.id}
                episode={episode}
                categoryNames={episode.categoryIds
                  .map((id) => categoryLabel(categories, id, isEs))
                  .filter(Boolean)
                  .join(", ")}
                onEdit={() =>
                  /* The list holds summaries; the editor needs the whole
                     episode (captions, transcripts). */
                  void openEpisode(episode.id)
                    .then(setEditing)
                    .catch((cause: unknown) => setOpenError(cause))
                }
                onDelete={() => setPendingDelete(episode)}
                onFeature={() => setFeatured(episode.id)}
                onStatus={(status) => setStatus(episode.id, status)}
                onMove={(direction) => move(episode.id, direction)}
              />
            ))}
          </ul>
        </AsyncSection>
      </Card>

      <Card
        as="section"
        id="suggested-questions"
        className="mt-stack-lg scroll-mt-24"
      >
        <h2 className="text-heading-4 text-fg">
          {isEs ? "Preguntas sugeridas" : "Suggested questions"}
        </h2>
        <p className="mt-0.5 text-body-md text-fg-muted">
          {isEs
            ? "Sugerencias de temas de los miembros. Nada de esto se publica, y ninguna pregunta aparece jamás con el nombre de un miembro."
            : "Topic suggestions from members. Nothing here is published, and no question ever appears with a member’s name on it."}
        </p>

        {questions.length === 0 ? (
          <EmptyState
            className="mt-stack-lg"
            variant="bare"
            icon={<MessageCircleQuestion aria-hidden="true" />}
            title={isEs ? "Aún no hay preguntas" : "No questions yet"}
            description={
              isEs
                ? "Cuando los miembros sugieran un tema para un futuro episodio, aparecerá aquí."
                : "When members suggest a topic for a future episode, it lands here."
            }
          />
        ) : (
          <ul className="mt-stack-lg space-y-stack-sm">
            {questions.map((question) => (
              <QuestionRow
                key={question.id}
                question={question}
                onStatus={(status) => setQuestionStatus(question.id, status)}
              />
            ))}
          </ul>
        )}
      </Card>

      {creating || editing ? (
        <EpisodeEditor
          episode={editing ?? undefined}
          categories={categories.filter((entry) => !entry.archived)}
          nextOrder={episodes.length}
          onSave={(episode) => {
            saveEpisode(episode, editing ?? undefined);
            closeEditor();
          }}
          onClose={closeEditor}
          saving={isSaving}
        />
      ) : null}

      {managingTopics ? (
        <CategoryManager
          categories={categories}
          episodes={episodes}
          onAdd={addCategory}
          onRename={renameCategory}
          onArchive={archiveCategory}
          onClose={() => setManagingTopics(false)}
        />
      ) : null}

      {/* Deleting is the one action with no undo, so it asks. */}
      {pendingDelete ? (
        <Modal
          open
          size="small"
          closeOnBackdrop={false}
          onClose={() => setPendingDelete(null)}
          title={isEs ? "¿Eliminar este episodio?" : "Delete this episode?"}
          description={
            isEs
              ? `"${pendingDelete.titleEn || "Episodio sin título"}" se eliminará para todos. Esta acción no se puede deshacer; archívelo si solo quiere ocultarlo.`
              : `"${pendingDelete.titleEn || "Untitled episode"}" will be removed for everyone. This cannot be undone — archive it instead if you only want it hidden.`
          }
          footer={
            <div className="flex flex-wrap items-center justify-end gap-inline-md">
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setPendingDelete(null)}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteEpisode(pendingDelete.id);
                  setPendingDelete(null);
                }}
              >
                {isEs ? "Eliminar" : "Delete"}
              </Button>
            </div>
          }
        />
      ) : null}
    </>
  );
}
