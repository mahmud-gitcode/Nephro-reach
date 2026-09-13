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
  X,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";

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

function StatusChip({
  status,
  label,
}: {
  status: "new" | "inProgress" | "resolved";
  label: string;
}) {
  const styles = {
    new: "bg-sky-200 text-sky-700",
    inProgress: "bg-amber-100 text-amber-500",
    resolved: "bg-emerald-100 text-emerald-600",
  }[status];

  return (
    <span
      className={`inline-flex h-8 items-center rounded-lg px-2 text-sm font-bold ${styles}`}
    >
      {label}
    </span>
  );
}

function TicketMeta({ category, date }: { category: string; date: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
      <span className="flex items-center gap-2 text-base text-slate-700">
        <Tag className="h-5 w-5 text-indigo-700" />
        {category}
      </span>
      <CircleDot className="h-2.5 w-2.5 fill-slate-200 text-slate-200" />
      <span>{date}</span>
    </div>
  );
}

function Avatar({ initial, isSupport }: { initial: string; isSupport?: boolean }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm text-white ${
        isSupport ? "bg-indigo-600" : "bg-blue-700"
      }`}
    >
      {initial}
    </span>
  );
}

function CommentCard({ comment }: { comment: CommentItem }) {
  const isSupport = comment.tone === "support";

  return (
    <article
      className={`rounded-lg border border-[#D6E6F2] px-4 py-4 ${
        isSupport ? "bg-blue-100" : "bg-[#F8FAFC]"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <Avatar
            initial={comment.author ? comment.author.charAt(0) : "U"}
            isSupport={isSupport}
          />
          <span className="text-sm font-medium text-slate-900">{comment.author}</span>
        </div>
        <span className="text-sm font-medium text-slate-500">{comment.date}</span>
      </div>
      <p className="text-sm leading-5 text-slate-700">{comment.message}</p>
    </article>
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
    <div className="overflow-hidden rounded-lg border border-[#E9EEF4]">
      <textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full resize-none bg-[#F1F5FA] px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-500 focus:bg-white focus:ring-1 focus:ring-blue-300"
      />
      <div className="flex justify-end bg-white px-2 py-2.5">
        <button
          type="button"
          onClick={handleSend}
          disabled={!replyText.trim()}
          className="flex h-12 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
        >
          <Send className="h-5 w-5" />
          {buttonLabel}
        </button>
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
  onSubmit: (data: { title: string; category: string; message: string }) => void;
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
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(
    modalData?.categories?.[0] || "General Inquiry"
  );
  const [message, setMessage] = useState("");

  if (!open) return null;

  const categories = modalData?.categories || [
    "General Inquiry",
    "Technical Issue",
    "Account & Billing",
    "Treatment Records",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    onSubmit({
      title: subject.trim(),
      category,
      message: message.trim(),
    });
    setSubject("");
    setMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-ticket-title"
        className="w-full max-w-[560px] rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 id="new-ticket-title" className="text-lg font-bold text-slate-900">
            {modalData?.title || "Create New Ticket"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
            aria-label={modalData?.closeAria || "Close dialog"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              {modalData?.subjectLabel || "Subject"}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={
                modalData?.subjectPlaceholder || "What do you need help with?"
              }
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              {modalData?.categoryLabel || "Category"}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              {modalData?.messageLabel || "Message"}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder={
                modalData?.messagePlaceholder || "Describe your issue in detail..."
              }
              required
              className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {modalData?.cancelButton || "Cancel"}
            </button>
            <button
              type="submit"
              disabled={!subject.trim() || !message.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {modalData?.submitButton || "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
  return (
    <article className="rounded-xl border border-slate-200 bg-[#F8F8FF] px-3 py-4 transition-colors">
      <div
        className="flex flex-col gap-3 cursor-pointer select-none"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <span className="text-sm text-[#4A4A68] font-mono font-medium">
              {ticket.id}
            </span>
            <StatusChip status={ticket.status} label={statusLabel} />
          </div>
          {ticket.replies && (
            <span className="rounded-[10px] border border-[#D6E6F2] bg-[#EAF4FB] px-3 py-1 text-sm font-medium text-indigo-900">
              {ticket.replies}
            </span>
          )}
          <button
            type="button"
            className="p-1 text-indigo-700 hover:bg-indigo-50 rounded cursor-pointer"
            aria-label={expanded ? "Collapse ticket" : "Expand ticket"}
          >
            {expanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>

        <h2 className="text-lg font-medium leading-7 text-slate-900">
          {ticket.title}
        </h2>
        <TicketMeta category={ticket.category} date={ticket.date} />
      </div>

      {expanded && (
        <>
          <div className="my-5 border-t border-slate-200" />
          <div className="space-y-4">
            {ticket.comments && ticket.comments.length > 0 ? (
              ticket.comments.map((comment, index) => (
                <CommentCard key={`${ticket.id}-cmt-${index}`} comment={comment} />
              ))
            ) : null}

            {ticket.status !== "resolved" && (
              <ReplyBox
                placeholder={replyPlaceholder}
                buttonLabel={sendReplyButton}
                onSend={onAddComment}
              />
            )}

            {ticket.status === "resolved" && (
              <div className="flex h-[50px] items-center gap-4 rounded-lg bg-emerald-100 px-4 text-sm font-medium text-emerald-600 shadow-sm">
                <Info className="h-5 w-5 shrink-0" />
                <span>{resolvedText}</span>
              </div>
            )}
          </div>
        </>
      )}
    </article>
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
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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
      return {
        ...prev,
        [ticketId]: [...existing, newComment],
      };
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
    <section className="rounded-xl border border-[#D6E6F2] bg-[#F1F5FA] p-3.5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-slate-900" />
          <h1 className="text-lg font-medium leading-7 text-slate-900">
            {sup?.pageTitle || "My Tickets"}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex h-12 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700 cursor-pointer"
        >
          <HelpCircle className="h-5 w-5" />
          {sup?.newTicketButton || "New Ticket"}
        </button>
      </div>

      <div className="space-y-2 rounded-xl border border-[#E9EEF4] bg-[#F8F8FF] p-3.5">
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
              replyPlaceholder={
                sup?.replyPlaceholder || "Type your reply..."
              }
              sendReplyButton={
                sup?.sendReplyButton || "Send Reply"
              }
              onAddComment={(msg) => handleAddComment(ticket.id, msg)}
            />
          );
        })}
      </div>

      <NewTicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateTicket}
        modalData={sup?.modal}
      />
    </section>
  );
}
