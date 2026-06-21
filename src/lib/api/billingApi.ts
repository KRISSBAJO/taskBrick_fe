import type {
  BillingAccountStatus,
  BillingCheckoutSession,
  BillingEntitlements,
  BillingInvoice,
  BillingPlan,
  BillingPortalSession,
  BillingUsageRecord,
  BillingUsageSummary,
  PaginatedResponse,
  SiteSubscription,
} from "../api";
import { boundedLimit, openApiRequest, type OpenApiJsonBody, type OpenApiQuery } from "./request";

function pagedQuery<TQuery extends { page?: number; limit?: number; search?: string }>(query: TQuery, fallback = 30) {
  return {
    ...query,
    page: query.page ?? 1,
    limit: boundedLimit(query.limit, fallback),
  };
}

export function getBillingAccountStatus(token: string) {
  return openApiRequest<BillingAccountStatus, "/api/v1/billing/account", "get">("/api/v1/billing/account", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function listBillingPlans(
  token: string,
  query: { page?: number; limit?: number; search?: string; interval?: string; currency?: string } = {},
) {
  return openApiRequest<PaginatedResponse<BillingPlan>, "/api/v1/plans", "get">("/api/v1/plans", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: pagedQuery(query, 30) as OpenApiQuery<"/api/v1/plans", "get">,
  });
}

export function getCurrentTenantSubscription(token: string) {
  return openApiRequest<SiteSubscription | null, "/api/v1/subscriptions/current", "get">("/api/v1/subscriptions/current", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function startTenantBillingTrial(token: string, payload: { planId: string; seatCount?: number }) {
  return openApiRequest<SiteSubscription, "/api/v1/billing/trial", "post">("/api/v1/billing/trial", "post", {
    token,
    pathParams: {},
    body: payload as unknown as OpenApiJsonBody<"/api/v1/billing/trial", "post">,
  });
}

export function createBillingCheckout(
  token: string,
  payload: {
    planId: string;
    seatCount?: number;
    successUrl?: string;
    cancelUrl?: string;
    provider?: "stripe" | "paystack" | "local";
  },
) {
  return openApiRequest<BillingCheckoutSession, "/api/v1/billing/checkout", "post">("/api/v1/billing/checkout", "post", {
    token,
    pathParams: {},
    body: payload as unknown as OpenApiJsonBody<"/api/v1/billing/checkout", "post">,
  });
}

export function createBillingPortal(token: string, payload: { returnUrl?: string } = {}) {
  return openApiRequest<BillingPortalSession, "/api/v1/billing/portal", "post">("/api/v1/billing/portal", "post", {
    token,
    pathParams: {},
    body: payload as unknown as OpenApiJsonBody<"/api/v1/billing/portal", "post">,
  });
}

export function changeTenantSubscriptionPlan(
  token: string,
  subscriptionId: string,
  payload: { planId: string; prorate?: boolean },
) {
  return openApiRequest<SiteSubscription, "/api/v1/subscriptions/{subscriptionId}/change-plan", "post">("/api/v1/subscriptions/{subscriptionId}/change-plan", "post", {
    token,
    pathParams: { subscriptionId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/subscriptions/{subscriptionId}/change-plan", "post">,
  });
}

export function cancelTenantSubscription(token: string, subscriptionId: string) {
  return openApiRequest<SiteSubscription, "/api/v1/subscriptions/{subscriptionId}/cancel", "post">("/api/v1/subscriptions/{subscriptionId}/cancel", "post", {
    token,
    pathParams: { subscriptionId },
  });
}

export function resumeTenantSubscription(token: string, subscriptionId: string) {
  return openApiRequest<SiteSubscription, "/api/v1/subscriptions/{subscriptionId}/resume", "post">("/api/v1/subscriptions/{subscriptionId}/resume", "post", {
    token,
    pathParams: { subscriptionId },
  });
}

export function listTenantInvoices(
  token: string,
  query: { page?: number; limit?: number; search?: string; status?: string; subscriptionId?: string } = {},
) {
  return openApiRequest<PaginatedResponse<BillingInvoice>, "/api/v1/invoices", "get">("/api/v1/invoices", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: pagedQuery(query, 20) as OpenApiQuery<"/api/v1/invoices", "get">,
  });
}

export function getTenantEntitlements(token: string) {
  return openApiRequest<BillingEntitlements, "/api/v1/entitlements", "get">("/api/v1/entitlements", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function listTenantUsageRecords(
  token: string,
  query: { page?: number; limit?: number; search?: string; featureKey?: string; from?: string; to?: string } = {},
) {
  return openApiRequest<PaginatedResponse<BillingUsageRecord>, "/api/v1/usage-records", "get">("/api/v1/usage-records", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: pagedQuery(query, 30) as OpenApiQuery<"/api/v1/usage-records", "get">,
  });
}

export function getTenantUsageSummary(
  token: string,
  query: { featureKey?: string; from?: string; to?: string } = {},
) {
  return openApiRequest<BillingUsageSummary, "/api/v1/usage-records/summary", "get">("/api/v1/usage-records/summary", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: query as OpenApiQuery<"/api/v1/usage-records/summary", "get">,
  });
}
