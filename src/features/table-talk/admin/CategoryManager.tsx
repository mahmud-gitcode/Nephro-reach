"use client";

import React, { useState } from "react";
import { ArchiveRestore, Archive, Pencil, Plus, Tag } from "lucide-react";
import { episodeCountFor } from "../tableTalk.rules";
import type { TableTalkCategory, TableTalkEpisode } from "../tableTalk.types";
import {
  Alert,
  Badge,
  Button,
  Card,
  FormField,
  Input,
  Modal,
} from "@/components/ui";
import { useLanguageCode } from "@/context/LanguageContext";

/* ==========================================================================
   Category manager
   --------------------------------------------------------------------------
   The brief asks that NephroReach can add topics later "without requiring the
   developer", so categories are records rather than a constant in the code.

   Categories are archived, never deleted. Deleting one would leave every
   episode still carrying its id pointing at nothing, and those episodes would
   quietly lose a topic nobody noticed they had.
   ========================================================================== */

export function CategoryManager({
  categories,
  episodes,
  onAdd,
  onRename,
  onArchive,
  onClose,
}: {
  categories: TableTalkCategory[];
  episodes: TableTalkEpisode[];
  onAdd: (labelEn: string, labelEs: string) => void;
  onRename: (id: string, labelEn: string, labelEs: string) => void;
  onArchive: (id: string, archived: boolean) => void;
  onClose: () => void;
}) {
  const isEs = useLanguageCode() === "ES";
  const [newEn, setNewEn] = useState("");
  const [newEs, setNewEs] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editEn, setEditEn] = useState("");
  const [editEs, setEditEs] = useState("");

  const duplicate =
    newEn.trim().length > 0 &&
    categories.some(
      (entry) =>
        entry.labelEn.trim().toLowerCase() === newEn.trim().toLowerCase(),
    );

  const add = () => {
    if (!newEn.trim() || duplicate) return;
    onAdd(newEn, newEs);
    setNewEn("");
    setNewEs("");
  };

  const ordered = [...categories].sort(
    (a, b) =>
      Number(a.archived) - Number(b.archived) ||
      a.order - b.order ||
      a.labelEn.localeCompare(b.labelEn),
  );

  return (
    <Modal
      open
      size="wide"
      onClose={onClose}
      title={isEs ? "Temas" : "Topics"}
      description={
        isEs
          ? "Los miembros exploran Table Talk por estos temas. Agregue los suyos en cualquier momento."
          : "Members browse Table Talk by these. Add your own at any time."
      }
      footer={<Button onClick={onClose}>{isEs ? "Listo" : "Done"}</Button>}
    >
      <div className="space-y-stack-lg">
        <Card tone="flat" padding="small" className="space-y-stack-md">
          <h3 className="text-heading-4 text-fg">
            {isEs ? "Agregar un tema" : "Add a topic"}
          </h3>
          <div className="flex flex-wrap items-end gap-inline-md">
            <FormField
              label={isEs ? "Nombre (inglés)" : "Name (English)"}
              className="flex-1"
              error={
                duplicate
                  ? isEs
                    ? "Ese tema ya existe."
                    : "That topic already exists."
                  : undefined
              }
            >
              {(props) => (
                <Input
                  {...props}
                  value={newEn}
                  onChange={(event) => setNewEn(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      add();
                    }
                  }}
                  placeholder="Vascular Access"
                />
              )}
            </FormField>
            <FormField
              label={isEs ? "Nombre (español)" : "Name (Spanish)"}
              optionalLabel={isEs ? "opcional" : "optional"}
              className="flex-1"
            >
              {(props) => (
                <Input
                  {...props}
                  value={newEs}
                  onChange={(event) => setNewEs(event.target.value)}
                  placeholder="Acceso Vascular"
                />
              )}
            </FormField>
            <Button onClick={add} disabled={!newEn.trim() || duplicate}>
              <Plus aria-hidden="true" className="size-4 shrink-0" />
              {isEs ? "Agregar" : "Add"}
            </Button>
          </div>
        </Card>

        <ul className="space-y-stack-xs">
          {ordered.map((category) => {
            const count = episodeCountFor(episodes, category.id);
            const isEditing = editing === category.id;

            return (
              <li
                key={category.id}
                className="rounded-card border border-line bg-surface p-inset-sm"
              >
                {isEditing ? (
                  <div className="flex flex-wrap items-end gap-inline-md">
                    <FormField
                      label={isEs ? "Nombre (inglés)" : "Name (English)"}
                      className="flex-1"
                    >
                      {(props) => (
                        <Input
                          {...props}
                          value={editEn}
                          onChange={(event) => setEditEn(event.target.value)}
                        />
                      )}
                    </FormField>
                    <FormField
                      label={isEs ? "Nombre (español)" : "Name (Spanish)"}
                      className="flex-1"
                    >
                      {(props) => (
                        <Input
                          {...props}
                          value={editEs}
                          onChange={(event) => setEditEs(event.target.value)}
                        />
                      )}
                    </FormField>
                    <Button
                      onClick={() => {
                        onRename(category.id, editEn, editEs);
                        setEditing(null);
                      }}
                    >
                      {isEs ? "Guardar" : "Save"}
                    </Button>
                    <Button
                      variant="neutral"
                      appearance="fill-stroke"
                      onClick={() => setEditing(null)}
                    >
                      {isEs ? "Cancelar" : "Cancel"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-inline-md">
                    <div className="flex min-w-0 items-center gap-inline-md">
                      <Tag
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-fg-muted"
                      />
                      <div className="min-w-0">
                        <p className="text-label-md text-fg">
                          {category.labelEn}
                        </p>
                        <p className="text-body-sm text-fg-muted">
                          {category.labelEs}
                          {" · "}
                          {isEs ? (
                            `${count} episodio${count === 1 ? "" : "s"}`
                          ) : (
                            <>
                              {count} episode{count === 1 ? "" : "s"}
                            </>
                          )}
                        </p>
                      </div>
                      {category.archived ? (
                        <Badge tone="neutral">
                          {isEs ? "Archivado" : "Archived"}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-inline-md">
                      <Button
                        size="small"
                        variant="neutral"
                        appearance="fill-stroke"
                        onClick={() => {
                          setEditing(category.id);
                          setEditEn(category.labelEn);
                          setEditEs(category.labelEs);
                        }}
                      >
                        <Pencil
                          aria-hidden="true"
                          className="size-4 shrink-0"
                        />
                        {isEs ? "Cambiar nombre" : "Rename"}
                      </Button>
                      <Button
                        size="small"
                        variant="neutral"
                        appearance="fill-stroke"
                        onClick={() =>
                          onArchive(category.id, !category.archived)
                        }
                      >
                        {category.archived ? (
                          <>
                            <ArchiveRestore
                              aria-hidden="true"
                              className="size-4 shrink-0"
                            />
                            {isEs ? "Restaurar" : "Restore"}
                          </>
                        ) : (
                          <>
                            <Archive
                              aria-hidden="true"
                              className="size-4 shrink-0"
                            />
                            {isEs ? "Archivar" : "Archive"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <Alert tone="info">
          {isEs
            ? "Archivar oculta un tema de los filtros y de los episodios nuevos. Los episodios que ya lo usan lo conservan, así que ninguno pierde su tema."
            : "Archiving hides a topic from the filters and from new episodes. Episodes already using it keep it, so nothing loses its topic."}
        </Alert>
      </div>
    </Modal>
  );
}

export default CategoryManager;
