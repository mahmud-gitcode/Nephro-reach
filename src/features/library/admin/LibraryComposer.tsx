"use client";

import React, { useRef, useState } from "react";
import {
  FileText,
  Globe,
  Image as ImageIcon,
  Tag,
  Video,
  X,
} from "lucide-react";
import { LIBRARY_CATEGORIES } from "../library.options";
import {
  canPost,
  composeResource,
  draftFrom,
  emptyDraft,
  formatDuration,
  type LibraryDraft,
} from "../library.rules";
import type { LibraryCategory, LibraryResource } from "../library.types";
import { Button, Chip, ChipGroup, Modal, Select } from "@/components/ui";

/* ==========================================================================
   The Library composer
   --------------------------------------------------------------------------
   Write something, attach a file, post — the shape everyone already knows
   from every social app, rather than a fourteen-field content form.

   What that costs is the title and summary fields, and the caption pays for
   them: first line is the title, the next paragraph is the summary, the rest
   is the body. The split lives in library.rules so it can run in reverse
   when a post is reopened.

   The attachment decides what kind of post this is. Attach a video and it is
   a video post; attach a PDF and it is a document; attach nothing and it is
   a written one. Nobody picks a "resource type" from a list.

   Phase 12: posts are saved to the API. Attaching a video, a document or an
   image waits on D18 (a public storage host for content media) and INT-16
   (videos over 10 MB): the four attach controls are shown but disabled, with
   a note. A post being edited keeps the media links it already has; a made-up
   path or a data: URL is never sent.
   ========================================================================== */

type Attachment = { name: string; previewUrl: string | null };

function AttachButton({
  icon: Icon,
  label,
  accept,
  onPick,
  disabled = false,
}: {
  icon: React.ElementType;
  label: string;
  accept: string;
  onPick: (file: File) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
          /* Cleared so picking the same file twice still fires a change. */
          event.target.value = "";
        }}
      />
      <Chip
        icon={<Icon aria-hidden="true" />}
        disabled={disabled}
        aria-describedby={disabled ? "library-media-note" : undefined}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Chip>
    </>
  );
}

export function LibraryComposer({
  resource,
  onPost,
  onClose,
  saving = false,
  authorName,
}: {
  /** Omit to write a new post. */
  resource?: LibraryResource;
  onPost: (resource: LibraryResource) => void;
  onClose: () => void;
  saving?: boolean;
  authorName?: string;
}) {
  const [draft, setDraft] = useState<LibraryDraft>(() =>
    resource ? draftFrom(resource) : emptyDraft(),
  );
  const [attachment, setAttachment] = useState<Attachment | null>(() => {
    const existing = resource?.videoSrc ?? resource?.fileSrc;
    return existing
      ? { name: existing.split("/").pop() ?? existing, previewUrl: null }
      : null;
  });
  const [showSpanish, setShowSpanish] = useState(
    () => (resource?.titleEs ?? "").trim().length > 0,
  );
  const [showTopic, setShowTopic] = useState(false);

  const set = (patch: Partial<LibraryDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  /* Uploads wait on D18; the attach controls are disabled. */
  const noUpload = () => {};

  const removeAttachment = () => {
    setAttachment(null);
    set({
      kind: "article",
      videoSrc: undefined,
      durationSeconds: undefined,
      fileSrc: undefined,
      fileMetaEn: undefined,
      fileMetaEs: undefined,
    });
  };

  const ready = canPost(draft);
  const topic = LIBRARY_CATEGORIES.find(
    (entry) => entry.key === draft.category,
  );

  return (
    <Modal
      open
      onClose={onClose}
      size="big"
      title={resource ? "Edit post" : "Create post"}
      footer={
        <Button
          className="w-full"
          onClick={() => onPost(composeResource(draft, resource))}
          disabled={!ready || saving}
        >
          {saving ? "Posting…" : resource ? "Save changes" : "Post"}
        </Button>
      }
    >
      <div className="space-y-stack-md">
        {authorName ? (
          <div className="flex items-center gap-inline-md">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-primary-soft text-label-md text-primary-fg"
            >
              {authorName.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <p className="text-label-md text-fg">{authorName}</p>
              <p className="text-body-sm text-fg-muted">
                Posting to My Library
              </p>
            </div>
          </div>
        ) : null}

        <div>
          <label htmlFor="library-caption" className="sr-only">
            What do you want to share with members?
          </label>
          <textarea
            id="library-caption"
            autoFocus
            rows={6}
            value={draft.caption}
            onChange={(event) => set({ caption: event.target.value })}
            placeholder="What do you want to share with members?"
            className="w-full resize-y border-0 bg-transparent p-0 text-body-lg text-fg outline-none placeholder:text-fg-muted focus:ring-0"
          />
          {/* Said once, quietly, rather than as three labelled fields. */}
          <p className="text-body-sm text-fg-subtle">
            The first line becomes the title members see.
          </p>
        </div>

        {showSpanish ? (
          <div className="rounded-card border border-line bg-surface-sunken p-inset-sm">
            <div className="flex items-center justify-between gap-inline-md">
              <label
                htmlFor="library-caption-es"
                className="text-label-sm text-fg-secondary"
              >
                Spanish version
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowSpanish(false);
                  set({ captionEs: "" });
                }}
                className="cursor-pointer rounded-control-small p-1 text-fg-muted transition-colors duration-150 ease-standard hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label="Remove the Spanish version"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <textarea
              id="library-caption-es"
              rows={5}
              value={draft.captionEs}
              onChange={(event) => set({ captionEs: event.target.value })}
              placeholder="Escribe la versión en español…"
              className="mt-stack-xs w-full resize-y border-0 bg-transparent p-0 text-body-md text-fg outline-none placeholder:text-fg-muted focus:ring-0"
            />
          </div>
        ) : null}

        {attachment ? (
          <div className="rounded-card border border-line bg-surface-sunken p-inset-sm">
            <div className="flex items-center justify-between gap-inline-md">
              <p className="flex min-w-0 items-center gap-inline-md text-body-sm text-fg-secondary">
                {draft.kind === "video" ? (
                  <Video aria-hidden="true" className="h-4 w-4 shrink-0" />
                ) : (
                  <FileText aria-hidden="true" className="h-4 w-4 shrink-0" />
                )}
                <span className="min-w-0 flex-1 truncate">
                  {attachment.name}
                </span>
                {draft.durationSeconds ? (
                  <span className="shrink-0 text-fg-muted">
                    {formatDuration(draft.durationSeconds)}
                  </span>
                ) : null}
              </p>
              <button
                type="button"
                onClick={removeAttachment}
                aria-label="Remove attachment"
                className="shrink-0 cursor-pointer rounded-control-small p-1 text-fg-muted transition-colors duration-150 ease-standard hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            {attachment.previewUrl && draft.kind === "image" ? (
              /* eslint-disable-next-line @next/next/no-img-element -- a data URL, nothing to optimise */
              <img
                src={attachment.previewUrl}
                alt=""
                className="mt-stack-sm max-h-80 w-full rounded-control object-contain"
              />
            ) : null}
            {attachment.previewUrl && draft.kind === "video" ? (
              <video
                src={attachment.previewUrl}
                controls
                preload="metadata"
                className="mt-stack-sm aspect-video w-full rounded-control bg-surface-inverse"
              />
            ) : null}
          </div>
        ) : null}

        {showTopic ? (
          <div>
            <label
              htmlFor="library-topic"
              className="text-label-sm text-fg-secondary"
            >
              Topic
            </label>
            <Select
              id="library-topic"
              value={draft.category}
              onChange={(event) =>
                set({ category: event.target.value as LibraryCategory })
              }
              className="mt-stack-xs"
            >
              {LIBRARY_CATEGORIES.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.labelEn}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div className="rounded-card border border-line p-inset-sm">
          <p className="text-label-sm text-fg-secondary">Add to your post</p>
          <ChipGroup label="Add to your post" className="mt-stack-sm">
            <AttachButton
              icon={Video}
              label="Video"
              accept="video/*"
              onPick={noUpload}
              disabled
            />
            <AttachButton
              icon={FileText}
              label="Document"
              accept=".pdf,.doc,.docx,application/pdf"
              onPick={noUpload}
              disabled
            />
            <AttachButton
              icon={ImageIcon}
              label="Image post"
              accept="image/*"
              onPick={noUpload}
              disabled
            />
            <AttachButton
              icon={ImageIcon}
              label="Cover image"
              accept="image/*"
              onPick={noUpload}
              disabled
            />
            <Chip
              selected={showTopic || draft.category !== "general"}
              icon={<Tag aria-hidden="true" />}
              onClick={() => setShowTopic((current) => !current)}
            >
              {draft.category === "general"
                ? "Topic"
                : (topic?.labelEn ?? "Topic")}
            </Chip>
            <Chip
              selected={showSpanish}
              icon={<Globe aria-hidden="true" />}
              onClick={() => setShowSpanish((current) => !current)}
            >
              Spanish
            </Chip>
          </ChipGroup>
          <p
            id="library-media-note"
            className="mt-stack-sm text-caption text-fg-muted"
          >
            Attaching videos, documents and images is not available yet: it
            waits on where public media will be stored. A post keeps the media
            it already has.
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default LibraryComposer;
