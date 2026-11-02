"use client";

import React, { useCallback, useMemo, useState } from "react";
import { EyeOff, Heart, MessageSquare, Plus } from "lucide-react";
import { MoreSolid } from "@/components/icons/solid";
import { useDismiss } from "@/lib/utils/useDismiss";
import { isSafeFileUrl } from "@/lib/utils/safeUrl";
import { useLanguage } from "@/context/LanguageContext";
import { ComposeModal } from "@/features/community/ComposeModal";
import { routeForCommunity } from "@/features/community/moderation";
import CommunityDisclaimer from "@/features/community/CommunityDisclaimer";
import { ServerSafetyNotice } from "@/features/community/ServerSafetyNotice";
import {
  useCommunityBoard,
  useCreatePost,
  useLikePost,
  usePostImage,
} from "@/features/community/useCommunity";
import type { ApiCreatePostReply } from "@/features/community/community.api";
import type { CommunityTab } from "@/features/community/community.types";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  Card,
  EmptyState,
  menuItemStyles,
  menuStyles,
  Skeleton,
  Tabs,
  TabPanel,
} from "@/components/ui";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
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

/* A positive board, not a chat (client decision, 2026-09): members post
   encouragement and like each other's posts, and there are no replies.
   Phase 12: the posts, likes and the moderation hold are the server's. A
   failed read shows the error, never sample posts; every post waits for a
   moderator, and what the server said about it (safety guidance, a privacy
   notice) is shown from its reply.
   A reply thread under a health post is where advice, arguments and
   "have you tried…" gather, which is what the board is meant to be free
   of. */
export default function CommunityPage() {
  const { dictionary, language } = useLanguage();
  const isEs = language === "ES";
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
  const board = useCommunityBoard(activeTabId, {
    badge:
      comm?.compose?.memberBadge || (language === "ES" ? "Miembro" : "Member"),
    isEs,
  });
  const create = useCreatePost();
  const like = useLikePost();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [hiddenPostIds, setHiddenPostIds] = useState<Record<string, boolean>>(
    {},
  );
  /* Shown after posting: the post waits for a moderator, with whatever
     the server said about it. */
  const [heldNotice, setHeldNotice] = useState<ApiCreatePostReply | null>(null);

  /* The server filters by category. An empty category shows the empty
     state (it used to fall back to every post, which only made sense with
     sample content). */
  const posts = useMemo(
    () => board.items.filter((post) => !hiddenPostIds[post.id]),
    [board.items, hiddenPostIds],
  );

  /* Every post waits for a moderator (client, 2026-10-05): the server holds
     it and screens it. `block` only means the text is empty. */
  const handleAddPost = async (
    text: string,
    categoryId: string,
    photo?: Blob,
  ) => {
    if (routeForCommunity(text) === "block") return;
    const reply = await create.mutateAsync({
      body: text,
      categoryId:
        categoryId || (activeTabId === "all" ? "general" : activeTabId),
      photo,
    });
    setHeldNotice(reply);
  };

  const handleHidePost = (id: string) => {
    setHiddenPostIds((prev) => ({ ...prev, [id]: true }));
    setMenuOpen(null);
  };

  return (
    <div className="relative mx-auto min-h-[calc(100vh-7rem)] w-full max-w-[900px]">
      <PageTitle href="/dashboard/community" className="mb-stack-lg" />
      {heldNotice ? (
        <div className="mb-stack-lg space-y-stack-md">
          <Alert tone="info" onDismiss={() => setHeldNotice(null)}>
            {language === "ES"
              ? "¡Gracias! Su publicación fue enviada a un moderador y aparecerá cuando sea aprobada."
              : "Thank you! Your post was sent to a moderator and will appear once it is approved."}
          </Alert>
          <ServerSafetyNotice
            safety={heldNotice.safety}
            privacyNotice={heldNotice.privacyNotice}
            isEs={isEs}
          />
        </div>
      ) : null}

      {like.error ? (
        <Alert
          tone="warning"
          className="mb-stack-lg"
          onDismiss={() => like.reset()}
        >
          {isEs
            ? "No pudimos guardar su me gusta. Inténtelo de nuevo."
            : "We could not save your like. Please try again."}
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
        <AsyncSection
          pending={board.isPending}
          error={board.error}
          onRetry={canRetry(board.error) ? board.refetch : undefined}
          errorTitle={errorTitleFor(
            board.error,
            isEs
              ? "Las publicaciones no se cargaron"
              : "The posts did not load",
            isEs ? "es" : "en",
          )}
          errorMessage={errorMessageFor(
            board.error,
            undefined,
            isEs ? "es" : "en",
          )}
          isEmpty={posts.length === 0}
          empty={
            <EmptyState
              icon={<MessageSquare aria-hidden="true" />}
              title={
                isEs ? "Aún no hay publicaciones aquí" : "No posts here yet"
              }
              description={
                isEs
                  ? "Comparta algo alentador: un moderador lo revisa antes de que aparezca."
                  : "Share something encouraging: a moderator reviews it before it appears."
              }
            />
          }
          skeleton={
            <div className="flex flex-col gap-inline-md">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} height={160} />
              ))}
            </div>
          }
        >
          {posts.map((post) => {
            const isLiked = Boolean(post.liked);

            return (
              <Card key={post.id} as="article">
                <div className="flex items-start gap-inline-md">
                  <div className="flex min-w-0 flex-1 items-center gap-inline-md">
                    {/* Initials, not one stock photo shared by every
                      author. */}
                    <div
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-surface-brand-subtle text-label-md text-fg-brand"
                    >
                      {post.author
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
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
                        {pIdx === post.paragraphs.length - 1 &&
                          post.hashtags && (
                            <span className="ml-1 text-fg-brand">
                              {post.hashtags}
                            </span>
                          )}
                      </p>
                    ))
                  ) : (
                    <p />
                  )}
                  {post.hasImage ? (
                    <PostPhoto
                      postId={post.id}
                      alt={
                        language === "ES"
                          ? `Foto de ${post.author}`
                          : `Photo from ${post.author}`
                      }
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
                    className="group -my-2.5 flex min-h-11 cursor-pointer items-center gap-inline-md rounded-control-small text-fg-muted transition-colors duration-150 ease-standard hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    onClick={() =>
                      like.mutate({ postId: post.id, liked: !isLiked })
                    }
                    disabled={like.isPending}
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
                    <span className="text-label-md">{post.likes}</span>
                  </button>
                </div>
              </Card>
            );
          })}
          {board.hasMore ? (
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={board.loadMore}
              loading={board.isLoadingMore}
            >
              {isEs ? "Ver más" : "Load more"}
            </Button>
          ) : null}
        </AsyncSection>
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

/* A post's photo: a short-lived link from the server, fetched when the post
   is shown, never stored. Nothing renders until the link arrives. */
function PostPhoto({ postId, alt }: { postId: string; alt: string }) {
  const image = usePostImage(postId, { enabled: true });
  const url = image.data?.url;
  if (!isSafeFileUrl(url)) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a presigned storage link, nothing to optimise
    <img
      src={url}
      alt={alt}
      className="mt-stack-md max-h-80 w-full rounded-card-nested object-cover"
    />
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
