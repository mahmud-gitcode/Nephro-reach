"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ChevronRight,
  Clock3,
  LocateFixed,
  MapPin,
  Plus,
  Calendar,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import { Button, Card, FormField, Input, Modal } from "@/components/ui";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";

interface AppointmentItem {
  id: string;
  monthEn: string;
  monthEs: string;
  day: string;
  weekdayEn: string;
  weekdayEs: string;
  titleKey?: string;
  customTitle?: string;
  doctor: string;
  time: string;
  locationKey?: string;
  customLocation?: string;
  reminderTime: string;
  reminderPlace: string;
}

const INITIAL_APPOINTMENTS: AppointmentItem[] = [
  {
    id: "1",
    monthEn: "May",
    monthEs: "May",
    day: "12",
    weekdayEn: "Fri",
    weekdayEs: "Vie",
    titleKey: "sampleSpecialty",
    doctor: "Dr. Niro mia",
    time: "10:30 AM - 11:15 AM",
    locationKey: "sampleCenter",
    reminderTime: "10:00 AM",
    reminderPlace: "Zik Center",
  },
  {
    id: "2",
    monthEn: "May",
    monthEs: "May",
    day: "19",
    weekdayEn: "Fri",
    weekdayEs: "Vie",
    titleKey: "sampleSpecialty",
    doctor: "Dr. Niro mia",
    time: "10:30 AM - 11:15 AM",
    locationKey: "sampleCenter",
    reminderTime: "10:00 AM",
    reminderPlace: "Zik Center",
  },
  {
    id: "3",
    monthEn: "May",
    monthEs: "May",
    day: "26",
    weekdayEn: "Fri",
    weekdayEs: "Vie",
    titleKey: "sampleSpecialty",
    doctor: "Dr. Niro mia",
    time: "10:30 AM - 11:15 AM",
    locationKey: "sampleCenter",
    reminderTime: "10:00 AM",
    reminderPlace: "Zik Center",
  },
];

function DateBadge({
  month,
  day,
  weekday,
}: {
  month: string;
  day: string;
  weekday: string;
}) {
  return (
    <div className="flex w-[78px] shrink-0 flex-col items-center gap-stack-sm rounded-card border border-line bg-surface-sunken px-inset-md py-inset-md text-center text-fg-secondary">
      <p className="text-overline">{month}</p>
      <p className="text-metric-md text-fg">{day}</p>
      <p className="text-label-md">{weekday}</p>
    </div>
  );
}

function IconText({
  icon,
  children,
  primary,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <div className="flex items-center gap-inline-md text-body-md">
      <span
        aria-hidden="true"
        className="text-fg-muted [&_svg]:h-icon-small [&_svg]:w-icon-small"
      >
        {icon}
      </span>
      <span className={primary ? "text-fg-brand" : "text-fg"}>{children}</span>
    </div>
  );
}

function AppointmentRow({ appointment }: { appointment: AppointmentItem }) {
  const { language, t } = useLanguage();

  const month = language === "ES" ? appointment.monthEs : appointment.monthEn;
  const weekday =
    language === "ES" ? appointment.weekdayEs : appointment.weekdayEn;
  const title = appointment.titleKey
    ? t(`appointments.${appointment.titleKey}`)
    : appointment.customTitle || "Nephrology";
  const location = appointment.locationKey
    ? t(`appointments.${appointment.locationKey}`)
    : appointment.customLocation || "Zik Center";

  return (
    <article className="flex flex-col gap-inline-lg border-b border-line-subtle bg-surface p-inset-sm last:border-b-0 sm:flex-row sm:items-center">
      <DateBadge month={month} day={appointment.day} weekday={weekday} />

      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-heading-4 text-fg">{title}</h3>
          <p className="mt-0.5 text-body-md text-fg-muted">
            {appointment.doctor}
          </p>
          <div className="mt-6 space-y-stack-xs">
            <IconText icon={<Clock3 className="h-5 w-5" />}>
              {appointment.time}
            </IconText>
            <IconText icon={<MapPin className="h-5 w-5" />} primary>
              {location}
            </IconText>
          </div>
        </div>

        <div className="shrink-0">
          <p className="text-heading-5 text-fg">{t("appointments.reminder")}</p>
          <div className="mt-stack-sm space-y-stack-xs">
            <IconText icon={<Clock3 className="h-5 w-5" />}>
              {appointment.reminderTime}
            </IconText>
            <IconText icon={<MapPin className="h-5 w-5" />}>
              {appointment.reminderPlace}
            </IconText>
          </div>
        </div>
      </div>

      <Button
        {...notBuiltYet("Appointment details")}
        iconOnly
        size="small"
        variant="neutral"
        appearance="stroke"
        aria-label={t("appointments.openDetails").replace("{title}", title)}
      >
        <ChevronRight />
      </Button>
    </article>
  );
}

function UpcomingAppointments({ items }: { items: AppointmentItem[] }) {
  const { t } = useLanguage();

  return (
    <Card
      as="section"
      tone="default"
      padding="small"
      className="border border-line bg-white shadow-card"
    >
      <h2 className="px-inset-xs pt-inset-xs text-heading-4 text-fg">
        {t("appointments.upcomingTitle")}
      </h2>
      <Card padding="none" className="mt-6 overflow-hidden">
        {items.map((appointment) => (
          <AppointmentRow key={appointment.id} appointment={appointment} />
        ))}
      </Card>
      <div className="mt-stack-md">
        <Button
          {...notBuiltYet("The full appointment list")}
          variant="primary"
          appearance="stroke"
          fullWidth
        >
          {t("appointments.viewAll")}
        </Button>
      </div>
    </Card>
  );
}

function NextAppointment() {
  const { language, t } = useLanguage();

  return (
    <Card
      as="section"
      tone="default"
      padding="small"
      className="border border-line bg-white shadow-card"
    >
      <h2 className="px-inset-xs pt-inset-xs text-heading-4 text-fg">
        {t("appointments.nextTitle")}
      </h2>

      <Card padding="small" className="mt-6">
        <div className="flex flex-col gap-inline-lg sm:flex-row sm:items-start">
          <div className="flex shrink-0 items-center gap-inline-md px-inset-md py-inset-md text-fg-secondary">
            <p className="text-metric-xl text-fg">12</p>
            <div className="text-label-lg">
              <p>{language === "ES" ? "MAY" : "MAY"}</p>
              <p>{language === "ES" ? "Vie" : "Fri"}</p>
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="text-heading-4 text-fg">
              {t("appointments.sampleSpecialty")}
            </h3>
            <p className="mt-0.5 text-body-md text-fg-muted">Dr. Niro mia</p>
            <IconText icon={<Clock3 className="h-5 w-5" />}>
              10:30 AM - 11:15 AM
            </IconText>
            <IconText icon={<MapPin className="h-5 w-5" />} primary>
              {t("appointments.sampleCenter")}
            </IconText>
          </div>
        </div>

        <div className="mt-stack-md space-y-stack-md">
          <IconText icon={<Clock3 />}>10:30 AM - 11:15 AM</IconText>
          <div className="flex items-start gap-inline-md">
            <MapPin
              aria-hidden="true"
              className="mt-0.5 h-icon-big w-icon-big shrink-0 text-fg-brand"
            />
            <div>
              <p className="text-label-lg text-fg-brand">
                {t("appointments.kidneyCareCenter")}
              </p>
              <p className="mt-stack-sm text-body-md text-fg-secondary">
                {t("appointments.addressLine1")}
                <br />
                {t("appointments.addressLine2")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-stack-lg">
          <Button
            fullWidth
            onClick={() => {
              window.open(
                "https://www.google.com/maps/search/?api=1&query=123+Health+way+suite+400+Atlanta+GA",
                "_blank",
              );
            }}
          >
            {t("appointments.getDirections")}
          </Button>
        </div>

        <div className="relative mt-stack-lg h-[247px] overflow-hidden rounded-panel border border-line-strong bg-surface-sunken">
          <Image
            src="/images/appointment-map.png"
            alt={t("appointments.mapAlt")}
            fill
            className="object-cover opacity-75"
            sizes="(min-width: 1280px) 395px, 100vw"
          />
          <LocateFixed
            aria-hidden="true"
            className="absolute top-[43%] left-[22%] h-8 w-8 text-danger"
          />
        </div>
      </Card>
    </Card>
  );
}

export default function AppointmentsPage() {
  const { t } = useLanguage();
  const [appointments, setAppointments] =
    useState<AppointmentItem[]>(INITIAL_APPOINTMENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [specialty, setSpecialty] = useState("");
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  function handleSaveAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!specialty.trim() || !doctor.trim()) return;

    let monthEn = "May";
    let monthEs = "May";
    let day = "15";
    let weekdayEn = "Mon";
    let weekdayEs = "Lun";

    if (date) {
      const parsed = new Date(date + "T00:00:00");
      if (!isNaN(parsed.getTime())) {
        /* "Sep", not "SEP": the app never sets text in capitals. */
        const title = (text: string) =>
          text.charAt(0).toUpperCase() + text.slice(1);
        monthEn = title(parsed.toLocaleString("en-US", { month: "short" }));
        monthEs = title(
          parsed.toLocaleString("es-ES", { month: "short" }).replace(".", ""),
        );
        day = String(parsed.getDate());
        weekdayEn = parsed.toLocaleString("en-US", { weekday: "short" });
        weekdayEs = parsed
          .toLocaleString("es-ES", { weekday: "short" })
          .replace(".", "");
      }
    }

    const newItem: AppointmentItem = {
      id: Date.now().toString(),
      monthEn,
      monthEs,
      day,
      weekdayEn,
      weekdayEs,
      customTitle: specialty,
      doctor,
      time: time.trim() || "10:30 AM - 11:15 AM",
      customLocation: location.trim() || "Kidney Care Center",
      reminderTime: "10:00 AM",
      reminderPlace: location.trim() || "Kidney Care Center",
    };

    setAppointments((prev) => [newItem, ...prev]);
    setIsModalOpen(false);
    setSpecialty("");
    setDoctor("");
    setDate("");
    setTime("");
    setLocation("");
  }

  return (
    <div className="space-y-stack-2xl">
      <PersonalLogDisclaimer />

      <header className="flex flex-col gap-inline-lg sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading-1 text-fg">{t("appointments.title")}</h1>
        </div>
        <Button onClick={() => setIsModalOpen(true)} leadingIcon={<Plus />}>
          {t("appointments.addAppointment")}
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-inline-lg lg:grid-cols-[minmax(0,1fr)_minmax(360px,447px)]">
        <UpcomingAppointments items={appointments} />
        <NextAppointment />
      </section>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <span className="flex items-center gap-inline-md">
            <Calendar
              aria-hidden="true"
              className="h-icon-big w-icon-big text-fg-brand"
            />
            {t("appointments.modalTitle")}
          </span>
        }
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setIsModalOpen(false)}
            >
              {t("appointments.cancel")}
            </Button>
            <Button type="submit" form="appointment-form">
              {t("appointments.save")}
            </Button>
          </>
        }
      >
        <form
          id="appointment-form"
          onSubmit={handleSaveAppointment}
          className="space-y-stack-lg"
        >
          <FormField label={t("appointments.specialtyLabel")} required>
            {(props) => (
              <Input
                {...props}
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder={t("appointments.specialtyPlaceholder")}
              />
            )}
          </FormField>

          <FormField label={t("appointments.doctorLabel")} required>
            {(props) => (
              <Input
                {...props}
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                placeholder={t("appointments.doctorPlaceholder")}
              />
            )}
          </FormField>

          <div className="grid grid-cols-1 gap-stack-lg sm:grid-cols-2">
            <FormField label={t("appointments.dateLabel")}>
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              )}
            </FormField>

            <FormField label={t("appointments.timeLabel")}>
              {(props) => (
                <Input
                  {...props}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder={t("appointments.timePlaceholder")}
                />
              )}
            </FormField>
          </div>

          <FormField label={t("appointments.locationLabel")}>
            {(props) => (
              <Input
                {...props}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("appointments.locationPlaceholder")}
              />
            )}
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
