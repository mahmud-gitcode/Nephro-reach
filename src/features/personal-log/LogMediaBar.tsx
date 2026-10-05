"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, Check, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui";
import { useAccessPhotos } from "./dialysis/useAccessPhotos";

/* ==========================================================================
   Camera and voice on every log
   --------------------------------------------------------------------------
   The client (2026-10-05): camera and voice were missing from all logs.
   One bar under a log's notes:

     Dictate     speech to text into the notes, through the browser's own
                 speech recognition (Chrome, Edge, Safari). Hidden where the
                 browser has none, rather than a button that does nothing.
     Take photo  the camera on a phone, a file picker elsewhere. The photo
                 is shrunk like every photo in the app and kept in the
                 member's Photos log, labelled with the log it came from.
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
}: {
  /** Labels the photo in the Photos log, e.g. "Blood pressure log". */
  logName: string;
  /** Receives each finished phrase, to add to the notes. */
  onDictated: (text: string) => void;
  isEs: boolean;
}) {
  const photos = useAccessPhotos();
  const [canDictate, setCanDictate] = useState(false);
  const [listening, setListening] = useState(false);
  const [saved, setSaved] = useState(false);
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
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          photos.add(file, "other", logName);
          setSaved(true);
        }}
      />
      <Button
        type="button"
        size="small"
        variant="neutral"
        appearance="fill-stroke"
        loading={photos.isAdding}
        leadingIcon={<Camera aria-hidden="true" />}
        onClick={() => {
          setSaved(false);
          fileInput.current?.click();
        }}
      >
        {isEs ? "Tomar foto" : "Take photo"}
      </Button>
      {saved && !photos.isAdding && !photos.encodeError && !photos.saveError ? (
        <span
          role="status"
          className="inline-flex items-center gap-inline-xs text-caption text-success"
        >
          <Check aria-hidden="true" className="size-4" />
          {isEs ? "Guardada en sus Fotos" : "Saved to your Photos"}
        </span>
      ) : null}
      {photos.encodeError || photos.saveError ? (
        <span role="alert" className="text-caption text-danger">
          {isEs
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
