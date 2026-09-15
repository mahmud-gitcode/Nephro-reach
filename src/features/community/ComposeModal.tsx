"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Alert, Button, Chip, ChipGroup, Modal } from "@/components/ui";
import { FileText, Send } from "lucide-react";
import { checkFlaggedMedicalContent } from "./moderation";

export const COMPOSE_CATEGORIES = [
  { id: "general", labelEn: "General Kidney", labelEs: "Salud Renal General" },
  { id: "dialysis", labelEn: "Dialysis", labelEs: "Diálisis" },
  {
    id: "transplant",
    labelEn: "Kidney Transplant",
    labelEs: "Trasplante Renal",
  },
  {
    id: "nutrition",
    labelEn: "Nutrition & Wellness",
    labelEs: "Nutrición y Bienestar",
  },
  {
    id: "caregiver",
    labelEn: "Caregiver Support",
    labelEs: "Apoyo al Cuidador",
  },
];

export function ComposeModal({
  open,
  onClose,
  onPost,
  initialCategory = "general",
}: {
  open: boolean;
  onClose: () => void;
  onPost: (body: string, categoryId: string) => void;
  initialCategory?: string;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [body, setBody] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory === "all" ? "general" : initialCategory,
  );

  const isFlagged = checkFlaggedMedicalContent(body);

  const canPost = Boolean(body.trim()) && !isFlagged;

  const handleSubmit = () => {
    if (!canPost) return;
    onPost(body.trim(), selectedCategory);
    setBody("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={isEs ? "Compartir con la Comunidad" : "Share with the Community"}
      footer={
        <Button
          onClick={handleSubmit}
          disabled={!canPost}
          variant="neutral"
          appearance="fill"
          className="w-full"
        >
          <Send aria-hidden="true" className="-rotate-12" />
          {isEs ? "Publicar en la Comunidad" : "Post to Community"}
        </Button>
      }
    >
      <div className="space-y-stack-lg">
        {/* 1. Community Guidelines — part of the page, not a response to
            anything the member did, so it is not announced. */}
        <Alert
          tone="info"
          live={false}
          title={isEs ? "Pautas de la Comunidad" : "Community Guidelines"}
        >
          {isEs
            ? "Esta comunidad es solo para educación y apoyo. Por favor, no publique consejos médicos, cambios en medicamentos, síntomas de emergencia o instrucciones de tratamiento."
            : "This community is for education and support only. Please do not post medical advice, medication changes, emergency symptoms, or treatment instructions."}
        </Alert>

        {/* 2. Category — one of six, so the group is marked single-select. */}
        <ChipGroup
          selection="single"
          label={isEs ? "Categoría" : "Category"}
          className="gap-inline-md"
        >
          {COMPOSE_CATEGORIES.map((cat) => (
            <Chip
              key={cat.id}
              selected={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {isEs ? cat.labelEs : cat.labelEn}
            </Chip>
          ))}
        </ChipGroup>

        {/* 3. Body, with the counter inside the same focus ring as the field */}
        <div className="flex min-h-[160px] flex-col justify-between rounded-card border border-line bg-surface p-inset-md transition-colors duration-150 ease-standard focus-within:border-primary-edge focus-within:ring-2 focus-within:ring-ring">
          <label htmlFor="compose-body" className="sr-only">
            {isEs ? "Su mensaje" : "Your message"}
          </label>
          <textarea
            id="compose-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={200}
            rows={4}
            aria-describedby="compose-count"
            placeholder={
              isEs
                ? "Este es un espacio de apoyo, no para instrucciones médicas."
                : "This is a support space, not for medical instructions."
            }
            className="w-full flex-grow resize-none border-0 p-0 text-body-md text-fg-secondary outline-none placeholder:text-fg-muted"
          />
          <p
            id="compose-count"
            className="mt-stack-sm flex items-center justify-end gap-inline-sm text-caption text-fg-muted select-none"
          >
            <FileText aria-hidden="true" className="h-4 w-4" />
            <span>{body.length}/200</span>
          </p>
        </div>

        {/* 4. Auto-flag notice. This one IS a response to what was typed, so
            it keeps the live region <Alert> gives it by default. */}
        {isFlagged && (
          <Alert tone="danger">
            <p>
              {isEs
                ? "Su mensaje incluye síntomas o inquietudes que pueden necesitar atención médica urgente. NephroReach solo brinda educación y no diagnostica, trata ni reemplaza a su equipo de diálisis. Comuníquese con su clínica de diálisis, nefrólogo o llame al 911 si esto puede ser una emergencia."
                : "Your message includes symptoms or concerns that may need urgent medical attention. NephroReach provides education only and does not diagnose, treat, or replace your dialysis team. Please contact your dialysis clinic, nephrologist, or call 911 if this may be an emergency."}
            </p>
            <p className="mt-stack-sm font-semibold">
              {isEs
                ? "Este mensaje no se puede publicar. Edite el texto para quitar los detalles médicos urgentes."
                : "This message cannot be posted. Please edit it to remove the urgent medical details."}
            </p>
          </Alert>
        )}
      </div>
    </Modal>
  );
}
