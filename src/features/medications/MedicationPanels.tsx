"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Plus,
  Printer,
  Save,
  Share2,
  Smile,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  Badge,
  BarChart,
  Button,
  Card,
  ChartLegend,
  DonutChart,
  FormField,
  RadioCard,
  RadioGroup,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea,
  buttonStyles,
} from "@/components/ui";
import * as rules from "./medicationLog.rules";
import type { DoseStatus } from "./medicationLog.types";
import type { MedicationLog } from "./useMedicationLog";
import type { MedicationReminder } from "@/features/medications/useReminders";
import {
  alertsData,
  doseScheduleData,
  medicationsData,
  statusTone,
} from "./medications.seed";

/* The five read-only sections of the medication log. */

export function SectionTitle({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
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

export function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const label = t(`medicationsLog.statuses.${status}`) || status;
  return <Badge tone={statusTone[status] || "neutral"}>{label}</Badge>;
}

export function MedicationMasterList({
  reminders,
  onOpenReminderModal,
  log,
}: {
  reminders: MedicationReminder[];
  onOpenReminderModal: (medName?: string) => void;
  log: MedicationLog;
}) {
  const { language, t } = useLanguage();
  const isEs = language === "ES";

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
              <TableHeaderCell>
                {t("medicationsLog.tableHeaders.name")}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("medicationsLog.tableHeaders.dose")}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("medicationsLog.tableHeaders.route")}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("medicationsLog.tableHeaders.frequency")}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("medicationsLog.tableHeaders.purpose")}
              </TableHeaderCell>
              <TableHeaderCell className="text-center">
                {language === "ES" ? "Hora Recordatorio" : "Reminder Alert"}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("medicationsLog.tableHeaders.startDate")}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("medicationsLog.tableHeaders.endDate")}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("medicationsLog.tableHeaders.pharmacy")}
              </TableHeaderCell>
              <TableHeaderCell className="text-center">
                {isEs ? "¿Necesita Resurtido?" : "Need Refill?"}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("medicationsLog.tableHeaders.status")}
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {medicationsData.map((medication) => {
              const rem = reminders.find(
                (r) =>
                  r.medicationName.toLowerCase() ===
                    medication.name.toLowerCase() && r.enabled,
              );

              return (
                <TableRow key={`${medication.name}-${medication.startDate}`}>
                  <TableCell emphasis>{medication.name}</TableCell>
                  <TableCell>{medication.dose}</TableCell>
                  <TableCell>{medication.route}</TableCell>
                  <TableCell>
                    {language === "ES"
                      ? medication.frequencyEs
                      : medication.frequencyEn}
                  </TableCell>
                  <TableCell>
                    {language === "ES"
                      ? medication.purposeEs
                      : medication.purposeEn}
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
                  {/* Yes or no, per medication. Nothing here notifies the
                      clinic on its own, which the alert below the table
                      says out loud rather than leaving a member to assume. */}
                  <TableCell className="text-center">
                    <Select
                      selectSize="small"
                      value={log.needsRefill(medication.name) ? "yes" : "no"}
                      aria-label={
                        isEs
                          ? `¿${medication.name} necesita resurtido?`
                          : `Does ${medication.name} need a refill?`
                      }
                      onChange={(event) =>
                        log.setRefill(
                          medication.name,
                          event.target.value === "yes",
                        )
                      }
                      className={
                        log.needsRefill(medication.name)
                          ? "text-warning"
                          : undefined
                      }
                    >
                      <option value="no">{isEs ? "No" : "No"}</option>
                      <option value="yes">{isEs ? "Sí" : "Yes"}</option>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={medication.status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {log.refillCount > 0 ? (
        <Alert tone="warning" className="mt-stack-md">
          {isEs
            ? `Marcaste ${log.refillCount} medicamento(s) como bajos. Avisa a tu farmacia o a tu equipo: esta página no los notifica.`
            : `You flagged ${log.refillCount} medication(s) as low. Tell your pharmacy or care team — this page does not notify them for you.`}
        </Alert>
      ) : null}
    </Card>
  );
}

export function DoseSchedule({
  reminders,
  log,
}: {
  reminders: MedicationReminder[];
  log: MedicationLog;
}) {
  const { language, t } = useLanguage();
  const isEs = language === "ES";

  /* The day being looked at. The arrows used to be dead controls with a
     printed "May 20" between them; they move a real date now, and every
     status below belongs to that date. */
  const [date, setDate] = useState(() => rules.todayIso());
  const onToday = rules.isToday(date);

  const statusOptions: { value: DoseStatus; label: string }[] = [
    { value: "pending", label: isEs ? "Pendiente" : "Not set" },
    { value: "taken", label: isEs ? "Tomado" : "Taken" },
    { value: "late", label: isEs ? "Tarde" : "Late" },
    { value: "missed", label: isEs ? "Perdido" : "Missed" },
  ];

  return (
    <Card as="section" padding="small">
      <div className="flex flex-col gap-inline-md lg:flex-row lg:items-center lg:justify-between">
        <SectionTitle number="2" title={t("medicationsLog.section2")} />
        <div className="flex flex-wrap items-center gap-inline-md">
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={() => setDate((current) => rules.shiftDay(current, -1))}
            aria-label={isEs ? "Día anterior" : "Previous day"}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span className="min-w-[96px] text-center text-label-md text-fg">
            {rules.formatDayLabel(date, isEs)}
          </span>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            /* No forward past today: a dose cannot be recorded before it is
               due, and an empty tomorrow reads as a day of missed doses. */
            disabled={onToday}
            onClick={() => setDate((current) => rules.shiftDay(current, 1))}
            aria-label={isEs ? "Día siguiente" : "Next day"}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            disabled={onToday}
            onClick={() => setDate(rules.todayIso())}
          >
            {t("medicationsLog.today")}
          </Button>
        </div>
      </div>

      <div className="mt-stack-md overflow-hidden rounded-control border border-line">
        <Table minWidth={980}>
          <TableHead className="bg-surface-sunken">
            <TableRow>
              <TableHeaderCell>
                {t("medicationsLog.tableHeaders.time")}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("medicationsLog.tableHeaders.medication")}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("medicationsLog.tableHeaders.instructions")}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("medicationsLog.tableHeaders.status")}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("medicationsLog.tableHeaders.timeStamp")}
              </TableHeaderCell>
              <TableHeaderCell>
                {t("medicationsLog.tableHeaders.sideEffects")}
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {doseScheduleData.map((dose, idx) => {
              const rem = reminders.find(
                (r) =>
                  r.medicationName.toLowerCase() ===
                    dose.medication.toLowerCase() && r.enabled,
              );

              const status = log.statusOf(date, dose.medication, dose.time);
              const stamp = rules.formatStamp(
                log.stampOf(date, dose.medication, dose.time),
                isEs,
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
                            isEs
                              ? `Recordatorio a las ${rem.time}`
                              : `Reminder set for ${rem.time}`
                          }
                        />
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-label-md text-fg">
                      {dose.medication}
                    </span>
                    <span className="block text-caption text-fg-muted">
                      {dose.generic}
                    </span>
                  </TableCell>
                  <TableCell>
                    {isEs ? dose.instructionsEs : dose.instructionsEn}
                  </TableCell>

                  {/* The control this whole section was missing. It writes
                      the status and the stamp together, and the adherence
                      tracker at the bottom reads the same records back. */}
                  <TableCell>
                    <Select
                      selectSize="small"
                      value={status}
                      aria-label={
                        isEs
                          ? `Estado de ${dose.medication} a las ${dose.time}`
                          : `Status for ${dose.medication} at ${dose.time}`
                      }
                      onChange={(event) =>
                        log.setDoseStatus(
                          date,
                          dose.medication,
                          dose.time,
                          event.target.value as DoseStatus,
                        )
                      }
                      className={
                        status === "taken"
                          ? "text-success"
                          : status === "late"
                            ? "text-warning"
                            : status === "missed"
                              ? "text-danger"
                              : undefined
                      }
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </TableCell>

                  <TableCell>
                    {stamp ? (
                      <>
                        <span
                          className={`block text-label-md ${
                            status === "late"
                              ? "text-warning"
                              : "text-fg-secondary"
                          }`}
                        >
                          {stamp}
                        </span>
                        <span className="block text-caption text-fg-muted">
                          {rules.formatDayLabel(date, isEs)}
                        </span>
                      </>
                    ) : (
                      <span className="text-body-sm text-fg-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEs ? dose.sideEffectsEs : dose.sideEffectsEn}
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

export function AdherenceChart({ log }: { log: MedicationLog }) {
  const { language, t } = useLanguage();
  const isEs = language === "ES";

  /* Everything below reads the dose statuses tapped in section 2. It used
     to be a fixed 86% next to a fixed 50/30/20 ring and a hand-drawn line,
     which is what Joni meant by the tracker tracking nothing. */
  const dosesPerDay = doseScheduleData.length;
  const week = rules.adherenceByDay(log.doses, dosesPerDay, 7);
  const overall = rules.summariseAdherence(
    log.doses.filter((dose) => week.some((day) => day.date === dose.date)),
    dosesPerDay * 7,
  );

  const decided = overall.taken + overall.late + overall.missed;
  const share = (count: number) =>
    decided === 0 ? 0 : Math.round((count / decided) * 100);

  const bandTone = (band: rules.AdherenceBandValue | null) =>
    band === "good"
      ? "bg-success-surface border-success-line text-success"
      : band === "fair"
        ? "bg-warning-surface border-warning-line text-warning"
        : band === "poor"
          ? "bg-danger-surface border-danger-line text-danger"
          : "bg-canvas border-dashed border-line-strong text-fg-subtle";

  const bandLabel = (band: rules.AdherenceBandValue | null) =>
    band === "good"
      ? isEs
        ? "Bien"
        : "On track"
      : band === "fair"
        ? isEs
          ? "Irregular"
          : "Slipping"
        : band === "poor"
          ? isEs
            ? "Bajo"
            : "Off track"
          : isEs
            ? "Sin registro"
            : "Not logged";

  return (
    <Card as="section" padding="small">
      <SectionTitle number="3" title={t("medicationsLog.section3")} />

      {/* Nothing logged is said once, rather than as a 0% ring that reads
          like a member who missed every dose. */}
      {overall.percent === null ? (
        <Card tone="flat" padding="small" className="mt-stack-md">
          <p className="text-body-md text-fg">
            {isEs
              ? "Aún no hay dosis registradas esta semana."
              : "No doses recorded this week yet."}
          </p>
          <p className="mt-stack-xs measure text-body-sm text-fg-muted">
            {isEs
              ? "Marca cada dosis arriba como Tomado, Tarde o Perdido. Este seguimiento se llena solo a partir de eso."
              : "Mark each dose above as Taken, Late or Missed. This tracker fills itself in from those."}
          </p>
        </Card>
      ) : (
        <div className="mt-stack-md grid grid-cols-1 gap-inset-md xl:grid-cols-3">
          <Card as="article" tone="flat" padding="small">
            <div>
              <h3 className="text-heading-4 text-fg">
                {t("medicationsLog.adherence.overallTitle")}
              </h3>
              <p className="mt-0.5 text-body-md text-fg-muted">
                {isEs
                  ? `${decided} dosis registradas en 7 días`
                  : `${decided} doses recorded over 7 days`}
              </p>
            </div>

            <div className="mt-stack-xl flex flex-col items-center justify-center gap-inset-lg sm:flex-row">
              {/* Taken / late / missed are the three outcomes a dose can
                  have, so the ring uses the status tones. */}
              <DonutChart
                segments={[
                  {
                    label: t("medicationsLog.adherence.taken"),
                    value: overall.taken,
                    tone: "success",
                  },
                  {
                    label: t("medicationsLog.adherence.late"),
                    value: overall.late,
                    tone: "warning",
                  },
                  {
                    label: t("medicationsLog.adherence.missed"),
                    value: overall.missed,
                    tone: "danger",
                  },
                ]}
                label={t("medicationsLog.adherence.overallTitle")}
                size={182}
                thickness={26}
                centerValue={`${overall.percent}%`}
                centerLabel={t("medicationsLog.adherence.overall")}
              />

              <ChartLegend
                className="w-[140px]"
                items={[
                  {
                    label: t("medicationsLog.adherence.taken"),
                    tone: "success",
                    value: `${share(overall.taken)}%`,
                  },
                  {
                    label: t("medicationsLog.adherence.late"),
                    tone: "warning",
                    value: `${share(overall.late)}%`,
                  },
                  {
                    label: t("medicationsLog.adherence.missed"),
                    tone: "danger",
                    value: `${share(overall.missed)}%`,
                  },
                ]}
              />
            </div>
          </Card>

          <Card as="article" tone="flat" padding="small">
            <h3 className="text-heading-4 text-fg">
              {t("medicationsLog.adherence.missedTitle")}
            </h3>
            <p className="mt-0.5 text-body-md text-fg-muted">
              {t("medicationsLog.adherence.totalMissed")}{" "}
              <span className="text-label-md text-danger">
                {overall.missed}
              </span>
            </p>

            <BarChart
              bars={week.map((day) => ({
                label: rules.formatDayLabel(day.date, isEs),
                value: day.summary.missed,
              }))}
              label={t("medicationsLog.adherence.missedTitle")}
              yMax={Math.max(2, dosesPerDay)}
              yTicks={4}
              height={137}
              className="mt-stack-xl"
            />
          </Card>

          {/* The red / yellow / green Joni described. One square a day, and
              a day nobody logged stays blank instead of counting as a
              failure. */}
          <Card as="article" tone="flat" padding="small">
            <h3 className="text-heading-4 text-fg">
              {isEs ? "Últimos 7 días" : "Last 7 days"}
            </h3>
            <p className="mt-0.5 text-body-md text-fg-muted">
              {isEs
                ? "Verde 90% o más, amarillo 70-89%, rojo por debajo."
                : "Green is 90% or more, yellow 70-89%, red below that."}
            </p>

            <ul className="mt-6 space-y-stack-xs">
              {week.map((day) => (
                <li
                  key={day.date}
                  className="flex items-center gap-inline-md text-body-sm"
                >
                  <span className="w-16 shrink-0 text-fg-muted">
                    {rules.formatDayLabel(day.date, isEs)}
                  </span>
                  <span
                    className={`inline-flex h-7 min-w-[64px] items-center justify-center rounded-control-small border px-inset-xs text-label-sm ${bandTone(
                      day.summary.band,
                    )}`}
                  >
                    {day.summary.percent === null
                      ? "—"
                      : `${day.summary.percent}%`}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-fg-muted">
                    {bandLabel(day.summary.band)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </Card>
  );
}

export function AlertsAndMood({
  reminders,
  onOpenReminderModal,
  log,
}: {
  reminders: MedicationReminder[];
  onOpenReminderModal: (medName?: string) => void;
  log: MedicationLog;
}) {
  const { language, t } = useLanguage();
  const isEs = language === "ES";

  /* Today's entry, if there is one. The form used to hold its own state and
     a Save button wired to nothing, so a member could write how they felt,
     press Save, and lose it on the next render. */
  const today = rules.todayIso();
  const saved = log.moodOn(today);

  const [selectedMood, setSelectedMood] = useState(saved?.mood ?? 1);
  const [notes, setNotes] = useState(saved?.notes ?? "");
  const [justSaved, setJustSaved] = useState(false);

  const dirty =
    selectedMood !== (saved?.mood ?? 1) || notes !== (saved?.notes ?? "");

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
            <p className="flex items-center gap-inline-sm text-overline text-primary-fg">
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

          <Button
            className="mt-stack-md w-full"
            disabled={log.isSavingMood || (!dirty && justSaved)}
            onClick={() => {
              log.saveMoodEntry({
                date: today,
                mood: selectedMood,
                notes,
                savedAt: new Date().toISOString(),
              });
              setJustSaved(true);
            }}
          >
            {log.isSavingMood
              ? isEs
                ? "Guardando…"
                : "Saving…"
              : t("medicationsLog.mood.saveLog")}
          </Button>

          {/* Confirmed rather than assumed: this is a form a member fills in
              and walks away from. */}
          {justSaved && !dirty ? (
            <p className="mt-stack-sm text-center text-body-sm text-success">
              {isEs ? "Guardado para hoy." : "Saved for today."}
            </p>
          ) : null}
        </Card>
      </Card>
    </section>
  );
}

export function ExportReporting({ log }: { log: MedicationLog }) {
  const { language, t } = useLanguage();
  const isEs = language === "ES";

  const [recipient, setRecipient] = useState("nurse");
  const [sent, setSent] = useState(false);

  /* Three controls, as asked for on the call: Save, Export with a choice of
     recipient, and Download / Print. The three product cards that had grown
     here — PDF, Excel, Share, all wired to nothing — said more about export
     formats than about what a member wanted to do. */
  const recipients = [
    {
      value: "nurse",
      labelEn: "Dialysis nurse",
      labelEs: "Enfermera de diálisis",
    },
    { value: "nephrologist", labelEn: "Nephrologist", labelEs: "Nefrólogo" },
    { value: "dietitian", labelEn: "Dietitian", labelEs: "Dietista" },
    { value: "pharmacy", labelEn: "Pharmacy", labelEs: "Farmacia" },
    { value: "caregiver", labelEn: "Caregiver", labelEs: "Cuidador" },
  ];

  const recipientLabel =
    recipients.find((entry) => entry.value === recipient) ?? recipients[0];

  return (
    <Card as="section" padding="small">
      <SectionTitle number="6" title={t("medicationsLog.section6")} />

      <p className="mt-stack-sm measure text-body-sm text-fg-muted">
        {isEs
          ? "Tu registro ya se guarda en este dispositivo cada vez que marcas una dosis."
          : "Your log already saves to this device each time you mark a dose."}
      </p>

      <div className="mt-stack-md flex flex-col gap-inline-md sm:flex-row sm:items-end">
        {/* 1. Save */}
        <Button
          variant="neutral"
          appearance="fill-stroke"
          onClick={() => log.refetch()}
        >
          <Save aria-hidden="true" />
          {isEs ? "Guardar" : "Save"}
        </Button>

        {/* 2. Export, with the recipient chosen alongside it rather than
               hidden behind a second screen. */}
        <div className="flex flex-1 flex-col gap-inline-md sm:flex-row sm:items-end">
          <FormField
            label={isEs ? "Enviar a" : "Send to"}
            className="flex-1 sm:max-w-[260px]"
          >
            {(props) => (
              <Select
                {...props}
                value={recipient}
                onChange={(event) => {
                  setRecipient(event.target.value);
                  setSent(false);
                }}
              >
                {recipients.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {isEs ? entry.labelEs : entry.labelEn}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <Button onClick={() => setSent(true)}>
            <Share2 aria-hidden="true" />
            {isEs ? "Exportar" : "Export"}
          </Button>
        </div>

        {/* 3. Download / Print — the browser's own print dialog, which is
               also how a member saves this as a PDF. */}
        <Button
          variant="neutral"
          appearance="fill-stroke"
          onClick={() => window.print()}
        >
          <Printer aria-hidden="true" />
          {isEs ? "Descargar / Imprimir" : "Download / Print"}
        </Button>
      </div>

      {/* Said plainly rather than letting a member believe it was sent. */}
      {sent ? (
        <Alert
          tone="info"
          className="mt-stack-md"
          onDismiss={() => setSent(false)}
        >
          {isEs
            ? `El envío a ${recipientLabel.labelEs} se conectará cuando el portal del equipo esté activo. Por ahora usa Descargar / Imprimir para compartirlo.`
            : `Sending to your ${recipientLabel.labelEn.toLowerCase()} connects once the care team portal is live. For now, use Download / Print to share it.`}
        </Alert>
      ) : null}
    </Card>
  );
}
