import type {
  AiActionStatus,
  AiConversationStatus,
  AiRequestStatus,
  MetaPaginatedResponse,
  ReportExecutionStatus,
  ReportExportStatus,
  ReportStatus,
  SiteAiAction,
  SiteAiAgent,
  SiteAiConversation,
  SiteAiOverview,
  SiteAiSettings,
  SiteAiUsageLog,
  SiteDashboard,
  SiteReport,
  SiteReportExecution,
  SiteReportExport,
  SiteReportingOverview,
} from "../api";
import { boundedLimit, openApiRequest, type OpenApiQuery } from "./request";

function siteQuery<TQuery extends { page?: number; limit?: number; search?: string }>(query: TQuery, fallback = 30) {
  return {
    ...query,
    page: query.page ?? 1,
    limit: boundedLimit(query.limit, fallback),
  };
}

export function getSiteAiOverview(token: string) {
  return openApiRequest<SiteAiOverview, "/api/v1/site-admin/ai/overview", "get">("/api/v1/site-admin/ai/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function listSiteAiSettings(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; provider?: string; enabled?: boolean } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteAiSettings>, "/api/v1/site-admin/ai/settings", "get">("/api/v1/site-admin/ai/settings", "get", {
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
  return openApiRequest<MetaPaginatedResponse<SiteAiAgent>, "/api/v1/site-admin/ai/agents", "get">("/api/v1/site-admin/ai/agents", "get", {
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
  return openApiRequest<MetaPaginatedResponse<SiteAiConversation>, "/api/v1/site-admin/ai/conversations", "get">("/api/v1/site-admin/ai/conversations", "get", {
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
  return openApiRequest<MetaPaginatedResponse<SiteAiAction>, "/api/v1/site-admin/ai/actions", "get">("/api/v1/site-admin/ai/actions", "get", {
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
  return openApiRequest<MetaPaginatedResponse<SiteAiUsageLog>, "/api/v1/site-admin/ai/usage", "get">("/api/v1/site-admin/ai/usage", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/ai/usage", "get">,
  });
}

export function getSiteReportingOverview(token: string) {
  return openApiRequest<SiteReportingOverview, "/api/v1/site-admin/reporting/overview", "get">("/api/v1/site-admin/reporting/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function listSiteDashboards(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteDashboard>, "/api/v1/site-admin/reporting/dashboards", "get">("/api/v1/site-admin/reporting/dashboards", "get", {
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
  return openApiRequest<MetaPaginatedResponse<SiteReport>, "/api/v1/site-admin/reporting/reports", "get">("/api/v1/site-admin/reporting/reports", "get", {
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
  return openApiRequest<MetaPaginatedResponse<SiteReportExecution>, "/api/v1/site-admin/reporting/executions", "get">("/api/v1/site-admin/reporting/executions", "get", {
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
  return openApiRequest<MetaPaginatedResponse<SiteReportExport>, "/api/v1/site-admin/reporting/exports", "get">("/api/v1/site-admin/reporting/exports", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/reporting/exports", "get">,
  });
}
