"use client";

import React, { useMemo, useState } from "react";
import { Pencil, Play, Trash2, Video } from "lucide-react";
import { Badge, Button, Card, Modal, Skeleton } from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import {
  approvedTestimonials as onlyApproved,
  testimonialsByAuthor,
  useTestimonials,
  type Testimonial,
} from "@/features/testimonials/useTestimonials";
import { isRevisable } from "@/features/testimonials/testimonials.rules";
import VideoPlayerModal from "@/features/testimonials/VideoPlayerModal";
import SubmitTestimonialModal from "@/features/testimonials/SubmitTestimonialModal";

/* ==========================================================================
   From Fear to Hope — a small card, not a section
   --------------------------------------------------------------------------
   Dashboard 2 (2026-10-12): the stories stay — the dashboard is the only
   place a member watches them, shares their own and follows its review —
   but as one card at the foot of the page, so the member's day comes first.
   Two stories show; the rest open in place.
   ========================================================================== */

const PREVIEW = 2;

function StoryTile({
  story,
  onPlay,
}: {
  story: Testimonial;
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="group flex w-full cursor-pointer items-center gap-inline-md rounded-card-nested border border-line-subtle p-inset-xs text-left transition-colors hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-card-nested bg-surface-inverse">
        {/* A member-submitted thumbnail: any host, so not next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={story.thumbnailUrl || "/images/user-dashboard/testimonial.jpg"}
          alt=""
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="flex size-8 items-center justify-center rounded-pill bg-white/95 text-brand-700">
            <Play aria-hidden="true" className="ml-0.5 size-4 fill-current" />
          </span>
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 block text-label-md text-fg">
          {story.title}
        </span>
        <span className="block text-caption text-fg-muted">
          {story.memberName} · {story.role}
          {story.duration ? ` · ${story.duration}` : ""}
        </span>
      </span>
    </button>
  );
}

export function StoriesCard({ isEs }: { isEs: boolean }) {
  const { user } = useAuth();
  const { testimonials, isPending, refetch, remove } = useTestimonials();
  const approved = useMemo(() => onlyApproved(testimonials), [testimonials]);
  const mine = useMemo(
    () => testimonialsByAuthor(testimonials, user?.email || ""),
    [testimonials, user?.email],
  );

  const [showAll, setShowAll] = useState(false);
  const [playing, setPlaying] = useState<Testimonial | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [deleting, setDeleting] = useState<Testimonial | null>(null);
  const shown = showAll ? approved : approved.slice(0, PREVIEW);

  const statusLabel = (story: Testimonial) =>
    story.status === "approved"
      ? isEs
        ? "Publicada"
        : "Published"
      : story.status === "declined"
        ? isEs
          ? "No aprobada"
          : "Not approved"
        : isEs
          ? "En revisión"
          : "Under review";

  return (
    <Card as="section" className="space-y-stack-md">
      <div className="flex flex-wrap items-center justify-between gap-inline-md">
        <h2 className="text-heading-4 text-fg">
          {isEs ? "Del Miedo a la Esperanza" : "From Fear to Hope"}
        </h2>
        <Button
          size="small"
          variant="primary"
          appearance="fill-stroke"
          leadingIcon={<Video aria-hidden="true" />}
          onClick={() => {
            setEditing(null);
            setSubmitOpen(true);
          }}
        >
          {isEs ? "Compartir mi historia" : "Share your story"}
        </Button>
      </div>

      {/* The member's own stories, and where each got to. */}
      {mine.length > 0 ? (
        <ul className="space-y-stack-xs">
          {mine.map((story) => (
            <li
              key={story.id}
              className="flex flex-wrap items-center gap-inline-md rounded-card-nested bg-surface-sunken px-inset-sm py-inset-xs"
            >
              <span className="min-w-0 flex-1 text-body-sm text-fg">
                {isEs ? "Su historia:" : "Your story:"} {story.title}
              </span>
              <Badge
                tone={
                  story.status === "approved"
                    ? "success"
                    : story.status === "declined"
                      ? "danger"
                      : "warning"
                }
              >
                {statusLabel(story)}
              </Badge>
              {isRevisable(story) ? (
                <Button
                  size="small"
                  variant="neutral"
                  appearance="ghost"
                  iconOnly
                  aria-label={
                    isEs ? `Editar ${story.title}` : `Edit ${story.title}`
                  }
                  onClick={() => {
                    setEditing(story);
                    setSubmitOpen(true);
                  }}
                >
                  <Pencil />
                </Button>
              ) : null}
              <Button
                size="small"
                variant="danger"
                appearance="ghost"
                iconOnly
                aria-label={
                  isEs ? `Eliminar ${story.title}` : `Delete ${story.title}`
                }
                onClick={() => setDeleting(story)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {isPending ? (
        <Skeleton height={140} />
      ) : approved.length === 0 ? (
        <p className="text-body-sm text-fg-muted">
          {isEs
            ? "Aún no hay historias publicadas. ¡Puede ser la primera!"
            : "No stories published yet. Yours could be the first!"}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-inset-sm md:grid-cols-2">
            {shown.map((story) => (
              <StoryTile
                key={story.id}
                story={story}
                onPlay={() => setPlaying(story)}
              />
            ))}
          </div>
          {approved.length > PREVIEW ? (
            <Button
              size="small"
              variant="neutral"
              appearance="fill-stroke"
              aria-expanded={showAll}
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll
                ? isEs
                  ? "Mostrar menos"
                  : "Show fewer"
                : isEs
                  ? `Ver todas las historias (${approved.length})`
                  : `See all stories (${approved.length})`}
            </Button>
          ) : null}
        </>
      )}

      <VideoPlayerModal
        testimonial={playing}
        open={Boolean(playing)}
        onClose={() => setPlaying(null)}
      />

      {deleting ? (
        <Modal
          open
          size="small"
          closeOnBackdrop={false}
          onClose={() => setDeleting(null)}
          title={isEs ? "¿Eliminar su historia?" : "Delete your story?"}
          description={
            isEs
              ? `"${deleting.title}" se eliminará. Si ya estaba publicada, dejará de aparecer para los demás.`
              : `"${deleting.title}" will be removed. If it was published, it stops showing for everyone else.`
          }
          footer={
            <>
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setDeleting(null)}
              >
                {isEs ? "Conservar" : "Keep it"}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  void remove(deleting.id);
                  setDeleting(null);
                }}
              >
                {isEs ? "Eliminar" : "Delete"}
              </Button>
            </>
          }
        />
      ) : null}

      <SubmitTestimonialModal
        key={editing ? `story-${editing.id}` : "story-new"}
        open={submitOpen}
        onClose={() => {
          setSubmitOpen(false);
          setEditing(null);
        }}
        user={user}
        editing={editing}
        onSubmitted={refetch}
      />
    </Card>
  );
}
