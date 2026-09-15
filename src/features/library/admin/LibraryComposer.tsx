"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  FileText,
  Globe,
  Image as ImageIcon,
  Tag,
  Video,
  X,
} from "lucide-react";
import { LIBRARY_CATEGORIES } from "../library.seed";
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

   Files are previewed from an object URL and the stored path is where the
   backend will serve them from — the same stand-in Class Management uses
   until the upload endpoint exists.
   ========================================================================== */

type Attachment = { name: string; previewUrl: string | null };

function AttachButton({
  icon: Icon,
  label,
  accept,
  onPick,
}: {
  icon: React.ElementType;
  label: string;
  accept: string;
  onPick: (file: File) => void;
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
  const [coverName, setCoverName] = useState<string | null>(null);
  const [showSpanish, setShowSpanish] = useState(
    () => (resource?.titleEs ?? "").trim().length > 0,
  );
  const [showTopic, setShowTopic] = useState(false);

  /* Object URLs live until revoked. Attaching four files in one sitting
     without this leaks all four. */
  const objectUrls = useRef<string[]>([]);
  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const trackUrl = (file: File) => {
    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);
    return url;
  };

  const set = (patch: Partial<LibraryDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const attachVideo = (file: File) => {
    const url = trackUrl(file);
    setAttachment({ name: file.name, previewUrl: url });
    set({
      kind: "video",
      videoSrc: `/videos/${file.name}`,
      fileSrc: undefined,
      fileMetaEn: undefined,
      fileMetaEs: undefined,
    });

    /* Reading the real length means the runtime on the member card is the
       file's, not a number someone typed and got wrong. */
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const seconds = probe.duration;
      if (Number.isFinite(seconds) && seconds > 0) {
        set({ durationSeconds: Math.round(seconds) });
      }
    };
    probe.src = url;
  };

  const attachDocument = (file: File) => {
    setAttachment({ name: file.name, previewUrl: null });
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    set({
      kind: "document",
      fileSrc: `/documents/${file.name}`,
      /* Page count needs the file parsed server-side, so until then the
         honest label is the size — never an invented "2 pages". */
      fileMetaEn: `PDF · ${sizeKb} KB`,
      fileMetaEs: `PDF · ${sizeKb} KB`,
      videoSrc: undefined,
      durationSeconds: undefined,
    });
  };

  const attachCover = (file: File) => {
    setCoverName(file.name);
    set({ poster: `/images/library/${file.name}` });
  };

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
              onPick={attachVideo}
            />
            <AttachButton
              icon={FileText}
              label="Document"
              accept=".pdf,.doc,.docx,application/pdf"
              onPick={attachDocument}
            />
            <AttachButton
              icon={ImageIcon}
              label={coverName ? "Cover added" : "Cover image"}
              accept="image/*"
              onPick={attachCover}
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
        </div>
      </div>
    </Modal>
  );
}

export default LibraryComposer;
