"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Phone, TriangleAlert } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  canCall,
  describeContact,
  dialable,
} from "@/features/profile/emergencyContact";
import { useEmergencyContact } from "@/features/profile/useEmergencyContact";
import { Button, buttonStyles, Card, Modal } from "@/components/ui";
import { EMERGENCY_INFORMATION } from "./beforeTheEr.topics";

/* The client's Emergency Information text (2026-10-05), the same words as
   on Before the ER. The popup used to open with "This may be a medical
   emergency" and a "When to Seek Emergency Care" symptom list — an
   assessment the app must not make. */

type EmergencyModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function EmergencyModal({ open, onClose }: EmergencyModalProps) {
  const { dictionary, language } = useLanguage();
  const em = dictionary?.emergencyModal;
  const isEs = language === "ES";
  const { contact } = useEmergencyContact();

  return (
    // Escape and the scroll lock were already here; <Modal> adds the focus
    // trap, which this dialog did not have — on the one screen where a
    // keyboard user tabbing out to the page behind matters most.
    <Modal
      open={open}
      onClose={onClose}
      title={em?.title || EMERGENCY_INFORMATION.titleEn}
      description={
        em?.subtitle || "NephroReach does NOT provide emergency care."
      }
      footer={
        <Button
          variant="neutral"
          appearance="fill-stroke"
          onClick={onClose}
          className="w-full"
        >
          {em?.closeButton || "Close"}
        </Button>
      }
    >
      <div className="space-y-stack-lg">
        <TriangleAlert
          aria-hidden="true"
          className="mx-auto h-12 w-12 text-danger"
        />

        <div className="flex flex-col gap-stack-md">
          <a
            href="tel:911"
            className={buttonStyles({ variant: "danger", fullWidth: true })}
          >
            <Phone aria-hidden="true" />
            {em?.call911 || "Call 911"}
          </a>

          <a
            href="https://www.google.com/maps/search/emergency+room+near+me"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({
              variant: "neutral",
              appearance: "fill-stroke",
              fullWidth: true,
            })}
          >
            <MapPin aria-hidden="true" />
            {em?.findEr || "Find Nearest Emergency Room"}
          </a>

          {/* Dials the contact on the member's profile. It used to be a
            permanently disabled button with nowhere to read a number from,
            which on this screen is the cruellest control in the app: the
            one thing that would help, doing nothing. */}
          {canCall(contact) ? (
            <a
              href={`tel:${dialable(contact.phone)}`}
              className={buttonStyles({
                variant: "neutral",
                appearance: "fill-stroke",
                fullWidth: true,
              })}
            >
              <Phone aria-hidden="true" />
              <span className="min-w-0 truncate">
                {describeContact(contact) ||
                  em?.emergencyContact ||
                  "Emergency contact"}
              </span>
            </a>
          ) : (
            /* Nothing stored yet: offer the place to store it rather than a
               dead button. Not disabled — there is something to do. */
            <Link
              href="/dashboard/settings"
              className={buttonStyles({
                variant: "neutral",
                appearance: "fill-stroke",
                fullWidth: true,
              })}
            >
              <Phone aria-hidden="true" />
              {em?.addEmergencyContact || "Add an emergency contact"}
            </Link>
          )}
        </div>

        <Card
          tone="flat"
          padding="small"
          className="space-y-stack-sm border-danger-line bg-danger-surface"
        >
          {(isEs ? EMERGENCY_INFORMATION.es : EMERGENCY_INFORMATION.en).map(
            (paragraph) => (
              <p key={paragraph} className="text-body-sm text-fg-secondary">
                {paragraph}
              </p>
            ),
          )}
        </Card>

        <p className="text-center text-body-sm text-fg-muted">
          {em?.disclaimer ||
            "NephroReach is an education and support platform only. We do not provide medical advice, diagnosis, or emergency services."}
        </p>
      </div>
    </Modal>
  );
}
