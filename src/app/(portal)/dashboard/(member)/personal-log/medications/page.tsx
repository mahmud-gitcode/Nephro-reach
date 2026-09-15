"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { reminderFor, useReminders } from "@/features/medications/useReminders";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import { AsyncSection, Skeleton } from "@/components/ui";
import {
  AdherenceChart,
  AlertsAndMood,
  DoseSchedule,
  ExportReporting,
  MedicationMasterList,
} from "@/features/medications/MedicationPanels";
import { SimpleTimeReminderModal } from "@/features/medications/SimpleTimeReminderModal";
import { medicationsData } from "@/features/medications/medications.seed";

export default function MedicationLogPage() {
  const { t } = useLanguage();

  const { reminders, isPending, error, refetch, setTime, remove } =
    useReminders();

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedMedForReminder, setSelectedMedForReminder] = useState<
    string | undefined
  >(undefined);

  const handleOpenReminderModal = (medName?: string) => {
    setSelectedMedForReminder(
      medName || medicationsData[0]?.name || "Potassium",
    );
    setIsReminderModalOpen(true);
  };

  const activeExistingReminder = selectedMedForReminder
    ? reminderFor(reminders, selectedMedForReminder)
    : null;

  return (
    <div className="space-y-6">
      <PersonalLogDisclaimer />

      <header>
        <h1 className="text-heading-1 text-fg">{t("medicationsLog.title")}</h1>
        <p className="mt-stack-xs text-body-lg text-fg-secondary">
          {t("medicationsLog.subtitle")}
        </p>
      </header>

      {/* One read feeds four sections, so the four states are decided once
          here rather than four times below. A reminder list that renders
          empty because the read failed reads as "no medications to take". */}
      <AsyncSection
        pending={isPending}
        error={error}
        onRetry={refetch}
        errorTitle={t("medicationsLog.title")}
        errorMessage="Your reminders could not be read from this device. Nothing has been changed."
        skeleton={
          <div className="space-y-6">
            <Skeleton height={220} />
            <Skeleton height={260} />
          </div>
        }
      >
        <div className="space-y-6">
          <MedicationMasterList
            reminders={reminders}
            onOpenReminderModal={handleOpenReminderModal}
          />
          <DoseSchedule reminders={reminders} />
          <AdherenceChart />
          <AlertsAndMood
            reminders={reminders}
            onOpenReminderModal={handleOpenReminderModal}
          />
        </div>
      </AsyncSection>
      <ExportReporting />
      {/* Keyed on the medication, so opening it for another one starts from
          that medication's stored time without an effect syncing it. */}
      <SimpleTimeReminderModal
        key={
          isReminderModalOpen
            ? `reminder-${selectedMedForReminder ?? ""}`
            : "reminder-closed"
        }
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        medicationName={selectedMedForReminder || ""}
        currentTime={activeExistingReminder?.time}
        onSaveTime={setTime}
        onDeleteReminder={remove}
      />
    </div>
  );
}
