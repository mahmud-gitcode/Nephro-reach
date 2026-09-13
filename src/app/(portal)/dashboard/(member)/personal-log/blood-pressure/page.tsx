"use client";

import React from "react";
import Link from "next/link";
import {
  Download,
  Edit3,
  HeartPulse,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import {
  Badge,
  Button,
  buttonStyles,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";

const statusTone = {
  High: "danger",
  Elevated: "warning",
  Normal: "success",
} as const;

const readingGroupsData = [
  {
    dateEn: "May 5, 2026",
    dateEs: "5 de mayo de 2026",
    readings: [
      {
        time: "12:00 AM",
        systolic: 123,
        diastolic: 78,
        pulse: 72,
        position: "Sitting",
        symptoms: "None",
        medication: "Taken",
        status: "Normal",
      },
      {
        time: "08:15 AM",
        systolic: 132,
        diastolic: 84,
        pulse: 76,
        position: "Standing",
        symptoms: "Mild headache",
        medication: "Taken",
        status: "Elevated",
      },
      {
        time: "09:30 PM",
        systolic: 118,
        diastolic: 74,
        pulse: 70,
        position: "Sitting",
        symptoms: "None",
        medication: "Taken",
        status: "Normal",
      },
    ],
  },
  {
    dateEn: "May 4, 2026",
    dateEs: "4 de mayo de 2026",
    readings: [
      {
        time: "07:45 AM",
        systolic: 145,
        diastolic: 92,
        pulse: 81,
        position: "Sitting",
        symptoms: "Dizzy",
        medication: "Late",
        status: "High",
      },
      {
        time: "01:20 PM",
        systolic: 138,
        diastolic: 86,
        pulse: 78,
        position: "Standing",
        symptoms: "Tired",
        medication: "Taken",
        status: "Elevated",
      },
      {
        time: "10:10 PM",
        systolic: 129,
        diastolic: 80,
        pulse: 74,
        position: "Sitting",
        symptoms: "None",
        medication: "Taken",
        status: "Normal",
      },
    ],
  },
  {
    dateEn: "May 3, 2026",
    dateEs: "3 de mayo de 2026",
    readings: [
      {
        time: "06:55 AM",
        systolic: 126,
        diastolic: 79,
        pulse: 73,
        position: "Sitting",
        symptoms: "None",
        medication: "Taken",
        status: "Normal",
      },
      {
        time: "03:00 PM",
        systolic: 141,
        diastolic: 89,
        pulse: 82,
        position: "Standing",
        symptoms: "Short breath",
        medication: "Taken",
        status: "High",
      },
      {
        time: "09:05 PM",
        systolic: 122,
        diastolic: 77,
        pulse: 71,
        position: "Sitting",
        symptoms: "None",
        medication: "Taken",
        status: "Normal",
      },
    ],
  },
];

const trendPointsBase = [
  { dayEn: "Sun", dayEs: "Dom", systolic: 146, diastolic: 92 },
  { dayEn: "Mon", dayEs: "Lun", systolic: 112, diastolic: 74 },
  { dayEn: "Tue", dayEs: "Mar", systolic: 101, diastolic: 70 },
  { dayEn: "Wed", dayEs: "Mié", systolic: 108, diastolic: 78 },
  { dayEn: "Thu", dayEs: "Jue", systolic: 148, diastolic: 88 },
  { dayEn: "Fri", dayEs: "Vie", systolic: 154, diastolic: 91 },
  { dayEn: "Sat", dayEs: "Sáb", systolic: 130, diastolic: 82 },
];

function ReadingStatus({ status }: { status: string }) {
  const { t } = useLanguage();
  const label = t(`bloodPressure.statuses.${status}`) || status;
  const tone =
    statusTone[status as keyof typeof statusTone] ?? ("neutral" as const);

  return <Badge tone={tone}>{label}</Badge>;
}

function DailyBloodPressureList() {
  const { language, t } = useLanguage();

  return (
    <Card as="section" padding="small">
      <div className="flex flex-col gap-inline-md px-inset-xs pt-inset-xs sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-heading-4 text-fg">
          {t("bloodPressure.listTitle")}
        </h1>
        <div className="flex flex-wrap gap-inline-md">
          <Link
            href="/dashboard/personal-log/blood-pressure/add"
            className={buttonStyles()}
          >
            <Plus />
            {t("bloodPressure.addReading")}
          </Link>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            leadingIcon={<Download />}
          >
            {t("bloodPressure.export")}
          </Button>
        </div>
      </div>

      <Card padding="none" className="mt-stack-md overflow-hidden">
        <Table minWidth={1080}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t("bloodPressure.tableHeaders.date")}</TableHeaderCell>
              <TableHeaderCell>{t("bloodPressure.tableHeaders.time")}</TableHeaderCell>
              <TableHeaderCell numeric>{t("bloodPressure.tableHeaders.systolic")}</TableHeaderCell>
              <TableHeaderCell numeric>{t("bloodPressure.tableHeaders.diastolic")}</TableHeaderCell>
              <TableHeaderCell numeric>{t("bloodPressure.tableHeaders.pulse")}</TableHeaderCell>
              <TableHeaderCell>{t("bloodPressure.tableHeaders.position")}</TableHeaderCell>
              <TableHeaderCell>{t("bloodPressure.tableHeaders.symptoms")}</TableHeaderCell>
              <TableHeaderCell>{t("bloodPressure.tableHeaders.medication")}</TableHeaderCell>
              <TableHeaderCell>{t("bloodPressure.tableHeaders.action")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
              {readingGroupsData.map((group) => {
                const dateLabel = language === "ES" ? group.dateEs : group.dateEn;
                return group.readings.map((reading, index) => {
                  const positionLabel = t(`bloodPressure.positions.${reading.position}`) || reading.position;
                  const symptomsLabel = t(`bloodPressure.symptoms.${reading.symptoms}`) || reading.symptoms;
                  const medicationLabel = t(`bloodPressure.medications.${reading.medication}`) || reading.medication;

                  return (
                    <TableRow key={`${dateLabel}-${reading.time}`}>
                      {index === 0 && (
                        <TableCell
                          rowSpan={group.readings.length}
                          emphasis
                          className="border-r border-line align-top"
                        >
                          {dateLabel}
                        </TableCell>
                      )}
                      <TableCell>{reading.time}</TableCell>
                      <TableCell numeric>{reading.systolic}</TableCell>
                      <TableCell numeric>{reading.diastolic}</TableCell>
                      <TableCell numeric>{reading.pulse}</TableCell>
                      <TableCell>{positionLabel}</TableCell>
                      <TableCell>{symptomsLabel}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-inline-md">
                          <ReadingStatus status={reading.status} />
                          <span className="text-body-sm text-fg-secondary">
                            {medicationLabel}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-inline-md">
                          <Button
                            iconOnly
                            size="small"
                            variant="neutral"
                            appearance="fill-stroke"
                            aria-label={`Edit reading from ${dateLabel} at ${reading.time}`}
                          >
                            <Edit3 />
                          </Button>
                          <Button
                            iconOnly
                            size="small"
                            variant="danger"
                            appearance="fill-stroke"
                            aria-label={`Delete reading from ${dateLabel} at ${reading.time}`}
                          >
                            <Trash2 />
                          </Button>
                          <Button
                            iconOnly
                            size="small"
                            variant="neutral"
                            appearance="stroke"
                            aria-label={`More actions for ${dateLabel} at ${reading.time}`}
                          >
                            <MoreHorizontal />
                          </Button>
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                });
              })}
          </TableBody>
        </Table>
      </Card>
    </Card>
  );
}

function TrendChart() {
  const { language, t } = useLanguage();

  const chartWidth = 640;
  const chartHeight = 184;
  const xFor = (index: number) => 26 + index * 96;
  const yFor = (value: number) => 12 + ((160 - value) / 80) * 156;
  const systolicLine = trendPointsBase.map((point, index) => `${xFor(index)},${yFor(point.systolic)}`).join(" ");
  const diastolicLine = trendPointsBase.map((point, index) => `${xFor(index)},${yFor(point.diastolic)}`).join(" ");

  return (
    <Card as="section">
      <div className="flex flex-col gap-stack-sm sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-heading-4 text-fg">
          {t("bloodPressure.trendsTitle")}
        </h2>
        <div className="flex flex-wrap items-center gap-inline-lg text-caption text-fg-secondary">
          <span className="inline-flex items-center gap-inline-xs">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-pill bg-accent-solid" />
            {t("bloodPressure.systolicLegend")}
          </span>
          <span className="inline-flex items-center gap-inline-xs">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-pill bg-danger-solid" />
            {t("bloodPressure.diastolicLegend")}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <div className="grid h-[206px] grid-cols-[38px_minmax(0,1fr)] gap-3">
          <div className="flex flex-col justify-between text-right text-caption text-fg-muted">
            {[160, 140, 120, 100, 80].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="relative overflow-hidden rounded-card">
            <div className="absolute inset-0 flex flex-col justify-between py-inset-sm">
              {Array.from({ length: 5 }).map((_, index) => (
                <span key={index} className="border-t border-dashed border-line" />
              ))}
            </div>
            <div className="absolute inset-x-5 inset-y-0 flex justify-between">
              {Array.from({ length: 7 }).map((_, index) => (
                <span key={index} className="border-l border-dashed border-line" />
              ))}
            </div>
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polyline
                points={systolicLine}
                fill="none"
                stroke="var(--color-accent-600)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                points={diastolicLine}
                fill="none"
                stroke="var(--color-danger-600)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              {trendPointsBase.map((point, index) => (
                <React.Fragment key={index}>
                  <circle cx={xFor(index)} cy={yFor(point.systolic)} r="4" fill="var(--color-surface)" stroke="var(--color-accent-600)" strokeWidth="2" />
                  <circle cx={xFor(index)} cy={yFor(point.diastolic)} r="4" fill="var(--color-surface)" stroke="var(--color-danger-600)" strokeWidth="2" />
                </React.Fragment>
              ))}
            </svg>
          </div>
        </div>
        <div className="mt-stack-sm grid grid-cols-[38px_minmax(0,1fr)] gap-inline-md">
          <span />
          <div className="flex justify-between px-inset-sm text-caption text-fg-secondary">
            {trendPointsBase.map((point, idx) => (
              <span key={idx} className="w-9 text-center">
                {language === "ES" ? point.dayEs : point.dayEn}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ReadingGuide() {
  const { t } = useLanguage();

  const guideRows = [
    { label: t("bloodPressure.guide.high"), status: t("bloodPressure.statuses.High"), tone: "danger" as const },
    { label: t("bloodPressure.guide.elevated"), status: t("bloodPressure.statuses.Elevated"), tone: "warning" as const },
    { label: t("bloodPressure.guide.normal"), status: t("bloodPressure.statuses.Normal"), tone: "success" as const },
  ];

  return (
    <Card as="section">
      <div className="flex items-center gap-inline-md">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-control bg-danger-soft text-danger"
        >
          <HeartPulse className="h-icon-small w-icon-small" />
        </span>
        <h2 className="text-heading-4 text-fg">
          {t("bloodPressure.bpGuideTitle")}
        </h2>
      </div>

      <div className="mt-stack-xl space-y-stack-lg">
        {guideRows.map((row) => (
          <Card key={row.label} tone="sunken" padding="small">
            <p className="text-body-sm text-fg-secondary">{row.label}</p>
            <span className="mt-stack-sm block">
              <Badge tone={row.tone}>{row.status}</Badge>
            </span>
          </Card>
        ))}
      </div>
    </Card>
  );
}

export default function BloodPressureLogPage() {
  return (
    <div className="space-y-stack-lg">
      <PersonalLogDisclaimer />

      <DailyBloodPressureList />

      <section className="grid grid-cols-1 gap-inline-lg xl:grid-cols-[minmax(0,1fr)_257px]">
        <TrendChart />
        <ReadingGuide />
      </section>
    </div>
  );
}
