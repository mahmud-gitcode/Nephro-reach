"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import {
  Button,
  Card,
  FormField,
  Input,
  Modal,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea,
} from "@/components/ui";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { ORGANIZATIONS, type Organization } from "@/features/staff/staff";

/* ==========================================================================
   Office & clinic subscriptions (client, 2026-10-06)
   --------------------------------------------------------------------------
   The member plans above are what the marketing site sells. Offices and
   clinics are billed on a contract instead, so their plans are kept apart:
   nothing here reaches the landing page's pricing table.

   Frontend only. Charging the plan is Stripe's job once a server exists.
   ========================================================================== */

type Portal = Organization["portal"];

export type OrgPlan = {
  id: string;
  name: string;
  audience: Portal;
  monthlyFee: number;
  patientsIncluded: number;
  description: string;
};

export type OrgSubscriptionStatus = "Active" | "Trial" | "Paused";
const STATUSES: OrgSubscriptionStatus[] = ["Active", "Trial", "Paused"];

type State = {
  plans: OrgPlan[];
  /** orgId → its plan and status. */
  assignments: Record<
    string,
    { planId: string; status: OrgSubscriptionStatus }
  >;
};

const AUDIENCE: Record<Portal, string> = {
  clinic: "Dialysis Center",
  access: "Vascular Access Center",
  nephrology: "Nephrology Office",
};

/* Sample prices for the admin to replace; the dialysis plan matches the
   demo clinic's Contract & Billing page. */
const DEFAULT_STATE: State = {
  plans: [
    {
      id: "dialysis-center",
      name: "Dialysis Center Plan",
      audience: "clinic",
      monthlyFee: 1995,
      patientsIncluded: 150,
      description:
        "Clinic portal, member enrollment, check-ins, travel, rides, CCM and reports.",
    },
    {
      id: "access-center",
      name: "Vascular Access Center Plan",
      audience: "access",
      monthlyFee: 995,
      patientsIncluded: 150,
      description:
        "Access patients, referrals, appointments and messages with offices and patients.",
    },
    {
      id: "nephrology-office",
      name: "Nephrology Office Plan",
      audience: "nephrology",
      monthlyFee: 1495,
      patientsIncluded: 150,
      description:
        "Nephrology portal with CCM time tracking, labs, reports and access center messages.",
    },
  ],
  assignments: {},
};

const KEY = storageKey("org-subscriptions");
const QUERY = ["org-subscriptions"];

function money(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function useOrgSubscriptions() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY,
    queryFn: () => readJson<State>(KEY, DEFAULT_STATE),
  });
  const write = useMutation({
    mutationFn: async (transform: (s: State) => State) =>
      writeJson(KEY, transform(await readJson<State>(KEY, DEFAULT_STATE))),
    onSuccess: (next) => queryClient.setQueryData(QUERY, next),
  });
  return { state: query.data ?? DEFAULT_STATE, change: write.mutate };
}

export function OrganizationSubscriptions() {
  const { state, change } = useOrgSubscriptions();
  const [editing, setEditing] = useState<OrgPlan | "new" | null>(null);

  /* An organisation without a saved choice is on its type's first plan. */
  const assignmentFor = (org: Organization) =>
    state.assignments[org.id] ?? {
      planId: state.plans.find((p) => p.audience === org.portal)?.id ?? "",
      status: "Active" as OrgSubscriptionStatus,
    };
  const assign = (
    orgId: string,
    next: { planId: string; status: OrgSubscriptionStatus },
  ) =>
    change((s) => ({ ...s, assignments: { ...s.assignments, [orgId]: next } }));

  return (
    <section className="mt-stack-2xl space-y-stack-lg">
      <div className="flex flex-col gap-inline-lg sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-heading-4 text-fg">
            Office &amp; Clinic Subscriptions
          </h2>
          <p className="mt-stack-xs measure text-caption text-fg-muted">
            Plans for dialysis centers, vascular access centers and nephrology
            offices. Kept apart from the member plans, so they never show on the
            public pricing page.
          </p>
        </div>
        <Button
          size="small"
          variant="neutral"
          appearance="fill-stroke"
          leadingIcon={<Plus aria-hidden="true" />}
          onClick={() => setEditing("new")}
        >
          Add Office Plan
        </Button>
      </div>

      <Card padding="none">
        <div className="p-card">
          <h3 className="text-heading-5 text-fg">Plans</h3>
        </div>
        <Table minWidth={720}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Plan</TableHeaderCell>
              <TableHeaderCell>For</TableHeaderCell>
              <TableHeaderCell>Monthly fee</TableHeaderCell>
              <TableHeaderCell>Patients included</TableHeaderCell>
              <TableHeaderCell className="text-right">Edit</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell emphasis>
                  {plan.name}
                  <span className="block text-caption text-fg-muted">
                    {plan.description}
                  </span>
                </TableCell>
                <TableCell>{AUDIENCE[plan.audience]}</TableCell>
                <TableCell numeric>{money(plan.monthlyFee)}</TableCell>
                <TableCell numeric>{plan.patientsIncluded}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="small"
                    variant="neutral"
                    appearance="ghost"
                    iconOnly
                    aria-label={`Edit ${plan.name}`}
                    onClick={() => setEditing(plan)}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card padding="none">
        <div className="p-card">
          <h3 className="text-heading-5 text-fg">Organizations</h3>
          <p className="mt-stack-xs text-caption text-fg-muted">
            Which plan each office is on. Payment goes through Stripe once the
            server is connected.
          </p>
        </div>
        <Table minWidth={720}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Organization</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Plan</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ORGANIZATIONS.map((org) => {
              const current = assignmentFor(org);
              const options = state.plans.filter(
                (p) => p.audience === org.portal,
              );
              return (
                <TableRow key={org.id}>
                  <TableCell emphasis>{org.name}</TableCell>
                  <TableCell>{org.kind}</TableCell>
                  <TableCell>
                    <Select
                      selectSize="small"
                      aria-label={`Plan for ${org.name}`}
                      value={current.planId}
                      onChange={(e) =>
                        assign(org.id, { ...current, planId: e.target.value })
                      }
                    >
                      {options.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {money(p.monthlyFee)}/mo
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      selectSize="small"
                      aria-label={`Status for ${org.name}`}
                      value={current.status}
                      onChange={(e) =>
                        assign(org.id, {
                          ...current,
                          status: e.target.value as OrgSubscriptionStatus,
                        })
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {editing ? (
        <PlanModal
          plan={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(plan) => {
            change((s) => ({
              ...s,
              plans: s.plans.some((p) => p.id === plan.id)
                ? s.plans.map((p) => (p.id === plan.id ? plan : p))
                : [...s.plans, plan],
            }));
            setEditing(null);
          }}
        />
      ) : null}
    </section>
  );
}

function PlanModal({
  plan,
  onSave,
  onClose,
}: {
  plan: OrgPlan | null;
  onSave: (plan: OrgPlan) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(plan?.name ?? "");
  const [audience, setAudience] = useState<Portal>(plan?.audience ?? "clinic");
  const [fee, setFee] = useState(String(plan?.monthlyFee ?? ""));
  const [patients, setPatients] = useState(
    String(plan?.patientsIncluded ?? ""),
  );
  const [description, setDescription] = useState(plan?.description ?? "");
  const [tried, setTried] = useState(false);
  const nameError = name.trim() ? undefined : "Give the plan a name.";
  const feeError =
    Number(fee) > 0 ? undefined : "Enter a monthly fee above zero.";
  const patientsError =
    Number.isInteger(Number(patients)) && Number(patients) > 0
      ? undefined
      : "Enter a whole number of patients.";

  return (
    <Modal
      open
      onClose={onClose}
      title={plan ? "Edit Office Plan" : "Add Office Plan"}
      footer={
        <>
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setTried(true);
              if (nameError || feeError || patientsError) return;
              onSave({
                id: plan?.id ?? `org-plan-${Date.now()}`,
                name: name.trim(),
                audience,
                monthlyFee: Number(fee),
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
        <FormField
          label="Plan name"
          required
          error={tried ? nameError : undefined}
        >
          {(field) => (
            <Input
              {...field}
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
              onChange={(e) => setAudience(e.target.value as Portal)}
            >
              {(Object.keys(AUDIENCE) as Portal[]).map((p) => (
                <option key={p} value={p}>
                  {AUDIENCE[p]}
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
                type="number"
                min={0}
                value={fee}
                onChange={(e) => setFee(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}
        </FormField>
      </div>
    </Modal>
  );
}
