"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

type CommunityTab = {
  id: string;
  label: string;
};

type PostItem = {
  id: string;
  author: string;
  badge: string;
  time: string;
  paragraphs: string[];
  hashtags: string;
  likes: number;
  categoryId: string;
};

const defaultTabs: CommunityTab[] = [
  { id: "all", label: "All Posts" },
  { id: "general", label: "General Kidney" },
  { id: "dialysis", label: "Dialysis" },
  { id: "transplant", label: "Kidney Transplant" },
  { id: "caregiver", label: "Caregiver Support" },
  { id: "nutrition", label: "Nutrition & Wellness" },
];

const defaultPosts: PostItem[] = [
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
    categoryId: "all",
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
    categoryId: "general",
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
    categoryId: "dialysis",
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
    categoryId: "transplant",
  },
];

function ComposeModal({
  open,
  onClose,
  onPost,
  title,
  closeAria,
  placeholder,
  postButton,
}: {
  open: boolean;
  onClose: () => void;
  onPost: (body: string) => void;
  title: string;
  closeAria: string;
  placeholder: string;
  postButton: string;
}) {
  const [body, setBody] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    if (!body.trim()) return;
    onPost(body.trim());
    setBody("");
    onClose();
  };

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
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label={closeAria}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={6}
          placeholder={placeholder}
          className="mt-4 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-200"
        />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!body.trim()}
            className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white shadow-md transition-opacity hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {postButton}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { dictionary, language } = useLanguage();
  const { user } = useAuth();
  const comm = dictionary?.community;

  const tabs: CommunityTab[] =
    comm?.tabs && Array.isArray(comm.tabs) && comm.tabs.length > 0
      ? comm.tabs
      : defaultTabs;

  const [activeTabId, setActiveTabId] = useState<string>("all");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [hiddenPostIds, setHiddenPostIds] = useState<Record<string, boolean>>({});
  const [userPosts, setUserPosts] = useState<PostItem[]>([]);

  const dictPosts: PostItem[] =
    comm?.posts && Array.isArray(comm.posts) && comm.posts.length > 0
      ? comm.posts
      : defaultPosts;

  const allCombinedPosts = useMemo(() => {
    return [...userPosts, ...dictPosts].filter((post) => !hiddenPostIds[post.id]);
  }, [userPosts, dictPosts, hiddenPostIds]);

  const posts = useMemo(() => {
    if (activeTabId === "all") return allCombinedPosts;
    const filtered = allCombinedPosts.filter((post) => post.categoryId === activeTabId);
    return filtered.length > 0 ? filtered : allCombinedPosts;
  }, [activeTabId, allCombinedPosts]);

  const handleAddPost = (text: string) => {
    const newPost: PostItem = {
      id: `user-${Date.now()}`,
      author: user?.name || (language === "ES" ? "Usted" : "You"),
      badge: comm?.compose?.memberBadge || (language === "ES" ? "Miembro" : "Member"),
      time: comm?.compose?.justNow || (language === "ES" ? "Recién publicado" : "Just now"),
      paragraphs: [text],
      hashtags: "",
      likes: 0,
      categoryId: activeTabId === "all" ? "general" : activeTabId,
    };
    setUserPosts((prev) => [newPost, ...prev]);
  };

  const handleHidePost = (id: string) => {
    setHiddenPostIds((prev) => ({ ...prev, [id]: true }));
    setMenuOpen(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-7rem)]">
      {/* Category Tabs */}
      <div className="mb-4 overflow-x-auto rounded-[14px] border border-[#E2E8F0] bg-[#F1F5FA] p-1.5">
        <div className="flex min-w-[720px] gap-1.5 md:min-w-0">
          {tabs.map((tab) => {
            const active = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={`h-12 flex-1 whitespace-nowrap rounded-xl px-4 text-base font-medium tracking-[0.08px] transition-colors cursor-pointer ${
                  active
                    ? "bg-white text-black shadow-[0_1px_0.5px_rgba(0,0,0,0.05)]"
                    : "text-black/80 hover:text-black hover:bg-white/50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed Posts */}
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
                    className="relative size-6 overflow-clip cursor-pointer"
                    aria-label={comm?.postOptionsAria || "Post options"}
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
                        className="block w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 cursor-pointer"
                        onClick={() => handleHidePost(post.id)}
                      >
                        {comm?.hidePost || "Hide post"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 text-sm leading-[22px] text-[#0F172A]">
                {post.paragraphs && post.paragraphs.length > 0 ? (
                  post.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className={pIdx > 0 ? "mt-[22px]" : ""}>
                      {p}
                      {pIdx === post.paragraphs.length - 1 && post.hashtags && (
                        <span className="ml-1 text-[#2563EB]">{post.hashtags}</span>
                      )}
                    </p>
                  ))
                ) : (
                  <p />
                )}
              </div>

              <div className="mt-3 h-px w-full bg-[#E4E4E7]" />

              <button
                type="button"
                className="mt-3 flex items-center gap-2 cursor-pointer"
                onClick={() =>
                  setLiked((current) => ({
                    ...current,
                    [post.id]: !current[post.id],
                  }))
                }
                aria-pressed={isLiked}
                aria-label={comm?.likePostAria || "Like post"}
              >
                <span className="relative size-6 overflow-clip">
                  <img
                    src="/images/community/heart.svg"
                    alt=""
                    className={`size-full transition-opacity ${
                      isLiked ? "opacity-100" : "opacity-90"
                    }`}
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

      {/* Floating Create Post Button */}
      <button
        type="button"
        onClick={() => setComposeOpen(true)}
        className="fixed bottom-8 right-6 z-20 flex h-12 w-[52px] items-center justify-center rounded bg-[#2563EB] shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1),0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-transform hover:scale-105 cursor-pointer lg:right-10"
        aria-label={comm?.createPostAria || "Create a new post"}
      >
        <span className="relative size-6 overflow-clip">
          <img src="/images/community/add.svg" alt="" className="size-full" />
        </span>
      </button>

      {/* Compose Modal */}
      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onPost={handleAddPost}
        title={comm?.compose?.title || "New post"}
        closeAria={comm?.compose?.closeAria || "Close new post"}
        placeholder={comm?.compose?.placeholder || "Share an update with the community..."}
        postButton={comm?.compose?.postButton || "Post"}
      />
    </div>
  );
}
