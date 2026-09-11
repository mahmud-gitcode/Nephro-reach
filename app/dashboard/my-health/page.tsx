"use client";

import React from "react";
import { Edit3, Plus, Trash2, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

type HealthTab = "allergies" | "history";

type AllergyType = "Medication" | "Food" | "Environmental";
type AllergySeverity = "Severe" | "Moderate" | "Mild";
type ConditionStatus = "Current" | "Past";

type AllergyRow = {
  id: string;
  /** Set on user-added rows; seeded rows fall back to the sample name. */
  name?: string;
  type: AllergyType;
  /** Seeded rows translate through this key; user-added rows omit it. */
  reactionKey?: string;
  reactionDefault: string;
  severity: AllergySeverity;
  /** Set on user-added rows; seeded rows show "Week N". */
  notes?: string;
  week?: number;
};

type HistoryRow = {
  id: string;
  conditionKey?: string;
  conditionDefault: string;
  status: ConditionStatus;
  diagnosed: string;
  notes?: string;
  week?: number;
};

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
  onAddClick,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  onAddClick: () => void;
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
        onClick={onAddClick}
        className="flex h-12 shrink-0 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700 cursor-pointer"
      >
        <Plus className="h-5 w-5" />
        {buttonLabel}
      </button>
    </div>
  );
}

function AllergiesTable({ rows }: { rows: AllergyRow[] }) {
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
          {rows.map((row) => {
            const reactionText = row.reactionKey
              ? getReaction(row.reactionKey, row.reactionDefault)
              : row.reactionDefault;
            const notesText = row.notes ?? `${weekPrefix} ${row.week}`;
            const nameText = row.name || sampleName;

            return (
              <tr
                key={row.id}
                className="border-b border-dashed border-[#C4CDD5] last:border-0"
              >
                <td className="h-[54px] max-w-[358px] truncate px-3 py-2 text-slate-800">
                  {nameText}
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
                    label={nameText}
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

function MedicalHistoryTable({ rows }: { rows: HistoryRow[] }) {
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
          {rows.map((row) => {
            const conditionText = row.conditionKey
              ? getConditionName(row.conditionKey, row.conditionDefault)
              : row.conditionDefault;
            const notesText = row.notes ?? `${weekPrefix} ${row.week}`;

            return (
              <tr
                key={row.id}
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

const FIELD_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({
  onClose,
  submitLabel,
  cancelLabel,
}: {
  onClose: () => void;
  submitLabel: string;
  cancelLabel: string;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-2xs transition-colors hover:bg-blue-700 cursor-pointer"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function AddAllergyModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (row: Omit<AllergyRow, "id">) => void;
}) {
  const { language, dictionary } = useLanguage();
  const h = dictionary?.myHealth;
  const isEs = language === "ES";

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<AllergyType>("Medication");
  const [reaction, setReaction] = React.useState("");
  const [severity, setSeverity] = React.useState<AllergySeverity>("Moderate");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(isEs ? "Ingrese el nombre de la alergia." : "Enter an allergy name.");
      return;
    }
    if (!reaction.trim()) {
      setError(isEs ? "Ingrese la reacción." : "Enter a reaction.");
      return;
    }
    onSave({
      name: name.trim(),
      type,
      reactionDefault: reaction.trim(),
      severity,
      notes: notes.trim() || "—",
    });
  };

  return (
    <ModalShell title={h?.allergies?.addBtn || "Add Allergy"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <label htmlFor="allergy-name" className="block text-xs font-bold text-slate-800">
            {h?.allergies?.headers?.name || "Name"} <span className="text-rose-500">*</span>
          </label>
          <input
            id="allergy-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={isEs ? "ej. Penicilina" : "e.g. Penicillin"}
            className={FIELD_CLASS}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="allergy-type" className="block text-xs font-bold text-slate-800">
              {h?.allergies?.headers?.type || "Type"}
            </label>
            <select
              id="allergy-type"
              value={type}
              onChange={(event) => setType(event.target.value as AllergyType)}
              className={`${FIELD_CLASS} cursor-pointer`}
            >
              <option value="Medication">{h?.allergies?.types?.medication || "Medication"}</option>
              <option value="Food">{h?.allergies?.types?.food || "Food"}</option>
              <option value="Environmental">
                {h?.allergies?.types?.environmental || "Environmental"}
              </option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="allergy-severity" className="block text-xs font-bold text-slate-800">
              {h?.allergies?.headers?.severity || "Severity"}
            </label>
            <select
              id="allergy-severity"
              value={severity}
              onChange={(event) => setSeverity(event.target.value as AllergySeverity)}
              className={`${FIELD_CLASS} cursor-pointer`}
            >
              <option value="Severe">{h?.allergies?.severities?.severe || "Severe"}</option>
              <option value="Moderate">{h?.allergies?.severities?.moderate || "Moderate"}</option>
              <option value="Mild">{h?.allergies?.severities?.mild || "Mild"}</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="allergy-reaction" className="block text-xs font-bold text-slate-800">
            {h?.allergies?.headers?.reaction || "Reaction"} <span className="text-rose-500">*</span>
          </label>
          <input
            id="allergy-reaction"
            value={reaction}
            onChange={(event) => setReaction(event.target.value)}
            placeholder={isEs ? "ej. Sarpullido, urticaria" : "e.g. Rash, Hives"}
            className={FIELD_CLASS}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="allergy-notes" className="block text-xs font-bold text-slate-800">
            {h?.allergies?.headers?.notes || "Notes"}
          </label>
          <textarea
            id="allergy-notes"
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={isEs ? "Opcional" : "Optional"}
            className={`${FIELD_CLASS} resize-none`}
          />
        </div>

        <ModalFooter
          onClose={onClose}
          cancelLabel={isEs ? "Cancelar" : "Cancel"}
          submitLabel={h?.allergies?.addBtn || "Add Allergy"}
        />
      </form>
    </ModalShell>
  );
}

function AddConditionModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (row: Omit<HistoryRow, "id">) => void;
}) {
  const { language, dictionary } = useLanguage();
  const h = dictionary?.myHealth;
  const isEs = language === "ES";

  const [condition, setCondition] = React.useState("");
  const [status, setStatus] = React.useState<ConditionStatus>("Current");
  const [diagnosed, setDiagnosed] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!condition.trim()) {
      setError(isEs ? "Ingrese la condición." : "Enter a condition.");
      return;
    }

    // The table shows DD/MM/YYYY; the date input hands back YYYY-MM-DD
    let diagnosedText = "—";
    if (diagnosed) {
      const [year, month, day] = diagnosed.split("-");
      diagnosedText = `${day}/${month}/${year}`;
    }

    onSave({
      conditionDefault: condition.trim(),
      status,
      diagnosed: diagnosedText,
      notes: notes.trim() || "—",
    });
  };

  return (
    <ModalShell title={h?.history?.addBtn || "Add Condition"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <label htmlFor="condition-name" className="block text-xs font-bold text-slate-800">
            {h?.history?.headers?.condition || "Condition / History"}{" "}
            <span className="text-rose-500">*</span>
          </label>
          <input
            id="condition-name"
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            placeholder={isEs ? "ej. Hipertensión" : "e.g. Hypertension"}
            className={FIELD_CLASS}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="condition-status" className="block text-xs font-bold text-slate-800">
              {h?.history?.headers?.status || "Status"}
            </label>
            <select
              id="condition-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as ConditionStatus)}
              className={`${FIELD_CLASS} cursor-pointer`}
            >
              <option value="Current">{h?.history?.statuses?.current || "Current"}</option>
              <option value="Past">{h?.history?.statuses?.past || "Past"}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="condition-diagnosed" className="block text-xs font-bold text-slate-800">
              {h?.history?.headers?.diagnosed || "Diagnosed"}
            </label>
            <input
              id="condition-diagnosed"
              type="date"
              value={diagnosed}
              onChange={(event) => setDiagnosed(event.target.value)}
              className={`${FIELD_CLASS} cursor-pointer`}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="condition-notes" className="block text-xs font-bold text-slate-800">
            {h?.history?.headers?.notes || "Notes"}
          </label>
          <textarea
            id="condition-notes"
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={isEs ? "Opcional" : "Optional"}
            className={`${FIELD_CLASS} resize-none`}
          />
        </div>

        <ModalFooter
          onClose={onClose}
          cancelLabel={isEs ? "Cancelar" : "Cancel"}
          submitLabel={h?.history?.addBtn || "Add Condition"}
        />
      </form>
    </ModalShell>
  );
}

export default function MyHealthPage() {
  const [activeTab, setActiveTab] = React.useState<HealthTab>("allergies");
  const { dictionary } = useLanguage();
  const h = dictionary?.myHealth;

  const [allergyRows, setAllergyRows] = React.useState<AllergyRow[]>(() =>
    rawAllergyRows.map((row, index) => ({ ...row, id: `allergy-seed-${index}` })),
  );
  const [historyRows, setHistoryRows] = React.useState<HistoryRow[]>(() =>
    rawHistoryRows.map((row, index) => ({ ...row, id: `history-seed-${index}` })),
  );

  const [isAllergyModalOpen, setIsAllergyModalOpen] = React.useState(false);
  const [isConditionModalOpen, setIsConditionModalOpen] = React.useState(false);

  const handleAddAllergy = (row: Omit<AllergyRow, "id">) => {
    setAllergyRows((prev) => [{ ...row, id: `allergy-${Date.now()}` }, ...prev]);
    setIsAllergyModalOpen(false);
  };

  const handleAddCondition = (row: Omit<HistoryRow, "id">) => {
    setHistoryRows((prev) => [{ ...row, id: `history-${Date.now()}` }, ...prev]);
    setIsConditionModalOpen(false);
  };

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
              onAddClick={() => setIsAllergyModalOpen(true)}
            />
            <AllergiesTable rows={allergyRows} />
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
              onAddClick={() => setIsConditionModalOpen(true)}
            />
            <MedicalHistoryTable rows={historyRows} />
          </div>
        )}
      </section>

      {isAllergyModalOpen ? (
        <AddAllergyModal
          onClose={() => setIsAllergyModalOpen(false)}
          onSave={handleAddAllergy}
        />
      ) : null}

      {isConditionModalOpen ? (
        <AddConditionModal
          onClose={() => setIsConditionModalOpen(false)}
          onSave={handleAddCondition}
        />
      ) : null}
    </div>
  );
}
