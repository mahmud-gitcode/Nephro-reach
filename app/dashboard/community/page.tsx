"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { X, FileText, Send, MessageCircle } from "lucide-react";
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

// Auto-flag words and phrases for moderation
export const AUTO_FLAG_PHRASES: string[] = [
  // Emergency / Medical Crisis
  "chest pain",
  "can't breathe",
  "cant breathe",
  "shortness of breath",
  "passed out",
  "fainted",
  "seizure",
  "stroke",
  "confused",
  "unresponsive",
  "bleeding",
  "severe pain",
  "911",
  "er",
  "emergency",
  "life-threatening",
  "life threatening",

  // Dialysis Access Concerns
  "access bleeding",
  "fistula bleeding",
  "graft bleeding",
  "catheter bleeding",
  "no bruit",
  "no thrill",
  "access swollen",
  "access infected",
  "pus",
  "redness",
  "warm to touch",
  "fever",
  "chills",

  // Dangerous Symptoms During/After Dialysis
  "very dizzy",
  "low blood pressure",
  "cramping bad",
  "throwing up",
  "heart racing",
  "palpitations",
  "severe headache",
  "can't stay awake",
  "cant stay awake",
  "blue lips",
  "fluid overload",

  // Mental Health / Safety
  "i want to die",
  "suicide",
  "kill myself",
  "hurt myself",
  "hurt someone",
  "hopeless",
  "abuse",
  "neglect",
  "domestic violence",

  // Medical Advice Requests
  "what dose should i take",
  "should i stop my medicine",
  "should i skip dialysis",
  "can i miss treatment",
  "should i take extra",
  "change my dose",
  "diagnose me",
  "treat this",
  "prescribe",
  "medication reaction",

  // Unsafe Community Behavior
  "idiot",
  "stupid",
  "shut up",
  "racist",
  "threat",
  "fight",
  "harass",
  "scam",
  "cash app",
  "send money",
  "buy pills",
  "sell medication",
];

export function checkFlaggedMedicalContent(text: string): boolean {
  if (!text || !text.trim()) return false;
  const lower = text.toLowerCase();
  return AUTO_FLAG_PHRASES.some((phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|\\b|\\W)${escaped}(?:$|\\b|\\W)`, "i");
    return regex.test(lower);
  });
}

const COMPOSE_CATEGORIES = [
  { id: "general", labelEn: "General Kidney", labelEs: "Salud Renal General" },
  { id: "dialysis", labelEn: "Dialysis", labelEs: "Diálisis" },
  { id: "transplant", labelEn: "Kidney Transplant", labelEs: "Trasplante Renal" },
  { id: "nutrition", labelEn: "Nutrition & Wellness", labelEs: "Nutrición y Bienestar" },
  { id: "caregiver", labelEn: "Caregiver Support", labelEs: "Apoyo al Cuidador" },
];

function ComposeModal({
  open,
  onClose,
  onPost,
  initialCategory = "general",
}: {
  open: boolean;
  onClose: () => void;
  onPost: (body: string, categoryId: string) => void;
  initialCategory?: string;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [body, setBody] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory === "all" ? "general" : initialCategory
  );

  // Sync initialCategory when opened
  React.useEffect(() => {
    if (open) {
      setSelectedCategory(initialCategory === "all" ? "general" : initialCategory);
    }
  }, [open, initialCategory]);

  if (!open) return null;

  const isFlagged = checkFlaggedMedicalContent(body);

  const canPost = Boolean(body.trim()) && !isFlagged;

  const handleSubmit = () => {
    if (!canPost) return;
    onPost(body.trim(), selectedCategory);
    setBody("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-guidelines-heading"
        className="relative w-full max-w-[560px] rounded-[24px] bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto select-text"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label={isEs ? "Cerrar ventana" : "Close modal"}
        >
          <X className="h-5 w-5" />
        </button>

        {/* 1. Community Guidelines Banner */}
        <div className="rounded-2xl bg-[#EAF5FE] border border-[#D2E7FC]/60 p-4 sm:p-5 text-left mb-4">
          <h3
            id="community-guidelines-heading"
            className="text-base sm:text-[17px] font-bold text-slate-900 leading-tight mb-2"
          >
            {isEs ? "Pautas de la Comunidad" : "Community Guidelines"}
          </h3>
          <p className="text-sm text-slate-700 font-normal leading-relaxed">
            {isEs
              ? "Esta comunidad es solo para educación y apoyo. Por favor, no publique consejos médicos, cambios en medicamentos, síntomas de emergencia o instrucciones de tratamiento."
              : "This community is for education and support only. Please do not post medical advice, medication changes, emergency symptoms, or treatment instructions."}
          </p>
        </div>

        {/* 2. Category Selector Pills (One after another with tight consistent gap) */}
        <div className="rounded-2xl bg-[#F0F4F8] p-1.5 flex flex-wrap items-center gap-1.5 text-left mb-6">
          {COMPOSE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium transition-all cursor-pointer select-none whitespace-nowrap ${
                  isSelected
                    ? "bg-white text-slate-900 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                }`}
              >
                {isEs ? cat.labelEs : cat.labelEn}
              </button>
            );
          })}
        </div>

        {/* 3. Section Title */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 text-left mb-3">
          {isEs ? "Compartir con la Comunidad" : "Share with the Community"}
        </h3>

        {/* 4. Textarea Box with Character Counter */}
        <div className="rounded-2xl border border-[#DFE7F0] p-4 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all text-left flex flex-col justify-between min-h-[160px]">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={200}
            rows={4}
            placeholder={
              isEs
                ? "Este es un espacio de apoyo, no para instrucciones médicas."
                : "This is a support space, not for medical instructions."
            }
            className="w-full flex-grow resize-none border-0 p-0 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:ring-0 outline-none leading-relaxed"
          />
          <div className="flex items-center justify-end gap-1.5 text-slate-400 text-xs sm:text-sm font-medium mt-2 select-none">
            <FileText className="h-4 w-4 stroke-[1.8]" />
            <span>{body.length}/200</span>
          </div>
        </div>

        {/* 5. Dynamic Auto-Flagged Disclaimer Alert Box */}
        {isFlagged && (
          <div className="mt-4 rounded-2xl bg-[#FEEBEB] border border-[#FCD4D4] p-4 sm:p-4.5 flex items-start gap-3.5 text-left animate-in fade-in duration-200">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E05252] text-white font-bold text-xs shadow-xs mt-0.5 select-none">
              !
            </div>
            <div className="text-left">
              <p className="text-[#DC4C4C] text-sm font-medium leading-relaxed">
                {isEs
                  ? "Su mensaje incluye síntomas o inquietudes que pueden necesitar atención médica urgente. NephroReach solo brinda educación y no diagnostica, trata ni reemplaza a su equipo de diálisis. Comuníquese con su clínica de diálisis, nefrólogo o llame al 911 si esto puede ser una emergencia."
                  : "Your message includes symptoms or concerns that may need urgent medical attention. NephroReach provides education only and does not diagnose, treat, or replace your dialysis team. Please contact your dialysis clinic, nephrologist, or call 911 if this may be an emergency."}
              </p>
              <p className="mt-2 text-[#B91C1C] text-sm font-bold leading-relaxed">
                {isEs
                  ? "Este mensaje no se puede publicar. Edite el texto para quitar los detalles médicos urgentes."
                  : "This message cannot be posted. Please edit it to remove the urgent medical details."}
              </p>
            </div>
          </div>
        )}

        {/* 6. Post to Community Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canPost}
          aria-disabled={!canPost}
          title={
            isFlagged
              ? isEs
                ? "No se puede publicar un mensaje marcado"
                : "A flagged message cannot be posted"
              : undefined
          }
          className="mt-4 w-full rounded-2xl bg-[#F0F4F8] hover:bg-[#E2EAF2] text-slate-900 font-bold text-base py-3.5 px-6 flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
        >
          <Send className="h-5 w-5 text-slate-800 -rotate-12" />
          <span>{isEs ? "Publicar en la Comunidad" : "Post to Community"}</span>
        </button>
      </div>
    </div>
  );
}

type ReplyItem = {
  id: string;
  postId: string;
  author: string;
  avatar?: string;
  time: string;
  badge?: string;
  content: string;
  likes?: number;
};

const defaultReplies: Record<string, ReplyItem[]> = {
  "1": [
    {
      id: "r-1",
      postId: "1",
      author: "Dr. Evelyn Reed",
      badge: "Nephrologist",
      time: "2m ago",
      content: "Great milestone! Gentle, regular exercise has wonderful benefits for blood pressure and energy.",
      likes: 14,
    },
  ],
  "2": [
    {
      id: "r-2",
      postId: "2",
      author: "Maria Gonzalez",
      badge: "Family Caregiver",
      time: "1m ago",
      content: "So inspiring to see your progress! Sharing these wins really encourages the whole community.",
      likes: 8,
    },
  ],
};

export default function CommunityPage() {
  const { dictionary, language } = useLanguage();
  const isEs = language === "ES";
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

  // Reply States
  const [replies, setReplies] = useState<Record<string, ReplyItem[]>>(defaultReplies);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyLikes, setReplyLikes] = useState<Record<string, boolean>>({});

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

  const handleAddPost = (text: string, categoryId?: string) => {
    const newPost: PostItem = {
      id: `user-${Date.now()}`,
      author: user?.name || (language === "ES" ? "Usted" : "You"),
      badge: comm?.compose?.memberBadge || (language === "ES" ? "Miembro" : "Member"),
      time: comm?.compose?.justNow || (language === "ES" ? "Recién publicado" : "Just now"),
      paragraphs: [text],
      hashtags: "",
      likes: 0,
      categoryId: categoryId || (activeTabId === "all" ? "general" : activeTabId),
    };
    setUserPosts((prev) => [newPost, ...prev]);
  };

  const handleHidePost = (id: string) => {
    setHiddenPostIds((prev) => ({ ...prev, [id]: true }));
    setMenuOpen(null);
  };

  const toggleReplies = (postId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleAddReply = (postId: string) => {
    const text = replyDrafts[postId]?.trim();
    if (!text) return;

    const newReply: ReplyItem = {
      id: `reply-${Date.now()}`,
      postId,
      author: user?.name || (language === "ES" ? "Usted" : "You"),
      badge: comm?.compose?.memberBadge || (language === "ES" ? "Miembro" : "Member"),
      time: language === "ES" ? "Recién publicado" : "Just now",
      content: text,
      likes: 0,
    };

    setReplies((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newReply],
    }));

    setReplyDrafts((prev) => ({
      ...prev,
      [postId]: "",
    }));

    setExpandedReplies((prev) => ({
      ...prev,
      [postId]: true,
    }));
  };

  const handleToggleReplyLike = (replyId: string) => {
    setReplyLikes((prev) => ({
      ...prev,
      [replyId]: !prev[replyId],
    }));
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
          const postReplies = replies[post.id] || [];
          const isExpanded = Boolean(expandedReplies[post.id]);
          const draft = replyDrafts[post.id] || "";
          const isReplyFlagged = checkFlaggedMedicalContent(draft);

          return (
            <article
              key={post.id}
              className="rounded-[20px] border border-[#E2E8F0] bg-white p-4 sm:p-5 shadow-[0_4px_8px_rgba(15,23,42,0.03),0_8px_16px_rgba(15,23,42,0.02)]"
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
                  post.paragraphs.map((p: string, pIdx: number) => (
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

              {/* Actions Divider */}
              <div className="mt-3.5 h-px w-full bg-slate-100" />

              {/* Action Buttons: Like & Reply */}
              <div className="mt-3 flex items-center gap-6">
                {/* Like Button */}
                <button
                  type="button"
                  className="flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer group"
                  onClick={() =>
                    setLiked((current) => ({
                      ...current,
                      [post.id]: !current[post.id],
                    }))
                  }
                  aria-pressed={isLiked}
                  aria-label={comm?.likePostAria || "Like post"}
                >
                  <span className="relative size-5 overflow-clip">
                    <img
                      src="/images/community/heart.svg"
                      alt=""
                      className={`size-full transition-opacity ${
                        isLiked ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                      }`}
                    />
                  </span>
                  <span className="text-sm font-medium tracking-[0.08px]">
                    {post.likes + (isLiked ? 1 : 0)}
                  </span>
                </button>

                {/* Reply Button */}
                <button
                  type="button"
                  className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer group"
                  onClick={() => toggleReplies(post.id)}
                  aria-expanded={isExpanded}
                  aria-label={isEs ? "Responder a la publicación" : "Reply to post"}
                >
                  <MessageCircle className="size-5 stroke-[1.8] text-slate-400 group-hover:text-blue-600 transition-colors" />
                  <span className="text-sm font-medium tracking-[0.08px]">
                    {postReplies.length > 0
                      ? `${postReplies.length} ${
                          postReplies.length === 1
                            ? isEs
                              ? "respuesta"
                              : "Reply"
                            : isEs
                            ? "respuestas"
                            : "Replies"
                        }`
                      : isEs
                      ? "Responder"
                      : "Reply"}
                  </span>
                </button>
              </div>

              {/* Replies Section (Collapsible Thread) */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3.5 animate-in fade-in duration-200">
                  {/* List of existing replies */}
                  {postReplies.length > 0 && (
                    <div className="space-y-2.5">
                      {postReplies.map((reply) => {
                        const isReplyLiked = Boolean(replyLikes[reply.id]);
                        return (
                          <div
                            key={reply.id}
                            className="flex items-start gap-2.5 rounded-2xl bg-slate-50/80 p-3.5 border border-slate-100 text-left"
                          >
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                              {reply.author.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-slate-900 leading-none">
                                  {reply.author}
                                </span>
                                {reply.badge && (
                                  <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                    {reply.badge}
                                  </span>
                                )}
                                <span className="text-xs text-slate-400 font-medium">
                                  {reply.time}
                                </span>
                              </div>
                              <p className="mt-1.5 text-sm text-slate-700 leading-relaxed font-normal">
                                {reply.content}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleReplyLike(reply.id)}
                              className="flex items-center gap-1 text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                              title={isEs ? "Me gusta" : "Like"}
                            >
                              <span className="text-xs font-semibold">
                                {(reply.likes || 0) + (isReplyLiked ? 1 : 0)}
                              </span>
                              <img
                                src="/images/community/heart.svg"
                                alt=""
                                className={`size-3.5 transition-opacity ${
                                  isReplyLiked ? "opacity-100" : "opacity-40 hover:opacity-80"
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Inline Compose Reply Input */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-3.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs mt-0.5">
                        {(user?.name || "U").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={draft}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          maxLength={200}
                          rows={2}
                          placeholder={
                            isEs
                              ? "Escriba una respuesta de apoyo..."
                              : "Write a supportive reply..."
                          }
                          className="w-full resize-none border-0 p-0 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-0 outline-none leading-relaxed"
                        />

                        {/* Reply Auto-Flag Moderation Disclaimer */}
                        {isReplyFlagged && (
                          <div className="mt-2 mb-1 rounded-xl bg-[#FEEBEB] border border-[#FCD4D4] p-3 flex items-start gap-2.5 text-left animate-in fade-in duration-200">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E05252] text-white font-bold text-[10px] shadow-xs mt-0.5 select-none">
                              !
                            </div>
                            <p className="text-[#DC4C4C] text-xs font-medium leading-relaxed">
                              {isEs
                                ? "Su respuesta contiene síntomas o inquietudes que pueden necesitar atención médica urgente. NephroReach solo brinda educación y no reemplaza a su equipo de diálisis."
                                : "Your reply includes symptoms or concerns that may need urgent medical attention. NephroReach provides education only and does not replace your medical team."}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-2">
                          <span className="text-xs text-slate-400 font-medium">
                            {draft.length}/200
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleReplies(post.id)}
                              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              {isEs ? "Cerrar" : "Close"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddReply(post.id)}
                              disabled={!draft.trim()}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                            >
                              <Send className="h-3.5 w-3.5 -rotate-12" />
                              <span>{isEs ? "Responder" : "Reply"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
        initialCategory={activeTabId}
      />
    </div>
  );
}
