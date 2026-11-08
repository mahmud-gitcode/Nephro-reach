"use client";

import React, { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import {
  Alert,
  AsyncSection,
  Button,
  Card,
  FormField,
  Input,
  Modal,
  Select,
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea,
} from "@/components/ui";
import { canRetry } from "@/lib/data/asyncState";
import { useCanLevel } from "@/features/staff/useStaffAccounts";
import {
  ActionError,
  PublishedBadge,
  SkeletonTable,
  actionErrorText,
  readErrorCopy,
} from "./consoleUi";
import { centsToInput, formatCents, parseDollars } from "./money";
import {
  AUDIENCE_LABEL,
  ORG_AUDIENCES,
  type OrgAudience,
} from "./platformPlans.mappers";
import { PlatformContracts } from "./PlatformContracts";
import { useOrgPlans, type AdminOrgPlan } from "./usePlans";

/* ==========================================================================
   Office & clinic subscriptions (Phase 14.5–14.6, on the API)
   --------------------------------------------------------------------------
   The member plans above are what the marketing site sells. Offices and
   clinics are billed on a contract instead, so their plans are kept apart:
   nothing here reaches the landing page's pricing table.
   - Plans: `/platform/organization-plans` (fees in cents; an edit to a
     plan in use is saved by the server as a new version; publish and
     retire need plans MANAGE).
   - An office's plan is its contract (PlatformContracts): there is no
     separate "assignment", and the prototype's Trial/Paused statuses have
     no server equivalent.
   Nothing is kept in this browser; the sample plans are gone.
   ========================================================================== */

const OUTCOME_TEXT = {
  created: "The office plan was created. Publish it to offer it on contracts.",
  updated: "The office plan was saved.",
  versioned:
    "Saved as a new version: offices already on this plan keep their terms; new contracts get the new one.",
} as const;

export function OrganizationSubscriptions() {
  const plans = useOrgPlans();
  const canWrite = useCanLevel("plans", 2);
  const canManage = useCanLevel("plans", 3);
  const [editing, setEditing] = useState<AdminOrgPlan | "new" | null>(null);
  const copy = readErrorCopy(plans.error, "The office plans did not load");

  return (
    <section className="mt-stack-2xl space-y-stack-lg">
      <div className="flex flex-col gap-inline-lg sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-heading-4 text-fg">
            Office &amp; Clinic Subscriptions
          </h2>
          <p className="mt-stack-xs measure text-caption text-fg-muted">
            Plans for dialysis centers, vascular access centers, nephrology
            offices and hospitals. Kept apart from the member plans, so they
            never show on the public pricing page.
          </p>
        </div>
        {canWrite ? (
          <Button
            size="small"
            variant="neutral"
            appearance="fill-stroke"
            leadingIcon={<Plus aria-hidden="true" />}
            onClick={() => {
              plans.dismissSaveError();
              setEditing("new");
            }}
          >
            Add Office Plan
          </Button>
        ) : null}
      </div>

      {plans.outcome ? (
        <Alert tone="success" onDismiss={plans.dismissOutcome}>
          {OUTCOME_TEXT[plans.outcome]}
        </Alert>
      ) : null}
      <ActionError
        error={plans.statusError}
        title="The plan status did not change"
        onDismiss={plans.dismissStatusError}
      />

      <Card padding="none">
        <div className="p-card">
          <h3 className="text-heading-5 text-fg">Plans</h3>
        </div>
        <AsyncSection
          pending={plans.isPending}
          error={plans.error}
          onRetry={canRetry(plans.error) ? plans.refetch : undefined}
          {...copy}
          skeleton={<SkeletonTable rows={4} columns={6} minWidth={820} />}
        >
          <Table minWidth={820}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Plan</TableHeaderCell>
                <TableHeaderCell>For</TableHeaderCell>
                <TableHeaderCell>Monthly fee</TableHeaderCell>
                <TableHeaderCell>Patients included</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">
                  Actions
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plans.plans.length === 0 ? (
                <TableEmptyRow colSpan={6}>
                  <p className="text-body-sm text-fg-muted">
                    No office plans yet.
                  </p>
                </TableEmptyRow>
              ) : null}
              {plans.plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell emphasis>
                    {plan.name}
                    {plan.description ? (
                      <span className="block text-caption text-fg-muted">
                        {plan.description}
                      </span>
                    ) : null}
                    {plan.earlierVersions > 0 ? (
                      <span className="block text-caption text-fg-muted">
                        Version {plan.earlierVersions + 1}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>{plan.audienceLabel}</TableCell>
                  <TableCell numeric>
                    {formatCents(plan.monthlyFeeCents)}
                  </TableCell>
                  <TableCell numeric>{plan.patientsIncluded}</TableCell>
                  <TableCell>
                    <PublishedBadge active={plan.active} />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex flex-wrap justify-end gap-inline-sm">
                      {canManage ? (
                        <Button
                          size="small"
                          variant="neutral"
                          appearance="stroke"
                          loading={plans.statusPendingId === plan.id}
                          onClick={() =>
                            plans.setStatus(
                              plan.id,
                              plan.active ? "retire" : "publish",
                            )
                          }
                          aria-label={`${plan.active ? "Retire" : "Publish"} ${plan.name}`}
                        >
                          {plan.active ? "Retire" : "Publish"}
                        </Button>
                      ) : null}
                      {canWrite ? (
                        <Button
                          size="small"
                          variant="neutral"
                          appearance="ghost"
                          iconOnly
                          aria-label={`Edit ${plan.name}`}
                          onClick={() => {
                            plans.dismissSaveError();
                            setEditing(plan);
                          }}
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                      ) : null}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AsyncSection>
      </Card>

      <PlatformContracts orgPlans={plans.plans} />

      {editing ? (
        <OrgPlanModal
          plan={editing === "new" ? null : editing}
          saving={plans.isSaving}
          error={plans.saveError}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            void plans
              .save(editing === "new" ? null : editing, draft)
              .then(() => setEditing(null))
              .catch(() => {});
          }}
        />
      ) : null}
    </section>
  );
}

function OrgPlanModal({
  plan,
  saving,
  error,
  onSave,
  onClose,
}: {
  plan: AdminOrgPlan | null;
  saving: boolean;
  error: unknown;
  onSave: (draft: {
    name: string;
    audience: OrgAudience;
    monthlyFeeCents: number;
    patientsIncluded: number;
    description: string;
  }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(plan?.name ?? "");
  const [audience, setAudience] = useState<OrgAudience>(
    (ORG_AUDIENCES as readonly string[]).includes(plan?.audience ?? "")
      ? (plan!.audience as OrgAudience)
      : "DIALYSIS_CENTER",
  );
  const [fee, setFee] = useState(
    plan ? centsToInput(plan.monthlyFeeCents) : "",
  );
  const [patients, setPatients] = useState(
    plan ? String(plan.patientsIncluded) : "",
  );
  const [description, setDescription] = useState(plan?.description ?? "");
  const [tried, setTried] = useState(false);

  const cents = parseDollars(fee);
  const nameError = name.trim() ? undefined : "Give the plan a name.";
  const feeError =
    cents !== null && cents > 0
      ? undefined
      : "Enter a monthly fee above zero, in dollars and cents (e.g. 1995.00).";
  const patientsError =
    /^\d+$/.test(patients.trim()) &&
    Number(patients) >= 1 &&
    Number(patients) <= 100_000
      ? undefined
      : "Enter a whole number of patients (1 to 100,000).";

  return (
    <Modal
      open
      onClose={onClose}
      title={plan ? "Edit Office Plan" : "Add Office Plan"}
      footer={
        <>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            loading={saving}
            onClick={() => {
              setTried(true);
              if (nameError || feeError || patientsError || cents === null)
                return;
              onSave({
                name: name.trim(),
                audience,
                monthlyFeeCents: cents,
                patientsIncluded: Number(patients),
                description: description.trim(),
              });
            }}
          >
            Save Plan
          </Button>
        </>
      }
    >
      <div className="space-y-stack-md">
        {error ? (
          <Alert tone="danger" title="The plan was not saved">
            {actionErrorText(error)}
          </Alert>
        ) : null}
        {plan && plan.active ? (
          <Alert tone="info" live={false}>
            If an office is already on this plan, a new fee or patient limit is
            saved as a new version; their contract keeps its terms.
          </Alert>
        ) : null}
        <FormField
          label="Plan name"
          required
          error={tried ? nameError : undefined}
        >
          {(field) => (
            <Input
              {...field}
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </FormField>
        <FormField label="For" required>
          {(field) => (
            <Select
              {...field}
              value={audience}
              onChange={(e) => setAudience(e.target.value as OrgAudience)}
            >
              {ORG_AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {AUDIENCE_LABEL[a]}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <div className="grid grid-cols-1 gap-inline-lg sm:grid-cols-2">
          <FormField
            label="Monthly fee (USD)"
            required
            error={tried ? feeError : undefined}
          >
            {(field) => (
              <Input
                {...field}
                inputMode="decimal"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="1995.00"
              />
            )}
          </FormField>
          <FormField
            label="Patients included"
            required
            error={tried ? patientsError : undefined}
          >
            {(field) => (
              <Input
                {...field}
                type="number"
                min={1}
                value={patients}
                onChange={(e) => setPatients(e.target.value)}
              />
            )}
          </FormField>
        </div>
        <FormField label="What's included">
          {(field) => (
            <Textarea
              {...field}
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}
        </FormField>
      </div>
    </Modal>
  );
}
