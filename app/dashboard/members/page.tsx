import React from "react";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Radar,
  Search,
  Users,
} from "lucide-react";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const summaryCards: Array<{
  title: string;
  value: string;
  icon: IconType;
  tone: string;
  iconTone: string;
}> = [
  {
    title: "Total Members",
    value: "147",
    icon: Users,
    tone: "bg-blue-100",
    iconTone: "text-blue-600",
  },
  {
    title: "Active",
    value: "00",
    icon: Radar,
    tone: "bg-emerald-100",
    iconTone: "text-emerald-600",
  },
  {
    title: "Pending",
    value: "00",
    icon: Bell,
    tone: "bg-lime-100",
    iconTone: "text-lime-700",
  },
  {
    title: "Inactive",
    value: "00",
    icon: Radar,
    tone: "bg-red-100",
    iconTone: "text-red-500",
  },
];

const members = [
  {
    initials: "SM",
    name: "Rony joe",
    id: "MM-123123",
    email: "example@!gmail.com",
    phone: "(702) 555-0122",
    subscription: "Full Membership",
    status: "Active",
    joined: "12 April,2026",
  },
  {
    initials: "MD",
    name: "Alicia Keys",
    id: "MM-987654",
    email: "alicia.keys@example.com",
    phone: "(415) 555-0199",
    subscription: "Journal Only",
    status: "Active",
    joined: "5 May,2027",
  },
  {
    initials: "LG",
    name: "Marcus Lee",
    id: "MM-456789",
    email: "marcus.lee@mail.com",
    phone: "(212) 555-0147",
    subscription: "Class Purchase",
    status: "Expired",
    joined: "20 March,2025",
  },
  {
    initials: "SM",
    name: "Elena Fisher",
    id: "MM-321654",
    email: "elena.fisher@mail.com",
    phone: "(303) 555-0110",
    subscription: "Full Membership",
    status: "Active",
    joined: "15 June,2026",
  },
  {
    initials: "MD",
    name: "Jamal Turner",
    id: "MM-654321",
    email: "jamal.turner@example.org",
    phone: "(718) 555-0133",
    subscription: "Journal Only",
    status: "Expired",
    joined: "1 January,2024",
  },
  {
    initials: "LG",
    name: "Sofia Martinez",
    id: "MM-789123",
    email: "sofia.martinez@webmail.net",
    phone: "(512) 555-0177",
    subscription: "Class Purchase",
    status: "Active",
    joined: "10 November,2026",
  },
  {
    initials: "SM",
    name: "David Kim",
    id: "MM-159753",
    email: "david.kim@domain.com",
    phone: "(213) 555-0155",
    subscription: "Full Membership",
    status: "Active",
    joined: "22 August,2027",
  },
  {
    initials: "LG",
    name: "Omar Hassan",
    id: "MM-852369",
    email: "omar.hassan@mail.com",
    phone: "(305) 555-0129",
    subscription: "Class Purchase",
    status: "Active",
    joined: "30 December,2026",
  },
  {
    initials: "SM",
    name: "Nina Gupta",
    id: "MM-963852",
    email: "nina.gupta@service.org",
    phone: "(917) 555-0166",
    subscription: "Full Membership",
    status: "Expired",
    joined: "18 February,2023",
  },
];

function SummaryCard({ card }: { card: (typeof summaryCards)[number] }) {
  return (
    <article className="min-h-[114px] rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <p className="text-base font-semibold tracking-[0.08px] text-slate-600">
          {card.title}
        </p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${card.tone}`}>
          <card.icon className={`h-5 w-5 ${card.iconTone}`} />
        </span>
      </div>
      <p className="text-2xl font-semibold leading-8 tracking-[0.12px] text-slate-900">
        {card.value}
      </p>
    </article>
  );
}

function StatusPill({ status }: { status: string }) {
  const isActive = status === "Active";

  return (
    <span
      className={`inline-flex h-6 items-center rounded px-2 text-sm font-semibold ${
        isActive
          ? "bg-emerald-50 text-emerald-600"
          : "bg-red-100 text-red-500"
      }`}
    >
      {status}
    </span>
  );
}

function MembersTable() {
  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Member</h1>
        <label className="relative block w-full sm:w-[277px]">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600" />
          <input
            type="search"
            placeholder="Search..."
            className="h-10 w-full rounded-lg border border-[#CBD5ED] bg-white pl-10 pr-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#C4CDD5]">
        <table className="w-full min-w-[1080px] border-collapse text-sm">
          <thead>
            <tr className="bg-[#F4F6F8] text-left">
              {["Member", "Contact", "Subscriptions", "Status", "Joined", "Actions"].map((header) => (
                <th
                  key={header}
                  className={`h-[55px] border-b border-[#C4CDD5] px-3 font-semibold tracking-[0.07px] text-slate-900 ${
                    header === "Actions" ? "text-center" : ""
                  }`}
                >
                  <span className="block border-l border-[#C4CDD5] pl-3 leading-5 first:border-l-0">
                    {header}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-dashed border-[#C4CDD5] last:border-0">
                <td className="h-[52px] px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00A76F] text-sm font-medium tracking-[0.22px] text-white">
                      {member.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium leading-5 text-slate-800">{member.name}</p>
                      <p className="truncate text-xs leading-[18px] text-slate-600">{member.id}</p>
                    </div>
                  </div>
                </td>
                <td className="h-[52px] px-3 py-2">
                  <p className="max-w-[190px] truncate font-semibold leading-5 text-slate-800">
                    {member.email}
                  </p>
                  <p className="text-xs leading-[18px] text-slate-600">{member.phone}</p>
                </td>
                <td className="h-[52px] px-3 py-2 font-medium text-slate-800">
                  {member.subscription}
                </td>
                <td className="h-[52px] px-3 py-2">
                  <StatusPill status={member.status} />
                </td>
                <td className="h-[52px] px-3 py-2 font-medium text-slate-800">
                  <span className="block max-w-[135px] truncate">{member.joined}</span>
                </td>
                <td className="h-[52px] px-3 py-2 text-center">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-900 transition-colors hover:bg-slate-100"
                    aria-label={`View ${member.name}`}
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex h-16 flex-wrap items-center justify-end gap-4 px-3 text-sm text-slate-800">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <button type="button" className="flex items-center gap-1">
            10 <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <span>1-10&nbsp; of&nbsp; 20</span>
        <button type="button" className="text-slate-400" aria-label="Previous page">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Next page">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

export default function MembersPage() {
  return (
    <>
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} card={card} />
        ))}
      </section>

      <div className="mt-4">
        <MembersTable />
      </div>
    </>
  );
}
