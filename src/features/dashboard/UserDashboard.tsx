"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, Users, Video, Play, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import WheresMyRideModal from "@/features/travel/WheresMyRideModal";
import {
  AsyncSection,
  Badge,
  Button,
  Card,
  Modal,
  Progress,
  Skeleton,
} from "@/components/ui";
import { LocalSvg } from "@/components/icons/LocalSvg";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";
import {
  approvedTestimonials as onlyApproved,
  testimonialsByAuthor,
  useTestimonials,
  type Testimonial,
} from "@/features/testimonials/useTestimonials";
import { isRevisable } from "@/features/testimonials/testimonials.rules";
import VideoPlayerModal from "@/features/testimonials/VideoPlayerModal";
import SubmitTestimonialModal from "@/features/testimonials/SubmitTestimonialModal";

const asset = (name: string) => `/images/user-dashboard/${name}`;

/** Every section on this page announces itself the same way. */
function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-inline-md sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-heading-4 text-fg">{title}</h2>
        {subtitle ? (
          <p className="mt-stack-xs measure text-body-sm text-fg-muted">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function Icon({ src, className }: { src: string; className?: string }) {
  return (
    <span className={`relative block size-6 overflow-clip ${className ?? ""}`}>
      <LocalSvg src={src} alt="" className="size-full" />
    </span>
  );
}

/* Eight tints, all categories rather than states, so they come off the
   categorical ramp. They briefly borrowed the status surfaces, which made
   "Community" look like a success and "Classes Attended" like one too. */
const quickActions = [
  {
    label: "Where's My Ride",
    href: "/dashboard/my-rides",
    icon: "quick-car.svg",
    tone: "bg-cat-6-soft",
  },
  {
    label: "My Classroom",
    href: "/dashboard/my-classroom",
    icon: "quick-book.svg",
    tone: "bg-cat-7-soft",
  },
  {
    label: "Community",
    href: "/dashboard/community",
    icon: "quick-messages.svg",
    tone: "bg-cat-4-soft",
  },
  {
    label: "Before the ER™",
    href: "/dashboard/before-the-er",
    icon: "quick-info.svg",
    tone: "bg-cat-1-soft",
  },
];

const stats = [
  {
    label: "Journal Entries",
    value: "1,247",
    icon: "stat-users.svg",
    tone: "bg-cat-6-soft",
  },
  {
    label: "Notification Check-ins",
    value: "78%",
    icon: "stat-clipboard.svg",
    tone: "bg-cat-3-soft",
  },
  {
    label: "Curriculum Progress",
    value: "892",
    icon: "stat-book.svg",
    tone: "bg-cat-7-soft",
  },
  {
    label: "Classes Attended",
    value: "2",
    icon: "stat-video.svg",
    tone: "bg-cat-5-soft",
  },
];

type GreetingStrings = {
  greetingMorning?: string;
  greetingAfternoon?: string;
  greetingEvening?: string;
};

function getGreeting(dh?: GreetingStrings) {
  const hour = new Date().getHours();
  if (hour < 12) return dh?.greetingMorning || "Good morning";
  if (hour < 17) return dh?.greetingAfternoon || "Good afternoon";
  return dh?.greetingEvening || "Good evening";
}

export default function UserDashboard() {
  const { user } = useAuth();
  const { language, dictionary } = useLanguage();
  const dh = dictionary?.dashboardHome;
  const firstName = user?.name.split(" ")[0] || "Sarah";
  const greeting = useMemo(() => getGreeting(dh), [dh]);
  const [isRideModalOpen, setIsRideModalOpen] = useState(false);

  const [selectedVideo, setSelectedVideo] = useState<Testimonial | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  /* One cache, shared with the submit modal and the admin queue, so a new
     submission shows up here without a window event to carry the news. */
  const {
    testimonials,
    isPending: testimonialsPending,
    error: testimonialsError,
    refetch: refetchTestimonials,
    remove: removeTestimonial,
  } = useTestimonials();

  const approvedTestimonials = useMemo(
    () => onlyApproved(testimonials),
    [testimonials],
  );
  const userSubmissions = useMemo(
    () => testimonialsByAuthor(testimonials, user?.email || ""),
    [testimonials, user?.email],
  );
  /* The submission being revised, or null when the modal is taking a new
     one. Keyed on the modal below so reopening starts from that story. */
  const [editingStory, setEditingStory] = useState<Testimonial | null>(null);
  const [pendingDeleteStory, setPendingDeleteStory] =
    useState<Testimonial | null>(null);

  const getQuickActionLabel = (action: (typeof quickActions)[0]) => {
    switch (action.href) {
      case "/dashboard/my-rides":
        return dh?.quickActions?.wheresMyRide || action.label;
      case "/dashboard/my-classroom":
        return dh?.quickActions?.educationCenter || action.label;
      case "/dashboard/community":
        return dh?.quickActions?.community || action.label;
      case "/dashboard/before-the-er":
        return dh?.quickActions?.beforeTheEr || action.label;
      default:
        return action.label;
    }
  };

  const getStatLabel = (statKey: string, fallback: string) => {
    switch (statKey) {
      case "Journal Entries":
        return dh?.stats?.journalEntries || fallback;
      case "Notification Check-ins":
      case "SMS Check-ins":
        return dh?.stats?.smsCheckIns || fallback;
      case "Curriculum Progress":
        return dh?.stats?.curriculumProgress || fallback;
      case "Classes Attended":
        return dh?.stats?.classesAttended || fallback;
      default:
        return fallback;
    }
  };

  return (
    <div className="space-y-stack-2xl">
      <h1 className="text-heading-1 text-fg">
        {greeting}, {firstName}
      </h1>

      <section className="space-y-stack-md">
        <SectionHeading
          title={
            dh?.quickActionTitle ||
            (language === "ES" ? "Acción Rápida" : "Quick Action")
          }
        />
        <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const label = getQuickActionLabel(action);

            return (
              <Link
                key={action.label}
                href={action.href}
                className="flex min-h-[134px] flex-col gap-inline-lg rounded-card border border-line bg-surface p-inset-lg transition-colors duration-150 ease-standard hover:border-line-strong hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span
                  aria-hidden="true"
                  className={`flex size-12 items-center justify-center rounded-card ${action.tone}`}
                >
                  <Icon src={asset(action.icon)} />
                </span>
                <p className="text-body-md text-fg">{label}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-inset-md xl:grid-cols-2">
        <Card as="article" padding="small">
          <div className="flex items-center gap-inline-md py-inset-xs">
            <p className="flex-1 text-body-md text-fg">
              {dh?.curriculum?.title || "Curriculum Progress"}
            </p>
            <Link
              href="/dashboard/my-classroom"
              className="flex items-center gap-inline-md rounded-control-small text-label-md text-fg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {dh?.curriculum?.weekBadge || "Day 1 of 21"}
              <Icon src={asset("arrow-right.svg")} />
            </Link>
          </div>
          <Card tone="sunken" padding="small">
            <p className="text-body-md text-fg-brand">
              {dh?.curriculum?.weekLabel || "Day 1"}
            </p>
            <div className="mt-stack-lg">
              <div className="flex items-center justify-between gap-inline-lg">
                <p className="text-heading-5 text-fg-secondary">
                  {dh?.curriculum?.moduleTitle || "Foundations of Awareness"}
                </p>
                <p className="shrink-0 text-label-md text-fg-muted">
                  {dh?.curriculum?.completed || "25% complete"}
                </p>
              </div>
              <Progress
                value={25}
                label={dh?.curriculum?.title || "Curriculum Progress"}
                className="mt-stack-sm"
              />
              <p className="mt-stack-lg measure text-body-sm text-fg-secondary">
                {dh?.curriculum?.description ||
                  "You've started reading the materials. Don't forget to complete the reflection exercise in your journal."}
              </p>
            </div>
          </Card>
        </Card>

        <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
          {stats.map((stat) => (
            <Card
              as="article"
              key={stat.label}
              padding="none"
              className="p-inset-md"
            >
              <div className="flex items-center justify-between gap-inline-md">
                <p className="text-body-md text-fg-secondary">
                  {getStatLabel(stat.label, stat.label)}
                </p>
                <span
                  aria-hidden="true"
                  className={`flex size-10 items-center justify-center rounded-control ${stat.tone}`}
                >
                  <Icon src={asset(stat.icon)} />
                </span>
              </div>
              <p className="mt-stack-lg text-metric-sm text-fg">{stat.value}</p>
            </Card>
          ))}
        </div>
      </section>

      <Card
        as="section"
        padding="none"
        className="relative overflow-hidden p-inset-lg transition-shadow duration-150 ease-standard hover:shadow-raised"
      >
        {/* Subtle accent indicator bar on the left edge */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 h-full w-1.5 bg-brand-600"
        />

        {/* Subtle ambient gradient highlight in corner */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-brand-50/70 blur-3xl"
        />

        <div className="relative flex flex-col gap-inset-md sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-inline-lg sm:items-center">
            {/* Visual Icon Container */}
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-panel border border-primary-soft-line bg-primary-soft text-primary-fg shadow-xs"
            >
              <Video className="size-7" />
            </span>

            {/* Content Details */}
            <div className="min-w-0 flex-1 space-y-stack-xs">
              <div className="flex items-center gap-inline-md">
                <Badge tone="danger" variant="soft" className="gap-inline-sm">
                  <span className="relative flex size-2 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger-500 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-danger-600 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
                  </span>
                  {dh?.upcomingClass?.badge || "Upcoming Live Class"}
                </Badge>
              </div>

              <h3 className="text-heading-4 text-fg">
                {dh?.upcomingClass?.title || "Managing Dialysis Symptoms"}
              </h3>

              <div className="flex flex-wrap items-center gap-inline-lg text-body-sm text-fg-muted">
                <span className="flex items-center gap-inline-sm text-fg-secondary">
                  <Calendar className="size-4 shrink-0 text-brand-600" />
                  {dh?.upcomingClass?.datetime || "May 5, 2026 at 2:00 PM EST"}
                </span>
                <span className="hidden text-line sm:inline">•</span>
                <span className="flex items-center gap-inline-sm text-fg-muted">
                  <Users className="size-4 shrink-0 text-fg-muted" />
                  {language === "ES"
                    ? "Sesión interactiva en vivo"
                    : "Interactive group session"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0">
            <Button
              size="big"
              leadingIcon={<Video className="size-5" />}
              className="w-full sm:w-auto"
              {...notBuiltYet("Joining a class")}
            >
              {dh?.upcomingClass?.joinButton || "Join Class"}
            </Button>
          </div>
        </div>
      </Card>

      {/* From Fear to Hope Testimonials Section */}
      <section className="space-y-stack-md">
        <SectionHeading
          title={
            language === "ES"
              ? "Testimonios: Del Miedo a la Esperanza"
              : "From Fear to Hope Testimonials"
          }
          action={
            <Button
              variant="primary"
              appearance="fill-stroke"
              leadingIcon={<Video className="size-4" />}
              onClick={() => setIsSubmitModalOpen(true)}
            >
              {language === "ES"
                ? "Compartir Mi Historia"
                : "Share Your Video Story"}
            </Button>
          }
        />

        {/* A member's own submissions, so they can see where each one got
            to and change anything still waiting on review. Nothing here is
            public until an admin approves it. */}
        {userSubmissions.length > 0 ? (
          <Card padding="small" className="space-y-stack-sm">
            <h3 className="text-heading-5 text-fg">
              {language === "ES" ? "Tus historias" : "Your stories"}
            </h3>
            <ul className="space-y-stack-xs">
              {userSubmissions.map((story) => (
                <li
                  key={story.id}
                  className="flex flex-wrap items-center justify-between gap-inline-md rounded-card border border-line bg-surface p-inset-sm"
                >
                  <div className="min-w-0">
                    <p className="text-label-md text-fg">{story.title}</p>
                    {story.adminFeedback ? (
                      <p className="mt-stack-xs text-body-sm text-fg-muted">
                        {story.adminFeedback}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-inline-md">
                    <Badge
                      tone={
                        story.status === "approved"
                          ? "success"
                          : story.status === "declined"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {story.status === "approved"
                        ? language === "ES"
                          ? "Publicada"
                          : "Published"
                        : story.status === "declined"
                          ? language === "ES"
                            ? "No aprobada"
                            : "Not approved"
                          : language === "ES"
                            ? "En revisión"
                            : "Under review"}
                    </Badge>

                    {/* Editable only while it waits: changing a published
                        story would republish it without review. */}
                    {isRevisable(story) ? (
                      <Button
                        size="small"
                        variant="neutral"
                        appearance="fill-stroke"
                        onClick={() => {
                          setEditingStory(story);
                          setIsSubmitModalOpen(true);
                        }}
                      >
                        <Pencil
                          aria-hidden="true"
                          className="size-4 shrink-0"
                        />
                        {language === "ES" ? "Editar" : "Edit"}
                      </Button>
                    ) : null}

                    {/* A member can withdraw their own story at any point,
                        including after it is published — it is their face on
                        a public page. */}
                    <Button
                      size="small"
                      variant="danger"
                      appearance="stroke"
                      onClick={() => setPendingDeleteStory(story)}
                      aria-label={
                        language === "ES"
                          ? `Eliminar ${story.title}`
                          : `Delete ${story.title}`
                      }
                    >
                      <Trash2 aria-hidden="true" className="size-4 shrink-0" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {/* Video Cards Grid */}
        <AsyncSection
          pending={testimonialsPending}
          error={testimonialsError}
          onRetry={refetchTestimonials}
          errorTitle={
            language === "ES"
              ? "Los testimonios no se cargaron"
              : "The testimonials did not load"
          }
          skeleton={
            <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} height={200} />
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {approvedTestimonials.map((item) => (
              <Card
                as="article"
                key={item.id}
                padding="small"
                className="group cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-raised"
                onClick={() => setSelectedVideo(item)}
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-video w-full overflow-hidden rounded-card bg-surface-inverse">
                  {/* next/image needs every remote host declared up front, and a
                      testimonial thumbnail URL is whatever the member
                      submitted. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      item.thumbnailUrl ||
                      "/images/user-dashboard/testimonial.jpg"
                    }
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/20">
                    <span className="flex size-12 items-center justify-center rounded-pill bg-white/95 text-brand-700 shadow-md transition-transform duration-200 group-hover:scale-110">
                      <Play className="ml-0.5 size-5 fill-current" />
                    </span>
                  </div>
                  {/* Duration Badge */}
                  {item.duration && (
                    <span className="absolute right-2 bottom-2 rounded bg-black/80 px-2 py-0.5 text-caption font-medium text-white backdrop-blur-xs">
                      {item.duration}
                    </span>
                  )}
                </div>

                <div className="space-y-stack-xs p-inset-sm">
                  <div className="flex items-center justify-between text-caption text-fg-muted">
                    <span className="font-semibold text-fg">
                      {item.memberName}
                    </span>
                    <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-[11px] text-fg-secondary">
                      {item.role}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-label-md font-bold text-fg transition-colors group-hover:text-brand-600">
                    {item.title}
                  </p>
                  <p className="line-clamp-2 text-caption text-fg-muted italic">
                    &ldquo;{item.summary}&rdquo;
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </AsyncSection>
      </section>

      {/* Video Player Modal */}
      <VideoPlayerModal
        testimonial={selectedVideo}
        open={Boolean(selectedVideo)}
        onClose={() => setSelectedVideo(null)}
      />

      {/* Withdrawing a story cannot be undone, so it asks. */}
      {pendingDeleteStory ? (
        <Modal
          open
          size="small"
          closeOnBackdrop={false}
          onClose={() => setPendingDeleteStory(null)}
          title={
            language === "ES" ? "¿Eliminar tu historia?" : "Delete your story?"
          }
          description={
            language === "ES"
              ? `"${pendingDeleteStory.title}" se eliminará. Si ya estaba publicada, dejará de aparecer para los demás.`
              : `"${pendingDeleteStory.title}" will be removed. If it was published, it stops showing for everyone else.`
          }
          footer={
            <>
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setPendingDeleteStory(null)}
              >
                {language === "ES" ? "Conservar" : "Keep it"}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  void removeTestimonial(pendingDeleteStory.id);
                  setPendingDeleteStory(null);
                }}
              >
                {language === "ES" ? "Eliminar" : "Delete"}
              </Button>
            </>
          }
        />
      ) : null}

      {/* Submit Testimonial Modal */}
      <SubmitTestimonialModal
        /* Keyed on the story: opening it for another one starts from that
           story's text without an effect syncing the fields. */
        key={editingStory ? `story-${editingStory.id}` : "story-new"}
        open={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          setEditingStory(null);
        }}
        user={user}
        editing={editingStory}
        onSubmitted={refetchTestimonials}
      />

      {/* Where's My Ride Modal.
          NOTE: nothing on this page sets isRideModalOpen — the Quick Action
          tile is a <Link> to /dashboard/my-rides instead. Left wired so the
          modal can be opened from here once that is decided. */}
      <WheresMyRideModal
        isOpen={isRideModalOpen}
        onClose={() => setIsRideModalOpen(false)}
      />
    </div>
  );
}
