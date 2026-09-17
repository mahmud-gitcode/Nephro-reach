"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import {
  Activity,
  CalendarCheck,
  Apple,
  FileText,
  HeartPulse,
  Mail,
  Notebook,
  Pill,
  Plus,
  User,
} from "lucide-react";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import { NoticeRailLayout } from "@/components/layout/NoticeRailLayout";
import {
  Badge,
  Button,
  buttonStyles,
  Card,
  EmptyState,
  Input,
} from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type LogTileConfig = {
  key: string;
  icon: IconType;
  /* Category colours come from the primitive ramps rather than the semantic
     status tokens: "Blood Pressure" is a category, not an error, and reusing
     --danger for it would break the rule that semantic colours are reserved.
     A proper categorical palette is still owed — these four ramps are simply
     the distinct hues currently available. */
  iconClass: string;
  iconBg: string;
  href: string;
};

const tileConfigs: LogTileConfig[] = [
  {
    key: "appointments",
    icon: User,
    iconClass: "text-success-700",
    iconBg: "bg-success-100",
    href: "/dashboard/personal-log/appointments",
  },
  {
    key: "medications",
    icon: Pill,
    iconClass: "text-brand-700",
    iconBg: "bg-brand-100",
    href: "/dashboard/personal-log/medications",
  },
  {
    key: "bloodPressure",
    icon: HeartPulse,
    iconClass: "text-danger-700",
    iconBg: "bg-danger-100",
    href: "/dashboard/personal-log/blood-pressure",
  },
  {
    key: "myLabs",
    icon: FileText,
    iconClass: "text-accent-700",
    iconBg: "bg-accent-100",
    href: "/dashboard/personal-log/lab-tracking",
  },
  {
    key: "nutrition",
    icon: Apple,
    iconClass: "text-success-700",
    iconBg: "bg-success-100",
    href: "/dashboard/personal-log/nutrition",
  },
  {
    key: "fluidTracker",
    icon: Activity,
    iconClass: "text-brand-700",
    iconBg: "bg-brand-100",
    href: "/dashboard/personal-log/fluid-tracker",
  },
  {
    key: "dialysisTreatment",
    icon: Activity,
    iconClass: "text-brand-700",
    iconBg: "bg-brand-100",
    href: "/dashboard/personal-log/dialysis-treatment",
  },
  {
    key: "betweenTreatment",
    icon: CalendarCheck,
    iconClass: "text-accent-700",
    iconBg: "bg-accent-100",
    href: "/dashboard/beyond-the-chair",
  },
  {
    key: "dialysisJournal",
    icon: Notebook,
    iconClass: "text-brand-700",
    iconBg: "bg-brand-100",
    href: "/dashboard/personal-log/dialysis-management",
  },
];

function UpcomingAppointments() {
  const { t } = useLanguage();

  return (
    <Card
      tone="default"
      as="section"
      className="space-y-stack-md border border-line bg-white shadow-card"
    >
      <div className="flex items-center justify-between gap-inline-lg">
        <h2 className="text-heading-4 text-fg">
          {t("personalLogHub.upcoming.title")}
        </h2>
        <Link
          href="/dashboard/personal-log/appointments"
          className={buttonStyles({
            variant: "neutral",
            appearance: "fill-stroke",
            size: "small",
          })}
        >
          {t("personalLogHub.upcoming.viewAll")}
        </Link>
      </div>

      <Card tone="sunken" padding="none">
        <EmptyState variant="bare" title={t("personalLogHub.upcoming.empty")} />
      </Card>
    </Card>
  );
}

function HealthcareTeam() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [clinicians, setClinicians] = useState<string[]>([]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setClinicians((prev) => [...prev, email.trim()]);
      setEmail("");
    }
  };

  return (
    <Card
      tone="default"
      as="section"
      className="space-y-stack-md border border-line bg-white shadow-card"
    >
      <div>
        <h2 className="text-heading-4 text-fg">
          {t("personalLogHub.team.title")}
        </h2>
      </div>

      <form onSubmit={handleAdd} className="flex gap-inline-md">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("personalLogHub.team.placeholder")}
          leadingIcon={<Mail />}
          aria-label={t("personalLogHub.team.title")}
          className="flex-1"
        />
        <Button type="submit" leadingIcon={<Plus />}>
          {t("personalLogHub.team.add")}
        </Button>
      </form>

      <p className="text-body-xs text-fg-muted">
        {t("personalLogHub.team.note")}
      </p>

      <Card padding="none" className="border border-line-subtle bg-white">
        {clinicians.length === 0 ? (
          <EmptyState variant="bare" title={t("personalLogHub.team.empty")} />
        ) : (
          <ul className="divide-y divide-line-subtle">
            {clinicians.map((c, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-inline-lg px-inset-md py-inset-sm"
              >
                <span className="text-body-sm text-fg">{c}</span>
                <Badge tone="info">{t("personalLogHub.team.invited")}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Card>
  );
}

export default function PersonalLogPage() {
  const { t } = useLanguage();

  return (
    <NoticeRailLayout
      title={<PageTitle href="/dashboard/personal-log" />}
      notices={<PersonalLogDisclaimer spaced={false} stacked />}
    >
      <div className="w-full space-y-stack-xl">
        <section className="grid grid-cols-1 gap-inline-lg sm:grid-cols-2 xl:grid-cols-4">
          {tileConfigs.map((tile) => (
            <Link
              key={tile.key}
              href={tile.href}
              className="flex flex-col items-center justify-center rounded-card border border-line bg-surface px-inset-md py-inset-lg transition-all duration-150 ease-standard hover:-translate-y-0.5 hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span
                className={`mb-stack-md flex h-12 w-12 items-center justify-center rounded-pill ${tile.iconBg}`}
              >
                <tile.icon
                  className={`h-icon-big w-icon-big ${tile.iconClass}`}
                />
              </span>
              <span className="text-center text-heading-5 text-fg">
                {t(`personalLogHub.tiles.${tile.key}`)}
              </span>
            </Link>
          ))}
        </section>

        <div className="space-y-stack-xl">
          <UpcomingAppointments />
          <HealthcareTeam />
        </div>
      </div>
    </NoticeRailLayout>
  );
}
