"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, Plane, Trash2, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import TravelChecklist from "@/features/travel/TravelChecklist";
import TimeChangeRequestModal from "@/features/travel/TimeChangeRequestModal";
import TravelTreatmentLog from "@/features/travel/TravelTreatmentLog";
import {
  ConfirmedTreatmentPanel,
  RequestStatusPanel,
  TravelReflectionsPanel,
} from "@/features/travel/TravelPanels";
import {
  canRequestTimeChange,
  destinationLabel,
  formatEventTime,
  formatTripDates,
  hasOpenTimeChange,
  statusLabel,
  tripPhase,
} from "@/features/travel/trip.rules";
import { useTrips } from "@/features/travel/useTrips";
import { NoticeRailLayout } from "@/components/layout/NoticeRailLayout";
import {
  Alert,
  AsyncSection,
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  SectionTitle,
  Skeleton,
  TabPanel,
  Tabs,
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

type TripTab = "info" | "log";

export default function TripDetailPage() {
  const params = useParams<{ tripId: string }>();
  const tripId = typeof params?.tripId === "string" ? params.tripId : "";

  const { language } = useLanguage();
  const isEs = language === "ES";

  const {
    trips,
    setDocuments,
    setPrep,
    requestTimeChange,
    withdrawTimeChange,
    cancel,
    isPending,
    error,
    refetch,
    isSaving,
  } = useTrips();
  const trip = trips.find((entry) => entry.id === tripId);

  const router = useRouter();
  const [askingTimeChange, setAskingTimeChange] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [tab, setTab] = useState<TripTab>("info");

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
            {/* The trip and what the clinic said about it, side by side. */}
            <div className="grid grid-cols-1 gap-inset-lg lg:grid-cols-2">
              <Card as="section" padding="small" className="h-full">
                <div className="flex flex-col gap-stack-sm">
                  <div className="min-w-0">
                    {/* The status sits on the name's line, at the right. */}
                    <div className="flex flex-wrap items-center justify-between gap-inline-md">
                      <h1 className="text-heading-4 text-fg">
                        {destinationLabel(trip) ||
                          (isEs ? "Sin destino" : "No destination")}
                      </h1>
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
                    </div>
                    <p className="mt-stack-xs text-body-sm text-fg-muted">
                      {formatTripDates(trip, isEs)}
                      {" · "}
                      {isEs
                        ? `${trip.treatmentsNeeded} tratamiento(s)`
                        : `${trip.treatmentsNeeded} treatment${trip.treatmentsNeeded === 1 ? "" : "s"}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-inline-md">
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

                    {/* Cancelling lives here rather than on the trip card, where
                      a stray tap on a list is too easy. */}
                    {tripPhase(trip) === "home" ? null : (
                      <Button
                        size="small"
                        variant="danger"
                        appearance="stroke"
                        onClick={() => setConfirmingCancel(true)}
                      >
                        <Trash2
                          aria-hidden="true"
                          className="size-4 shrink-0"
                        />
                        {isEs ? "Cancelar viaje" : "Cancel trip"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {trip.facilityNote.trim() ? (
                <Card as="section" padding="small" className="h-full">
                  <SectionTitle
                    as="h2"
                    title={isEs ? "De tu clínica" : "From your clinic"}
                  />
                  <p className="mt-stack-xs text-body-md text-fg-secondary">
                    {trip.facilityNote}
                  </p>
                </Card>
              ) : null}
            </div>

            <Tabs<TripTab>
              variant="pill"
              label={isEs ? "Secciones del viaje" : "Trip sections"}
              value={tab}
              onChange={setTab}
              items={[
                { id: "info", label: isEs ? "Información" : "Info" },
                {
                  id: "log",
                  label: isEs ? "Registro de diálisis" : "Dialysis Log",
                },
              ]}
            />

            <TabPanel id="info" value={tab}>
              {/* Where the request has got to sits in the right-hand column,
                the same place other pages keep their notices. */}
              <NoticeRailLayout
                fullWidth
                notices={<RequestStatusPanel trip={trip} />}
              >
                <div className="space-y-stack-lg">
                  <ConfirmedTreatmentPanel trip={trip} />

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
                          {isEs
                            ? "Retirar la solicitud"
                            : "Withdraw the request"}
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

                  {/* Stretched rows: the notes panel matches the checklist. */}
                  <div className="grid grid-cols-1 gap-inset-lg lg:grid-cols-2">
                    <TravelChecklist
                      trip={trip}
                      onToggleDocument={(next) => setDocuments(trip.id, next)}
                      onTogglePrep={(next) => setPrep(trip.id, next)}
                    />
                    <TravelReflectionsPanel trip={trip} />
                  </div>
                </div>
              </NoticeRailLayout>
            </TabPanel>

            {/* Across the whole page: ten columns need the room. */}
            <TabPanel id="log" value={tab}>
              <TravelTreatmentLog trip={trip} />
            </TabPanel>
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

      {confirmingCancel && trip ? (
        <Modal
          open
          size="small"
          closeOnBackdrop={false}
          onClose={() => setConfirmingCancel(false)}
          title={isEs ? "¿Cancelar este viaje?" : "Cancel this trip?"}
          description={
            isEs
              ? `Tu solicitud para ${destinationLabel(trip)} se eliminará. Si tu clínica ya está trabajando en ella, avísales.`
              : `Your request for ${destinationLabel(trip)} will be removed. If your clinic is already working on it, let them know.`
          }
          footer={
            <div className="flex flex-wrap items-center justify-end gap-inline-md">
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setConfirmingCancel(false)}
              >
                {isEs ? "Conservar" : "Keep it"}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  cancel(trip.id);
                  setConfirmingCancel(false);
                  router.push("/dashboard/travel-log");
                }}
              >
                {isEs ? "Cancelar viaje" : "Cancel trip"}
              </Button>
            </div>
          }
        />
      ) : null}
    </div>
  );
}
