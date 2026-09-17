"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Filter } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  JOURNEY_DAYS,
  JourneyPhaseKey,
} from "@/features/education/dialysisJourneyData";
import { useJourneyProgress } from "@/features/education/useJourneyProgress";
import { DayCard } from "../page";
import {
  Button,
  Card,
  EmptyState,
  Select,
  Tabs,
  TabPanel,
} from "@/components/ui";
import type { TabItem } from "@/components/ui";

type StatusFilter = "all" | "in-progress" | "completed" | "not-started";
type ModuleTab = "all" | JourneyPhaseKey;

function MyClassroomDetailsContent() {
  const { language, dictionary } = useLanguage();
  const isEs = language === "ES";
  const j = dictionary?.educationJourney;

  const searchParams = useSearchParams();
  const initialModule =
    (searchParams.get("module") as JourneyPhaseKey) || "all";

  const { getProgress, progress } = useJourneyProgress();

  const [moduleTab, setModuleTab] = useState<ModuleTab>(
    ["foundation", "routine", "nutrition", "living"].includes(initialModule)
      ? (initialModule as ModuleTab)
      : "all",
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const tabs: Array<{ key: ModuleTab; label: string }> = [
    {
      key: "all",
      label: j?.allClassesTab || (isEs ? "Todas las clases" : "All Classes"),
    },
    {
      key: "foundation",
      label: isEs ? "Módulo 1" : "Module 1",
    },
    {
      key: "routine",
      label: isEs ? "Módulo 2" : "Module 2",
    },
    {
      key: "nutrition",
      label: isEs ? "Módulo 3" : "Module 3",
    },
    {
      key: "living",
      label: isEs ? "Módulo 4" : "Module 4",
    },
  ];

  const visibleDays = useMemo(
    () =>
      JOURNEY_DAYS.filter((day) => {
        if (moduleTab !== "all" && day.phase !== moduleTab) return false;
        const status = progress[day.slug]?.status ?? "not-started";
        return statusFilter === "all" || status === statusFilter;
      }),
    [moduleTab, statusFilter, progress],
  );

  const tabItems: ReadonlyArray<TabItem<ModuleTab>> = tabs.map((tab) => ({
    id: tab.key,
    label: tab.label,
  }));

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-stack-xl">
      {/* Top Header & Back Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/my-classroom"
            className="inline-flex items-center gap-inline-md rounded-control-small text-label-md text-fg-muted transition-colors duration-150 ease-standard hover:text-fg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span>
              {j?.backToClassroom ||
                (isEs ? "Volver a Mi Salón de Clases" : "Back to My Classroom")}
            </span>
          </Link>
          <h1 className="mt-stack-sm text-heading-2 text-fg">
            {j?.allClassesTab ||
              (isEs ? "Todas las Clases y Módulos" : "All Classes & Modules")}
          </h1>
        </div>
      </div>

      {/* Tabs and Filter Bar */}
      <Card
        as="section"
        padding="small"
        className="flex flex-col gap-inline-md lg:flex-row lg:items-center lg:justify-between"
      >
        {/* The module buttons carried role="tab" but no panel and no arrow
            keys. <Tabs> supplies both; the grid below is the panel. */}
        <div className="overflow-x-auto">
          <Tabs
            items={tabItems}
            value={moduleTab}
            onChange={setModuleTab}
            variant="pill"
            label={j?.modulesLabel || "Modules"}
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex shrink-0 items-center gap-inline-md">
          <Filter
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-fg-muted"
          />
          <label htmlFor="journey-status-filter" className="sr-only">
            {j?.filterLabel || "Filter classes"}
          </label>
          <Select
            id="journey-status-filter"
            selectSize="small"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
          >
            <option value="all">
              {j?.filterAll || (isEs ? "Todos los días" : "All days")}
            </option>
            <option value="completed">
              {j?.completed || (isEs ? "Completado" : "Completed")}
            </option>
            <option value="in-progress">
              {j?.inProgress || (isEs ? "En progreso" : "In progress")}
            </option>
            <option value="not-started">
              {j?.notStarted || (isEs ? "Sin comenzar" : "Not started")}
            </option>
          </Select>
        </div>
      </Card>

      {/* Class Cards Grid (max 4 cards per row) */}
      <TabPanel
        id={moduleTab}
        value={moduleTab}
        className="grid grid-cols-1 gap-inset-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {visibleDays.map((day) => (
          <DayCard key={day.slug} day={day} state={getProgress(day.slug)} />
        ))}
      </TabPanel>

      {visibleDays.length === 0 && (
        <EmptyState
          icon={<Filter />}
          title={
            j?.noResults ||
            (isEs
              ? "Ninguna clase coincide con este filtro."
              : "No classes match this filter.")
          }
          action={
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => {
                setModuleTab("all");
                setStatusFilter("all");
              }}
            >
              {isEs ? "Restablecer filtros" : "Reset filters"}
            </Button>
          }
        />
      )}
    </div>
  );
}

export default function MyClassroomDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-inset-xl text-center text-body-md text-fg-muted">
          Loading classes...
        </div>
      }
    >
      <MyClassroomDetailsContent />
    </Suspense>
  );
}
