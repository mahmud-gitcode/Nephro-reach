"use client";

import React, { useState, useEffect } from "react";
import { Phone, Pencil, Plus, Trash2, X, Car, Star, ShieldAlert } from "lucide-react";
import {
  Badge,
  Button,
  buttonStyles,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
} from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";

export interface RideContact {
  id: string;
  name: string;
  phone: string;
  note?: string;
  isPrimary?: boolean;
}

const DEFAULT_RIDES: RideContact[] = [
  {
    id: "1",
    name: "Bobo boy",
    phone: "(684) 555-0102",
    isPrimary: true,
  },
];

export default function MyRidesPage() {
  const { t } = useLanguage();

  const [rides, setRides] = useState<RideContact[]>(DEFAULT_RIDES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formIsPrimary, setFormIsPrimary] = useState(false);
  const [formError, setFormError] = useState("");

  // Load saved rides from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("nephroreach_my_rides");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.map((r: RideContact) => {
            if (r.isPrimary && r.note && /primary/i.test(r.note)) {
              return { ...r, note: undefined };
            }
            return r;
          });
          setRides(cleaned);
        }
      }
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  const saveRides = (newRides: RideContact[]) => {
    setRides(newRides);
    try {
      localStorage.setItem("nephroreach_my_rides", JSON.stringify(newRides));
    } catch {
      // ignore
    }
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setEditingId(null);
    setFormName("");
    setFormPhone("");
    setFormNote("");
    setFormIsPrimary(rides.length === 0);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ride: RideContact) => {
    setModalMode("edit");
    setEditingId(ride.id);
    setFormName(ride.name);
    setFormPhone(ride.phone);
    setFormNote(ride.note || "");
    setFormIsPrimary(Boolean(ride.isPrimary));
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError(t("myRides.errorName"));
      return;
    }
    if (!formPhone.trim()) {
      setFormError(t("myRides.errorPhone"));
      return;
    }

    if (modalMode === "add") {
      const newRide: RideContact = {
        id: Date.now().toString(),
        name: formName.trim(),
        phone: formPhone.trim(),
        note: formNote.trim() || undefined,
        isPrimary: formIsPrimary || rides.length === 0,
      };

      let updated = [...rides];
      if (newRide.isPrimary) {
        updated = updated.map((r) => ({ ...r, isPrimary: false }));
      }
      updated.push(newRide);
      saveRides(updated);
    } else if (modalMode === "edit" && editingId) {
      let updated = rides.map((r) => {
        if (r.id === editingId) {
          return {
            ...r,
            name: formName.trim(),
            phone: formPhone.trim(),
            note: formNote.trim() || undefined,
            isPrimary: formIsPrimary,
          };
        }
        return formIsPrimary ? { ...r, isPrimary: false } : r;
      });
      saveRides(updated);
    }

    handleCloseModal();
  };

  const handleDeleteRide = (id: string, name: string) => {
    const confirmMsg = t("myRides.confirmDelete").replace("{name}", name);
    if (confirm(confirmMsg)) {
      const remaining = rides.filter((r) => r.id !== id);
      if (remaining.length > 0 && !remaining.some((r) => r.isPrimary)) {
        remaining[0].isPrimary = true;
      }
      saveRides(remaining);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header Section */}
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

        <Button onClick={handleOpenAdd} leadingIcon={<Plus />}>
          {t("myRides.addRide")}
        </Button>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SECTION 1: Saved Drivers & Personal Transport */}
        <section className="lg:col-span-7 xl:col-span-7 space-y-4">

          {rides.length === 0 ? (
            <EmptyState
              icon={<Car />}
              title={t("myRides.noRides")}
              description="Save phone numbers for your primary driver, family member, or medical transit service for fast, one-tap calling."
              action={
                <Button onClick={handleOpenAdd} leadingIcon={<Plus />}>
                  {t("myRides.addFirstRide")}
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rides.map((ride) => (
                <Card
                  key={ride.id}
                  as="article"
                  className={`flex flex-col justify-between gap-inline-lg ${
                    ride.isPrimary ? "border-primary-soft-line bg-primary-soft" : ""
                  }`}
                >
                  {/* Card Top: Driver Info & Action buttons */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          aria-hidden="true"
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-heading-5 ${
                            ride.isPrimary
                              ? "bg-primary-solid text-primary-on-solid"
                              : "bg-surface-sunken text-fg-secondary"
                          }`}
                        >
                          {ride.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate text-heading-5 text-fg">
                            {ride.name}
                          </h3>
                          <div className="mt-stack-xs flex flex-wrap items-center gap-inline-xs">
                            {ride.isPrimary && (
                              <Badge tone="info" icon={<Star />}>
                                {t("myRides.primaryBadge")}
                              </Badge>
                            )}
                            {ride.note && (!ride.isPrimary || !/primary/i.test(ride.note)) && (
                              <Badge tone="neutral">{ride.note}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="neutral"
                          appearance="fill-stroke"
                          size="small"
                          iconOnly
                          onClick={() => handleOpenEdit(ride)}
                          title={t("myRides.editDetails")}
                          aria-label={`Edit ${ride.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {rides.length > 1 && (
                          <Button
                            variant="danger"
                            size="small"
                            iconOnly
                            onClick={() => handleDeleteRide(ride.id, ride.name)}
                            title={t("myRides.removeRide")}
                            aria-label={`Remove ${ride.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-stack-lg border-t border-line-subtle pt-inset-sm">
                      <p className="text-overline text-fg-muted">
                        {t("myRides.phoneLabel") || "Phone Number"}
                      </p>
                      <p className="mt-stack-xs text-metric-sm text-fg">
                        {ride.phone}
                      </p>
                    </div>
                  </div>

                  {/* Call CTA button */}
                  <a
                    href={`tel:${ride.phone.replace(/[^0-9+]/g, "")}`}
                    className={buttonStyles({ fullWidth: true })}
                  >
                    <Phone />
                    <span>
                      {t("myRides.call")} {ride.name}
                    </span>
                  </a>
                </Card>
              ))}
            </div>
          )}

        </section>

        {/* SECTION 2: SEPARATE RIDESHARE APPS SECTION */}
        <section className="lg:col-span-5 xl:col-span-5 space-y-4">
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
                className={buttonStyles({ variant: "neutral", fullWidth: true })}
              >
                <Car />
                <span>{t("myRides.openUber")}</span>
              </a>

              {/* Lyft's brand magenta is a third-party brand colour, not ours —
                  it stays a literal on purpose and must not be tokenised. */}
              <a
                href="https://www.lyft.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonStyles({ fullWidth: true })} border-transparent bg-[#FF00BF] text-white shadow-control hover:bg-[#E000A8]`}
              >
                <Car />
                <span>{t("myRides.openLyft")}</span>
              </a>
            </div>

            <Card tone="sunken" className="space-y-stack-sm text-left">
              <p className="flex items-center gap-inline-xs text-label-md text-fg">
                <ShieldAlert aria-hidden="true" className="h-4 w-4 shrink-0 text-fg-muted" />
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
        open={isModalOpen}
        onClose={handleCloseModal}
        title={
          modalMode === "add"
            ? t("myRides.addNewRideModal")
            : t("myRides.editRideModal")
        }
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={handleCloseModal}
            >
              {t("myRides.cancel")}
            </Button>
            <Button type="submit" form="ride-form">
              {modalMode === "add"
                ? t("myRides.saveRide")
                : t("myRides.updateInfo")}
            </Button>
          </>
        }
      >
        <form id="ride-form" onSubmit={handleSubmit} className="space-y-stack-lg">
          <FormField
            label={t("myRides.driverNameLabel")}
            required
            error={formError || undefined}
          >
            {(props) => (
              <Input
                {...props}
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
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
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder={t("myRides.phonePlaceholder")}
              />
            )}
          </FormField>

          <FormField label={t("myRides.relationshipLabel")} optionalLabel="optional">
            {(props) => (
              <Input
                {...props}
                type="text"
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder={t("myRides.relationshipPlaceholder")}
              />
            )}
          </FormField>

          <label className="flex cursor-pointer items-center gap-inline-md select-none">
            <input
              type="checkbox"
              checked={formIsPrimary}
              onChange={(e) => setFormIsPrimary(e.target.checked)}
              className="h-4 w-4 rounded-chip border-field text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
            <span className="text-label-lg text-fg-secondary">
              {t("myRides.setPrimary")}
            </span>
          </label>
        </form>
      </Modal>
    </div>
  );
}
