"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CircleDot,
  HelpCircle,
  Info,
  Mail,
  Send,
  Tag,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import {
  Alert,
  Badge,
  Button,
  Card,
  FormField,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";

type CommentItem = {
  author: string;
  date: string;
  message: string;
  tone: "user" | "support";
};

type TicketItem = {
  id: string;
  status: "new" | "inProgress" | "resolved";
  title: string;
  category: string;
  date: string;
  replies?: string;
  comments?: CommentItem[];
};

const defaultTickets: TicketItem[] = [
  {
    id: "T-001",
    status: "new",
    title: "Auto-Approve Bookings",
    category: "General Inquiry",
    date: "15 May 26 8:00 pm",
    replies: "1 reply",
  },
  {
    id: "T-002",
    status: "inProgress",
    title: "AM2 Checklist Data Reset",
    category: "Technical Issue",
    date: "15 May 26 8:00 pm",
    comments: [
      {
        author: "Deja Brady",
        date: "15 May 2026 8:00 pm",
        message:
          "I filled in Section 2 of the AM2 checklist yesterday but when I logged in today it was all blank again. I have tried on Chrome and Firefox.",
        tone: "user",
      },
      {
        author: "Support Team",
        date: "15 May 2026 8:05 pm",
        message:
          "Hi Deja, we are looking into this. Could you try clearing your browser cache and trying again?",
        tone: "support",
      },
    ],
  },
  {
    id: "T-003",
    status: "resolved",
    title: "Prescription Refill Sync",
    category: "Treatment Records",
    date: "15 May 26 8:00 pm",
    comments: [
      {
        author: "Deja Brady",
        date: "15 May 26 8:00 pm",
        message:
          "My pharmacy confirmed the refill, but it was not showing in my personal log. Updating now.",
        tone: "user",
      },
      {
        author: "Support Team",
        date: "15 May 26 8:20 pm",
        message:
          "We refreshed your pharmacy connector sync. Your refill is now successfully visible in your records.",
        tone: "support",
      },
    ],
  },
];

const statusTone = {
  new: "info",
  inProgress: "warning",
  resolved: "success",
} as const;

function TicketMeta({ category, date }: { category: string; date: string }) {
  return (
    <div className="flex flex-wrap items-center gap-inline-md text-body-sm text-fg-muted">
      <span className="flex items-center gap-inline-md text-fg-secondary">
        <Tag className="h-icon-small w-icon-small text-fg-brand" />
        {category}
      </span>
      <CircleDot
        aria-hidden="true"
        className="h-2.5 w-2.5 fill-line text-line"
      />
      <span>{date}</span>
    </div>
  );
}

function Avatar({
  initial,
  isSupport,
}: {
  initial: string;
  isSupport?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-label-sm ${
        isSupport
          ? "bg-accent-solid text-accent-on-solid"
          : "bg-primary-solid text-primary-on-solid"
      }`}
    >
      {initial}
    </span>
  );
}

function CommentCard({ comment }: { comment: CommentItem }) {
  const isSupport = comment.tone === "support";

  return (
    <Card as="article" tone={isSupport ? "sunken" : "flat"} padding="big">
      <div className="mb-stack-md flex flex-wrap items-center gap-inline-lg">
        <div className="flex items-center gap-inline-md">
          <Avatar
            initial={comment.author ? comment.author.charAt(0) : "U"}
            isSupport={isSupport}
          />
          <span className="text-label-md text-fg">{comment.author}</span>
        </div>
        <span className="text-caption text-fg-muted">{comment.date}</span>
      </div>
      <p className="text-body-sm text-fg-secondary">{comment.message}</p>
    </Card>
  );
}

function ReplyBox({
  placeholder,
  buttonLabel,
  onSend,
}: {
  placeholder: string;
  buttonLabel: string;
  onSend: (message: string) => void;
}) {
  const [replyText, setReplyText] = useState("");

  const handleSend = () => {
    if (!replyText.trim()) return;
    onSend(replyText.trim());
    setReplyText("");
  };

  return (
    <div className="space-y-stack-md">
      <FormField label={placeholder}>
        {(props) => (
          <Textarea
            {...props}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={3}
            placeholder={placeholder}
          />
        )}
      </FormField>
      <div className="flex justify-end">
        <Button
          onClick={handleSend}
          disabled={!replyText.trim()}
          leadingIcon={<Send />}
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}

function NewTicketModal({
  open,
  onClose,
  onSubmit,
  modalData,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    category: string;
    message: string;
  }) => void;
  modalData?: {
    title: string;
    closeAria: string;
    subjectLabel: string;
    subjectPlaceholder: string;
    categoryLabel: string;
    categories: string[];
    messageLabel: string;
    messagePlaceholder: string;
    cancelButton: string;
    submitButton: string;
  };
}) {
  const categories = modalData?.categories || [
    "General Inquiry",
    "Technical Issue",
    "Account & Billing",
    "Treatment Records",
  ];

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    onSubmit({ title: subject.trim(), category, message: message.trim() });
    setSubject("");
    setMessage("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={modalData?.title || "Create New Ticket"}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {modalData?.cancelButton || "Cancel"}
          </Button>
          <Button
            type="submit"
            form="new-ticket-form"
            disabled={!subject.trim() || !message.trim()}
          >
            {modalData?.submitButton || "Submit Ticket"}
          </Button>
        </>
      }
    >
      <form
        id="new-ticket-form"
        onSubmit={handleSubmit}
        className="space-y-stack-lg"
      >
        <FormField label={modalData?.subjectLabel || "Subject"} required>
          {(props) => (
            <Input
              {...props}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={
                modalData?.subjectPlaceholder || "What do you need help with?"
              }
            />
          )}
        </FormField>

        <FormField label={modalData?.categoryLabel || "Category"}>
          {(props) => (
            <Select
              {...props}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          )}
        </FormField>

        <FormField label={modalData?.messageLabel || "Message"} required>
          {(props) => (
            <Textarea
              {...props}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder={
                modalData?.messagePlaceholder ||
                "Describe your issue in detail..."
              }
            />
          )}
        </FormField>
      </form>
    </Modal>
  );
}

function TicketCard({
  ticket,
  expanded,
  onToggleExpand,
  statusLabel,
  resolvedText,
  replyPlaceholder,
  sendReplyButton,
  onAddComment,
}: {
  ticket: TicketItem;
  expanded: boolean;
  onToggleExpand: () => void;
  statusLabel: string;
  resolvedText: string;
  replyPlaceholder: string;
  sendReplyButton: string;
  onAddComment: (message: string) => void;
}) {
  const panelId = `${ticket.id}-panel`;

  return (
    <Card as="article" tone="flat">
      {/* The whole header is the control. It used to be a <div onClick> with
          a chevron <button> that had no handler at all — so expanding a
          ticket was impossible with a keyboard. */}
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full cursor-pointer flex-col gap-inline-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex w-full items-center gap-inline-md">
          <span className="flex flex-1 flex-wrap items-center gap-inline-md">
            <span className="text-label-md text-fg-muted">{ticket.id}</span>
            <Badge tone={statusTone[ticket.status]}>{statusLabel}</Badge>
          </span>

          {ticket.replies ? (
            <Badge tone="neutral" variant="outline">
              {ticket.replies}
            </Badge>
          ) : null}

          <span aria-hidden="true" className="text-fg-brand">
            {expanded ? (
              <ChevronUp className="h-icon-small w-icon-small" />
            ) : (
              <ChevronDown className="h-icon-small w-icon-small" />
            )}
          </span>
        </span>

        <span className="block text-heading-5 text-fg">{ticket.title}</span>
      </button>

      <div className="mt-stack-md">
        <TicketMeta category={ticket.category} date={ticket.date} />
      </div>

      {expanded ? (
        <div
          id={panelId}
          className="mt-stack-xl space-y-stack-lg border-t border-line-subtle pt-inset-md"
        >
          {ticket.comments && ticket.comments.length > 0
            ? ticket.comments.map((comment, index) => (
                <CommentCard
                  key={`${ticket.id}-cmt-${index}`}
                  comment={comment}
                />
              ))
            : null}

          {ticket.status !== "resolved" ? (
            <ReplyBox
              placeholder={replyPlaceholder}
              buttonLabel={sendReplyButton}
              onSend={onAddComment}
            />
          ) : (
            <Alert tone="success" live={false} icon={<Info />}>
              {resolvedText}
            </Alert>
          )}
        </div>
      ) : null}
    </Card>
  );
}

export default function SupportPage() {
  const { dictionary, language } = useLanguage();
  const { user } = useAuth();
  const sup = dictionary?.support;

  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    "T-002": true,
    "T-003": true,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [customTickets, setCustomTickets] = useState<TicketItem[]>([]);
  const [ticketComments, setTicketComments] = useState<
    Record<string, CommentItem[]>
  >({});

  const dictTickets: TicketItem[] =
    sup?.tickets && Array.isArray(sup.tickets) && sup.tickets.length > 0
      ? (sup.tickets as TicketItem[])
      : defaultTickets;

  const allTickets = [...customTickets, ...dictTickets];

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddComment = (ticketId: string, message: string) => {
    const newComment: CommentItem = {
      author: user?.name || (language === "ES" ? "Usted" : "You"),
      date: language === "ES" ? "Recién publicado" : "Just now",
      message,
      tone: "user",
    };

    setTicketComments((prev) => {
      const existing =
        prev[ticketId] ||
        allTickets.find((t) => t.id === ticketId)?.comments ||
        [];
      return { ...prev, [ticketId]: [...existing, newComment] };
    });
  };

  const handleCreateTicket = (data: {
    title: string;
    category: string;
    message: string;
  }) => {
    const newId = `T-${String(allTickets.length + 1).padStart(3, "0")}`;
    const newTicket: TicketItem = {
      id: newId,
      status: "new",
      title: data.title,
      category: data.category,
      date: language === "ES" ? "Recién creado" : "Just now",
      comments: [
        {
          author: user?.name || (language === "ES" ? "Usted" : "You"),
          date: language === "ES" ? "Recién creado" : "Just now",
          message: data.message,
          tone: "user",
        },
      ],
    };

    setCustomTickets((prev) => [newTicket, ...prev]);
    setExpandedIds((prev) => ({ ...prev, [newId]: true }));
  };

  return (
    <Card as="section" tone="sunken" padding="small">
      <div className="mb-stack-md flex flex-wrap items-center justify-between gap-inline-lg px-inset-xs pt-inset-xs">
        <div className="flex items-center gap-inline-md">
          <Mail className="h-icon-small w-icon-small text-fg" />
          <h1 className="text-heading-4 text-fg">
            {sup?.pageTitle || "My Tickets"}
          </h1>
        </div>
        <Button onClick={() => setModalOpen(true)} leadingIcon={<HelpCircle />}>
          {sup?.newTicketButton || "New Ticket"}
        </Button>
      </div>

      <Card padding="small" className="space-y-stack-sm">
        {allTickets.map((ticket) => {
          const isExpanded = Boolean(expandedIds[ticket.id]);
          const statusLabel =
            sup?.status?.[ticket.status] ||
            (ticket.status === "new"
              ? "New"
              : ticket.status === "inProgress"
                ? "In Progress"
                : "Resolved");

          const effectiveTicket = {
            ...ticket,
            comments: ticketComments[ticket.id] || ticket.comments || [],
          };

          return (
            <TicketCard
              key={ticket.id}
              ticket={effectiveTicket}
              expanded={isExpanded}
              onToggleExpand={() => handleToggleExpand(ticket.id)}
              statusLabel={statusLabel}
              resolvedText={
                sup?.ticketResolved || "This ticket has been resolved"
              }
              replyPlaceholder={sup?.replyPlaceholder || "Type your reply..."}
              sendReplyButton={sup?.sendReplyButton || "Send Reply"}
              onAddComment={(msg) => handleAddComment(ticket.id, msg)}
            />
          );
        })}
      </Card>

      <NewTicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateTicket}
        modalData={sup?.modal}
      />
    </Card>
  );
}
