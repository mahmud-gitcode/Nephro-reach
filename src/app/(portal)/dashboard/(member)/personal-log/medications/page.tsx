"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Plus,
  Share2,
  Smile,
  UserPlus,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import {
  Badge,
  Button,
  buttonStyles,
  Card,
  FormField,
  Input,
  Modal,
  RadioCard,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea,
} from "@/components/ui";
import type { BadgeTone } from "@/components/ui";

export interface MedicationReminder {
  id: string;
  medicationName: string;
  time: string;
  frequency: string;
  channels: ("in_app" | "sms")[];
  enabled: boolean;
  notes?: string;
}

const medicationsData = [
  {
    name: "Potassium",
    dose: "10 mg",
    route: "PO",
    frequencyEn: "Once daily",
    frequencyEs: "Una vez al día",
    purposeEn: "Blood pressure",
    purposeEs: "Presión arterial",
    startDate: "15/08/2017",
    endDate: "---",
    pharmacy: "HealthPlus",
    status: "Active",
  },
  {
    name: "Norvasc",
    dose: "10 mg",
    route: "PO",
    frequencyEn: "Once daily",
    frequencyEs: "Una vez al día",
    purposeEn: "Blood pressure",
    purposeEs: "Presión arterial",
    startDate: "15/08/2017",
    endDate: "---",
    pharmacy: "HealthPlus",
    status: "Active",
  },
  {
    name: "Sevelamer",
    dose: "800 mg",
    route: "PO",
    frequencyEn: "With meals",
    frequencyEs: "Con las comidas",
    purposeEn: "Phosphorus binder",
    purposeEs: "Quelante de fósforo",
    startDate: "03/02/2024",
    endDate: "---",
    pharmacy: "Kidney Care Rx",
    status: "Active",
  },
  {
    name: "Calcitriol",
    dose: "0.25 mcg",
    route: "PO",
    frequencyEn: "Mon/Wed/Fri",
    frequencyEs: "Lun/Mié/Vie",
    purposeEn: "Bone health",
    purposeEs: "Salud ósea",
    startDate: "09/11/2023",
    endDate: "---",
    pharmacy: "HealthPlus",
    status: "Active",
  },
  {
    name: "PTH",
    dose: "10 mg",
    route: "PO",
    frequencyEn: "PRN",
    frequencyEs: "PRN",
    purposeEn: "Provider Goal",
    purposeEs: "Meta del proveedor",
    startDate: "07/05/2016",
    endDate: "---",
    pharmacy: "HealthPlus",
    status: "PRN",
  },
  {
    name: "A1C",
    dose: "10 mg",
    route: "PO",
    frequencyEn: "Once daily (HS)",
    frequencyEs: "Una vez al día (noche)",
    purposeEn: "Cholesterol",
    purposeEs: "Colesterol",
    startDate: "16/08/2013",
    endDate: "16/08/2013",
    pharmacy: "HealthPlus",
    status: "Stopped",
  },
];

const INITIAL_REMINDERS: MedicationReminder[] = [
  {
    id: "r1",
    medicationName: "Potassium",
    time: "08:00 AM",
    frequency: "Daily",
    channels: ["in_app"],
    enabled: true,
    notes: "Take with breakfast",
  },
  {
    id: "r2",
    medicationName: "Norvasc",
    time: "08:00 AM",
    frequency: "Daily",
    channels: ["in_app"],
    enabled: true,
    notes: "Hold morning dose on dialysis days until after run",
  },
  {
    id: "r3",
    medicationName: "Sevelamer",
    time: "12:30 PM",
    frequency: "With meals",
    channels: ["in_app"],
    enabled: true,
    notes: "Chew thoroughly with first bite of lunch",
  },
  {
    id: "r4",
    medicationName: "Calcitriol",
    time: "07:00 PM",
    frequency: "Mon/Wed/Fri",
    channels: ["in_app"],
    enabled: true,
    notes: "Take with evening meal",
  },
];

const doseScheduleData = [
  {
    time: "07:40 am",
    medication: "Norvasc",
    generic: "Amlodipine",
    instructionsEn: "Take with food",
    instructionsEs: "Tomar con alimentos",
    status: "Taken",
    stamp: "8:02 AM",
    sideEffectsEn: "Fatigue",
    sideEffectsEs: "Fatiga",
  },
  {
    time: "01:09 am",
    medication: "Norvasc",
    generic: "Amlodipine",
    instructionsEn: "Take with food",
    instructionsEs: "Tomar con alimentos",
    status: "Taken",
    stamp: "8:02 AM",
    sideEffectsEn: "None",
    sideEffectsEs: "Ninguno",
  },
  {
    time: "02:30 pm",
    medication: "Norvasc",
    generic: "Amlodipine",
    instructionsEn: "Take with food",
    instructionsEs: "Tomar con alimentos",
    status: "Late",
    stamp: "8:02 AM",
    sideEffectsEn: "None",
    sideEffectsEs: "Ninguno",
  },
  {
    time: "12:01 pm",
    medication: "Norvasc",
    generic: "Amlodipine",
    instructionsEn: "Take with food",
    instructionsEs: "Tomar con alimentos",
    status: "Missed",
    stamp: "---",
    sideEffectsEn: "None",
    sideEffectsEs: "Ninguno",
  },
];

const alertsData = [
  {
    titleEn: "Medication Taken Confirmation",
    titleEs: "Confirmación de Medicamento Tomado",
    timeEn: "Just now",
    timeEs: "Hace un momento",
    bodyEn: "You have taken your 9:00 AM dose of Metformin 500 mg.",
    bodyEs: "Ha tomado su dosis de las 9:00 AM de Metformina 500 mg.",
  },
  {
    titleEn: "Missed Dose: Sevelamer",
    titleEs: "Dosis Omitida: Sevelámero",
    timeEn: "10 min ago",
    timeEs: "Hace 10 min",
    bodyEn: "You missed your 12:00 PM dose today.",
    bodyEs: "Omitió su dosis de las 12:00 PM de hoy.",
  },
  {
    titleEn: "Upcoming: Calcitriol",
    titleEs: "Próximo: Calcitriol",
    timeEn: "5 min ago",
    timeEs: "Hace 5 min",
    bodyEn: "Take with your evening meal.",
    bodyEs: "Tomar con la cena.",
  },
  {
    titleEn: "Refill Alert",
    titleEs: "Alerta de Resurtido",
    timeEn: "In 15 min",
    timeEs: "En 15 min",
    bodyEn: "Atorvastatin supply is running low.",
    bodyEs: "El suministro de Atorvastatina se está agotando.",
  },
  {
    titleEn: "Doctor's Appointment Reminder",
    titleEs: "Recordatorio de Cita Médica",
    timeEn: "Tomorrow",
    timeEs: "Mañana",
    bodyEn: "Nephrology follow-up at 10:00 AM.",
    bodyEs: "Seguimiento de nefrología a las 10:00 AM.",
  },
];

/* Six statuses, four meanings. Mapping them to Badge tones instead of raw
   classes means a status here reads the same as a status anywhere else. */
const statusTone: Record<string, BadgeTone> = {
  Active: "success",
  PRN: "info",
  Stopped: "danger",
  Taken: "success",
  Late: "warning",
  Missed: "danger",
};

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-inline-md">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control-small bg-primary-solid text-label-lg text-primary-on-solid"
      >
        {number}
      </span>
      <h2 className="text-heading-4 text-fg">{title}</h2>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const label = t(`medicationsLog.statuses.${status}`) || status;
  return <Badge tone={statusTone[status] || "neutral"}>{label}</Badge>;
}

function MedicationMasterList({
  reminders,
  onOpenReminderModal,
}: {
  reminders: MedicationReminder[];
  onOpenReminderModal: (medName?: string) => void;
}) {
  const { language, t } = useLanguage();

  return (
    <Card as="section" padding="small">
      <div className="flex flex-col gap-inline-md sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle number="1" title={t("medicationsLog.section1")} />
        <Link
          href="/dashboard/personal-log/medications/add"
          className={buttonStyles()}
        >
          <Plus aria-hidden="true" />
          {t("medicationsLog.addMedication")}
        </Link>
      </div>

      <div className="mt-stack-md overflow-hidden rounded-control border border-line">
        <Table minWidth={1140}>
            <TableHead className="bg-surface-sunken">
              <TableRow>
                <TableHeaderCell>{t("medicationsLog.tableHeaders.name")}</TableHeaderCell>
                <TableHeaderCell>{t("medicationsLog.tableHeaders.dose")}</TableHeaderCell>
                <TableHeaderCell>{t("medicationsLog.tableHeaders.route")}</TableHeaderCell>
                <TableHeaderCell>{t("medicationsLog.tableHeaders.frequency")}</TableHeaderCell>
                <TableHeaderCell>{t("medicationsLog.tableHeaders.purpose")}</TableHeaderCell>
                <TableHeaderCell className="text-center">
                  {language === "ES" ? "Hora Recordatorio" : "Reminder Alert"}
                </TableHeaderCell>
                <TableHeaderCell>{t("medicationsLog.tableHeaders.startDate")}</TableHeaderCell>
                <TableHeaderCell>{t("medicationsLog.tableHeaders.endDate")}</TableHeaderCell>
                <TableHeaderCell>{t("medicationsLog.tableHeaders.pharmacy")}</TableHeaderCell>
                <TableHeaderCell>{t("medicationsLog.tableHeaders.status")}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {medicationsData.map((medication) => {
                const rem = reminders.find(
                  (r) => r.medicationName.toLowerCase() === medication.name.toLowerCase() && r.enabled
                );

                return (
                  <TableRow key={`${medication.name}-${medication.startDate}`}>
                    <TableCell emphasis>{medication.name}</TableCell>
                    <TableCell>{medication.dose}</TableCell>
                    <TableCell>{medication.route}</TableCell>
                    <TableCell>
                      {language === "ES" ? medication.frequencyEs : medication.frequencyEn}
                    </TableCell>
                    <TableCell>
                      {language === "ES" ? medication.purposeEs : medication.purposeEn}
                    </TableCell>
                    {/* The cell itself used to carry the onClick, which a
                        keyboard can never reach. The button alone now does. */}
                    <TableCell className="text-center">
                      <Button
                        variant="neutral"
                        appearance={rem ? "fill-stroke" : "stroke"}
                        size="small"
                        onClick={() => onOpenReminderModal(medication.name)}
                        aria-label={
                          rem
                            ? language === "ES"
                              ? `Editar recordatorio de ${medication.name}, ${rem.time}`
                              : `Edit reminder for ${medication.name}, ${rem.time}`
                            : language === "ES"
                              ? `Establecer recordatorio para ${medication.name}`
                              : `Set reminder for ${medication.name}`
                        }
                      >
                        <Bell aria-hidden="true" />
                        {rem
                          ? rem.time
                          : language === "ES"
                            ? "Recordatorio"
                            : "Set Alert"}
                      </Button>
                    </TableCell>
                    <TableCell>{medication.startDate}</TableCell>
                    <TableCell>{medication.endDate}</TableCell>
                    <TableCell>{medication.pharmacy}</TableCell>
                    <TableCell>
                      <StatusBadge status={medication.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function DoseSchedule({ reminders }: { reminders: MedicationReminder[] }) {
  const { language, t } = useLanguage();

  return (
    <Card as="section" padding="small">
      <div className="flex flex-col gap-inline-md lg:flex-row lg:items-center lg:justify-between">
        <SectionTitle number="2" title={t("medicationsLog.section2")} />
        <div className="flex flex-wrap gap-inline-md">
          <Button variant="neutral" appearance="fill-stroke">
            <ChevronLeft aria-hidden="true" />
            {language === "ES" ? "Mayo 20" : "May 20"}
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button variant="neutral" appearance="fill-stroke">
            {t("medicationsLog.today")}
          </Button>
        </div>
      </div>

      <div className="mt-stack-md overflow-hidden rounded-control border border-line">
        <Table minWidth={900}>
            <TableHead className="bg-surface-sunken">
              <TableRow>
                <TableHeaderCell>{t("medicationsLog.tableHeaders.time")}</TableHeaderCell>
                <TableHeaderCell>{t("medicationsLog.tableHeaders.medication")}</TableHeaderCell>
                <TableHeaderCell>{t("medicationsLog.tableHeaders.instructions")}</TableHeaderCell>
                <TableHeaderCell>{t("medicationsLog.tableHeaders.status")}</TableHeaderCell>
                <TableHeaderCell>{t("medicationsLog.tableHeaders.timeStamp")}</TableHeaderCell>
                <TableHeaderCell>{t("medicationsLog.tableHeaders.sideEffects")}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {doseScheduleData.map((dose, idx) => {
                const rem = reminders.find(
                  (r) => r.medicationName.toLowerCase() === dose.medication.toLowerCase() && r.enabled
                );

                return (
                  <TableRow key={`${dose.time}-${idx}`}>
                    <TableCell>
                      <span className="flex items-center gap-inline-sm">
                        {dose.time}
                        {rem && (
                          <Bell
                            className="h-3 w-3 shrink-0 text-fg-brand"
                            aria-label={
                              language === "ES"
                                ? `Recordatorio a las ${rem.time}`
                                : `Reminder set for ${rem.time}`
                            }
                          />
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block text-label-md text-fg">{dose.medication}</span>
                      <span className="block text-caption text-fg-muted">{dose.generic}</span>
                    </TableCell>
                    <TableCell>
                      {language === "ES" ? dose.instructionsEs : dose.instructionsEn}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={dose.status} />
                    </TableCell>
                    <TableCell>
                      <span
                        className={`block text-label-md ${
                          dose.status === "Late" ? "text-warning" : "text-fg-secondary"
                        }`}
                      >
                        {dose.stamp}
                      </span>
                      <span className="block text-caption text-fg-muted">
                        {t("medicationsLog.today")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {language === "ES" ? dose.sideEffectsEs : dose.sideEffectsEn}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function AdherenceChart() {
  const { language, t } = useLanguage();

  const dayLabels = language === "ES"
    ? ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const missedDoses = [
    { day: dayLabels[0], value: 2 },
    { day: dayLabels[1], value: 1.4 },
    { day: dayLabels[2], value: 0.1 },
    { day: dayLabels[3], value: 2 },
    { day: dayLabels[4], value: 0.1 },
    { day: dayLabels[5], value: 2 },
    { day: dayLabels[6], value: 1.4 },
  ];

  const bpPoints = [
    { day: dayLabels[0], bp: 148, adherence: 78 },
    { day: dayLabels[1], bp: 110, adherence: 22 },
    { day: dayLabels[2], bp: 94, adherence: 25 },
    { day: dayLabels[3], bp: 103, adherence: 78 },
    { day: dayLabels[4], bp: 148, adherence: 76 },
    { day: dayLabels[5], bp: 153, adherence: 96 },
    { day: dayLabels[6], bp: 130, adherence: 95 },
  ];

  const chartWidth = 252;
  const chartHeight = 152;
  const xFor = (index: number) => 18 + index * 36;
  const bpY = (value: number) => 8 + ((160 - value) / 80) * 136;
  const adherenceY = (value: number) => 8 + ((100 - value) / 100) * 136;
  const bpLine = bpPoints.map((point, index) => `${xFor(index)},${bpY(point.bp)}`).join(" ");
  const adherenceLine = bpPoints
    .map((point, index) => `${xFor(index)},${adherenceY(point.adherence)}`)
    .join(" ");

  return (
    <Card as="section" padding="small">
      <SectionTitle number="3" title={t("medicationsLog.section3")} />

      <div className="mt-stack-md grid grid-cols-1 gap-inset-md xl:grid-cols-3">
        <Card as="article" tone="flat" padding="small">
          <div>
            <h3 className="text-heading-5 text-fg">
              {t("medicationsLog.adherence.overallTitle")}
            </h3>
            <p className="mt-stack-sm text-caption text-fg-muted">
              {t("medicationsLog.adherence.totalDoses")}
            </p>
          </div>

          <div className="mt-stack-xl flex flex-col items-center justify-center gap-inset-lg sm:flex-row">
            {/* Taken / late / missed are the three outcomes a dose can have,
                so the ring uses the status tones rather than three new hues. */}
            <div
              role="img"
              aria-label={`${t("medicationsLog.adherence.overall")}: 86%`}
              className="relative h-[182px] w-[182px] shrink-0 rounded-full"
              style={{
                background:
                  "conic-gradient(var(--color-success-600) 0deg 180deg, var(--color-warning-600) 180deg 288deg, var(--color-danger-600) 288deg 360deg)",
              }}
            >
              <div className="absolute inset-[26px] rounded-full bg-surface" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-metric-sm text-fg">86%</p>
                <p className="text-caption text-fg-muted">
                  {t("medicationsLog.adherence.overall")}
                </p>
              </div>
            </div>

            <ul className="w-[103px] space-y-stack-md">
              {[
                { label: t("medicationsLog.adherence.taken"), value: "50%", dot: "bg-success-600" },
                { label: t("medicationsLog.adherence.late"), value: "30%", dot: "bg-warning-600" },
                { label: t("medicationsLog.adherence.missed"), value: "20%", dot: "bg-danger-600" },
              ].map((item) => (
                <li key={item.label} className="text-center">
                  <div className="flex items-center gap-inline-md">
                    <span aria-hidden="true" className={`h-4 w-4 rounded-full ${item.dot}`} />
                    <span className="text-body-md text-fg-muted">{item.label}</span>
                  </div>
                  <p className="mt-stack-sm text-body-sm text-fg-muted">{item.value}</p>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card as="article" tone="flat" padding="small">
          <h3 className="text-heading-5 text-fg">
            {t("medicationsLog.adherence.missedTitle")}
          </h3>
          <p className="mt-stack-sm text-body-sm text-fg-muted">
            {t("medicationsLog.adherence.totalMissed")}{" "}
            <span className="text-label-md text-danger">8</span>
          </p>

          {/* The bars carry no text, so the numbers are repeated for a screen
              reader the same way <LineChart> does it. */}
          <div className="mt-stack-xl">
            <div
              role="img"
              aria-label={t("medicationsLog.adherence.missedTitle")}
              aria-describedby="missed-doses-table"
            >
              <div className="grid h-[137px] grid-cols-[24px_minmax(0,1fr)] gap-inline-md">
                <div className="flex flex-col justify-between text-right text-caption text-fg-muted">
                  {[10, 8, 6, 4, 2, 0].map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex flex-col justify-between">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <span key={index} className="border-t border-dashed border-line" />
                    ))}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex h-full items-end justify-between">
                    {missedDoses.map((dose) => (
                      <span
                        key={dose.day}
                        className="w-[22px] rounded-t bg-primary-solid"
                        style={{ height: `${Math.max((dose.value / 10) * 137, 2)}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-stack-sm grid grid-cols-[36px_minmax(0,1fr)] gap-inline-md">
                <span />
                <div className="flex justify-between text-caption text-fg-secondary">
                  {missedDoses.map((dose) => (
                    <span key={dose.day} className="w-[30px] text-center">
                      {dose.day}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <table id="missed-doses-table" className="sr-only">
              <caption>{t("medicationsLog.adherence.missedTitle")}</caption>
              <thead>
                <tr>
                  <th scope="col">{language === "ES" ? "Día" : "Day"}</th>
                  <th scope="col">{t("medicationsLog.adherence.missedTitle")}</th>
                </tr>
              </thead>
              <tbody>
                {missedDoses.map((dose) => (
                  <tr key={dose.day}>
                    <th scope="row">{dose.day}</th>
                    <td>{dose.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card as="article" tone="flat" padding="small">
          <h3 className="text-heading-5 text-fg">
            {t("medicationsLog.adherence.bpVsAdherence")}
          </h3>
          {/* Two series, two axes — <LineChart> draws one axis, so this one
              stays hand-drawn. The tones are still the chart tones. */}
          <div className="mt-stack-sm flex items-center gap-inline-lg text-caption text-fg-muted">
            <span className="inline-flex items-center gap-inline-sm">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-accent-600" />
              {t("medicationsLog.adherence.bp")}
            </span>
            <span className="inline-flex items-center gap-inline-sm">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-brand-600" />
              {t("medicationsLog.adherence.adherencePercent")}
            </span>
          </div>

          <div
            className="mt-stack-lg"
            role="img"
            aria-label={t("medicationsLog.adherence.bpVsAdherence")}
            aria-describedby="bp-adherence-table"
          >
            <div className="grid h-[166px] grid-cols-[32px_minmax(0,1fr)_40px] gap-2">
              <div className="flex flex-col justify-between text-right text-caption text-fg-muted">
                {[160, 140, 120, 100, 80].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 flex flex-col justify-between py-1.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={index} className="border-t border-dashed border-line" />
                  ))}
                </div>
                <div className="absolute inset-0 flex justify-between px-px">
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
                    points={bpLine}
                    fill="none"
                    stroke="var(--color-accent-600)"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                  <polyline
                    points={adherenceLine}
                    fill="none"
                    stroke="var(--color-brand-600)"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                  {bpPoints.map((point, index) => (
                    <React.Fragment key={point.day}>
                      <circle
                        cx={xFor(index)}
                        cy={bpY(point.bp)}
                        r="4"
                        fill="var(--color-surface)"
                        stroke="var(--color-accent-600)"
                        strokeWidth="2"
                      />
                      <circle
                        cx={xFor(index)}
                        cy={adherenceY(point.adherence)}
                        r="4"
                        fill="var(--color-surface)"
                        stroke="var(--color-brand-600)"
                        strokeWidth="2"
                      />
                    </React.Fragment>
                  ))}
                </svg>
              </div>
              <div className="flex flex-col justify-between text-caption text-fg-muted">
                {["100%", "75%", "50%", "25%", "0%"].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
            <div className="mt-stack-sm grid grid-cols-[32px_minmax(0,1fr)_40px] gap-inline-md">
              <span />
              <div className="flex justify-between text-caption text-fg-secondary">
                {bpPoints.map((point) => (
                  <span key={point.day} className="w-[30px] text-center">
                    {point.day}
                  </span>
                ))}
              </div>
              <span />
            </div>
          </div>

          <table id="bp-adherence-table" className="sr-only">
            <caption>{t("medicationsLog.adherence.bpVsAdherence")}</caption>
            <thead>
              <tr>
                <th scope="col">{language === "ES" ? "Día" : "Day"}</th>
                <th scope="col">{t("medicationsLog.adherence.bp")}</th>
                <th scope="col">{t("medicationsLog.adherence.adherencePercent")}</th>
              </tr>
            </thead>
            <tbody>
              {bpPoints.map((point) => (
                <tr key={point.day}>
                  <th scope="row">{point.day}</th>
                  <td>{point.bp} mmHg</td>
                  <td>{point.adherence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </Card>
  );
}

function AlertsAndMood({
  reminders,
  onOpenReminderModal,
}: {
  reminders: MedicationReminder[];
  onOpenReminderModal: (medName?: string) => void;
}) {
  const { language, t } = useLanguage();
  const [selectedMood, setSelectedMood] = useState(1);
  const [notes, setNotes] = useState("");

  const moods = [
    { label: t("medicationsLog.mood.veryGood") },
    { label: t("medicationsLog.mood.good") },
    { label: t("medicationsLog.mood.okay") },
    { label: t("medicationsLog.mood.poor") },
    { label: t("medicationsLog.mood.veryPoor") },
  ];

  return (
    <section className="grid grid-cols-1 gap-inset-md xl:grid-cols-2">
      <Card padding="small">
        <SectionTitle number="4" title={t("medicationsLog.section4")} />

        {/* Scheduled Reminders Ribbon */}
        {reminders && reminders.filter((r) => r.enabled).length > 0 && (
          <div className="mt-stack-md space-y-stack-sm rounded-control border border-primary-soft-line bg-primary-soft p-inset-xs">
            <p className="text-overline flex items-center gap-inline-sm text-primary-fg">
              <Bell aria-hidden="true" className="h-3.5 w-3.5" />
              <span>
                {language === "ES"
                  ? "Recordatorios Programados Activos"
                  : "Active Scheduled Dose Reminders"}
              </span>
            </p>
            <div className="flex flex-wrap gap-inline-md pt-0.5">
              {reminders
                .filter((r) => r.enabled)
                .map((rem) => (
                  <Button
                    key={rem.id}
                    variant="neutral"
                    appearance="fill-stroke"
                    size="small"
                    onClick={() => onOpenReminderModal(rem.medicationName)}
                    aria-label={
                      language === "ES"
                        ? `Editar hora de ${rem.medicationName}, ${rem.time}`
                        : `Edit time for ${rem.medicationName}, ${rem.time}`
                    }
                  >
                    <span className="text-fg-brand">{rem.medicationName}</span>
                    <span className="text-fg-muted">• {rem.time}</span>
                  </Button>
                ))}
            </div>
          </div>
        )}

        <div className="mt-stack-md max-h-[290px] space-y-stack-xs overflow-y-auto pr-1">
          {alertsData.map((alert, idx) => (
            <article
              key={idx}
              className="rounded-control border border-transparent px-inset-sm py-inset-xs transition-colors duration-150 ease-standard hover:border-line-subtle hover:bg-surface-sunken"
            >
              <div className="flex items-start justify-between gap-inline-lg">
                <h3 className="text-label-md text-fg">
                  {language === "ES" ? alert.titleEs : alert.titleEn}
                </h3>
                <p className="shrink-0 text-caption text-fg-muted">
                  {language === "ES" ? alert.timeEs : alert.timeEn}
                </p>
              </div>
              <p className="mt-stack-xs text-body-sm text-fg-muted">
                {language === "ES" ? alert.bodyEs : alert.bodyEn}
              </p>
            </article>
          ))}
        </div>
      </Card>

      <Card padding="small">
        <SectionTitle number="5" title={t("medicationsLog.section5")} />
        <Card tone="flat" padding="small" className="mt-stack-md">
          <p className="text-body-md text-fg">
            {t("medicationsLog.mood.howDoYouFeel")}
          </p>

          {/* Five moods, one answer — a radio group, so arrow keys move
              between them and only the chosen one is a tab stop. */}
          <RadioGroup
            label={t("medicationsLog.mood.howDoYouFeel")}
            value={String(selectedMood)}
            onChange={(next) => setSelectedMood(Number(next))}
            orientation="horizontal"
            className="mt-stack-sm grid grid-cols-5 gap-inline-md"
          >
            {moods.map((m, index) => (
              <RadioCard
                key={m.label}
                layout="tile"
                value={String(index)}
                title={m.label}
                icon={<Smile />}
              />
            ))}
          </RadioGroup>

          <div className="mt-stack-lg border-t border-line pt-inset-sm">
            <FormField label={t("medicationsLog.mood.notes")}>
              {(props) => (
                <Textarea
                  {...props}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-24 resize-none"
                  placeholder={t("medicationsLog.mood.notesPlaceholder")}
                />
              )}
            </FormField>
          </div>

          <Button className="mt-stack-md w-full">
            {t("medicationsLog.mood.saveLog")}
          </Button>
        </Card>
      </Card>
    </section>
  );
}

function ExportReporting() {
  const { t } = useLanguage();

  const reports = [
    {
      title: t("medicationsLog.export.pdfTitle"),
      desc: t("medicationsLog.export.pdfDesc"),
      action: t("medicationsLog.export.downloadPdf"),
      isShare: false,
    },
    {
      title: t("medicationsLog.export.excelTitle"),
      desc: t("medicationsLog.export.excelDesc"),
      action: t("medicationsLog.export.downloadExcel"),
      isShare: false,
    },
    {
      title: t("medicationsLog.export.shareTitle"),
      desc: t("medicationsLog.export.shareDesc"),
      action: t("medicationsLog.export.shareReport"),
      isShare: true,
    },
  ];

  return (
    <Card as="section" padding="small">
      <SectionTitle number="6" title={t("medicationsLog.section6")} />

      <div className="mt-stack-md grid grid-cols-1 gap-inset-md lg:grid-cols-3">
        {reports.map((report) => (
          <Card
            key={report.title}
            as="article"
            tone="flat"
            padding="small"
            className="flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-inline-lg">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-primary-soft text-fg-brand"
                >
                  {report.isShare ? (
                    <UserPlus className="h-icon-big w-icon-big" />
                  ) : (
                    <FileText className="h-icon-big w-icon-big" />
                  )}
                </span>
                <h3 className="text-heading-5 text-fg">{report.title}</h3>
              </div>
              <div className="mt-stack-lg border-t border-line pt-inset-xs">
                <p className="text-body-sm text-fg-muted">{report.desc}</p>
              </div>
            </div>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              className="mt-stack-lg w-full"
            >
              {report.isShare ? (
                <Share2 aria-hidden="true" />
              ) : (
                <Download aria-hidden="true" />
              )}
              {report.action}
            </Button>
          </Card>
        ))}
      </div>
    </Card>
  );
}

function formatTo12Hour(time24: string): string {
  if (!time24) return "08:00 AM";
  const parts = time24.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  if (isNaN(h)) return "08:00 AM";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const hFormatted = h < 10 ? `0${h}` : `${h}`;
  return `${hFormatted}:${m} ${ampm}`;
}

function formatTo24Hour(time12: string): string {
  if (!time12) return "08:00";
  const trimmed = time12.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return "08:00";
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = match[3]?.toUpperCase();

  if (ampm === "PM" && h < 12) {
    h += 12;
  } else if (ampm === "AM" && h === 12) {
    h = 0;
  }
  const hFormatted = h < 10 ? `0${h}` : `${h}`;
  return `${hFormatted}:${m}`;
}

function SimpleTimeReminderModal({
  isOpen,
  onClose,
  medicationName,
  currentTime,
  onSaveTime,
  onDeleteReminder,
}: {
  isOpen: boolean;
  onClose: () => void;
  medicationName: string;
  currentTime?: string;
  onSaveTime: (medicationName: string, newTime: string) => void;
  onDeleteReminder?: (medicationName: string) => void;
}) {
  const { language } = useLanguage();
  const [timeValue, setTimeValue] = useState("08:00");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentTime) {
      setTimeValue(formatTo24Hour(currentTime));
    } else {
      setTimeValue("08:00");
    }
    setSavedSuccess(false);
  }, [currentTime, isOpen, medicationName]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = formatTo12Hour(timeValue);
    onSaveTime(medicationName, formatted);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 450);
  };

  const handleDelete = () => {
    if (onDeleteReminder) {
      onDeleteReminder(medicationName);
      onClose();
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="small"
      title={language === "ES" ? "Alerta de Recordatorio" : "Reminder Alert"}
      description={medicationName}
      footer={
        <>
          {currentTime && onDeleteReminder ? (
            <Button
              variant="danger"
              appearance="stroke"
              onClick={handleDelete}
              className="mr-auto"
            >
              {language === "ES" ? "Eliminar alerta" : "Remove alert"}
            </Button>
          ) : null}
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            {language === "ES" ? "Cancelar" : "Cancel"}
          </Button>
          <Button type="submit" form="reminder-time-form">
            <Check aria-hidden="true" />
            {language === "ES" ? "Guardar" : "Save"}
          </Button>
        </>
      }
    >
      <form
        id="reminder-time-form"
        onSubmit={handleSave}
        className="space-y-stack-lg"
      >
        <div className="flex flex-col items-center justify-center rounded-control border border-line bg-surface-sunken p-inset-sm">
          <Input
            type="time"
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
            aria-label={language === "ES" ? "Seleccionar Hora" : "Select Time"}
            className="text-metric-md h-auto py-inset-xs text-center"
            required
          />
        </div>

        {/* role="status" so the confirmation is announced, not just shown. */}
        {savedSuccess && (
          <p
            role="status"
            className="flex items-center justify-center gap-inline-sm rounded-control border border-success-line bg-success-surface py-inset-xs text-label-md text-success"
          >
            <Check aria-hidden="true" className="h-4 w-4" />
            <span>
              {language === "ES"
                ? "¡Guardado exitosamente!"
                : "Saved successfully!"}
            </span>
          </p>
        )}
      </form>
    </Modal>
  );
}

const LOCAL_STORAGE_REMINDERS_KEY = "nephroreach_medication_reminders_v1";

export default function MedicationLogPage() {
  const { t } = useLanguage();

  const [reminders, setReminders] = useState<MedicationReminder[]>(INITIAL_REMINDERS);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedMedForReminder, setSelectedMedForReminder] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_REMINDERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReminders(parsed);
        }
      }
    } catch {
      // fallback
    }
  }, []);

  const saveReminders = (updated: MedicationReminder[]) => {
    setReminders(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_REMINDERS_KEY, JSON.stringify(updated));
    } catch {
      // fallback
    }
  };

  const handleOpenReminderModal = (medName?: string) => {
    setSelectedMedForReminder(medName || medicationsData[0]?.name || "Potassium");
    setIsReminderModalOpen(true);
  };

  const handleSaveReminderTime = (medicationName: string, time: string) => {
    const existingIndex = reminders.findIndex(
      (r) => r.medicationName.toLowerCase() === medicationName.toLowerCase()
    );
    let updated: MedicationReminder[];
    if (existingIndex >= 0) {
      updated = [...reminders];
      updated[existingIndex] = {
        ...updated[existingIndex],
        time,
        enabled: true,
      };
    } else {
      const newReminder: MedicationReminder = {
        id: Date.now().toString(),
        medicationName,
        time,
        frequency: "Daily",
        channels: ["in_app"],
        enabled: true,
      };
      updated = [newReminder, ...reminders];
    }
    saveReminders(updated);
  };

  const handleDeleteReminder = (medicationName: string) => {
    const updated = reminders.filter(
      (r) => r.medicationName.toLowerCase() !== medicationName.toLowerCase()
    );
    saveReminders(updated);
  };

  const activeExistingReminder = selectedMedForReminder
    ? reminders.find(
        (r) => r.medicationName.toLowerCase() === selectedMedForReminder.toLowerCase()
      )
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
      <ExportReporting />
      <SimpleTimeReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        medicationName={selectedMedForReminder || ""}
        currentTime={activeExistingReminder?.time}
        onSaveTime={handleSaveReminderTime}
        onDeleteReminder={handleDeleteReminder}
      />
    </div>
  );
}
