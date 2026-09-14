"use client";

import React from "react";
import { Clock, ShieldCheck } from "lucide-react";
import { Modal, Badge, Button } from "@/components/ui";
import { Testimonial } from "./testimonials";

interface VideoPlayerModalProps {
  testimonial: Testimonial | null;
  open: boolean;
  onClose: () => void;
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  // YouTube watch link or short link
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/,
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }
  // Vimeo link
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }
  return null;
}

export default function VideoPlayerModal({
  testimonial,
  open,
  onClose,
}: VideoPlayerModalProps) {
  if (!testimonial) return null;

  const embedUrl = getEmbedUrl(testimonial.videoUrl);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={testimonial.title}
      description={`${testimonial.memberName} • ${testimonial.role}`}
      footer={
        <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Video Player Box */}
        <div className="relative aspect-video w-full overflow-hidden rounded-panel bg-black shadow-raised">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={testimonial.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : (
            <div className="relative flex h-full w-full flex-col items-center justify-center bg-slate-900 p-6 text-center text-white">
              <video
                src={testimonial.videoUrl}
                controls
                autoPlay
                className="h-full w-full object-cover"
                poster={testimonial.thumbnailUrl}
              >
                Your browser does not support HTML video playback.
              </video>
            </div>
          )}
        </div>

        {/* Video Details & Reflection */}
        <div className="space-y-3 rounded-card border border-line-subtle bg-surface-sunken p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-pill bg-brand-50 text-caption font-semibold text-brand-700">
                {testimonial.memberName.charAt(0)}
              </span>
              <div>
                <p className="text-label-md font-semibold text-fg">
                  {testimonial.memberName}
                </p>
                <p className="text-caption text-fg-muted">{testimonial.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {testimonial.duration && (
                <span className="inline-flex items-center gap-1 rounded-control border border-line bg-surface px-2.5 py-1 text-caption text-fg-secondary">
                  <Clock className="size-3.5" />
                  {testimonial.duration}
                </span>
              )}
              <Badge tone="success" variant="soft" className="gap-1">
                <ShieldCheck className="size-3.5" />
                Verified Member Story
              </Badge>
            </div>
          </div>

          <p className="pt-1 text-body-sm leading-relaxed text-fg-secondary">
            &ldquo;{testimonial.summary}&rdquo;
          </p>
        </div>
      </div>
    </Modal>
  );
}
