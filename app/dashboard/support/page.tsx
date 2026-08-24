import React from "react";
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

const tickets = [
  {
    id: "T-001",
    status: "New",
    statusClass: "bg-sky-200 text-sky-700",
    title: "Auto-Approve Bookings",
    category: "Category",
    date: "15 May 26 8:00 pm",
    replies: "1 reply",
    expanded: false,
  },
  {
    id: "T-001",
    status: "In Progress",
    statusClass: "bg-amber-100 text-amber-500",
    title: "Auto-Approve Bookings",
    category: "Category",
    date: "15 May 26 8:00 pm",
    expanded: true,
    replyBox: true,
    comments: [
      {
        author: "Deja Brady",
        date: "15 May 2020 8:00 pm",
        message:
          "I filled in Section 2 of the AM2 checklist yesterday but when I logged in today it was all blank again. I have tried on Chrome and Firefox.",
        tone: "user",
      },
      {
        author: "Deja Brady",
        date: "15 May 2020 8:00 pm",
        message:
          "Hi James, we are looking into this. Could you try clearing your browser cache and trying again?",
        tone: "support",
      },
    ],
  },
  {
    id: "T-001",
    status: "Resolved",
    statusClass: "bg-emerald-100 text-emerald-600",
    title: "Auto-Approve Bookings",
    category: "Category",
    date: "15 May 26 8:00 pm",
    expanded: true,
    resolved: true,
    comments: [
      {
        author: "Deja Brady",
        date: "15 May 26 8:00 pm",
        message:
          "I filled in Section 2 of the AM2 checklist yesterday but when I logged in today it was all blank again. I have tried on Chrome and Firefox.",
        tone: "user",
      },
      {
        author: "Deja Brady",
        date: "15 May 26 8:00 pm",
        message:
          "Hi James, we are looking into this. Could you try clearing your browser cache and trying again?",
        tone: "support",
      },
    ],
  },
];

function StatusChip({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex h-8 items-center rounded-lg px-2 text-sm font-bold ${className}`}>
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

function Avatar({ initial }: { initial: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm text-white">
      {initial}
    </span>
  );
}

function CommentCard({
  comment,
}: {
  comment: { author: string; date: string; message: string; tone: string };
}) {
  const isSupport = comment.tone === "support";

  return (
    <article
      className={`rounded-lg border border-[#D6E6F2] px-4 py-4 ${
        isSupport ? "bg-blue-100" : "bg-[#F8FAFC]"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <Avatar initial={comment.author.charAt(0)} />
          <span className="text-sm font-medium text-slate-900">{comment.author}</span>
        </div>
        <span className="text-sm font-medium text-slate-500">{comment.date}</span>
      </div>
      <p className="text-sm leading-5 text-slate-700">{comment.message}</p>
    </article>
  );
}

function ReplyBox() {
  return (
    <div className="overflow-hidden rounded-lg border border-[#E9EEF4]">
      <div className="h-[99px] bg-[#F1F5FA] px-4 py-3 text-sm text-slate-600">
        Type your reply...
      </div>
      <div className="flex justify-end bg-white px-2 py-2.5">
        <button
          type="button"
          className="flex h-12 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
        >
          <Send className="h-5 w-5" />
          Send Reply
        </button>
      </div>
    </div>
  );
}

function TicketCard({ ticket }: { ticket: (typeof tickets)[number] }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-[#F8F8FF] px-3 py-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <span className="text-sm text-[#4A4A68]">{ticket.id}</span>
            <StatusChip label={ticket.status} className={ticket.statusClass} />
          </div>
          {ticket.replies && (
            <span className="rounded-[10px] border border-[#D6E6F2] bg-[#EAF4FB] px-3 py-1 text-sm font-medium text-indigo-900">
              {ticket.replies}
            </span>
          )}
          {ticket.expanded ? (
            <ChevronUp className="h-5 w-5 text-indigo-700" />
          ) : (
            <ChevronDown className="h-5 w-5 text-indigo-700" />
          )}
        </div>

        <h2 className="text-lg font-medium leading-7 text-slate-900">{ticket.title}</h2>
        <TicketMeta category={ticket.category} date={ticket.date} />
      </div>

      {ticket.expanded && (
        <>
          <div className="my-5 border-t border-slate-200" />
          <div className="space-y-4">
            {ticket.comments?.map((comment, index) => (
              <CommentCard key={`${ticket.status}-${index}`} comment={comment} />
            ))}
            {ticket.replyBox && <ReplyBox />}
            {ticket.resolved && (
              <div className="flex h-[50px] items-center gap-4 rounded-lg bg-emerald-100 px-4 text-sm font-medium text-emerald-600 shadow-sm">
                <Info className="h-5 w-5" />
                This ticket has been resolved
              </div>
            )}
          </div>
        </>
      )}
    </article>
  );
}

export default function SupportPage() {
  return (
    <section className="rounded-xl border border-[#D6E6F2] bg-[#F1F5FA] p-3.5">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex flex-1 items-center gap-3">
          <Mail className="h-5 w-5 text-slate-900" />
          <h1 className="text-lg font-medium leading-7 text-slate-900">My Tickets</h1>
        </div>
        <button
          type="button"
          className="flex h-12 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
        >
          <HelpCircle className="h-5 w-5" />
          New Ticket
        </button>
      </div>

      <div className="space-y-2 rounded-xl border border-[#E9EEF4] bg-[#F8F8FF] p-3.5">
        {tickets.map((ticket, index) => (
          <TicketCard key={`${ticket.status}-${index}`} ticket={ticket} />
        ))}
      </div>
    </section>
  );
}
