/* ==========================================================================
   Office billing: one function per server operation (Phase 14; ADR 0007)
   --------------------------------------------------------------------------
   Every path carries the office's organization id and the call sends it in
   X-Organization-Id too. The office reads its own contract, invoices and
   change requests (billing 1) and sends a change request (billing 2). No
   payment, renewal or invoice-document route exists for an office.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type Page, type PageParams } from "@/lib/api/paging";
import { officePath } from "./office.scope";
import type {
  ApiBillingContract,
  ApiChangeRequest,
  ApiInvoice,
} from "./billing.data";
import type { ChangeTopic } from "./billing.actions";

export const INVOICE_PAGE = 25;
export const CHANGE_REQUEST_PAGE = 10;

export function getContract(organizationId: string) {
  return api<ApiBillingContract>(
    officePath(organizationId, "/billing/contract"),
    { organizationId },
  );
}

export function listInvoices(
  organizationId: string,
  params: PageParams,
): Promise<Page<ApiInvoice>> {
  return fetchPage<ApiInvoice>(
    officePath(organizationId, "/billing/invoices"),
    { limit: INVOICE_PAGE, ...params },
    { organizationId },
  );
}

/** A short-lived link to the issued PDF (never cached). */
export function invoiceDownloadLink(organizationId: string, invoiceId: string) {
  return api<{ url: string; expiresIn: number }>(
    officePath(
      organizationId,
      `/billing/invoices/${encodeURIComponent(invoiceId)}/download-link`,
    ),
    { organizationId },
  );
}

export function listChangeRequests(
  organizationId: string,
  params: PageParams,
): Promise<Page<ApiChangeRequest>> {
  return fetchPage<ApiChangeRequest>(
    officePath(organizationId, "/billing/change-requests"),
    { limit: CHANGE_REQUEST_PAGE, ...params },
    { organizationId },
  );
}

export function requestChange(
  organizationId: string,
  body: { topic: ChangeTopic; detail: string },
) {
  return api<ApiChangeRequest>(
    officePath(organizationId, "/billing/change-requests"),
    {
      method: "POST",
      organizationId,
      body: { topic: body.topic, detail: body.detail.trim() },
    },
  );
}

/** The office profile (name, email, phone), for the contract card: the
 *  same read and cache entry as the Settings page. */
export { getProfile as getOfficeProfile } from "./orgSettings.repository";
