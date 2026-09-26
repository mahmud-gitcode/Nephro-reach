"use client";

import React, { useState } from "react";
import { Copy, ExternalLink, Trash2 } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Input,
  Modal,
  Select,
  Switch,
} from "@/components/ui";
import {
  CLASS_STATUSES,
  PROGRAMS,
  SETTING_FIELDS,
  classError,
  emptyClassDraft,
  isFull,
  recordingLinkError,
  seatsLeft,
  toDraft,
  type ClassDraft,
  type ClassStatus,
  type ManagedClass,
  type SettingField,
  type SettingId,
  type SettingValues,
} from "./liveClass.actions";
import { formatClassDate, registrationTone } from "./liveClass.data";
import type { RecentClass } from "./liveClass.data";
import type { BadgeTone } from "@/components/ui";

/* ==========================================================================
   The dialogs behind Live Class's actions
   --------------------------------------------------------------------------
   Kept out of ClinicLiveClass.tsx, which is already a long page of panels.
   Each owns only its own draft; the page owns what is open.
   ========================================================================== */

/** Cancelled is ours, not the seed's, so it needs its own tone. */
export const classTone: Record<ClassStatus, BadgeTone> = {
  ...registrationTone,
  Cancelled: "danger",
};

/* --------------------------------------------------------------------------
   1 · Scheduling and editing
   -------------------------------------------------------------------------- */

export function ScheduleClassModal({
  open,
  onClose,
  classes,
  editing,
  today,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  classes: ManagedClass[];
  /** The class being edited, or null when scheduling a new one. */
  editing: ManagedClass | null;
  today: string;
  onSave: (draft: ClassDraft, editingId?: string) => void;
}) {
  const [draft, setDraft] = useState<ClassDraft>(() =>
    editing ? toDraft(editing) : emptyClassDraft(today),
  );

  const error = classError(draft, classes, editing?.id);
  const set = (patch: Partial<ClassDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (error) return;

    onSave(draft, editing?.id);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Class" : "Schedule New Class"}
      description={
        editing ? editing.topic : "It opens closed until you open registration."
      }
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="class-form" disabled={!!error}>
            {editing ? "Save Changes" : "Schedule Class"}
          </Button>
        </>
      }
    >
      <form
        id="class-form"
        onSubmit={handleSubmit}
        className="space-y-stack-md"
      >
        <div className="grid grid-cols-1 gap-inline-md sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="class-date"
              className="block text-label-md text-fg-secondary"
            >
              Date
            </label>
            <Input
              id="class-date"
              type="date"
              inputSize="small"
              value={draft.date}
              onChange={(event) => set({ date: event.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="class-time"
              className="block text-label-md text-fg-secondary"
            >
              Time
            </label>
            <Input
              id="class-time"
              type="time"
              inputSize="small"
              value={draft.time}
              onChange={(event) => set({ time: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="class-topic"
            className="block text-label-md text-fg-secondary"
          >
            Topic
          </label>
          <Input
            id="class-topic"
            inputSize="small"
            value={draft.topic}
            onChange={(event) => set({ topic: event.target.value })}
            placeholder="Renal Diet Basics"
          />
        </div>

        <div className="grid grid-cols-1 gap-inline-md sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="class-educator"
              className="block text-label-md text-fg-secondary"
            >
              Educator
            </label>
            <Input
              id="class-educator"
              inputSize="small"
              value={draft.educator}
              onChange={(event) => set({ educator: event.target.value })}
              placeholder="Renal Dietitian"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="class-program"
              className="block text-label-md text-fg-secondary"
            >
              Program
            </label>
            <Select
              id="class-program"
              selectSize="small"
              value={draft.program}
              onChange={(event) => set({ program: event.target.value })}
            >
              {PROGRAMS.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="class-capacity"
              className="block text-label-md text-fg-secondary"
            >
              Capacity
            </label>
            <Input
              id="class-capacity"
              type="number"
              min={1}
              inputSize="small"
              value={String(draft.capacity)}
              onChange={(event) =>
                set({ capacity: Number(event.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="class-status"
              className="block text-label-md text-fg-secondary"
            >
              Registration
            </label>
            <Select
              id="class-status"
              selectSize="small"
              value={draft.status}
              onChange={(event) =>
                set({ status: event.target.value as ClassStatus })
              }
            >
              {CLASS_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {editing && draft.capacity < editing.registered ? (
          <Alert tone="warning">
            {editing.registered} people are already registered. Their places are
            kept; the class is simply over capacity.
          </Alert>
        ) : null}

        {error ? <Alert tone="warning">{error}</Alert> : null}
      </form>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   2 · The row menu
   -------------------------------------------------------------------------- */

export function ClassActionsModal({
  item,
  onClose,
  onEdit,
  onStatus,
  onDuplicate,
  onRemove,
}: {
  item: ManagedClass | null;
  onClose: () => void;
  onEdit: () => void;
  onStatus: (status: ClassStatus) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  if (!item) return null;

  const act = (run: () => void) => () => {
    run();
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={item.topic}
      description={`${formatClassDate(item.date)} · ${item.time} · ${
        item.registered
      } of ${item.capacity} registered`}
      footer={
        <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-inline-sm">
        <Button fullWidth onClick={act(onEdit)}>
          Edit Class
        </Button>

        {item.status === "Open" ? (
          <Button
            variant="neutral"
            appearance="fill-stroke"
            fullWidth
            onClick={act(() => onStatus("Not Yet Open"))}
          >
            Close Registration
          </Button>
        ) : item.status === "Not Yet Open" ? (
          <Button
            variant="neutral"
            appearance="fill-stroke"
            fullWidth
            onClick={act(() => onStatus("Open"))}
          >
            Open Registration
          </Button>
        ) : (
          <Button
            variant="neutral"
            appearance="fill-stroke"
            fullWidth
            onClick={act(() => onStatus("Not Yet Open"))}
          >
            Reinstate Class
          </Button>
        )}

        <Button
          variant="neutral"
          appearance="fill-stroke"
          fullWidth
          onClick={act(onDuplicate)}
        >
          <Copy aria-hidden="true" />
          <span>Duplicate for Next Week</span>
        </Button>

        {item.status !== "Cancelled" ? (
          <Button
            variant="danger"
            appearance="fill-stroke"
            fullWidth
            onClick={act(() => onStatus("Cancelled"))}
          >
            Cancel Class
          </Button>
        ) : (
          /* Only once it is cancelled, and only then: deleting a class
             people had registered for erases the fact that it happened. */
          <Button
            variant="danger"
            appearance="fill-stroke"
            fullWidth
            onClick={act(onRemove)}
          >
            <Trash2 aria-hidden="true" />
            <span>Delete Permanently</span>
          </Button>
        )}

        {isFull(item) && item.status === "Open" ? (
          <Alert tone="info">
            This class is full. New registrations will need a bigger capacity.
          </Alert>
        ) : item.status === "Open" ? (
          <p className="text-body-sm text-fg-muted">
            {seatsLeft(item)} places left.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   3 · The whole schedule
   -------------------------------------------------------------------------- */

export function AllClassesModal({
  open,
  onClose,
  classes,
  today,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  classes: ManagedClass[];
  today: string;
  onSelect: (item: ManagedClass) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title="All Classes"
      description="Every class on the schedule, past and cancelled included."
      footer={
        <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
          Close
        </Button>
      }
    >
      <ul className="divide-y divide-line-subtle">
        {classes.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-inline-md py-inset-xs first:pt-0"
          >
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="min-w-0 flex-1 cursor-pointer text-left"
            >
              <span className="block truncate text-label-md text-fg">
                {item.topic}
              </span>
              <span className="block truncate text-body-sm text-fg-muted">
                {formatClassDate(item.date)} · {item.time} · {item.educator}
              </span>
            </button>

            <span className="text-body-sm text-fg-muted tabular-nums">
              {item.registered}/{item.capacity}
            </span>

            {item.date < today && item.status !== "Cancelled" ? (
              <Badge tone="neutral" variant="soft">
                Past
              </Badge>
            ) : (
              <Badge tone={classTone[item.status]} variant="soft">
                {item.status}
              </Badge>
            )}
          </li>
        ))}
      </ul>

      {classes.length === 0 ? (
        <p className="text-body-sm text-fg-muted">Nothing scheduled yet.</p>
      ) : null}
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   4 · Recordings
   -------------------------------------------------------------------------- */

/** One past class: its numbers, and where its recording lives. */
export function RecordingModal({
  item,
  onClose,
  link,
  onSave,
}: {
  item: RecentClass | null;
  onClose: () => void;
  link: string;
  onSave: (title: string, url: string) => void;
}) {
  const [url, setUrl] = useState(link);
  if (!item) return null;

  const error = recordingLinkError(url);

  return (
    <Modal
      open
      onClose={onClose}
      title={item.title}
      description={`${formatClassDate(item.date)} · ${item.attended} attended · rated ${item.rating}`}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Close
          </Button>
          <Button
            disabled={!!error}
            onClick={() => {
              onSave(item.title, url);
              onClose();
            }}
          >
            Save Link
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {/* No video host here, so the page keeps the link rather than
            pretending to stream. Keeping the Zoom or Vimeo URL is what a
            clinic actually does with a recording. */}
        <div className="space-y-1.5">
          <label
            htmlFor="recording-url"
            className="block text-label-md text-fg-secondary"
          >
            Recording link
          </label>
          <Input
            id="recording-url"
            inputSize="small"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://zoom.us/rec/share/…"
          />
        </div>

        {error ? <Alert tone="warning">{error}</Alert> : null}

        {link && !error ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-inline-xs text-body-sm font-semibold text-fg-brand hover:underline"
          >
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
            Open the recording
          </a>
        ) : (
          <p className="text-body-sm text-fg-muted">
            No recording saved for this class yet.
          </p>
        )}
      </div>
    </Modal>
  );
}

export function RecordingsLibraryModal({
  open,
  onClose,
  classes,
  recordings,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  classes: RecentClass[];
  recordings: Record<string, string>;
  onSelect: (item: RecentClass) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title="All Recordings"
      description="Every past class, and where its recording lives."
      footer={
        <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
          Close
        </Button>
      }
    >
      <ul className="divide-y divide-line-subtle">
        {classes.map((item) => {
          const link = recordings[item.title];

          return (
            <li
              key={item.title}
              className="flex flex-wrap items-center gap-inline-md py-inset-xs first:pt-0"
            >
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="min-w-0 flex-1 cursor-pointer text-left"
              >
                <span className="block truncate text-label-md text-fg">
                  {item.title}
                </span>
                <span className="block truncate text-body-sm text-fg-muted">
                  {formatClassDate(item.date)} · {item.attended} attended
                </span>
              </button>

              {link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-inline-xs text-body-sm font-semibold text-fg-brand hover:underline"
                >
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  Open
                </a>
              ) : (
                <Badge tone="neutral" variant="soft">
                  No link
                </Badge>
              )}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   5 · A settings panel
   -------------------------------------------------------------------------- */

function SettingControl({
  field,
  value,
  onChange,
}: {
  field: SettingField;
  value: SettingValues[string];
  onChange: (next: SettingValues[string]) => void;
}) {
  const id = `setting-${field.key}`;

  if (field.kind === "switch") {
    return (
      <div className="flex items-center justify-between gap-inline-lg">
        <span className="min-w-0">
          <span className="block text-label-md text-fg">{field.label}</span>
          {field.note ? (
            <span className="block text-body-sm text-fg-muted">
              {field.note}
            </span>
          ) : null}
        </span>
        <Switch
          checked={value === true}
          onChange={onChange}
          label={field.label}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-label-md text-fg-secondary">
        {field.label}
      </label>

      {field.kind === "select" ? (
        <Select
          id={id}
          selectSize="small"
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
        >
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          id={id}
          inputSize="small"
          type={field.kind === "number" ? "number" : "text"}
          min={field.min}
          max={field.max}
          value={String(value)}
          placeholder={field.placeholder}
          onChange={(event) =>
            onChange(
              field.kind === "number"
                ? Number(event.target.value) || 0
                : event.target.value,
            )
          }
        />
      )}

      {field.note ? (
        <p className="text-body-sm text-fg-muted">{field.note}</p>
      ) : null}
    </div>
  );
}

export function SettingModal({
  id,
  title,
  onClose,
  values,
  onSave,
}: {
  /** Which panel, or null when closed. */
  id: SettingId | null;
  title: string;
  onClose: () => void;
  values: SettingValues;
  onSave: (id: SettingId, values: SettingValues) => void;
}) {
  const [draft, setDraft] = useState<SettingValues>(values);
  if (!id) return null;

  /* Links are turned into an href elsewhere, so a non-http one is refused
     here rather than stored and clicked later. */
  const linkFields = SETTING_FIELDS[id].filter(
    (field) => field.kind === "text" && field.placeholder?.startsWith("http"),
  );
  const error = linkFields
    .map((field) => recordingLinkError(String(draft[field.key] ?? "")))
    .find((problem) => problem !== null);

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!!error}
            onClick={() => {
              onSave(id, draft);
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {SETTING_FIELDS[id].map((field) => (
          <SettingControl
            key={field.key}
            field={field}
            value={draft[field.key]}
            onChange={(next) =>
              setDraft((current) => ({ ...current, [field.key]: next }))
            }
          />
        ))}

        {error ? <Alert tone="warning">{error}</Alert> : null}
      </div>
    </Modal>
  );
}
