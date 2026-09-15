"use client";

import React, { useEffect, useRef, useState } from "react";
import { Video, Upload, CheckCircle2 } from "lucide-react";
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
import { useTestimonials } from "./useTestimonials";
import type { Testimonial } from "./testimonials.types";

interface SubmitTestimonialModalProps {
  open: boolean;
  onClose: () => void;
  user?: {
    name?: string;
    email?: string;
  } | null;
  onSubmitted?: () => void;
  /** An existing submission being revised. Omit to take a new one. */
  editing?: Testimonial | null;
}

export default function SubmitTestimonialModal({
  open,
  onClose,
  user,
  onSubmitted,
  editing,
}: SubmitTestimonialModalProps) {
  const [memberName, setMemberName] = useState(
    editing?.memberName || user?.name || "Charles Xavier",
  );
  const [role, setRole] = useState(editing?.role || "Dialysis Member");
  const [title, setTitle] = useState(
    editing?.title || "From Fear to Hope: My Dialysis Journey",
  );
  const [videoUrl, setVideoUrl] = useState(editing?.videoUrl || "");
  /* The file the member chose this sitting, previewed from an object URL.
     An edit opens with the filename it was saved under and no preview,
     because the bytes are not in the browser any more. */
  const [videoName, setVideoName] = useState<string | null>(
    () => editing?.videoUrl?.split("/").pop() ?? null,
  );
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

  /** Big enough to be a real recording, small enough to be a phone clip. */
  const MAX_MB = 200;

  const pickVideo = (file: File) => {
    if (!file.type.startsWith("video/")) {
      setVideoError("That is not a video file. Choose an MP4 or MOV.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setVideoError(
        `That file is ${Math.round(file.size / 1024 / 1024)} MB. The limit is ${MAX_MB} MB.`,
      );
      return;
    }

    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);
    setVideoError(null);
    setVideoPreview(url);
    setVideoName(file.name);
    setVideoUrl(`/videos/testimonials/${file.name}`);

    /* Reading the real length means the runtime shown on the card is the
       file's, not a fixed "3:30". */
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const seconds = probe.duration;
      if (Number.isFinite(seconds) && seconds > 0) {
        const minutes = Math.floor(seconds / 60);
        const rest = Math.round(seconds % 60);
        setDuration(`${minutes}:${String(rest).padStart(2, "0")}`);
      }
    };
    probe.src = url;
  };
  const [summary, setSummary] = useState(editing?.summary || "");
  const [duration, setDuration] = useState(editing?.duration || "");
  const [submitted, setSubmitted] = useState(false);
  const { submit, revise, isSaving, saveError } = useTestimonials();

  const roles = [
    { key: "Dialysis Member", label: "Dialysis Member" },
    { key: "Family Caregiver", label: "Family Caregiver" },
    { key: "CKD Learner", label: "CKD Learner" },
    { key: "Transplant Warrior", label: "Transplant Warrior" },
  ];

  /* "Thank You for Sharing!" is shown only once the submission is stored.
     The old order showed it first and then tried to save, so a member could
     be thanked for a video nobody would ever receive. */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim() || !summary.trim() || isSaving) return;

    if (editing) {
      void revise(editing.id, {
        title: title.trim(),
        role,
        videoUrl: videoUrl.trim(),
        summary: summary.trim(),
      })
        .then(() => {
          onSubmitted?.();
          onClose();
        })
        .catch(() => {});
      return;
    }

    void submit({
      memberName: memberName.trim() || "Member",
      memberEmail: user?.email || "user@nephroreach.com",
      title: title.trim() || "From Fear to Hope: My Dialysis Journey",
      role,
      videoUrl: videoUrl.trim(),
      summary: summary.trim(),
      duration: duration || undefined,
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
        editing ? "Edit your story" : "Submit 'From Fear to Hope' Testimonial"
      }
      description={
        editing
          ? "Your story is still waiting on review, so you can change it. It stays in the queue."
          : "Share your video journey to inspire others. Admin will review and approve your submission before publishing."
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!videoUrl.trim() || !summary.trim() || submitted}
            loading={isSaving}
            leadingIcon={<Video className="size-4" />}
          >
            {submitted
              ? "Submitted"
              : editing
                ? "Save changes"
                : "Submit for Admin Review"}
          </Button>
        </>
      }
    >
      {saveError ? (
        <Alert tone="danger" title="Your testimonial was not sent">
          {saveError instanceof Error ? saveError.message : "Please try again."}
        </Alert>
      ) : null}

      {submitted ? (
        <div className="space-y-3 py-8 text-center">
          <div className="bg-success-soft text-success-fg mx-auto flex size-14 items-center justify-center rounded-full">
            <CheckCircle2 className="size-8" />
          </div>
          <h3 className="text-heading-4 text-fg">Thank You for Sharing!</h3>
          <p className="mx-auto max-w-md text-body-md text-fg-muted">
            Your video testimonial has been submitted to the admin team for
            review. Once approved, it will be published in the &ldquo;From Fear
            to Hope&rdquo; community section.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alert draws its own icon; the second one inside it was a
              duplicate. */}
          <Alert tone="info" className="text-body-sm">
            Video testimonials are reviewed by the NephroReach team before they
            are published, to protect community privacy and keep the quality up.
          </Alert>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Your Name">
              {(props) => (
                <Input
                  {...props}
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              )}
            </FormField>

            <FormField label="Story Title">
              {(props) => (
                <Input
                  {...props}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="From Fear to Hope: My Journey"
                  required
                />
              )}
            </FormField>
          </div>

          <div>
            <p className="mb-1.5 block text-label-md font-medium text-fg">
              Your Perspective / Role
            </p>
            <ChipGroup label="Select your role">
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
          </div>

          <FormField
            label="Your video"
            required
            hint="An MP4 or MOV from your phone or computer, up to 200 MB."
            error={videoError ?? undefined}
          >
            {() => (
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*"
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
                      ? "Choose a different video"
                      : "Upload your video"}
                  </span>
                  <span className="text-body-sm text-fg-muted">
                    We read the length from the file
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

          <FormField label="Describe Your Journey (From Fear to Hope)">
            {(props) => (
              <Textarea
                {...props}
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="What challenges did you face? How did you find hope, strength, and confidence on your journey?"
                required
              />
            )}
          </FormField>
        </form>
      )}
    </Modal>
  );
}
