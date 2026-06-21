import type {
  MetaPaginatedResponse,
  SiteBillingEntitlement,
  SiteBillingEvent,
  SiteBillingFeature,
  SiteBillingFeaturePayload,
  SiteBillingOverview,
  SiteBillingPlan,
  SiteBillingPlanPayload,
  SiteInvoice,
  SitePlanFeaturePayload,
  SiteSubscription,
  SiteUsageRecord,
} from "../api";
import { boundedLimit, openApiRequest, type OpenApiJsonBody, type OpenApiQuery } from "./request";

function siteQuery<TQuery extends { page?: number; limit?: number; search?: string }>(query: TQuery, fallback = 30) {
  return {
    ...query,
    page: query.page ?? 1,
    limit: boundedLimit(query.limit, fallback),
  };
}

export function getSiteBillingOverview(token: string) {
  return openApiRequest<SiteBillingOverview, "/api/v1/site-admin/billing/overview", "get">("/api/v1/site-admin/billing/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function listSiteBillingPlans(token: string, query: { page?: number; limit?: number; search?: string } = {}) {
  return openApiRequest<MetaPaginatedResponse<SiteBillingPlan>, "/api/v1/site-admin/billing/plans", "get">("/api/v1/site-admin/billing/plans", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/billing/plans", "get">,
  });
}

export function createSiteBillingPlan(token: string, payload: SiteBillingPlanPayload) {
  return openApiRequest<SiteBillingPlan, "/api/v1/site-admin/billing/plans", "post">("/api/v1/site-admin/billing/plans", "post", {
    token,
    pathParams: {},
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/billing/plans", "post">,
  });
}

export function updateSiteBillingPlan(token: string, planId: string, payload: Partial<SiteBillingPlanPayload>) {
  return openApiRequest<SiteBillingPlan, "/api/v1/site-admin/billing/plans/{planId}", "patch">("/api/v1/site-admin/billing/plans/{planId}", "patch", {
    token,
    pathParams: { planId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/billing/plans/{planId}", "patch">,
  });
}

export function archiveSiteBillingPlan(token: string, planId: string) {
  return openApiRequest<SiteBillingPlan, "/api/v1/site-admin/billing/plans/{planId}/archive", "post">("/api/v1/site-admin/billing/plans/{planId}/archive", "post", {
    token,
    pathParams: { planId },
  });
}

export function restoreSiteBillingPlan(token: string, planId: string) {
  return openApiRequest<SiteBillingPlan, "/api/v1/site-admin/billing/plans/{planId}/restore", "post">("/api/v1/site-admin/billing/plans/{planId}/restore", "post", {
    token,
    pathParams: { planId },
  });
}

export function syncSiteBillingPlanToStripe(token: string, planId: string) {
  return openApiRequest<SiteBillingPlan, "/api/v1/site-admin/billing/plans/{planId}/sync/stripe", "post">("/api/v1/site-admin/billing/plans/{planId}/sync/stripe", "post", {
    token,
    pathParams: { planId },
  });
}

export function assignSiteBillingPlanFeature(token: string, planId: string, payload: SitePlanFeaturePayload) {
  return openApiRequest<SiteBillingPlan, "/api/v1/site-admin/billing/plans/{planId}/features", "post">("/api/v1/site-admin/billing/plans/{planId}/features", "post", {
    token,
    pathParams: { planId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/billing/plans/{planId}/features", "post">,
  });
}

export function updateSiteBillingPlanFeature(
  token: string,
  planId: string,
  featureId: string,
  payload: Omit<Partial<SitePlanFeaturePayload>, "featureId">,
) {
  return openApiRequest<SiteBillingPlan, "/api/v1/site-admin/billing/plans/{planId}/features/{featureId}", "patch">("/api/v1/site-admin/billing/plans/{planId}/features/{featureId}", "patch", {
    token,
    pathParams: { planId, featureId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/billing/plans/{planId}/features/{featureId}", "patch">,
  });
}

export function removeSiteBillingPlanFeature(token: string, planId: string, featureId: string) {
  return openApiRequest<SiteBillingPlan, "/api/v1/site-admin/billing/plans/{planId}/features/{featureId}", "delete">("/api/v1/site-admin/billing/plans/{planId}/features/{featureId}", "delete", {
    token,
    pathParams: { planId, featureId },
  });
}

export function listSiteBillingFeatures(token: string, query: { page?: number; limit?: number; search?: string } = {}) {
  return openApiRequest<MetaPaginatedResponse<SiteBillingFeature>, "/api/v1/site-admin/billing/features", "get">("/api/v1/site-admin/billing/features", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 50) as OpenApiQuery<"/api/v1/site-admin/billing/features", "get">,
  });
}

export function createSiteBillingFeature(token: string, payload: SiteBillingFeaturePayload) {
  return openApiRequest<SiteBillingFeature, "/api/v1/site-admin/billing/features", "post">("/api/v1/site-admin/billing/features", "post", {
    token,
    pathParams: {},
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/billing/features", "post">,
  });
}

export function updateSiteBillingFeature(token: string, featureId: string, payload: Partial<SiteBillingFeaturePayload>) {
  return openApiRequest<SiteBillingFeature, "/api/v1/site-admin/billing/features/{featureId}", "patch">("/api/v1/site-admin/billing/features/{featureId}", "patch", {
    token,
    pathParams: { featureId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/billing/features/{featureId}", "patch">,
  });
}

export function setSiteBillingFeatureActive(token: string, featureId: string, isActive: boolean) {
  if (isActive) {
    return openApiRequest<SiteBillingFeature, "/api/v1/site-admin/billing/features/{featureId}/enable", "post">("/api/v1/site-admin/billing/features/{featureId}/enable", "post", {
      token,
      pathParams: { featureId },
    });
  }

  return openApiRequest<SiteBillingFeature, "/api/v1/site-admin/billing/features/{featureId}/disable", "post">("/api/v1/site-admin/billing/features/{featureId}/disable", "post", {
    token,
    pathParams: { featureId },
  });
}

export function listSiteBillingSubscriptions(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; status?: string } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteSubscription>, "/api/v1/site-admin/billing/subscriptions", "get">("/api/v1/site-admin/billing/subscriptions", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/billing/subscriptions", "get">,
  });
}

export function updateSiteSubscription(
  token: string,
  subscriptionId: string,
  payload: { status?: string; planId?: string; seatCount?: number; cancelAtPeriodEnd?: boolean; trialEndsAt?: string; reason?: string },
) {
  return openApiRequest<SiteSubscription, "/api/v1/site-admin/billing/subscriptions/{subscriptionId}", "patch">("/api/v1/site-admin/billing/subscriptions/{subscriptionId}", "patch", {
    token,
    pathParams: { subscriptionId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/billing/subscriptions/{subscriptionId}", "patch">,
  });
}

export function changeSiteSubscriptionPlan(token: string, subscriptionId: string, payload: { planId: string; reason?: string }) {
  return openApiRequest<SiteSubscription, "/api/v1/site-admin/billing/subscriptions/{subscriptionId}/change-plan", "post">("/api/v1/site-admin/billing/subscriptions/{subscriptionId}/change-plan", "post", {
    token,
    pathParams: { subscriptionId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/billing/subscriptions/{subscriptionId}/change-plan", "post">,
  });
}

export function cancelSiteSubscription(token: string, subscriptionId: string, payload: { reason?: string } = {}) {
  return openApiRequest<SiteSubscription, "/api/v1/site-admin/billing/subscriptions/{subscriptionId}/cancel", "post">("/api/v1/site-admin/billing/subscriptions/{subscriptionId}/cancel", "post", {
    token,
    pathParams: { subscriptionId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/billing/subscriptions/{subscriptionId}/cancel", "post">,
  });
}

export function resumeSiteSubscription(token: string, subscriptionId: string, payload: { reason?: string } = {}) {
  return openApiRequest<SiteSubscription, "/api/v1/site-admin/billing/subscriptions/{subscriptionId}/resume", "post">("/api/v1/site-admin/billing/subscriptions/{subscriptionId}/resume", "post", {
    token,
    pathParams: { subscriptionId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/billing/subscriptions/{subscriptionId}/resume", "post">,
  });
}

export function startSiteTenantTrial(token: string, tenantId: string, payload: { planId: string; reason?: string }) {
  return openApiRequest<SiteSubscription, "/api/v1/site-admin/billing/tenants/{tenantId}/start-trial", "post">("/api/v1/site-admin/billing/tenants/{tenantId}/start-trial", "post", {
    token,
    pathParams: { tenantId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/billing/tenants/{tenantId}/start-trial", "post">,
  });
}

export function listSiteBillingInvoices(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteInvoice>, "/api/v1/site-admin/billing/invoices", "get">("/api/v1/site-admin/billing/invoices", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/billing/invoices", "get">,
  });
}

export function listSiteBillingUsageRecords(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteUsageRecord>, "/api/v1/site-admin/billing/usage-records", "get">("/api/v1/site-admin/billing/usage-records", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/billing/usage-records", "get">,
  });
}

export function listSiteBillingEvents(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; provider?: string; type?: string; status?: string } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteBillingEvent>, "/api/v1/site-admin/billing/events", "get">("/api/v1/site-admin/billing/events", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/billing/events", "get">,
  });
}

export function listSiteBillingEntitlements(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteBillingEntitlement>, "/api/v1/site-admin/billing/entitlements", "get">("/api/v1/site-admin/billing/entitlements", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/billing/entitlements", "get">,
  });
}
