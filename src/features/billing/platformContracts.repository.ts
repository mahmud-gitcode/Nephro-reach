/* ==========================================================================
   Platform contracts, invoices, change requests, member subscriptions
   (Phase 14.5–14.6)
   --------------------------------------------------------------------------
   The platform side of office billing. An office's plan IS its contract:
   there is no separate "assignment". Every list is paged (limit ≤ 150).
   The server decides each call: contracts READ to list, WRITE to create,
   activate, renew, end and issue invoices, MANAGE to mark an invoice paid
   and resolve a change request; members READ/WRITE for member
   subscriptions; organizations READ for the organization names.
   No office header is sent (platform routes ignore it anyway).
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type Page, type PageParams } from "@/lib/api/paging";

const NO_OFFICE = { organizationId: null } as const;

export type ContractStatus = "PENDING" | "ACTIVE" | "EXPIRING_SOON" | "ENDED";
export type InvoiceStatus = "DUE" | "PAID" | "OVERDUE";
export type ChangeRequestTopic =
  "seats" | "fee" | "dates" | "contact" | "other";
export type RenewalChoice = "auto" | "review" | "end";
export type MemberSubscriptionStatus =
  "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED";

export type ApiContract = {
  id: string;
  organizationId: string;
  plan: { id: string; code: string; name: string };
  contractNumber: string | null;
  status: ContractStatus;
  startsOn: string;
  endsOn: string | null;
  patientsAllowed: number;
  monthlyFeeCents: number;
  billingCycle: string;
  autoRenew: boolean;
  renewalChoice: string | null;
  primaryContactUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiInvoice = {
  id: string;
  organizationId: string;
  subscriptionId: string;
  number: string;
  periodLabel: string;
  issuedOn: string;
  dueOn: string;
  patientsAllowed: number;
  monthlyFeeCents: number;
  amountCents: number;
  currency: string;
  status: InvoiceStatus;
  paidAt: string | null;
  hasPdf: boolean;
  createdAt: string;
};

export type ApiChangeRequest = {
  id: string;
  organizationId: string;
  topic: ChangeRequestTopic;
  detail: string;
  requestedById: string;
  requestedAt: string;
  resolvedAt: string | null;
  resolvedById: string | null;
};

export type ApiPlatformOrganization = {
  id: string;
  name: string;
  type: string;
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
  timeZone: string;
};

export type ApiMemberSubscription = {
  patientId: string;
  patient: { firstName: string; lastName: string };
  plan: { id: string; code: string; priceCents: number; active: boolean };
  status: MemberSubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  startedAt: string;
  updatedAt: string;
};

/* ---------------------------------------------------------- reads */

export function listContracts(
  params: PageParams & { organizationId?: string; status?: ContractStatus },
): Promise<Page<ApiContract>> {
  const { organizationId, status, ...page } = params;
  return fetchPage<ApiContract>("/platform/contracts", page, {
    ...NO_OFFICE,
    query: { organizationId, status },
  });
}

export function listInvoices(
  params: PageParams & {
    organizationId?: string;
    subscriptionId?: string;
    status?: InvoiceStatus;
  },
): Promise<Page<ApiInvoice>> {
  const { organizationId, subscriptionId, status, ...page } = params;
  return fetchPage<ApiInvoice>("/platform/invoices", page, {
    ...NO_OFFICE,
    query: { organizationId, subscriptionId, status },
  });
}

export function listChangeRequests(
  params: PageParams & {
    organizationId?: string;
    status?: "open" | "resolved";
  },
): Promise<Page<ApiChangeRequest>> {
  const { organizationId, status, ...page } = params;
  return fetchPage<ApiChangeRequest>(
    "/platform/contract-change-requests",
    page,
    {
      ...NO_OFFICE,
      query: { organizationId, status },
    },
  );
}

/** One page of organizations (names for the contract tables). */
export function listPlatformOrganizations(
  params: PageParams & { search?: string },
): Promise<Page<ApiPlatformOrganization>> {
  const { search, ...page } = params;
  return fetchPage<ApiPlatformOrganization>("/platform/organizations", page, {
    ...NO_OFFICE,
    query: { search: search?.trim() || undefined },
  });
}

export function listMemberSubscriptions(
  params: PageParams & {
    status?: MemberSubscriptionStatus;
    planId?: string;
  },
): Promise<Page<ApiMemberSubscription>> {
  const { status, planId, ...page } = params;
  return fetchPage<ApiMemberSubscription>(
    "/platform/member-subscriptions",
    page,
    { ...NO_OFFICE, query: { status, planId } },
  );
}

/* --------------------------------------------------------- writes */

export type CreateContractBody = {
  organizationId: string;
  planId: string;
  status?: "PENDING" | "ACTIVE";
  startsOn: string;
  endsOn?: string | null;
  contractNumber?: string | null;
  patientsAllowed?: number;
  monthlyFeeCents?: number;
  autoRenew?: boolean;
  renewalChoice?: RenewalChoice | null;
};

export function createContract(body: CreateContractBody): Promise<ApiContract> {
  return api<ApiContract>("/platform/contracts", {
    ...NO_OFFICE,
    method: "POST",
    body,
  });
}

export type ContractAction = "activate" | "end";

export function setContractStatus(
  contractId: string,
  action: ContractAction,
): Promise<ApiContract> {
  return api<ApiContract>(
    `/platform/contracts/${encodeURIComponent(contractId)}/${action}`,
    { ...NO_OFFICE, method: "POST" },
  );
}

export type RenewContractBody = {
  startsOn: string;
  endsOn?: string | null;
  planId?: string;
  patientsAllowed?: number;
  monthlyFeeCents?: number;
};

export function renewContract(
  contractId: string,
  body: RenewContractBody,
): Promise<ApiContract> {
  return api<ApiContract>(
    `/platform/contracts/${encodeURIComponent(contractId)}/renew`,
    { ...NO_OFFICE, method: "POST", body },
  );
}

export type CreateInvoiceBody = {
  subscriptionId: string;
  number: string;
  periodLabel: string;
  issuedOn: string;
  dueOn: string;
  amountCents?: number;
};

export function createInvoice(body: CreateInvoiceBody): Promise<ApiInvoice> {
  return api<ApiInvoice>("/platform/invoices", {
    ...NO_OFFICE,
    method: "POST",
    body,
  });
}

export function markInvoicePaid(invoiceId: string): Promise<ApiInvoice> {
  return api<ApiInvoice>(
    `/platform/invoices/${encodeURIComponent(invoiceId)}/mark-paid`,
    { ...NO_OFFICE, method: "POST" },
  );
}

export function resolveChangeRequest(
  requestId: string,
): Promise<ApiChangeRequest> {
  return api<ApiChangeRequest>(
    `/platform/contract-change-requests/${encodeURIComponent(requestId)}/resolve`,
    { ...NO_OFFICE, method: "POST" },
  );
}

export function setMemberSubscription(
  patientId: string,
  body: { planId: string; status: MemberSubscriptionStatus },
): Promise<ApiMemberSubscription> {
  return api<ApiMemberSubscription>(
    `/platform/member-subscriptions/${encodeURIComponent(patientId)}`,
    { ...NO_OFFICE, method: "PUT", body },
  );
}
