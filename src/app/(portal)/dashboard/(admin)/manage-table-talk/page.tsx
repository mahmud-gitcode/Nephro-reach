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
  Button,
  Card,
  EmptyState,
  Modal,
  Select,
  Skeleton,
} from "@/components/ui";

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

const QUESTION_STATUSES: { value: QuestionStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "planned", label: "Planned for an episode" },
  { value: "answered", label: "Answered" },
  { value: "declined", label: "Not suitable" },
];

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
            {episode.titleEn || "Untitled episode"}
          </p>
          <Badge tone={STATUS_TONE[episode.status]}>
            {episode.status === "scheduled" && episode.publishAt
              ? `Scheduled · ${episode.publishAt}`
              : episode.status.charAt(0).toUpperCase() +
                episode.status.slice(1)}
          </Badge>
          {episode.featured ? <Badge tone="accent">Featured</Badge> : null}
          {/* The two reasons an episode a member expects to see is not there. */}
          {!episode.videoSrc ? (
            <Badge tone="warning">No video file</Badge>
          ) : null}
          {!episode.titleEs.trim() ? (
            <Badge tone="warning">No Spanish</Badge>
          ) : null}
        </div>

        <p className="mt-stack-xs line-clamp-1 text-body-sm text-fg-muted">
          {episode.descriptionEn || "No description yet."}
        </p>

        <p className="mt-stack-xs flex flex-wrap items-center gap-inline-md text-body-sm text-fg-muted">
          <span>{episode.speakers[0]?.name || "No speaker"}</span>
          <span aria-hidden="true">·</span>
          <span>{categoryNames || "No topic"}</span>
          <span aria-hidden="true">·</span>
          <span>
            {episode.durationSeconds
              ? formatDuration(episode.durationSeconds)
              : "No runtime"}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(episode.publishedAt, false)}</span>
          <span aria-hidden="true">·</span>
          <span className={live ? "text-success" : undefined}>
            {live ? "Visible to members" : "Not visible"}
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
            aria-label={`Move ${episode.titleEn} up`}
          >
            <ChevronUp aria-hidden="true" className="size-4 shrink-0" />
          </Button>
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            onClick={() => onMove(1)}
            aria-label={`Move ${episode.titleEn} down`}
          >
            <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
          </Button>
        </div>

        <Select
          selectSize="small"
          value={episode.status}
          aria-label={`Status for ${episode.titleEn}`}
          onChange={(event) => onStatus(event.target.value as EpisodeStatus)}
          className="w-[128px]"
        >
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>

        <Button
          size="small"
          variant="neutral"
          appearance={episode.featured ? "fill" : "fill-stroke"}
          onClick={onFeature}
          aria-label={`Feature ${episode.titleEn}`}
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
          Edit
        </Button>

        <Button
          size="small"
          variant="danger"
          appearance="stroke"
          onClick={onDelete}
          aria-label={`Delete ${episode.titleEn}`}
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
  return (
    <li className="flex flex-col gap-inset-sm rounded-card border border-line bg-surface p-inset-md sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <p className="text-body-md text-fg">{question.body}</p>
        <p className="mt-stack-xs text-body-sm text-fg-muted">
          {question.askedByName || "A member"}
          {" · "}
          {new Date(question.submittedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-inline-md">
        {question.status === "new" ? <Badge tone="info">New</Badge> : null}
        <Select
          selectSize="small"
          value={question.status}
          aria-label="Question status"
          onChange={(event) => onStatus(event.target.value as QuestionStatus)}
          className="w-[190px]"
        >
          {QUESTION_STATUSES.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </Select>
      </div>
    </li>
  );
}

export default function ManageTableTalkPage() {
  const {
    episodes,
    categories,
    questions,
    newQuestionCount,
    saveEpisode,
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
          <h1 className="text-heading-1 text-fg">Table Talk Management</h1>
          <p className="mt-stack-xs measure text-body-md text-fg-muted">
            Publish episodes, manage the topics members browse by, and read the
            questions they send in.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-inline-md">
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={() => setManagingTopics(true)}
          >
            <Tag aria-hidden="true" className="size-4 shrink-0" />
            Topics
          </Button>
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden="true" className="size-4 shrink-0" />
            Add episode
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-inset-md sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Episodes"
          value={episodes.length}
          detail={`${episodes.length - liveCount} not visible`}
          icon={Mic}
          tone="bg-brand-100"
          iconTone="text-fg-brand"
        />
        <SummaryCard
          label="Live now"
          value={liveCount}
          detail="Members can watch these"
          icon={Star}
          tone="bg-success-100"
          iconTone="text-success"
        />
        <SummaryCard
          label="Topics"
          value={categories.filter((entry) => !entry.archived).length}
          detail="Browsable filters"
          icon={Tag}
          tone="bg-accent-100"
          iconTone="text-accent-fg"
        />
        <SummaryCard
          label="Questions"
          value={questions.length}
          detail={`${newQuestionCount} not read yet`}
          icon={MessageCircleQuestion}
          tone="bg-warning-100"
          iconTone="text-warning"
        />
      </section>

      {saveError ? (
        <Alert
          tone="danger"
          title="That change did not save"
          onDismiss={dismissSaveError}
          className="mt-stack-lg"
        >
          Table Talk is unchanged. Try again — if it keeps failing, the browser
          may be blocking saved data.
        </Alert>
      ) : null}

      <Card as="section" className="mt-stack-lg">
        <h2 className="text-heading-4 text-fg">Episodes</h2>
        <p className="mt-0.5 text-body-md text-fg-muted">
          Drafts and scheduled episodes sit at the top. Only an episode with a
          video file can reach members.
        </p>

        <AsyncSection
          pending={isPending}
          error={error}
          onRetry={refetch}
          isEmpty={episodes.length === 0}
          errorTitle="Table Talk did not load"
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
              title="No episodes yet"
              description="Upload the first conversation — a video, a title, who is speaking, and the topics it covers."
              action={
                <Button onClick={() => setCreating(true)}>
                  <Plus aria-hidden="true" className="size-4 shrink-0" />
                  Add episode
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
                  .map((id) => categoryLabel(categories, id, false))
                  .filter(Boolean)
                  .join(", ")}
                onEdit={() => setEditing(episode)}
                onDelete={() => setPendingDelete(episode)}
                onFeature={() => setFeatured(episode.id)}
                onStatus={(status) => setStatus(episode.id, status)}
                onMove={(direction) => move(episode.id, direction)}
              />
            ))}
          </ul>
        </AsyncSection>
      </Card>

      <Card as="section" className="mt-stack-lg">
        <h2 className="text-heading-4 text-fg">Suggested questions</h2>
        <p className="mt-0.5 text-body-md text-fg-muted">
          Topic suggestions from members. Nothing here is published, and no
          question ever appears with a member&rsquo;s name on it.
        </p>

        {questions.length === 0 ? (
          <EmptyState
            className="mt-stack-lg"
            variant="bare"
            icon={<MessageCircleQuestion aria-hidden="true" />}
            title="No questions yet"
            description="When members suggest a topic for a future episode, it lands here."
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
            saveEpisode(episode);
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
          title="Delete this episode?"
          description={`"${pendingDelete.titleEn || "Untitled episode"}" will be removed for everyone. This cannot be undone — archive it instead if you only want it hidden.`}
          footer={
            <div className="flex flex-wrap items-center justify-end gap-inline-md">
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteEpisode(pendingDelete.id);
                  setPendingDelete(null);
                }}
              >
                Delete
              </Button>
            </div>
          }
        />
      ) : null}
    </>
  );
}
