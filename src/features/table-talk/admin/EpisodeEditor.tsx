"use client";

import { youTubeEmbed } from "@/lib/utils/youtube";
import React, { useRef, useState } from "react";
import { CheckCircle2, Plus, Trash2, Upload } from "lucide-react";
import { parseCaptions } from "@/features/education/vtt";
import { useCollabText } from "@/features/community/collabText";
import { useLanguageCode } from "@/context/LanguageContext";
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
  disabled = false,
  describedBy,
}: {
  label: string;
  accept: string;
  onPick: (file: File) => void;
  disabled?: boolean;
  describedBy?: string;
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
        disabled={disabled}
        aria-describedby={describedBy}
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
  const t = useCollabText();
  const isEs = useLanguageCode() === "ES";
  const [draft, setDraft] = useState<TableTalkEpisode>(
    () => episode ?? emptyEpisode(nextOrder),
  );
  const [videoName, setVideoName] = useState<string | null>(() =>
    youTubeEmbed(episode?.videoSrc)
      ? null
      : (episode?.videoSrc?.split("/").pop() ?? null),
  );
  /* Or a YouTube link, played inside NephroReach (client, 2026-10-06). */
  const [youTube, setYouTube] = useState(() =>
    youTubeEmbed(episode?.videoSrc) ? (episode?.videoSrc ?? "") : "",
  );
  const youTubeError =
    youTube.trim() && !youTubeEmbed(youTube)
      ? isEs
        ? "Ese no es un enlace de video de YouTube."
        : "That is not a YouTube video link."
      : undefined;
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [captionNote, setCaptionNote] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const set = (patch: Partial<TableTalkEpisode>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const error = episodeError(draft);

  /* Phase 12: uploading a video or a thumbnail waits on D18 (a public
     storage host for content media) and INT-16 (videos over 10 MB). The
     two upload buttons are disabled, with a note; a YouTube link works, and
     an episode keeps the media it already has. A made-up path is never
     sent. */
  const noUpload = () => {};

  const pickCaptions = async (file: File, lang: "en" | "es") => {
    const text = await file.text();
    const cues = parseCaptions(text);

    if (cues.length === 0) {
      setCaptionNote(
        isEs
          ? "No se encontraron líneas de subtítulos. Se espera un archivo .vtt o .srt."
          : "No caption lines found. Expecting a .vtt or .srt file.",
      );
      return;
    }

    setCaptionNote(
      isEs
        ? `${file.name} — ${cues.length} líneas de subtítulos leídas para ${lang.toUpperCase()}.`
        : `${file.name} — ${cues.length} caption lines read for ${lang.toUpperCase()}.`,
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
      title={
        episode
          ? isEs
            ? "Editar episodio"
            : "Edit episode"
          : isEs
            ? "Agregar un episodio"
            : "Add an episode"
      }
      description={
        isEs
          ? "Los miembros encuentran los episodios buscando y filtrando, así que la descripción y las categorías importan tanto como el video."
          : "Members find episodes by searching and filtering, so the description and categories matter as much as the video."
      }
      footer={
        <div className="flex flex-wrap items-center justify-end gap-inline-md">
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving
              ? isEs
                ? "Guardando…"
                : "Saving…"
              : episode
                ? isEs
                  ? "Guardar cambios"
                  : "Save changes"
                : isEs
                  ? "Agregar episodio"
                  : "Add episode"}
          </Button>
        </div>
      }
    >
      <div className="space-y-stack-lg">
        {/* ---------------------------------------------------- the video */}
        <section className="space-y-stack-md">
          <h3 className="text-heading-4 text-fg">Video</h3>

          <div className="flex flex-wrap items-center gap-inline-md">
            <FileButton
              label={
                videoName
                  ? isEs
                    ? "Reemplazar video"
                    : "Replace video"
                  : isEs
                    ? "Subir video"
                    : "Upload video"
              }
              accept="video/*"
              onPick={noUpload}
              disabled
              describedBy="episode-media-note"
            />
            <FileButton
              label={isEs ? "Subir miniatura" : "Upload thumbnail"}
              accept="image/*"
              onPick={noUpload}
              disabled
              describedBy="episode-media-note"
            />
            {draft.durationSeconds ? (
              <span className="text-body-sm text-fg-muted">
                {isEs ? "Duración" : "Runtime"}{" "}
                {formatDuration(draft.durationSeconds)}
              </span>
            ) : null}
          </div>

          <p id="episode-media-note" className="text-caption text-fg-muted">
            {t("tableTalk.mediaNote")}
          </p>

          <FormField
            label={
              isEs ? "O pegue un enlace de YouTube" : "Or paste a YouTube link"
            }
            hint={
              isEs
                ? "El video se reproduce dentro de NephroReach; los miembros no salen del sitio."
                : "The video plays inside NephroReach; members don't leave the site."
            }
            error={youTubeError}
          >
            {(field) => (
              <Input
                {...field}
                type="url"
                value={youTube}
                placeholder="https://www.youtube.com/watch?v=…"
                onChange={(e) => {
                  const next = e.target.value;
                  setYouTube(next);
                  if (youTubeEmbed(next)) {
                    setVideoName(null);
                    setVideoPreview(null);
                    set({ videoSrc: next.trim() });
                  } else if (youTubeEmbed(draft.videoSrc)) {
                    set({ videoSrc: undefined });
                  }
                }}
              />
            )}
          </FormField>
          {youTubeEmbed(youTube) ? (
            <iframe
              src={youTubeEmbed(youTube)!}
              title={isEs ? "Vista previa de YouTube" : "YouTube preview"}
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full rounded-control bg-surface-inverse"
            />
          ) : null}

          <Picked name={videoName} />

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
              {isEs
                ? "Un episodio necesita un archivo de video antes de llegar a los miembros. Puede guardarlo como borrador sin él."
                : "An episode needs a video file before it can reach members. You can save it as a draft without one."}
            </Alert>
          ) : null}
        </section>

        {/* ---------------------------------------------------- the words */}
        <section className="space-y-stack-md border-t border-line pt-inset-md">
          <h3 className="text-heading-4 text-fg">
            {isEs ? "Título y descripción" : "Title and description"}
          </h3>

          <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
            <FormField
              label={isEs ? "Título (inglés)" : "Title (English)"}
              required
              hint={
                isEs
                  ? "También se convierte en la dirección de la página."
                  : "Also becomes the page address."
              }
              error={
                touched && error === "title"
                  ? isEs
                    ? "El título es obligatorio."
                    : "A title is required."
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

            <FormField
              label={isEs ? "Título (español)" : "Title (Spanish)"}
              optionalLabel={isEs ? "opcional" : "optional"}
            >
              {(props) => (
                <Input
                  {...props}
                  value={draft.titleEs}
                  onChange={(event) => set({ titleEs: event.target.value })}
                />
              )}
            </FormField>

            <FormField
              label={isEs ? "Descripción (inglés)" : "Description (English)"}
            >
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

            <FormField
              label={isEs ? "Descripción (español)" : "Description (Spanish)"}
              optionalLabel={isEs ? "opcional" : "optional"}
            >
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
            <h3 className="text-heading-4 text-fg">
              {isEs ? "Presentadores" : "Speakers"}
            </h3>
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
              {isEs ? "Agregar presentador" : "Add speaker"}
            </Button>
          </div>

          {draft.speakers.length === 0 ? (
            <p className="text-body-sm text-fg-muted">
              {isEs
                ? "Agregue al anfitrión y a los invitados. Su función aparece debajo del título."
                : "Add the host and any guests. Their role shows under the title."}
            </p>
          ) : (
            <div className="space-y-stack-sm">
              {draft.speakers.map((speaker, index) => (
                <div
                  key={speaker.id}
                  className="flex flex-wrap items-end gap-inline-md"
                >
                  <FormField
                    label={isEs ? `Nombre ${index + 1}` : `Name ${index + 1}`}
                    className="flex-1"
                  >
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
                  <FormField
                    label={
                      isEs ? "Función o credenciales" : "Role or credentials"
                    }
                    className="flex-1"
                  >
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
                        placeholder={isEs ? "Nefrólogo" : "Nephrologist"}
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
                    aria-label={
                      isEs
                        ? `Quitar presentador ${index + 1}`
                        : `Remove speaker ${index + 1}`
                    }
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
          <h3 className="text-heading-4 text-fg">
            {isEs ? "Temas y público" : "Topics and audience"}
          </h3>

          <FormField
            label={isEs ? "Temas" : "Topics"}
            hint={
              isEs
                ? "Elija todos los que correspondan. Son los filtros que usan los miembros para explorar."
                : "Pick as many as fit. These are the filters members browse by."
            }
          >
            {() => (
              <ChipGroup label={isEs ? "Temas" : "Topics"} selection="multiple">
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    selected={draft.categoryIds.includes(category.id)}
                    onClick={() => toggleCategory(category.id)}
                  >
                    {isEs
                      ? category.labelEs || category.labelEn
                      : category.labelEn}
                  </Chip>
                ))}
              </ChipGroup>
            )}
          </FormField>

          <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
            <FormField label={isEs ? "Para quién es" : "Who it is for"}>
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
                      {isEs ? option.labelEs : option.labelEn}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
          </div>

          <SwitchRow
            checked={draft.isLiveEvent}
            onChange={(checked) => set({ isLiveEvent: checked })}
            title={isEs ? "Este es un evento en vivo" : "This is a live event"}
            description={
              isEs
                ? "Aparece en el filtro Eventos en vivo."
                : "Shows under the Live Events filter."
            }
          />
          <SwitchRow
            checked={draft.isShort}
            onChange={(checked) => set({ isShort: checked })}
            title={isEs ? "Video corto" : "Short video"}
            description={
              isEs
                ? "Se activa automáticamente para todo lo que dure menos de tres minutos."
                : "Set automatically for anything under three minutes."
            }
          />
        </section>

        {/* ----------------------------------- captions and the transcript */}
        <section className="space-y-stack-md border-t border-line pt-inset-md">
          <h3 className="text-heading-4 text-fg">
            {isEs ? "Subtítulos y transcripción" : "Captions and transcript"}
          </h3>

          <div className="flex flex-wrap items-center gap-inline-md">
            <FileButton
              label={
                draft.captions.en
                  ? isEs
                    ? "Reemplazar subtítulos en inglés"
                    : "Replace English captions"
                  : isEs
                    ? "Subtítulos en inglés"
                    : "English captions"
              }
              accept=".vtt,.srt,text/vtt"
              onPick={(file) => void pickCaptions(file, "en")}
            />
            <FileButton
              label={
                draft.captions.es
                  ? isEs
                    ? "Reemplazar subtítulos en español"
                    : "Replace Spanish captions"
                  : isEs
                    ? "Subtítulos en español"
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
            <FormField
              label={isEs ? "Transcripción (inglés)" : "Transcript (English)"}
              optionalLabel={isEs ? "opcional" : "optional"}
            >
              {(props) => (
                <Textarea
                  {...props}
                  rows={5}
                  value={draft.transcriptEn ?? ""}
                  onChange={(event) =>
                    set({ transcriptEn: event.target.value || undefined })
                  }
                  placeholder={
                    isEs
                      ? "Pegue la transcripción. Deje una línea en blanco entre párrafos."
                      : "Paste the transcript. Leave a blank line between paragraphs."
                  }
                />
              )}
            </FormField>
            <FormField
              label={isEs ? "Transcripción (español)" : "Transcript (Spanish)"}
              optionalLabel={isEs ? "opcional" : "optional"}
            >
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
          <h3 className="text-heading-4 text-fg">
            {isEs ? "Publicación" : "Publishing"}
          </h3>

          <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
            <FormField label={isEs ? "Estado" : "Status"}>
              {(props) => (
                <Select
                  {...props}
                  value={draft.status}
                  onChange={(event) =>
                    set({ status: event.target.value as EpisodeStatus })
                  }
                >
                  <option value="draft">
                    {isEs
                      ? "Borrador — solo administradores"
                      : "Draft — admins only"}
                  </option>
                  <option value="scheduled">
                    {isEs
                      ? "Programado — se publica en una fecha"
                      : "Scheduled — goes live on a date"}
                  </option>
                  <option value="published">
                    {isEs
                      ? "Publicado — visible ahora"
                      : "Published — live now"}
                  </option>
                  <option value="archived">
                    {isEs ? "Archivado — oculto" : "Archived — hidden"}
                  </option>
                </Select>
              )}
            </FormField>

            {draft.status === "scheduled" ? (
              <FormField
                label={isEs ? "Se publica el" : "Goes live on"}
                required
                error={
                  touched && error === "publish-at"
                    ? isEs
                      ? "Elija la fecha en que debe aparecer."
                      : "Pick the date it should appear."
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
            title={isEs ? "Destacar este episodio" : "Feature this episode"}
            description={
              isEs
                ? "Lo coloca al principio de Table Talk. Solo un episodio puede estar destacado, así que este reemplaza al actual."
                : "Puts it at the top of Table Talk. Only one episode can be featured, so this replaces the current one."
            }
          />
        </section>
      </div>
    </Modal>
  );
}

export default EpisodeEditor;
