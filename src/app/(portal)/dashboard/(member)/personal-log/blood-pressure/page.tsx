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
  LineChart,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";

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
            {...notBuiltYet("Exporting readings")}
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
              <TableHeaderCell>
                {t("bloodPressure.tableHeaders.date")}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("bloodPressure.tableHeaders.time")}
              </TableHeaderCell>
              <TableHeaderCell numeric>
                {t("bloodPressure.tableHeaders.systolic")}
              </TableHeaderCell>
              <TableHeaderCell numeric>
                {t("bloodPressure.tableHeaders.diastolic")}
              </TableHeaderCell>
              <TableHeaderCell numeric>
                {t("bloodPressure.tableHeaders.pulse")}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("bloodPressure.tableHeaders.position")}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("bloodPressure.tableHeaders.symptoms")}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("bloodPressure.tableHeaders.medication")}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("bloodPressure.tableHeaders.action")}
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {readingGroupsData.map((group) => {
              const dateLabel = language === "ES" ? group.dateEs : group.dateEn;
              return group.readings.map((reading, index) => {
                const positionLabel =
                  t(`bloodPressure.positions.${reading.position}`) ||
                  reading.position;
                const symptomsLabel =
                  t(`bloodPressure.symptoms.${reading.symptoms}`) ||
                  reading.symptoms;
                const medicationLabel =
                  t(`bloodPressure.medications.${reading.medication}`) ||
                  reading.medication;

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
                          {...notBuiltYet("Editing a reading")}
                          iconOnly
                          size="small"
                          variant="neutral"
                          appearance="fill-stroke"
                          aria-label={`Edit reading from ${dateLabel} at ${reading.time}`}
                        >
                          <Edit3 />
                        </Button>
                        <Button
                          {...notBuiltYet("Deleting a reading")}
                          iconOnly
                          size="small"
                          variant="danger"
                          appearance="fill-stroke"
                          aria-label={`Delete reading from ${dateLabel} at ${reading.time}`}
                        >
                          <Trash2 />
                        </Button>
                        <Button
                          {...notBuiltYet("More actions")}
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

  return (
    <Card as="section">
      <h2 className="text-heading-4 text-fg">
        {t("bloodPressure.trendsTitle")}
      </h2>

      <div className="mt-stack-xl">
        <LineChart
          label={t("bloodPressure.trendsTitle")}
          unit="mmHg"
          yMin={80}
          yMax={160}
          height={206}
          xLabels={trendPointsBase.map((point) =>
            language === "ES" ? point.dayEs : point.dayEn,
          )}
          series={[
            {
              id: "systolic",
              label: t("bloodPressure.systolicLegend"),
              tone: "accent",
              points: trendPointsBase.map((p) => p.systolic),
            },
            {
              id: "diastolic",
              label: t("bloodPressure.diastolicLegend"),
              tone: "danger",
              points: trendPointsBase.map((p) => p.diastolic),
            },
          ]}
        />
      </div>
    </Card>
  );
}

function ReadingGuide() {
  const { t } = useLanguage();

  const guideRows = [
    {
      label: t("bloodPressure.guide.high"),
      status: t("bloodPressure.statuses.High"),
      tone: "danger" as const,
    },
    {
      label: t("bloodPressure.guide.elevated"),
      status: t("bloodPressure.statuses.Elevated"),
      tone: "warning" as const,
    },
    {
      label: t("bloodPressure.guide.normal"),
      status: t("bloodPressure.statuses.Normal"),
      tone: "success" as const,
    },
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
