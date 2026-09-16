"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Plane, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import TravelChecklist from "@/features/travel/TravelChecklist";
import TimeChangeRequestModal from "@/features/travel/TimeChangeRequestModal";
import TravelDocumentsPanel from "@/features/travel/TravelDocumentsPanel";
import TravelTreatmentLog from "@/features/travel/TravelTreatmentLog";
import {
  ConfirmedTreatmentPanel,
  RequestStatusPanel,
  TravelReflectionsPanel,
} from "@/features/travel/TravelPanels";
import {
  canRequestTimeChange,
  formatEventTime,
  formatTripDates,
  hasOpenTimeChange,
  statusLabel,
  tripPhase,
} from "@/features/travel/trip.rules";
import { useTrips } from "@/features/travel/useTrips";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  Card,
  EmptyState,
  Skeleton,
  buttonStyles,
} from "@/components/ui";

/* ==========================================================================
   One trip
   --------------------------------------------------------------------------
   Everything about a single trip, on its own page.

   These panels used to hang under the trip list on the travel screen, which
   meant choosing a card rewrote a page the member was not looking at. A trip
   has enough to say to fill a screen, so it gets one.
   ========================================================================== */

export default function TripDetailPage() {
  const params = useParams<{ tripId: string }>();
  const tripId = typeof params?.tripId === "string" ? params.tripId : "";

  const { language } = useLanguage();
  const isEs = language === "ES";

  const {
    trips,
    setDocuments,
    setPrep,
    attachFile,
    removeFile,
    requestTimeChange,
    withdrawTimeChange,
    isPending,
    error,
    refetch,
    isSaving,
  } = useTrips();
  const trip = trips.find((entry) => entry.id === tripId);

  const [askingTimeChange, setAskingTimeChange] = useState(false);

  return (
    <div className="space-y-stack-lg">
      <Link
        href="/dashboard/travel-log"
        className={buttonStyles({
          size: "small",
          variant: "neutral",
          appearance: "fill-stroke",
        })}
      >
        <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
        {isEs ? "Volver a tus viajes" : "Back to your trips"}
      </Link>

      <AsyncSection
        pending={isPending}
        error={error}
        onRetry={refetch}
        /* A trip id that is not in the log is missing, not broken — it may
           simply have been cancelled from another tab. */
        isEmpty={!trip}
        errorTitle={isEs ? "Este viaje no se cargó" : "This trip did not load"}
        skeleton={
          <Card className="flex flex-col gap-stack-md">
            <Skeleton height={72} />
            <Skeleton height={220} />
          </Card>
        }
        empty={
          <EmptyState
            icon={<Plane aria-hidden="true" />}
            title={
              isEs ? "No encontramos ese viaje" : "We could not find that trip"
            }
            description={
              isEs
                ? "Puede que se haya cancelado. Vuelve a tus viajes para ver los demás."
                : "It may have been cancelled. Head back to your trips to see the rest."
            }
            action={
              <Link href="/dashboard/travel-log" className={buttonStyles()}>
                {isEs ? "Ir a tus viajes" : "Go to your trips"}
              </Link>
            }
          />
        }
      >
        {trip ? (
          <div className="space-y-stack-lg">
            {/* Sticks under the dashboard top bar so the trip stays named
              while the panels below scroll past.

              The offsets are that bar's own height: 28px avatar + 2x10px
              padding + 1px border on mobile, 40px + 2x12px + 1px from `sm`
              up (DashboardShell, TopBar). `z-20` keeps it above the page and
              below that bar, which is `z-30`. */}
            <Card
              as="section"
              padding="small"
              className="sticky top-[49px] z-20 shadow-card sm:top-[65px]"
            >
              <div className="flex flex-wrap items-start justify-between gap-inline-md">
                <div className="min-w-0">
                  <h1 className="text-heading-4 text-fg">
                    {trip.destination ||
                      (isEs ? "Sin destino" : "No destination")}
                  </h1>
                  <p className="mt-stack-xs text-body-sm text-fg-muted">
                    {formatTripDates(trip, isEs)}
                    {" · "}
                    {isEs
                      ? `${trip.treatmentsNeeded} tratamiento(s)`
                      : `${trip.treatmentsNeeded} treatment${trip.treatmentsNeeded === 1 ? "" : "s"}`}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-inline-md">
                  <Badge
                    tone={
                      trip.status === "confirmed"
                        ? "success"
                        : tripPhase(trip) === "home"
                          ? "neutral"
                          : "info"
                    }
                  >
                    {statusLabel(trip.status, isEs)}
                  </Badge>

                  {/* Offered only once there are booked times to move. Before
                    that the request itself is still editable, and two ways to
                    change the same unconfirmed times is one too many. */}
                  {canRequestTimeChange(trip) && !hasOpenTimeChange(trip) ? (
                    <Button
                      size="small"
                      variant="neutral"
                      appearance="fill-stroke"
                      onClick={() => setAskingTimeChange(true)}
                    >
                      <Clock aria-hidden="true" className="size-4 shrink-0" />
                      {isEs ? "Pedir otro horario" : "Request a time change"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>

            {/* An open request, said once and kept visible: a member who has
              asked needs to know it is still only an ask, and that the times
              they already have still stand. */}
            {trip.timeChange && !trip.timeChange.resolvedAt ? (
              <Alert
                tone="info"
                title={
                  isEs
                    ? "Pediste cambiar el horario"
                    : "You asked to change the time"
                }
              >
                <div className="space-y-stack-sm">
                  <p className="text-body-sm text-fg-secondary">
                    {trip.timeChange.note}
                  </p>
                  <p className="text-body-sm text-fg-muted">
                    {isEs ? "Enviado el " : "Sent "}
                    {formatEventTime(trip.timeChange.requestedAt, isEs)}
                    {isEs
                      ? ". Tus horarios actuales siguen en pie hasta que tu clínica responda."
                      : ". Your current times stand until your clinic answers."}
                  </p>
                  <Button
                    size="small"
                    variant="neutral"
                    appearance="stroke"
                    onClick={() => withdrawTimeChange(trip.id)}
                    disabled={isSaving}
                  >
                    <X aria-hidden="true" className="size-4 shrink-0" />
                    {isEs ? "Retirar la solicitud" : "Withdraw the request"}
                  </Button>
                </div>
              </Alert>
            ) : null}

            {/* An answered one stays: it explains why the booked times are
              what they are. */}
            {trip.timeChange?.resolvedAt ? (
              <Alert
                tone="success"
                title={
                  isEs
                    ? "Tu clínica respondió sobre el horario"
                    : "Your clinic answered about the time"
                }
              >
                <p className="text-body-sm text-fg-secondary">
                  {trip.timeChange.facilityReply ||
                    (isEs
                      ? "Revisa los horarios confirmados abajo."
                      : "Check the confirmed times below.")}
                </p>
              </Alert>
            ) : null}

            {/* Below the sticky bar, not inside it: a paragraph that grows
              with what the clinic wrote would push the panels down the
              screen on every scroll. Labelled, because an unattributed
              paragraph reads as the app talking. */}
            {trip.facilityNote.trim() ? (
              <Card as="section" padding="small">
                <p className="text-caption text-fg-muted">
                  {isEs ? "De tu clínica" : "From your clinic"}
                </p>
                <p className="mt-stack-xs text-body-sm text-fg-secondary">
                  {trip.facilityNote}
                </p>
              </Card>
            ) : null}

            {/* Two independent columns: a grid locks the height of a row, so
              a tall panel on one side opens dead space under a short one. */}
            <div className="grid grid-cols-1 items-start gap-inset-lg lg:grid-cols-2">
              <div className="flex flex-col gap-inset-lg">
                <TravelChecklist
                  trip={trip}
                  onToggleDocument={(next) => setDocuments(trip.id, next)}
                  onTogglePrep={(next) => setPrep(trip.id, next)}
                />
                <RequestStatusPanel trip={trip} />
              </div>

              <div className="flex flex-col gap-inset-lg">
                <TravelDocumentsPanel
                  trip={trip}
                  onAttach={(file) => attachFile(trip.id, file)}
                  onRemoveFile={(fileId) => removeFile(trip.id, fileId)}
                />
                <ConfirmedTreatmentPanel trip={trip} />
              </div>
            </div>

            {/* Full width: ten columns will not survive being halved. */}
            <TravelTreatmentLog trip={trip} />

            <TravelReflectionsPanel trip={trip} />
          </div>
        ) : null}
      </AsyncSection>

      {askingTimeChange && trip ? (
        <TimeChangeRequestModal
          trip={trip}
          saving={isSaving}
          onCancel={() => setAskingTimeChange(false)}
          onSubmit={(request) => {
            requestTimeChange(trip.id, request);
            setAskingTimeChange(false);
          }}
        />
      ) : null}
    </div>
  );
}
