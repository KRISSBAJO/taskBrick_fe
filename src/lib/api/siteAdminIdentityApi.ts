import type {
  MetaPaginatedResponse,
  SiteIdentitySecurityOverview,
  SiteLoginHistory,
  SiteSecurityPolicy,
  SiteSession,
  SiteSessionsResponse,
  SiteSsoProvider,
  SiteTrustedDevice,
} from "../api";
import { boundedLimit, openApiRequest, type OpenApiJsonBody, type OpenApiQuery } from "./request";

function siteQuery<TQuery extends { page?: number; limit?: number; search?: string }>(query: TQuery, fallback = 30) {
  return {
    ...query,
    page: query.page ?? 1,
    limit: boundedLimit(query.limit, fallback),
  };
}

export function getSiteIdentitySecurityOverview(token: string) {
  return openApiRequest<SiteIdentitySecurityOverview, "/api/v1/site-admin/identity-security/overview", "get">("/api/v1/site-admin/identity-security/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function listSiteLoginHistory(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; userId?: string; ipAddress?: string; method?: string; status?: string; suspicious?: boolean } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteLoginHistory>, "/api/v1/site-admin/identity-security/login-history", "get">("/api/v1/site-admin/identity-security/login-history", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/identity-security/login-history", "get">,
  });
}

export function listSiteTrustedDevices(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; userId?: string; ipAddress?: string; status?: string } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteTrustedDevice>, "/api/v1/site-admin/identity-security/trusted-devices", "get">("/api/v1/site-admin/identity-security/trusted-devices", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/identity-security/trusted-devices", "get">,
  });
}

export function revokeSiteTrustedDevice(token: string, deviceId: string, payload: { reason?: string } = {}) {
  return openApiRequest<SiteTrustedDevice, "/api/v1/site-admin/identity-security/trusted-devices/{deviceId}/revoke", "patch">("/api/v1/site-admin/identity-security/trusted-devices/{deviceId}/revoke", "patch", {
    token,
    pathParams: { deviceId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/identity-security/trusted-devices/{deviceId}/revoke", "patch">,
  });
}

export function listSiteSsoProviders(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; status?: string } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteSsoProvider>, "/api/v1/site-admin/identity-security/sso-providers", "get">("/api/v1/site-admin/identity-security/sso-providers", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/identity-security/sso-providers", "get">,
  });
}

export function listSiteSecurityPolicies(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteSecurityPolicy>, "/api/v1/site-admin/identity-security/policies", "get">("/api/v1/site-admin/identity-security/policies", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/identity-security/policies", "get">,
  });
}

export function sendSiteAdminPasswordReset(token: string, userId: string) {
  return openApiRequest<{
    success: boolean;
    sent: boolean;
    provider?: string;
    skipped?: boolean;
    message: string;
    devLink?: string;
  }, "/api/v1/site-admin/identity-security/users/{userId}/password-reset", "post">("/api/v1/site-admin/identity-security/users/{userId}/password-reset", "post", {
    token,
    pathParams: { userId },
  });
}

export function listSiteSessions(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; userId?: string; ipAddress?: string; device?: string; authMethod?: string; active?: boolean } = {},
) {
  return openApiRequest<SiteSessionsResponse, "/api/v1/site-admin/sessions", "get">("/api/v1/site-admin/sessions", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/sessions", "get">,
  });
}

export function revokeSiteSession(token: string, sessionId: string, payload: { reason?: string } = {}) {
  return openApiRequest<SiteSession, "/api/v1/site-admin/sessions/{sessionId}/revoke", "patch">("/api/v1/site-admin/sessions/{sessionId}/revoke", "patch", {
    token,
    pathParams: { sessionId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/sessions/{sessionId}/revoke", "patch">,
  });
}
