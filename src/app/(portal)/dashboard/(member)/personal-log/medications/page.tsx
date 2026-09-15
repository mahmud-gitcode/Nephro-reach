"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { reminderFor, useReminders } from "@/features/medications/useReminders";
import { useMedicationLog } from "@/features/medications/useMedicationLog";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import { Alert, AsyncSection, Skeleton } from "@/components/ui";
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

  /* One log for the whole page. The dose statuses tapped in section 2 are
     what section 3 counts, so they have to come from one cache or the
     adherence figure lags the taps that produced it. */
  const log = useMedicationLog();

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
      {/* A dose the member marked and that did not save is worth saying
          out loud — they believe they have recorded taking it. */}
      {log.saveError ? (
        <Alert tone="danger">
          {t("medicationsLog.saveFailed") ||
            "That change did not save. Your log is unchanged — please try again."}
        </Alert>
      ) : null}

      <AsyncSection
        pending={isPending || log.isPending}
        error={error ?? log.error}
        onRetry={() => {
          refetch();
          log.refetch();
        }}
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
            log={log}
          />
          <DoseSchedule reminders={reminders} log={log} />
          <AdherenceChart log={log} />
          <AlertsAndMood
            reminders={reminders}
            onOpenReminderModal={handleOpenReminderModal}
            log={log}
          />
        </div>
      </AsyncSection>
      <ExportReporting log={log} />
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
