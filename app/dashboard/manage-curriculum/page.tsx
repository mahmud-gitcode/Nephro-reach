import React from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  Eye,
  FileText,
  GraduationCap,
  MoreHorizontal,
  Plus,
  Search,
  Users,
  Video,
} from "lucide-react";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const summaryCards: Array<{
  label: string;
  value: string;
  detail: string;
  icon: IconType;
  tone: string;
  iconTone: string;
}> = [
  {
    label: "Total Modules",
    value: "24",
    detail: "Across 4 learning paths",
    icon: BookOpen,
    tone: "bg-blue-100",
    iconTone: "text-blue-600",
  },
  {
    label: "Published",
    value: "18",
    detail: "Ready for members",
    icon: CheckCircle2,
    tone: "bg-emerald-100",
    iconTone: "text-emerald-600",
  },
  {
    label: "Drafts",
    value: "04",
    detail: "Needs review",
    icon: FileText,
    tone: "bg-amber-100",
    iconTone: "text-amber-600",
  },
  {
    label: "Live Classes",
    value: "08",
    detail: "Scheduled this month",
    icon: Video,
    tone: "bg-purple-100",
    iconTone: "text-purple-600",
  },
];

const curriculumItems = [
  {
    title: "Kidney Disease Basics",
    path: "CKD Foundation",
    type: "Video lesson",
    lessons: "6 lessons",
    audience: "All Members",
    duration: "42 min",
    updated: "12 April,2026",
    status: "Published",
  },
  {
    title: "Understanding Lab Values",
    path: "Patient Education",
    type: "Module",
    lessons: "8 lessons",
    audience: "Full Membership",
    duration: "55 min",
    updated: "5 May,2026",
    status: "Published",
  },
  {
    title: "Fluid Management at Home",
    path: "Dialysis Prep",
    type: "Handout",
    lessons: "4 handouts",
    audience: "Dialysis Class",
    duration: "28 min",
    updated: "20 March,2026",
    status: "Draft",
  },
  {
    title: "Medication Safety Checklist",
    path: "Care Tools",
    type: "Checklist",
    lessons: "3 resources",
    audience: "Caregivers",
    duration: "18 min",
    updated: "15 June,2026",
    status: "Published",
  },
  {
    title: "Nutrition for CKD",
    path: "Renal Nutrition",
    type: "Live class",
    lessons: "1 event",
    audience: "Full Membership",
    duration: "60 min",
    updated: "1 January,2026",
    status: "Scheduled",
  },
  {
    title: "When to Call Your Care Team",
    path: "Symptom Guidance",
    type: "Module",
    lessons: "5 lessons",
    audience: "All Members",
    duration: "35 min",
    updated: "10 November,2026",
    status: "Review",
  },
];

function SummaryCard({ card }: { card: (typeof summaryCards)[number] }) {
  return (
    <article className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold leading-8 text-slate-900">{card.value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${card.tone}`}>
          <card.icon className={`h-5 w-5 ${card.iconTone}`} />
        </span>
      </div>
      <p className="text-sm font-medium text-slate-500">{card.detail}</p>
    </article>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Published: "bg-emerald-50 text-emerald-600",
    Draft: "bg-amber-50 text-amber-600",
    Scheduled: "bg-blue-50 text-blue-600",
    Review: "bg-purple-50 text-purple-600",
  };

  return (
    <span className={`inline-flex h-6 items-center rounded px-2 text-sm font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

function CurriculumTable() {
  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Curriculum Library</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage videos, lessons, handouts, and live class resources.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block w-full sm:w-[277px]">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600" />
            <input
              type="search"
              placeholder="Search..."
              className="h-10 w-full rounded-lg border border-[#CBD5ED] bg-white pl-10 pr-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <button
            type="button"
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800"
          >
            All Status
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Module
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#C4CDD5]">
        <table className="w-full min-w-[1060px] border-collapse text-sm">
          <thead>
            <tr className="bg-[#F4F6F8] text-left">
              {["Curriculum", "Type", "Audience", "Duration", "Updated", "Status", "Actions"].map((header) => (
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
            {curriculumItems.map((item) => (
              <tr key={item.title} className="border-b border-dashed border-[#C4CDD5] last:border-0">
                <td className="h-[62px] px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00A76F] text-white">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold leading-5 text-slate-800">{item.title}</p>
                      <p className="truncate text-xs leading-[18px] text-slate-600">{item.path}</p>
                    </div>
                  </div>
                </td>
                <td className="h-[62px] px-3 py-2">
                  <p className="font-semibold leading-5 text-slate-800">{item.type}</p>
                  <p className="text-xs leading-[18px] text-slate-600">{item.lessons}</p>
                </td>
                <td className="h-[62px] px-3 py-2 font-medium text-slate-800">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" />
                    {item.audience}
                  </span>
                </td>
                <td className="h-[62px] px-3 py-2 font-medium text-slate-800">
                  <span className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-slate-500" />
                    {item.duration}
                  </span>
                </td>
                <td className="h-[62px] px-3 py-2 font-medium text-slate-800">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    {item.updated}
                  </span>
                </td>
                <td className="h-[62px] px-3 py-2">
                  <StatusPill status={item.status} />
                </td>
                <td className="h-[62px] px-3 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-900 transition-colors hover:bg-slate-100"
                      aria-label={`View ${item.title}`}
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-900 transition-colors hover:bg-slate-100"
                      aria-label={`Edit ${item.title}`}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-900 transition-colors hover:bg-slate-100"
                      aria-label={`More actions for ${item.title}`}
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ManageCurriculumPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-[42px] font-semibold leading-none tracking-[0.3px] text-slate-900 sm:text-[52px] xl:text-[60px]">
          Manage curriculum
        </h1>
      </div>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} card={card} />
        ))}
      </section>

      <div className="mt-6">
        <CurriculumTable />
      </div>
    </>
  );
}
