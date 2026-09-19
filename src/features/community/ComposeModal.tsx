"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Alert,
  Button,
  buttonStyles,
  Chip,
  ChipGroup,
  Modal,
} from "@/components/ui";
import { FileText, Phone, Send } from "lucide-react";
import {
  autoReplyForText,
  detectsPersonalInfo,
  routeForCommunity,
} from "./moderation";

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

  const reply = autoReplyForText(body);
  /* Advice, not a verdict: a member pasting their own phone number is
     offered the chance to take it out, not told off. */
  const leaksInfo = detectsPersonalInfo(body);

  /* The same routing the reply box uses, so the two cannot drift. Only a
     medical or crisis phrase kills the button; hostility is allowed to be
     submitted and is then held for a moderator. */
  const route = routeForCommunity(body);
  const canPost = route !== "block";

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
        {/* One message per tier, not one for everything. Someone asking
            about their dose and someone describing chest pain must not be
            answered in the same words. Each reply also says that nothing
            was sent on their behalf, because a member who thinks their
            care team got this may wait instead of calling. */}
        {reply ? (
          <Alert
            tone={reply.tone}
            title={isEs ? reply.title.es : reply.title.en}
          >
            <p>{isEs ? reply.body.es : reply.body.en}</p>

            {reply.offersEmergencyCall ? (
              <p className="mt-stack-sm flex flex-wrap gap-inline-md">
                <a
                  href="tel:911"
                  className={buttonStyles({ variant: "danger" })}
                >
                  <Phone aria-hidden="true" />
                  {isEs ? "Llamar al 911" : "Call 911"}
                </a>
                <a
                  href="tel:988"
                  className={buttonStyles({
                    variant: "danger",
                    appearance: "stroke",
                  })}
                >
                  <Phone aria-hidden="true" />
                  {isEs ? "Llamar o textear 988" : "Call or text 988"}
                </a>
              </p>
            ) : null}

            <p className="mt-stack-sm font-semibold">
              {isEs
                ? "Puedes publicarlo igualmente: un moderador lo leerá primero y nadie más lo verá hasta que lo apruebe."
                : "You can still post it — a moderator will read it first, and nobody else will see it until they approve it."}
            </p>
          </Alert>
        ) : null}

        {/* Separate from the tiers on purpose. This is the likeliest
            accident on a patient board, and the useful response is a
            reminder before they post, not a refusal afterwards. */}
        {leaksInfo ? (
          <Alert
            tone="warning"
            title={
              isEs ? "¿Son datos personales?" : "Is that a personal detail?"
            }
          >
            {isEs
              ? "Tu mensaje parece incluir un teléfono, correo u otro dato personal. Este tablero es público para todos los miembros. Considera quitarlo antes de publicar."
              : "Your message looks like it contains a phone number, email address, or other personal detail. This board is visible to every member. Consider taking it out before you post."}
          </Alert>
        ) : null}
      </div>
    </Modal>
  );
}
