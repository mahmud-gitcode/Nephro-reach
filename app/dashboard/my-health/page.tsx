"use client";

import React from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";

type HealthTab = "allergies" | "history";

const allergyRows = [
  {
    name: "Introduction to Wellness",
    type: "Medication",
    reaction: "Rash, Hives",
    severity: "Severe",
    notes: "Week 1",
  },
  {
    name: "Introduction to Wellness",
    type: "Food",
    reaction: "Eczema, Swelling",
    severity: "Moderate",
    notes: "Week 2",
  },
  {
    name: "Introduction to Wellness",
    type: "Environmental",
    reaction: "Dry Skin, Itching",
    severity: "Severe",
    notes: "Week 3",
  },
  {
    name: "Introduction to Wellness",
    type: "Food",
    reaction: "Redness, Peeling",
    severity: "Mild",
    notes: "Week 4",
  },
  {
    name: "Introduction to Wellness",
    type: "Environmental",
    reaction: "Blistering, Sensitivity",
    severity: "Mild",
    notes: "Week 5",
  },
  {
    name: "Introduction to Wellness",
    type: "Medication",
    reaction: "Flaking, Cracking",
    severity: "Moderate",
    notes: "Week 6",
  },
  {
    name: "Introduction to Wellness",
    type: "Food",
    reaction: "Itching, Rash Extension",
    severity: "Mild",
    notes: "Week 7",
  },
  {
    name: "Introduction to Wellness",
    type: "Medication",
    reaction: "Swelling, Heat",
    severity: "Moderate",
    notes: "Week 8",
  },
  {
    name: "Introduction to Wellness",
    type: "Environmental",
    reaction: "Dry Patches, Red Spots",
    severity: "Mild",
    notes: "Week 9",
  },
  {
    name: "Introduction to Wellness",
    type: "Environmental",
    reaction: "Discomfort, Tenderness",
    severity: "Mild",
    notes: "Week 10",
  },
];

const historyRows = [
  {
    condition: "Chronic Kidney Disease (CKD)",
    status: "Current",
    diagnosed: "07/05/2016",
    notes: "Week 1",
  },
  {
    condition: "Hypertension (High Blood Pressure)",
    status: "Current",
    diagnosed: "18/09/2016",
    notes: "Week 2",
  },
  {
    condition: "Type 2 Diabetes",
    status: "Current",
    diagnosed: "16/08/2013",
    notes: "Week 3",
  },
  {
    condition: "Appendectomy",
    status: "Current",
    diagnosed: "15/08/2017",
    notes: "Week 4",
  },
  {
    condition: "Asthma",
    status: "Current",
    diagnosed: "28/10/2012",
    notes: "Week 5",
  },
  {
    condition: "Hypertension (High Blood Pressure)",
    status: "Past",
    diagnosed: "07/05/2016",
    notes: "Week 2",
  },
  {
    condition: "Type 2 Diabetes",
    status: "Past",
    diagnosed: "28/10/2012",
    notes: "Week 3",
  },
  {
    condition: "Appendectomy",
    status: "Past",
    diagnosed: "16/08/2013",
    notes: "Week 4",
  },
  {
    condition: "Chronic Kidney Disease (CKD)",
    status: "Past",
    diagnosed: "12/06/2020",
    notes: "Week 1",
  },
  {
    condition: "Hypertension (High Blood Pressure)",
    status: "Past",
    diagnosed: "28/10/2012",
    notes: "Week 2",
  },
];

function Badge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    Medication: "bg-[#F9CFFF] text-[#AF14C7]",
    Food: "bg-emerald-100 text-emerald-600",
    Environmental: "bg-blue-100 text-blue-600",
    Severe: "bg-red-100 text-red-500",
    Moderate: "bg-[#FFE98F] text-[#9C6200]",
    Mild: "bg-amber-100 text-amber-500",
    Current: "bg-emerald-50 text-emerald-600",
    Past: "bg-slate-200 text-slate-600",
  };

  return (
    <span className={`inline-flex h-6 items-center rounded px-2 text-sm font-semibold ${styles[value]}`}>
      {value}
    </span>
  );
}

function RowActions({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-md text-blue-600 transition-colors hover:bg-blue-50"
        aria-label={`Edit ${label}`}
      >
        <Edit3 className="h-5 w-5" />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50"
        aria-label={`Delete ${label}`}
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
}

function Tabs({
  activeTab,
  onTabChange,
}: {
  activeTab: HealthTab;
  onTabChange: (tab: HealthTab) => void;
}) {
  const tabs: Array<{ id: HealthTab; label: string }> = [
    { id: "allergies", label: "Allergies" },
    { id: "history", label: "Medical History" },
  ];

  return (
    <div
      className="grid h-12 w-full max-w-[540px] grid-cols-2 gap-1 border-b border-slate-200"
      role="tablist"
      aria-label="My Health sections"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`${tab.id}-panel`}
          id={`${tab.id}-tab`}
          onClick={() => onTabChange(tab.id)}
          className={`h-12 border-b-[3px] px-6 text-center text-sm font-medium tracking-[0.07px] transition-colors ${
            activeTab === tab.id
              ? "border-blue-600 text-slate-950 shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function SectionHeader({
  title,
  description,
  buttonLabel,
}: {
  title: string;
  description: string;
  buttonLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">{title}</h1>
        <p className="mt-2 text-sm font-medium leading-5 tracking-[0.07px] text-slate-900 sm:text-base sm:leading-6">
          {description}
        </p>
      </div>
      <button
        type="button"
        className="flex h-12 shrink-0 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
      >
        <Plus className="h-5 w-5" />
        {buttonLabel}
      </button>
    </div>
  );
}

function AllergiesTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#C4CDD5]">
      <table className="w-full min-w-[1080px] border-collapse text-sm">
        <thead className="bg-[#F4F6F8]">
          <tr>
            {["Name", "Type", "Reaction", "Severity", "Notes", "Actions"].map((header) => (
              <th
                key={header}
                className={`h-[55px] border-b border-[#C4CDD5] px-3 text-left font-medium tracking-[0.07px] text-slate-950 ${
                  header === "Name" ? "w-[358px]" : ""
                } ${header === "Actions" ? "text-center" : ""}`}
              >
                <span className="block border-l border-[#C4CDD5] pl-3 first:border-l-0">
                  {header}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allergyRows.map((row, index) => (
            <tr key={`${row.reaction}-${index}`} className="border-b border-dashed border-[#C4CDD5] last:border-0">
              <td className="h-[54px] max-w-[358px] truncate px-3 py-2 text-slate-800">{row.name}</td>
              <td className="h-[54px] px-3 py-2">
                <Badge value={row.type} />
              </td>
              <td className="h-[54px] max-w-[160px] truncate px-3 py-2 text-slate-800">{row.reaction}</td>
              <td className="h-[54px] px-3 py-2">
                <Badge value={row.severity} />
              </td>
              <td className="h-[54px] px-3 py-2 text-slate-800">{row.notes}</td>
              <td className="h-[54px] px-3 py-2">
                <RowActions label={row.name} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MedicalHistoryTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#C4CDD5]">
      <table className="w-full min-w-[1080px] border-collapse text-sm">
        <thead className="bg-[#F8FAFC]">
          <tr>
            {["CONDITION / HISTORY", "Status", "Diagnosed", "Notes", "Actions"].map((header) => (
              <th
                key={header}
                className={`h-[55px] border-b border-[#C4CDD5] px-3 text-left font-medium tracking-[0.07px] text-slate-950 ${
                  header === "CONDITION / HISTORY" ? "w-[358px]" : ""
                } ${header === "Actions" ? "text-center" : ""}`}
              >
                <span className="block border-l border-[#C4CDD5] pl-3 first:border-l-0">
                  {header}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {historyRows.map((row, index) => (
            <tr key={`${row.condition}-${index}`} className="border-b border-dashed border-[#C4CDD5] last:border-0">
              <td className="h-[54px] max-w-[358px] truncate px-3 py-2 text-slate-800">{row.condition}</td>
              <td className="h-[54px] px-3 py-2">
                <Badge value={row.status} />
              </td>
              <td className="h-[54px] px-3 py-2 text-slate-800">{row.diagnosed}</td>
              <td className="h-[54px] px-3 py-2 text-slate-800">{row.notes}</td>
              <td className="h-[54px] px-3 py-2">
                <RowActions label={row.condition} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MyHealthPage() {
  const [activeTab, setActiveTab] = React.useState<HealthTab>("allergies");

  return (
    <div className="space-y-6">
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      <section
        id={`${activeTab}-panel`}
        role="tabpanel"
        aria-labelledby={`${activeTab}-tab`}
        className="rounded-[14px] border border-[#E3E6F0] bg-white px-3 py-4 shadow-sm"
      >
        {activeTab === "allergies" ? (
          <div className="space-y-3.5">
            <SectionHeader
              title="Allergy"
              description="List of substances, medications, foods or environmental factors you are allergic to."
              buttonLabel="Add Allergy"
            />
            <AllergiesTable />
          </div>
        ) : (
          <div className="space-y-3.5">
            <SectionHeader
              title="Medical History"
              description="Your past and current medical conditions, surgeries and major health events."
              buttonLabel="Add Condition"
            />
            <MedicalHistoryTable />
          </div>
        )}
      </section>
    </div>
  );
}
