import type { AiAgent,AiSettings } from "../api";
import { boundedLimit,openApiRequest,type OpenApiJsonBody,type OpenApiQuery,type OpenApiResponse } from "./request";

type AiSettingsPayload = Partial<Pick<
  AiSettings,
  | "enabled"
  | "defaultProvider"
  | "defaultModel"
  | "allowedProviders"
  | "monthlyTokenLimit"
  | "monthlyCostLimit"
  | "redactSensitiveData"
  | "dataRetentionDays"
>> & { policy?: unknown };
type CreateAiAgentPayload = {
  name: string;
  description?: string;
  type?: string;
  provider?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
  tools?: string[];
  guardrails?: unknown;
  knowledgeScope?: unknown;
  enabled?: boolean;
};
type UpdateAiAgentPayload = Partial<Pick<
  AiAgent,
  | "name"
  | "description"
  | "type"
  | "provider"
  | "model"
  | "systemPrompt"
  | "temperature"
  | "maxOutputTokens"
  | "tools"
  | "guardrails"
  | "knowledgeScope"
  | "enabled"
>>;
export type BoardAiPayload = OpenApiJsonBody<"/api/v1/ai/board-summary", "post">;
export type BoardAiSummaryResponse = NonNullable<OpenApiResponse<"/api/v1/ai/board-summary", "post">>;
export type BoardAiRiskScanResponse = NonNullable<OpenApiResponse<"/api/v1/ai/board-risk-scan", "post">>;
export type BoardAiActionPlanResponse = NonNullable<OpenApiResponse<"/api/v1/ai/board-actions", "post">>;
export type BoardAiApplyActionsPayload = OpenApiJsonBody<"/api/v1/ai/board-actions/apply", "post">;
export type BoardAiApplyResponse = NonNullable<OpenApiResponse<"/api/v1/ai/board-actions/apply", "post">>;
export type BoardAiHistoryResponse = NonNullable<OpenApiResponse<"/api/v1/ai/board-history", "get">>;
export type BoardAiHistoryEntry = BoardAiHistoryResponse["data"][number];

export function getAiSettings(token: string) {
  return openApiRequest("/api/v1/ai/settings", "get", {
    token,
    cache: "no-store",
    pathParams: {},
  });
}

export function updateAiSettings(token: string, payload: AiSettingsPayload) {
  return openApiRequest("/api/v1/ai/settings", "patch", {
    token,
    pathParams: {},
    body: payload as unknown as OpenApiJsonBody<"/api/v1/ai/settings", "patch">,
  });
}

export function listAiAgents(
  token: string,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    provider?: string;
    type?: string;
    enabled?: boolean;
    includeArchived?: boolean;
  } = {},
) {
  return openApiRequest("/api/v1/ai/agents", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 100),
    } as OpenApiQuery<"/api/v1/ai/agents", "get">,
  });
}

export function createAiAgent(token: string, payload: CreateAiAgentPayload) {
  return openApiRequest("/api/v1/ai/agents", "post", {
    token,
    pathParams: {},
    body: payload as unknown as OpenApiJsonBody<"/api/v1/ai/agents", "post">,
  });
}

export function updateAiAgent(token: string, agentId: string, payload: UpdateAiAgentPayload) {
  return openApiRequest("/api/v1/ai/agents/{agentId}", "patch", {
    token,
    pathParams: { agentId },
    body: payload as unknown as OpenApiJsonBody<"/api/v1/ai/agents/{agentId}", "patch">,
  });
}

export function archiveAiAgent(token: string, agentId: string) {
  return openApiRequest("/api/v1/ai/agents/{agentId}/archive", "post", {
    token,
    pathParams: { agentId },
  });
}

export function restoreAiAgent(token: string, agentId: string) {
  return openApiRequest("/api/v1/ai/agents/{agentId}/restore", "post", {
    token,
    pathParams: { agentId },
  });
}

export function deleteAiAgent(token: string, agentId: string) {
  return openApiRequest("/api/v1/ai/agents/{agentId}", "delete", {
    token,
    pathParams: { agentId },
  });
}

export function generateBoardSummary(token: string, payload: BoardAiPayload) {
  return openApiRequest("/api/v1/ai/board-summary", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function scanBoardRisks(token: string, payload: BoardAiPayload) {
  return openApiRequest("/api/v1/ai/board-risk-scan", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function generateBoardActionPlan(token: string, payload: BoardAiPayload) {
  return openApiRequest("/api/v1/ai/board-actions", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function applyBoardActions(token: string, payload: BoardAiApplyActionsPayload) {
  return openApiRequest("/api/v1/ai/board-actions/apply", "post", {
    token,
    pathParams: {},
    body: payload,
  });
}

export function listBoardAiHistory(
  token: string,
  query: {
    boardId?: string;
    limit?: number;
    page?: number;
    projectId?: string;
    search?: string;
    type?: "board_summary" | "board_risk_scan" | "board_action_plan" | "board_actions_apply";
  } = {},
) {
  return openApiRequest("/api/v1/ai/board-history", "get", {
    token,
    cache: "no-store",
    pathParams: {},
    query: {
      ...query,
      page: query.page ?? 1,
      limit: boundedLimit(query.limit, 50),
    } as OpenApiQuery<"/api/v1/ai/board-history", "get">,
  });
}
