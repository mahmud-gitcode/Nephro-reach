"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Apple,
  Bone,
  CheckCircle2,
  Droplet,
  FlaskConical,
  HeartPulse,
  Plus,
  X,
} from "lucide-react";
import { Kidneys } from "@/components/icons/Kidneys";

import { useLanguage } from "@/context/LanguageContext";
import { useMemberLabs } from "@/features/labs/useMemberLabs";
import { todayIso } from "@/features/medications/medicationLog.rules";
import { saveErrorText } from "@/features/profile/saveError";
import { UploadError } from "@/lib/api/upload";
import PersonalLogDisclaimer from "@/features/personal-log/PersonalLogDisclaimer";
import {
  Alert,
  Button,
  buttonStyles,
  Card,
  Chip,
  ChipGroup,
  FormField,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea,
} from "@/components/ui";

interface TestItem {
  id: string;
  name: string;
  unit: string;
  refRange: string;
}

interface CategoryGroup {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  tests: TestItem[];
}

const designCategories: CategoryGroup[] = [
  {
    id: "kidney-function",
    name: "Kidney function",
    icon: Kidneys,
    tests: [
      {
        id: "bun",
        name: "BUN",
        unit: "mg/dL",
        refRange: "7 – 20 mg/dL",
      },
      {
        id: "creatinine",
        name: "Creatinine",
        unit: "mg/dL",
        refRange: "0.6 – 1.3 mg/dL",
      },
      {
        id: "egfr",
        name: "eGFR (CKD-EPI)",
        unit: "mL/min/1.73m²",
        refRange: "> 90 mL/min/1.73m²",
      },
    ],
  },
  {
    id: "electrolytes",
    name: "Electrolytes",
    icon: FlaskConical,
    tests: [
      {
        id: "sodium",
        name: "Sodium",
        unit: "mEq/L",
        refRange: "135 – 145 mEq/L",
      },
      {
        id: "potassium",
        name: "Potassium",
        unit: "mEq/L",
        refRange: "3.5 – 5.0 mEq/L",
      },
      {
        id: "chloride",
        name: "Chloride",
        unit: "mEq/L",
        refRange: "98 – 107 mEq/L",
      },
      {
        id: "co2",
        name: "CO2 (Bicarbonate)",
        unit: "mEq/L",
        refRange: "22 – 29 mEq/L",
      },
    ],
  },
  {
    id: "mineral-bone",
    name: "Mineral & bone",
    icon: Bone,
    tests: [
      {
        id: "calcium",
        name: "Calcium",
        unit: "mg/dL",
        refRange: "8.5 – 10.5 mg/dL",
      },
      {
        id: "phosphorus",
        name: "Phosphorus",
        unit: "mg/dL",
        refRange: "2.5 – 4.5 mg/dL",
      },
      {
        id: "pth",
        name: "PTH (Intact)",
        unit: "pg/mL",
        refRange: "15 – 65 pg/mL",
      },
      {
        id: "vitamind",
        name: "Vitamin D 25-OH",
        unit: "ng/mL",
        refRange: "30 – 100 ng/mL",
      },
    ],
  },
  {
    id: "blood-counts",
    name: "Blood counts",
    icon: Droplet,
    tests: [
      {
        id: "hemoglobin",
        name: "Hemoglobin",
        unit: "g/dL",
        refRange: "11.0 – 16.0 g/dL",
      },
      {
        id: "hematocrit",
        name: "Hematocrit",
        unit: "%",
        refRange: "33 – 47 %",
      },
      {
        id: "ferritin",
        name: "Ferritin",
        unit: "ng/mL",
        refRange: "30 – 400 ng/mL",
      },
      {
        id: "tsat",
        name: "Iron Saturation (TSAT)",
        unit: "%",
        refRange: "20 – 50 %",
      },
    ],
  },
  {
    id: "nutrition",
    name: "Nutrition",
    icon: Apple,
    tests: [
      {
        id: "albumin",
        name: "Albumin",
        unit: "g/dL",
        refRange: "3.5 – 5.0 g/dL",
      },
      {
        id: "bicarbonate",
        name: "Bicarbonate",
        unit: "mEq/L",
        refRange: "22 – 29 mEq/L",
      },
    ],
  },
  {
    id: "dialysis-adequacy",
    name: "Dialysis adequacy",
    icon: HeartPulse,
    tests: [
      {
        id: "ktv",
        name: "Kt/V",
        unit: "ratio",
        refRange: "≥ 1.20",
      },
    ],
  },
];

export default function AddLabTrackingPage() {
  const router = useRouter();
  const { dictionary, language } = useLanguage();
  const l = dictionary?.labTracking;

  const isEs = language === "ES";
  /* Today, on the member's own calendar: a draw cannot be in the future. */
  const today = todayIso();
  const [labDate, setLabDate] = useState<string>(today);
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");

  /* Starts empty: only what the member types is sent (no sample values). */
  const [testValues, setTestValues] = useState<{ [key: string]: string }>({});
  /* A photo or PDF of the paper report: uploaded through /files on save,
     only its id is sent; it opens later through the result's own link. */
  const [report, setReport] = useState<File | null>(null);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [failure, setFailure] = useState<string | null>(null);
  const labs = useMemberLabs();

  const getCategoryName = (catId: string, fallback: string) => {
    if (catId === "kidney-function")
      return l?.categories?.kidneyFunction || fallback;
    if (catId === "electrolytes")
      return l?.categories?.electrolytes || fallback;
    if (catId === "mineral-bone") return l?.categories?.mineralBone || fallback;
    if (catId === "blood-counts") return l?.categories?.bloodCounts || fallback;
    if (catId === "nutrition") return l?.categories?.nutrition || fallback;
    if (catId === "dialysis-adequacy")
      return l?.categories?.dialysisAdequacy || fallback;
    return fallback;
  };

  const getTestDisplayName = (testId: string, fallback: string) => {
    const testsDict = l?.tests;
    if (!testsDict) return fallback;
    if (testId === "bun") return testsDict.bun || fallback;
    if (testId === "creatinine") return testsDict.creatinine || fallback;
    if (testId === "egfr") return testsDict.egfr || fallback;
    if (testId === "sodium") return testsDict.sodium || fallback;
    if (testId === "potassium") return testsDict.potassium || fallback;
    if (testId === "chloride") return testsDict.chloride || fallback;
    if (testId === "co2") return testsDict.co2 || fallback;
    if (testId === "calcium") return testsDict.calcium || fallback;
    if (testId === "phosphorus") return testsDict.phosphorus || fallback;
    if (testId === "pth") return testsDict.pth || fallback;
    if (testId === "vitamind") return testsDict.vitaminD || fallback;
    if (testId === "hemoglobin") return testsDict.hemoglobin || fallback;
    if (testId === "hematocrit") return testsDict.hematocrit || fallback;
    if (testId === "ferritin") return testsDict.ferritin || fallback;
    if (testId === "tsat") return testsDict.tsat || fallback;
    if (testId === "albumin") return testsDict.albumin || fallback;
    if (testId === "bicarbonate") return testsDict.bicarbonate || fallback;
    if (testId === "ktv") return testsDict.ktv || fallback;
    return fallback;
  };

  const handleValueChange = (name: string, val: string) => {
    setTestValues((prev) => ({ ...prev, [name]: val }));
  };

  // Add category to active form view
  const handleAddCategorySection = (catId: string) => {
    if (!catId) return;
    if (!activeCategoryIds.includes(catId)) {
      setActiveCategoryIds((prev) => [...prev, catId]);
    }
  };

  // Remove category section
  const handleRemoveCategorySection = (catId: string) => {
    setActiveCategoryIds((prev) => prev.filter((id) => id !== catId));
  };

  /* The old version announced "Lab Results Saved Successfully!" and then
     tried to save, swallowing the failure. A member would be redirected to a
     page that did not have their results on it, having been told twice that
     it did. Success is now claimed only once the write has returned. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (labs.isSaving || savedSuccess) return;
    setFailure(null);

    /* Only the tests of the sections on screen, and only the filled ones:
       one POST adds this draw as rows; it never overwrites the last one. */
    const shown = new Set(
      designCategories
        .filter((cat) => activeCategoryIds.includes(cat.id))
        .flatMap((cat) => cat.tests.map((t) => t.name)),
    );
    const values = Object.fromEntries(
      Object.entries(testValues).filter(
        ([name, value]) => shown.has(name) && value.trim() !== "",
      ),
    );
    if (Object.keys(values).length === 0) {
      setFailure(
        isEs
          ? "Agregue una categoría y escriba al menos un resultado."
          : "Add a category and enter at least one result.",
      );
      return;
    }
    if (!labDate || labDate > today) {
      setFailure(
        isEs
          ? "La fecha de la extracción no puede ser futura."
          : "The draw date cannot be in the future.",
      );
      return;
    }
    try {
      await labs.addDraw({ collectedOn: labDate, values, notes }, report);
    } catch (cause) {
      setFailure(
        cause instanceof UploadError
          ? cause.message
          : saveErrorText(cause, isEs ? "es" : "en"),
      );
      return;
    }
    setSavedSuccess(true);
    setTimeout(() => {
      router.push("/dashboard/personal-log/lab-tracking");
    }, 1000);
  };

  const availableCategoriesToAdd = designCategories.filter(
    (c) => !activeCategoryIds.includes(c.id),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-stack-xl">
      <PersonalLogDisclaimer />

      {failure ? (
        <Alert
          tone="danger"
          title={
            isEs
              ? "No se pudieron guardar estos resultados"
              : "These results could not be saved"
          }
        >
          {failure}
        </Alert>
      ) : null}

      {savedSuccess && (
        <Alert
          tone="success"
          icon={<CheckCircle2 />}
          title={l?.addModal?.successTitle || "Lab Results Saved Successfully!"}
        >
          {l?.addModal?.successDesc ||
            "Updating table info and redirecting to My Labs..."}
        </Alert>
      )}

      <Card
        as="form"
        onSubmit={(e: React.FormEvent) => void handleSubmit(e)}
        className="space-y-stack-xl"
      >
        <header className="flex flex-wrap items-center justify-between gap-inline-lg border-b border-line-subtle pb-inset-md">
          <h1 className="text-heading-3 text-fg">
            {l?.addModal?.title || "Add Lab Result"}
          </h1>
          <Link
            href="/dashboard/personal-log/lab-tracking"
            aria-label={language === "ES" ? "Cerrar formulario" : "Close form"}
            className={buttonStyles({
              variant: "neutral",
              appearance: "stroke",
              size: "small",
              iconOnly: true,
            })}
          >
            <X />
          </Link>
        </header>

        <Card tone="sunken" padding="big">
          <div className="max-w-xs">
            <FormField
              label={l?.addModal?.drawDateLabel || "Lab Draw Date"}
              required
            >
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  value={labDate}
                  max={today}
                  onChange={(e) => setLabDate(e.target.value)}
                />
              )}
            </FormField>
          </div>
        </Card>

        <div className="space-y-stack-lg">
          {activeCategoryIds.length > 0 && (
            <div className="space-y-stack-xl">
              {designCategories
                .filter((cat) => activeCategoryIds.includes(cat.id))
                .map((category) => (
                  <Card
                    key={category.id}
                    padding="none"
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-inline-md border-b border-line bg-surface-sunken px-inset-md py-inset-xs">
                      <h2 className="flex items-center gap-inline-md text-overline text-fg-brand">
                        <category.icon
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 fill-current"
                        />
                        {getCategoryName(category.id, category.name)}
                      </h2>
                      <Button
                        size="small"
                        variant="danger"
                        appearance="stroke"
                        onClick={() => handleRemoveCategorySection(category.id)}
                      >
                        {l?.addModal?.remove || "Remove"}
                      </Button>
                    </div>

                    <Table minWidth={520}>
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>
                            {l?.addModal?.headers?.test || "Test"}
                          </TableHeaderCell>
                          <TableHeaderCell>
                            {l?.addModal?.headers?.resultValue ||
                              "Result Value"}
                          </TableHeaderCell>
                          <TableHeaderCell>
                            {l?.addModal?.headers?.unit || "Unit"}
                          </TableHeaderCell>
                          <TableHeaderCell numeric>
                            {l?.addModal?.headers?.refRange ||
                              "Reference Range"}
                          </TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {category.tests.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell emphasis>
                              {getTestDisplayName(t.id, t.name)}
                            </TableCell>
                            <TableCell>
                              <Input
                                inputSize="small"
                                className="w-32"
                                value={testValues[t.name] || ""}
                                onChange={(e) =>
                                  handleValueChange(t.name, e.target.value)
                                }
                                aria-label={
                                  isEs
                                    ? `Resultado de ${getTestDisplayName(t.id, t.name)}`
                                    : `${getTestDisplayName(t.id, t.name)} result`
                                }
                                placeholder={
                                  l?.addModal?.enterValuePlaceholder ||
                                  "Enter value"
                                }
                              />
                            </TableCell>
                            <TableCell>{t.unit}</TableCell>
                            <TableCell numeric>{t.refRange}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                ))}
            </div>
          )}

          {availableCategoriesToAdd.length > 0 && (
            <Card tone="sunken" padding="big" className="space-y-stack-md">
              <p className="text-overline text-fg-brand">
                {l?.addModal?.addCategoryLabel || "+ Add Category:"}
              </p>

              <ChipGroup
                label={l?.addModal?.addCategoryLabel || "Add category"}
                selection="multiple"
              >
                {availableCategoriesToAdd.map((cat) => (
                  <Chip
                    key={cat.id}
                    icon={<Plus />}
                    onClick={() => handleAddCategorySection(cat.id)}
                  >
                    {getCategoryName(cat.id, cat.name)}
                  </Chip>
                ))}
              </ChipGroup>
            </Card>
          )}
        </div>

        <FormField
          label={
            isEs
              ? "Informe (foto o PDF del papel)"
              : "Report (a photo or PDF of the paper)"
          }
          optionalLabel={isEs ? "opcional" : "optional"}
          hint={
            isEs
              ? "JPG, PNG o PDF, hasta 10 MB. Se abre solo desde sus resultados."
              : "JPG, PNG or PDF, up to 10 MB. It opens only from your results."
          }
        >
          {(props) => (
            <Input
              {...props}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setReport(e.target.files?.[0] ?? null)}
            />
          )}
        </FormField>

        <FormField
          label={l?.addModal?.notesLabel || "Notes & Observations"}
          optionalLabel={isEs ? "opcional" : "optional"}
        >
          {(props) => (
            <Textarea
              {...props}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                l?.addModal?.notesPlaceholder ||
                "Add any notes or questions about your phosphorus, potassium, or fluid levels..."
              }
            />
          )}
        </FormField>

        <div className="flex items-center justify-end gap-inline-md border-t border-line-subtle pt-inset-md">
          <Link
            href="/dashboard/personal-log/lab-tracking"
            className={buttonStyles({
              variant: "neutral",
              appearance: "fill-stroke",
            })}
          >
            {l?.addModal?.cancel || "Cancel"}
          </Link>
          <Button
            type="submit"
            leadingIcon={<Plus />}
            loading={labs.isSaving}
            disabled={savedSuccess}
          >
            {l?.addModal?.saveEntry || "Save Entry"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
