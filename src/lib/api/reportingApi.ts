import type {
  AnalyticsOverview,
  AnalyticsQuery,
  BudgetAnalytics,
  CycleTimeAnalytics,
  PaginatedResponse,
  ProjectHealthAnalytics,
  Report,
  ReportExecution,
  ReportExecutionStatus,
  ReportExport,
  ReportExportFormat,
  ReportExportStatus,
  ReportStatus,
  SlaAnalytics,
  TeamPerformanceAnalytics,
  VelocityAnalytics,
} from "../api";
import { boundedLimit, openApiRequest, type OpenApiJsonBody, type OpenApiQuery } from "./request";

type ListReportsQuery = OpenApiQuery<"/api/v1/reporting/reports", "get">;
type CreateReportPayload = {
  name: string;
  description?: string;
  type: string;
  status?: ReportStatus;
  query?: unknown;
  schedule?: string;
  timezone?: string;
  recipients?: string[];
  cacheTtlSeconds?: number;
  nextRunAt?: string;
  metadata?: unknown;
};
type RunAdHocReportPayload = { type?: string; parameters?: AnalyticsQuery; cacheKey?: string };
type RunSavedReportPayload = { parameters?: AnalyticsQuery; cacheKey?: string };
type ExportSavedReportPayload = { format: ReportExportFormat; parameters?: AnalyticsQuery };
type ListReportExecutionsQuery = OpenApiQuery<"/api/v1/reporting/executions", "get">;
type ListReportExportsQuery = OpenApiQuery<"/api/v1/reporting/exports", "get">;

export function listReports(
  token: string,
  query: { page?: number; limit?: number; search?: string; type?: string; status?: ReportStatus; includeArchived?: boolean } = {},
) {
  return openApiRequest<PaginatedResponse<Report>, "/api/v1/reporting/reports", "get">("/api/v1/reporting/reports", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 50),
    } as ListReportsQuery,
  });
}

export function createReport(token: string, payload: CreateReportPayload) {
  return openApiRequest<Report, "/api/v1/reporting/reports", "post">("/api/v1/reporting/reports", "post", {
    token,
    pathParams: {},
    body: payload as unknown as OpenApiJsonBody<"/api/v1/reporting/reports", "post">,
  });
}

export function runAdHocReport(token: string, payload: RunAdHocReportPayload) {
  return openApiRequest<ReportExecution, "/api/v1/reporting/reports/run", "post">("/api/v1/reporting/reports/run", "post", {
    token,
    pathParams: {},
    body: payload as unknown as OpenApiJsonBody<"/api/v1/reporting/reports/run", "post">,
  });
}

export function runSavedReport(token: string, reportId: string, payload: RunSavedReportPayload = {}) {
  return openApiRequest<ReportExecution, "/api/v1/reporting/reports/{reportId}/run", "post">("/api/v1/reporting/reports/{reportId}/run", "post", {
    token,
    pathParams: { reportId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/reporting/reports/{reportId}/run", "post">,
  });
}

export function exportSavedReport(token: string, reportId: string, payload: ExportSavedReportPayload) {
  return openApiRequest<ReportExport, "/api/v1/reporting/reports/{reportId}/exports", "post">("/api/v1/reporting/reports/{reportId}/exports", "post", {
    token,
    pathParams: { reportId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/reporting/reports/{reportId}/exports", "post">,
  });
}

export function listReportExecutions(
  token: string,
  query: { page?: number; limit?: number; search?: string; reportId?: string; type?: string; status?: ReportExecutionStatus; from?: string; to?: string } = {},
) {
  return openApiRequest<PaginatedResponse<ReportExecution>, "/api/v1/reporting/executions", "get">("/api/v1/reporting/executions", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 20),
    } as ListReportExecutionsQuery,
  });
}

export function listReportExports(
  token: string,
  query: { page?: number; limit?: number; search?: string; reportId?: string; format?: ReportExportFormat; status?: ReportExportStatus; from?: string; to?: string } = {},
) {
  return openApiRequest<PaginatedResponse<ReportExport>, "/api/v1/reporting/exports", "get">("/api/v1/reporting/exports", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 20),
    } as ListReportExportsQuery,
  });
}

export function getAnalyticsOverview(token: string, query: AnalyticsQuery = {}) {
  return openApiRequest<AnalyticsOverview, "/api/v1/reporting/analytics/overview", "get">("/api/v1/reporting/analytics/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: query as OpenApiQuery<"/api/v1/reporting/analytics/overview", "get">,
  });
}

export function getProjectHealthAnalytics(token: string, query: AnalyticsQuery = {}) {
  return openApiRequest<ProjectHealthAnalytics, "/api/v1/reporting/analytics/project-health", "get">("/api/v1/reporting/analytics/project-health", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: query as OpenApiQuery<"/api/v1/reporting/analytics/project-health", "get">,
  });
}

export function getTeamPerformanceAnalytics(token: string, query: AnalyticsQuery = {}) {
  return openApiRequest<TeamPerformanceAnalytics, "/api/v1/reporting/analytics/team-performance", "get">("/api/v1/reporting/analytics/team-performance", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: query as OpenApiQuery<"/api/v1/reporting/analytics/team-performance", "get">,
  });
}

export function getCycleTimeAnalytics(token: string, query: AnalyticsQuery = {}) {
  return openApiRequest<CycleTimeAnalytics, "/api/v1/reporting/analytics/cycle-time", "get">("/api/v1/reporting/analytics/cycle-time", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: query as OpenApiQuery<"/api/v1/reporting/analytics/cycle-time", "get">,
  });
}

export function getVelocityAnalytics(token: string, query: AnalyticsQuery = {}) {
  return openApiRequest<VelocityAnalytics, "/api/v1/reporting/analytics/velocity", "get">("/api/v1/reporting/analytics/velocity", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: query as OpenApiQuery<"/api/v1/reporting/analytics/velocity", "get">,
  });
}

export function getBudgetAnalytics(token: string, query: AnalyticsQuery = {}) {
  return openApiRequest<BudgetAnalytics, "/api/v1/reporting/analytics/budget", "get">("/api/v1/reporting/analytics/budget", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: query as OpenApiQuery<"/api/v1/reporting/analytics/budget", "get">,
  });
}

export function getSlaAnalytics(token: string, query: AnalyticsQuery = {}) {
  return openApiRequest<SlaAnalytics, "/api/v1/reporting/analytics/sla", "get">("/api/v1/reporting/analytics/sla", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: query as OpenApiQuery<"/api/v1/reporting/analytics/sla", "get">,
  });
}
