import type {
PlatformAdminLevel,
PlatformAdminStatus,
SecurityEventSeverity,
SecurityEventStatus,
SiteTenantResourceSection
} from "../api";
import { boundedLimit,openApiRequest,type OpenApiJsonBody,type OpenApiQuery } from "./request";

function siteQuery<TQuery extends { page?: number; limit?: number; search?: string }>(query: TQuery, fallback = 30) {
  return {
    ...query,
    page: query.page ?? 1,
    limit: boundedLimit(query.limit, fallback),
  };
}

export function getSiteAdminProfile(token: string) {
  return openApiRequest("/api/v1/site-admin/me", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function getSiteAdminOverview(token: string) {
  return openApiRequest("/api/v1/site-admin/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function getSiteHardeningOverview(token: string) {
  return openApiRequest("/api/v1/site-admin/hardening/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function listSiteTenants(
  token: string,
  query: { page?: number; limit?: number; search?: string; status?: string } = {},
) {
  return openApiRequest("/api/v1/site-admin/tenants", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/tenants", "get">,
  });
}

export function listSiteUsers(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; status?: string } = {},
) {
  return openApiRequest("/api/v1/site-admin/users", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 25) as OpenApiQuery<"/api/v1/site-admin/users", "get">,
  });
}

export function getSiteUser(token: string, userId: string) {
  return openApiRequest("/api/v1/site-admin/users/{userId}", "get", {
    token,
    cache: "no-store",
    pathParams: { userId },
  });
}

export function updateSiteUserStatus(
  token: string,
  userId: string,
  payload: { status: string; reason?: string },
) {
  return openApiRequest("/api/v1/site-admin/users/{userId}/status", "patch", {
    token,
    pathParams: { userId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/users/{userId}/status", "patch">,
  });
}

export function revokeSiteUserSessions(token: string, userId: string, payload: { reason?: string } = {}) {
  return openApiRequest("/api/v1/site-admin/users/{userId}/sessions/revoke", "post", {
    token,
    pathParams: { userId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/users/{userId}/sessions/revoke", "post">,
  });
}

export function resendSiteUserVerification(token: string, userId: string) {
  return openApiRequest("/api/v1/site-admin/users/{userId}/resend-verification", "post", {
    token,
    pathParams: { userId },
  });
}

export function getSiteTenant(token: string, tenantId: string) {
  return openApiRequest("/api/v1/site-admin/tenants/{tenantId}", "get", {
    token,
    cache: "no-store",
    pathParams: { tenantId },
  });
}

export function updateSiteTenantStatus(
  token: string,
  tenantId: string,
  payload: { status: string; reason?: string },
) {
  return openApiRequest("/api/v1/site-admin/tenants/{tenantId}/status", "patch", {
    token,
    pathParams: { tenantId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/tenants/{tenantId}/status", "patch">,
  });
}

export function listSiteTenantUsers(
  token: string,
  tenantId: string,
  query: { page?: number; limit?: number; search?: string; status?: string } = {},
) {
  return openApiRequest("/api/v1/site-admin/tenants/{tenantId}/users", "get", {
    token,
    cache: "no-store",
    pathParams: { tenantId },
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/tenants/{tenantId}/users", "get">,
  });
}

export function listSiteTenantResource<T = Record<string, unknown>>(
  token: string,
  tenantId: string,
  section: SiteTenantResourceSection,
  query: { page?: number; limit?: number; search?: string } = {},
) {
  const openApiQuery = siteQuery(query, 30);

  if (section === "users") {
    return Promise.all([
      listSiteTenantUsers(token, tenantId, query),
      getSiteTenant(token, tenantId),
    ]).then(([response, detail]) => ({
      tenant: detail.tenant,
      section,
      summary: { total: response.meta.total, byStatus: detail.users },
      data: response.data as T[],
      meta: response.meta,
    }));
  }

  switch (section) {
    case "projects":
      return openApiRequest("/api/v1/site-admin/tenants/{tenantId}/projects", "get", {
        token,
        cache: "no-store",
        pathParams: { tenantId },
        query: openApiQuery as OpenApiQuery<"/api/v1/site-admin/tenants/{tenantId}/projects", "get">,
      });
    case "workspaces":
      return openApiRequest("/api/v1/site-admin/tenants/{tenantId}/workspaces", "get", {
        token,
        cache: "no-store",
        pathParams: { tenantId },
        query: openApiQuery as OpenApiQuery<"/api/v1/site-admin/tenants/{tenantId}/workspaces", "get">,
      });
    case "teams":
      return openApiRequest("/api/v1/site-admin/tenants/{tenantId}/teams", "get", {
        token,
        cache: "no-store",
        pathParams: { tenantId },
        query: openApiQuery as OpenApiQuery<"/api/v1/site-admin/tenants/{tenantId}/teams", "get">,
      });
    case "sessions":
      return openApiRequest("/api/v1/site-admin/tenants/{tenantId}/sessions", "get", {
        token,
        cache: "no-store",
        pathParams: { tenantId },
        query: openApiQuery as OpenApiQuery<"/api/v1/site-admin/tenants/{tenantId}/sessions", "get">,
      });
    case "security":
      return openApiRequest("/api/v1/site-admin/tenants/{tenantId}/security", "get", {
        token,
        cache: "no-store",
        pathParams: { tenantId },
        query: openApiQuery as OpenApiQuery<"/api/v1/site-admin/tenants/{tenantId}/security", "get">,
      });
    case "billing":
      return openApiRequest("/api/v1/site-admin/tenants/{tenantId}/billing", "get", {
        token,
        cache: "no-store",
        pathParams: { tenantId },
        query: openApiQuery as OpenApiQuery<"/api/v1/site-admin/tenants/{tenantId}/billing", "get">,
      });
    case "integrations":
      return openApiRequest("/api/v1/site-admin/tenants/{tenantId}/integrations", "get", {
        token,
        cache: "no-store",
        pathParams: { tenantId },
        query: openApiQuery as OpenApiQuery<"/api/v1/site-admin/tenants/{tenantId}/integrations", "get">,
      });
    case "files":
      return openApiRequest("/api/v1/site-admin/tenants/{tenantId}/files", "get", {
        token,
        cache: "no-store",
        pathParams: { tenantId },
        query: openApiQuery as OpenApiQuery<"/api/v1/site-admin/tenants/{tenantId}/files", "get">,
      });
    case "ai":
      return openApiRequest("/api/v1/site-admin/tenants/{tenantId}/ai", "get", {
        token,
        cache: "no-store",
        pathParams: { tenantId },
        query: openApiQuery as OpenApiQuery<"/api/v1/site-admin/tenants/{tenantId}/ai", "get">,
      });
    case "reports":
      return openApiRequest("/api/v1/site-admin/tenants/{tenantId}/reports", "get", {
        token,
        cache: "no-store",
        pathParams: { tenantId },
        query: openApiQuery as OpenApiQuery<"/api/v1/site-admin/tenants/{tenantId}/reports", "get">,
      });
    case "activity":
      return openApiRequest("/api/v1/site-admin/tenants/{tenantId}/activity", "get", {
        token,
        cache: "no-store",
        pathParams: { tenantId },
        query: openApiQuery as OpenApiQuery<"/api/v1/site-admin/tenants/{tenantId}/activity", "get">,
      });
  }
}

export function listSiteSecurityEvents(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; type?: string; severity?: SecurityEventSeverity; status?: SecurityEventStatus } = {},
) {
  return openApiRequest("/api/v1/site-admin/security-events", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/security-events", "get">,
  });
}

export function updateSiteSecurityEvent(
  token: string,
  eventId: string,
  payload: { status?: SecurityEventStatus; severity?: SecurityEventSeverity; metadata?: unknown },
) {
  return openApiRequest("/api/v1/site-admin/security-events/{eventId}", "patch", {
    token,
    pathParams: { eventId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/security-events/{eventId}", "patch">,
  });
}

export function listPlatformAuditLogs(
  token: string,
  query: { page?: number; limit?: number; search?: string; actorId?: string; tenantId?: string; action?: string } = {},
) {
  return openApiRequest("/api/v1/site-admin/audit-logs", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/audit-logs", "get">,
  });
}

export function listPlatformAdmins(
  token: string,
  query: { page?: number; limit?: number; search?: string; level?: PlatformAdminLevel; status?: PlatformAdminStatus } = {},
) {
  return openApiRequest("/api/v1/site-admin/platform-admins", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/platform-admins", "get">,
  });
}

export function grantPlatformAdmin(
  token: string,
  payload: { userId: string; level: PlatformAdminLevel; scopes?: string[]; notes?: string },
) {
  return openApiRequest("/api/v1/site-admin/platform-admins", "post", {
    token,
    pathParams: {},
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/platform-admins", "post">,
  });
}

export function revokePlatformAdmin(token: string, platformAdminId: string, payload: { reason?: string } = {}) {
  return openApiRequest("/api/v1/site-admin/platform-admins/{platformAdminId}/revoke", "patch", {
    token,
    pathParams: { platformAdminId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/platform-admins/{platformAdminId}/revoke", "patch">,
  });
}
