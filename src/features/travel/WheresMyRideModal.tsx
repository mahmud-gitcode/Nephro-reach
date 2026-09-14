"use client";

import React, { useState } from "react";
import { Phone, Pencil, Car } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Button,
  buttonStyles,
  Card,
  FormField,
  Input,
  Modal,
} from "@/components/ui";

export default function WheresMyRideModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [driverName, setDriverName] = useState("Bobo boy");
  const [driverPhone, setDriverPhone] = useState("(684) 555-0102");
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <Modal
        open={isOpen}
        onClose={onClose}
        title={t("myRides.editDetails")}
        footer={
          <>
            <Button
              variant="neutral"
              appearance="fill-stroke"
              onClick={() => setIsEditing(false)}
            >
              {t("myRides.cancel")}
            </Button>
            <Button onClick={() => setIsEditing(false)}>
              {t("myRides.saveRide")}
            </Button>
          </>
        }
      >
        <div className="space-y-stack-lg">
          <FormField label={t("myRides.driverNameLabel")}>
            {(props) => (
              <Input
                {...props}
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Bobo boy"
              />
            )}
          </FormField>

          <FormField label={t("myRides.phoneLabel")}>
            {(props) => (
              <Input
                {...props}
                type="tel"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="(684) 555-0102"
              />
            )}
          </FormField>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={t("myRides.title")}
      description={t("myRides.subtitle")}
      footer={
        <Button
          variant="neutral"
          appearance="fill-stroke"
          onClick={onClose}
          className="w-full"
        >
          {t("myRides.close")}
        </Button>
      }
    >
      <div className="space-y-stack-lg">
        {/* Card 1: My Ride */}
        <Card
          tone="flat"
          padding="small"
          className="space-y-stack-md border-primary-soft-line bg-primary-soft"
        >
          <div className="flex items-center justify-between gap-inline-md">
            <h3 className="text-heading-5 text-fg">
              {t("myRides.sectionTitle")}
            </h3>
            {/* title= is a tooltip; the button needs a real name. */}
            <Button
              variant="neutral"
              appearance="fill"
              size="small"
              className="px-inset-xs"
              onClick={() => setIsEditing(true)}
              aria-label={t("myRides.editDetails")}
            >
              <Pencil aria-hidden="true" />
            </Button>
          </div>

          <div>
            <p className="text-label-md text-fg">{driverName}</p>
            <p className="text-body-sm text-fg-muted">{driverPhone}</p>
          </div>

          <a
            href={`tel:${driverPhone.replace(/[^0-9+]/g, "")}`}
            className={buttonStyles({ fullWidth: true })}
          >
            <Phone aria-hidden="true" />
            {t("myRides.call")} {driverName}
          </a>
        </Card>

        {/* Card 2: Ride share Apps */}
        <Card tone="sunken" padding="small" className="space-y-stack-md">
          <h3 className="text-heading-5 text-fg">
            {t("myRides.rideshareTitle")}
          </h3>

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
            <Car aria-hidden="true" className="shrink-0" />
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
            <Car aria-hidden="true" className="shrink-0" />
            <span>{t("myRides.openLyft")}</span>
          </a>
        </Card>

        {/* Third-Party Transportation Disclaimer */}
        <Card
          tone="sunken"
          padding="small"
          className="text-caption text-fg-muted"
        >
          <span className="text-label-sm text-fg-secondary">
            {t("myRides.disclaimerTitle") ||
              "Third-Party Transportation Disclaimer:"}{" "}
          </span>
          <span>
            {t("myRides.disclaimerText") ||
              "NephroReach does not provide, arrange, operate, endorse, or guarantee transportation services offered by third-party providers. Transportation availability, eligibility, pricing, scheduling, safety, and services are determined solely by the transportation provider. By selecting a transportation link, you will leave NephroReach and be subject to the third party's terms and privacy practices."}
          </span>
        </Card>
      </div>
    </Modal>
  );
}
