"use client";

import React from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

type HealthTab = "allergies" | "history";

const rawAllergyRows = [
  {
    type: "Medication" as const,
    reactionKey: "rashHives",
    reactionDefault: "Rash, Hives",
    severity: "Severe" as const,
    week: 1,
  },
  {
    type: "Food" as const,
    reactionKey: "eczemaSwelling",
    reactionDefault: "Eczema, Swelling",
    severity: "Moderate" as const,
    week: 2,
  },
  {
    type: "Environmental" as const,
    reactionKey: "drySkinItching",
    reactionDefault: "Dry Skin, Itching",
    severity: "Severe" as const,
    week: 3,
  },
  {
    type: "Food" as const,
    reactionKey: "rednessPeeling",
    reactionDefault: "Redness, Peeling",
    severity: "Mild" as const,
    week: 4,
  },
  {
    type: "Environmental" as const,
    reactionKey: "blisteringSensitivity",
    reactionDefault: "Blistering, Sensitivity",
    severity: "Mild" as const,
    week: 5,
  },
  {
    type: "Medication" as const,
    reactionKey: "flakingCracking",
    reactionDefault: "Flaking, Cracking",
    severity: "Moderate" as const,
    week: 6,
  },
  {
    type: "Food" as const,
    reactionKey: "itchingRash",
    reactionDefault: "Itching, Rash Extension",
    severity: "Mild" as const,
    week: 7,
  },
  {
    type: "Medication" as const,
    reactionKey: "swellingHeat",
    reactionDefault: "Swelling, Heat",
    severity: "Moderate" as const,
    week: 8,
  },
  {
    type: "Environmental" as const,
    reactionKey: "dryPatches",
    reactionDefault: "Dry Patches, Red Spots",
    severity: "Mild" as const,
    week: 9,
  },
  {
    type: "Environmental" as const,
    reactionKey: "discomfortTenderness",
    reactionDefault: "Discomfort, Tenderness",
    severity: "Mild" as const,
    week: 10,
  },
];

const rawHistoryRows = [
  {
    conditionKey: "ckd",
    conditionDefault: "Chronic Kidney Disease (CKD)",
    status: "Current" as const,
    diagnosed: "07/05/2016",
    week: 1,
  },
  {
    conditionKey: "hypertension",
    conditionDefault: "Hypertension (High Blood Pressure)",
    status: "Current" as const,
    diagnosed: "18/09/2016",
    week: 2,
  },
  {
    conditionKey: "diabetes",
    conditionDefault: "Type 2 Diabetes",
    status: "Current" as const,
    diagnosed: "16/08/2013",
    week: 3,
  },
  {
    conditionKey: "appendectomy",
    conditionDefault: "Appendectomy",
    status: "Current" as const,
    diagnosed: "15/08/2017",
    week: 4,
  },
  {
    conditionKey: "asthma",
    conditionDefault: "Asthma",
    status: "Current" as const,
    diagnosed: "28/10/2012",
    week: 5,
  },
  {
    conditionKey: "hypertension",
    conditionDefault: "Hypertension (High Blood Pressure)",
    status: "Past" as const,
    diagnosed: "07/05/2016",
    week: 2,
  },
  {
    conditionKey: "diabetes",
    conditionDefault: "Type 2 Diabetes",
    status: "Past" as const,
    diagnosed: "28/10/2012",
    week: 3,
  },
  {
    conditionKey: "appendectomy",
    conditionDefault: "Appendectomy",
    status: "Past" as const,
    diagnosed: "16/08/2013",
    week: 4,
  },
  {
    conditionKey: "ckd",
    conditionDefault: "Chronic Kidney Disease (CKD)",
    status: "Past" as const,
    diagnosed: "12/06/2020",
    week: 1,
  },
  {
    conditionKey: "hypertension",
    conditionDefault: "Hypertension (High Blood Pressure)",
    status: "Past" as const,
    diagnosed: "28/10/2012",
    week: 2,
  },
];

function Badge({
  typeKey,
  label,
}: {
  typeKey:
    | "Medication"
    | "Food"
    | "Environmental"
    | "Severe"
    | "Moderate"
    | "Mild"
    | "Current"
    | "Past";
  label: string;
}) {
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
    <span
      className={`inline-flex h-6 items-center rounded px-2 text-sm font-semibold ${
        styles[typeKey] || "bg-slate-100 text-slate-700"
      }`}
    >
      {label}
    </span>
  );
}

function RowActions({
  label,
  editLabel,
  deleteLabel,
}: {
  label: string;
  editLabel?: string;
  deleteLabel?: string;
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-md text-blue-600 transition-colors hover:bg-blue-50 cursor-pointer"
        aria-label={`${editLabel || "Edit"} ${label}`}
      >
        <Edit3 className="h-5 w-5" />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50 cursor-pointer"
        aria-label={`${deleteLabel || "Delete"} ${label}`}
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
}

function Tabs({
  activeTab,
  onTabChange,
  allergiesLabel,
  historyLabel,
}: {
  activeTab: HealthTab;
  onTabChange: (tab: HealthTab) => void;
  allergiesLabel?: string;
  historyLabel?: string;
}) {
  const tabs: Array<{ id: HealthTab; label: string }> = [
    { id: "allergies", label: allergiesLabel || "Allergies" },
    { id: "history", label: historyLabel || "Medical History" },
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
          className={`h-12 border-b-[3px] px-6 text-center text-sm font-medium tracking-[0.07px] transition-colors cursor-pointer ${
            activeTab === tab.id
              ? "border-blue-600 text-slate-950 shadow-[0_1px_1px_rgba(0,0,0,0.05)] font-bold"
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
        <h1 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
          {title}
        </h1>
        <p className="mt-2 text-sm font-medium leading-5 tracking-[0.07px] text-slate-900 sm:text-base sm:leading-6">
          {description}
        </p>
      </div>
      <button
        type="button"
        className="flex h-12 shrink-0 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700 cursor-pointer"
      >
        <Plus className="h-5 w-5" />
        {buttonLabel}
      </button>
    </div>
  );
}

function AllergiesTable() {
  const { dictionary } = useLanguage();
  const h = dictionary?.myHealth;

  const getTypeName = (type: "Medication" | "Food" | "Environmental") => {
    if (type === "Medication")
      return h?.allergies?.types?.medication || "Medication";
    if (type === "Food") return h?.allergies?.types?.food || "Food";
    return h?.allergies?.types?.environmental || "Environmental";
  };

  const getSeverityName = (severity: "Severe" | "Moderate" | "Mild") => {
    if (severity === "Severe")
      return h?.allergies?.severities?.severe || "Severe";
    if (severity === "Moderate")
      return h?.allergies?.severities?.moderate || "Moderate";
    return h?.allergies?.severities?.mild || "Mild";
  };

  const getReaction = (key: string, fallback: string) => {
    const reactions = h?.allergies?.reactions;
    if (reactions && typeof reactions === "object" && key in reactions) {
      return (reactions as Record<string, string>)[key] || fallback;
    }
    return fallback;
  };

  const headers = [
    h?.allergies?.headers?.name || "Name",
    h?.allergies?.headers?.type || "Type",
    h?.allergies?.headers?.reaction || "Reaction",
    h?.allergies?.headers?.severity || "Severity",
    h?.allergies?.headers?.notes || "Notes",
    h?.allergies?.headers?.actions || "Actions",
  ];

  const sampleName =
    h?.allergies?.sampleName || "Introduction to Wellness";
  const weekPrefix = h?.allergies?.weekPrefix || "Week";

  return (
    <div className="overflow-x-auto rounded-lg border border-[#C4CDD5]">
      <table className="w-full min-w-[1080px] border-collapse text-sm">
        <thead className="bg-[#F4F6F8]">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className={`h-[55px] border-b border-[#C4CDD5] px-3 text-left font-medium tracking-[0.07px] text-slate-950 ${
                  header === headers[0] ? "w-[358px]" : ""
                } ${header === headers[5] ? "text-center" : ""}`}
              >
                <span className="block border-l border-[#C4CDD5] pl-3 first:border-l-0">
                  {header}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rawAllergyRows.map((row, index) => {
            const reactionText = getReaction(row.reactionKey, row.reactionDefault);
            const notesText = `${weekPrefix} ${row.week}`;

            return (
              <tr
                key={`${row.reactionKey}-${index}`}
                className="border-b border-dashed border-[#C4CDD5] last:border-0"
              >
                <td className="h-[54px] max-w-[358px] truncate px-3 py-2 text-slate-800">
                  {sampleName}
                </td>
                <td className="h-[54px] px-3 py-2">
                  <Badge
                    typeKey={row.type}
                    label={getTypeName(row.type)}
                  />
                </td>
                <td className="h-[54px] max-w-[160px] truncate px-3 py-2 text-slate-800">
                  {reactionText}
                </td>
                <td className="h-[54px] px-3 py-2">
                  <Badge
                    typeKey={row.severity}
                    label={getSeverityName(row.severity)}
                  />
                </td>
                <td className="h-[54px] px-3 py-2 text-slate-800">
                  {notesText}
                </td>
                <td className="h-[54px] px-3 py-2">
                  <RowActions
                    label={sampleName}
                    editLabel={h?.actions?.edit}
                    deleteLabel={h?.actions?.delete}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MedicalHistoryTable() {
  const { dictionary } = useLanguage();
  const h = dictionary?.myHealth;

  const getConditionName = (key: string, fallback: string) => {
    const conditions = h?.history?.conditions;
    if (conditions && typeof conditions === "object" && key in conditions) {
      return (conditions as Record<string, string>)[key] || fallback;
    }
    return fallback;
  };

  const getStatusName = (status: "Current" | "Past") => {
    if (status === "Current")
      return h?.history?.statuses?.current || "Current";
    return h?.history?.statuses?.past || "Past";
  };

  const headers = [
    h?.history?.headers?.condition || "CONDITION / HISTORY",
    h?.history?.headers?.status || "Status",
    h?.history?.headers?.diagnosed || "Diagnosed",
    h?.history?.headers?.notes || "Notes",
    h?.history?.headers?.actions || "Actions",
  ];

  const weekPrefix = h?.allergies?.weekPrefix || "Week";

  return (
    <div className="overflow-x-auto rounded-lg border border-[#C4CDD5]">
      <table className="w-full min-w-[1080px] border-collapse text-sm">
        <thead className="bg-[#F8FAFC]">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className={`h-[55px] border-b border-[#C4CDD5] px-3 text-left font-medium tracking-[0.07px] text-slate-950 ${
                  header === headers[0] ? "w-[358px]" : ""
                } ${header === headers[4] ? "text-center" : ""}`}
              >
                <span className="block border-l border-[#C4CDD5] pl-3 first:border-l-0">
                  {header}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rawHistoryRows.map((row, index) => {
            const conditionText = getConditionName(
              row.conditionKey,
              row.conditionDefault
            );
            const notesText = `${weekPrefix} ${row.week}`;

            return (
              <tr
                key={`${row.conditionKey}-${index}`}
                className="border-b border-dashed border-[#C4CDD5] last:border-0"
              >
                <td className="h-[54px] max-w-[358px] truncate px-3 py-2 text-slate-800">
                  {conditionText}
                </td>
                <td className="h-[54px] px-3 py-2">
                  <Badge
                    typeKey={row.status}
                    label={getStatusName(row.status)}
                  />
                </td>
                <td className="h-[54px] px-3 py-2 text-slate-800">
                  {row.diagnosed}
                </td>
                <td className="h-[54px] px-3 py-2 text-slate-800">
                  {notesText}
                </td>
                <td className="h-[54px] px-3 py-2">
                  <RowActions
                    label={conditionText}
                    editLabel={h?.actions?.edit}
                    deleteLabel={h?.actions?.delete}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function MyHealthPage() {
  const [activeTab, setActiveTab] = React.useState<HealthTab>("allergies");
  const { dictionary } = useLanguage();
  const h = dictionary?.myHealth;

  return (
    <div className="space-y-6">
      <Tabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        allergiesLabel={h?.tabs?.allergies}
        historyLabel={h?.tabs?.history}
      />

      <section
        id={`${activeTab}-panel`}
        role="tabpanel"
        aria-labelledby={`${activeTab}-tab`}
        className="rounded-[14px] border border-[#E3E6F0] bg-white px-3 py-4 shadow-sm"
      >
        {activeTab === "allergies" ? (
          <div className="space-y-3.5">
            <SectionHeader
              title={h?.allergies?.title || "Allergy"}
              description={
                h?.allergies?.description ||
                "List of substances, medications, foods or environmental factors you are allergic to."
              }
              buttonLabel={h?.allergies?.addBtn || "Add Allergy"}
            />
            <AllergiesTable />
          </div>
        ) : (
          <div className="space-y-3.5">
            <SectionHeader
              title={h?.history?.title || "Medical History"}
              description={
                h?.history?.description ||
                "Your past and current medical conditions, surgeries and major health events."
              }
              buttonLabel={h?.history?.addBtn || "Add Condition"}
            />
            <MedicalHistoryTable />
          </div>
        )}
      </section>
    </div>
  );
}
