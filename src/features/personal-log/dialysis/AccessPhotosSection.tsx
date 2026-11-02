"use client";

import React, { useRef, useState } from "react";
import { Camera, Trash2, Upload } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  SectionTitle,
  Select,
  Skeleton,
} from "@/components/ui";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { saveErrorText } from "@/features/profile/saveError";
import { uploadErrorMessage } from "@/lib/api/upload";
import { useAccessPhotos } from "./useAccessPhotos";
import { AccessPhotoImage } from "./AccessPhotoImage";
import {
  PHOTO_SUBJECTS,
  fileError,
  subjectLabel,
  type PhotoSubject,
} from "./accessPhotos";
import { dialysisText } from "./dialysisText";

/* ==========================================================================
   Access / site / equipment photos
   --------------------------------------------------------------------------
   A member cannot show a nurse a red exit site down the phone, so they
   photograph it and it goes to the care team with the message.

   Every picture is shrunk, uploaded through /files and kept on the server
   by file id (Phase 7); each one opens through a short-lived link. Nothing
   about it stays in this browser.
   ========================================================================== */

export default function AccessPhotosSection() {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const log = useAccessPhotos();
  const fileRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState<PhotoSubject>("access");
  const [note, setNote] = useState("");
  const [pickError, setPickError] = useState<string | null>(null);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Clear the input either way, or picking the same file twice is silent.
    event.target.value = "";
    if (!file) return;

    const problem = fileError(file, isEs);
    setPickError(problem);
    if (problem) return;

    void log.add(file, subject, note.trim());
    setNote("");
  };

  return (
    <Card as="section" padding="small">
      <SectionTitle
        title={isEs ? "Fotos" : "Photos"}
        action={
          <Badge tone="neutral" variant="soft">
            {log.photos.length}
          </Badge>
        }
      />

      <div className="mb-stack-md flex flex-wrap items-end gap-inline-md">
        <div className="space-y-1.5">
          <label
            htmlFor="photo-subject"
            className="block text-label-md text-fg-secondary"
          >
            {isEs ? "Qué es" : "What it shows"}
          </label>
          <Select
            id="photo-subject"
            selectSize="small"
            className="w-auto"
            value={subject}
            onChange={(event) => setSubject(event.target.value as PhotoSubject)}
          >
            {PHOTO_SUBJECTS.map((option) => (
              <option key={option.value} value={option.value}>
                {isEs ? option.labelEs : option.labelEn}
              </option>
            ))}
          </Select>
        </div>

        <div className="min-w-40 flex-1 space-y-1.5">
          <label
            htmlFor="photo-note"
            className="block text-label-md text-fg-secondary"
          >
            {isEs ? "Nota" : "Note"}
          </label>
          <Input
            id="photo-note"
            inputSize="small"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={isEs ? "Rojo desde ayer" : "Red since yesterday"}
          />
        </div>

        <Button
          size="small"
          onClick={() => fileRef.current?.click()}
          disabled={log.isAdding}
        >
          <Upload />
          <span>{isEs ? "Subir foto" : "Upload photo"}</span>
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {pickError ? (
        <Alert tone="warning" className="mb-stack-md">
          {pickError}
        </Alert>
      ) : null}

      {log.encodeError ? (
        <Alert
          tone="danger"
          className="mb-stack-md"
          onDismiss={log.dismissErrors}
        >
          {isEs
            ? dialysisText(isEs, "accessPhotos.uploadFailed")
            : uploadErrorMessage(log.encodeError)}
        </Alert>
      ) : null}

      {log.saveError ? (
        <Alert
          tone="danger"
          className="mb-stack-md"
          onDismiss={log.dismissErrors}
        >
          {saveErrorText(log.saveError, isEs ? "es" : "en")}
        </Alert>
      ) : null}

      <AsyncSection
        pending={log.isPending}
        error={log.error}
        onRetry={canRetry(log.error) ? log.refetch : undefined}
        errorTitle={errorTitleFor(
          log.error,
          dialysisText(isEs, "accessPhotos.loadFailed"),
          isEs ? "es" : "en",
        )}
        errorMessage={errorMessageFor(log.error, undefined, isEs ? "es" : "en")}
        skeleton={<Skeleton height={120} />}
      >
        {log.photos.length === 0 ? (
          <EmptyState
            title={isEs ? "Sin fotos" : "No photos yet"}
            description={
              isEs
                ? "Sube una foto si algo se ve mal en tu acceso o tu equipo."
                : "Upload a photo if something looks wrong with your access or equipment."
            }
          />
        ) : (
          <ul className="grid grid-cols-2 gap-inline-md sm:grid-cols-3 lg:grid-cols-4">
            {log.photos.map((photo) => (
              <li
                key={photo.id}
                className="overflow-hidden rounded-control border border-line bg-surface"
              >
                <div className="relative aspect-square w-full bg-surface-sunken">
                  <AccessPhotoImage
                    photoId={photo.id}
                    alt={`${subjectLabel(photo.subject, isEs)}${photo.note ? ` — ${photo.note}` : ""}`}
                    className="absolute inset-0"
                  />
                </div>

                <div className="space-y-1 p-inset-xs">
                  <span className="flex items-center gap-inline-xs text-body-sm font-semibold text-fg">
                    <Camera aria-hidden="true" className="h-3.5 w-3.5" />
                    {subjectLabel(photo.subject, isEs)}
                  </span>
                  {photo.note ? (
                    <span className="block truncate text-body-sm text-fg-muted">
                      {photo.note}
                    </span>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => log.remove(photo.id)}
                    aria-label={`${isEs ? "Eliminar foto" : "Delete photo"} — ${subjectLabel(photo.subject, isEs)}`}
                    className="inline-flex cursor-pointer items-center gap-inline-xs rounded-control p-1 text-body-sm text-fg-muted transition-colors hover:bg-danger-surface hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {isEs ? "Eliminar" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AsyncSection>
    </Card>
  );
}
