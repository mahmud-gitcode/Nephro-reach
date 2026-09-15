"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Plus, Trash2, Upload } from "lucide-react";
import { parseCaptions } from "@/features/education/vtt";
import {
  AUDIENCES,
  canSaveEpisode,
  createId,
  emptyEpisode,
  episodeError,
  formatDuration,
  todayIso,
} from "../tableTalk.rules";
import type {
  EpisodeAudience,
  EpisodeStatus,
  TableTalkCategory,
  TableTalkEpisode,
} from "../tableTalk.types";
import {
  Alert,
  Button,
  Chip,
  ChipGroup,
  FormField,
  Input,
  Modal,
  Select,
  SwitchRow,
  Textarea,
} from "@/components/ui";

/* ==========================================================================
   Episode editor
   --------------------------------------------------------------------------
   One form per episode. Everything the brief lists — video, thumbnail, title,
   description, speakers, categories, duration, captions in both languages,
   transcript, schedule — is a field here, because the whole point of this
   feature is that publishing an episode never needs a developer.

   Files follow the pattern Class Management set: the picked file is previewed
   from an object URL and the stored path is where the backend will serve it.
   Nothing transfers until the upload endpoint exists, so the admin sees a
   real preview and a real filename, and the record is already the shape the
   server will fill.
   ========================================================================== */

function FileButton({
  label,
  accept,
  onPick,
}: {
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
      <Button
        variant="neutral"
        appearance="fill-stroke"
        onClick={() => inputRef.current?.click()}
      >
        <Upload aria-hidden="true" className="size-4 shrink-0" />
        {label}
      </Button>
    </>
  );
}

function Picked({ name }: { name: string | null }) {
  if (!name) return null;
  return (
    <p className="mt-stack-xs flex items-center gap-inline-md rounded-control bg-success-surface px-inset-sm py-inset-xs text-body-sm text-success">
      <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{name}</span>
    </p>
  );
}

export function EpisodeEditor({
  episode,
  categories,
  nextOrder,
  onSave,
  onClose,
  saving = false,
}: {
  /** Omit to add a new episode. */
  episode?: TableTalkEpisode;
  categories: TableTalkCategory[];
  nextOrder: number;
  onSave: (episode: TableTalkEpisode) => void;
  onClose: () => void;
  saving?: boolean;
}) {
  const [draft, setDraft] = useState<TableTalkEpisode>(
    () => episode ?? emptyEpisode(nextOrder),
  );
  const [videoName, setVideoName] = useState<string | null>(
    () => episode?.videoSrc?.split("/").pop() ?? null,
  );
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbName, setThumbName] = useState<string | null>(null);
  const [captionNote, setCaptionNote] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  /* Object URLs live until revoked; several files in one sitting leak them
     all otherwise. */
  const objectUrls = useRef<string[]>([]);
  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const set = (patch: Partial<TableTalkEpisode>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const error = episodeError(draft);

  const pickVideo = (file: File) => {
    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);
    setVideoPreview(url);
    setVideoName(file.name);
    set({ videoSrc: `/videos/${file.name}` });

    /* Reading the real length means the runtime on the card is the file's,
       not a number someone typed and got wrong. */
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const seconds = probe.duration;
      if (Number.isFinite(seconds) && seconds > 0) {
        const rounded = Math.round(seconds);
        set({ durationSeconds: rounded, isShort: rounded <= 180 });
      }
    };
    probe.src = url;
  };

  const pickThumb = (file: File) => {
    setThumbName(file.name);
    set({ thumbnail: `/images/table-talk/${file.name}` });
  };

  const pickCaptions = async (file: File, lang: "en" | "es") => {
    const text = await file.text();
    const cues = parseCaptions(text);

    if (cues.length === 0) {
      setCaptionNote("No caption lines found. Expecting a .vtt or .srt file.");
      return;
    }

    setCaptionNote(
      `${file.name} — ${cues.length} caption lines read for ${lang.toUpperCase()}.`,
    );
    set({ captions: { ...draft.captions, [lang]: text } });
  };

  const toggleCategory = (id: string) =>
    set({
      categoryIds: draft.categoryIds.includes(id)
        ? draft.categoryIds.filter((entry) => entry !== id)
        : [...draft.categoryIds, id],
    });

  const submit = () => {
    setTouched(true);
    if (!canSaveEpisode(draft)) return;
    onSave(draft);
  };

  return (
    <Modal
      open
      size="wide"
      onClose={onClose}
      title={episode ? "Edit episode" : "Add an episode"}
      description="Members find episodes by searching and filtering, so the description and categories matter as much as the video."
      footer={
        <div className="flex flex-wrap items-center justify-end gap-inline-md">
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : episode ? "Save changes" : "Add episode"}
          </Button>
        </div>
      }
    >
      <div className="space-y-stack-lg">
        {/* ---------------------------------------------------- the video */}
        <section className="space-y-stack-md">
          <h3 className="text-heading-5 text-fg">Video</h3>

          <div className="flex flex-wrap items-center gap-inline-md">
            <FileButton
              label={videoName ? "Replace video" : "Upload video"}
              accept="video/*"
              onPick={pickVideo}
            />
            <FileButton
              label={thumbName ? "Replace thumbnail" : "Upload thumbnail"}
              accept="image/*"
              onPick={pickThumb}
            />
            {draft.durationSeconds ? (
              <span className="text-body-sm text-fg-muted">
                Runtime {formatDuration(draft.durationSeconds)}
              </span>
            ) : null}
          </div>

          <Picked name={videoName} />
          <Picked name={thumbName} />

          {videoPreview ? (
            <video
              src={videoPreview}
              controls
              preload="metadata"
              className="aspect-video w-full rounded-control bg-surface-inverse"
            />
          ) : null}

          {/* An episode with no file cannot go live, so say it here rather
              than let them wonder why Publish did nothing. */}
          {!draft.videoSrc ? (
            <Alert tone="info">
              An episode needs a video file before it can reach members. You can
              save it as a draft without one.
            </Alert>
          ) : null}
        </section>

        {/* ---------------------------------------------------- the words */}
        <section className="space-y-stack-md border-t border-line pt-inset-md">
          <h3 className="text-heading-5 text-fg">Title and description</h3>

          <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
            <FormField
              label="Title (English)"
              required
              hint="Also becomes the page address."
              error={
                touched && error === "title"
                  ? "A title is required."
                  : undefined
              }
            >
              {(props) => (
                <Input
                  {...props}
                  value={draft.titleEn}
                  onChange={(event) => set({ titleEn: event.target.value })}
                />
              )}
            </FormField>

            <FormField label="Title (Spanish)" optionalLabel="optional">
              {(props) => (
                <Input
                  {...props}
                  value={draft.titleEs}
                  onChange={(event) => set({ titleEs: event.target.value })}
                />
              )}
            </FormField>

            <FormField label="Description (English)">
              {(props) => (
                <Textarea
                  {...props}
                  rows={3}
                  value={draft.descriptionEn}
                  onChange={(event) =>
                    set({ descriptionEn: event.target.value })
                  }
                />
              )}
            </FormField>

            <FormField label="Description (Spanish)" optionalLabel="optional">
              {(props) => (
                <Textarea
                  {...props}
                  rows={3}
                  value={draft.descriptionEs}
                  onChange={(event) =>
                    set({ descriptionEs: event.target.value })
                  }
                />
              )}
            </FormField>
          </div>
        </section>

        {/* -------------------------------------------------- the speakers */}
        <section className="space-y-stack-md border-t border-line pt-inset-md">
          <div className="flex flex-wrap items-center justify-between gap-inline-md">
            <h3 className="text-heading-5 text-fg">Speakers</h3>
            <Button
              size="small"
              variant="neutral"
              appearance="fill-stroke"
              onClick={() =>
                set({
                  speakers: [
                    ...draft.speakers,
                    { id: createId("sp"), name: "", role: "" },
                  ],
                })
              }
            >
              <Plus aria-hidden="true" className="size-4 shrink-0" />
              Add speaker
            </Button>
          </div>

          {draft.speakers.length === 0 ? (
            <p className="text-body-sm text-fg-muted">
              Add the host and any guests. Their role shows under the title.
            </p>
          ) : (
            <div className="space-y-stack-sm">
              {draft.speakers.map((speaker, index) => (
                <div
                  key={speaker.id}
                  className="flex flex-wrap items-end gap-inline-md"
                >
                  <FormField label={`Name ${index + 1}`} className="flex-1">
                    {(props) => (
                      <Input
                        {...props}
                        value={speaker.name}
                        onChange={(event) =>
                          set({
                            speakers: draft.speakers.map((entry) =>
                              entry.id === speaker.id
                                ? { ...entry, name: event.target.value }
                                : entry,
                            ),
                          })
                        }
                      />
                    )}
                  </FormField>
                  <FormField label="Role or credentials" className="flex-1">
                    {(props) => (
                      <Input
                        {...props}
                        value={speaker.role}
                        onChange={(event) =>
                          set({
                            speakers: draft.speakers.map((entry) =>
                              entry.id === speaker.id
                                ? { ...entry, role: event.target.value }
                                : entry,
                            ),
                          })
                        }
                        placeholder="Nephrologist"
                      />
                    )}
                  </FormField>
                  <Button
                    variant="danger"
                    appearance="stroke"
                    onClick={() =>
                      set({
                        speakers: draft.speakers.filter(
                          (entry) => entry.id !== speaker.id,
                        ),
                      })
                    }
                    aria-label={`Remove speaker ${index + 1}`}
                  >
                    <Trash2 aria-hidden="true" className="size-4 shrink-0" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ------------------------------------------------- categorising */}
        <section className="space-y-stack-md border-t border-line pt-inset-md">
          <h3 className="text-heading-5 text-fg">Topics and audience</h3>

          <FormField
            label="Topics"
            hint="Pick as many as fit. These are the filters members browse by."
          >
            {() => (
              <ChipGroup label="Topics" selection="multiple">
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    selected={draft.categoryIds.includes(category.id)}
                    onClick={() => toggleCategory(category.id)}
                  >
                    {category.labelEn}
                  </Chip>
                ))}
              </ChipGroup>
            )}
          </FormField>

          <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
            <FormField label="Who it is for">
              {(props) => (
                <Select
                  {...props}
                  value={draft.audience}
                  onChange={(event) =>
                    set({ audience: event.target.value as EpisodeAudience })
                  }
                >
                  {AUDIENCES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.labelEn}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
          </div>

          <SwitchRow
            checked={draft.isLiveEvent}
            onChange={(checked) => set({ isLiveEvent: checked })}
            title="This is a live event"
            description="Shows under the Live Events filter."
          />
          <SwitchRow
            checked={draft.isShort}
            onChange={(checked) => set({ isShort: checked })}
            title="Short video"
            description="Set automatically for anything under three minutes."
          />
        </section>

        {/* ----------------------------------- captions and the transcript */}
        <section className="space-y-stack-md border-t border-line pt-inset-md">
          <h3 className="text-heading-5 text-fg">Captions and transcript</h3>

          <div className="flex flex-wrap items-center gap-inline-md">
            <FileButton
              label={
                draft.captions.en
                  ? "Replace English captions"
                  : "English captions"
              }
              accept=".vtt,.srt,text/vtt"
              onPick={(file) => void pickCaptions(file, "en")}
            />
            <FileButton
              label={
                draft.captions.es
                  ? "Replace Spanish captions"
                  : "Spanish captions"
              }
              accept=".vtt,.srt,text/vtt"
              onPick={(file) => void pickCaptions(file, "es")}
            />
          </div>

          {captionNote ? (
            <p className="text-body-sm text-fg-muted">{captionNote}</p>
          ) : null}

          <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
            <FormField label="Transcript (English)" optionalLabel="optional">
              {(props) => (
                <Textarea
                  {...props}
                  rows={5}
                  value={draft.transcriptEn ?? ""}
                  onChange={(event) =>
                    set({ transcriptEn: event.target.value || undefined })
                  }
                  placeholder="Paste the transcript. Leave a blank line between paragraphs."
                />
              )}
            </FormField>
            <FormField label="Transcript (Spanish)" optionalLabel="optional">
              {(props) => (
                <Textarea
                  {...props}
                  rows={5}
                  value={draft.transcriptEs ?? ""}
                  onChange={(event) =>
                    set({ transcriptEs: event.target.value || undefined })
                  }
                />
              )}
            </FormField>
          </div>
        </section>

        {/* ------------------------------------------------- when it goes live */}
        <section className="space-y-stack-md border-t border-line pt-inset-md">
          <h3 className="text-heading-5 text-fg">Publishing</h3>

          <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
            <FormField label="Status">
              {(props) => (
                <Select
                  {...props}
                  value={draft.status}
                  onChange={(event) =>
                    set({ status: event.target.value as EpisodeStatus })
                  }
                >
                  <option value="draft">Draft — admins only</option>
                  <option value="scheduled">
                    Scheduled — goes live on a date
                  </option>
                  <option value="published">Published — live now</option>
                  <option value="archived">Archived — hidden</option>
                </Select>
              )}
            </FormField>

            {draft.status === "scheduled" ? (
              <FormField
                label="Goes live on"
                required
                error={
                  touched && error === "publish-at"
                    ? "Pick the date it should appear."
                    : undefined
                }
              >
                {(props) => (
                  <Input
                    {...props}
                    type="date"
                    min={todayIso()}
                    value={draft.publishAt ?? ""}
                    onChange={(event) =>
                      set({ publishAt: event.target.value || undefined })
                    }
                  />
                )}
              </FormField>
            ) : null}
          </div>

          <SwitchRow
            checked={draft.featured}
            onChange={(checked) => set({ featured: checked })}
            title="Feature this episode"
            description="Puts it at the top of Table Talk. Only one episode can be featured, so this replaces the current one."
          />
        </section>
      </div>
    </Modal>
  );
}

export default EpisodeEditor;
