"use client";

import React from "react";
import Link from "next/link";
import {
  CalendarClock,
  CalendarDays,
  Eye,
  GraduationCap,
  Lock,
  Pill,
  UserRound,
} from "lucide-react";
import {
  Alert,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  KeyCard,
  Progress,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  buttonStyles,
} from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";
import { useMedications } from "@/features/medications/useMedications";
import { useAppointments } from "@/features/personal-log/appointments/useAppointments";
import {
  upcoming,
  past,
} from "@/features/personal-log/appointments/appointments";
import { useDialysisSchedule } from "@/features/personal-log/dialysis/useDialysisSchedule";
import { useClinicLabs } from "@/features/clinic/useClinicLabs";
import { labFlag, labsFor } from "@/features/clinic/labs.data";
import { useJourneyProgress } from "@/features/education/useJourneyProgress";
import { useJourneyNotes } from "@/features/education/useJourneyNotes";
import { completedCount } from "@/features/education/journey.rules";
import { JOURNEY_DAYS } from "@/features/education/dialysisJourneyData";
import { DEMO_MEMBER_EMAIL, DEMO_MEMBER_MRN } from "@/lib/data/demoIdentity";
import {
  CAREGIVER_PERMISSIONS,
  type CaregiverPermission,
} from "./caregivers.data";
import { useCaregiverView, useLogCaregiverView } from "./useCaregivers";

/* ==========================================================================
   Caregiver — what they see
   --------------------------------------------------------------------------
   Read-only views of the one patient the caregiver is looking at, each
   behind what that patient shared. The menu hides an unshared page; the
   gate here catches a typed or bookmarked address.
   ========================================================================== */

const BASE = "/dashboard/caregiver";

const todayKey = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** "05:30" → "5:30 AM". */
function clock(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return time;
  const suffix = h < 12 ? "AM" : "PM";
  return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${suffix}`;
}

/** "2026-10-15" → "Thu, Oct 15". */
function shortDate(key: string): string {
  const d = new Date(`${key}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? key
    : d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
}

const WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Shown above every caregiver page: whose information this is. */
export function CaregiverBanner() {
  const { grant, patients } = useCaregiverView();
  if (!grant) return null;
  return (
    <Alert
      tone="info"
      icon={<Eye />}
      action={
        patients.length > 1 ? (
          <Link
            href={BASE}
            className={buttonStyles({
              variant: "neutral",
              appearance: "fill-stroke",
              size: "small",
            })}
          >
            Change
          </Link>
        ) : null
      }
    >
      Viewing as caregiver for <strong>{grant.patientName}</strong>. You can see
      only what they share with you.
    </Alert>
  );
}

/** A page the patient must have shared. */
function Gate({
  permission,
  href,
  children,
}: {
  permission: CaregiverPermission;
  href: string;
  children: React.ReactNode;
}) {
  const view = useCaregiverView();
  const label =
    CAREGIVER_PERMISSIONS.find((p) => p.id === permission)?.label ?? "";
  if (view.isPending) return <Skeleton height={240} />;
  if (!view.grant) {
    return (
      <EmptyState
        icon={<UserRound />}
        title="Choose who you are caring for"
        description="Pick a patient on your Home page first."
        action={
          <Link href={BASE} className={buttonStyles({})}>
            Go to Home
          </Link>
        }
      />
    );
  }
  if (!view.can(permission)) {
    return (
      <EmptyState
        icon={<Lock />}
        title="Not shared with you"
        description={`${view.grant.patientName} has not shared their ${label.toLowerCase()} with you. Only they can change that.`}
      />
    );
  }
  return (
    <div className="space-y-stack-xl">
      <PageTitle href={href} />
      <Viewed action={`Viewed ${label}`} />
      {children}
    </div>
  );
}

function Viewed({ action }: { action: string }) {
  useLogCaregiverView(action);
  return null;
}

/* ------------------------------------------------------------------ pages */

export function CaregiverSchedule() {
  const href = `${BASE}/schedule`;
  return (
    <Gate permission="schedule" href={href}>
      <ScheduleCard />
    </Gate>
  );
}

function ScheduleCard() {
  const { periods, isPending } = useDialysisSchedule();
  const current = periods[periods.length - 1];
  const days = WEEK.filter((d) => current?.days.includes(d));
  return (
    <Card padding="none" className="overflow-hidden">
      <CardHeader
        className="p-card"
        title="Treatment days"
        description="The days and chair times set in their dialysis schedule."
      />
      {isPending ? (
        <div className="p-card pt-0">
          <Skeleton height={160} />
        </div>
      ) : days.length === 0 ? (
        <EmptyState title="No treatment days set" />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Day</TableHeaderCell>
              <TableHeaderCell>Chair time</TableHeaderCell>
              <TableHeaderCell>Length</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {days.map((day) => {
              const minutes = current.durations?.[day];
              return (
                <TableRow key={day}>
                  <TableCell emphasis>{day}</TableCell>
                  <TableCell className="tabular-nums">
                    {current.chairTimes[day]
                      ? clock(current.chairTimes[day])
                      : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {minutes
                      ? `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ""}`
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

export function CaregiverMedications() {
  return (
    <Gate permission="medications" href={`${BASE}/medications`}>
      <MedicationsCard />
    </Gate>
  );
}

function MedicationsCard() {
  const { medications, isPending } = useMedications();
  return (
    <Card padding="none" className="overflow-hidden">
      <CardHeader
        className="p-card"
        title="Medication list"
        description="As they keep it in NephroReach."
      />
      {isPending ? (
        <div className="p-card pt-0">
          <Skeleton height={200} />
        </div>
      ) : medications.length === 0 ? (
        <EmptyState title="No medications listed" />
      ) : (
        <Table minWidth={640}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Medication</TableHeaderCell>
              <TableHeaderCell>Dose</TableHeaderCell>
              <TableHeaderCell>How often</TableHeaderCell>
              <TableHeaderCell>For</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {medications.map((m) => (
              <TableRow key={m.id}>
                <TableCell emphasis>{m.name}</TableCell>
                <TableCell>{m.dose}</TableCell>
                <TableCell>{m.frequencyEn}</TableCell>
                <TableCell>{m.purposeEn}</TableCell>
                <TableCell>
                  <Badge tone={m.status === "Active" ? "success" : "neutral"}>
                    {m.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

export function CaregiverAppointments() {
  return (
    <Gate permission="appointments" href={`${BASE}/appointments`}>
      <AppointmentsCard which="upcoming" />
      <AppointmentsCard which="past" />
    </Gate>
  );
}

function AppointmentsCard({ which }: { which: "upcoming" | "past" }) {
  const { appointments, isPending } = useAppointments();
  const rows =
    which === "upcoming"
      ? upcoming(appointments, todayKey())
      : past(appointments, todayKey()).slice(0, 10);
  return (
    <Card padding="none" className="overflow-hidden">
      <CardHeader
        className="p-card"
        title={which === "upcoming" ? "Upcoming" : "Recent"}
      />
      {isPending ? (
        <div className="p-card pt-0">
          <Skeleton height={140} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={
            which === "upcoming"
              ? "No upcoming appointments"
              : "No past appointments"
          }
        />
      ) : (
        <Table minWidth={640}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Time</TableHeaderCell>
              <TableHeaderCell>Appointment</TableHeaderCell>
              <TableHeaderCell>With</TableHeaderCell>
              <TableHeaderCell>Where</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="whitespace-nowrap">
                  {shortDate(a.date)}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {clock(a.start)}
                </TableCell>
                <TableCell emphasis>{a.title}</TableCell>
                <TableCell>{a.doctor}</TableCell>
                <TableCell>{a.location}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

export function CaregiverLabs() {
  return (
    <Gate permission="labs" href={`${BASE}/labs`}>
      <LabsCard />
    </Gate>
  );
}

function LabsCard() {
  const { grant } = useCaregiverView();
  const { state, isPending } = useClinicLabs();
  /* With a server the patient's record carries their MRN; in the demo only
     the demo patient has one. */
  const mrn =
    grant?.patientEmail === DEMO_MEMBER_EMAIL ? DEMO_MEMBER_MRN : null;
  const rows = mrn ? labsFor(state, mrn).slice(0, 40) : [];
  return (
    <Card padding="none" className="overflow-hidden">
      <CardHeader
        className="p-card"
        title="Results from the care team"
        description="Newest first."
      />
      {isPending ? (
        <div className="p-card pt-0">
          <Skeleton height={200} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="No lab results yet" />
      ) : (
        <Table minWidth={640}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Test</TableHeaderCell>
              <TableHeaderCell>Result</TableHeaderCell>
              <TableHeaderCell>Normal range</TableHeaderCell>
              <TableHeaderCell>Drawn</TableHeaderCell>
              <TableHeaderCell>
                <span className="sr-only">Flag</span>
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => {
              const flag = labFlag(r);
              return (
                <TableRow key={r.id}>
                  <TableCell emphasis>{r.test}</TableCell>
                  <TableCell className="tabular-nums">
                    {r.value} {r.unit}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {r.reference || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {shortDate(r.date)}
                  </TableCell>
                  <TableCell>
                    {flag ? <Badge tone="warning">{flag}</Badge> : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

export function CaregiverEducation() {
  return (
    <Gate permission="education" href={`${BASE}/education`}>
      <EducationCard />
    </Gate>
  );
}

function EducationCard() {
  const { progress, isPending } = useJourneyProgress();
  const done = completedCount(progress);
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="space-y-stack-sm p-card">
        <CardHeader
          title="21-Day course"
          description={`${done} of ${JOURNEY_DAYS.length} days completed`}
        />
        <Progress
          value={done}
          max={JOURNEY_DAYS.length}
          label="21-Day course progress"
        />
      </div>
      {isPending ? (
        <div className="p-card pt-0">
          <Skeleton height={200} />
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Day</TableHeaderCell>
              <TableHeaderCell>Lesson</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {JOURNEY_DAYS.map((day) => {
              const status = progress[day.slug]?.status ?? "not-started";
              return (
                <TableRow key={day.slug}>
                  <TableCell className="tabular-nums">{day.day}</TableCell>
                  <TableCell emphasis>{day.titleEn}</TableCell>
                  <TableCell>
                    <Badge
                      tone={
                        status === "completed"
                          ? "success"
                          : status === "in-progress"
                            ? "info"
                            : "neutral"
                      }
                    >
                      {status === "completed"
                        ? "Completed"
                        : status === "in-progress"
                          ? "In progress"
                          : "Not started"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

export function CaregiverJournal() {
  return (
    <Gate permission="journal" href={`${BASE}/journal`}>
      <JournalCard />
    </Gate>
  );
}

function JournalCard() {
  const { getNote, isPending } = useJourneyNotes();
  const written = JOURNEY_DAYS.filter((day) => getNote(day.slug).trim());
  return (
    <Card>
      <CardHeader
        title="Course notes"
        description="What they wrote during the 21-Day course."
      />
      {isPending ? (
        <Skeleton height={160} />
      ) : written.length === 0 ? (
        <EmptyState variant="bare" title="No notes written yet" />
      ) : (
        <ul className="mt-stack-md divide-y divide-line">
          {written.map((day) => (
            <li key={day.slug} className="py-stack-sm">
              <p className="text-label-md text-fg">
                Day {day.day} · {day.titleEn}
              </p>
              <p className="mt-stack-xs text-body-sm whitespace-pre-line text-fg-muted">
                {getNote(day.slug)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------- home cards */

export function NextTreatmentCard() {
  const { periods, isPending } = useDialysisSchedule();
  const current = periods[periods.length - 1];
  const todayIndex = (new Date().getDay() + 6) % 7;
  const next = [0, 1, 2, 3, 4, 5, 6]
    .map((offset) => WEEK[(todayIndex + offset) % 7])
    .find((day) => current?.days.includes(day));
  return (
    <KeyCard
      icon={<CalendarDays />}
      label="Next treatment day"
      value={isPending ? "…" : (next ?? "None set")}
      note={
        next && current.chairTimes[next]
          ? clock(current.chairTimes[next])
          : undefined
      }
    />
  );
}

export function ActiveMedicationsCard() {
  const { medications, isPending } = useMedications();
  return (
    <KeyCard
      icon={<Pill />}
      label="Active medications"
      value={
        isPending
          ? "…"
          : medications.filter((m) => m.status === "Active").length
      }
    />
  );
}

export function NextAppointmentCard() {
  const { appointments, isPending } = useAppointments();
  const next = upcoming(appointments, todayKey())[0];
  return (
    <KeyCard
      icon={<CalendarClock />}
      label="Next appointment"
      value={isPending ? "…" : next ? shortDate(next.date) : "None"}
      note={next ? next.title : undefined}
    />
  );
}

export function CourseProgressCard() {
  const { progress, isPending } = useJourneyProgress();
  const done = completedCount(progress);
  return (
    <KeyCard
      icon={<GraduationCap />}
      label="21-Day course"
      value={isPending ? "…" : `${done} / ${JOURNEY_DAYS.length}`}
      note="days completed"
    />
  );
}
