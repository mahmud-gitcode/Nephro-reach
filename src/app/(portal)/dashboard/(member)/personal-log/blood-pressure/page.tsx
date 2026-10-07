"use client";

import { useExternalShare } from "@/features/sharing/ExternalShareNotice";
import React, { useState } from "react";
import Link from "next/link";
import { Download, Edit3, HeartPulse, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ShareLogCard } from "@/features/personal-log/ShareLogCard";
import { BpReminderCard } from "@/features/personal-log/blood-pressure/BpReminderCard";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import {
  Badge,
  Button,
  buttonStyles,
  Card,
  EmptyState,
  ErrorState,
  LineChart,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import {
  byDay,
  readingsCsv,
  statusOf,
  trend,
  type BpReading,
} from "@/features/personal-log/blood-pressure/bloodPressure";
import { useBloodPressure } from "@/features/personal-log/blood-pressure/useBloodPressure";
import { downloadText } from "@/lib/utils/download";

const statusTone = {
  High: "danger",
  Elevated: "warning",
  Normal: "success",
} as const;

function ReadingStatus({ status }: { status: string }) {
  const { t } = useLanguage();
  const label = t(`bloodPressure.statuses.${status}`) || status;
  const tone =
    statusTone[status as keyof typeof statusTone] ?? ("neutral" as const);

  return <Badge tone={tone}>{label}</Badge>;
}

function formatDay(iso: string, isEs: boolean) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(isEs ? "es-US" : "en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatClock(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${String(h % 12 === 0 ? 12 : h % 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function DailyBloodPressureList() {
  const { language, t } = useLanguage();
  const isEs = language === "ES";
  /* Leaves NephroReach: ask first (client, 2026-10-07). */
  const share = useExternalShare(isEs);
  const bp = useBloodPressure();
  const [deleting, setDeleting] = useState<BpReading | null>(null);
  const groups = byDay(bp.readings);

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
            disabled={bp.readings.length === 0}
            onClick={() =>
              share.guard(() =>
                downloadText(
                  "blood-pressure-readings.csv",
                  readingsCsv(bp.readings),
                ),
              )
            }
          >
            {t("bloodPressure.export")}
          </Button>
          {share.notice}
        </div>
      </div>

      {bp.error ? (
        <ErrorState
          title={
            isEs
              ? "No se pudieron cargar tus lecturas"
              : "Your readings could not be loaded"
          }
          error={bp.error}
          onRetry={bp.refetch}
        />
      ) : !bp.isPending && bp.readings.length === 0 ? (
        <EmptyState
          icon={<HeartPulse />}
          title={isEs ? "Aún no hay lecturas" : "No readings yet"}
          description={
            isEs
              ? "Agrega tu primera lectura de presión arterial."
              : "Add your first blood pressure reading."
          }
        />
      ) : (
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
              {groups.map((group) => {
                const dateLabel = formatDay(group.date, isEs);
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
                  const time = formatClock(reading.time);

                  return (
                    <TableRow key={reading.id}>
                      {index === 0 && (
                        <TableCell
                          rowSpan={group.readings.length}
                          emphasis
                          className="border-r border-line align-top"
                        >
                          {dateLabel}
                        </TableCell>
                      )}
                      <TableCell>
                        <span className="flex items-center gap-inline-sm">
                          {time}
                          {reading.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element -- a data URL, nothing to optimise
                            <img
                              src={reading.photo}
                              alt={
                                isEs
                                  ? `Foto de la lectura de las ${time}`
                                  : `Photo with the ${time} reading`
                              }
                              className="h-8 w-8 rounded-control object-cover"
                            />
                          ) : null}
                        </span>
                      </TableCell>
                      <TableCell numeric>{reading.systolic}</TableCell>
                      <TableCell numeric>{reading.diastolic}</TableCell>
                      <TableCell numeric>{reading.pulse}</TableCell>
                      <TableCell>{positionLabel}</TableCell>
                      <TableCell>{symptomsLabel}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-inline-md">
                          <ReadingStatus status={statusOf(reading)} />
                          <span className="text-body-sm text-fg-secondary">
                            {medicationLabel}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-inline-md">
                          <Link
                            href={`/dashboard/personal-log/blood-pressure/add?id=${reading.id}`}
                            className={buttonStyles({
                              iconOnly: true,
                              size: "small",
                              variant: "neutral",
                              appearance: "fill-stroke",
                            })}
                            aria-label={`Edit reading from ${dateLabel} at ${time}`}
                          >
                            <Edit3 />
                          </Link>
                          <Button
                            iconOnly
                            size="small"
                            variant="danger"
                            appearance="fill-stroke"
                            aria-label={`Delete reading from ${dateLabel} at ${time}`}
                            onClick={() => setDeleting(reading)}
                          >
                            <Trash2 />
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
      )}

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        size="small"
        title={isEs ? "¿Eliminar esta lectura?" : "Delete this reading?"}
        description={
          deleting
            ? `${formatDay(deleting.date, isEs)} · ${formatClock(deleting.time)} · ${deleting.systolic}/${deleting.diastolic}`
            : undefined
        }
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setDeleting(null)}
            >
              {isEs ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleting) bp.remove(deleting.id);
                setDeleting(null);
              }}
            >
              {isEs ? "Eliminar" : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-fg-secondary">
          {isEs ? "No se puede deshacer." : "This cannot be undone."}
        </p>
      </Modal>
    </Card>
  );
}

function TrendChart() {
  const { language, t } = useLanguage();
  const isEs = language === "ES";
  const bp = useBloodPressure();
  const points = trend(bp.readings);

  return (
    <Card as="section">
      <h2 className="text-heading-4 text-fg">
        {t("bloodPressure.trendsTitle")}
      </h2>

      <div className="mt-stack-xl">
        {points.length < 2 ? (
          <p className="text-body-sm text-fg-muted">
            {isEs
              ? "La tendencia aparece con dos o más lecturas."
              : "The trend appears once you have two or more readings."}
          </p>
        ) : (
          <LineChart
            label={t("bloodPressure.trendsTitle")}
            unit="mmHg"
            yMin={60}
            yMax={180}
            height={206}
            xLabels={points.map((p) => {
              const [, m, d] = p.date.split("-").map(Number);
              return `${m}/${d}`;
            })}
            series={[
              {
                id: "systolic",
                label: t("bloodPressure.systolicLegend"),
                tone: "accent",
                points: points.map((p) => p.systolic),
              },
              {
                id: "diastolic",
                label: t("bloodPressure.diastolicLegend"),
                tone: "danger",
                points: points.map((p) => p.diastolic),
              },
            ]}
          />
        )}
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

/* Check reminders (client, 2026-10-05). */
function BpReminderGate() {
  const { language } = useLanguage();
  return <BpReminderCard isEs={language === "ES"} />;
}

/* Export to share, as on the medication log (client, 2026-10-05). */
function ShareReadings() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const bp = useBloodPressure();
  return (
    <ShareLogCard
      isEs={isEs}
      title={isEs ? "Mi registro de presión arterial" : "My blood pressure log"}
      fileName="blood-pressure-log"
      table={{
        header: [
          "Date",
          "Time",
          "Systolic",
          "Diastolic",
          "Pulse",
          "Position",
          "Notes",
        ],
        rows: [...bp.readings]
          .sort((a, b) =>
            `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`),
          )
          .map((r) => [
            r.date,
            r.time,
            r.systolic,
            r.diastolic,
            r.pulse,
            r.position,
            r.notes,
          ]),
      }}
    />
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

      <BpReminderGate />

      <ShareReadings />
    </div>
  );
}
