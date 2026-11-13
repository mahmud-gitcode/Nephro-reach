"use client";

import React from "react";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  BarChart3,
  Building2,
  CircleDollarSign,
  FileSignature,
  LifeBuoy,
  MessageCircle,
  Stethoscope,
  Users,
} from "lucide-react";

import type { DonutSegment } from "@/components/ui";
import {
  Card,
  ChartLegend,
  DonutChart,
  EmptyState,
  ErrorState,
  Skeleton,
} from "@/components/ui";
import {
  canRetry,
  errorMessageFor,
  errorTitleFor,
  isNotShared,
} from "@/lib/data/asyncState";
import { audienceLabelFor } from "@/features/billing/platformPlans.mappers";
import { useLanguage } from "@/context/LanguageContext";
import {
  readRate,
  useNotificationAnalytics,
  usePlatformOverview,
} from "@/features/admin/usePlatformOverview";

/* ==========================================================================
   NephroReach admin dashboard (Phase 14.9)
   --------------------------------------------------------------------------
   Only widgets with a server source show numbers:
   - `/platform/reports/overview` (members READ): members, active
     subscriptions, organizations by type, active contracts, open support
     tickets;
   - `/platform/notifications/analytics` (campaigns READ): the read rate of
     the last 30 days of notifications (READ / all; it is not a reply rate).
   A widget the role cannot read says "no access"; a failed read says so
   with a retry; neither ever shows a zero. Every other panel of the
   prototype (revenue, ER visits, health-log usage, confidence, education
   and engagement donuts, recent activity, earnings) has no server source
   yet: the panel stays and says "not available yet". The sample numbers
   and the member names of the old activity feed are gone.
   ========================================================================== */

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const NOT_AVAILABLE = "Not available yet";
const NOT_AVAILABLE_DETAIL =
  "NephroReach does not report this yet, so no number is shown.";
const NOT_AVAILABLE_ES = "Aún no disponible";
const NOT_AVAILABLE_DETAIL_ES =
  "NephroReach todavía no informa este dato, así que no se muestra ningún número.";

function useIsEs(): boolean {
  const { language } = useLanguage();
  return language === "ES";
}

type Read = { isPending: boolean; error: unknown };

function MetricValue({
  read,
  children,
}: {
  read: Read | null;
  children?: () => React.ReactNode;
}) {
  const isEs = useIsEs();
  if (!read)
    return (
      <p className="text-body-sm text-fg-muted">
        {isEs ? NOT_AVAILABLE_ES : NOT_AVAILABLE}
      </p>
    );
  if (read.error)
    return (
      <p className="text-body-sm text-fg-muted">
        {isNotShared(read.error)
          ? isEs
            ? "Sin acceso"
            : "No access"
          : isEs
            ? "No se cargó"
            : "Did not load"}
      </p>
    );
  if (read.isPending) return <Skeleton height={28} width={80} />;
  return <p className="text-metric-sm text-fg">{children?.()}</p>;
}

function MetricCard({
  title,
  icon: Icon,
  tone,
  iconTone,
  read,
  value,
  note,
}: {
  title: string;
  icon: IconType;
  tone: string;
  iconTone: string;
  /** null: the metric has no source yet. */
  read: Read | null;
  value?: () => React.ReactNode;
  note?: string;
}) {
  return (
    <Card as="article" padding="small" className="min-h-[114px]">
      <div className="mb-stack-lg flex items-start justify-between gap-inline-lg">
        <p className="text-caption text-fg-muted">{title}</p>
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 items-center justify-center rounded-control ${tone}`}
        >
          <Icon className={`h-5 w-5 ${iconTone}`} />
        </span>
      </div>
      <MetricValue read={read}>{value}</MetricValue>
      {note && read && !read.error && !read.isPending ? (
        <p className="mt-stack-xs text-caption text-fg-muted">{note}</p>
      ) : null}
    </Card>
  );
}

/** A prototype panel with no server source: kept in its place, honest. */
function UnavailablePanel({ title }: { title: string }) {
  const isEs = useIsEs();
  return (
    <Card as="section" padding="small">
      <h2 className="mb-stack-lg text-heading-4 text-fg">{title}</h2>
      <EmptyState
        variant="bare"
        title={isEs ? NOT_AVAILABLE_ES : NOT_AVAILABLE}
        description={isEs ? NOT_AVAILABLE_DETAIL_ES : NOT_AVAILABLE_DETAIL}
      />
    </Card>
  );
}

function OrganizationsPanel() {
  const isEs = useIsEs();
  const locale = isEs ? "es-US" : undefined;
  const overview = usePlatformOverview();
  const byType = new Map<string, number>();
  for (const row of overview.data?.organizations ?? []) {
    if (row.type === "PLATFORM") continue;
    byType.set(row.type, (byType.get(row.type) ?? 0) + row.count);
  }
  const tones = ["cat-6", "cat-2", "cat-5", "cat-4", "cat-1"] as const;
  const segments: DonutSegment[] = [...byType.entries()].map(
    ([type, value], i) => ({
      label: audienceLabelFor(type, isEs),
      value,
      tone: tones[i % tones.length],
    }),
  );
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let body: React.ReactNode;
  if (overview.error) {
    body = (
      <ErrorState
        variant="bare"
        error={overview.error}
        title={errorTitleFor(
          overview.error,
          isEs
            ? "Las organizaciones no se cargaron"
            : "The organizations did not load",
          isEs ? "es" : "en",
        )}
        message={errorMessageFor(overview.error, undefined, isEs ? "es" : "en")}
        onRetry={canRetry(overview.error) ? overview.refetch : undefined}
      />
    );
  } else if (overview.isPending) {
    body = <Skeleton height={200} />;
  } else if (total === 0) {
    body = (
      <EmptyState
        variant="bare"
        title={isEs ? "Aún no hay organizaciones" : "No organizations yet"}
        description={
          isEs
            ? "Los consultorios aparecen aquí una vez creados."
            : "Offices appear here once they are created."
        }
      />
    );
  } else {
    body = (
      <div className="grid items-center gap-inset-lg sm:grid-cols-[200px_minmax(0,1fr)]">
        <DonutChart
          segments={segments}
          label={isEs ? "Organizaciones por tipo" : "Organizations by type"}
          size={200}
          thickness={41}
          centerValue={String(total)}
          centerLabel="Total"
          className="mx-auto"
        />
        <ChartLegend
          items={segments.map((segment) => ({
            label: segment.label,
            tone: segment.tone ?? "cat-1",
            value: segment.value.toLocaleString(locale),
          }))}
        />
      </div>
    );
  }

  return (
    <Card as="section" padding="small">
      <h2 className="mb-6 text-heading-4 text-fg">
        {isEs ? "Organizaciones" : "Organizations"}
      </h2>
      {body}
    </Card>
  );
}

export default function AdminDashboard() {
  const isEs = useIsEs();
  const locale = isEs ? "es-US" : undefined;
  const overview = usePlatformOverview();
  const analytics = useNotificationAnalytics();
  const subs = (key: string) =>
    overview.data?.memberSubscriptionsByStatus.find((row) => row.key === key)
      ?.count ?? 0;
  const rate = analytics.data ? readRate(analytics.data) : null;

  return (
    <>
      {/* The page named on screen, as on every dashboard (client review,
          2026-10-08). */}
      <PageTitle href="/dashboard" className="mb-4" />
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2">
        <MetricCard
          title={isEs ? "Total de miembros" : "Total Members"}
          icon={Users}
          tone="bg-cat-5-soft"
          iconTone="text-cat-5"
          read={overview}
          value={() => overview.data!.members.toLocaleString(locale)}
        />
        <MetricCard
          title={isEs ? "Ingresos mensuales" : "Monthly Revenue"}
          icon={BarChart3}
          tone="bg-cat-4-soft"
          iconTone="text-cat-4"
          read={null}
        />
        <MetricCard
          title={
            isEs
              ? "Tasa de lectura de notificaciones (30 días)"
              : "Notification Read Rate (30 days)"
          }
          icon={MessageCircle}
          tone="bg-cat-3-soft"
          iconTone="text-cat-3"
          read={analytics}
          value={() => (rate === null ? "—" : `${Math.round(rate * 100)}%`)}
          note={
            analytics.data
              ? isEs
                ? `${analytics.data.total.toLocaleString(locale)} notificaciones`
                : `${analytics.data.total.toLocaleString()} notifications`
              : undefined
          }
        />
        <MetricCard
          title={isEs ? "Suscripciones activas" : "Active Subscriptions"}
          icon={CircleDollarSign}
          tone="bg-cat-7-soft"
          iconTone="text-cat-7"
          read={overview}
          value={() => subs("ACTIVE").toLocaleString(locale)}
          note={
            overview.data
              ? isEs
                ? `${subs("TRIALING").toLocaleString(locale)} más en prueba`
                : `${subs("TRIALING").toLocaleString()} more in a trial`
              : undefined
          }
        />
        <MetricCard
          title={isEs ? "Visitas a urgencias" : "ER visits"}
          icon={Stethoscope}
          tone="bg-cat-2-soft"
          iconTone="text-cat-2"
          read={null}
        />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
        <OrganizationsPanel />
        <MetricCard
          title={isEs ? "Contratos activos" : "Active Contracts"}
          icon={FileSignature}
          tone="bg-cat-6-soft"
          iconTone="text-cat-6"
          read={overview}
          value={() => overview.data!.activeContracts.toLocaleString(locale)}
        />
        <MetricCard
          title={
            isEs ? "Solicitudes de soporte abiertas" : "Open Support Tickets"
          }
          icon={LifeBuoy}
          tone="bg-cat-1-soft"
          iconTone="text-cat-1"
          read={overview}
          value={() => overview.data!.openSupportTickets.toLocaleString(locale)}
        />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.76fr)]">
        <UnavailablePanel
          title={isEs ? "Uso del registro de salud" : "Health Log Usage"}
        />
        <UnavailablePanel
          title={
            isEs
              ? "Mejora en conocimiento y confianza"
              : "Knowledge & Confidence Improvement"
          }
        />
      </section>

      <section className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)]">
        <div className="space-y-3">
          <UnavailablePanel
            title={isEs ? "Participación en educación" : "Education Engagement"}
          />
          <UnavailablePanel
            title={isEs ? "Actividad reciente" : "Recent Activity"}
          />
        </div>

        <div className="space-y-5">
          <UnavailablePanel
            title={isEs ? "Nivel de participación" : "Engagement Level"}
          />
          <UnavailablePanel
            title={isEs ? "Resumen de ingresos" : "Earnings Overview"}
          />
        </div>
      </section>
      <p className="mt-stack-md flex items-center gap-inline-sm text-caption text-fg-muted">
        <Building2 aria-hidden="true" className="h-4 w-4" />
        {isEs
          ? "Las cifras provienen del servidor de NephroReach; los paneles sin fuente lo indican en lugar de mostrar un número."
          : "Figures come from the NephroReach server; panels without a source say so instead of showing a number."}
      </p>
    </>
  );
}
