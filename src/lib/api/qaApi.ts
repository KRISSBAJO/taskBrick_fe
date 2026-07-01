import { boundedLimit, openApiRequest, type OpenApiJsonBody, type OpenApiQuery } from "./request";

export type QaTestCaseQuery = OpenApiQuery<"/api/v1/qa/test-cases", "get">;
export type QaTestRunQuery = OpenApiQuery<"/api/v1/qa/test-runs", "get">;
export type QaTestPlanQuery = OpenApiQuery<"/api/v1/qa/test-plans", "get">;

export type UpdateQaProjectSettingsPayload = OpenApiJsonBody<"/api/v1/qa/projects/{projectId}/settings", "patch">;
export type CreateQaTestCasePayload = OpenApiJsonBody<"/api/v1/qa/test-cases", "post">;
export type UpdateQaTestCasePayload = OpenApiJsonBody<"/api/v1/qa/test-cases/{testCaseId}", "patch">;
export type LinkQaTestCaseTaskPayload = OpenApiJsonBody<"/api/v1/qa/test-cases/{testCaseId}/task-links", "post">;
export type CreateQaTestPlanPayload = OpenApiJsonBody<"/api/v1/qa/test-plans", "post">;
export type UpdateQaTestPlanPayload = OpenApiJsonBody<"/api/v1/qa/test-plans/{planId}", "patch">;
export type AddQaTestPlanItemPayload = OpenApiJsonBody<"/api/v1/qa/test-plans/{planId}/items", "post">;
export type CreateQaTestRunPayload = OpenApiJsonBody<"/api/v1/qa/test-runs", "post">;
export type CreateQaExecutionPayload = OpenApiJsonBody<"/api/v1/qa/test-runs/{runId}/executions", "post">;
export type UpdateQaExecutionPayload = OpenApiJsonBody<
  "/api/v1/qa/test-runs/{runId}/executions/{executionId}",
  "patch"
>;
export type CreateQaEvidencePayload = OpenApiJsonBody<
  "/api/v1/qa/test-runs/{runId}/executions/{executionId}/evidence",
  "post"
>;
export type CreateQaDefectPayload = OpenApiJsonBody<
  "/api/v1/qa/test-runs/{runId}/executions/{executionId}/create-defect",
  "post"
>;
export type ImportJunitResultsPayload = OpenApiJsonBody<"/api/v1/qa/imports/junit", "post">;

function pagedQuery<TQuery extends { page?: number; limit?: number }>(query: TQuery = {} as TQuery, fallback = 50) {
  return {
    ...query,
    page: query.page ?? 1,
    limit: boundedLimit(query.limit, fallback),
  };
}

export function getQaStatus(token: string) {
  return openApiRequest("/api/v1/qa/status", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function getQaTaxonomy(token: string) {
  return openApiRequest("/api/v1/qa/taxonomy", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function getQaProjectSummary(token: string, projectId: string) {
  return openApiRequest("/api/v1/qa/projects/{projectId}/summary", "get", {
    token,
    cache: "no-store",
    pathParams: { projectId },
  });
}

export function getQaProjectSettings(token: string, projectId: string) {
  return openApiRequest("/api/v1/qa/projects/{projectId}/settings", "get", {
    token,
    cache: "no-store",
    pathParams: { projectId },
  });
}

export function updateQaProjectSettings(token: string, projectId: string, payload: UpdateQaProjectSettingsPayload) {
  return openApiRequest("/api/v1/qa/projects/{projectId}/settings", "patch", {
    token,
    pathParams: { projectId },
    body: payload,
  });
}

export function getQaTaskSummary(token: string, taskId: string) {
  return openApiRequest("/api/v1/qa/tasks/{taskId}/summary", "get", {
    token,
    cache: "no-store",
    pathParams: { taskId },
  });
}

export function listQaTestCases(token: string, query: QaTestCaseQuery = {}) {
  return openApiRequest("/api/v1/qa/test-cases", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: pagedQuery(query, 50),
  });
}

export function createQaTestCase(token: string, payload: CreateQaTestCasePayload) {
  return openApiRequest("/api/v1/qa/test-cases", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function getQaTestCase(token: string, testCaseId: string) {
  return openApiRequest("/api/v1/qa/test-cases/{testCaseId}", "get", {
    token,
    cache: "no-store",
    pathParams: { testCaseId },
  });
}

export function updateQaTestCase(token: string, testCaseId: string, payload: UpdateQaTestCasePayload) {
  return openApiRequest("/api/v1/qa/test-cases/{testCaseId}", "patch", {
    token,
    pathParams: { testCaseId },
    body: payload,
  });
}

export function archiveQaTestCase(token: string, testCaseId: string) {
  return openApiRequest("/api/v1/qa/test-cases/{testCaseId}", "delete", {
    token,
    pathParams: { testCaseId },
  });
}

export function linkQaTestCaseToTask(token: string, testCaseId: string, payload: LinkQaTestCaseTaskPayload) {
  return openApiRequest("/api/v1/qa/test-cases/{testCaseId}/task-links", "post", {
    token,
    pathParams: { testCaseId },
    body: payload,
  });
}

export function unlinkQaTestCaseFromTask(token: string, testCaseId: string, taskId: string) {
  return openApiRequest("/api/v1/qa/test-cases/{testCaseId}/task-links/{taskId}", "delete", {
    token,
    pathParams: { testCaseId, taskId },
  });
}

export function listQaTestPlans(token: string, query: QaTestPlanQuery = {}) {
  return openApiRequest("/api/v1/qa/test-plans", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: pagedQuery(query, 50),
  });
}

export function createQaTestPlan(token: string, payload: CreateQaTestPlanPayload) {
  return openApiRequest("/api/v1/qa/test-plans", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function getQaTestPlan(token: string, planId: string) {
  return openApiRequest("/api/v1/qa/test-plans/{planId}", "get", {
    token,
    cache: "no-store",
    pathParams: { planId },
  });
}

export function updateQaTestPlan(token: string, planId: string, payload: UpdateQaTestPlanPayload) {
  return openApiRequest("/api/v1/qa/test-plans/{planId}", "patch", {
    token,
    pathParams: { planId },
    body: payload,
  });
}

export function archiveQaTestPlan(token: string, planId: string) {
  return openApiRequest("/api/v1/qa/test-plans/{planId}/archive", "post", {
    token,
    pathParams: { planId },
  });
}

export function addQaTestPlanItem(token: string, planId: string, payload: AddQaTestPlanItemPayload) {
  return openApiRequest("/api/v1/qa/test-plans/{planId}/items", "post", {
    token,
    pathParams: { planId },
    body: payload,
  });
}

export function removeQaTestPlanItem(token: string, planId: string, testCaseId: string) {
  return openApiRequest("/api/v1/qa/test-plans/{planId}/items/{testCaseId}", "delete", {
    token,
    pathParams: { planId, testCaseId },
  });
}

export function listQaTestRuns(token: string, query: QaTestRunQuery = {}) {
  return openApiRequest("/api/v1/qa/test-runs", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: pagedQuery(query, 50),
  });
}

export function createQaTestRun(token: string, payload: CreateQaTestRunPayload) {
  return openApiRequest("/api/v1/qa/test-runs", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function getQaTestRun(token: string, runId: string) {
  return openApiRequest("/api/v1/qa/test-runs/{runId}", "get", {
    token,
    cache: "no-store",
    pathParams: { runId },
  });
}

export function completeQaTestRun(token: string, runId: string) {
  return openApiRequest("/api/v1/qa/test-runs/{runId}/complete", "post", {
    token,
    pathParams: { runId },
  });
}

export function cancelQaTestRun(token: string, runId: string) {
  return openApiRequest("/api/v1/qa/test-runs/{runId}/cancel", "post", {
    token,
    pathParams: { runId },
  });
}

export function createQaExecution(token: string, runId: string, payload: CreateQaExecutionPayload) {
  return openApiRequest("/api/v1/qa/test-runs/{runId}/executions", "post", {
    token,
    pathParams: { runId },
    body: payload,
  });
}

export function updateQaExecution(token: string, runId: string, executionId: string, payload: UpdateQaExecutionPayload) {
  return openApiRequest("/api/v1/qa/test-runs/{runId}/executions/{executionId}", "patch", {
    token,
    pathParams: { runId, executionId },
    body: payload,
  });
}

export function addQaEvidence(token: string, runId: string, executionId: string, payload: CreateQaEvidencePayload) {
  return openApiRequest("/api/v1/qa/test-runs/{runId}/executions/{executionId}/evidence", "post", {
    token,
    pathParams: { runId, executionId },
    body: payload,
  });
}

export function createQaDefectFromExecution(
  token: string,
  runId: string,
  executionId: string,
  payload: CreateQaDefectPayload,
) {
  return openApiRequest("/api/v1/qa/test-runs/{runId}/executions/{executionId}/create-defect", "post", {
    token,
    pathParams: { runId, executionId },
    body: payload,
  });
}

export function importJunitResults(token: string, payload: ImportJunitResultsPayload) {
  return openApiRequest("/api/v1/qa/imports/junit", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}
