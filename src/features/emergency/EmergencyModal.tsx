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

const defaultSymptoms = [
  "Chest pain or pressure",
  "Trouble breathing",
  "Severe weakness or dizziness",
  "Bleeding that won't stop",
  "Fainting or passing out",
  "Severe swelling or sudden weight gain",
  "Confusion or inability to stay awake",
];

type EmergencyModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function EmergencyModal({ open, onClose }: EmergencyModalProps) {
  const { dictionary } = useLanguage();
  const em = dictionary?.emergencyModal;
  const { contact } = useEmergencyContact();

  const symptoms =
    em?.symptoms && Array.isArray(em.symptoms) && em.symptoms.length > 0
      ? em.symptoms
      : defaultSymptoms;

  return (
    // Escape and the scroll lock were already here; <Modal> adds the focus
    // trap, which this dialog did not have — on the one screen where a
    // keyboard user tabbing out to the page behind matters most.
    <Modal
      open={open}
      onClose={onClose}
      title={em?.title || "This may be a medical emergency."}
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
          className="space-y-stack-md border-danger-line bg-danger-surface"
        >
          <h3 className="text-heading-5 text-fg">
            {em?.whenToSeekTitle || "When to Seek Emergency Care"}
          </h3>
          <ul className="flex flex-col gap-stack-xs">
            {symptoms.map((item) => (
              <li key={item} className="text-body-sm text-fg-secondary">
                • {item}
              </li>
            ))}
          </ul>
          <p className="text-body-sm text-fg">
            {em?.advisory ||
              "If you feel something is seriously wrong, do not wait. Call 911 or go to the nearest emergency room immediately."}
          </p>
        </Card>

        <p className="text-center text-body-sm text-fg-muted">
          {em?.disclaimer ||
            "NephroReach is an education and support platform only. We do not provide medical advice, diagnosis, or emergency services."}
        </p>
      </div>
    </Modal>
  );
}
