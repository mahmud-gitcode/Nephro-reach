"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import {
  BookOpen,
  Eye,
  EyeOff,
  FileText,
  Library,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { LIBRARY_CATEGORIES } from "@/features/library/library.options";
import {
  formatDuration,
  formatPublished,
} from "@/features/library/library.rules";
import { useLibraryAdmin } from "@/features/library/useLibraryAdmin";
import { LibraryComposer } from "@/features/library/admin/LibraryComposer";
import { useAuth } from "@/features/auth/AuthContext";
import type {
  LibraryKind,
  LibraryResource,
} from "@/features/library/library.types";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Skeleton,
} from "@/components/ui";
import { useCollabText } from "@/features/community/collabText";
import { useLanguageCode } from "@/context/LanguageContext";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";

/* ==========================================================================
   Library Management
   --------------------------------------------------------------------------
   The admin side of My Library. Class Management owns the 21-day course;
   this owns everything beside it — the two-minute videos, the handouts and
   the short reads a member looks up on their own.

   Publishing is a separate act from saving on purpose. An admin uploading
   next week's handout today should not have it appear on every member shelf
   the moment the file finishes reading.
   ========================================================================== */

const KIND_ICON: Record<LibraryKind, React.ElementType> = {
  video: PlayCircle,
  document: FileText,
  article: BookOpen,
  image: ImageIcon,
};

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  iconTone,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tone: string;
  iconTone: string;
}) {
  return (
    <Card padding="small">
      <div className="flex items-start gap-inline-lg">
        <span
          aria-hidden="true"
          className={`flex size-11 shrink-0 items-center justify-center rounded-card ${tone}`}
        >
          <Icon className={`h-5 w-5 ${iconTone}`} />
        </span>
        <div className="min-w-0">
          <p className="text-body-sm text-fg-muted">{label}</p>
          <p className="mt-stack-xs text-heading-3 text-fg">{value}</p>
          <p className="mt-stack-xs text-body-sm text-fg-muted">{detail}</p>
        </div>
      </div>
    </Card>
  );
}

function kindLabel(kind: LibraryKind, isEs: boolean): string {
  if (kind === "document") return isEs ? "Documento" : "Document";
  if (kind === "article") return isEs ? "Artículo" : "Article";
  if (kind === "image") return isEs ? "Imagen" : "Image";
  return "Video";
}

function categoryLabel(category: string, isEs: boolean): string {
  const entry = LIBRARY_CATEGORIES.find((item) => item.key === category);
  return (isEs ? entry?.labelEs : entry?.labelEn) ?? category;
}

/** Runtime, file size or read time — whichever this kind actually has. */
function metaLabel(resource: LibraryResource, isEs: boolean): string {
  const noFile = isEs ? "Aún sin archivo" : "No file yet";
  if (resource.kind === "video")
    return resource.durationSeconds
      ? formatDuration(resource.durationSeconds)
      : noFile;
  if (resource.kind === "document")
    return (
      (isEs
        ? resource.fileMetaEs || resource.fileMetaEn
        : resource.fileMetaEn) || noFile
    );
  if (resource.kind === "image") return isEs ? "Imagen" : "Image";
  if (resource.readMinutes)
    return isEs
      ? `${resource.readMinutes} min de lectura`
      : `${resource.readMinutes} min read`;
  return isEs ? "Vacío" : "Empty";
}

function ResourceRow({
  resource,
  onEdit,
  onDelete,
  onTogglePublished,
}: {
  resource: LibraryResource;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublished: () => void;
}) {
  const KindIcon = KIND_ICON[resource.kind];
  const isEs = useLanguageCode() === "ES";

  return (
    <li className="flex flex-col gap-inset-sm rounded-card border border-line bg-surface p-inset-md sm:flex-row sm:items-center">
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-control bg-surface-sunken">
        <Image
          src={resource.poster}
          alt=""
          fill
          className="object-cover"
          sizes="96px"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-inline-md">
          <p className="text-label-md text-fg">
            {resource.titleEn || (isEs ? "Sin título" : "Untitled")}
          </p>
          <Badge tone={resource.published ? "success" : "neutral"}>
            {resource.published
              ? isEs
                ? "Publicado"
                : "Published"
              : isEs
                ? "Oculto"
                : "Hidden"}
          </Badge>
          {/* A Spanish-less resource still renders for a Spanish member, it
              just renders in English — worth flagging, not worth blocking. */}
          {!resource.titleEs.trim() ? (
            <Badge tone="warning">{isEs ? "Sin español" : "No Spanish"}</Badge>
          ) : null}
        </div>
        <p className="mt-stack-xs line-clamp-1 text-body-sm text-fg-muted">
          {resource.summaryEn ||
            (isEs ? "Aún no hay resumen." : "No summary yet.")}
        </p>
        <p className="mt-stack-xs flex flex-wrap items-center gap-inline-md text-body-sm text-fg-muted">
          <span className="flex items-center gap-inline-sm">
            <KindIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            {kindLabel(resource.kind, isEs)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{categoryLabel(resource.category, isEs)}</span>
          <span aria-hidden="true">·</span>
          <span>{metaLabel(resource, isEs)}</span>
          <span aria-hidden="true">·</span>
          <span>{formatPublished(resource.publishedAt, isEs)}</span>
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-inline-md">
        <Button
          size="small"
          variant="neutral"
          appearance="fill-stroke"
          onClick={onTogglePublished}
        >
          {resource.published ? (
            <>
              <EyeOff aria-hidden="true" className="size-4 shrink-0" />
              {isEs ? "Despublicar" : "Unpublish"}
            </>
          ) : (
            <>
              <Eye aria-hidden="true" className="size-4 shrink-0" />
              {isEs ? "Publicar" : "Publish"}
            </>
          )}
        </Button>
        <Button
          size="small"
          variant="neutral"
          appearance="fill-stroke"
          onClick={onEdit}
        >
          <Pencil aria-hidden="true" className="size-4 shrink-0" />
          {isEs ? "Editar" : "Edit"}
        </Button>
        <Button
          size="small"
          variant="danger"
          appearance="stroke"
          onClick={onDelete}
          aria-label={
            isEs
              ? `Eliminar ${resource.titleEn || "recurso"}`
              : `Delete ${resource.titleEn || "resource"}`
          }
        >
          <Trash2 aria-hidden="true" className="size-4 shrink-0" />
        </Button>
      </div>
    </li>
  );
}

export default function ManageLibraryPage() {
  const { user } = useAuth();
  const t = useCollabText();
  const isEs = useLanguageCode() === "ES";
  const {
    resources,
    totals,
    saveResource,
    deleteResource,
    setPublished,
    isPending,
    error,
    refetch,
    saveError,
    dismissSaveError,
    isSaving,
  } = useLibraryAdmin();

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<LibraryResource | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<LibraryResource | null>(
    null,
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return resources;
    return resources.filter((resource) =>
      `${resource.titleEn} ${resource.titleEs} ${resource.summaryEn}`
        .toLowerCase()
        .includes(needle),
    );
  }, [resources, query]);

  const closeEditor = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSave = (resource: LibraryResource) => {
    saveResource(resource);
    closeEditor();
  };

  return (
    <>
      <div className="mb-stack-lg">
        <h1 className="text-heading-1 text-fg">
          {isEs ? "Gestión de la Biblioteca" : "Library Management"}
        </h1>
        <p className="mt-stack-xs text-body-md text-fg-muted">
          {isEs
            ? "Publique videos cortos, folletos y consejos escritos para que los miembros los exploren por su cuenta. Es independiente del curso de 21 días de Gestión de Clases."
            : "Post short videos, handouts and written tips for members to browse on their own. Separate from the 21-day course in Class Management."}
        </p>
      </div>

      <section className="grid grid-cols-1 gap-inset-md sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={isEs ? "Publicaciones" : "Posts"}
          value={totals.total}
          detail={
            isEs
              ? `${totals.drafts} ocultas para los miembros`
              : `${totals.drafts} hidden from members`
          }
          icon={Library}
          tone="bg-brand-100"
          iconTone="text-fg-brand"
        />
        <SummaryCard
          label={isEs ? "Publicadas" : "Published"}
          value={totals.published}
          detail={
            isEs
              ? "Visibles en el estante de los miembros"
              : "Live on the member shelf"
          }
          icon={Eye}
          tone="bg-success-100"
          iconTone="text-success"
        />
        <SummaryCard
          label="Videos"
          value={totals.videos}
          detail={
            isEs
              ? `${totals.documents} documentos`
              : `${totals.documents} documents`
          }
          icon={PlayCircle}
          tone="bg-warning-100"
          iconTone="text-warning"
        />
        <SummaryCard
          label={isEs ? "Artículos" : "Articles"}
          value={totals.articles}
          detail={
            isEs ? "Escritos en ambos idiomas" : "Written in both languages"
          }
          icon={BookOpen}
          tone="bg-accent-100"
          iconTone="text-accent-fg"
        />
      </section>

      {saveError ? (
        <Alert
          tone="danger"
          title={isEs ? "Ese cambio no se guardó" : "That change did not save"}
          onDismiss={dismissSaveError}
          className="mt-stack-lg"
        >
          {saveError instanceof Error && saveError.message
            ? saveError.message
            : t("library.saveFailed")}
        </Alert>
      ) : null}

      <Card as="section" className="mt-stack-lg">
        <div className="flex flex-col gap-inset-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-heading-4 text-fg">
              {isEs ? "Publicaciones" : "Posts"}
            </h2>
            <p className="mt-0.5 text-body-md text-fg-muted">
              {isEs
                ? "Las más recientes primero. Las publicaciones ocultas no aparecen en el estante de los miembros."
                : "Newest first. Hidden posts stay off the member shelf."}
            </p>
          </div>

          <div className="flex flex-col gap-inline-md sm:flex-row sm:items-center">
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={isEs ? "Buscar publicaciones..." : "Search posts..."}
              aria-label={isEs ? "Buscar recursos" : "Search resources"}
              leadingIcon={<Search aria-hidden="true" className="h-4 w-4" />}
              className="sm:w-[277px]"
            />
            <Button onClick={() => setCreating(true)}>
              <Plus aria-hidden="true" className="size-4 shrink-0" />
              {isEs ? "Crear publicación" : "Create post"}
            </Button>
          </div>
        </div>

        <AsyncSection
          pending={isPending}
          error={error}
          onRetry={canRetry(error) ? refetch : undefined}
          isEmpty={visible.length === 0}
          errorTitle={errorTitleFor(
            error,
            isEs ? "La biblioteca no se cargó" : "The library did not load",
            isEs ? "es" : "en",
          )}
          errorMessage={errorMessageFor(error, undefined, isEs ? "es" : "en")}
          skeleton={
            <div className="mt-stack-lg space-y-stack-sm">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} height={96} />
              ))}
            </div>
          }
          empty={
            <EmptyState
              className="mt-stack-lg"
              icon={<Library aria-hidden="true" />}
              title={
                query.trim()
                  ? isEs
                    ? "Nada coincide con esa búsqueda"
                    : "Nothing matches that search"
                  : isEs
                    ? "Aún no hay publicaciones"
                    : "No posts yet"
              }
              description={
                query.trim()
                  ? isEs
                    ? "Pruebe con otra palabra o borre la búsqueda."
                    : "Try a different word, or clear the search."
                  : isEs
                    ? "Escriba algo, adjunte un video o folleto y publíquelo para que los miembros lo consulten."
                    : "Write something, attach a video or handout, and post it for members to look up."
              }
              action={
                query.trim() ? undefined : (
                  <Button onClick={() => setCreating(true)}>
                    <Plus aria-hidden="true" className="size-4 shrink-0" />
                    {isEs ? "Crear publicación" : "Create post"}
                  </Button>
                )
              }
            />
          }
        >
          <ul className="mt-stack-lg space-y-stack-sm">
            {visible.map((resource) => (
              <ResourceRow
                key={resource.id}
                resource={resource}
                onEdit={() => setEditing(resource)}
                onDelete={() => setPendingDelete(resource)}
                onTogglePublished={() =>
                  setPublished(resource.id, !resource.published)
                }
              />
            ))}
          </ul>
        </AsyncSection>
      </Card>

      {creating || editing ? (
        <LibraryComposer
          resource={editing ?? undefined}
          onPost={handleSave}
          onClose={closeEditor}
          saving={isSaving}
          authorName={user?.name}
        />
      ) : null}

      {/* Deleting is the one action here with no undo, so it asks. */}
      {pendingDelete ? (
        <Modal
          open
          size="small"
          closeOnBackdrop={false}
          onClose={() => setPendingDelete(null)}
          title={isEs ? "¿Eliminar este recurso?" : "Delete this resource?"}
          description={
            isEs
              ? `"${pendingDelete.titleEn || "Sin título"}" se quitará de la biblioteca para todos. Esta acción no se puede deshacer.`
              : `"${pendingDelete.titleEn || "Untitled"}" will be removed from the library for everyone. This cannot be undone.`
          }
          footer={
            <div className="flex flex-wrap items-center justify-end gap-inline-md">
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setPendingDelete(null)}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteResource(pendingDelete.id);
                  setPendingDelete(null);
                }}
              >
                {isEs ? "Eliminar" : "Delete"}
              </Button>
            </div>
          }
        />
      ) : null}
    </>
  );
}
