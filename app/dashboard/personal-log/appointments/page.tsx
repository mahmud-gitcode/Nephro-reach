import React from "react";
import Image from "next/image";
import {
  AlertCircle,
  ChevronRight,
  Clock3,
  LocateFixed,
  MapPin,
  Plus,
} from "lucide-react";

const appointments = [
  {
    month: "MAY",
    day: "12",
    weekday: "Fri",
    title: "Nephrology",
    doctor: "Dr. Niro mia",
    time: "10:30AM - 11:15Am",
    location: "Zik Center",
    reminderTime: "Nephrology",
    reminderPlace: "Nephrology",
  },
  {
    month: "MAY",
    day: "12",
    weekday: "Fri",
    title: "Nephrology",
    doctor: "Dr. Niro mia",
    time: "10:30AM - 11:15Am",
    location: "Zik Center",
    reminderTime: "Nephrology",
    reminderPlace: "Nephrology",
  },
  {
    month: "MAY",
    day: "12",
    weekday: "Fri",
    title: "Nephrology",
    doctor: "Dr. Niro mia",
    time: "10:30AM - 11:15Am",
    location: "Zik Center",
    reminderTime: "Nephrology",
    reminderPlace: "Nephrology",
  },
];

function DateBadge({ month, day, weekday }: { month: string; day: string; weekday: string }) {
  return (
    <div className="flex w-[78px] shrink-0 flex-col items-center gap-2 rounded-xl border border-slate-200 bg-[#F1F5FA] px-4 py-[18px] text-center text-slate-500">
      <p className="text-2xl font-semibold leading-8 tracking-[0.12px]">{month}</p>
      <p className="text-[28px] font-extrabold leading-none">{day}</p>
      <p className="text-2xl font-normal leading-8 tracking-[0.12px]">{weekday}</p>
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
      <span className={primary ? "text-blue-600" : "text-slate-950"}>{children}</span>
    </div>
  );
}

function AppointmentRow({ appointment }: { appointment: (typeof appointments)[number] }) {
  return (
    <article className="flex flex-col gap-5 border-b border-slate-200 bg-white p-3.5 last:border-b-0 sm:flex-row sm:items-center">
      <DateBadge month={appointment.month} day={appointment.day} weekday={appointment.weekday} />

      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-[28px] font-medium leading-none text-slate-950 sm:text-[32px]">
            {appointment.title}
          </h3>
          <p className="mt-1 text-lg font-medium leading-7 tracking-[0.09px] text-slate-700">
            {appointment.doctor}
          </p>
          <div className="mt-1 space-y-1">
            <IconText icon={<Clock3 className="h-5 w-5" />}>{appointment.time}</IconText>
            <IconText icon={<MapPin className="h-5 w-5" />} primary>
              {appointment.location}
            </IconText>
          </div>
        </div>

        <div className="shrink-0">
          <p className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">Reminder</p>
          <div className="mt-1 space-y-1 text-slate-700">
            <IconText icon={<Clock3 className="h-5 w-5" />}>{appointment.reminderTime}</IconText>
            <IconText icon={<MapPin className="h-5 w-5" />}>{appointment.reminderPlace}</IconText>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-950 transition-colors hover:bg-slate-100"
        aria-label={`Open ${appointment.title} appointment details`}
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </article>
  );
}

function UpcomingAppointments() {
  return (
    <section className="rounded-[10px] border border-slate-200 bg-[#F1F5FA] p-3">
      <h2 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
        Upcoming Appointments
      </h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-[#E9EEF4] bg-white">
        {appointments.map((appointment, index) => (
          <AppointmentRow key={`${appointment.title}-${index}`} appointment={appointment} />
        ))}
      </div>
      <button
        type="button"
        className="mt-3 flex h-12 w-full items-center justify-center rounded border border-slate-200 bg-[#F9F9F9] px-4 text-base font-bold tracking-[0.08px] text-blue-600 transition-colors hover:bg-white"
      >
        View All Appointments
      </button>
    </section>
  );
}

function NextAppointment() {
  return (
    <section className="rounded-[10px] border border-slate-200 bg-[#F1F5FA] p-3">
      <h2 className="text-xl font-medium leading-7 tracking-[0.1px] text-slate-950">
        Next Appointment
      </h2>

      <div className="mt-3 rounded-xl border border-[#E9EEF4] bg-white p-3.5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-[18px] text-slate-500">
            <p className="text-[60px] font-semibold leading-none tracking-[0.3px]">12</p>
            <div className="text-2xl font-medium leading-8 tracking-[0.12px]">
              <p>SUN</p>
              <p>Fri</p>
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="text-[32px] font-medium leading-none text-slate-950">Nephrology</h3>
            <p className="mt-1 text-xl font-medium leading-7 tracking-[0.1px] text-slate-700">
              Dr. Niro mia
            </p>
            <IconText icon={<Clock3 className="h-5 w-5" />}>10:30AM - 11:15Am</IconText>
            <IconText icon={<MapPin className="h-5 w-5" />} primary>
              Zik Center
            </IconText>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          <IconText icon={<Clock3 className="h-5 w-5" />}>10:30 AM - 11:15 AM</IconText>
          <div className="flex items-start gap-2 text-xl font-medium leading-7 tracking-[0.1px]">
            <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-blue-600" />
            <div>
              <p className="text-blue-600">Kidney Care Center</p>
              <p className="mt-2 font-semibold text-slate-700">
                123 Health way, suite 400
                <br />
                ABana, GA 30309
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="mt-4 flex h-12 w-full items-center justify-center rounded bg-blue-600 px-4 text-base font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
        >
          Get Directions
        </button>

        <div className="relative mt-4 h-[247px] overflow-hidden rounded-[14px] border border-slate-300 bg-slate-100">
          <Image
            src="/images/appointment-map.png"
            alt="Map showing appointment location"
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
  return (
    <aside className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-3.5">
      <div className="flex gap-2">
        <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
        <div>
          <h2 className="text-lg font-medium leading-7 text-slate-950">Important Disclaimer</h2>
          <p className="mt-2 max-w-[760px] text-sm leading-5 text-slate-700">
            This tool is for education and tracking only. Always discuss lab results and treatment
            decisions with your nephrology provider.
          </p>
        </div>
      </div>
    </aside>
  );
}

export default function AppointmentsPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[32px] font-medium leading-none text-slate-950">
            Appointment Reminders
          </h1>
          <p className="mt-1 text-lg font-medium leading-7 tracking-[0.09px] text-slate-700">
            Never miss an important. We&apos;ll remind you and show you were to go.
          </p>
        </div>
        <button
          type="button"
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold tracking-[0.08px] text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Add Appointment
        </button>
      </header>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,633px)_minmax(360px,447px)]">
        <UpcomingAppointments />
        <NextAppointment />
      </section>

      <Disclaimer />
    </div>
  );
}
