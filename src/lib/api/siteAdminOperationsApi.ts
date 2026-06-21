import type {
  ApprovalStatus,
  ComplianceJobStatus,
  ComplianceJobType,
  MeetingReminderJobStatus,
  MeetingStatus,
  MetaPaginatedResponse,
  SiteApproval,
  SiteApprovalDefinition,
  SiteAutomationOverview,
  SiteComplianceJob,
  SiteComplianceOverview,
  SiteConversationMetadata,
  SiteIntegration,
  SiteIntegrationsOverview,
  SiteMeetingOperationsOverview,
  SiteMeetingReminderLog,
  SiteMeetingTenantPosture,
  SiteMessageActivity,
  SiteObservabilityOverview,
  SitePlatformSearchCategory,
  SitePlatformSearchResponse,
  SiteRealtimeOverview,
  SiteWebhook,
  SiteWebhookDelivery,
  SiteWorkflow,
  SiteWorkflowRun,
  SiteWorkflowRunLog,
  WorkflowRunStatus,
} from "../api";
import { boundedLimit, openApiRequest, type OpenApiJsonBody, type OpenApiQuery } from "./request";

function siteQuery<TQuery extends { page?: number; limit?: number; search?: string }>(query: TQuery, fallback = 30) {
  return {
    ...query,
    page: query.page ?? 1,
    limit: boundedLimit(query.limit, fallback),
  };
}

export function getSiteIntegrationsOverview(token: string) {
  return openApiRequest<SiteIntegrationsOverview, "/api/v1/site-admin/integrations/overview", "get">("/api/v1/site-admin/integrations/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function listSiteIntegrations(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; provider?: string; status?: string; enabled?: boolean } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteIntegration>, "/api/v1/site-admin/integrations", "get">("/api/v1/site-admin/integrations", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/integrations", "get">,
  });
}

export function rotateSiteIntegrationSecret(token: string, integrationId: string, payload: { key?: string; value?: string; reason?: string } = {}) {
  return openApiRequest<{ integration: SiteIntegration; generatedSecret?: string }, "/api/v1/site-admin/integrations/{integrationId}/rotate-secret", "patch">("/api/v1/site-admin/integrations/{integrationId}/rotate-secret", "patch", {
    token,
    pathParams: { integrationId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/integrations/{integrationId}/rotate-secret", "patch">,
  });
}

export function listSiteWebhooks(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; enabled?: boolean } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteWebhook>, "/api/v1/site-admin/webhooks", "get">("/api/v1/site-admin/webhooks", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/webhooks", "get">,
  });
}

export function listSiteWebhookDeliveries(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; webhookId?: string; status?: string; eventType?: string; from?: string; to?: string } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteWebhookDelivery>, "/api/v1/site-admin/webhook-deliveries", "get">("/api/v1/site-admin/webhook-deliveries", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/webhook-deliveries", "get">,
  });
}

export function retrySiteWebhookDelivery(token: string, deliveryId: string) {
  return openApiRequest<SiteWebhookDelivery, "/api/v1/site-admin/webhook-deliveries/{deliveryId}/retry", "post">("/api/v1/site-admin/webhook-deliveries/{deliveryId}/retry", "post", {
    token,
    pathParams: { deliveryId },
  });
}

export function rotateSiteWebhookSecret(token: string, webhookId: string, payload: { value?: string; reason?: string } = {}) {
  return openApiRequest<SiteWebhook & { signingSecret?: string }, "/api/v1/site-admin/webhooks/{webhookId}/rotate-secret", "patch">("/api/v1/site-admin/webhooks/{webhookId}/rotate-secret", "patch", {
    token,
    pathParams: { webhookId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/webhooks/{webhookId}/rotate-secret", "patch">,
  });
}

export function getSiteObservabilityOverview(token: string) {
  return openApiRequest<SiteObservabilityOverview, "/api/v1/site-admin/observability/overview", "get">("/api/v1/site-admin/observability/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function getSiteRealtimeOverview(token: string) {
  return openApiRequest<SiteRealtimeOverview, "/api/v1/site-admin/realtime/overview", "get">("/api/v1/site-admin/realtime/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function listSiteConversations(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; conversationId?: string; userId?: string; from?: string; to?: string } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteConversationMetadata>, "/api/v1/site-admin/realtime/conversations", "get">("/api/v1/site-admin/realtime/conversations", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/realtime/conversations", "get">,
  });
}

export function listSiteMessageActivity(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; conversationId?: string; userId?: string; from?: string; to?: string } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteMessageActivity>, "/api/v1/site-admin/realtime/message-activity", "get">("/api/v1/site-admin/realtime/message-activity", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/realtime/message-activity", "get">,
  });
}

export function getSiteMeetingOverview(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; status?: MeetingStatus; from?: string; to?: string } = {},
) {
  return openApiRequest<SiteMeetingOperationsOverview, "/api/v1/site-admin/meetings/overview", "get">("/api/v1/site-admin/meetings/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/meetings/overview", "get">,
  });
}

export function listSiteMeetingTenants(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; status?: MeetingStatus; from?: string; to?: string } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteMeetingTenantPosture>, "/api/v1/site-admin/meetings/tenants", "get">("/api/v1/site-admin/meetings/tenants", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/meetings/tenants", "get">,
  });
}

export function listSiteMeetingReminderLogs(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; status?: MeetingReminderJobStatus; from?: string; to?: string } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteMeetingReminderLog>, "/api/v1/site-admin/meetings/reminder-logs", "get">("/api/v1/site-admin/meetings/reminder-logs", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/meetings/reminder-logs", "get">,
  });
}

export function getSiteComplianceOverview(token: string) {
  return openApiRequest<SiteComplianceOverview, "/api/v1/site-admin/compliance/overview", "get">("/api/v1/site-admin/compliance/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function listSiteComplianceJobs(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; type?: ComplianceJobType; status?: ComplianceJobStatus; subjectType?: string; subjectId?: string; from?: string; to?: string } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteComplianceJob>, "/api/v1/site-admin/compliance/jobs", "get">("/api/v1/site-admin/compliance/jobs", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/compliance/jobs", "get">,
  });
}

export function approveSiteComplianceJob(token: string, jobId: string, payload: { reason?: string } = {}) {
  return openApiRequest<SiteComplianceJob, "/api/v1/site-admin/compliance/jobs/{jobId}/approve", "post">("/api/v1/site-admin/compliance/jobs/{jobId}/approve", "post", {
    token,
    pathParams: { jobId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/compliance/jobs/{jobId}/approve", "post">,
  });
}

export function rejectSiteComplianceJob(token: string, jobId: string, payload: { reason?: string } = {}) {
  return openApiRequest<SiteComplianceJob, "/api/v1/site-admin/compliance/jobs/{jobId}/reject", "post">("/api/v1/site-admin/compliance/jobs/{jobId}/reject", "post", {
    token,
    pathParams: { jobId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/compliance/jobs/{jobId}/reject", "post">,
  });
}

export function runSiteComplianceJob(token: string, jobId: string) {
  return openApiRequest<SiteComplianceJob, "/api/v1/site-admin/compliance/jobs/{jobId}/run", "post">("/api/v1/site-admin/compliance/jobs/{jobId}/run", "post", {
    token,
    pathParams: { jobId },
  });
}

export function cancelSiteComplianceJob(token: string, jobId: string, payload: { reason?: string } = {}) {
  return openApiRequest<SiteComplianceJob, "/api/v1/site-admin/compliance/jobs/{jobId}/cancel", "post">("/api/v1/site-admin/compliance/jobs/{jobId}/cancel", "post", {
    token,
    pathParams: { jobId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/site-admin/compliance/jobs/{jobId}/cancel", "post">,
  });
}

export function sitePlatformSearch(
  token: string,
  query: { page?: number; limit?: number; search?: string; category?: SitePlatformSearchCategory; tenantId?: string } = {},
) {
  return openApiRequest<SitePlatformSearchResponse, "/api/v1/site-admin/search", "get">("/api/v1/site-admin/search", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/search", "get">,
  });
}

export function getSiteAutomationOverview(token: string) {
  return openApiRequest<SiteAutomationOverview, "/api/v1/site-admin/automation/overview", "get">("/api/v1/site-admin/automation/overview", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function listSiteWorkflows(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; entityType?: string; triggerType?: string; active?: boolean } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteWorkflow>, "/api/v1/site-admin/automation/workflows", "get">("/api/v1/site-admin/automation/workflows", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/automation/workflows", "get">,
  });
}

export function listSiteWorkflowRuns(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; workflowId?: string; runId?: string; status?: WorkflowRunStatus; from?: string; to?: string } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteWorkflowRun>, "/api/v1/site-admin/automation/runs", "get">("/api/v1/site-admin/automation/runs", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/automation/runs", "get">,
  });
}

export function retrySiteWorkflowRun(token: string, runId: string) {
  return openApiRequest<SiteWorkflowRun, "/api/v1/site-admin/automation/runs/{runId}/retry", "post">("/api/v1/site-admin/automation/runs/{runId}/retry", "post", {
    token,
    pathParams: { runId },
  });
}

export function cancelSiteWorkflowRun(token: string, runId: string) {
  return openApiRequest<SiteWorkflowRun, "/api/v1/site-admin/automation/runs/{runId}/cancel", "post">("/api/v1/site-admin/automation/runs/{runId}/cancel", "post", {
    token,
    pathParams: { runId },
  });
}

export function listSiteApprovalDefinitions(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; entityType?: string; status?: ApprovalStatus } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteApprovalDefinition>, "/api/v1/site-admin/automation/approval-definitions", "get">("/api/v1/site-admin/automation/approval-definitions", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/automation/approval-definitions", "get">,
  });
}

export function listSiteApprovals(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; entityType?: string; status?: ApprovalStatus } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteApproval>, "/api/v1/site-admin/automation/approvals", "get">("/api/v1/site-admin/automation/approvals", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/automation/approvals", "get">,
  });
}

export function listSiteWorkflowRunLogs(
  token: string,
  query: { page?: number; limit?: number; search?: string; tenantId?: string; workflowId?: string; runId?: string; status?: WorkflowRunStatus; from?: string; to?: string } = {},
) {
  return openApiRequest<MetaPaginatedResponse<SiteWorkflowRunLog>, "/api/v1/site-admin/automation/run-logs", "get">("/api/v1/site-admin/automation/run-logs", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: siteQuery(query, 30) as OpenApiQuery<"/api/v1/site-admin/automation/run-logs", "get">,
  });
}
