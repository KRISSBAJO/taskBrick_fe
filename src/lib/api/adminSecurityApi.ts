import type {
ApiKeyStatus,
ComplianceJobStatus,
ComplianceJobType,
SecurityEventSeverity,
SecurityEventStatus,
SecurityPolicy
} from "../api";
import { boundedLimit,openApiRequest,type OpenApiJsonBody,type OpenApiQuery } from "./request";

function pagedQuery<TQuery extends { page?: number; limit?: number; search?: string }>(query: TQuery, fallback = 50) {
  return {
    ...query,
    page: query.page ?? 1,
    limit: boundedLimit(query.limit, fallback),
  };
}

export function listAuditLogs(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
    actorId?: string;
    entityType?: string;
    entityId?: string;
    ipAddress?: string;
    from?: string;
    to?: string;
  } = {},
) {
  return openApiRequest("/api/v1/admin/audit-logs", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: pagedQuery(query, 50) as OpenApiQuery<"/api/v1/admin/audit-logs", "get">,
  });
}

export function getAdminOverview(token: string) {
  return openApiRequest("/api/v1/admin/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function getSecurityChecks(token: string) {
  return openApiRequest("/api/v1/admin/security-checks", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function getSecurityPolicy(token: string) {
  return openApiRequest("/api/v1/admin/security-policy", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function updateSecurityPolicy(token: string, payload: Partial<Pick<
  SecurityPolicy,
  | "enforceIpAllowlist"
  | "ipAllowlist"
  | "sessionTtlMinutes"
  | "maxSessionsPerUser"
  | "passwordMinLength"
  | "passwordRequireUpper"
  | "passwordRequireLower"
  | "passwordRequireNumber"
  | "passwordRequireSymbol"
  | "passwordHistoryCount"
  | "mfaRequired"
  | "auditRetentionDays"
  | "dataRetentionDays"
  | "maxUploadBytes"
  | "allowedUploadMimeTypes"
>> & { metadata?: unknown }) {
  return openApiRequest("/api/v1/admin/security-policy", "patch", {
    token,
    pathParams: {},
    body: payload as unknown as OpenApiJsonBody<"/api/v1/admin/security-policy", "patch">,
  });
}

export function listSecurityEvents(
  token: string,
  query: { page?: number; limit?: number; search?: string; type?: string; severity?: SecurityEventSeverity; status?: SecurityEventStatus; actorId?: string; subjectType?: string; subjectId?: string; from?: string; to?: string } = {},
) {
  return openApiRequest("/api/v1/admin/security-events", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: pagedQuery(query, 50) as OpenApiQuery<"/api/v1/admin/security-events", "get">,
  });
}

export function updateSecurityEvent(
  token: string,
  eventId: string,
  payload: { severity?: SecurityEventSeverity; status?: SecurityEventStatus; metadata?: unknown },
) {
  return openApiRequest("/api/v1/admin/security-events/{eventId}", "patch", {
    token,
    pathParams: { eventId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/admin/security-events/{eventId}", "patch">,
  });
}

export function listComplianceJobs(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    type?: ComplianceJobType;
    status?: ComplianceJobStatus;
    subjectType?: string;
    subjectId?: string;
    from?: string;
    to?: string;
  } = {},
) {
  return openApiRequest("/api/v1/admin/compliance-jobs", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: pagedQuery(query, 30) as OpenApiQuery<"/api/v1/admin/compliance-jobs", "get">,
  });
}

export function createComplianceJob(
  token: string,
  payload: {
    type: ComplianceJobType;
    subjectType?: string;
    subjectId?: string;
    reason?: string;
    parameters?: unknown;
    expiresAt?: string;
  },
) {
  return openApiRequest("/api/v1/admin/compliance-jobs", "post", {
    token,
    pathParams: {},
    body: payload as unknown as OpenApiJsonBody<"/api/v1/admin/compliance-jobs", "post">,
  });
}

export function approveComplianceJob(token: string, jobId: string, payload: { reason?: string } = {}) {
  return openApiRequest("/api/v1/admin/compliance-jobs/{jobId}/approve", "post", {
    token,
    pathParams: { jobId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/admin/compliance-jobs/{jobId}/approve", "post">,
  });
}

export function rejectComplianceJob(token: string, jobId: string, payload: { reason?: string } = {}) {
  return openApiRequest("/api/v1/admin/compliance-jobs/{jobId}/reject", "post", {
    token,
    pathParams: { jobId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/admin/compliance-jobs/{jobId}/reject", "post">,
  });
}

export function runComplianceJob(token: string, jobId: string) {
  return openApiRequest("/api/v1/admin/compliance-jobs/{jobId}/run", "post", {
    token,
    pathParams: { jobId },
  });
}

export function cancelComplianceJob(token: string, jobId: string) {
  return openApiRequest("/api/v1/admin/compliance-jobs/{jobId}/cancel", "post", {
    token,
    pathParams: { jobId },
  });
}

export function listApiKeys(
  token: string,
  query: { page?: number; limit?: number; search?: string; status?: ApiKeyStatus; scope?: string; createdById?: string; from?: string; to?: string } = {},
) {
  return openApiRequest("/api/v1/admin/api-keys", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: pagedQuery(query, 50) as OpenApiQuery<"/api/v1/admin/api-keys", "get">,
  });
}

export function createApiKey(
  token: string,
  payload: { name: string; scopes?: string[]; expiresAt?: string; metadata?: unknown },
) {
  return openApiRequest("/api/v1/admin/api-keys", "post", {
    token,
    pathParams: {},
    body: payload as unknown as OpenApiJsonBody<"/api/v1/admin/api-keys", "post">,
  });
}

export function revokeApiKey(token: string, apiKeyId: string) {
  return openApiRequest("/api/v1/admin/api-keys/{apiKeyId}/revoke", "post", {
    token,
    pathParams: { apiKeyId },
  });
}
