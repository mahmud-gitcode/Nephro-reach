"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, MoreVertical, Plus, Send } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ComposeModal } from "@/features/community/ComposeModal";
import {
  canPublishToCommunity,
  checkFlaggedMedicalContent,
} from "@/features/community/moderation";
import type {
  CommunityTab,
  PostItem,
  ReplyItem,
} from "@/features/community/community.types";
import { useAuth } from "@/features/auth/AuthContext";
import { Alert, Badge, Button, Card, Tabs, TabPanel } from "@/components/ui";
import type { TabItem } from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";

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

    /* Checked here and not only on the button: a disabled button is a
       courtesy, not a gate, and this is the one place a flagged reply would
       actually reach the board. */
    if (!canPublishToCommunity(text ?? "")) return;

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
    <div className="relative mx-auto min-h-[calc(100vh-7rem)] w-full max-w-[900px]">
      <PageTitle href="/dashboard/community" className="mb-stack-lg" />

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

              <div className="mt-stack-md text-body-sm text-fg">
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
                        {/* Says it cannot be posted, not just that something
                          was noticed. The button beside it is disabled, and
                          a warning that does not explain a dead control
                          reads as the app being broken. */}
                        {isReplyFlagged && (
                          <Alert
                            tone="danger"
                            className="mt-stack-sm"
                            title={
                              isEs
                                ? "Esta respuesta no se puede publicar"
                                : "This reply cannot be posted"
                            }
                          >
                            {isEs
                              ? "Menciona síntomas o inquietudes que pueden necesitar atención médica urgente. Habla con tu equipo de diálisis, o llama al 911 si es una emergencia. NephroReach solo brinda educación."
                              : "It mentions symptoms or concerns that may need urgent medical attention. Talk to your dialysis team, or call 911 if this is an emergency. NephroReach provides education only."}
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
                              disabled={!canPublishToCommunity(draft)}
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
