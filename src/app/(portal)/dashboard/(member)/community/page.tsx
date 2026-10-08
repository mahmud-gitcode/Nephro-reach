"use client";

import React, { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { EyeOff, Heart, Plus } from "lucide-react";
import { MoreSolid } from "@/components/icons/solid";
import { useDismiss } from "@/lib/utils/useDismiss";
import { useLanguage } from "@/context/LanguageContext";
import { ComposeModal } from "@/features/community/ComposeModal";
import { routeForCommunity } from "@/features/community/moderation";
import CommunityDisclaimer from "@/features/community/CommunityDisclaimer";
import { useModerationQueue } from "@/features/community/useModerationQueue";
import { approvedPosts } from "@/features/community/moderationQueue.rules";
import type {
  CommunityTab,
  PostItem,
} from "@/features/community/community.types";
import { useAuth } from "@/features/auth/AuthContext";
import {
  Alert,
  Badge,
  Button,
  Card,
  menuItemStyles,
  menuStyles,
  Tabs,
  TabPanel,
} from "@/components/ui";
import type { TabItem } from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";

const defaultTabs: CommunityTab[] = [
  { id: "all", label: "All Posts" },
  { id: "general", label: "General Kidney" },
  { id: "dialysis", label: "Dialysis" },
  { id: "transplant", label: "Kidney Transplant" },
  { id: "caregiver", label: "Caregiver Support" },
  { id: "nutrition", label: "Nutrition & Wellness" },
  { id: "recipes", label: "Recipes" },
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

/* A positive board, not a chat (client decision, 2026-09): members post
   encouragement and like each other's posts, and there are no replies.
   A reply thread under a health post is where advice, arguments and
   "have you tried…" gather, which is what the board is meant to be free
   of. */
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

  const queue = useModerationQueue();

  /* One spelling of the member's name, so a held post is matched back to
     its author by the same string that was stored with it. */
  const authorName = user?.name || (language === "ES" ? "Usted" : "You");

  const [activeTabId, setActiveTabId] = useState<string>("all");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [hiddenPostIds, setHiddenPostIds] = useState<Record<string, boolean>>(
    {},
  );
  /* Shown after posting: the post waits for a moderator. */
  const [heldNotice, setHeldNotice] = useState(false);

  const dictPosts: PostItem[] =
    comm?.posts && Array.isArray(comm.posts) && comm.posts.length > 0
      ? comm.posts
      : defaultPosts;

  /* A held post a moderator approved is on the board like any other, so it
     is folded in here rather than living in a second list the feed would
     have to remember to render. */
  const releasedPosts: PostItem[] = useMemo(
    () =>
      approvedPosts(queue.items).map((item) => ({
        id: item.id,
        author: item.author,
        badge:
          comm?.compose?.memberBadge ||
          (language === "ES" ? "Miembro" : "Member"),
        time:
          comm?.compose?.justNow ||
          (language === "ES" ? "Recién publicado" : "Just now"),
        paragraphs: [item.content],
        hashtags: "",
        likes: 0,
        categoryId: item.categoryId || "general",
        imageUrl: item.imageUrl,
      })),
    [queue.items, comm?.compose?.memberBadge, comm?.compose?.justNow, language],
  );

  const allCombinedPosts = useMemo(() => {
    return [...releasedPosts, ...dictPosts].filter(
      (post) => !hiddenPostIds[post.id],
    );
  }, [releasedPosts, dictPosts, hiddenPostIds]);

  const posts = useMemo(() => {
    if (activeTabId === "all") return allCombinedPosts;
    const filtered = allCombinedPosts.filter(
      (post) => post.categoryId === activeTabId,
    );
    return filtered.length > 0 ? filtered : allCombinedPosts;
  }, [activeTabId, allCombinedPosts]);

  /* Every post waits for a moderator (client, 2026-10-05): nothing goes
     on the board until someone has approved it. A flagged post is held at
     its level; a clean one as routine. */
  const handleAddPost = (
    text: string,
    categoryId?: string,
    imageUrl?: string,
  ) => {
    const route = routeForCommunity(text);
    if (route === "block") return;
    queue.hold(
      {
        kind: "post",
        postId: "",
        author: authorName,
        content: text,
        categoryId:
          categoryId || (activeTabId === "all" ? "general" : activeTabId),
        imageUrl,
      },
      { always: true },
    );
    setHeldNotice(true);
  };

  const handleHidePost = (id: string) => {
    setHiddenPostIds((prev) => ({ ...prev, [id]: true }));
    setMenuOpen(null);
  };

  return (
    <div className="relative mx-auto min-h-[calc(100vh-7rem)] w-full max-w-[900px]">
      <PageTitle href="/dashboard/community" className="mb-stack-lg" />
      {heldNotice ? (
        <Alert
          tone="info"
          className="mb-stack-lg"
          onDismiss={() => setHeldNotice(false)}
        >
          {language === "ES"
            ? "¡Gracias! Su publicación fue enviada a un moderador y aparecerá cuando sea aprobada."
            : "Thank you! Your post was sent to a moderator and will appear once it is approved."}
        </Alert>
      ) : null}

      {/* Standing notice, above the first post: peer support only, nobody
          watching for emergencies, and what members owe each other. */}
      <CommunityDisclaimer />

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
                <PostMenu
                  open={menuOpen === post.id}
                  onOpenChange={(open) => setMenuOpen(open ? post.id : null)}
                  onHide={() => handleHidePost(post.id)}
                  label={comm?.postOptionsAria || "Post options"}
                  hideLabel={comm?.hidePost || "Hide post"}
                />
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
                {post.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a data URL, nothing to optimise
                  <img
                    src={post.imageUrl}
                    alt={
                      language === "ES"
                        ? `Foto de ${post.author}`
                        : `Photo from ${post.author}`
                    }
                    className="mt-stack-md max-h-80 w-full rounded-card-nested object-cover"
                  />
                ) : null}
              </div>

              {/* Actions Divider */}
              <div className="mt-stack-md h-px w-full bg-line-subtle" />

              {/* The one response a post takes: a like. */}
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
              </div>
            </Card>
          );
        })}
      </TabPanel>

      {/* Floating Create Post Button */}
      <Button
        onClick={() => setComposeOpen(true)}
        className="fixed right-6 bottom-8 z-20 px-inset-md shadow-raised max-lg:bottom-24 lg:right-10"
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

/* A post's "⋯" menu: the system's ghost button with the solid dots, and the
   shared floating menu. Closes on a tap outside it or on Escape. */
function PostMenu({
  open,
  onOpenChange,
  onHide,
  label,
  hideLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHide: () => void;
  label: string;
  hideLabel: string;
}) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const wrapRef = useDismiss<HTMLDivElement>(open, close);

  return (
    <div ref={wrapRef} className="relative -my-1.5 shrink-0">
      <Button
        variant="neutral"
        appearance="ghost"
        size="small"
        iconOnly
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <MoreSolid />
      </Button>
      {open ? (
        <div role="menu" className={`${menuStyles} right-0 w-44`}>
          <button
            type="button"
            role="menuitem"
            className={`${menuItemStyles} text-fg hover:bg-surface-sunken`}
            onClick={onHide}
          >
            <EyeOff
              aria-hidden="true"
              className="size-4 shrink-0 text-fg-muted"
            />
            {hideLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
