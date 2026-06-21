import {
boundedLimit,
openApiRequest,
type OpenApiJsonBody,
type OpenApiQuery,
} from "./request";

type ListProjectsQuery = OpenApiQuery<"/api/v1/projects", "get">;
type CreateProjectPayload = OpenApiJsonBody<"/api/v1/projects", "post">;
type UpdateProjectPayload = OpenApiJsonBody<"/api/v1/projects/{projectId}", "patch">;
type AddProjectMemberPayload = OpenApiJsonBody<"/api/v1/projects/{projectId}/members", "post">;
type CreateProjectMilestonePayload = OpenApiJsonBody<"/api/v1/projects/{projectId}/milestones", "post">;
type UpdateProjectMilestonePayload = OpenApiJsonBody<"/api/v1/projects/{projectId}/milestones/{milestoneId}", "patch">;
type CreateProjectRiskPayload = OpenApiJsonBody<"/api/v1/projects/{projectId}/risks", "post">;
type UpdateProjectRiskPayload = OpenApiJsonBody<"/api/v1/projects/{projectId}/risks/{riskId}", "patch">;
type CreateProjectBudgetPayload = OpenApiJsonBody<"/api/v1/projects/{projectId}/budgets", "post">;
type UpdateProjectBudgetPayload = OpenApiJsonBody<"/api/v1/projects/{projectId}/budgets/{budgetId}", "patch">;
type CreateProjectStakeholderPayload = OpenApiJsonBody<"/api/v1/projects/{projectId}/stakeholders", "post">;
type UpdateProjectStakeholderPayload = OpenApiJsonBody<"/api/v1/projects/{projectId}/stakeholders/{stakeholderId}", "patch">;
type CreateProjectDependencyPayload = OpenApiJsonBody<"/api/v1/projects/{projectId}/dependencies", "post">;
type UpdateProjectDependencyPayload = OpenApiJsonBody<"/api/v1/projects/{projectId}/dependencies/{dependencyId}", "patch">;
type CreateProjectDecisionPayload = OpenApiJsonBody<"/api/v1/projects/{projectId}/decisions", "post">;
type UpdateProjectDecisionPayload = OpenApiJsonBody<"/api/v1/projects/{projectId}/decisions/{decisionId}", "patch">;
type CreateProjectChangeRequestPayload = OpenApiJsonBody<"/api/v1/projects/{projectId}/change-requests", "post">;
type UpdateProjectChangeRequestPayload = OpenApiJsonBody<"/api/v1/projects/{projectId}/change-requests/{changeRequestId}", "patch">;
export function listProjects(
  token: string,
  query: ListProjectsQuery = {},
) {
  return openApiRequest("/api/v1/projects", "get", {
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 100),
    },
    token,
    cache: "no-store",
  });
}

export function getProject(token: string, projectId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}",
    "get",
    {
      pathParams: { projectId },
      token,
      cache: "no-store",
    },
  );
}

export function getProjectPermissions(token: string, projectId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/permissions",
    "get",
    {
      pathParams: { projectId },
      token,
      cache: "no-store",
    },
  );
}

export function updateProject(
  token: string,
  projectId: string,
  payload: UpdateProjectPayload,
) {
  return openApiRequest(
    "/api/v1/projects/{projectId}",
    "patch",
    {
      pathParams: { projectId },
      token,
      body: payload,
    },
  );
}

export function deleteProject(token: string, projectId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}",
    "delete",
    {
      pathParams: { projectId },
      token,
    },
  );
}

export function listProjectMembers(token: string, projectId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/members",
    "get",
    {
      pathParams: { projectId },
      token,
      cache: "no-store",
    },
  );
}

export function upsertProjectMember(token: string, projectId: string, payload: AddProjectMemberPayload) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/members",
    "post",
    {
      pathParams: { projectId },
      token,
      body: payload,
    },
  );
}

export function removeProjectMember(token: string, projectId: string, userId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/members/{userId}",
    "delete",
    {
      pathParams: { projectId, userId },
      token,
    },
  );
}

export function listProjectMilestones(token: string, projectId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/milestones",
    "get",
    {
      pathParams: { projectId },
      token,
      cache: "no-store",
    },
  );
}

export function createProjectMilestone(
  token: string,
  projectId: string,
  payload: CreateProjectMilestonePayload,
) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/milestones",
    "post",
    {
      pathParams: { projectId },
      token,
      body: payload,
    },
  );
}

export function updateProjectMilestone(
  token: string,
  projectId: string,
  milestoneId: string,
  payload: UpdateProjectMilestonePayload,
) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/milestones/{milestoneId}",
    "patch",
    {
      pathParams: { projectId, milestoneId },
      token,
      body: payload,
    },
  );
}

export function deleteProjectMilestone(token: string, projectId: string, milestoneId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/milestones/{milestoneId}",
    "delete",
    {
      pathParams: { projectId, milestoneId },
      token,
    },
  );
}

export function listProjectRisks(token: string, projectId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/risks",
    "get",
    {
      pathParams: { projectId },
      token,
      cache: "no-store",
    },
  );
}

export function createProjectRisk(
  token: string,
  projectId: string,
  payload: CreateProjectRiskPayload,
) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/risks",
    "post",
    {
      pathParams: { projectId },
      token,
      body: payload,
    },
  );
}

export function updateProjectRisk(
  token: string,
  projectId: string,
  riskId: string,
  payload: UpdateProjectRiskPayload,
) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/risks/{riskId}",
    "patch",
    {
      pathParams: { projectId, riskId },
      token,
      body: payload,
    },
  );
}

export function deleteProjectRisk(token: string, projectId: string, riskId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/risks/{riskId}",
    "delete",
    {
      pathParams: { projectId, riskId },
      token,
    },
  );
}

export function listProjectBudgets(token: string, projectId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/budgets",
    "get",
    {
      pathParams: { projectId },
      token,
      cache: "no-store",
    },
  );
}

export function createProjectBudget(
  token: string,
  projectId: string,
  payload: CreateProjectBudgetPayload,
) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/budgets",
    "post",
    {
      pathParams: { projectId },
      token,
      body: payload,
    },
  );
}

export function updateProjectBudget(
  token: string,
  projectId: string,
  budgetId: string,
  payload: UpdateProjectBudgetPayload,
) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/budgets/{budgetId}",
    "patch",
    {
      pathParams: { projectId, budgetId },
      token,
      body: payload,
    },
  );
}

export function deleteProjectBudget(token: string, projectId: string, budgetId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/budgets/{budgetId}",
    "delete",
    {
      pathParams: { projectId, budgetId },
      token,
    },
  );
}

export function listProjectStakeholders(token: string, projectId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/stakeholders",
    "get",
    {
      pathParams: { projectId },
      token,
      cache: "no-store",
    },
  );
}

export function createProjectStakeholder(
  token: string,
  projectId: string,
  payload: CreateProjectStakeholderPayload,
) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/stakeholders",
    "post",
    {
      pathParams: { projectId },
      token,
      body: payload,
    },
  );
}

export function updateProjectStakeholder(
  token: string,
  projectId: string,
  stakeholderId: string,
  payload: UpdateProjectStakeholderPayload,
) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/stakeholders/{stakeholderId}",
    "patch",
    {
      pathParams: { projectId, stakeholderId },
      token,
      body: payload,
    },
  );
}

export function deleteProjectStakeholder(token: string, projectId: string, stakeholderId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/stakeholders/{stakeholderId}",
    "delete",
    {
      pathParams: { projectId, stakeholderId },
      token,
    },
  );
}

export function listProjectDependencies(token: string, projectId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/dependencies",
    "get",
    {
      pathParams: { projectId },
      token,
      cache: "no-store",
    },
  );
}

export function createProjectDependency(
  token: string,
  projectId: string,
  payload: CreateProjectDependencyPayload,
) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/dependencies",
    "post",
    {
      pathParams: { projectId },
      token,
      body: payload,
    },
  );
}

export function updateProjectDependency(
  token: string,
  projectId: string,
  dependencyId: string,
  payload: UpdateProjectDependencyPayload,
) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/dependencies/{dependencyId}",
    "patch",
    {
      pathParams: { projectId, dependencyId },
      token,
      body: payload,
    },
  );
}

export function deleteProjectDependency(token: string, projectId: string, dependencyId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/dependencies/{dependencyId}",
    "delete",
    {
      pathParams: { projectId, dependencyId },
      token,
    },
  );
}

export function listProjectDecisions(token: string, projectId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/decisions",
    "get",
    {
      pathParams: { projectId },
      token,
      cache: "no-store",
    },
  );
}

export function createProjectDecision(
  token: string,
  projectId: string,
  payload: CreateProjectDecisionPayload,
) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/decisions",
    "post",
    {
      pathParams: { projectId },
      token,
      body: payload,
    },
  );
}

export function updateProjectDecision(
  token: string,
  projectId: string,
  decisionId: string,
  payload: UpdateProjectDecisionPayload,
) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/decisions/{decisionId}",
    "patch",
    {
      pathParams: { projectId, decisionId },
      token,
      body: payload,
    },
  );
}

export function deleteProjectDecision(token: string, projectId: string, decisionId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/decisions/{decisionId}",
    "delete",
    {
      pathParams: { projectId, decisionId },
      token,
    },
  );
}

export function listProjectChangeRequests(token: string, projectId: string) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/change-requests",
    "get",
    {
      pathParams: { projectId },
      token,
      cache: "no-store",
    },
  );
}

export function createProjectChangeRequest(
  token: string,
  projectId: string,
  payload: CreateProjectChangeRequestPayload,
) {
  return openApiRequest(
    "/api/v1/projects/{projectId}/change-requests",
    "post",
    {
      pathParams: { projectId },
      token,
      body: payload,
    },
  );
}

export function updateProjectChangeRequest(
  token: string,
  projectId: string,
  changeRequestId: string,
  payload: UpdateProjectChangeRequestPayload,
) {
  return openApiRequest("/api/v1/projects/{projectId}/change-requests/{changeRequestId}", "patch", {
    pathParams: { projectId, changeRequestId },
    token,
    body: payload,
  });
}

export function deleteProjectChangeRequest(token: string, projectId: string, changeRequestId: string) {
  return openApiRequest("/api/v1/projects/{projectId}/change-requests/{changeRequestId}", "delete", {
    pathParams: { projectId, changeRequestId },
    token,
  });
}

export function createProject(
  token: string,
  payload: CreateProjectPayload,
) {
  return openApiRequest("/api/v1/projects", "post", {
    pathParams: {},
    token,
    body: payload,
  });
}
