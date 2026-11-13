"use client";

import React, { useEffect, useRef, useState } from "react";
import { Video, Upload, CheckCircle2 } from "lucide-react";
import { uploadErrorMessage } from "@/lib/api/upload";
import {
  Modal,
  Button,
  FormField,
  Input,
  Textarea,
  Alert,
  Chip,
  ChipGroup,
} from "@/components/ui";
import {
  MAX_TESTIMONIAL_MB,
  MAX_TESTIMONIAL_SECONDS,
  formatClock,
  toDurationSeconds,
  videoFileError,
  videoLengthError,
} from "./testimonials.rules";
import { useSubmitTestimonial } from "./useTestimonials";
import { useLanguageCode } from "@/context/LanguageContext";
import { collabText } from "@/features/community/collabText";

interface SubmitTestimonialModalProps {
  open: boolean;
  onClose: () => void;
  /** Shown read-only: the server takes the author from the signed-in
   *  account, never from this form. */
  user?: {
    name?: string;
  } | null;
  onSubmitted?: () => void;
}

/* Phase 12: the video is uploaded through /files (PRIVATE, 10 MB, the API's
   cap until a per-purpose limit is decided: INT-16/D18), then the story is
   sent with its file id and the length the browser measured. There is no
   API route to edit or delete a story yet, so this form only takes a new
   one. */
export default function SubmitTestimonialModal({
  open,
  onClose,
  user,
  onSubmitted,
}: SubmitTestimonialModalProps) {
  const language = useLanguageCode();
  const isEs = language === "ES";
  const memberName = user?.name ?? "";
  /* A role outside the four is "Other", typed in (client, 2026-10-12). */
  const [role, setRole] = useState("Dialysis Member");
  const [otherRole, setOtherRole] = useState("");
  const [title, setTitle] = useState("From Fear to Hope: My Dialysis Journey");
  /* The file the member chose this sitting, previewed from an object URL.
     Only the file goes to the server (through /files), never the URL. */
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [seconds, setSeconds] = useState<number | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<string[]>([]);

  /* Object URLs live until revoked; re-picking a few files in one sitting
     would otherwise leak every one. */
  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  /** Drops a picked video, so a rejected one cannot be submitted. */
  const clearVideo = (message: string) => {
    setVideoError(message);
    setVideoPreview(null);
    setVideoName(null);
    setVideoFile(null);
    setDuration("");
    setSeconds(null);
  };

  const pickVideo = (file: File) => {
    const refused = videoFileError(file, language);
    if (refused) {
      clearVideo(refused);
      return;
    }

    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);
    setVideoError(null);
    setVideoPreview(url);
    setVideoName(file.name);
    setVideoFile(file);

    /* Reading the real length means the runtime shown on the card is the
       file's, not a fixed "3:30" — and it is the only way to enforce the
       time limit, since megabytes do not tell you how long a clip runs. */
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const seconds = probe.duration;
      const tooLong = videoLengthError(seconds, isEs);

      /* The check lands after the file is already showing, because reading
         metadata is asynchronous. Clearing it here is what stops a member
         submitting a clip they were briefly told was accepted. */
      if (tooLong) {
        clearVideo(tooLong);
        return;
      }
      if (Number.isFinite(seconds) && seconds > 0) {
        setDuration(formatClock(seconds));
        setSeconds(seconds);
      }
    };
    probe.src = url;
  };
  const [summary, setSummary] = useState("");
  const [duration, setDuration] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submit = useSubmitTestimonial();
  const isSaving = submit.isPending;
  const saveError = submit.error;

  const roles = [
    {
      key: "Dialysis Member",
      label: isEs ? "Miembro en Diálisis" : "Dialysis Member",
    },
    {
      key: "Family Caregiver",
      label: isEs ? "Cuidador Familiar" : "Family Caregiver",
    },
    { key: "CKD Learner", label: isEs ? "Estudiante de ERC" : "CKD Learner" },
    {
      key: "Transplant Warrior",
      label: isEs ? "Guerrero del Trasplante" : "Transplant Warrior",
    },
    { key: "Other", label: isEs ? "Otro" : "Other" },
  ];

  /* "Thank You for Sharing!" is shown only once the submission is stored.
     The old order showed it first and then tried to save, so a member could
     be thanked for a video nobody would ever receive. */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !summary.trim() || isSaving) return;

    void submit
      .mutateAsync({
        title: title.trim() || "From Fear to Hope: My Dialysis Journey",
        role,
        otherRole: role === "Other" ? otherRole : undefined,
        video: videoFile,
        durationSeconds: toDurationSeconds(seconds),
        summary: summary.trim(),
      })
      .then(() => {
        setSubmitted(true);
        onSubmitted?.();
        setTimeout(() => {
          setSubmitted(false);
          setSummary("");
          onClose();
        }, 2200);
      })
      .catch(() => {});
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={
        isEs
          ? "Enviar testimonio 'Del Miedo a la Esperanza'"
          : "Submit 'From Fear to Hope' Testimonial"
      }
      description={
        isEs
          ? "Comparta su experiencia en video para inspirar a otros. El administrador revisará y aprobará su envío antes de publicarlo."
          : "Share your video journey to inspire others. Admin will review and approve your submission before publishing."
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!videoFile || !summary.trim() || submitted}
            loading={isSaving}
            leadingIcon={<Video className="size-4" />}
          >
            {submitted
              ? isEs
                ? "Enviado"
                : "Submitted"
              : isEs
                ? "Enviar para revisión del administrador"
                : "Submit for Admin Review"}
          </Button>
        </>
      }
    >
      {saveError ? (
        <Alert
          tone="danger"
          title={
            isEs ? "Su testimonio no se envió" : "Your testimonial was not sent"
          }
        >
          {uploadErrorMessage(saveError)}
        </Alert>
      ) : null}

      {submitted ? (
        <div className="space-y-3 py-8 text-center">
          <div className="bg-success-soft text-success-fg mx-auto flex size-14 items-center justify-center rounded-full">
            <CheckCircle2 className="size-8" />
          </div>
          <h3 className="text-heading-4 text-fg">
            {isEs ? "¡Gracias por compartir!" : "Thank You for Sharing!"}
          </h3>
          {isEs ? (
            <p className="mx-auto max-w-md text-body-md text-fg-muted">
              Su testimonio en video se envió al equipo de administración para
              su revisión. Una vez aprobado, se publicará en la sección
              comunitaria &ldquo;Del Miedo a la Esperanza&rdquo;.
            </p>
          ) : (
            <p className="mx-auto max-w-md text-body-md text-fg-muted">
              Your video testimonial has been submitted to the admin team for
              review. Once approved, it will be published in the &ldquo;From
              Fear to Hope&rdquo; community section.
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alert draws its own icon; the second one inside it was a
              duplicate. */}
          <Alert tone="info" className="text-body-sm">
            {isEs
              ? "El equipo de NephroReach revisa los testimonios en video antes de publicarlos, para proteger la privacidad de la comunidad y mantener la calidad."
              : "Video testimonials are reviewed by the NephroReach team before they are published, to protect community privacy and keep the quality up."}
          </Alert>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label={isEs ? "Su nombre" : "Your Name"}
              hint={collabText(language, "testimonials.nameHint")}
            >
              {(props) => <Input {...props} value={memberName} readOnly />}
            </FormField>

            <FormField label={isEs ? "Título de la historia" : "Story Title"}>
              {(props) => (
                <Input
                  {...props}
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    isEs
                      ? "Del Miedo a la Esperanza: Mi camino"
                      : "From Fear to Hope: My Journey"
                  }
                  required
                />
              )}
            </FormField>
          </div>

          <div>
            <p className="mb-1.5 block text-label-md font-medium text-fg">
              {isEs ? "Su perspectiva / función" : "Your Perspective / Role"}
            </p>
            <ChipGroup
              label={isEs ? "Seleccione su función" : "Select your role"}
            >
              {roles.map((r) => (
                <Chip
                  key={r.key}
                  selected={role === r.key}
                  onClick={() => setRole(r.key)}
                >
                  {r.label}
                </Chip>
              ))}
            </ChipGroup>
            {role === "Other" ? (
              <FormField
                label={isEs ? "Su función" : "Your role"}
                className="mt-stack-sm"
              >
                {(field) => (
                  <Input
                    {...field}
                    value={otherRole}
                    onChange={(e) => setOtherRole(e.target.value)}
                    placeholder={
                      isEs
                        ? "p. ej., donante de riñón, enfermero, amigo"
                        : "e.g. Kidney donor, nurse, friend"
                    }
                    maxLength={40}
                  />
                )}
              </FormField>
            ) : null}
          </div>

          <FormField
            label={isEs ? "Su video" : "Your video"}
            required
            hint={
              isEs
                ? `Un MP4 o MOV de su teléfono o computadora. Hasta ${formatClock(
                    MAX_TESTIMONIAL_SECONDS,
                  )} de duración y ${MAX_TESTIMONIAL_MB} MB.`
                : `An MP4 or MOV from your phone or computer. Up to ${formatClock(
                    MAX_TESTIMONIAL_SECONDS,
                  )} long and ${MAX_TESTIMONIAL_MB} MB.`
            }
            error={videoError ?? undefined}
          >
            {() => (
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) pickVideo(file);
                    /* Cleared so picking the same file twice still fires. */
                    event.target.value = "";
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-control border border-dashed border-line-strong px-inset-md py-inset-lg text-center transition-colors duration-150 ease-standard hover:border-primary-edge hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Upload
                    aria-hidden="true"
                    className="size-6 text-fg-subtle"
                  />
                  <span className="text-label-md text-fg-secondary">
                    {videoName
                      ? isEs
                        ? "Elegir otro video"
                        : "Choose a different video"
                      : isEs
                        ? "Subir su video"
                        : "Upload your video"}
                  </span>
                  {/* Said before recording, not after. A member who learns
                    the limit from an error has already made a video they
                    now have to make again. */}
                  <span className="text-body-sm text-fg-muted">
                    {isEs
                      ? `Hasta ${formatClock(MAX_TESTIMONIAL_SECONDS)}; tomamos la duración del archivo`
                      : `Up to ${formatClock(MAX_TESTIMONIAL_SECONDS)} — we read the length from the file`}
                  </span>
                </button>

                {videoName ? (
                  <p className="flex items-center gap-2 rounded-control bg-success-surface px-3 py-2 text-body-sm text-success">
                    <CheckCircle2
                      aria-hidden="true"
                      className="size-4 shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate">{videoName}</span>
                    {duration ? (
                      <span className="shrink-0 tabular-nums">{duration}</span>
                    ) : null}
                  </p>
                ) : null}

                {videoPreview ? (
                  <video
                    src={videoPreview}
                    controls
                    preload="metadata"
                    className="aspect-video w-full rounded-control bg-surface-inverse"
                  />
                ) : null}
              </div>
            )}
          </FormField>

          <FormField
            label={
              isEs
                ? "Describa su camino (Del Miedo a la Esperanza)"
                : "Describe Your Journey (From Fear to Hope)"
            }
          >
            {(props) => (
              <Textarea
                {...props}
                rows={3}
                maxLength={2000}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder={
                  isEs
                    ? "¿Qué desafíos enfrentó? ¿Cómo encontró esperanza, fuerza y confianza en su camino?"
                    : "What challenges did you face? How did you find hope, strength, and confidence on your journey?"
                }
                required
              />
            )}
          </FormField>
        </form>
      )}
    </Modal>
  );
}
