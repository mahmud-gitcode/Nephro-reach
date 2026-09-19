"use client";

import React from "react";
import { Plus } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { GoalBadge, TrendIcon } from "./FluidIcons";
import type { WeightFluidEntry } from "./fluid.types";

export function RecentEntries({
  entries,
  onOpenAddModal,
}: {
  entries: WeightFluidEntry[];
  onOpenAddModal: () => void;
}) {
  const { language, dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const translateGoal = (goal: string) => {
    if (goal === "Goal Met")
      return w?.recentEntries?.values?.goalMet || "Goal Met";
    if (goal === "Above Goal")
      return w?.recentEntries?.values?.aboveGoal || "Above Goal";
    return goal;
  };

  const translateSwelling = (swelling: string) => {
    if (swelling === "None" || swelling === "NO")
      return (
        w?.recentEntries?.values?.none ||
        (language === "ES" ? "Ninguna" : "None")
      );
    if (swelling === "YES") return language === "ES" ? "Sí" : "Yes";
    if (swelling === "Mild") return w?.recentEntries?.values?.mild || "Mild";
    if (swelling === "Moderate")
      return language === "ES" ? "Moderada" : "Moderate";
    if (swelling === "Severe") return language === "ES" ? "Grave" : "Severe";
    return swelling;
  };

  const translateYesNo = (val: string) => {
    if (val === "NO") return w?.recentEntries?.values?.no || "NO";
    if (val === "YES") return w?.recentEntries?.values?.yes || "YES";
    return val;
  };

  const translateNote = (noteKey: string | null, fallback: string) => {
    if (!noteKey) return fallback;
    const notesMap = w?.recentEntries?.notes;
    if (notesMap && typeof notesMap === "object" && noteKey in notesMap) {
      return (notesMap as Record<string, string>)[noteKey] || fallback;
    }
    return fallback;
  };

  const headers = [
    w?.recentEntries?.headers?.date || "Date",
    w?.recentEntries?.headers?.morning || "Morning",
    w?.recentEntries?.headers?.evening || "Evening",
    w?.recentEntries?.headers?.uo || "24h UO",
    w?.recentEntries?.headers?.fluidIntake || "Fluid Intake",
    w?.recentEntries?.headers?.goalStatus || "Goal Status",
    w?.recentEntries?.headers?.swelling || "Swelling",
    w?.recentEntries?.headers?.sob || "SOB",
    w?.recentEntries?.headers?.weakness || "Weakness",
    w?.recentEntries?.headers?.notes || "Notes",
  ];

  return (
    <section className="rounded-[14px] border border-line bg-surface p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-heading-4 text-fg">
          {w?.recentEntries?.title || "Recent Entries"}
        </h2>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded bg-primary-solid px-3 text-sm font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_var(--color-brand-100)] transition-colors hover:bg-primary-solid-hover active:scale-[0.98] sm:h-12 sm:gap-2 sm:px-4 sm:text-base"
        >
          <Plus className="h-5 w-5" />
          {w?.recentEntries?.addNewEntry || "New Entry"}
        </button>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-[var(--color-gray-300)]">
        <div className="max-h-[430px] overflow-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="sticky top-0 bg-[var(--color-gray-50)]">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="border-b border-[var(--color-gray-300)] px-3 py-4 font-medium text-fg"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const dateLabel =
                  language === "ES" ? entry.dateEs : entry.dateEn;
                const isGoalMet = entry.goal === "Goal Met";
                const goalLabel = translateGoal(entry.goal);
                const uoLabel = w?.recentEntries?.values?.high || entry.uo;
                const swellingLabel = translateSwelling(entry.swelling);
                const sobLabel = translateYesNo(entry.sob);
                const weaknessLabel = translateYesNo(entry.weakness);
                const notesLabel = translateNote(entry.noteKey, entry.notes);

                return (
                  <tr
                    key={entry.id || `${entry.dateEn}-${index}`}
                    className="border-b border-dashed border-[var(--color-gray-300)] transition-colors last:border-b-0 hover:bg-surface-sunken/60"
                  >
                    <td className="px-3 py-3 font-semibold text-[var(--color-gray-950)]">
                      {dateLabel}
                    </td>
                    <td className="px-3 py-3 text-[var(--color-gray-950)]">
                      {entry.morning}
                    </td>
                    <td className="px-3 py-3 text-[var(--color-gray-950)]">
                      {entry.evening}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <TrendIcon type="up" />
                        <span>{uoLabel}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[var(--color-gray-950)]">
                      {entry.intake}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <GoalBadge status={goalLabel} isGoalMet={isGoalMet} />
                        {entry.fluidStatus && (
                          <span
                            className={`inline-flex w-fit items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              entry.fluidStatus === "Above EDW"
                                ? "bg-warning-surface text-warning"
                                : entry.fluidStatus === "Below EDW"
                                  ? "bg-brand-50 text-brand-700"
                                  : "bg-success-surface text-success"
                            }`}
                          >
                            <span className="h-1 w-1 rounded-full bg-current" />
                            {language === "ES"
                              ? entry.fluidStatus === "Above EDW"
                                ? "Sobre EDW"
                                : entry.fluidStatus === "Below EDW"
                                  ? "Bajo EDW"
                                  : "En EDW"
                              : entry.fluidStatus}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[var(--color-gray-950)]">
                      {swellingLabel}
                    </td>
                    <td className="px-3 py-3 text-[var(--color-gray-950)]">
                      {sobLabel}
                    </td>
                    <td className="px-3 py-3 text-[var(--color-gray-950)]">
                      {weaknessLabel}
                    </td>
                    <td className="px-3 py-3 text-[var(--color-gray-950)]">
                      {notesLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
