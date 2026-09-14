"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import {
  FileText,
  Heart,
  MessageCircle,
  MoreVertical,
  Plus,
  Send,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import {
  Alert,
  Badge,
  Button,
  Card,
  Chip,
  ChipGroup,
  Modal,
  Tabs,
  TabPanel,
} from "@/components/ui";
import type { TabItem } from "@/components/ui";

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
  {
    id: "transplant",
    labelEn: "Kidney Transplant",
    labelEs: "Trasplante Renal",
  },
  {
    id: "nutrition",
    labelEn: "Nutrition & Wellness",
    labelEs: "Nutrición y Bienestar",
  },
  {
    id: "caregiver",
    labelEn: "Caregiver Support",
    labelEs: "Apoyo al Cuidador",
  },
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
    initialCategory === "all" ? "general" : initialCategory,
  );

  const isFlagged = checkFlaggedMedicalContent(body);

  const canPost = Boolean(body.trim()) && !isFlagged;

  const handleSubmit = () => {
    if (!canPost) return;
    onPost(body.trim(), selectedCategory);
    setBody("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={isEs ? "Compartir con la Comunidad" : "Share with the Community"}
      footer={
        <Button
          onClick={handleSubmit}
          disabled={!canPost}
          variant="neutral"
          appearance="fill"
          className="w-full"
        >
          <Send aria-hidden="true" className="-rotate-12" />
          {isEs ? "Publicar en la Comunidad" : "Post to Community"}
        </Button>
      }
    >
      <div className="space-y-stack-lg">
        {/* 1. Community Guidelines — part of the page, not a response to
            anything the member did, so it is not announced. */}
        <Alert
          tone="info"
          live={false}
          title={isEs ? "Pautas de la Comunidad" : "Community Guidelines"}
        >
          {isEs
            ? "Esta comunidad es solo para educación y apoyo. Por favor, no publique consejos médicos, cambios en medicamentos, síntomas de emergencia o instrucciones de tratamiento."
            : "This community is for education and support only. Please do not post medical advice, medication changes, emergency symptoms, or treatment instructions."}
        </Alert>

        {/* 2. Category — one of six, so the group is marked single-select. */}
        <ChipGroup
          selection="single"
          label={isEs ? "Categoría" : "Category"}
          className="gap-inline-md"
        >
          {COMPOSE_CATEGORIES.map((cat) => (
            <Chip
              key={cat.id}
              selected={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {isEs ? cat.labelEs : cat.labelEn}
            </Chip>
          ))}
        </ChipGroup>

        {/* 3. Body, with the counter inside the same focus ring as the field */}
        <div className="flex min-h-[160px] flex-col justify-between rounded-card border border-line bg-surface p-inset-md transition-colors duration-150 ease-standard focus-within:border-primary-edge focus-within:ring-2 focus-within:ring-ring">
          <label htmlFor="compose-body" className="sr-only">
            {isEs ? "Su mensaje" : "Your message"}
          </label>
          <textarea
            id="compose-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={200}
            rows={4}
            aria-describedby="compose-count"
            placeholder={
              isEs
                ? "Este es un espacio de apoyo, no para instrucciones médicas."
                : "This is a support space, not for medical instructions."
            }
            className="w-full flex-grow resize-none border-0 p-0 text-body-md text-fg-secondary outline-none placeholder:text-fg-muted"
          />
          <p
            id="compose-count"
            className="mt-stack-sm flex items-center justify-end gap-inline-sm text-caption text-fg-muted select-none"
          >
            <FileText aria-hidden="true" className="h-4 w-4" />
            <span>{body.length}/200</span>
          </p>
        </div>

        {/* 4. Auto-flag notice. This one IS a response to what was typed, so
            it keeps the live region <Alert> gives it by default. */}
        {isFlagged && (
          <Alert tone="danger">
            <p>
              {isEs
                ? "Su mensaje incluye síntomas o inquietudes que pueden necesitar atención médica urgente. NephroReach solo brinda educación y no diagnostica, trata ni reemplaza a su equipo de diálisis. Comuníquese con su clínica de diálisis, nefrólogo o llame al 911 si esto puede ser una emergencia."
                : "Your message includes symptoms or concerns that may need urgent medical attention. NephroReach provides education only and does not diagnose, treat, or replace your dialysis team. Please contact your dialysis clinic, nephrologist, or call 911 if this may be an emergency."}
            </p>
            <p className="mt-stack-sm font-semibold">
              {isEs
                ? "Este mensaje no se puede publicar. Edite el texto para quitar los detalles médicos urgentes."
                : "This message cannot be posted. Please edit it to remove the urgent medical details."}
            </p>
          </Alert>
        )}
      </div>
    </Modal>
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
      content:
        "Great milestone! Gentle, regular exercise has wonderful benefits for blood pressure and energy.",
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
      content:
        "So inspiring to see your progress! Sharing these wins really encourages the whole community.",
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

  const tabItems: ReadonlyArray<TabItem> = tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
  }));

  const [activeTabId, setActiveTabId] = useState<string>("all");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [hiddenPostIds, setHiddenPostIds] = useState<Record<string, boolean>>(
    {},
  );
  const [userPosts, setUserPosts] = useState<PostItem[]>([]);

  // Reply States
  const [replies, setReplies] =
    useState<Record<string, ReplyItem[]>>(defaultReplies);
  const [expandedReplies, setExpandedReplies] = useState<
    Record<string, boolean>
  >({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyLikes, setReplyLikes] = useState<Record<string, boolean>>({});

  const dictPosts: PostItem[] =
    comm?.posts && Array.isArray(comm.posts) && comm.posts.length > 0
      ? comm.posts
      : defaultPosts;

  const allCombinedPosts = useMemo(() => {
    return [...userPosts, ...dictPosts].filter(
      (post) => !hiddenPostIds[post.id],
    );
  }, [userPosts, dictPosts, hiddenPostIds]);

  const posts = useMemo(() => {
    if (activeTabId === "all") return allCombinedPosts;
    const filtered = allCombinedPosts.filter(
      (post) => post.categoryId === activeTabId,
    );
    return filtered.length > 0 ? filtered : allCombinedPosts;
  }, [activeTabId, allCombinedPosts]);

  const handleAddPost = (text: string, categoryId?: string) => {
    const newPost: PostItem = {
      id: `user-${Date.now()}`,
      author: user?.name || (language === "ES" ? "Usted" : "You"),
      badge:
        comm?.compose?.memberBadge ||
        (language === "ES" ? "Miembro" : "Member"),
      time:
        comm?.compose?.justNow ||
        (language === "ES" ? "Recién publicado" : "Just now"),
      paragraphs: [text],
      hashtags: "",
      likes: 0,
      categoryId:
        categoryId || (activeTabId === "all" ? "general" : activeTabId),
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
      badge:
        comm?.compose?.memberBadge ||
        (language === "ES" ? "Miembro" : "Member"),
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
      {/* Category Tabs — six separate tab stops became one, with arrow
          keys moving between categories. */}
      <div className="mb-stack-lg overflow-x-auto">
        <Tabs
          items={tabItems}
          value={activeTabId}
          onChange={setActiveTabId}
          variant="pill"
          label={isEs ? "Categorías de la comunidad" : "Community categories"}
        />
      </div>

      {/* Feed Posts */}
      <TabPanel
        id={activeTabId}
        value={activeTabId}
        className="flex flex-col gap-inline-md"
      >
        {posts.map((post) => {
          const isLiked = Boolean(liked[post.id]);
          const postReplies = replies[post.id] || [];
          const isExpanded = Boolean(expandedReplies[post.id]);
          const draft = replyDrafts[post.id] || "";
          const isReplyFlagged = checkFlaggedMedicalContent(draft);

          return (
            <Card key={post.id} as="article">
              <div className="flex items-start gap-inline-md">
                <div className="flex min-w-0 flex-1 items-center gap-inline-md">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-pill">
                    <Image
                      src="/images/community/avatar.png"
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-inline-lg">
                      <p className="text-label-lg text-fg">{post.author}</p>
                      <Badge tone="neutral">{post.badge}</Badge>
                    </div>
                    <p className="mt-stack-xs text-body-sm text-fg-muted">
                      {post.time}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  {/* Was a bare <img> inside a button with no visible focus
                      state; now a real icon button with aria-expanded. */}
                  <Button
                    variant="neutral"
                    appearance="stroke"
                    size="small"
                    className="px-inset-xs"
                    aria-label={comm?.postOptionsAria || "Post options"}
                    aria-expanded={menuOpen === post.id}
                    onClick={() =>
                      setMenuOpen((current) =>
                        current === post.id ? null : post.id,
                      )
                    }
                  >
                    <MoreVertical aria-hidden="true" />
                  </Button>
                  {menuOpen === post.id && (
                    <Card
                      tone="raised"
                      padding="none"
                      className="absolute right-0 z-10 mt-stack-xs w-36 py-inset-xs"
                    >
                      <button
                        type="button"
                        className="block w-full cursor-pointer px-inset-sm py-inset-xs text-left text-body-sm text-fg-secondary transition-colors duration-150 ease-standard hover:bg-surface-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                        onClick={() => handleHidePost(post.id)}
                      >
                        {comm?.hidePost || "Hide post"}
                      </button>
                    </Card>
                  )}
                </div>
              </div>

              <div className="mt-stack-md measure text-body-sm text-fg">
                {post.paragraphs && post.paragraphs.length > 0 ? (
                  post.paragraphs.map((p: string, pIdx: number) => (
                    <p key={pIdx} className={pIdx > 0 ? "mt-stack-lg" : ""}>
                      {p}
                      {pIdx === post.paragraphs.length - 1 && post.hashtags && (
                        <span className="ml-1 text-fg-brand">
                          {post.hashtags}
                        </span>
                      )}
                    </p>
                  ))
                ) : (
                  <p />
                )}
              </div>

              {/* Actions Divider */}
              <div className="mt-stack-md h-px w-full bg-line-subtle" />

              {/* Action Buttons: Like & Reply */}
              <div className="mt-stack-md flex items-center gap-inset-lg">
                {/* Like Button */}
                <button
                  type="button"
                  className="group flex cursor-pointer items-center gap-inline-md rounded-control-small text-fg-muted transition-colors duration-150 ease-standard hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  onClick={() =>
                    setLiked((current) => ({
                      ...current,
                      [post.id]: !current[post.id],
                    }))
                  }
                  aria-pressed={isLiked}
                  aria-label={comm?.likePostAria || "Like post"}
                >
                  {/* Filled when liked — shape, not only colour, carries
                      the state, which an opacity change alone did not. */}
                  <Heart
                    aria-hidden="true"
                    className={`size-5 transition-colors duration-150 ease-standard ${
                      isLiked ? "fill-current text-danger" : ""
                    }`}
                  />
                  <span className="text-label-md">
                    {post.likes + (isLiked ? 1 : 0)}
                  </span>
                </button>

                {/* Reply Button */}
                <button
                  type="button"
                  className="group flex cursor-pointer items-center gap-inline-md rounded-control-small text-fg-muted transition-colors duration-150 ease-standard hover:text-fg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  onClick={() => toggleReplies(post.id)}
                  aria-expanded={isExpanded}
                  aria-label={
                    isEs ? "Responder a la publicación" : "Reply to post"
                  }
                >
                  <MessageCircle
                    aria-hidden="true"
                    className="size-5 text-fg-subtle transition-colors duration-150 ease-standard group-hover:text-fg-brand"
                  />
                  <span className="text-label-md">
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
                <div className="mt-stack-lg space-y-stack-md border-t border-line-subtle pt-inset-md">
                  {/* List of existing replies */}
                  {postReplies.length > 0 && (
                    <div className="space-y-stack-sm">
                      {postReplies.map((reply) => {
                        const isReplyLiked = Boolean(replyLikes[reply.id]);
                        return (
                          <Card
                            key={reply.id}
                            tone="sunken"
                            padding="small"
                            className="flex items-start gap-inline-md text-left"
                          >
                            <span
                              aria-hidden="true"
                              className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-pill bg-primary-soft text-label-sm text-primary-fg"
                            >
                              {reply.author.slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-inline-md">
                                <span className="text-label-md text-fg">
                                  {reply.author}
                                </span>
                                {reply.badge && (
                                  <Badge tone="neutral" variant="outline">
                                    {reply.badge}
                                  </Badge>
                                )}
                                <span className="text-caption text-fg-subtle">
                                  {reply.time}
                                </span>
                              </div>
                              <p className="mt-stack-xs text-body-sm text-fg-secondary">
                                {reply.content}
                              </p>
                            </div>
                            {/* The count and the heart were the only cue that
                                this toggles; aria-pressed now says so too. */}
                            <button
                              type="button"
                              onClick={() => handleToggleReplyLike(reply.id)}
                              aria-pressed={isReplyLiked}
                              aria-label={isEs ? "Me gusta" : "Like"}
                              className="flex cursor-pointer items-center gap-inline-xs rounded-control-small p-1 text-fg-subtle transition-colors duration-150 ease-standard hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                              <span className="text-label-sm">
                                {(reply.likes || 0) + (isReplyLiked ? 1 : 0)}
                              </span>
                              <Heart
                                aria-hidden="true"
                                className={`size-3.5 transition-colors duration-150 ease-standard ${
                                  isReplyLiked ? "fill-current text-danger" : ""
                                }`}
                              />
                            </button>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* Inline Compose Reply Input */}
                  <div className="rounded-card border border-line bg-surface p-inset-sm transition-colors duration-150 ease-standard focus-within:border-primary-edge focus-within:ring-2 focus-within:ring-ring">
                    <div className="flex items-start gap-inline-lg">
                      <span
                        aria-hidden="true"
                        className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-pill bg-primary-solid text-label-sm text-primary-on-solid"
                      >
                        {(user?.name || "U").slice(0, 2).toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <label htmlFor={`reply-${post.id}`} className="sr-only">
                          {isEs ? "Su respuesta" : "Your reply"}
                        </label>
                        <textarea
                          id={`reply-${post.id}`}
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
                          className="w-full resize-none border-0 p-0 text-body-sm text-fg-secondary outline-none placeholder:text-fg-muted"
                        />

                        {/* Reply Auto-Flag Moderation Disclaimer */}
                        {isReplyFlagged && (
                          <Alert tone="danger" className="mt-stack-sm">
                            {isEs
                              ? "Su respuesta contiene síntomas o inquietudes que pueden necesitar atención médica urgente. NephroReach solo brinda educación y no reemplaza a su equipo de diálisis."
                              : "Your reply includes symptoms or concerns that may need urgent medical attention. NephroReach provides education only and does not replace your medical team."}
                          </Alert>
                        )}

                        <div className="mt-stack-sm flex items-center justify-between border-t border-line-subtle pt-inset-xs">
                          <span className="text-caption text-fg-muted">
                            {draft.length}/200
                          </span>
                          <div className="flex items-center gap-inline-md">
                            <Button
                              variant="neutral"
                              appearance="stroke"
                              size="small"
                              onClick={() => toggleReplies(post.id)}
                            >
                              {isEs ? "Cerrar" : "Close"}
                            </Button>
                            <Button
                              size="small"
                              onClick={() => handleAddReply(post.id)}
                              disabled={!draft.trim()}
                            >
                              <Send aria-hidden="true" className="-rotate-12" />
                              {isEs ? "Responder" : "Reply"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </TabPanel>

      {/* Floating Create Post Button */}
      <Button
        onClick={() => setComposeOpen(true)}
        className="fixed right-6 bottom-8 z-20 px-inset-md shadow-raised lg:right-10"
        aria-label={comm?.createPostAria || "Create a new post"}
      >
        <Plus aria-hidden="true" />
      </Button>

      {/* Compose Modal */}
      {/* Keyed on the category so opening the composer starts from the tab
          the member is looking at, without an effect syncing it. */}
      <ComposeModal
        key={composeOpen ? `compose-${activeTabId}` : "compose-closed"}
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onPost={handleAddPost}
        initialCategory={activeTabId}
      />
    </div>
  );
}
