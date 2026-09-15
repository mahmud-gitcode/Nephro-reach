"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Bell, Check, Eye, Phone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Alert, Button, buttonStyles, Card, Modal } from "@/components/ui";

interface ActionConfig {
  key: "callClinic" | "seekMedical" | "monitorSymptoms" | "call911";
  colorTheme: "blue" | "yellow" | "orange" | "red";
  callActionHref: string;
  isCallLink?: boolean;
  secondaryActionHref?: string;
  secondaryActionKey?:
    "findSchedule" | "urgentEducation" | "learnMoreEducation";
}

const ACTION_CONFIGS: ActionConfig[] = [
  {
    key: "callClinic",
    colorTheme: "blue",
    callActionHref: "tel:5550100",
    isCallLink: true,
    secondaryActionHref: "/dashboard/personal-log/dialysis-management",
    secondaryActionKey: "findSchedule",
  },
  {
    key: "seekMedical",
    colorTheme: "orange",
    callActionHref: "tel:5550199",
    isCallLink: true,
    secondaryActionHref: "/dashboard/my-library",
    secondaryActionKey: "urgentEducation",
  },
  {
    key: "monitorSymptoms",
    colorTheme: "yellow",
    callActionHref: "/dashboard/personal-log/dialysis-journal",
    isCallLink: false,
    secondaryActionHref: "/dashboard/my-library",
    secondaryActionKey: "learnMoreEducation",
  },
  {
    key: "call911",
    colorTheme: "red",
    callActionHref: "tel:911",
    isCallLink: true,
  },
];

interface SymptomConfig {
  id: string;
  key:
    | "chestPain"
    | "severeFluidOverload"
    | "signsOfStroke"
    | "lossOfConsciousness"
    | "severeAllergicReactions"
    | "severeShortnessOfBreath"
    | "seizures"
    | "dialysisAccessEmergencies"
    | "severeBleeding"
    | "severeHyperkalemia"
    | "feverDialysisCatheter"
    | "confusionMentalStatus";
  urgent: boolean;
}

const SYMPTOMS: SymptomConfig[] = [
  { id: "chest-pain", key: "chestPain", urgent: true },
  { id: "severe-fluid-overload", key: "severeFluidOverload", urgent: false },
  { id: "signs-of-stroke", key: "signsOfStroke", urgent: true },
  { id: "loss-of-consciousness", key: "lossOfConsciousness", urgent: false },
  {
    id: "severe-allergic-reactions",
    key: "severeAllergicReactions",
    urgent: true,
  },
  {
    id: "severe-shortness-of-breath",
    key: "severeShortnessOfBreath",
    urgent: false,
  },
  { id: "seizures", key: "seizures", urgent: true },
  {
    id: "dialysis-access-emergencies",
    key: "dialysisAccessEmergencies",
    urgent: false,
  },
  { id: "severe-bleeding", key: "severeBleeding", urgent: true },
  {
    id: "severe-hyperkalemia-symptoms",
    key: "severeHyperkalemia",
    urgent: false,
  },
  {
    id: "fever-with-dialysis-catheter",
    key: "feverDialysisCatheter",
    urgent: false,
  },
  {
    id: "confusion-or-mental-status-changes",
    key: "confusionMentalStatus",
    urgent: false,
  },
];

/* The four themes the content author can pick collapse onto the palette's
   own meanings: "orange" and "yellow" are both a warning. */
const ACTION_TONE: Record<string, "primary" | "danger" | "accent"> = {
  red: "danger",
  orange: "primary",
  yellow: "primary",
  blue: "primary",
};

const ACTION_ALERT_TONE: Record<
  string,
  "info" | "danger" | "warning" | "success"
> = {
  red: "danger",
  orange: "warning",
  yellow: "warning",
  blue: "info",
};

type ActionCopy = {
  title: string;
  purpose: string;
  reminder: string;
  callAction: string;
  symptoms: string[];
};

export default function BeforeTheErPage() {
  const router = useRouter();
  const { t, dictionary } = useLanguage();

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [activeModalKey, setActiveModalKey] = useState<
    ActionConfig["key"] | null
  >(null);

  const selectedCount = selectedSymptoms.length;

  function toggleSymptom(id: string) {
    setSelectedSymptoms((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function handleGetGuidance() {
    if (selectedSymptoms.length > 0) {
      const slug = selectedSymptoms[0];
      const query =
        selectedSymptoms.length > 1
          ? `?selected=${encodeURIComponent(selectedSymptoms.join(","))}`
          : "";
      router.push(`/dashboard/before-the-er/${slug}${query}`);
    }
  }

  const activeConfig = activeModalKey
    ? ACTION_CONFIGS.find((c) => c.key === activeModalKey)
    : null;

  /* The copy for each action is looked up by key, so the dictionary is read
     as a map here rather than through its generated property names. */
  const beforeTheEr = dictionary?.beforeTheEr as unknown as
    Record<string, ActionCopy | undefined> | undefined;

  const modalData =
    activeModalKey && beforeTheEr?.[activeModalKey]
      ? (beforeTheEr[activeModalKey] as ActionCopy)
      : null;

  return (
    <div className="space-y-4">
      {/* Disclaimer Box */}
      {/* Kept as a section with a real <h1> rather than an <Alert>: this is
          the page heading, not a notice that appeared in response to
          something. It borrows the danger surface only for weight. */}
      <section className="rounded-card border border-danger-line bg-danger-surface p-inset-lg">
        <div className="flex gap-inline-lg">
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 h-icon-big w-icon-big shrink-0 text-danger"
          />
          <div>
            <h1 className="text-heading-5 text-fg">
              {t("beforeTheEr.disclaimerTitle")}
            </h1>
            <p className="mt-stack-sm measure text-body-md text-fg-secondary">
              {t("beforeTheEr.disclaimerText")}
            </p>
          </div>
        </div>
      </section>

      {/* Action Items Grid with Eye Icon Trigger */}
      <Card as="section" padding="small">
        <h2 className="mb-stack-md text-heading-3 text-fg">
          {t("beforeTheEr.sectionTitle")}
        </h2>

        <Card tone="sunken" padding="small">
          <ul className="grid grid-cols-1 gap-inline-md md:grid-cols-2">
            {ACTION_CONFIGS.map((item) => {
              const itemTitle = t(`beforeTheEr.${item.key}.title`);
              return (
                <Card
                  key={item.key}
                  as="li"
                  tone="flat"
                  padding="small"
                  className="flex min-h-[60px] items-center justify-between gap-inline-md"
                >
                  <span className="truncate text-body-md text-fg">
                    {itemTitle}
                  </span>
                  {/* title= is a tooltip, not a name. aria-label is. */}
                  <Button
                    variant="neutral"
                    appearance="fill-stroke"
                    className="shrink-0 px-inset-xs"
                    onClick={() => setActiveModalKey(item.key)}
                    aria-label={t("beforeTheEr.viewDetailsFor").replace(
                      "{item}",
                      itemTitle,
                    )}
                  >
                    <Eye aria-hidden="true" />
                  </Button>
                </Card>
              );
            })}
          </ul>
        </Card>
      </Card>

      {/* Symptoms Checkbox List */}
      <Card as="section" padding="small">
        <div className="mb-stack-md flex flex-col gap-inset-md md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-heading-3 text-fg">
              {t("beforeTheEr.notFeelingBestTitle")}
            </h2>
            <p className="mt-stack-sm measure text-body-md text-fg-secondary">
              {t("beforeTheEr.notFeelingBestSubtitle")}
            </p>
          </div>
          <Button
            disabled={selectedCount === 0}
            onClick={handleGetGuidance}
            className="shrink-0"
          >
            {t("beforeTheEr.getGuidance")}
          </Button>
        </div>

        <Card tone="sunken" padding="small">
          {/* These were plain buttons drawing a checkbox. A screen reader
              heard "button" and never whether the symptom was ticked. */}
          <div
            role="group"
            aria-label={t("beforeTheEr.notFeelingBestTitle")}
            className="grid grid-cols-1 gap-inline-md md:grid-cols-2"
          >
            {SYMPTOMS.map((symptom) => {
              const checked = selectedSymptoms.includes(symptom.id);
              const label = t(`beforeTheEr.symptomsList.${symptom.key}`);

              return (
                <button
                  key={symptom.id}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => toggleSymptom(symptom.id)}
                  className={`flex min-h-16 cursor-pointer items-center gap-inline-lg rounded-card bg-surface p-inset-md text-left transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                    symptom.urgent
                      ? "border-2 border-danger-line hover:bg-danger-surface"
                      : "border border-line hover:bg-primary-soft"
                  } ${checked ? "ring-2 ring-ring" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-control-small border-2 ${
                      checked
                        ? "border-primary-solid bg-primary-solid text-primary-on-solid"
                        : "border-line bg-surface"
                    }`}
                  >
                    {checked && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="text-body-md text-fg">{label}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </Card>

      {/* EYE BUTTON DETAILS POPUP MODAL */}
      {activeConfig && modalData && (
        <Modal
          open
          onClose={() => setActiveModalKey(null)}
          size="wide"
          title={modalData.title}
          description={modalData.purpose}
          footer={
            <>
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={() => setActiveModalKey(null)}
              >
                {t("beforeTheEr.close")}
              </Button>

              {activeConfig.secondaryActionHref &&
                activeConfig.secondaryActionKey && (
                  <Link
                    href={activeConfig.secondaryActionHref}
                    className={buttonStyles({
                      variant: "neutral",
                      appearance: "fill-stroke",
                    })}
                  >
                    {t(`beforeTheEr.${activeConfig.secondaryActionKey}`)}
                  </Link>
                )}

              {activeConfig.isCallLink ? (
                <a
                  href={activeConfig.callActionHref}
                  className={buttonStyles({
                    variant: ACTION_TONE[activeConfig.colorTheme],
                  })}
                >
                  <Phone aria-hidden="true" />
                  {modalData.callAction}
                </a>
              ) : (
                <Link
                  href={activeConfig.callActionHref}
                  className={buttonStyles({
                    variant: ACTION_TONE[activeConfig.colorTheme],
                  })}
                >
                  {modalData.callAction}
                </Link>
              )}
            </>
          }
        >
          <div className="space-y-stack-xl">
            {/* Reminder Banner */}
            <Alert
              tone={ACTION_ALERT_TONE[activeConfig.colorTheme]}
              live={false}
              icon={<Bell />}
            >
              {modalData.reminder}
            </Alert>

            {/* Symptoms Bullet List */}
            <div className="space-y-stack-md">
              <h4 className="text-overline text-fg-muted">
                {t("beforeTheEr.suggestedTopics")}
              </h4>
              <ul className="grid grid-cols-1 gap-inline-md sm:grid-cols-2">
                {Array.isArray(modalData.symptoms) &&
                  modalData.symptoms.map((symptomName, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-inline-md rounded-control border border-line bg-surface-sunken p-inset-sm text-body-sm break-words text-fg-secondary"
                    >
                      <span aria-hidden="true" className="text-fg-brand">
                        •
                      </span>
                      <span>{symptomName}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
