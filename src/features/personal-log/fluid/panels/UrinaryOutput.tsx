"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { TrendIcon } from "../FluidIcons";

/* NOTE: the figures in this panel are fixed demo values. It renders the same
   numbers whatever the member has logged — see the header of
   fluid-tracker/page.tsx. */

export function UrinaryOutput() {
  const { language, dictionary } = useLanguage();
  const w = dictionary?.weightFluidTracker;

  const urineTrends = [
    {
      date: language === "ES" ? "10 May, 2024" : "May 10, 2024",
      trendKey: "increasing",
      defaultTrend: "Increasing",
      icon: "up" as const,
    },
    {
      date: language === "ES" ? "31 May, 2024" : "May 31, 2024",
      trendKey: "decreasing",
      defaultTrend: "Decreasing",
      icon: "down" as const,
    },
    {
      date: language === "ES" ? "7 Jun, 2024" : "Jun 7, 2024",
      trendKey: "increasing",
      defaultTrend: "Increasing",
      icon: "up" as const,
    },
    {
      date: language === "ES" ? "5 Jul, 2024" : "Jul 5, 2024",
      trendKey: "noChange",
      defaultTrend: "No Change",
      icon: "level" as const,
    },
  ];

  const getTrendText = (trendKey: string, defaultTrend: string) => {
    if (trendKey === "increasing")
      return w?.urinaryOutput?.trends?.increasing || defaultTrend;
    if (trendKey === "decreasing")
      return w?.urinaryOutput?.trends?.decreasing || defaultTrend;
    if (trendKey === "noChange")
      return w?.urinaryOutput?.trends?.noChange || defaultTrend;
    return defaultTrend;
  };

  return (
    /* The shared Card and Table, flush: the table runs to the card's edges
       and its columns line up under the title (--table-edge). */
    <Card as="section" padding="none" className="h-full overflow-hidden">
      <h2 className="p-card pb-stack-md text-heading-4 text-fg">
        {w?.urinaryOutput?.title || "Urinary Output"}{" "}
        <span className="text-body-sm text-fg-muted">
          {w?.urinaryOutput?.subtitle || "(24 Hours)"}
        </span>
      </h2>
      <Table minWidth={0}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>
              {w?.urinaryOutput?.date || "Date"}
            </TableHeaderCell>
            <TableHeaderCell>
              {w?.urinaryOutput?.trend || "Trend"}
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {urineTrends.map((row) => (
            <TableRow key={row.date}>
              <TableCell>{row.date}</TableCell>
              <TableCell emphasis>
                <span className="flex items-center gap-inline-md">
                  <TrendIcon type={row.icon} />
                  {getTrendText(row.trendKey, row.defaultTrend)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
