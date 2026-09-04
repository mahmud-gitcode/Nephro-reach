"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ChevronRight,
  Clock3,
  LocateFixed,
  MapPin,
  Plus,
  X,
  Calendar,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

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
    monthEn: "MAY",
    monthEs: "MAY",
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
    monthEn: "MAY",
    monthEs: "MAY",
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
    monthEn: "MAY",
    monthEs: "MAY",
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
    <div className="flex w-[78px] shrink-0 flex-col items-center gap-2 rounded-xl border border-slate-200 bg-[#F1F5FA] px-4 py-[18px] text-center text-slate-500">
      <p className="text-2xl font-semibold leading-8 tracking-[0.12px]">
        {month}
      </p>
      <p className="text-[28px] font-extrabold leading-none">{day}</p>
      <p className="text-2xl font-normal leading-8 tracking-[0.12px]">
        {weekday}
      </p>
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
    <div className="flex items-center gap-2 text-base font-medium leading-6 tracking-[0.08px] sm:text-lg sm:leading-7">
      <span className="text-slate-500">{icon}</span>
      <span className={primary ? "text-blue-600" : "text-slate-950"}>
        {children}
      </span>
    </div>
  );
}

function AppointmentRow({
  appointment,
}: {
  appointment: AppointmentItem;
}) {
  const { language, t } = useLanguage();

  const month = language === "ES" ? appointment.monthEs : appointment.monthEn;
  const weekday = language === "ES" ? appointment.weekdayEs : appointment.weekdayEn;
  const title = appointment.titleKey
    ? t(`appointments.${appointment.titleKey}`)
    : appointment.customTitle || "Nephrology";
  const location = appointment.locationKey
    ? t(`appointments.${appointment.locationKey}`)
    : appointment.customLocation || "Zik Center";

  return (
    <article className="flex flex-col gap-5 border-b border-slate-200 bg-white p-3.5 last:border-b-0 sm:flex-row sm:items-center">
      <DateBadge month={month} day={appointment.day} weekday={weekday} />

      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-[28px] font-medium leading-none text-slate-950 sm:text-[32px]">
            {title}
          </h3>
          <p className="mt-1 text-lg font-medium leading-7 tracking-[0.09px] text-slate-700">
            {appointment.doctor}
          </p>
          <div className="mt-1 space-y-1">
            <IconText icon={<Clock3 className="h-5 w-5" />}>
              {appointment.time}
            </IconText>
            <IconText icon={<MapPin className="h-5 w-5" />} primary>
              {location}
            </IconText>
          </div>
        </div>

        <div className="shrink-0">
          <p className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
            {t("appointments.reminder")}
          </p>
          <div className="mt-1 space-y-1 text-slate-700">
            <IconText icon={<Clock3 className="h-5 w-5" />}>
              {appointment.reminderTime}
            </IconText>
            <IconText icon={<MapPin className="h-5 w-5" />}>
              {appointment.reminderPlace}
            </IconText>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-950 transition-colors hover:bg-slate-100 cursor-pointer"
        aria-label={t("appointments.openDetails").replace("{title}", title)}
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </article>
  );
}

function UpcomingAppointments({
  items,
}: {
  items: AppointmentItem[];
}) {
  const { t } = useLanguage();

  return (
    <section className="rounded-[10px] border border-slate-200 bg-[#F1F5FA] p-3">
      <h2 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
        {t("appointments.upcomingTitle")}
      </h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-[#E9EEF4] bg-white">
        {items.map((appointment) => (
          <AppointmentRow key={appointment.id} appointment={appointment} />
        ))}
      </div>
      <button
        type="button"
        className="mt-3 flex h-12 w-full items-center justify-center rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold tracking-[0.08px] text-blue-600 transition-colors hover:bg-white cursor-pointer"
      >
        {t("appointments.viewAll")}
      </button>
    </section>
  );
}

function NextAppointment() {
  const { language, t } = useLanguage();

  return (
    <section className="rounded-[10px] border border-slate-200 bg-[#F1F5FA] p-3">
      <h2 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
        {t("appointments.nextTitle")}
      </h2>

      <div className="mt-3 rounded-xl border border-[#E9EEF4] bg-white p-3.5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-[18px] text-slate-500">
            <p className="text-[60px] font-semibold leading-none tracking-[0.3px]">
              12
            </p>
            <div className="text-2xl font-medium leading-8 tracking-[0.12px]">
              <p>{language === "ES" ? "MAY" : "MAY"}</p>
              <p>{language === "ES" ? "Vie" : "Fri"}</p>
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="text-[32px] font-medium leading-none text-slate-950">
              {t("appointments.sampleSpecialty")}
            </h3>
            <p className="mt-1 text-xl font-medium leading-7 tracking-[0.1px] text-slate-700">
              Dr. Niro mia
            </p>
            <IconText icon={<Clock3 className="h-5 w-5" />}>
              10:30 AM - 11:15 AM
            </IconText>
            <IconText icon={<MapPin className="h-5 w-5" />} primary>
              {t("appointments.sampleCenter")}
            </IconText>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          <IconText icon={<Clock3 className="h-5 w-5" />}>
            10:30 AM - 11:15 AM
          </IconText>
          <div className="flex items-start gap-2 text-xl font-medium leading-7 tracking-[0.1px]">
            <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-blue-600" />
            <div>
              <p className="text-blue-600 font-bold">
                {t("appointments.kidneyCareCenter")}
              </p>
              <p className="mt-2 font-semibold text-slate-700">
                {t("appointments.addressLine1")}
                <br />
                {t("appointments.addressLine2")}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            window.open(
              "https://www.google.com/maps/search/?api=1&query=123+Health+way+suite+400+Atlanta+GA",
              "_blank",
            );
          }}
          className="mt-4 flex h-12 w-full items-center justify-center rounded bg-blue-600 px-4 text-base font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700 cursor-pointer"
        >
          {t("appointments.getDirections")}
        </button>

        <div className="relative mt-4 h-[247px] overflow-hidden rounded-[14px] border border-slate-300 bg-slate-100">
          <Image
            src="/images/appointment-map.png"
            alt={t("appointments.mapAlt")}
            fill
            className="object-cover opacity-75"
            sizes="(min-width: 1280px) 395px, 100vw"
          />
          <LocateFixed className="absolute left-[22%] top-[43%] h-8 w-8 text-rose-500" />
        </div>
      </div>
    </section>
  );
}

function Disclaimer() {
  const { t } = useLanguage();

  return (
    <aside className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-3.5">
      <div className="flex gap-2">
        <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
        <div>
          <h2 className="text-lg font-medium leading-7 text-slate-950">
            {t("appointments.disclaimerTitle")}
          </h2>
          <p className="mt-2 max-w-[760px] text-sm leading-5 text-slate-700">
            {t("appointments.disclaimerText")}
          </p>
        </div>
      </div>
    </aside>
  );
}

export default function AppointmentsPage() {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState<AppointmentItem[]>(INITIAL_APPOINTMENTS);
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

    let monthEn = "MAY";
    let monthEs = "MAY";
    let day = "15";
    let weekdayEn = "Mon";
    let weekdayEs = "Lun";

    if (date) {
      const parsed = new Date(date + "T00:00:00");
      if (!isNaN(parsed.getTime())) {
        monthEn = parsed.toLocaleString("en-US", { month: "short" }).toUpperCase();
        monthEs = parsed.toLocaleString("es-ES", { month: "short" }).toUpperCase().replace(".", "");
        day = String(parsed.getDate());
        weekdayEn = parsed.toLocaleString("en-US", { weekday: "short" });
        weekdayEs = parsed.toLocaleString("es-ES", { weekday: "short" }).replace(".", "");
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
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[32px] font-medium leading-none text-slate-950">
            {t("appointments.title")}
          </h1>
          <p className="mt-1 text-lg font-medium leading-7 tracking-[0.09px] text-slate-700">
            {t("appointments.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700 cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          {t("appointments.addAppointment")}
        </button>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,447px)]">
        <UpcomingAppointments items={appointments} />
        <NextAppointment />
      </section>

      <Disclaimer />

      {/* ADD APPOINTMENT MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-bold text-slate-900">
                  {t("appointments.modalTitle")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {t("appointments.specialtyLabel")} *
                </label>
                <input
                  type="text"
                  required
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder={t("appointments.specialtyPlaceholder")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {t("appointments.doctorLabel")} *
                </label>
                <input
                  type="text"
                  required
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  placeholder={t("appointments.doctorPlaceholder")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    {t("appointments.dateLabel")}
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    {t("appointments.timeLabel")}
                  </label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder={t("appointments.timePlaceholder")}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {t("appointments.locationLabel")}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("appointments.locationPlaceholder")}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {t("appointments.cancel")}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  {t("appointments.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
