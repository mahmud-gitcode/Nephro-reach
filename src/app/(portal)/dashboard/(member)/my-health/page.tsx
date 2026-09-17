"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  AllergiesTable,
  MedicalHistoryTable,
  SectionHeader,
} from "@/features/my-health/HealthTables";
import {
  AllergyModal,
  ConditionModal,
} from "@/features/my-health/HealthModals";
import {
  rawAllergyRows,
  rawHistoryRows,
} from "@/features/my-health/health.seed";
import type {
  AllergyRow,
  HealthTab,
  HistoryRow,
} from "@/features/my-health/health.types";
import { Card, Tabs, TabPanel } from "@/components/ui";
import type { TabItem } from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";

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
      <PageTitle href="/dashboard/my-health" />

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
