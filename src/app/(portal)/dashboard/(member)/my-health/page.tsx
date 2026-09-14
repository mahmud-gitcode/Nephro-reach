"use client";

import React from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  Badge,
  Button,
  Card,
  FormField,
  Input,
  Modal,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tabs,
  TabPanel,
  Textarea,
} from "@/components/ui";
import type { BadgeProps, TabItem } from "@/components/ui";

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

/* Colour is spent on what needs attention, not on everything.

   Severity and status say something a member may have to act on, so they
   carry tone. Allergy TYPE is a category — the word "Food" already says
   food — so it stays neutral and outlined. Previously all three types were
   coloured, which put five competing hues in one table row and left
   "Severe" with no more visual weight than "Environmental". */
const severityBadge: Record<
  AllergySeverity,
  Pick<BadgeProps, "tone" | "variant">
> = {
  Severe: { tone: "danger", variant: "soft" },
  Moderate: { tone: "warning", variant: "soft" },
  Mild: { tone: "neutral", variant: "soft" },
};

const statusBadge: Record<
  ConditionStatus,
  Pick<BadgeProps, "tone" | "variant">
> = {
  Current: { tone: "success", variant: "soft" },
  Past: { tone: "neutral", variant: "soft" },
};

function RowActions({
  label,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: {
  label: string;
  editLabel?: string;
  deleteLabel?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-inline-md">
      <Button
        iconOnly
        size="small"
        variant="neutral"
        appearance="fill-stroke"
        onClick={onEdit}
        aria-label={`${editLabel || "Edit"} ${label}`}
      >
        <Edit3 aria-hidden="true" />
      </Button>
      <Button
        iconOnly
        size="small"
        variant="danger"
        appearance="fill-stroke"
        onClick={onDelete}
        aria-label={`${deleteLabel || "Delete"} ${label}`}
      >
        <Trash2 aria-hidden="true" />
      </Button>
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
    <div className="flex flex-col gap-inset-md sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-heading-4 text-fg">{title}</h2>
        <p className="mt-stack-sm measure text-body-sm text-fg-secondary">
          {description}
        </p>
      </div>
      <Button
        onClick={onAddClick}
        leadingIcon={<Plus aria-hidden="true" />}
        className="shrink-0"
      >
        {buttonLabel}
      </Button>
    </div>
  );
}

function AllergiesTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: AllergyRow[];
  onEdit: (row: AllergyRow) => void;
  onDelete: (id: string) => void;
}) {
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

  const sampleName = h?.allergies?.sampleName || "Introduction to Wellness";
  const weekPrefix = h?.allergies?.weekPrefix || "Week";

  return (
    <Card padding="none" className="overflow-hidden">
      <Table minWidth={1080}>
        <TableHead className="bg-surface-sunken">
          <TableRow>
            {headers.map((header, index) => (
              <TableHeaderCell
                key={header}
                className={`${index === 0 ? "w-[358px]" : ""} ${
                  index === 5 ? "text-center" : ""
                }`}
              >
                {header}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const reactionText = row.reactionKey
              ? getReaction(row.reactionKey, row.reactionDefault)
              : row.reactionDefault;
            const notesText = row.notes ?? `${weekPrefix} ${row.week}`;
            const nameText = row.name || sampleName;

            return (
              <TableRow key={row.id}>
                <TableCell emphasis className="max-w-[358px] truncate">
                  {nameText}
                </TableCell>
                <TableCell>{getTypeName(row.type)}</TableCell>
                <TableCell className="max-w-[160px] truncate">
                  {reactionText}
                </TableCell>
                <TableCell>
                  <Badge {...severityBadge[row.severity]} className="w-[92px]">
                    {getSeverityName(row.severity)}
                  </Badge>
                </TableCell>
                <TableCell>{notesText}</TableCell>
                <TableCell>
                  <RowActions
                    label={nameText}
                    editLabel={h?.actions?.edit}
                    deleteLabel={h?.actions?.delete}
                    onEdit={() => onEdit(row)}
                    onDelete={() => onDelete(row.id)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function MedicalHistoryTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: HistoryRow[];
  onEdit: (row: HistoryRow) => void;
  onDelete: (id: string) => void;
}) {
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
    if (status === "Current") return h?.history?.statuses?.current || "Current";
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
    <Card padding="none" className="overflow-hidden">
      <Table minWidth={1080}>
        <TableHead className="bg-surface-sunken">
          <TableRow>
            {headers.map((header, index) => (
              <TableHeaderCell
                key={header}
                className={`${index === 0 ? "w-[358px]" : ""} ${
                  index === 4 ? "text-center" : ""
                }`}
              >
                {header}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const conditionText = row.conditionKey
              ? getConditionName(row.conditionKey, row.conditionDefault)
              : row.conditionDefault;
            const notesText = row.notes ?? `${weekPrefix} ${row.week}`;

            return (
              <TableRow key={row.id}>
                <TableCell emphasis className="max-w-[358px] truncate">
                  {conditionText}
                </TableCell>
                <TableCell>
                  <Badge {...statusBadge[row.status]} className="w-[84px]">
                    {getStatusName(row.status)}
                  </Badge>
                </TableCell>
                <TableCell>{row.diagnosed}</TableCell>
                <TableCell>{notesText}</TableCell>
                <TableCell>
                  <RowActions
                    label={conditionText}
                    editLabel={h?.actions?.edit}
                    deleteLabel={h?.actions?.delete}
                    onEdit={() => onEdit(row)}
                    onDelete={() => onDelete(row.id)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

/* Both modals go through here, so the focus trap, Escape and scroll lock
   arrive in both at once. The submit button lives in the footer and reaches
   the form through form="…", which is what lets <Modal> own the shell. */
function ModalShell({
  title,
  formId,
  onClose,
  submitLabel,
  cancelLabel,
  children,
}: {
  title: string;
  formId: string;
  onClose: () => void;
  submitLabel: string;
  cancelLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button type="submit" form={formId}>
            {submitLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

function AllergyModal({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: AllergyRow | null;
  onClose: () => void;
  onSave: (row: Omit<AllergyRow, "id">, id?: string) => void;
}) {
  const { language, dictionary } = useLanguage();
  const h = dictionary?.myHealth;
  const isEs = language === "ES";
  const sampleName = h?.allergies?.sampleName || "Introduction to Wellness";
  const weekPrefix = h?.allergies?.weekPrefix || "Week";

  const getReaction = (key: string, fallback: string) => {
    const reactions = h?.allergies?.reactions;
    if (reactions && typeof reactions === "object" && key in reactions) {
      return (reactions as Record<string, string>)[key] || fallback;
    }
    return fallback;
  };

  const initialName = initialData?.name || (initialData ? sampleName : "");
  const initialReaction = initialData
    ? initialData.reactionKey
      ? getReaction(initialData.reactionKey, initialData.reactionDefault)
      : initialData.reactionDefault
    : "";
  const initialNotes = initialData
    ? (initialData.notes ??
      (initialData.week ? `${weekPrefix} ${initialData.week}` : ""))
    : "";

  const [name, setName] = React.useState(initialName);
  const [type, setType] = React.useState<AllergyType>(
    initialData?.type || "Medication",
  );
  const [reaction, setReaction] = React.useState(initialReaction);
  const [severity, setSeverity] = React.useState<AllergySeverity>(
    initialData?.severity || "Moderate",
  );
  const [notes, setNotes] = React.useState(initialNotes);
  const [error, setError] = React.useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(
        isEs ? "Ingrese el nombre de la alergia." : "Enter an allergy name.",
      );
      return;
    }
    if (!reaction.trim()) {
      setError(isEs ? "Ingrese la reacción." : "Enter a reaction.");
      return;
    }
    onSave(
      {
        name: name.trim(),
        type,
        reactionDefault: reaction.trim(),
        severity,
        notes: notes.trim() || "—",
      },
      initialData?.id,
    );
  };

  const title = initialData
    ? isEs
      ? "Editar Alergia"
      : "Edit Allergy"
    : h?.allergies?.addBtn || "Add Allergy";
  const submitLabel = initialData
    ? isEs
      ? "Guardar Cambios"
      : "Save Changes"
    : h?.allergies?.addBtn || "Add Allergy";

  return (
    <ModalShell
      title={title}
      formId="allergy-form"
      onClose={onClose}
      cancelLabel={isEs ? "Cancelar" : "Cancel"}
      submitLabel={submitLabel}
    >
      <form
        id="allergy-form"
        onSubmit={handleSubmit}
        className="space-y-stack-lg"
      >
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <FormField label={h?.allergies?.headers?.name || "Name"} required>
          {(props) => (
            <Input
              {...props}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={isEs ? "ej. Penicilina" : "e.g. Penicillin"}
              autoFocus
            />
          )}
        </FormField>

        <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
          <FormField label={h?.allergies?.headers?.type || "Type"}>
            {(props) => (
              <Select
                {...props}
                value={type}
                onChange={(event) => setType(event.target.value as AllergyType)}
              >
                <option value="Medication">
                  {h?.allergies?.types?.medication || "Medication"}
                </option>
                <option value="Food">
                  {h?.allergies?.types?.food || "Food"}
                </option>
                <option value="Environmental">
                  {h?.allergies?.types?.environmental || "Environmental"}
                </option>
              </Select>
            )}
          </FormField>

          <FormField label={h?.allergies?.headers?.severity || "Severity"}>
            {(props) => (
              <Select
                {...props}
                value={severity}
                onChange={(event) =>
                  setSeverity(event.target.value as AllergySeverity)
                }
              >
                <option value="Severe">
                  {h?.allergies?.severities?.severe || "Severe"}
                </option>
                <option value="Moderate">
                  {h?.allergies?.severities?.moderate || "Moderate"}
                </option>
                <option value="Mild">
                  {h?.allergies?.severities?.mild || "Mild"}
                </option>
              </Select>
            )}
          </FormField>
        </div>

        <FormField
          label={h?.allergies?.headers?.reaction || "Reaction"}
          required
        >
          {(props) => (
            <Input
              {...props}
              value={reaction}
              onChange={(event) => setReaction(event.target.value)}
              placeholder={
                isEs ? "ej. Sarpullido, urticaria" : "e.g. Rash, Hives"
              }
            />
          )}
        </FormField>

        <FormField
          label={h?.allergies?.headers?.notes || "Notes"}
          optionalLabel={isEs ? "Opcional" : "Optional"}
        >
          {(props) => (
            <Textarea
              {...props}
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="resize-none"
            />
          )}
        </FormField>
      </form>
    </ModalShell>
  );
}

function ConditionModal({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: HistoryRow | null;
  onClose: () => void;
  onSave: (row: Omit<HistoryRow, "id">, id?: string) => void;
}) {
  const { language, dictionary } = useLanguage();
  const h = dictionary?.myHealth;
  const isEs = language === "ES";
  const weekPrefix = h?.allergies?.weekPrefix || "Week";

  const getConditionName = (key: string, fallback: string) => {
    const conditions = h?.history?.conditions;
    if (conditions && typeof conditions === "object" && key in conditions) {
      return (conditions as Record<string, string>)[key] || fallback;
    }
    return fallback;
  };

  const parseToDateInput = (ddmmyyyy?: string) => {
    if (!ddmmyyyy || ddmmyyyy === "—") return "";
    const parts = ddmmyyyy.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return ddmmyyyy;
  };

  const initialCondition = initialData
    ? initialData.conditionKey
      ? getConditionName(initialData.conditionKey, initialData.conditionDefault)
      : initialData.conditionDefault
    : "";
  const initialDiagnosed = parseToDateInput(initialData?.diagnosed);
  const initialNotes = initialData
    ? (initialData.notes ??
      (initialData.week ? `${weekPrefix} ${initialData.week}` : ""))
    : "";

  const [condition, setCondition] = React.useState(initialCondition);
  const [status, setStatus] = React.useState<ConditionStatus>(
    initialData?.status || "Current",
  );
  const [diagnosed, setDiagnosed] = React.useState(initialDiagnosed);
  const [notes, setNotes] = React.useState(initialNotes);
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

    onSave(
      {
        conditionDefault: condition.trim(),
        status,
        diagnosed: diagnosedText,
        notes: notes.trim() || "—",
      },
      initialData?.id,
    );
  };

  const title = initialData
    ? isEs
      ? "Editar Condición"
      : "Edit Condition"
    : h?.history?.addBtn || "Add Condition";
  const submitLabel = initialData
    ? isEs
      ? "Guardar Cambios"
      : "Save Changes"
    : h?.history?.addBtn || "Add Condition";

  return (
    <ModalShell
      title={title}
      formId="condition-form"
      onClose={onClose}
      cancelLabel={isEs ? "Cancelar" : "Cancel"}
      submitLabel={submitLabel}
    >
      <form
        id="condition-form"
        onSubmit={handleSubmit}
        className="space-y-stack-lg"
      >
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <FormField
          label={h?.history?.headers?.condition || "Condition / History"}
          required
        >
          {(props) => (
            <Input
              {...props}
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
              placeholder={isEs ? "ej. Hipertensión" : "e.g. Hypertension"}
              autoFocus
            />
          )}
        </FormField>

        <div className="grid grid-cols-1 gap-inset-md sm:grid-cols-2">
          <FormField label={h?.history?.headers?.status || "Status"}>
            {(props) => (
              <Select
                {...props}
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ConditionStatus)
                }
              >
                <option value="Current">
                  {h?.history?.statuses?.current || "Current"}
                </option>
                <option value="Past">
                  {h?.history?.statuses?.past || "Past"}
                </option>
              </Select>
            )}
          </FormField>

          <FormField label={h?.history?.headers?.diagnosed || "Diagnosed"}>
            {(props) => (
              <Input
                {...props}
                type="date"
                value={diagnosed}
                onChange={(event) => setDiagnosed(event.target.value)}
              />
            )}
          </FormField>
        </div>

        <FormField
          label={h?.history?.headers?.notes || "Notes"}
          optionalLabel={isEs ? "Opcional" : "Optional"}
        >
          {(props) => (
            <Textarea
              {...props}
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="resize-none"
            />
          )}
        </FormField>
      </form>
    </ModalShell>
  );
}

export default function MyHealthPage() {
  const [activeTab, setActiveTab] = React.useState<HealthTab>("allergies");
  const { dictionary } = useLanguage();
  const h = dictionary?.myHealth;

  const [allergyRows, setAllergyRows] = React.useState<AllergyRow[]>(() =>
    rawAllergyRows.map((row, index) => ({
      ...row,
      id: `allergy-seed-${index}`,
    })),
  );
  const [historyRows, setHistoryRows] = React.useState<HistoryRow[]>(() =>
    rawHistoryRows.map((row, index) => ({
      ...row,
      id: `history-seed-${index}`,
    })),
  );

  const [isAllergyModalOpen, setIsAllergyModalOpen] = React.useState(false);
  const [isConditionModalOpen, setIsConditionModalOpen] = React.useState(false);
  const [editingAllergy, setEditingAllergy] = React.useState<AllergyRow | null>(
    null,
  );
  const [editingCondition, setEditingCondition] =
    React.useState<HistoryRow | null>(null);

  const handleOpenAddAllergy = () => {
    setEditingAllergy(null);
    setIsAllergyModalOpen(true);
  };

  const handleOpenEditAllergy = (row: AllergyRow) => {
    setEditingAllergy(row);
    setIsAllergyModalOpen(true);
  };

  const handleDeleteAllergy = (id: string) => {
    setAllergyRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveAllergy = (row: Omit<AllergyRow, "id">, id?: string) => {
    if (id) {
      setAllergyRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, ...row, reactionKey: undefined } : r,
        ),
      );
    } else {
      setAllergyRows((prev) => [
        { ...row, id: `allergy-${Date.now()}` },
        ...prev,
      ]);
    }
    setIsAllergyModalOpen(false);
    setEditingAllergy(null);
  };

  const handleOpenAddCondition = () => {
    setEditingCondition(null);
    setIsConditionModalOpen(true);
  };

  const handleOpenEditCondition = (row: HistoryRow) => {
    setEditingCondition(row);
    setIsConditionModalOpen(true);
  };

  const handleDeleteCondition = (id: string) => {
    setHistoryRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveCondition = (row: Omit<HistoryRow, "id">, id?: string) => {
    if (id) {
      setHistoryRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, ...row, conditionKey: undefined } : r,
        ),
      );
    } else {
      setHistoryRows((prev) => [
        { ...row, id: `history-${Date.now()}` },
        ...prev,
      ]);
    }
    setIsConditionModalOpen(false);
    setEditingCondition(null);
  };

  const tabItems: ReadonlyArray<TabItem<HealthTab>> = [
    { id: "allergies", label: h?.tabs?.allergies || "Allergies" },
    { id: "history", label: h?.tabs?.history || "Medical History" },
  ];

  return (
    <div className="space-y-stack-xl">
      <Tabs
        items={tabItems}
        value={activeTab}
        onChange={setActiveTab}
        label="My Health sections"
      />

      <TabPanel id="allergies" value={activeTab}>
        <Card padding="small" className="space-y-stack-md">
          <SectionHeader
            title={h?.allergies?.title || "Allergy"}
            description={
              h?.allergies?.description ||
              "List of substances, medications, foods or environmental factors you are allergic to."
            }
            buttonLabel={h?.allergies?.addBtn || "Add Allergy"}
            onAddClick={handleOpenAddAllergy}
          />
          <AllergiesTable
            rows={allergyRows}
            onEdit={handleOpenEditAllergy}
            onDelete={handleDeleteAllergy}
          />
        </Card>
      </TabPanel>

      <TabPanel id="history" value={activeTab}>
        <Card padding="small" className="space-y-stack-md">
          <SectionHeader
            title={h?.history?.title || "Medical History"}
            description={
              h?.history?.description ||
              "Your past and current medical conditions, surgeries and major health events."
            }
            buttonLabel={h?.history?.addBtn || "Add Condition"}
            onAddClick={handleOpenAddCondition}
          />
          <MedicalHistoryTable
            rows={historyRows}
            onEdit={handleOpenEditCondition}
            onDelete={handleDeleteCondition}
          />
        </Card>
      </TabPanel>

      {isAllergyModalOpen ? (
        <AllergyModal
          key={editingAllergy ? `edit-${editingAllergy.id}` : "add"}
          initialData={editingAllergy}
          onClose={() => {
            setIsAllergyModalOpen(false);
            setEditingAllergy(null);
          }}
          onSave={handleSaveAllergy}
        />
      ) : null}

      {isConditionModalOpen ? (
        <ConditionModal
          key={editingCondition ? `edit-${editingCondition.id}` : "add"}
          initialData={editingCondition}
          onClose={() => {
            setIsConditionModalOpen(false);
            setEditingCondition(null);
          }}
          onSave={handleSaveCondition}
        />
      ) : null}
    </div>
  );
}
