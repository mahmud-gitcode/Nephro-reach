"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { reminderFor, useReminders } from "@/features/medications/useReminders";
import {
  useAdherence,
  useMedicationLog,
} from "@/features/medications/useMedicationLog";
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
import {
  doseRows,
  type Medication,
} from "@/features/medications/medicationList";
import { MedicationEditModal } from "@/features/medications/MedicationEditModal";
import { todayIso } from "@/features/medications/medicationLog.rules";
import { reminderTimes } from "@/features/medications/reminders.rules";
import {
  useMedicationHistory,
  useMedications,
} from "@/features/medications/useMedications";
import { saveErrorText } from "@/features/profile/saveError";
import {
  canRetry,
  combineReads,
  errorMessageFor,
  errorTitleFor,
} from "@/lib/data/asyncState";

export default function MedicationLogPage() {
  const { t, language } = useLanguage();
  const isEs = language === "ES";
  const lang = isEs ? "es" : "en";

  /* The member's list, from the API, and their reminders by medication id. */
  const meds = useMedications();
  const reminderState = useReminders(undefined, meds.nameOf);
  const { reminders, setTimes, remove } = reminderState;

  /* The schedule's day: its doses and side effects are read for that day. */
  const [date, setDate] = useState(() => todayIso());
  const log = useMedicationLog(date);
  /* The adherence figures are the server's, over the last seven days. */
  const adherence = useAdherence(7);
  const rows = doseRows(meds.medications, reminders);

  const [editing, setEditing] = useState<Medication | null>(null);
  const history = useMedicationHistory(editing?.id ?? null, isEs);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedMedForReminder, setSelectedMedForReminder] = useState<
    string | undefined
  >(undefined);

  const handleOpenReminderModal = (medicationId?: string) => {
    setSelectedMedForReminder(medicationId || meds.medications[0]?.id || "");
    setIsReminderModalOpen(true);
  };

  const activeExistingReminder = selectedMedForReminder
    ? reminderFor(reminders, selectedMedForReminder)
    : null;
  const selectedName = selectedMedForReminder
    ? meds.nameOf(selectedMedForReminder)
    : "";

  /* One state for the four sections that read the list, reminders, the
     day's log and the adherence: a reminder list that renders empty because
     its read failed reads as "no medications to take". */
  const reads = combineReads(meds, reminderState, log, adherence);
  const saveError = log.saveError ?? meds.saveError;

  return (
    <div className="space-y-6">
      <PersonalLogDisclaimer />

      <header>
        <h1 className="text-heading-1 text-fg">{t("medicationsLog.title")}</h1>
      </header>

      {/* A dose the member marked and that did not save is worth saying
          out loud: they believe they have recorded taking it. */}
      {saveError ? (
        <Alert tone="danger">{saveErrorText(saveError, lang)}</Alert>
      ) : null}

      <AsyncSection
        pending={reads.pending}
        error={reads.error}
        onRetry={canRetry(reads.error) ? reads.onRetry : undefined}
        errorTitle={errorTitleFor(
          reads.error,
          isEs
            ? "No se pudieron cargar sus medicamentos"
            : "Your medications could not be loaded",
          lang,
        )}
        errorMessage={errorMessageFor(
          reads.error,
          isEs
            ? "No se cambió nada. Inténtelo de nuevo."
            : "Nothing has been changed. Please try again.",
          lang,
        )}
        skeleton={
          <div className="space-y-6">
            <Skeleton height={220} />
            <Skeleton height={260} />
          </div>
        }
      >
        <div className="space-y-6">
          <MedicationMasterList
            medications={meds.medications}
            reminders={reminders}
            onOpenReminderModal={handleOpenReminderModal}
            onStatusChange={meds.setStatus}
            onRefillChange={meds.setNeedsRefill}
            photoLink={meds.photoLink}
            onEdit={setEditing}
          />
          <DoseSchedule
            rows={rows}
            reminders={reminders}
            log={log}
            date={date}
            onDateChange={setDate}
          />
          {adherence.report ? (
            <AdherenceChart report={adherence.report} />
          ) : null}
          <AlertsAndMood
            reminders={reminders}
            onOpenReminderModal={handleOpenReminderModal}
          />
        </div>
      </AsyncSection>
      <ExportReporting log={log} />
      {editing ? (
        <MedicationEditModal
          key={editing.id}
          medication={editing}
          isEs={isEs}
          saving={meds.isSaving}
          saveError={
            meds.saveError ? saveErrorText(meds.saveError, lang) : null
          }
          history={history.items}
          onClose={() => setEditing(null)}
          onSave={(change) =>
            void meds
              .update(editing.id, change)
              .then(() => setEditing(null))
              .catch(() => undefined)
          }
        />
      ) : null}
      {/* Keyed on the medication, so opening it for another one starts from
          that medication's stored times without an effect syncing it. */}
      <SimpleTimeReminderModal
        key={
          isReminderModalOpen
            ? `reminder-${selectedMedForReminder ?? ""}`
            : "reminder-closed"
        }
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        medicationName={selectedName}
        currentTimes={
          activeExistingReminder ? reminderTimes(activeExistingReminder) : []
        }
        onSaveTimes={(_name, times) =>
          setTimes(selectedMedForReminder ?? "", times)
        }
        onDeleteReminder={() => remove(selectedMedForReminder ?? "")}
      />
    </div>
  );
}
