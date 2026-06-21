import type {
AiActionStatus,
AiConversationStatus,
AiRequestStatus,
ReportExecutionStatus,
ReportExportStatus,
ReportStatus
} from "../api";
import { boundedLimit,openApiRequest,type OpenApiQuery } from "./request";

function siteQuery<TQuery extends { page?: number; limit?: number; search?: string }>(query: TQuery, fallback = 30) {
  return {
    ...query,
    page: query.page ?? 1,
    limit: boundedLimit(query.limit, fallback),
  };
}

export function getSiteAiOverview(token: string) {
  return openApiRequest("/api/v1/site-admin/ai/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function listSiteAiSettings(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; provider?: string; enabled?: boolean } = {},
) {
  return openApiRequest("/api/v1/site-admin/ai/settings", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/ai/settings", "get">,
  });
}

export function listSiteAiAgents(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; provider?: string; model?: string; enabled?: boolean } = {},
) {
  return openApiRequest("/api/v1/site-admin/ai/agents", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/ai/agents", "get">,
  });
}

export function listSiteAiConversations(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; agentId?: string; status?: AiConversationStatus } = {},
) {
  return openApiRequest("/api/v1/site-admin/ai/conversations", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/ai/conversations", "get">,
  });
}

export function listSiteAiActions(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; agentId?: string; type?: string; status?: AiActionStatus } = {},
) {
  return openApiRequest("/api/v1/site-admin/ai/actions", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/ai/actions", "get">,
  });
}

export function listSiteAiUsage(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; provider?: string; model?: string; status?: AiRequestStatus; from?: string; to?: string } = {},
) {
  return openApiRequest("/api/v1/site-admin/ai/usage", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/ai/usage", "get">,
  });
}

export function getSiteReportingOverview(token: string) {
  return openApiRequest("/api/v1/site-admin/reporting/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function listSiteDashboards(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string } = {},
) {
  return openApiRequest("/api/v1/site-admin/reporting/dashboards", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/reporting/dashboards", "get">,
  });
}

export function listSiteReports(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; type?: string; status?: ReportStatus } = {},
) {
  return openApiRequest("/api/v1/site-admin/reporting/reports", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/reporting/reports", "get">,
  });
}

export function listSiteReportExecutions(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; reportId?: string; type?: string; status?: ReportExecutionStatus; from?: string; to?: string } = {},
) {
  return openApiRequest("/api/v1/site-admin/reporting/executions", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/reporting/executions", "get">,
  });
}

export function listSiteReportExports(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; reportId?: string; status?: ReportExportStatus } = {},
) {
  return openApiRequest("/api/v1/site-admin/reporting/exports", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/reporting/exports", "get">,
  });
}
