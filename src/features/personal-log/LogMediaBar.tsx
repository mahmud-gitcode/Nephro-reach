"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, Check, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui";
import { checkUpload } from "@/lib/api/upload";
import { isNotShared } from "@/lib/data/asyncState";
import { useAccessPhotos } from "./dialysis/useAccessPhotos";
import { useCaregiverView } from "@/features/caregivers/useCaregivers";
import { areaLevel } from "@/features/caregivers/caregivers.mapping";

/* ==========================================================================
   Camera and voice on every log
   --------------------------------------------------------------------------
   The client (2026-10-05): camera and voice were missing from all logs.
   One bar under a log's notes:

     Dictate     speech to text into the notes, through the browser's own
                 speech recognition (Chrome, Edge, Safari). Hidden where the
                 browser has none, rather than a button that does nothing.
     Take photo  the camera on a phone, a file picker elsewhere. With
                 `onPhotoFile` (logs on the API, Phase 5) the picked File
                 is handed over as is: the entry uploads it through
                 `/files` and keeps only its id; the preview is an
                 in-memory blob URL, never stored. Without it, it goes to
                 the member's Photos (access photos, uploaded by file id
                 since Phase 7), labelled with the log it came from. No
                 photo is ever kept as a data: URL.
   ========================================================================== */

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function LogMediaBar({
  logName,
  onDictated,
  isEs,
  onPhotoFile,
  hasPhoto = false,
  photoPreview = null,
}: {
  /** Labels the photo in the Photos log, e.g. "Blood pressure log". */
  logName: string;
  /** Receives each finished phrase, to add to the notes. */
  onDictated: (text: string) => void;
  isEs: boolean;
  /** Attach the picked file to the entry (it uploads it); null removes. */
  onPhotoFile?: (file: File | null) => void;
  /** With `onPhotoFile`: whether the entry has a photo (saved or picked). */
  hasPhoto?: boolean;
  /** With `onPhotoFile`: an in-memory preview of a newly picked photo. */
  photoPreview?: string | null;
}) {
  /* The bar only adds photos, it never lists them: no list read (a
     caregiver without the dialysis area got a refused read on every log
     page, P16b QA round 2). */
  const photos = useAccessPhotos(undefined, { list: false });
  /* A caregiver whose grant has no dialysis edit cannot save to the
     member's Photos: the server refuses the record. Say so before the
     picture is uploaded, so no unattached copy of it (an access site may
     be PHI) is left in storage. The server still decides every save. */
  const { grant } = useCaregiverView();
  const mayAddPhoto = grant
    ? areaLevel(grant.permissions, "dialysis") >= 2
    : true;
  const [noPermission, setNoPermission] = useState(false);
  const [canDictate, setCanDictate] = useState(false);
  const [listening, setListening] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attachError, setAttachError] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  /* Known only in the browser, so read after mounting. */
  useEffect(() => {
    const supported = recognitionCtor() !== null;
    queueMicrotask(() => setCanDictate(supported));
    return () => recognition.current?.stop();
  }, []);

  function toggleDictation() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = isEs ? "es-US" : "en-US";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (text) onDictated(text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recognition.current = r;
    setListening(true);
    r.start();
  }

  return (
    <div className="flex flex-wrap items-center gap-inline-sm">
      {canDictate ? (
        <Button
          type="button"
          size="small"
          variant="neutral"
          appearance={listening ? "fill" : "fill-stroke"}
          aria-pressed={listening}
          leadingIcon={
            listening ? (
              <MicOff aria-hidden="true" />
            ) : (
              <Mic aria-hidden="true" />
            )
          }
          onClick={toggleDictation}
        >
          {listening
            ? isEs
              ? "Detener dictado"
              : "Stop dictating"
            : isEs
              ? "Dictar"
              : "Dictate"}
        </Button>
      ) : null}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (onPhotoFile) {
            /* The server's allowlist and size cap, checked before upload. */
            const refused = checkUpload(file);
            setAttachError(refused !== null);
            if (!refused) onPhotoFile(file);
            return;
          }
          if (!mayAddPhoto) {
            setNoPermission(true);
            return;
          }
          /* Uploaded to the member's Photos (by file id, Phase 7). */
          void photos.add(file, "other", logName);
          setSaved(true);
        }}
      />
      {onPhotoFile && hasPhoto ? (
        <span className="inline-flex items-center gap-inline-xs">
          {photoPreview ? (
            /* eslint-disable-next-line @next/next/no-img-element -- an in-memory blob preview, nothing to optimise */
            <img
              src={photoPreview}
              alt={isEs ? "Foto de esta entrada" : "Photo on this entry"}
              className="h-10 w-10 rounded-control object-cover"
            />
          ) : (
            <span className="text-caption text-fg-muted">
              {isEs ? "Foto adjunta" : "Photo attached"}
            </span>
          )}
          <Button
            type="button"
            size="small"
            variant="neutral"
            appearance="ghost"
            onClick={() => onPhotoFile(null)}
          >
            {isEs ? "Quitar foto" : "Remove photo"}
          </Button>
        </span>
      ) : null}
      <Button
        type="button"
        size="small"
        variant="neutral"
        appearance="fill-stroke"
        loading={onPhotoFile ? false : photos.isAdding}
        leadingIcon={<Camera aria-hidden="true" />}
        onClick={() => {
          setSaved(false);
          setNoPermission(false);
          fileInput.current?.click();
        }}
      >
        {onPhotoFile && hasPhoto
          ? isEs
            ? "Cambiar foto"
            : "Change photo"
          : isEs
            ? "Tomar foto"
            : "Take photo"}
      </Button>
      {attachError ? (
        <span role="alert" className="text-caption text-danger">
          {isEs ? "No se pudo usar la foto." : "That photo could not be used."}
        </span>
      ) : null}
      {!onPhotoFile &&
      saved &&
      !photos.isAdding &&
      !photos.encodeError &&
      !photos.saveError ? (
        <span
          role="status"
          className="inline-flex items-center gap-inline-xs text-caption text-success"
        >
          <Check aria-hidden="true" className="size-4" />
          {isEs ? "Guardada en sus Fotos" : "Saved to your Photos"}
        </span>
      ) : null}
      {noPermission || photos.encodeError || photos.saveError ? (
        <span role="alert" className="text-caption text-danger">
          {/* A refusal (403: photos not shared with a caregiver) says so;
              anything else is a plain failure. */}
          {noPermission || isNotShared(photos.saveError)
            ? isEs
              ? "No tiene permiso para guardar fotos aquí."
              : "You don't have permission to save photos here."
            : isEs
              ? "No se pudo guardar la foto."
              : "The photo could not be saved."}
        </span>
      ) : null}
      {listening ? (
        <span role="status" className="text-caption text-fg-muted">
          {isEs ? "Escuchando…" : "Listening…"}
        </span>
      ) : null}
    </div>
  );
}

/** Adds a dictated phrase to existing notes with a space between. */
export function appendText(current: string, text: string): string {
  return current.trim() ? `${current.trimEnd()} ${text}` : text;
}
