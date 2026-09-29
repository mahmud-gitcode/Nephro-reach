"use client";

import React from "react";
import { Plus } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Badge,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
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
    /* The shared Card and Table, flush in the card as on the showcase. */
    <Card as="section" padding="none" className="overflow-hidden">
      <div className="flex flex-col gap-inline-md p-card pb-stack-md sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-heading-4 text-fg">
          {w?.recentEntries?.title || "Recent Entries"}
        </h2>
        <Button size="small" onClick={onOpenAddModal}>
          <Plus />
          {w?.recentEntries?.addNewEntry || "New Entry"}
        </Button>
      </div>
      {/* Ten columns, so it scrolls sideways inside itself; long lists
          scroll down inside a fixed height. */}
      <div className="max-h-[430px] overflow-y-auto">
        <Table minWidth={1080}>
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableHeaderCell key={header}>{header}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry, index) => {
              const dateLabel = language === "ES" ? entry.dateEs : entry.dateEn;
              const isGoalMet = entry.goal === "Goal Met";
              const goalLabel = translateGoal(entry.goal);
              const uoLabel = w?.recentEntries?.values?.high || entry.uo;
              const swellingLabel = translateSwelling(entry.swelling);
              const sobLabel = translateYesNo(entry.sob);
              const weaknessLabel = translateYesNo(entry.weakness);
              const notesLabel = translateNote(entry.noteKey, entry.notes);

              return (
                <TableRow key={entry.id || `${entry.dateEn}-${index}`}>
                  <TableCell emphasis className="whitespace-nowrap">
                    {dateLabel}
                  </TableCell>
                  <TableCell>{entry.morning}</TableCell>
                  <TableCell>{entry.evening}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-inline-sm">
                      <TrendIcon type="up" />
                      {uoLabel}
                    </span>
                  </TableCell>
                  <TableCell>{entry.intake}</TableCell>
                  <TableCell>
                    <span className="flex flex-col items-start gap-stack-xs">
                      <GoalBadge status={goalLabel} isGoalMet={isGoalMet} />
                      {entry.fluidStatus && (
                        /* A Badge: it was hand-drawn at 10px, under the
                             12px floor. */
                        <Badge
                          tone={
                            entry.fluidStatus === "Above EDW"
                              ? "warning"
                              : entry.fluidStatus === "Below EDW"
                                ? "info"
                                : "success"
                          }
                        >
                          {language === "ES"
                            ? entry.fluidStatus === "Above EDW"
                              ? "Sobre EDW"
                              : entry.fluidStatus === "Below EDW"
                                ? "Bajo EDW"
                                : "En EDW"
                            : entry.fluidStatus}
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>{swellingLabel}</TableCell>
                  <TableCell>{sobLabel}</TableCell>
                  <TableCell>{weaknessLabel}</TableCell>
                  <TableCell>{notesLabel}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
