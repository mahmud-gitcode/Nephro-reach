"use client";

import React, { useState } from "react";
import {
  Check,
  Circle,
  CircleCheck,
  CircleMinus,
  Contrast,
  Send,
} from "lucide-react";
import { Badge, Button, Select, Switch } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";
import { useLanguageCode } from "@/context/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { userCan } from "@/features/staff/staff";
import { useOfficeOrgId } from "@/features/vascular-access/useAccess";
import { SendReferralModal } from "./AccessReferrals";
import { useOfficePatientByMrn, useReferrals } from "./useAccessReferrals";
import { usDate } from "./ccm.data";
import type { CcmKidneyCarePlan, KidneyCareBody } from "./ccm.repository";
import {
  ACCESS_TYPE_CHOICES,
  ACCESS_TYPE_LABEL_ES,
  KRT_ANSWERS,
  KRT_ANSWER_LABEL_ES,
  KRT_ITEMS,
  KRT_ITEM_LABEL_ES,
  PROGRESS_STEPS,
  PROGRESS_STEP_LABEL_ES,
  accessProgress,
  milestones,
  type AccessTypeChoice,
  type KidneyCarePlan,
  type KrtAnswer,
  type MilestoneState,
} from "./kidneyCare";

/* ==========================================================================
   CKD Access / Kidney Replacement Therapy Planning — the CCM patient popup
   --------------------------------------------------------------------------
   Milestones at a glance, the access center's progress once a referral is
   placed, then the checklist the office fills in. Every change is one
   PATCH …/ccm/enrollments/{patientId}/kidney-care; the server stamps who
   made it and when (Phase 9). See kidneyCare.ts for the rules.
   ========================================================================== */

const glyph: Record<
  MilestoneState,
  { icon: typeof Circle; className: string; label: string; labelEs: string }
> = {
  done: {
    icon: CircleCheck,
    className: "text-success",
    label: "Done",
    labelEs: "Hecho",
  },
  partial: {
    icon: Contrast,
    className: "text-warning-glyph",
    label: "In progress",
    labelEs: "En curso",
  },
  todo: {
    icon: Circle,
    className: "text-fg-subtle",
    label: "Not yet",
    labelEs: "Aún no",
  },
  na: {
    icon: CircleMinus,
    className: "text-fg-subtle",
    label: "N/A",
    labelEs: "N/A",
  },
};

/** The server's plan in the shape the milestone rules read. */
function planOf(plan: CcmKidneyCarePlan | null): KidneyCarePlan | undefined {
  if (!plan) return undefined;
  return {
    answers: plan.answers as KidneyCarePlan["answers"],
    ...(plan.accessType
      ? { accessType: plan.accessType as AccessTypeChoice }
      : {}),
    ehrDocumented: plan.ehrDocumented,
    ...(plan.updatedOn ? { updatedOn: plan.updatedOn } : {}),
  };
}

export function KidneyCareSection({
  patient,
  serverPlan,
  onSave,
  canEdit,
}: {
  /** `patientId` (the API id) reads and sends referrals. The CCM page
   *  (Phase 9, by patient id) always passes it; the MRN is display text and,
   *  only without an id, the exact roster lookup below. */
  patient: { name: string; mrn: string; patientId?: string };
  serverPlan: CcmKidneyCarePlan | null;
  onSave: (body: KidneyCareBody) => void;
  /** The signed-in role may update the checklist. */
  canEdit: boolean;
}) {
  const { user } = useAuth();
  const isEs = useLanguageCode() === "ES";
  /* Phase 10: the practice's referrals for this patient, from the API by
     patient id. The CCM page (Phase 9) passes the id; without one, the
     patient is found on this office's own roster by its MRN, and only when
     exactly one ACTIVE patient has it. The access record itself is the
     access and dialysis centers', so progress follows the referral. */
  const orgId = useOfficeOrgId();
  const byMrn = useOfficePatientByMrn(orgId, patient.mrn, {
    enabled: !patient.patientId,
  });
  const target = patient.patientId
    ? { patientId: patient.patientId, name: patient.name, mrn: patient.mrn }
    : byMrn.patient;
  const patientId = target?.patientId ?? null;
  const access = useReferrals(
    orgId,
    { patientId: patientId ?? undefined },
    { enabled: !!patientId },
  );
  const [referring, setReferring] = useState(false);

  const plan = planOf(serverPlan);
  const referrals = patientId
    ? access.referrals.filter((r) => r.patient?.id === patientId)
    : [];
  const progress = accessProgress(plan, referrals, undefined);
  const marks = milestones(plan, progress, isEs);
  const sent = referrals.some((r) => r.kind !== "General Message");
  const showSend =
    plan?.answers.accessReferral === "Yes" &&
    !sent &&
    !access.isPending &&
    !access.error &&
    userCan(user, "messages.reply");
  const canSend = showSend && !!patientId;
  /* Shown, but honestly unavailable, when this patient cannot be matched
     to one patient on the practice's list (or that list cannot be read). */
  const unmatched = showSend && !patientId && !byMrn.isPending;

  const save = (change: {
    answers?: Partial<Record<string, KrtAnswer | undefined>>;
    accessType?: AccessTypeChoice;
    ehrDocumented?: boolean;
  }) =>
    onSave({
      ...(change.answers
        ? {
            answers: Object.fromEntries(
              Object.entries(change.answers).map(([id, a]) => [id, a ?? null]),
            ),
          }
        : {}),
      ...(change.accessType !== undefined
        ? { accessType: change.accessType }
        : {}),
      ...(change.ehrDocumented !== undefined
        ? { ehrDocumented: change.ehrDocumented }
        : {}),
    });

  return (
    <section>
      <div className="mb-stack-sm flex flex-wrap items-baseline justify-between gap-inline-md">
        <h3 className="text-heading-5 text-fg">
          {isEs
            ? "Acceso para ERC / Planificación de la terapia de reemplazo renal"
            : "CKD Access / Kidney Replacement Therapy Planning"}
        </h3>
        <span className="text-caption text-fg-muted">
          {plan?.updatedOn
            ? `${isEs ? "Última actualización" : "Last updated"} ${usDate(plan.updatedOn.slice(0, 10))}`
            : isEs
              ? "Sin iniciar"
              : "Not started"}
        </span>
      </div>

      <div className="space-y-stack-md rounded-card-nested border border-line p-inset-md">
        {/* At a glance */}
        <div>
          <p className="mb-stack-sm text-label-md text-fg">
            {isEs ? "Hitos del cuidado renal" : "Kidney Care Milestones"}
          </p>
          <ul className="grid gap-x-inline-lg gap-y-stack-xs sm:grid-cols-2">
            {marks.map((mark) => {
              const g = glyph[mark.state];
              const Icon = g.icon;
              return (
                <li
                  key={mark.label}
                  className="flex items-center gap-inline-sm text-body-sm text-fg"
                >
                  <Icon
                    aria-hidden="true"
                    className={cn("size-5 shrink-0", g.className)}
                  />
                  <span>{mark.label}</span>
                  <span className="sr-only">
                    : {isEs ? g.labelEs : g.label}
                  </span>
                  {mark.state === "na" ? (
                    <span className="text-caption text-fg-muted">N/A</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        {/* The referral at the access center, once the practice placed one */}
        {progress > 0 ? (
          <div className="border-t border-line pt-stack-md">
            <p className="mb-stack-sm text-label-md text-fg">
              {isEs
                ? "Progreso de la derivación de acceso"
                : "Access Referral Progress"}
              <span className="ml-inline-sm text-caption font-normal text-fg-muted">
                {referrals[0]
                  ? `${isEs ? "en" : "at"} ${referrals[0].to.name}`
                  : null}
              </span>
            </p>
            <ol className="flex flex-wrap items-center gap-inline-sm">
              {PROGRESS_STEPS.map((step, i) => {
                const reached = i < progress;
                return (
                  <li key={step} className="flex items-center gap-inline-sm">
                    <Badge
                      tone={reached ? "success" : "neutral"}
                      icon={reached ? <Check aria-hidden="true" /> : undefined}
                    >
                      {isEs ? PROGRESS_STEP_LABEL_ES[step] : step}
                      <span className="sr-only">
                        {reached
                          ? isEs
                            ? " (alcanzado)"
                            : " (reached)"
                          : isEs
                            ? " (aún no)"
                            : " (not yet)"}
                      </span>
                    </Badge>
                    {i < PROGRESS_STEPS.length - 1 ? (
                      <span aria-hidden="true" className="text-fg-subtle">
                        →
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}

        {canSend || unmatched ? (
          <div className="flex flex-wrap items-center justify-between gap-inline-md rounded-card-nested bg-surface-sunken p-inset-sm">
            <p className="text-body-sm text-fg-secondary">
              {canSend
                ? isEs
                  ? "Derivación marcada como realizada. Envíela al centro de acceso vascular para seguir su progreso aquí."
                  : "Referral marked as placed. Send it to the access center to follow its progress here."
                : isEs
                  ? "El envío desde aquí aún no está disponible para este paciente: no se pudo asociar con un único paciente de la lista de su consultorio. Envíela desde Mensajes del centro de acceso vascular."
                  : "Sending from here is not available yet for this patient: they could not be matched to one patient on your practice's list. Send it from Access Center Messages instead."}
            </p>
            <Button
              size="small"
              leadingIcon={<Send aria-hidden="true" />}
              {...(canSend
                ? { onClick: () => setReferring(true) }
                : notBuiltYet(
                    isEs
                      ? "Enviar esta derivación desde CCM"
                      : "Sending this referral from CCM",
                    isEs,
                  ))}
            >
              {isEs
                ? "Enviar al centro de acceso vascular"
                : "Send to Access Center"}
            </Button>
          </div>
        ) : null}

        {/* The checklist */}
        <ul className="divide-y divide-line-subtle border-t border-line pt-stack-sm">
          {KRT_ITEMS.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-inline-md py-inset-xs"
            >
              <span className="text-label-md text-fg">
                {isEs ? KRT_ITEM_LABEL_ES[item.id] : item.label}
              </span>
              <div className="w-36 shrink-0">
                <Select
                  selectSize="small"
                  aria-label={isEs ? KRT_ITEM_LABEL_ES[item.id] : item.label}
                  className="w-full"
                  disabled={!canEdit}
                  value={plan?.answers[item.id] ?? ""}
                  onChange={(e) =>
                    save({
                      answers: {
                        [item.id]: (e.target.value || undefined) as
                          KrtAnswer | undefined,
                      },
                    })
                  }
                >
                  <option value="">—</option>
                  {KRT_ANSWERS.map((answer) => (
                    <option key={answer} value={answer}>
                      {isEs ? KRT_ANSWER_LABEL_ES[answer] : answer}
                    </option>
                  ))}
                </Select>
              </div>
            </li>
          ))}
          <li className="flex items-center justify-between gap-inline-md py-inset-xs">
            <span className="text-label-md text-fg">
              {isEs ? "Tipo de acceso" : "Access type"}
            </span>
            <div className="w-36 shrink-0">
              <Select
                selectSize="small"
                aria-label={isEs ? "Tipo de acceso" : "Access type"}
                className="w-full"
                disabled={!canEdit}
                value={plan?.accessType ?? ""}
                onChange={(e) =>
                  save({ accessType: e.target.value as AccessTypeChoice })
                }
              >
                {plan?.accessType ? null : <option value="">—</option>}
                {ACCESS_TYPE_CHOICES.map((choice) => (
                  <option key={choice} value={choice}>
                    {isEs ? ACCESS_TYPE_LABEL_ES[choice] : choice}
                  </option>
                ))}
              </Select>
            </div>
          </li>
          <li className="flex items-center justify-between gap-inline-md py-inset-xs">
            <span className="text-label-md text-fg">
              {isEs ? "Documentación en el EHR" : "Documentation in EHR"}
            </span>
            <Switch
              size="small"
              label={isEs ? "Documentación en el EHR" : "Documentation in EHR"}
              checked={plan?.ehrDocumented ?? false}
              disabled={!canEdit}
              onChange={(on) => save({ ehrDocumented: on })}
            />
          </li>
        </ul>

        <p className="text-caption text-fg-muted">
          {isEs
            ? "Seguimiento ingresado solo por el consultorio. Las decisiones clínicas y la documentación siguen a cargo del consultorio."
            : "Practice-entered tracking only. Clinical decisions and documentation remain with the practice."}
        </p>
      </div>

      {referring && target ? (
        <SendReferralModal
          side="nephrology"
          orgId={orgId}
          patients={[target]}
          initialPatientId={target.patientId}
          initialKind="New Access Referral"
          onClose={() => setReferring(false)}
        />
      ) : null}
    </section>
  );
}
