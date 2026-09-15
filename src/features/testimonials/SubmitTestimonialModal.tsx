"use client";

import React, { useState } from "react";
import { Video, Info, CheckCircle2 } from "lucide-react";
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

interface SubmitTestimonialModalProps {
  open: boolean;
  onClose: () => void;
  user?: {
    name?: string;
    email?: string;
  } | null;
  onSubmitted?: () => void;
}

const SAMPLE_VIDEOS = [
  {
    label: "Demo Dialysis Journey (YouTube)",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    label: "Sample Reflection Video (MP4)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  },
];

export default function SubmitTestimonialModal({
  open,
  onClose,
  user,
  onSubmitted,
}: SubmitTestimonialModalProps) {
  const [memberName, setMemberName] = useState(user?.name || "Charles Xavier");
  const [role, setRole] = useState("Dialysis Member");
  const [title, setTitle] = useState("From Fear to Hope: My Dialysis Journey");
  const [videoUrl, setVideoUrl] = useState(SAMPLE_VIDEOS[0].url);
  const [summary, setSummary] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { submit, isSaving, saveError } = useTestimonials();

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

    void submit({
      memberName: memberName.trim() || "Member",
      memberEmail: user?.email || "user@nephroreach.com",
      title: title.trim() || "From Fear to Hope: My Dialysis Journey",
      role,
      videoUrl: videoUrl.trim(),
      summary: summary.trim(),
      duration: "3:30",
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
      title="Submit 'From Fear to Hope' Testimonial"
      description="Share your video journey to inspire others. Admin will review and approve your submission before publishing."
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
            {submitted ? "Submitted" : "Submit for Admin Review"}
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
          <Alert tone="info" className="text-body-sm">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
              <span>
                <strong>Admin Approval Process:</strong> Video testimonials are
                reviewed by our team (such as Joni) before being published to
                protect community privacy and ensure content quality.
              </span>
            </div>
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

          <FormField label="Video Link (YouTube, Vimeo, or Video URL)">
            {(props) => (
              <div className="space-y-2">
                <Input
                  {...props}
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                <div className="flex flex-wrap items-center gap-2 pt-1 text-caption text-fg-muted">
                  <span>Quick demo presets:</span>
                  {SAMPLE_VIDEOS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setVideoUrl(sample.url)}
                      className="underline transition-colors hover:text-brand-600"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
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
