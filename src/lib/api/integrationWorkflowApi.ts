import type {
  Integration,
  IntegrationLog,
  IntegrationProvider,
  IntegrationStatus,
  OmoFlowRuntimeEvent,
  OmoFlowRuntimeResult,
  PaginatedResponse,
  Webhook,
  WebhookDelivery,
  Workflow,
  WorkflowNode,
  WorkflowRun,
  WorkflowRunLog,
} from "../api";
import {
  boundedLimit,
  openApiRequest,
  type OpenApiJsonBody,
  type OpenApiQuery,
} from "./request";

type ListIntegrationsQuery = OpenApiQuery<"/api/v1/integrations", "get">;
type CreateIntegrationBody = OpenApiJsonBody<"/api/v1/integrations", "post">;
type UpdateIntegrationBody = OpenApiJsonBody<"/api/v1/integrations/{integrationId}", "patch">;
type RotateIntegrationSecretBody = OpenApiJsonBody<"/api/v1/integrations/{integrationId}/rotate-secret", "post">;
type SyncIntegrationBody = OpenApiJsonBody<"/api/v1/integrations/{integrationId}/sync", "post">;
type ProcessOmoFlowEventBody = OpenApiJsonBody<"/api/v1/integrations/omoflow/events", "post">;
type ListIntegrationLogsQuery = OpenApiQuery<"/api/v1/integrations/{integrationId}/logs", "get">;
type ListWebhooksQuery = OpenApiQuery<"/api/v1/webhooks", "get">;
type CreateWebhookBody = OpenApiJsonBody<"/api/v1/webhooks", "post">;
type UpdateWebhookBody = OpenApiJsonBody<"/api/v1/webhooks/{webhookId}", "patch">;
type RotateWebhookSecretBody = OpenApiJsonBody<"/api/v1/webhooks/{webhookId}/rotate-secret", "post">;
type TriggerWebhookEventBody = OpenApiJsonBody<"/api/v1/webhook-events", "post">;
type ListWebhookDeliveriesQuery = OpenApiQuery<"/api/v1/webhook-deliveries", "get">;
type ListWorkflowsQuery = OpenApiQuery<"/api/v1/workflows", "get">;
type CreateWorkflowBody = OpenApiJsonBody<"/api/v1/workflows", "post">;
type UpdateWorkflowBody = OpenApiJsonBody<"/api/v1/workflows/{workflowId}", "patch">;
type ReplaceWorkflowNodesBody = OpenApiJsonBody<"/api/v1/workflows/{workflowId}/nodes", "put">;
type RunWorkflowBody = OpenApiJsonBody<"/api/v1/workflows/{workflowId}/run", "post">;
type ListWorkflowRunsQuery = OpenApiQuery<"/api/v1/workflow-runs", "get">;
type ListDeadLetterWorkflowRunsQuery = OpenApiQuery<"/api/v1/workflow-runs/dead-letter", "get">;
type WorkflowPayload = {
  name: string;
  description?: string;
  entityType: string;
  triggerType?: string;
  eventType?: string;
  isActive?: boolean;
  config?: unknown;
  nodes?: WorkflowNode[];
};
type UpdateWorkflowPayload = Partial<Pick<Workflow, "name" | "description" | "entityType" | "triggerType" | "eventType" | "isActive">> & {
  config?: unknown;
};
type RunWorkflowPayload = {
  entityType?: string;
  entityId?: string;
  eventType?: string;
  idempotencyKey?: string;
  context?: unknown;
};

export function listIntegrations(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    provider?: IntegrationProvider;
    status?: IntegrationStatus;
    enabled?: boolean;
  } = {},
) {
  const openApiQuery: ListIntegrationsQuery = {
    ...query,
    page: query.page ?? 1,
    limit: boundedLimit(query.limit, 100),
  };

  return openApiRequest<PaginatedResponse<Integration>, "/api/v1/integrations", "get">("/api/v1/integrations", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: openApiQuery,
  });
}

export function createIntegration(
  token: string,
  payload: {
    provider: IntegrationProvider;
    name: string;
    config?: unknown;
    secrets?: Record<string, string>;
    externalAccountId?: string;
    scopes?: string[];
    enabled?: boolean;
  },
) {
  return openApiRequest<Integration, "/api/v1/integrations", "post">("/api/v1/integrations", "post", {
    token,
    pathParams: {},
    body: payload as CreateIntegrationBody,
  });
}

export function updateIntegration(
  token: string,
  integrationId: string,
  payload: Partial<Pick<Integration, "name" | "provider" | "externalAccountId" | "scopes" | "enabled" | "status">> & {
    config?: unknown;
    secrets?: Record<string, string>;
  },
) {
  return openApiRequest<Integration, "/api/v1/integrations/{integrationId}", "patch">("/api/v1/integrations/{integrationId}", "patch", {
    token,
    pathParams: { integrationId },
    body: payload as UpdateIntegrationBody,
  });
}

export function deleteIntegration(token: string, integrationId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/integrations/{integrationId}", "delete">("/api/v1/integrations/{integrationId}", "delete", {
    token,
    pathParams: { integrationId },
  });
}

export function enableIntegration(token: string, integrationId: string) {
  return openApiRequest<Integration, "/api/v1/integrations/{integrationId}/enable", "post">("/api/v1/integrations/{integrationId}/enable", "post", {
    token,
    pathParams: { integrationId },
  });
}

export function disableIntegration(token: string, integrationId: string) {
  return openApiRequest<Integration, "/api/v1/integrations/{integrationId}/disable", "post">("/api/v1/integrations/{integrationId}/disable", "post", {
    token,
    pathParams: { integrationId },
  });
}

export function rotateIntegrationSecret(token: string, integrationId: string, payload: { key: string; value: string }) {
  return openApiRequest<Integration, "/api/v1/integrations/{integrationId}/rotate-secret", "post">("/api/v1/integrations/{integrationId}/rotate-secret", "post", {
    token,
    pathParams: { integrationId },
    body: payload as RotateIntegrationSecretBody,
  });
}

export function syncIntegration(
  token: string,
  integrationId: string,
  payload: { mode?: string; cursor?: string; payload?: unknown } = {},
) {
  return openApiRequest<{ integration: Integration; queued: boolean; message?: string }, "/api/v1/integrations/{integrationId}/sync", "post">("/api/v1/integrations/{integrationId}/sync", "post", {
    token,
    pathParams: { integrationId },
    body: payload as SyncIntegrationBody,
  });
}

export function processOmoFlowEvent(token: string, payload: OmoFlowRuntimeEvent) {
  return openApiRequest<OmoFlowRuntimeResult, "/api/v1/integrations/omoflow/events", "post">("/api/v1/integrations/omoflow/events", "post", {
    token,
    pathParams: {},
    body: payload as ProcessOmoFlowEventBody,
  });
}

export function listIntegrationLogs(token: string, integrationId: string, query: ListIntegrationLogsQuery = {}) {
  return openApiRequest<PaginatedResponse<IntegrationLog>, "/api/v1/integrations/{integrationId}/logs", "get">("/api/v1/integrations/{integrationId}/logs", "get", {
    token,
    cache: "no-store",
    pathParams: { integrationId },
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 30),
    },
  });
}

export function listWebhooks(token: string, query: ListWebhooksQuery = {}) {
  return openApiRequest<PaginatedResponse<Webhook>, "/api/v1/webhooks", "get">("/api/v1/webhooks", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 100),
    },
  });
}

export function createWebhook(token: string, payload: CreateWebhookBody) {
  return openApiRequest<Webhook, "/api/v1/webhooks", "post">("/api/v1/webhooks", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function updateWebhook(token: string, webhookId: string, payload: UpdateWebhookBody) {
  return openApiRequest<Webhook, "/api/v1/webhooks/{webhookId}", "patch">("/api/v1/webhooks/{webhookId}", "patch", {
    token,
    pathParams: { webhookId },
    body: payload,
  });
}

export function deleteWebhook(token: string, webhookId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/webhooks/{webhookId}", "delete">("/api/v1/webhooks/{webhookId}", "delete", {
    token,
    pathParams: { webhookId },
  });
}

export function enableWebhook(token: string, webhookId: string) {
  return openApiRequest<Webhook, "/api/v1/webhooks/{webhookId}/enable", "post">("/api/v1/webhooks/{webhookId}/enable", "post", {
    token,
    pathParams: { webhookId },
  });
}

export function disableWebhook(token: string, webhookId: string) {
  return openApiRequest<Webhook, "/api/v1/webhooks/{webhookId}/disable", "post">("/api/v1/webhooks/{webhookId}/disable", "post", {
    token,
    pathParams: { webhookId },
  });
}

export function rotateWebhookSecret(token: string, webhookId: string, payload: RotateWebhookSecretBody = {}) {
  return openApiRequest<Webhook, "/api/v1/webhooks/{webhookId}/rotate-secret", "post">("/api/v1/webhooks/{webhookId}/rotate-secret", "post", {
    token,
    pathParams: { webhookId },
    body: payload,
  });
}

export function triggerWebhookEvent(
  token: string,
  payload: { eventType: string; payload?: unknown; entityType?: string; entityId?: string },
) {
  return openApiRequest<{ event: unknown; matched: number; deliveries: Array<{ delivery: WebhookDelivery; dispatched: boolean }> }, "/api/v1/webhook-events", "post">("/api/v1/webhook-events", "post", {
    token,
    pathParams: {},
    body: payload as TriggerWebhookEventBody,
  });
}

export function listWebhookDeliveries(token: string, query: ListWebhookDeliveriesQuery = {}) {
  return openApiRequest<PaginatedResponse<WebhookDelivery>, "/api/v1/webhook-deliveries", "get">("/api/v1/webhook-deliveries", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 30),
    },
  });
}

export function retryWebhookDelivery(token: string, deliveryId: string) {
  return openApiRequest<WebhookDelivery, "/api/v1/webhook-deliveries/{deliveryId}/retry", "post">("/api/v1/webhook-deliveries/{deliveryId}/retry", "post", {
    token,
    pathParams: { deliveryId },
  });
}

export function listWorkflows(token: string, query: ListWorkflowsQuery = {}) {
  return openApiRequest<PaginatedResponse<Workflow>, "/api/v1/workflows", "get">("/api/v1/workflows", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 100),
    },
  });
}

export function createWorkflow(token: string, payload: WorkflowPayload) {
  return openApiRequest<Workflow, "/api/v1/workflows", "post">("/api/v1/workflows", "post", {
    token,
    pathParams: {},
    body: payload as CreateWorkflowBody,
  });
}

export function updateWorkflow(token: string, workflowId: string, payload: UpdateWorkflowPayload) {
  return openApiRequest<Workflow, "/api/v1/workflows/{workflowId}", "patch">("/api/v1/workflows/{workflowId}", "patch", {
    token,
    pathParams: { workflowId },
    body: payload as UpdateWorkflowBody,
  });
}

export function archiveWorkflow(token: string, workflowId: string) {
  return openApiRequest<Workflow, "/api/v1/workflows/{workflowId}/archive", "post">("/api/v1/workflows/{workflowId}/archive", "post", {
    token,
    pathParams: { workflowId },
  });
}

export function restoreWorkflow(token: string, workflowId: string) {
  return openApiRequest<Workflow, "/api/v1/workflows/{workflowId}/restore", "post">("/api/v1/workflows/{workflowId}/restore", "post", {
    token,
    pathParams: { workflowId },
  });
}

export function deleteWorkflow(token: string, workflowId: string) {
  return openApiRequest<{ success: boolean }, "/api/v1/workflows/{workflowId}", "delete">("/api/v1/workflows/{workflowId}", "delete", {
    token,
    pathParams: { workflowId },
  });
}

export function replaceWorkflowNodes(token: string, workflowId: string, nodes: WorkflowNode[]) {
  const body = { nodes } as ReplaceWorkflowNodesBody;
  return openApiRequest<Workflow, "/api/v1/workflows/{workflowId}/nodes", "put">("/api/v1/workflows/{workflowId}/nodes", "put", {
    token,
    pathParams: { workflowId },
    body,
  });
}

export function runWorkflow(token: string, workflowId: string, payload: RunWorkflowPayload = {}) {
  return openApiRequest<WorkflowRun, "/api/v1/workflows/{workflowId}/run", "post">("/api/v1/workflows/{workflowId}/run", "post", {
    token,
    pathParams: { workflowId },
    body: payload as RunWorkflowBody,
  });
}

export function listWorkflowRuns(token: string, query: ListWorkflowRunsQuery = {}) {
  return openApiRequest<PaginatedResponse<WorkflowRun>, "/api/v1/workflow-runs", "get">("/api/v1/workflow-runs", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 50),
    },
  });
}

export function listDeadLetterWorkflowRuns(token: string, query: ListDeadLetterWorkflowRunsQuery = {}) {
  return openApiRequest<PaginatedResponse<WorkflowRun>, "/api/v1/workflow-runs/dead-letter", "get">("/api/v1/workflow-runs/dead-letter", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 50),
    },
  });
}

export function listWorkflowRunLogs(token: string, runId: string) {
  return openApiRequest<WorkflowRunLog[], "/api/v1/workflow-runs/{runId}/logs", "get">("/api/v1/workflow-runs/{runId}/logs", "get", {
    token,
    cache: "no-store",
    pathParams: { runId },
  });
}

export function retryWorkflowRun(token: string, runId: string) {
  return openApiRequest<WorkflowRun, "/api/v1/workflow-runs/{runId}/retry", "post">("/api/v1/workflow-runs/{runId}/retry", "post", {
    token,
    pathParams: { runId },
  });
}

export function requeueWorkflowRun(token: string, runId: string) {
  return openApiRequest<WorkflowRun, "/api/v1/workflow-runs/{runId}/requeue", "post">("/api/v1/workflow-runs/{runId}/requeue", "post", {
    token,
    pathParams: { runId },
  });
}

export function cancelWorkflowRun(token: string, runId: string) {
  return openApiRequest<WorkflowRun, "/api/v1/workflow-runs/{runId}/cancel", "post">("/api/v1/workflow-runs/{runId}/cancel", "post", {
    token,
    pathParams: { runId },
  });
}
