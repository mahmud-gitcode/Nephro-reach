"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

const tabs = [
  "All Posts",
  "General Kidney",
  "Dialysis",
  "Kidney Transplant",
  "Caregiver Support",
  "Nutrition & Wellness",
] as const;

type Tab = (typeof tabs)[number];

const feedPosts = [
  {
    id: "1",
    author: "Charles D. Xavier",
    badge: "Milestone",
    time: "Posted 3m ago",
    paragraphs: [
      "I’ve been practicing my glutes with coach Sandow AI for the past week, and I feel better!",
      "The personalized recommendation is simply a beast!! ",
    ],
    hashtags: "#glute4eva #letsgetfit 💪🙀",
    likes: 215,
    category: "All Posts" as Tab,
  },
  {
    id: "2",
    author: "Charles D. Xavier",
    badge: "Milestone",
    time: "Posted 3m ago",
    paragraphs: [
      "I’ve been practicing my glutes with coach Sandow AI for the past week, and I feel better!",
      "The personalized recommendation is simply a beast!! ",
    ],
    hashtags: "#glute4eva #letsgetfit 💪🙀",
    likes: 215,
    category: "General Kidney" as Tab,
  },
  {
    id: "3",
    author: "Charles D. Xavier",
    badge: "Milestone",
    time: "Posted 3m ago",
    paragraphs: [
      "I’ve been practicing my glutes with coach Sandow AI for the past week, and I feel better!",
      "The personalized recommendation is simply a beast!! ",
    ],
    hashtags: "#glute4eva #letsgetfit 💪🙀",
    likes: 215,
    category: "Dialysis" as Tab,
  },
  {
    id: "4",
    author: "Charles D. Xavier",
    badge: "Milestone",
    time: "Posted 3m ago",
    paragraphs: [
      "I’ve been practicing my glutes with coach Sandow AI for the past week, and I feel better!",
      "The personalized recommendation is simply a beast!! ",
    ],
    hashtags: "#glute4eva #letsgetfit 💪🙀",
    likes: 215,
    category: "Kidney Transplant" as Tab,
  },
];

function ComposeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [body, setBody] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-post-title"
        className="w-full max-w-[520px] rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_4px_8px_rgba(15,23,42,0.03),0_8px_16px_rgba(15,23,42,0.05)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="new-post-title" className="text-base font-medium text-[#0A0A0A]">
            New post
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-700 hover:bg-slate-100"
            aria-label="Close new post"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={6}
          placeholder="Share an update with the community..."
          className="mt-4 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-200"
        />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white shadow-md"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<Tab>("All Posts");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  const posts = useMemo(() => {
    if (activeTab === "All Posts") return feedPosts;
    const filtered = feedPosts.filter((post) => post.category === activeTab);
    return filtered.length > 0 ? filtered : feedPosts;
  }, [activeTab]);

  return (
    <div className="relative min-h-[calc(100vh-7rem)]">
      <div className="mb-4 overflow-x-auto rounded-[14px] border border-[#E2E8F0] bg-[#F1F5FA] p-1.5">
        <div className="flex min-w-[720px] gap-1.5 md:min-w-0">
          {tabs.map((tab) => {
            const active = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`h-12 flex-1 whitespace-nowrap rounded-xl px-4 text-base font-medium tracking-[0.08px] ${
                  active
                    ? "bg-white text-black shadow-[0_1px_0.5px_rgba(0,0,0,0.05)]"
                    : "text-black/80"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {posts.map((post) => {
          const isLiked = Boolean(liked[post.id]);
          return (
            <article
              key={post.id}
              className="rounded-[20px] border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_8px_rgba(15,23,42,0.03),0_8px_16px_rgba(15,23,42,0.02)]"
            >
              <div className="flex items-start gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src="/images/community/avatar.png"
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-base font-medium leading-6 tracking-[0.08px] text-[#18181B]">
                        {post.author}
                      </p>
                      <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs leading-4 text-[#0A0A0A]">
                        {post.badge}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm leading-5 text-[#52525B]">{post.time}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    className="relative size-6 overflow-clip"
                    aria-label="Post options"
                    onClick={() =>
                      setMenuOpen((current) => (current === post.id ? null : post.id))
                    }
                  >
                    <img
                      src="/images/community/more-vertical.svg"
                      alt=""
                      className="size-full"
                    />
                  </button>
                  {menuOpen === post.id && (
                    <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-md">
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                        onClick={() => setMenuOpen(null)}
                      >
                        Hide post
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 text-sm leading-[22px] text-[#0F172A]">
                <p>{post.paragraphs[0]}</p>
                <p className="mt-[22px]">
                  {post.paragraphs[1]}
                  <span className="text-[#2563EB]">{post.hashtags}</span>
                </p>
              </div>

              <div className="mt-3 h-px w-full bg-[#E4E4E7]" />

              <button
                type="button"
                className="mt-3 flex items-center gap-2"
                onClick={() =>
                  setLiked((current) => ({
                    ...current,
                    [post.id]: !current[post.id],
                  }))
                }
                aria-pressed={isLiked}
                aria-label="Like post"
              >
                <span className="relative size-6 overflow-clip">
                  <img
                    src="/images/community/heart.svg"
                    alt=""
                    className={`size-full ${isLiked ? "opacity-100" : "opacity-90"}`}
                  />
                </span>
                <span className="text-base font-medium leading-6 tracking-[0.08px] text-[#52525B]">
                  {post.likes + (isLiked ? 1 : 0)}
                </span>
              </button>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setComposeOpen(true)}
        className="fixed bottom-8 right-6 z-20 flex h-12 w-[52px] items-center justify-center rounded bg-[#2563EB] shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1),0_4px_6px_-1px_rgba(0,0,0,0.1)] lg:right-10"
        aria-label="Create a new post"
      >
        <span className="relative size-6 overflow-clip">
          <img src="/images/community/add.svg" alt="" className="size-full" />
        </span>
      </button>

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} />
    </div>
  );
}
