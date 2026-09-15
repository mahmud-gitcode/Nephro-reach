"use client";

import React, { useState } from "react";
import { Plus, Car, ShieldAlert } from "lucide-react";
import {
  Alert,
  AsyncSection,
  Button,
  buttonStyles,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
  Skeleton,
} from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { useRides } from "@/features/travel/useRides";
import { RideContactCard } from "@/features/travel/RideContactCard";
import type { RideContact } from "@/features/travel/rides.types";

/* This screen is the first one moved onto the data layer, and it is the
   pattern for the rest: no storage calls in the component, the list comes
   from a hook, and the four states of a read — loading, failed, empty,
   loaded — are handed to AsyncSection in that order. */

/** Sized to the cards it stands in for, so the grid does not jump. */
function RidesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {[0, 1].map((index) => (
        <Card key={index} className="flex flex-col gap-stack-lg">
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" className="h-11 w-11" />
            <Skeleton variant="text" width="55%" />
          </div>
          <Skeleton variant="text" width="40%" />
          <Skeleton height={44} />
        </Card>
      ))}
    </div>
  );
}

type FormState = {
  name: string;
  phone: string;
  note: string;
  isPrimary: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  phone: "",
  note: "",
  isPrimary: false,
};

export default function MyRidesPage() {
  const { t } = useLanguage();
  const {
    rides,
    isPending,
    error,
    refetch,
    create,
    update,
    remove,
    isSaving,
    saveError,
    deleteError,
  } = useRides();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<RideContact | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, isPrimary: rides.length === 0 });
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (ride: RideContact) => {
    setEditingId(ride.id);
    setForm({
      name: ride.name,
      phone: ride.phone,
      note: ride.note ?? "",
      isPrimary: Boolean(ride.isPrimary),
    });
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormError("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError(t("myRides.errorName"));
      return;
    }
    if (!form.phone.trim()) {
      setFormError(t("myRides.errorPhone"));
      return;
    }
    setFormError("");

    const draft = {
      name: form.name,
      phone: form.phone,
      note: form.note,
      isPrimary: form.isPrimary,
    };

    /* The modal closes only once the write has landed. Closing on click
       would tell the member it saved before we know that it did. */
    if (editingId) {
      update.mutate({ id: editingId, draft }, { onSuccess: closeForm });
    } else {
      create.mutate(draft, { onSuccess: closeForm });
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    remove.mutate(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
    });
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-10">
      <div className="flex flex-col gap-inline-lg border-b border-line pb-inset-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-inline-lg">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-panel bg-primary-solid text-primary-on-solid shadow-card"
          >
            <Car className="h-icon-big w-icon-big" />
          </span>
          <h1 className="text-heading-1 text-fg">
            {t("myRides.sectionTitle") || "Where's My Ride"}
          </h1>
        </div>

        <Button onClick={openAdd} leadingIcon={<Plus />} disabled={isPending}>
          {t("myRides.addRide")}
        </Button>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-7 xl:col-span-7">
          {deleteError ? (
            <Alert
              tone="danger"
              title="That contact was not removed"
              onDismiss={() => remove.reset()}
            >
              {deleteError instanceof Error
                ? deleteError.message
                : "Please try again."}
            </Alert>
          ) : null}

          <AsyncSection
            pending={isPending}
            error={error}
            isEmpty={rides.length === 0}
            onRetry={refetch}
            errorTitle="Your saved rides did not load"
            skeleton={<RidesSkeleton />}
            empty={
              <EmptyState
                icon={<Car />}
                title={t("myRides.noRides")}
                description="Save phone numbers for your primary driver, family member, or medical transit service for fast, one-tap calling."
                action={
                  <Button onClick={openAdd} leadingIcon={<Plus />}>
                    {t("myRides.addFirstRide")}
                  </Button>
                }
              />
            }
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {rides.map((ride) => (
                <RideContactCard
                  key={ride.id}
                  ride={ride}
                  onEdit={() => openEdit(ride)}
                  onDelete={
                    rides.length > 1 ? () => setPendingDelete(ride) : undefined
                  }
                />
              ))}
            </div>
          </AsyncSection>
        </section>

        <section className="space-y-4 lg:col-span-5 xl:col-span-5">
          <Card className="space-y-stack-xl">
            <div className="border-b border-line-subtle pb-inset-sm">
              <h2 className="text-heading-4 text-fg">
                {t("myRides.rideshareTitle")}
              </h2>
            </div>

            <div className="space-y-stack-md">
              <a
                href="https://m.uber.com"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({
                  variant: "neutral",
                  appearance: "fill-stroke",
                  fullWidth: true,
                })}
              >
                <Car />
                <span>{t("myRides.openUber")}</span>
              </a>

              <a
                href="https://www.lyft.com"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({
                  variant: "neutral",
                  appearance: "fill-stroke",
                  fullWidth: true,
                })}
              >
                <Car />
                <span>{t("myRides.openLyft")}</span>
              </a>
            </div>

            <Card tone="sunken" className="space-y-stack-sm text-left">
              <p className="flex items-center gap-inline-xs text-label-md text-fg">
                <ShieldAlert
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-fg-muted"
                />
                <span>
                  {t("myRides.disclaimerTitle") ||
                    "Third-Party Transportation Disclaimer:"}
                </span>
              </p>
              <p className="text-body-sm text-fg-muted">
                {t("myRides.disclaimerText") ||
                  "NephroReach does not provide, arrange, operate, endorse, or guarantee transportation services offered by third-party providers. Transportation availability, eligibility, pricing, scheduling, safety, and services are determined solely by the transportation provider. By selecting a transportation link, you will leave NephroReach and be subject to the third party's terms and privacy practices."}
              </p>
            </Card>
          </Card>
        </section>
      </div>

      <Modal
        open={isFormOpen}
        onClose={closeForm}
        title={
          editingId ? t("myRides.editRideModal") : t("myRides.addNewRideModal")
        }
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={closeForm}
              disabled={isSaving}
            >
              {t("myRides.cancel")}
            </Button>
            <Button type="submit" form="ride-form" loading={isSaving}>
              {editingId ? t("myRides.updateInfo") : t("myRides.saveRide")}
            </Button>
          </>
        }
      >
        <form
          id="ride-form"
          onSubmit={handleSubmit}
          className="space-y-stack-lg"
        >
          {saveError ? (
            <Alert tone="danger" title="Not saved">
              {saveError instanceof Error
                ? saveError.message
                : "Please try again."}
            </Alert>
          ) : null}

          <FormField
            label={t("myRides.driverNameLabel")}
            required
            error={formError || undefined}
          >
            {(props) => (
              <Input
                {...props}
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder={t("myRides.driverNamePlaceholder")}
                autoFocus
              />
            )}
          </FormField>

          <FormField label={t("myRides.phoneLabel")} required>
            {(props) => (
              <Input
                {...props}
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder={t("myRides.phonePlaceholder")}
              />
            )}
          </FormField>

          <FormField
            label={t("myRides.relationshipLabel")}
            optionalLabel="optional"
          >
            {(props) => (
              <Input
                {...props}
                type="text"
                value={form.note}
                onChange={(e) => setField("note", e.target.value)}
                placeholder={t("myRides.relationshipPlaceholder")}
              />
            )}
          </FormField>

          <label className="flex cursor-pointer items-center gap-inline-md select-none">
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => setField("isPrimary", e.target.checked)}
              className="h-4 w-4 rounded-chip border-field text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
            <span className="text-label-lg text-fg-secondary">
              {t("myRides.setPrimary")}
            </span>
          </label>
        </form>
      </Modal>

      {/* window.confirm blocks the page, cannot be styled, and gives a failed
          delete nowhere to report itself. */}
      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={t("myRides.removeRide")}
        size="small"
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setPendingDelete(null)}
              disabled={remove.isPending}
            >
              {t("myRides.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              loading={remove.isPending}
            >
              {t("myRides.removeRide")}
            </Button>
          </>
        }
      >
        <p className="text-body-md text-fg-secondary">
          {t("myRides.confirmDelete").replace(
            "{name}",
            pendingDelete?.name ?? "",
          )}
        </p>
      </Modal>
    </div>
  );
}
