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
import { useMyHealth } from "@/features/my-health/useMyHealth";
import type {
  AllergyRow,
  HealthTab,
  HistoryRow,
} from "@/features/my-health/health.types";
import {
  Alert,
  AsyncSection,
  Card,
  SkeletonText,
  Tabs,
  TabPanel,
} from "@/components/ui";
import type { TabItem } from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";
import { LoadMore } from "@/features/profile/LoadMore";
import { saveErrorText } from "@/features/profile/saveError";

export default function MyHealthPage() {
  const [activeTab, setActiveTab] = React.useState<HealthTab>("allergies");
  const { dictionary, language } = useLanguage();
  const h = dictionary?.myHealth;
  const lang = language === "ES" ? "es" : "en";

  /* From the API (Phase 4): one call per add, edit or delete; a modal
     closes only once the server kept the change. */
  const health = useMyHealth();
  const allergyRows = health.allergies;
  const historyRows = health.history;

  const [isAllergyModalOpen, setIsAllergyModalOpen] = React.useState(false);
  const [isConditionModalOpen, setIsConditionModalOpen] = React.useState(false);
  const [editingAllergy, setEditingAllergy] = React.useState<AllergyRow | null>(
    null,
  );
  const [editingCondition, setEditingCondition] =
    React.useState<HistoryRow | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const allergySave = editingAllergy ? health.editAllergy : health.addAllergy;
  const conditionSave = editingCondition
    ? health.editCondition
    : health.addCondition;

  const handleOpenAddAllergy = () => {
    health.addAllergy.reset();
    setEditingAllergy(null);
    setIsAllergyModalOpen(true);
  };

  const handleOpenEditAllergy = (row: AllergyRow) => {
    health.editAllergy.reset();
    setEditingAllergy(row);
    setIsAllergyModalOpen(true);
  };

  const closeAllergyModal = () => {
    setIsAllergyModalOpen(false);
    setEditingAllergy(null);
  };

  const handleDeleteAllergy = (id: string) => {
    setDeleteError(null);
    health.deleteAllergy.mutate(id, {
      onError: (error) => setDeleteError(saveErrorText(error, lang)),
    });
  };

  const handleSaveAllergy = (row: Omit<AllergyRow, "id">, id?: string) => {
    if (allergySave.isPending) return;
    if (id && editingAllergy) {
      health.editAllergy.mutate(
        { before: editingAllergy, next: row },
        { onSuccess: closeAllergyModal },
      );
    } else {
      health.addAllergy.mutate(row, { onSuccess: closeAllergyModal });
    }
  };

  const handleOpenAddCondition = () => {
    health.addCondition.reset();
    setEditingCondition(null);
    setIsConditionModalOpen(true);
  };

  const handleOpenEditCondition = (row: HistoryRow) => {
    health.editCondition.reset();
    setEditingCondition(row);
    setIsConditionModalOpen(true);
  };

  const closeConditionModal = () => {
    setIsConditionModalOpen(false);
    setEditingCondition(null);
  };

  const handleDeleteCondition = (id: string) => {
    setDeleteError(null);
    health.deleteCondition.mutate(id, {
      onError: (error) => setDeleteError(saveErrorText(error, lang)),
    });
  };

  const handleSaveCondition = (row: Omit<HistoryRow, "id">, id?: string) => {
    if (conditionSave.isPending) return;
    if (id && editingCondition) {
      health.editCondition.mutate(
        { before: editingCondition, next: row },
        { onSuccess: closeConditionModal },
      );
    } else {
      health.addCondition.mutate(row, { onSuccess: closeConditionModal });
    }
  };

  const tabItems: ReadonlyArray<TabItem<HealthTab>> = [
    { id: "allergies", label: h?.tabs?.allergies || "Allergies" },
    { id: "history", label: h?.tabs?.history || "Medical History" },
  ];

  const deleteAlert = deleteError ? (
    <Alert tone="danger" live onDismiss={() => setDeleteError(null)}>
      {deleteError}
    </Alert>
  ) : null;

  return (
    <div className="space-y-stack-xl">
      <PageTitle href="/dashboard/my-health" />

      <Tabs
        items={tabItems}
        value={activeTab}
        onChange={setActiveTab}
        label={
          language === "ES" ? "Secciones de Mi Salud" : "My Health sections"
        }
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
          {deleteAlert}
          <AsyncSection
            pending={health.allergiesRead.isPending}
            error={health.allergiesRead.error}
            onRetry={
              canRetry(health.allergiesRead.error)
                ? health.allergiesRead.refetch
                : undefined
            }
            errorTitle={errorTitleFor(
              health.allergiesRead.error,
              language === "ES"
                ? "No se pudieron cargar sus alergias"
                : "Your allergies could not be loaded",
              lang,
            )}
            errorMessage={errorMessageFor(
              health.allergiesRead.error,
              undefined,
              lang,
            )}
            skeleton={<SkeletonText lines={4} />}
          >
            <AllergiesTable
              rows={allergyRows}
              onEdit={handleOpenEditAllergy}
              onDelete={handleDeleteAllergy}
            />
            <LoadMore read={health.allergiesRead} />
          </AsyncSection>
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
          {deleteAlert}
          <AsyncSection
            pending={health.historyRead.isPending}
            error={health.historyRead.error}
            onRetry={
              canRetry(health.historyRead.error)
                ? health.historyRead.refetch
                : undefined
            }
            errorTitle={errorTitleFor(
              health.historyRead.error,
              language === "ES"
                ? "No se pudo cargar su historial médico"
                : "Your medical history could not be loaded",
              lang,
            )}
            errorMessage={errorMessageFor(
              health.historyRead.error,
              undefined,
              lang,
            )}
            skeleton={<SkeletonText lines={4} />}
          >
            <MedicalHistoryTable
              rows={historyRows}
              onEdit={handleOpenEditCondition}
              onDelete={handleDeleteCondition}
            />
            <LoadMore read={health.historyRead} />
          </AsyncSection>
        </Card>
      </TabPanel>

      {isAllergyModalOpen ? (
        <AllergyModal
          key={editingAllergy ? `edit-${editingAllergy.id}` : "add"}
          initialData={editingAllergy}
          onClose={closeAllergyModal}
          onSave={handleSaveAllergy}
          saving={allergySave.isPending}
          saveError={
            allergySave.error ? saveErrorText(allergySave.error, lang) : null
          }
        />
      ) : null}

      {isConditionModalOpen ? (
        <ConditionModal
          key={editingCondition ? `edit-${editingCondition.id}` : "add"}
          initialData={editingCondition}
          onClose={closeConditionModal}
          onSave={handleSaveCondition}
          saving={conditionSave.isPending}
          saveError={
            conditionSave.error
              ? saveErrorText(conditionSave.error, lang)
              : null
          }
        />
      ) : null}
    </div>
  );
}
