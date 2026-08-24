import React from "react";
import Image from "next/image";
import { BookmarkPlus, CheckCircle2, Play, Search } from "lucide-react";

const categories = [
  "All Videos",
  "Starting dialysis",
  "What to expect before/during/after treatment",
  "Diet & fluid control",
  "Medications",
  "Access care",
  "Managing symptoms",
];

const suggestedVideos = [
  { title: "Managing Fluid Intake", watched: true },
  { title: "Managing Fluid Intake", watched: false },
  { title: "Managing Fluid Intake", watched: false },
];

const allVideos = [
  { title: "Managing Fluid Intake", watched: true },
  { title: "Managing Fluid Intake", watched: false },
  { title: "Managing Fluid Intake", watched: false },
  { title: "Managing Fluid Intake", watched: false },
  { title: "Managing Fluid Intake", watched: true },
  { title: "Managing Fluid Intake", watched: false },
];

function CategoryFilters() {
  return (
    <section className="rounded-[14px] bg-white/40 p-4">
      <label className="relative block">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          placeholder="Search..."
          className="h-10 w-full rounded-lg border border-[#CBD5ED] bg-white pl-10 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <div className="mt-3">
        <h2 className="text-sm font-medium leading-5 text-slate-600">Categories</h2>
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {categories.map((category, index) => (
            <button
              key={category}
              type="button"
              className={`h-[38px] shrink-0 rounded-[10px] border px-4 text-sm font-medium transition-colors ${
                index === 0
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
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

function WatchedBadge() {
  return (
    <span className="absolute left-2 top-2 inline-flex h-7 items-center gap-1 rounded bg-[#00A63E] px-2 text-xs font-normal text-white">
      <CheckCircle2 className="h-3 w-3" />
      Watched
    </span>
  );
}

function VideoCard({ video }: { video: (typeof allVideos)[number] }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_0_60px_rgba(0,0,0,0.06)]">
      <div className="relative aspect-[324/182] overflow-hidden rounded-2xl bg-slate-100">
        <Image
          src="/images/education-center-video.png"
          alt={video.title}
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 324px, (min-width: 768px) 33vw, 100vw"
        />
        <button
          type="button"
          className="absolute left-1/2 top-1/2 flex h-[50px] w-[50px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-sm"
          aria-label={`Play ${video.title}`}
        >
          <Play className="ml-0.5 h-6 w-6" />
        </button>
        {video.watched && <WatchedBadge />}
      </div>

      <div className="mt-4 flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-lg font-medium leading-7 tracking-[0.09px] text-slate-950">
          {video.title}
        </h3>
        <button
          type="button"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-800 transition-colors hover:bg-slate-100"
          aria-label={`Save ${video.title}`}
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
}: {
  title: string;
  videos: Array<(typeof allVideos)[number]>;
}) {
  return (
    <section>
      <h2 className="text-xl font-medium leading-7 text-slate-950">{title}</h2>
      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {videos.map((video, index) => (
          <VideoCard key={`${title}-${index}`} video={video} />
        ))}
      </div>
    </section>
  );
}

export default function EducationCenterPage() {
  return (
    <div className="space-y-6">
      <CategoryFilters />
      <VideoSection title="Suggested for You" videos={suggestedVideos} />
      <VideoSection title="All Videos (9)" videos={allVideos} />
    </div>
  );
}
