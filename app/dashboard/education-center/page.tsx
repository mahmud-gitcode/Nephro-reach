"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BookmarkPlus, CheckCircle2, Play, Search } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const defaultCategories = [
  "All Videos",
  "Starting dialysis",
  "What to expect before/during/after treatment",
  "Diet & fluid control",
  "Medications",
  "Access care",
  "Managing symptoms",
];

const suggestedVideos = [
  { watched: true },
  { watched: false },
  { watched: false },
];

const allVideos = [
  { watched: true },
  { watched: false },
  { watched: false },
  { watched: false },
  { watched: true },
  { watched: false },
];

function CategoryFilters({
  categories,
  selectedCategory,
  onSelectCategory,
  categoriesLabel,
  searchPlaceholder,
}: {
  categories: string[];
  selectedCategory: number;
  onSelectCategory: (index: number) => void;
  categoriesLabel: string;
  searchPlaceholder: string;
}) {
  return (
    <section className="rounded-[14px] bg-white/40 p-4">
      <label className="relative block">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          placeholder={searchPlaceholder}
          className="h-10 w-full rounded-lg border border-[#CBD5ED] bg-white pl-10 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <div className="mt-3">
        <h2 className="text-sm font-medium leading-5 text-slate-600">
          {categoriesLabel}
        </h2>
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {categories.map((category, index) => (
            <button
              key={`${category}-${index}`}
              type="button"
              onClick={() => onSelectCategory(index)}
              className={`h-[38px] shrink-0 rounded-[10px] border px-4 text-sm font-medium transition-colors cursor-pointer ${
                index === selectedCategory
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm font-bold"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function WatchedBadge({ label }: { label: string }) {
  return (
    <span className="absolute left-2 top-2 inline-flex h-7 items-center gap-1 rounded bg-[#00A63E] px-2 text-xs font-normal text-white">
      <CheckCircle2 className="h-3 w-3" />
      {label}
    </span>
  );
}

function VideoCard({
  video,
  videoTitle,
  watchedLabel,
  playLabel,
  saveLabel,
}: {
  video: { watched: boolean };
  videoTitle: string;
  watchedLabel: string;
  playLabel: string;
  saveLabel: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_0_60px_rgba(0,0,0,0.06)]">
      <div className="relative aspect-[324/182] overflow-hidden rounded-2xl bg-slate-100">
        <Image
          src="/images/education-center-video.png"
          alt={videoTitle}
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 324px, (min-width: 768px) 33vw, 100vw"
        />
        <button
          type="button"
          className="absolute left-1/2 top-1/2 flex h-[50px] w-[50px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-sm transition-transform hover:scale-105 cursor-pointer"
          aria-label={`${playLabel} ${videoTitle}`}
        >
          <Play className="ml-0.5 h-6 w-6" />
        </button>
        {video.watched && <WatchedBadge label={watchedLabel} />}
      </div>

      <div className="mt-4 flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">
          {videoTitle}
        </h3>
        <button
          type="button"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-800 transition-colors hover:bg-slate-100 cursor-pointer"
          aria-label={`${saveLabel} ${videoTitle}`}
        >
          <BookmarkPlus className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}

function VideoSection({
  title,
  videos,
  videoTitle,
  watchedLabel,
  playLabel,
  saveLabel,
}: {
  title: string;
  videos: Array<{ watched: boolean }>;
  videoTitle: string;
  watchedLabel: string;
  playLabel: string;
  saveLabel: string;
}) {
  return (
    <section>
      <h2 className="text-xl font-medium leading-7 text-slate-950">{title}</h2>
      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {videos.map((video, index) => (
          <VideoCard
            key={`${title}-${index}`}
            video={video}
            videoTitle={videoTitle}
            watchedLabel={watchedLabel}
            playLabel={playLabel}
            saveLabel={saveLabel}
          />
        ))}
      </div>
    </section>
  );
}

export default function EducationCenterPage() {
  const { dictionary } = useLanguage();
  const ec = dictionary?.educationCenter;
  const [selectedCategory, setSelectedCategory] = useState(0);

  const categories =
    ec?.categories && Array.isArray(ec.categories) && ec.categories.length > 0
      ? ec.categories
      : defaultCategories;

  const videoTitle = ec?.videoTitle || "Managing Fluid Intake";
  const watchedLabel = ec?.watchedBadge || "Watched";
  const playLabel = ec?.playAria || "Play";
  const saveLabel = ec?.saveAria || "Save";

  return (
    <div className="space-y-6">
      <CategoryFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoriesLabel={ec?.categoriesLabel || "Categories"}
        searchPlaceholder={ec?.searchPlaceholder || "Search..."}
      />
      <VideoSection
        title={ec?.suggestedTitle || "Suggested for You"}
        videos={suggestedVideos}
        videoTitle={videoTitle}
        watchedLabel={watchedLabel}
        playLabel={playLabel}
        saveLabel={saveLabel}
      />
      <VideoSection
        title={`${ec?.allVideosTitle || "All Videos"} (9)`}
        videos={allVideos}
        videoTitle={videoTitle}
        watchedLabel={watchedLabel}
        playLabel={playLabel}
        saveLabel={saveLabel}
      />
    </div>
  );
}
