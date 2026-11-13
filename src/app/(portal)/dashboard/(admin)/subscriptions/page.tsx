"use client";

import { OrganizationSubscriptions } from "@/features/billing/OrganizationSubscriptions";
import React, { useState } from "react";
import { Check, CreditCard, Plus, X, Edit3, ShieldAlert } from "lucide-react";
import {
  Alert,
  AsyncSection,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
  Select,
  Skeleton,
  SwitchRow,
  Textarea,
} from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { useCanLevel } from "@/features/staff/useStaffAccounts";
import { canRetry } from "@/lib/data/asyncState";
import {
  ActionError,
  PublishedBadge,
  actionErrorText,
  readErrorCopy,
} from "@/features/billing/consoleUi";
import { centsToInput, parseDollars } from "@/features/billing/money";
import type { MemberPlanDraft } from "@/features/billing/platformPlans.mappers";
import { usePlans, type AdminMemberPlan } from "@/features/billing/usePlans";

/* ==========================================================================
   Subscription & pricing plans (Phase 14.5, on the API)
   --------------------------------------------------------------------------
   The member plans are `/platform/member-plans`: prices in cents (the label
   is derived from the cents, never parsed from text), one plan per call.
   - Edit and Add need plans WRITE; Publish and Retire need plans MANAGE.
     The UI hides what the role cannot do; the server refuses it anyway.
   - Editing the price or features of a plan members are on is saved by the
     server as a NEW version; members keep the old terms. The card says so.
   - A new plan starts unpublished; only published plans reach the landing
     page's pricing table (its own public reader, D14).
   Nothing is kept in this browser.
   ========================================================================== */

type SubscriptionPlan = AdminMemberPlan & { earlierVersions: number };

function FeatureIcon({ included }: { included: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border border-line bg-surface"
    >
      {included ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <X className="h-4 w-4 text-fg-subtle" />
      )}
    </span>
  );
}

function PricingCard({
  plan,
  onEdit,
  canEdit,
  canManage,
  statusPending,
  onStatus,
}: {
  plan: SubscriptionPlan;
  onEdit: (plan: SubscriptionPlan) => void;
  canEdit: boolean;
  canManage: boolean;
  statusPending: boolean;
  onStatus: (plan: SubscriptionPlan) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const card = (
    <article
      className={`flex h-full flex-col justify-between gap-inset-lg overflow-hidden rounded-panel border border-line p-inset-lg transition-shadow duration-300 ${
        plan.popular
          ? "bg-gradient-to-b from-surface to-primary-soft"
          : "bg-surface-sunken"
      }`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2
            className={`text-heading-5 ${
              plan.popular ? "text-fg-brand" : "text-fg-secondary"
            }`}
          >
            {plan.name}
          </h2>
          <PublishedBadge active={plan.active} />
        </div>

        <div className="flex flex-wrap items-baseline gap-1">
          <span className="text-metric-md text-fg">{plan.price}</span>
          <span className="text-body-sm text-fg-muted">{plan.billing}</span>
        </div>

        {plan.accessDays && (
          <div className="inline-flex items-center gap-inline-sm rounded-control-small bg-primary-soft px-inset-xs py-1 text-label-sm text-primary-fg">
            {isEs
              ? `Acceso completo: ${plan.accessDays} días`
              : `Full Access: ${plan.accessDays} Days`}
          </div>
        )}

        {plan.earlierVersions > 0 ? (
          <p className="text-caption text-fg-muted">
            {isEs
              ? `Versión ${plan.earlierVersions + 1}: los miembros con una versión anterior conservan sus condiciones.`
              : `Version ${plan.earlierVersions + 1}: members on an earlier version keep its terms.`}
          </p>
        ) : null}

        {canEdit ? (
          <Button
            variant="neutral"
            appearance="fill"
            size="small"
            onClick={() => onEdit(plan)}
            className="w-full"
          >
            <Edit3 aria-hidden="true" />
            {isEs ? "Editar plan" : "Edit Plan"}
          </Button>
        ) : null}
        {canManage ? (
          <Button
            variant="neutral"
            appearance="stroke"
            size="small"
            loading={statusPending}
            onClick={() => onStatus(plan)}
            className="w-full"
            aria-label={
              isEs
                ? `${plan.active ? "Retirar" : "Publicar"} ${plan.name}`
                : `${plan.active ? "Retire" : "Publish"} ${plan.name}`
            }
          >
            {isEs
              ? plan.active
                ? "Retirar plan"
                : "Publicar plan"
              : plan.active
                ? "Retire Plan"
                : "Publish Plan"}
          </Button>
        ) : null}
      </div>

      <div className="border-t border-dashed border-line" />

      <ul className="space-y-3">
        {plan.features.map((feature, idx) => (
          <li
            key={`${feature.label}-${idx}`}
            className="flex items-start gap-2.5"
          >
            <FeatureIcon included={feature.included} />
            <span
              className={`text-caption ${
                feature.included
                  ? "text-fg-secondary"
                  : "text-fg-subtle line-through"
              }`}
            >
              {feature.label}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );

  if (!plan.popular) return card;

  return (
    // The "most popular" frame is a deliberate three-hue gradient, the one
    // decorative flourish on this page. It takes the categorical steps rather
    // than status colours, which would have read as good → bad.
    <div className="flex h-full flex-col rounded-panel bg-gradient-to-r from-cat-6 via-cat-7 to-cat-8 p-1 pt-2.5 shadow-raised">
      <p className="mb-stack-sm text-center text-overline text-fg-inverse">
        {plan.badge || (isEs ? "Más popular" : "Most Popular")}
      </p>
      <div className="flex-1">{card}</div>
    </div>
  );
}

function EditPlanModal({
  plan,
  saving,
  error,
  onSave,
  onClose,
}: {
  plan: SubscriptionPlan | "new";
  saving: boolean;
  error: unknown;
  onSave: (draft: MemberPlanDraft) => void;
  onClose: () => void;
}) {
  const isNew = plan === "new";

  const [name, setName] = useState(isNew ? "" : plan.name);
  const [price, setPrice] = useState(
    isNew ? "" : centsToInput(plan.priceCents),
  );
  const [billing, setBilling] = useState(isNew ? "/Month" : plan.billing);
  const [billingType, setBillingType] = useState<"recurring" | "one_time">(
    isNew ? "recurring" : plan.billingType,
  );
  const [billingPeriodLabel, setBillingPeriodLabel] = useState(
    isNew ? "Recurring monthly" : plan.billingPeriodLabel,
  );
  const [accessDays, setAccessDays] = useState<string>(
    !isNew && plan.accessDays ? String(plan.accessDays) : "",
  );
  const [trialDays, setTrialDays] = useState<string>(
    !isNew && plan.trialDays ? String(plan.trialDays) : "",
  );
  const [description, setDescription] = useState(isNew ? "" : plan.description);
  const [popular, setPopular] = useState(isNew ? false : !!plan.popular);
  const [badge] = useState(isNew ? "" : plan.badge || "");
  const [tried, setTried] = useState(false);
  const priceCents = parseDollars(price);
  const { language } = useLanguage();
  const isEs = language === "ES";
  const nameError = name.trim()
    ? undefined
    : isEs
      ? "Póngale un nombre al plan."
      : "Give the plan a name.";
  const priceError =
    priceCents === null
      ? isEs
        ? "Ingrese el precio en dólares y centavos, p. ej., 4.99."
        : "Enter the price in dollars and cents, e.g. 4.99."
      : undefined;
  const accessError =
    accessDays === "" ||
    (/^\d+$/.test(accessDays) &&
      Number(accessDays) >= 1 &&
      Number(accessDays) <= 3650)
      ? undefined
      : isEs
        ? "Ingrese días enteros de 1 a 3650, o déjelo en blanco."
        : "Enter whole days from 1 to 3650, or leave it blank.";
  const trialError =
    trialDays === "" || (/^\d+$/.test(trialDays) && Number(trialDays) <= 365)
      ? undefined
      : isEs
        ? "Ingrese días enteros de 0 a 365, o déjelo en blanco."
        : "Enter whole days from 0 to 365, or leave it blank.";
  const [features, setFeatures] = useState<
    Array<{ label: string; included: boolean }>
  >(
    isNew
      ? [
          { label: "7-day free trial included", included: true },
          { label: "Core NephroReach platform", included: true },
          { label: "Education library access", included: true },
          { label: "Patient logs & tracking tools", included: true },
          { label: "Live classes & Q&A", included: false },
        ]
      : plan.features,
  );
  const [newFeatureText, setNewFeatureText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (nameError || priceError || accessError || trialError) return;

    onSave({
      name: name.trim(),
      priceCents: priceCents!,
      billing: billing.trim(),
      billingType,
      billingPeriodLabel: billingPeriodLabel.trim(),
      accessDays: accessDays ? Number(accessDays) : null,
      trialDays: trialDays ? Number(trialDays) : null,
      description: description.trim(),
      popular,
      badge: badge.trim() || null,
      features,
    });
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures([
      ...features,
      { label: newFeatureText.trim(), included: true },
    ]);
    setNewFeatureText("");
  };

  const handleToggleFeature = (index: number) => {
    setFeatures(
      features.map((f, i) =>
        i === index ? { ...f, included: !f.included } : f,
      ),
    );
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={
        isNew
          ? isEs
            ? "Crear nuevo plan de suscripción"
            : "Create New Subscription Plan"
          : isEs
            ? `Editar plan: ${plan.name}`
            : `Edit Plan: ${plan.name}`
      }
      description={
        isEs
          ? "Edite precios, ciclo de facturación, períodos de acceso y permisos de funciones de forma dinámica."
          : "Edit pricing, billing cycle, access periods, and feature permissions dynamically."
      }
      footer={
        <>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={onClose}
            disabled={saving}
          >
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button type="submit" form="subscription-plan-form" loading={saving}>
            {isEs ? "Guardar cambios" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form
        id="subscription-plan-form"
        className="space-y-stack-xl"
        onSubmit={handleSubmit}
        noValidate
      >
        {error ? (
          <Alert
            tone="danger"
            title={
              isEs
                ? "Los cambios del plan no se guardaron"
                : "Your plan changes were not saved"
            }
          >
            {actionErrorText(error, isEs)}
          </Alert>
        ) : null}
        {!isNew && plan.active ? (
          <Alert tone="info" live={false}>
            {isEs
              ? "Si hay miembros en este plan, un nuevo precio o una nueva lista de funciones se guarda como una nueva versión: ellos conservan sus condiciones actuales."
              : "If members are on this plan, a new price or feature list is saved as a new version: they keep their current terms."}
          </Alert>
        ) : null}
        {/* Plan Name */}
        <FormField
          label={isEs ? "Nombre del plan" : "Plan Name"}
          required
          error={tried ? nameError : undefined}
        >
          {(props) => (
            <Input
              {...props}
              type="text"
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                isEs
                  ? "p. ej., Membresía Esencial"
                  : "e.g. Essential Membership"
              }
            />
          )}
        </FormField>

        {/* Price & Billing Unit */}
        <div className="grid grid-cols-2 gap-inline-lg">
          <FormField
            label={isEs ? "Precio ($ USD)" : "Price ($ USD)"}
            required
            error={tried ? priceError : undefined}
          >
            {(props) => (
              <div className="relative flex items-center">
                <span
                  aria-hidden="true"
                  className="absolute left-3 text-label-md text-fg-muted"
                >
                  $
                </span>
                <Input
                  {...props}
                  type="text"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="4.99"
                  className="pl-7"
                />
              </div>
            )}
          </FormField>
          <FormField label={isEs ? "Sufijo de facturación" : "Billing Suffix"}>
            {(props) => (
              <Input
                {...props}
                type="text"
                value={billing}
                maxLength={40}
                onChange={(e) => setBilling(e.target.value)}
                placeholder={
                  isEs
                    ? "p. ej., /Mes, /Clase o Pago único"
                    : "e.g. /Month, /Class, or One-time"
                }
              />
            )}
          </FormField>
        </div>

        {/* Billing Type & Access Duration */}
        <div className="grid grid-cols-2 gap-inline-lg">
          <FormField label={isEs ? "Tipo de facturación" : "Billing Type"}>
            {(props) => (
              <Select
                {...props}
                value={billingType}
                onChange={(e) => {
                  const val = e.target.value as "recurring" | "one_time";
                  setBillingType(val);
                  if (val === "recurring")
                    setBillingPeriodLabel("Recurring monthly");
                  else setBillingPeriodLabel("One-time payment");
                }}
              >
                <option value="recurring">
                  {isEs ? "Recurrente (mensual)" : "Recurring (Monthly)"}
                </option>
                <option value="one_time">
                  {isEs ? "Compra única" : "One-time Purchase"}
                </option>
              </Select>
            )}
          </FormField>
          <FormField
            label={isEs ? "Período de acceso (días)" : "Access Period (Days)"}
            error={tried ? accessError : undefined}
          >
            {(props) => (
              <Input
                {...props}
                type="number"
                value={accessDays}
                onChange={(e) => setAccessDays(e.target.value)}
                placeholder={
                  isEs
                    ? "p. ej., 21 para el Recorrido de 21 Días"
                    : "e.g. 21 for 21-Day Journey"
                }
              />
            )}
          </FormField>
        </div>

        {/* Free Trial Period */}
        <FormField
          label={
            isEs
              ? "Período de prueba gratuita (días)"
              : "Free Trial Period (Days)"
          }
          hint={
            isEs
              ? "Otorga días de prueba gratuita antes de que comience el pago recurrente (p. ej., 7 días)."
              : "Grants free trial days before recurring payment begins (e.g. 7 days)."
          }
          error={tried ? trialError : undefined}
        >
          {(props) => (
            <Input
              {...props}
              type="number"
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
              placeholder={
                isEs
                  ? "p. ej., 7 (déjelo en blanco si no hay prueba)"
                  : "e.g. 7 (leave blank if no trial)"
              }
            />
          )}
        </FormField>

        {/* Description */}
        <FormField label={isEs ? "Descripción" : "Description"}>
          {(props) => (
            <Textarea
              {...props}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={2}
              placeholder={
                isEs
                  ? "Lo que incluye este plan..."
                  : "What this plan includes..."
              }
            />
          )}
        </FormField>

        {/* Most Popular Toggle */}
        {/* Was a bare <button> drawing a track and a knob: no role="switch",
              no aria-checked, and focus:outline-none removed the focus ring. */}
        <SwitchRow
          checked={popular}
          onChange={setPopular}
          title={
            isEs ? "Destacar como Más popular" : "Highlight as Most Popular"
          }
          description={
            isEs
              ? "Aplica una insignia con degradado y énfasis en la página de inicio"
              : "Applies gradient badge and emphasis on the landing page"
          }
        />

        {/* Features Management */}
        <div>
          <p className="mb-stack-xs text-overline text-fg-muted">
            {isEs
              ? `Funciones incluidas (${features.length})`
              : `Included Features (${features.length})`}
          </p>
          <div className="max-h-[160px] space-y-stack-sm overflow-y-auto rounded-control border border-line bg-surface-sunken p-inset-xs">
            {features.map((feat, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-inline-md rounded-control border border-line bg-surface p-inset-xs"
              >
                {/* Was a plain button toggling a tick: role and state now
                      say so, and the name says which feature. */}
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={feat.included}
                  onClick={() => handleToggleFeature(index)}
                  className="flex flex-1 cursor-pointer items-center gap-inline-md rounded-control-small text-left text-caption focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-control-small ${
                      feat.included
                        ? "bg-success-600 text-white"
                        : "bg-line text-fg-subtle"
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span
                    className={
                      feat.included
                        ? "text-fg-secondary"
                        : "text-fg-subtle line-through"
                    }
                  >
                    {feat.label}
                  </span>
                </button>
                <Button
                  variant="danger"
                  appearance="stroke"
                  size="small"
                  className="px-inset-xs"
                  onClick={() => handleRemoveFeature(index)}
                  aria-label={
                    isEs
                      ? `Quitar función: ${feat.label}`
                      : `Remove feature: ${feat.label}`
                  }
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-stack-sm flex gap-inline-md">
            <label htmlFor="new-feature" className="sr-only">
              {isEs ? "Agregar una nueva función" : "Add a new feature"}
            </label>
            <Input
              id="new-feature"
              inputSize="small"
              type="text"
              value={newFeatureText}
              maxLength={200}
              onChange={(e) => setNewFeatureText(e.target.value)}
              placeholder={
                isEs ? "Agregar una nueva función..." : "Add a new feature..."
              }
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddFeature();
                }
              }}
            />
            <Button
              variant="neutral"
              appearance="fill"
              size="small"
              onClick={handleAddFeature}
            >
              <Plus aria-hidden="true" />
              {isEs ? "Agregar" : "Add"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function SubscriptionsPage() {
  const {
    plans,
    isPending,
    error,
    refetch,
    save,
    isSaving,
    saveError,
    dismissSaveError,
    outcome,
    dismissOutcome,
    setStatus,
    statusPendingId,
    statusError,
    dismissStatusError,
  } = usePlans();
  const canEdit = useCanLevel("plans", 2);
  const canManage = useCanLevel("plans", 3);
  const { language } = useLanguage();
  const isEs = language === "ES";

  const [editingPlan, setEditingPlan] = useState<
    SubscriptionPlan | "new" | null
  >(null);

  /* The message waits for the server: a version, an edit in place, or a
     new (unpublished) plan are three different outcomes. */
  const handleSavePlan = (draft: MemberPlanDraft) => {
    const target = editingPlan === "new" ? null : editingPlan;
    void save(target, draft)
      .then(() => setEditingPlan(null))
      .catch(() => {});
  };
  const copy = readErrorCopy(
    error,
    isEs ? "Los planes no se cargaron" : "The plans did not load",
    isEs,
  );
  const published = plans.filter((plan) => plan.active);
  const recurring = published.filter(
    (plan) => plan.billingType === "recurring",
  ).length;
  const unknown = isPending || Boolean(error);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-heading-4 text-fg">
            {isEs
              ? "Planes de suscripción y precios"
              : "Subscription & Pricing Plans"}
          </h1>
          <p className="mt-stack-xs measure text-caption text-fg-muted">
            {isEs
              ? "Administre los paquetes para miembros, los precios, los períodos de prueba y los permisos de funciones. Los planes publicados aparecen en la página de inicio."
              : "Manage the member packages, prices, trial periods, and feature permissions. Published plans show on the landing page."}
          </p>
        </div>
        {canEdit ? (
          <Button
            size="small"
            onClick={() => {
              dismissSaveError();
              setEditingPlan("new");
            }}
          >
            <Plus aria-hidden="true" />
            {isEs ? "Agregar nuevo plan" : "Add New Plan"}
          </Button>
        ) : null}
      </div>

      {outcome ? (
        <Alert
          tone="success"
          className="mb-stack-xl"
          onDismiss={dismissOutcome}
        >
          {outcome === "versioned"
            ? isEs
              ? "Se guardó como una nueva versión. Los miembros que ya tienen este plan conservan sus condiciones actuales; los nuevos miembros reciben la nueva."
              : "Saved as a new version. Members already on this plan keep their current terms; new members get the new one."
            : outcome === "created"
              ? isEs
                ? "Se creó el plan. No aparece en la página de inicio hasta que se publique."
                : "The plan was created. It is not on the landing page until it is published."
              : isEs
                ? "Cambios guardados."
                : "Changes saved."}
        </Alert>
      ) : null}
      <ActionError
        error={statusError}
        title={
          isEs
            ? "El estado del plan no cambió"
            : "The plan status did not change"
        }
        onDismiss={dismissStatusError}
        className="mb-stack-xl"
      />

      {/* Developer Rules & Notice Card */}
      <Alert
        tone="info"
        live={false}
        icon={<ShieldAlert />}
        title={
          isEs
            ? "Reglas del cliente para desarrolladores aplicadas"
            : "Client Developer Rules Applied"
        }
        className="mb-stack-2xl"
      >
        <ul className="list-disc space-y-stack-xs pl-5 text-caption">
          {isEs ? (
            <>
              <li>
                <strong>Recorrido de Diálisis de 21 Días ($49.99):</strong>{" "}
                Otorga 21 días de acceso a la Membresía Completa al comenzar; el
                acceso al plan de estudios es de por vida. Después del día 21,
                invita automáticamente a renovar con la membresía Esencial o
                Completa.
              </li>
              <li>
                <strong>Solo clase en vivo ($10.00):</strong> Desbloqueo único
                de una sola clase sin crear suscripciones recurrentes.
              </li>
              <li>
                <strong>Nada fijo en el código:</strong> Cada nivel se edita
                aquí y se guarda en el servidor; la página de inicio muestra los
                publicados.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong>21-Day Dialysis Journey ($49.99):</strong> Grants 21
                days of Full Membership access upon start; curriculum access is
                lifetime. Auto-prompts for Essential or Full renewal after Day
                21.
              </li>
              <li>
                <strong>Live Class Only ($10.00):</strong> One-time single class
                unlock without creating recurring subscriptions.
              </li>
              <li>
                <strong>Zero Hard-Coding:</strong> Every tier is edited here and
                saved on the server; the landing page shows the published ones.
              </li>
            </>
          )}
        </ul>
      </Alert>

      {/* 4 Plans Grid */}
      <AsyncSection
        pending={isPending}
        error={error}
        onRetry={canRetry(error) ? refetch : undefined}
        {...copy}
        isEmpty={plans.length === 0}
        empty={
          <EmptyState
            title={
              isEs ? "Aún no hay planes para miembros" : "No member plans yet"
            }
            description={
              isEs
                ? "Agregue un plan y luego publíquelo para mostrarlo en la página de inicio."
                : "Add a plan, then publish it to show it on the landing page."
            }
          />
        }
        skeleton={
          <section className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Skeleton height={420} />
            <Skeleton height={420} />
            <Skeleton height={420} />
            <Skeleton height={420} />
          </section>
        }
      >
        <section className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              canEdit={canEdit}
              canManage={canManage}
              statusPending={statusPendingId === plan.id}
              onStatus={(p) => setStatus(p.id, p.active ? "retire" : "publish")}
              onEdit={(p) => {
                dismissSaveError();
                setEditingPlan(p);
              }}
            />
          ))}
        </section>
      </AsyncSection>

      {/* Overview Analytics Bar */}
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          [
            isEs ? "Productos activos" : "Active Products",
            unknown
              ? "—"
              : isEs
                ? `${published.length} publicados`
                : `${published.length} Published`,
          ],
          [
            isEs ? "Tipos de suscripción" : "Subscription Types",
            unknown
              ? "—"
              : isEs
                ? `${recurring} recurrentes + ${published.length - recurring} de pago único`
                : `${recurring} Recurring + ${published.length - recurring} One-Time`,
          ],
          [
            isEs ? "Almacenamiento de planes" : "Plan Storage",
            isEs ? "Guardado en el servidor" : "Saved on the server",
          ],
        ].map(([label, value]) => (
          <Card as="article" key={label} padding="none" className="p-inset-lg">
            <div
              aria-hidden="true"
              className="mb-stack-md flex h-9 w-9 items-center justify-center rounded-control bg-primary-soft text-fg-brand"
            >
              <CreditCard className="h-4 w-4" />
            </div>
            <p className="text-label-sm text-fg-muted">{label}</p>
            <p className="mt-stack-xs text-metric-sm text-fg">{value}</p>
          </Card>
        ))}
      </section>

      <OrganizationSubscriptions />

      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          saving={isSaving}
          error={saveError}
          onSave={handleSavePlan}
          onClose={() => setEditingPlan(null)}
        />
      )}
    </>
  );
}
